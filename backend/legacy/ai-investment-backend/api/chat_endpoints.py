"""
Chat API endpoints for the AI Investment Backend
"""
import logging
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime

from chatbot.chat_handler import chat_handler
from chatbot.safety_filters import safety_filters
from utils.validation import validate_user_id, validate_message_content

logger = logging.getLogger(__name__)

# Create router
chat_router = APIRouter()


# Pydantic models
class ChatMessage(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000, description="User message")
    session_id: Optional[str] = Field(None, description="Session ID for conversation continuity")
    user_id: str = Field(..., min_length=1, description="User ID")


class ChatResponse(BaseModel):
    success: bool
    response: str
    session_id: str
    conversation_id: str
    metadata: Dict[str, Any]
    recommendations: List[Dict[str, Any]] = []


class ConversationStart(BaseModel):
    user_id: str = Field(..., min_length=1, description="User ID")
    session_id: Optional[str] = Field(None, description="Session ID")


class ConversationEnd(BaseModel):
    user_id: str = Field(..., min_length=1, description="User ID")
    session_id: str = Field(..., min_length=1, description="Session ID")


class FeedbackData(BaseModel):
    rating: int = Field(..., ge=1, le=5, description="Rating from 1 to 5")
    feedback_type: str = Field(..., description="Type of feedback")
    comments: Optional[str] = Field(None, max_length=500, description="Additional comments")
    helpful: Optional[bool] = Field(None, description="Was the response helpful?")


class FeedbackRequest(BaseModel):
    conversation_id: str = Field(..., min_length=1, description="Conversation ID")
    feedback: FeedbackData


# Dependency for user validation
async def get_current_user(user_id: str) -> str:
    """Validate and return user ID"""
    if not validate_user_id(user_id):
        raise HTTPException(status_code=400, detail="Invalid user ID")
    return user_id


