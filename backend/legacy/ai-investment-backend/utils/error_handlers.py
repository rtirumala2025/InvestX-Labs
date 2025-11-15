"""
Error handlers for the AI Investment Backend
"""
import logging
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from pydantic import ValidationError
from typing import Union
from datetime import datetime

logger = logging.getLogger(__name__)


def setup_error_handlers(app: FastAPI):
    """Setup error handlers for the FastAPI application"""
    
    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        """Handle HTTP exceptions"""
        logger.warning(f"HTTP exception: {exc.status_code} - {exc.detail}")
        
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": True,
                "status_code": exc.status_code,
                "message": exc.detail,
                "timestamp": datetime.utcnow().isoformat(),
                "path": str(request.url)
            }
        )
    
    @app.exception_handler(StarletteHTTPException)
    async def starlette_http_exception_handler(request: Request, exc: StarletteHTTPException):
        """Handle Starlette HTTP exceptions"""
        logger.warning(f"Starlette HTTP exception: {exc.status_code} - {exc.detail}")
        
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": True,
                "status_code": exc.status_code,
                "message": exc.detail,
                "timestamp": datetime.utcnow().isoformat(),
                "path": str(request.url)
            }
        )
    
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        """Handle request validation errors"""
        logger.warning(f"Validation error: {exc.errors()}")
        
        return JSONResponse(
            status_code=422,
            content={
                "error": True,
                "status_code": 422,
                "message": "Validation error",
                "details": exc.errors(),
                "timestamp": datetime.utcnow().isoformat(),
                "path": str(request.url)
            }
        )
    
    @app.exception_handler(ValidationError)
    async def pydantic_validation_exception_handler(request: Request, exc: ValidationError):
        """Handle Pydantic validation errors"""
        logger.warning(f"Pydantic validation error: {exc.errors()}")
        
        return JSONResponse(
            status_code=422,
            content={
                "error": True,
                "status_code": 422,
                "message": "Data validation error",
                "details": exc.errors(),
                "timestamp": datetime.utcnow().isoformat(),
                "path": str(request.url)
            }
        )
    
    @app.exception_handler(ValueError)
    async def value_error_handler(request: Request, exc: ValueError):
        """Handle ValueError exceptions"""
        logger.error(f"Value error: {str(exc)}")
        
        return JSONResponse(
            status_code=400,
            content={
                "error": True,
                "status_code": 400,
                "message": "Invalid value provided",
                "details": str(exc),
                "timestamp": datetime.utcnow().isoformat(),
                "path": str(request.url)
            }
        )
    
    @app.exception_handler(KeyError)
    async def key_error_handler(request: Request, exc: KeyError):
        """Handle KeyError exceptions"""
        logger.error(f"Key error: {str(exc)}")
        
        return JSONResponse(
            status_code=400,
            content={
                "error": True,
                "status_code": 400,
                "message": "Missing required field",
                "details": f"Key '{str(exc)}' not found",
                "timestamp": datetime.utcnow().isoformat(),
                "path": str(request.url)
            }
        )
    
    @app.exception_handler(AttributeError)
    async def attribute_error_handler(request: Request, exc: AttributeError):
        """Handle AttributeError exceptions"""
        logger.error(f"Attribute error: {str(exc)}")
        
        return JSONResponse(
            status_code=500,
            content={
                "error": True,
                "status_code": 500,
                "message": "Internal server error",
                "details": "An attribute error occurred",
                "timestamp": datetime.utcnow().isoformat(),
                "path": str(request.url)
            }
        )
    
    @app.exception_handler(FileNotFoundError)
    async def file_not_found_error_handler(request: Request, exc: FileNotFoundError):
        """Handle FileNotFoundError exceptions"""
        logger.error(f"File not found error: {str(exc)}")
        
        return JSONResponse(
            status_code=404,
            content={
                "error": True,
                "status_code": 404,
                "message": "Resource not found",
                "details": str(exc),
                "timestamp": datetime.utcnow().isoformat(),
                "path": str(request.url)
            }
        )
    
    @app.exception_handler(PermissionError)
    async def permission_error_handler(request: Request, exc: PermissionError):
        """Handle PermissionError exceptions"""
        logger.warning(f"Permission error: {str(exc)}")
        
        return JSONResponse(
            status_code=403,
            content={
                "error": True,
                "status_code": 403,
                "message": "Permission denied",
                "details": str(exc),
                "timestamp": datetime.utcnow().isoformat(),
                "path": str(request.url)
            }
        )
    
    @app.exception_handler(TimeoutError)
    async def timeout_error_handler(request: Request, exc: TimeoutError):
        """Handle TimeoutError exceptions"""
        logger.error(f"Timeout error: {str(exc)}")
        
        return JSONResponse(
            status_code=408,
            content={
                "error": True,
                "status_code": 408,
                "message": "Request timeout",
                "details": str(exc),
                "timestamp": datetime.utcnow().isoformat(),
                "path": str(request.url)
            }
        )
    
    @app.exception_handler(ConnectionError)
    async def connection_error_handler(request: Request, exc: ConnectionError):
        """Handle ConnectionError exceptions"""
        logger.error(f"Connection error: {str(exc)}")
        
        return JSONResponse(
            status_code=503,
            content={
                "error": True,
                "status_code": 503,
                "message": "Service unavailable",
                "details": "Connection error occurred",
                "timestamp": datetime.utcnow().isoformat(),
                "path": str(request.url)
            }
        )
    
    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        """Handle general exceptions"""
        logger.error(f"Unhandled exception: {type(exc).__name__} - {str(exc)}", exc_info=True)
        
        return JSONResponse(
            status_code=500,
            content={
                "error": True,
                "status_code": 500,
                "message": "Internal server error",
                "details": "An unexpected error occurred",
                "timestamp": datetime.utcnow().isoformat(),
                "path": str(request.url)
            }
        )


