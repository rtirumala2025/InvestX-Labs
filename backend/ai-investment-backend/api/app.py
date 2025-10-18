"""
Main FastAPI application for the AI Investment Backend
"""
import logging
from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import uvicorn
from datetime import datetime

from api.chat_endpoints import chat_router
from api.data_endpoints import data_router
from api.user_endpoints import user_router
from api.llama_scout_endpoints import include_routers as include_llama_routers
from config.settings import settings
from utils.logging_config import setup_logging
from utils.error_handlers import setup_error_handlers
from database.firestore_client import firestore_client
from database.cache_manager import cache_manager
from data_pipeline.scheduler import data_pipeline_scheduler

# Setup logging
setup_logging()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    logger.info("Starting AI Investment Backend...")
    
    try:
        # Initialize database connections
        await firestore_client._initialize_firebase()
        logger.info("Database connections initialized")
        
        # Start data pipeline scheduler
        data_pipeline_scheduler.start_scheduler()
        logger.info("Data pipeline scheduler started")
        
        logger.info("AI Investment Backend started successfully")
        
    except Exception as e:
        logger.error(f"Error during startup: {e}")
        raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down AI Investment Backend...")
    
    try:
        # Stop data pipeline scheduler
        data_pipeline_scheduler.stop_scheduler()
        logger.info("Data pipeline scheduler stopped")
        
        logger.info("AI Investment Backend shut down successfully")
        
    except Exception as e:
        logger.error(f"Error during shutdown: {e}")


# Create FastAPI app
app = FastAPI(
    title="AI Investment Backend",
    description="AI-powered backend system for teen investment education",
    version="1.0.0",
    docs_url="/docs" if settings.api_debug else None,
    redoc_url="/redoc" if settings.api_debug else None,
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add trusted host middleware
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"]  # Configure appropriately for production
)

# Setup error handlers
setup_error_handlers(app)

# Include routers
app.include_router(chat_router, prefix="/api/chat", tags=["Chat"])
app.include_router(data_router, prefix="/api/data", tags=["Data"])
app.include_router(user_router, prefix="/api/users", tags=["Users"])

# Include LLaMA 4 Scout endpoints
include_llama_routers(app)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "AI Investment Backend API",
        "version": "1.0.0",
        "status": "running",
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Check database connection
        db_status = "healthy"
        try:
            # Simple database check
            firestore_client.db.collection("health_check").document("test").set({"test": True})
        except Exception as e:
            db_status = f"unhealthy: {e}"
        
        # Check cache connection
        cache_status = "healthy"
        try:
            cache_manager.set("health_check", "test", ttl=60)
            cache_manager.get("health_check")
        except Exception as e:
            cache_status = f"unhealthy: {e}"
        
        # Check scheduler status
        scheduler_status = data_pipeline_scheduler.get_scheduler_status()
        
        overall_status = "healthy" if db_status == "healthy" and cache_status == "healthy" else "unhealthy"
        
        return {
            "status": overall_status,
            "timestamp": datetime.utcnow().isoformat(),
            "services": {
                "database": db_status,
                "cache": cache_status,
                "scheduler": scheduler_status.get("status", "unknown")
            }
        }
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
        )


@app.get("/api/status")
async def api_status():
    """API status endpoint"""
    try:
        return {
            "api_version": "1.0.0",
            "status": "running",
            "timestamp": datetime.utcnow().isoformat(),
            "features": {
                "chatbot": "enabled",
                "data_pipeline": "enabled",
                "recommendations": "enabled",
                "safety_filters": "enabled"
            },
            "configuration": {
                "debug_mode": settings.api_debug,
                "log_level": settings.log_level,
                "cache_enabled": True,
                "scheduler_enabled": True
            }
        }
        
    except Exception as e:
        logger.error(f"API status check failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/metrics")
async def get_metrics():
    """Get system metrics"""
    try:
        # Get cache stats
        cache_stats = cache_manager.get_stats()
        
        # Get scheduler stats
        scheduler_stats = data_pipeline_scheduler.get_scheduler_status()
        
        # Get conversation stats
        from chatbot.conversation_manager import conversation_manager
        conversation_stats = await conversation_manager.get_conversation_stats()
        
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "cache": cache_stats,
            "scheduler": scheduler_stats,
            "conversations": conversation_stats,
            "system": {
                "uptime": "N/A",  # Would need to track startup time
                "memory_usage": "N/A",  # Would need psutil or similar
                "cpu_usage": "N/A"  # Would need psutil or similar
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting metrics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/admin/pipeline/run")
async def run_pipeline_manually(pipeline_name: str):
    """Manually run a data pipeline"""
    try:
        if not settings.api_debug:
            raise HTTPException(status_code=403, detail="Admin endpoints disabled in production")
        
        result = data_pipeline_scheduler.run_pipeline_manually(pipeline_name)
        
        if result["status"] == "success":
            return {
                "success": True,
                "message": result["message"],
                "pipeline": pipeline_name,
                "timestamp": datetime.utcnow().isoformat()
            }
        else:
            raise HTTPException(status_code=500, detail=result["message"])
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error running pipeline {pipeline_name}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/admin/pipeline/status")
async def get_pipeline_status():
    """Get data pipeline status"""
    try:
        if not settings.api_debug:
            raise HTTPException(status_code=403, detail="Admin endpoints disabled in production")
        
        status = data_pipeline_scheduler.get_scheduler_status()
        return status
        
    except Exception as e:
        logger.error(f"Error getting pipeline status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Middleware for request logging
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all requests"""
    start_time = datetime.utcnow()
    
    # Log request
    logger.info(f"Request: {request.method} {request.url}")
    
    # Process request
    response = await call_next(request)
    
    # Log response
    process_time = (datetime.utcnow() - start_time).total_seconds()
    logger.info(f"Response: {response.status_code} - {process_time:.3f}s")
    
    return response


# Middleware for rate limiting (simple implementation)
from collections import defaultdict
from datetime import datetime, timedelta

request_counts = defaultdict(list)

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    """Simple rate limiting middleware"""
    try:
        # Get client IP
        client_ip = request.client.host
        
        # Clean old requests
        now = datetime.utcnow()
        request_counts[client_ip] = [
            req_time for req_time in request_counts[client_ip]
            if now - req_time < timedelta(minutes=1)
        ]
        
        # Check rate limit
        if len(request_counts[client_ip]) >= settings.rate_limit_per_minute:
            return JSONResponse(
                status_code=429,
                content={
                    "error": "Rate limit exceeded",
                    "message": f"Maximum {settings.rate_limit_per_minute} requests per minute",
                    "retry_after": 60
                }
            )
        
        # Add current request
        request_counts[client_ip].append(now)
        
        # Process request
        response = await call_next(request)
        
        return response
        
    except Exception as e:
        logger.error(f"Error in rate limiting middleware: {e}")
        return await call_next(request)


if __name__ == "__main__":
    uvicorn.run(
        "app:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.api_debug,
        log_level=settings.log_level.lower()
    )