@chat_router.post("/message", response_model=ChatResponse)
async def send_message(
    chat_message: ChatMessage,
    current_user: str = Depends(get_current_user)
):
    """Send a message to the chatbot"""
    try:
        logger.info(f"Received message from user {chat_message.user_id}")
        
        # Validate message content
        if not validate_message_content(chat_message.message):
            raise HTTPException(status_code=400, detail="Invalid message content")
        
        # Handle the message
        result = await chat_handler.handle_message(
            user_id=chat_message.user_id,
            message=chat_message.message,
            session_id=chat_message.session_id
        )
        
        if not result.get("success", False):
            raise HTTPException(status_code=500, detail=result.get("response", "Error processing message"))
        
        return ChatResponse(
            success=result["success"],
            response=result["response"],
            session_id=result["session_id"],
            conversation_id=result["conversation_id"],
            metadata=result["metadata"],
            recommendations=result.get("recommendations", [])
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing chat message: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@chat_router.post("/start")
async def start_conversation(
    conversation_start: ConversationStart,
    current_user: str = Depends(get_current_user)
):
    """Start a new conversation"""
    try:
        logger.info(f"Starting conversation for user {conversation_start.user_id}")
        
        result = await chat_handler.start_conversation(
            user_id=conversation_start.user_id,
            session_id=conversation_start.session_id
        )
        
        if not result.get("success", False):
            raise HTTPException(status_code=500, detail=result.get("response", "Error starting conversation"))
        
        return {
            "success": result["success"],
            "response": result["response"],
            "session_id": result["session_id"],
            "conversation_id": result["conversation_id"],
            "metadata": result["metadata"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error starting conversation: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@chat_router.post("/end")
async def end_conversation(
    conversation_end: ConversationEnd,
    current_user: str = Depends(get_current_user)
):
    """End a conversation"""
    try:
        logger.info(f"Ending conversation for user {conversation_end.user_id}")
        
        result = await chat_handler.end_conversation(
            user_id=conversation_end.user_id,
            session_id=conversation_end.session_id
        )
        
        if not result.get("success", False):
            raise HTTPException(status_code=500, detail=result.get("message", "Error ending conversation"))
        
        return {
            "success": result["success"],
            "message": result["message"],
            "metadata": result["metadata"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error ending conversation: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@chat_router.get("/history/{user_id}")
async def get_conversation_history(
    user_id: str,
    session_id: Optional[str] = None,
    limit: int = 50,
    current_user: str = Depends(get_current_user)
):
    """Get conversation history for a user"""
    try:
        logger.info(f"Getting conversation history for user {user_id}")
        
        result = await chat_handler.get_conversation_history(
            user_id=user_id,
            session_id=session_id,
            limit=limit
        )
        
        if not result.get("success", False):
            raise HTTPException(status_code=500, detail=result.get("message", "Error retrieving conversation history"))
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting conversation history: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@chat_router.post("/feedback")
async def provide_feedback(
    feedback_request: FeedbackRequest,
    current_user: str = Depends(get_current_user)
):
    """Provide feedback on chatbot response"""
    try:
        logger.info(f"Providing feedback for conversation {feedback_request.conversation_id}")
        
        result = await chat_handler.provide_feedback(
            conversation_id=feedback_request.conversation_id,
            feedback_data=feedback_request.feedback.dict()
        )
        
        if not result.get("success", False):
            raise HTTPException(status_code=500, detail=result.get("message", "Error saving feedback"))
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error providing feedback: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@chat_router.get("/stats/{user_id}")
async def get_chat_stats(
    user_id: str,
    current_user: str = Depends(get_current_user)
):
    """Get chat statistics for a user"""
    try:
        logger.info(f"Getting chat stats for user {user_id}")
        
        result = await chat_handler.get_chat_stats(user_id)
        
        if not result.get("success", False):
            raise HTTPException(status_code=500, detail=result.get("message", "Error retrieving chat statistics"))
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting chat stats: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@chat_router.get("/safety/check")
async def check_message_safety(message: str, user_id: str):
    """Check if a message is safe (for testing purposes)"""
    try:
        if not message or len(message) > 1000:
            raise HTTPException(status_code=400, detail="Invalid message")
        
        result = await safety_filters.check_message_safety(message, user_id)
        
        return {
            "message": message,
            "user_id": user_id,
            "safety_result": result,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error checking message safety: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@chat_router.get("/safety/stats")
async def get_safety_stats():
    """Get safety filter statistics"""
    try:
        stats = safety_filters.get_safety_stats()
        return stats
        
    except Exception as e:
        logger.error(f"Error getting safety stats: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@chat_router.get("/personality/info")
async def get_personality_info():
    """Get information about Finley's personality"""
    try:
        from chatbot.personality import personality_manager
        
        personality_info = personality_manager.get_personality_summary()
        
        return {
            "name": "Finley",
            "description": "AI Investment Education Assistant for Teens",
            "personality": personality_info,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting personality info: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@chat_router.post("/quiz/generate")
async def generate_quiz_question(
    topic: str,
    difficulty: str = "beginner",
    current_user: str = Depends(get_current_user)
):
    """Generate a quiz question on a specific topic"""
    try:
        logger.info(f"Generating quiz question for topic: {topic}, difficulty: {difficulty}")
        
        from ai_models.rag_system.response_generator import response_generator
        
        quiz_data = response_generator.generate_quiz_question(topic, difficulty)
        
        return {
            "success": True,
            "quiz_question": quiz_data,
            "topic": topic,
            "difficulty": difficulty,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error generating quiz question: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@chat_router.get("/market/explain/{symbol}")
async def explain_market_movement(
    symbol: str,
    current_user: str = Depends(get_current_user)
):
    """Explain market movement for a specific stock symbol"""
    try:
        logger.info(f"Explaining market movement for symbol: {symbol}")
        
        from data_pipeline.scrapers.market_data import market_data_scraper
        from ai_models.rag_system.response_generator import response_generator
        
        # Get market data
        market_data = market_data_scraper.get_stock_data(symbol)
        
        if not market_data:
            raise HTTPException(status_code=404, detail=f"Market data not found for symbol: {symbol}")
        
        # Generate explanation
        explanation = response_generator.generate_market_explanation(symbol, market_data)
        
        return {
            "success": True,
            "symbol": symbol,
            "market_data": market_data,
            "explanation": explanation,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error explaining market movement: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@chat_router.get("/learning-path/{user_id}")
async def get_learning_path(
    user_id: str,
    current_user: str = Depends(get_current_user)
):
    """Get personalized learning path for user"""
    try:
        logger.info(f"Generating learning path for user {user_id}")
        
        from database.firestore_client import firestore_client
        from ai_models.rag_system.response_generator import response_generator
        
        # Get user profile
        user_profile = await firestore_client.get_user_profile(user_id)
        
        if not user_profile:
            raise HTTPException(status_code=404, detail="User profile not found")
        
        # Generate learning path
        learning_path = response_generator.generate_learning_path(user_profile)
        
        return {
            "success": True,
            "user_id": user_id,
            "learning_path": learning_path,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating learning path: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