class APIError(Exception):
    """Custom API error class"""
    
    def __init__(self, message: str, status_code: int = 500, details: dict = None):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class ValidationError(APIError):
    """Custom validation error class"""
    
    def __init__(self, message: str, details: dict = None):
        super().__init__(message, 400, details)


class AuthenticationError(APIError):
    """Custom authentication error class"""
    
    def __init__(self, message: str = "Authentication failed", details: dict = None):
        super().__init__(message, 401, details)


class AuthorizationError(APIError):
    """Custom authorization error class"""
    
    def __init__(self, message: str = "Access denied", details: dict = None):
        super().__init__(message, 403, details)


class NotFoundError(APIError):
    """Custom not found error class"""
    
    def __init__(self, message: str = "Resource not found", details: dict = None):
        super().__init__(message, 404, details)


class ConflictError(APIError):
    """Custom conflict error class"""
    
    def __init__(self, message: str = "Resource conflict", details: dict = None):
        super().__init__(message, 409, details)


class RateLimitError(APIError):
    """Custom rate limit error class"""
    
    def __init__(self, message: str = "Rate limit exceeded", details: dict = None):
        super().__init__(message, 429, details)


class ServiceUnavailableError(APIError):
    """Custom service unavailable error class"""
    
    def __init__(self, message: str = "Service unavailable", details: dict = None):
        super().__init__(message, 503, details)


def handle_api_error(error: APIError) -> JSONResponse:
    """Handle custom API errors"""
    logger.warning(f"API error: {error.status_code} - {error.message}")
    
    return JSONResponse(
        status_code=error.status_code,
        content={
            "error": True,
            "status_code": error.status_code,
            "message": error.message,
            "details": error.details,
            "timestamp": datetime.utcnow().isoformat()
        }
    )


def handle_database_error(error: Exception) -> JSONResponse:
    """Handle database errors"""
    logger.error(f"Database error: {str(error)}")
    
    return JSONResponse(
        status_code=500,
        content={
            "error": True,
            "status_code": 500,
            "message": "Database error",
            "details": "A database error occurred",
            "timestamp": datetime.utcnow().isoformat()
        }
    )


def handle_ai_error(error: Exception) -> JSONResponse:
    """Handle AI service errors"""
    logger.error(f"AI service error: {str(error)}")
    
    return JSONResponse(
        status_code=500,
        content={
            "error": True,
            "status_code": 500,
            "message": "AI service error",
            "details": "An AI service error occurred",
            "timestamp": datetime.utcnow().isoformat()
        }
    )


def handle_external_api_error(error: Exception) -> JSONResponse:
    """Handle external API errors"""
    logger.error(f"External API error: {str(error)}")
    
    return JSONResponse(
        status_code=502,
        content={
            "error": True,
            "status_code": 502,
            "message": "External service error",
            "details": "An external service error occurred",
            "timestamp": datetime.utcnow().isoformat()
        }
    )


def handle_safety_error(error: Exception) -> JSONResponse:
    """Handle safety filter errors"""
    logger.warning(f"Safety filter error: {str(error)}")
    
    return JSONResponse(
        status_code=400,
        content={
            "error": True,
            "status_code": 400,
            "message": "Safety check failed",
            "details": "The request failed safety checks",
            "timestamp": datetime.utcnow().isoformat()
        }
    )


def log_error_with_context(error: Exception, context: dict = None):
    """Log error with additional context"""
    logger.error(f"Error: {type(error).__name__} - {str(error)}")
    if context:
        logger.error(f"Context: {context}")
    logger.error("Stack trace:", exc_info=True)


def create_error_response(message: str, status_code: int = 500, details: dict = None) -> JSONResponse:
    """Create a standardized error response"""
    return JSONResponse(
        status_code=status_code,
        content={
            "error": True,
            "status_code": status_code,
            "message": message,
            "details": details or {},
            "timestamp": datetime.utcnow().isoformat()
        }
    )
