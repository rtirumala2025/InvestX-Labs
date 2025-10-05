"""
LLaMA 4 Scout API Endpoints
Handles all frontend requests to the LLaMA 4 Scout AI service
"""
import logging
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any

from ai_services.llama_scout.service import llama_scout_service
from utils.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()

class ChatRequest(BaseModel):
    """Request model for chat endpoint"""
    message: str = Field(..., min_length=1, max_length=2000, description="User message")
    portfolio_data: Optional[Dict[str, Any]] = Field(
        None, 
        description="User portfolio data for context"
    )
    conversation_history: Optional[List[Dict[str, Any]]] = Field(
        None,
        description="Previous conversation messages for context"
    )

class ChatResponse(BaseModel):
    """Response model for chat endpoint"""
    success: bool
    response: str
    model: Optional[str] = None
    usage: Optional[Dict[str, int]] = None
    error: Optional[str] = None

@router.post("/chat", response_model=ChatResponse, status_code=status.HTTP_200_OK)
async def chat_with_llama(
    request: ChatRequest,
    current_user: str = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Chat with LLaMA 4 Scout AI
    
    This endpoint sends a user message to the LLaMA 4 Scout model
    and returns the AI's response.
    """
    try:
        logger.info(f"Processing chat request from user {current_user}")
        
        # Get response from LLaMA 4 Scout
        response = await llama_scout_service.generate_response(
            user_message=request.message,
            portfolio_data=request.portfolio_data,
            conversation_history=request.conversation_history
        )
        
        logger.info(f"Successfully generated response for user {current_user}")
        return response
        
    except Exception as e:
        logger.error(f"Error in chat_with_llama for user {current_user}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error processing your request. Please try again later."
        )

@router.get("/health", status_code=status.HTTP_200_OK)
async def health_check() -> Dict[str, str]:
    """Health check endpoint for the LLaMA 4 Scout service"""
    return {"status": "ok", "service": "llama_scout"}

# Add error handler for 404
def add_handlers(app):
    @app.exception_handler(404)
    async def not_found_exception_handler(request, exc):
        return JSONResponse(
            status_code=404,
            content={"message": "The requested resource was not found"},
        )

# Include the router in the main FastAPI app
def include_routers(app):
    app.include_router(router, prefix="/api/llama", tags=["LLaMA 4 Scout"])
    add_handlers(app)
