"""
User API endpoints for profile management and preferences
"""
import logging
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime

from database.firestore_client import firestore_client
from ai_models.recommendation_engine import recommendation_engine
from utils.validation import validate_user_id, validate_age, validate_interests

logger = logging.getLogger(__name__)

# Create router
user_router = APIRouter()


# Pydantic models
class UserProfile(BaseModel):
    user_id: str = Field(..., min_length=1, description="User ID")
    age: int = Field(..., ge=13, le=19, description="User age (13-19)")
    experience_level: str = Field(..., description="Experience level: beginner, intermediate, advanced")
    interests: List[str] = Field(..., min_items=1, description="List of investment interests")
    risk_tolerance: Optional[str] = Field(None, description="Risk tolerance: conservative, moderate, aggressive")
    budget_range: Optional[str] = Field(None, description="Budget range for investing")
    investment_goals: Optional[List[str]] = Field(None, description="Investment goals")
    learning_style: Optional[str] = Field(None, description="Preferred learning style")
    time_horizon: Optional[str] = Field(None, description="Investment time horizon")


class UserProfileUpdate(BaseModel):
    age: Optional[int] = Field(None, ge=13, le=19, description="User age (13-19)")
    experience_level: Optional[str] = Field(None, description="Experience level")
    interests: Optional[List[str]] = Field(None, min_items=1, description="List of investment interests")
    risk_tolerance: Optional[str] = Field(None, description="Risk tolerance")
    budget_range: Optional[str] = Field(None, description="Budget range for investing")
    investment_goals: Optional[List[str]] = Field(None, description="Investment goals")
    learning_style: Optional[str] = Field(None, description="Preferred learning style")
    time_horizon: Optional[str] = Field(None, description="Investment time horizon")


class InterestUpdate(BaseModel):
    interests: List[str] = Field(..., min_items=1, description="Updated list of interests")


class FeedbackData(BaseModel):
    content_id: Optional[str] = Field(None, description="Content ID if feedback is about specific content")
    rating: int = Field(..., ge=1, le=5, description="Rating from 1 to 5")
    feedback_type: str = Field(..., description="Type of feedback")
    comments: Optional[str] = Field(None, max_length=500, description="Additional comments")
    helpful: Optional[bool] = Field(None, description="Was the content helpful?")


# Dependency for user validation
async def get_current_user(user_id: str) -> str:
    """Validate and return user ID"""
    if not validate_user_id(user_id):
        raise HTTPException(status_code=400, detail="Invalid user ID")
    return user_id


@user_router.post("/profile")
async def create_user_profile(
    user_profile: UserProfile,
    current_user: str = Depends(get_current_user)
):
    """Create or update user profile"""
    try:
        logger.info(f"Creating/updating profile for user {user_profile.user_id}")
        
        # Validate profile data
        if not validate_age(user_profile.age):
            raise HTTPException(status_code=400, detail="Invalid age")
        
        if not validate_interests(user_profile.interests):
            raise HTTPException(status_code=400, detail="Invalid interests")
        
        # Prepare profile data
        profile_data = {
            "user_id": user_profile.user_id,
            "age": user_profile.age,
            "experience_level": user_profile.experience_level,
            "interests": user_profile.interests,
            "risk_tolerance": user_profile.risk_tolerance,
            "budget_range": user_profile.budget_range,
            "investment_goals": user_profile.investment_goals,
            "learning_style": user_profile.learning_style,
            "time_horizon": user_profile.time_horizon,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # Save profile
        success = await firestore_client.create_user_profile(user_profile.user_id, profile_data)
        
        if not success:
            raise HTTPException(status_code=500, detail="Error creating user profile")
        
        return {
            "success": True,
            "message": "User profile created successfully",
            "user_id": user_profile.user_id,
            "profile": profile_data,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating user profile: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@user_router.get("/profile/{user_id}")
async def get_user_profile(
    user_id: str,
    current_user: str = Depends(get_current_user)
):
    """Get user profile"""
    try:
        logger.info(f"Getting profile for user {user_id}")
        
        profile = await firestore_client.get_user_profile(user_id)
        
        if not profile:
            raise HTTPException(status_code=404, detail="User profile not found")
        
        return {
            "success": True,
            "user_id": user_id,
            "profile": profile,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user profile: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@user_router.put("/profile/{user_id}")
async def update_user_profile(
    user_id: str,
    profile_update: UserProfileUpdate,
    current_user: str = Depends(get_current_user)
):
    """Update user profile"""
    try:
        logger.info(f"Updating profile for user {user_id}")
        
        # Get existing profile
        existing_profile = await firestore_client.get_user_profile(user_id)
        
        if not existing_profile:
            raise HTTPException(status_code=404, detail="User profile not found")
        
        # Validate update data
        if profile_update.age and not validate_age(profile_update.age):
            raise HTTPException(status_code=400, detail="Invalid age")
        
        if profile_update.interests and not validate_interests(profile_update.interests):
            raise HTTPException(status_code=400, detail="Invalid interests")
        
        # Update profile data
        update_data = {}
        for field, value in profile_update.dict(exclude_unset=True).items():
            if value is not None:
                update_data[field] = value
        
        update_data["updated_at"] = datetime.utcnow().isoformat()
        
        # Save updated profile
        success = await firestore_client.create_user_profile(user_id, update_data)
        
        if not success:
            raise HTTPException(status_code=500, detail="Error updating user profile")
        
        # Clear recommendation cache for this user
        from database.cache_manager import cache_manager
        cache_manager.clear_pattern(f"recommendations:{user_id}:*")
        
        return {
            "success": True,
            "message": "User profile updated successfully",
            "user_id": user_id,
            "updated_fields": list(update_data.keys()),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating user profile: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@user_router.put("/profile/{user_id}/interests")
async def update_user_interests(
    user_id: str,
    interest_update: InterestUpdate,
    current_user: str = Depends(get_current_user)
):
    """Update user interests"""
    try:
        logger.info(f"Updating interests for user {user_id}")
        
        # Validate interests
        if not validate_interests(interest_update.interests):
            raise HTTPException(status_code=400, detail="Invalid interests")
        
        # Update interests
        success = await firestore_client.update_user_interests(user_id, interest_update.interests)
        
        if not success:
            raise HTTPException(status_code=500, detail="Error updating user interests")
        
        # Update recommendation engine
        recommendation_engine.update_user_interests(user_id, interest_update.interests)
        
        return {
            "success": True,
            "message": "User interests updated successfully",
            "user_id": user_id,
            "interests": interest_update.interests,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating user interests: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@user_router.post("/feedback")
async def submit_feedback(
    user_id: str,
    feedback_data: FeedbackData,
    current_user: str = Depends(get_current_user)
):
    """Submit user feedback"""
    try:
        logger.info(f"Submitting feedback from user {user_id}")
        
        # Prepare feedback data
        feedback = {
            "user_id": user_id,
            "content_id": feedback_data.content_id,
            "rating": feedback_data.rating,
            "feedback_type": feedback_data.feedback_type,
            "comments": feedback_data.comments,
            "helpful": feedback_data.helpful,
            "submitted_at": datetime.utcnow().isoformat()
        }
        
        # Save feedback
        success = await firestore_client.db.collection("user_feedback").add(feedback)
        
        if not success:
            raise HTTPException(status_code=500, detail="Error submitting feedback")
        
        return {
            "success": True,
            "message": "Feedback submitted successfully",
            "user_id": user_id,
            "feedback_id": success[1].id,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting feedback: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@user_router.get("/analytics/{user_id}")
async def get_user_analytics(
    user_id: str,
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    current_user: str = Depends(get_current_user)
):
    """Get user analytics and engagement data"""
    try:
        logger.info(f"Getting analytics for user {user_id} - {days} days")
        
        analytics = await firestore_client.get_user_analytics(user_id, days)
        
        return {
            "success": True,
            "user_id": user_id,
            "analytics": analytics,
            "period_days": days,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting user analytics: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@user_router.get("/preferences/{user_id}")
async def get_user_preferences(
    user_id: str,
    current_user: str = Depends(get_current_user)
):
    """Get user preferences and settings"""
    try:
        logger.info(f"Getting preferences for user {user_id}")
        
        profile = await firestore_client.get_user_profile(user_id)
        
        if not profile:
            raise HTTPException(status_code=404, detail="User profile not found")
        
        # Extract preferences
        preferences = {
            "experience_level": profile.get("experience_level"),
            "interests": profile.get("interests", []),
            "risk_tolerance": profile.get("risk_tolerance"),
            "budget_range": profile.get("budget_range"),
            "learning_style": profile.get("learning_style"),
            "time_horizon": profile.get("time_horizon"),
            "investment_goals": profile.get("investment_goals", [])
        }
        
        return {
            "success": True,
            "user_id": user_id,
            "preferences": preferences,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user preferences: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@user_router.get("/learning-progress/{user_id}")
async def get_learning_progress(
    user_id: str,
    current_user: str = Depends(get_current_user)
):
    """Get user's learning progress"""
    try:
        logger.info(f"Getting learning progress for user {user_id}")
        
        # Get user analytics
        analytics = await firestore_client.get_user_analytics(user_id, days=30)
        
        # Get conversation history
        from chatbot.conversation_manager import conversation_manager
        conversations = await conversation_manager.get_user_conversations(user_id, limit=50)
        
        # Calculate learning progress
        total_conversations = len(conversations)
        total_messages = sum(len(conv.get("messages", [])) for conv in conversations)
        
        # Analyze topics covered
        topics_covered = set()
        for conversation in conversations:
            topic = conversation.get("topic", "")
            if topic:
                topics_covered.add(topic)
        
        # Calculate engagement score
        engagement_score = min(100, (total_messages * 2) + (total_conversations * 5))
        
        progress = {
            "total_conversations": total_conversations,
            "total_messages": total_messages,
            "topics_covered": list(topics_covered),
            "topics_count": len(topics_covered),
            "engagement_score": engagement_score,
            "last_activity": conversations[0].get("last_updated") if conversations else None
        }
        
        return {
            "success": True,
            "user_id": user_id,
            "learning_progress": progress,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting learning progress: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@user_router.delete("/profile/{user_id}")
async def delete_user_profile(
    user_id: str,
    current_user: str = Depends(get_current_user)
):
    """Delete user profile and associated data"""
    try:
        logger.info(f"Deleting profile for user {user_id}")
        
        # Delete user profile
        success = await firestore_client.db.collection("user_profiles").document(user_id).delete()
        
        if not success:
            raise HTTPException(status_code=500, detail="Error deleting user profile")
        
        # Clear user data from cache
        from database.cache_manager import cache_manager
        cache_manager.clear_pattern(f"*:{user_id}:*")
        
        return {
            "success": True,
            "message": "User profile deleted successfully",
            "user_id": user_id,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error deleting user profile: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@user_router.get("/stats/{user_id}")
async def get_user_stats(
    user_id: str,
    current_user: str = Depends(get_current_user)
):
    """Get comprehensive user statistics"""
    try:
        logger.info(f"Getting stats for user {user_id}")
        
        # Get user profile
        profile = await firestore_client.get_user_profile(user_id)
        
        # Get analytics
        analytics = await firestore_client.get_user_analytics(user_id, days=30)
        
        # Get learning progress
        from chatbot.conversation_manager import conversation_manager
        conversations = await conversation_manager.get_user_conversations(user_id, limit=100)
        
        # Calculate stats
        stats = {
            "profile": {
                "age": profile.get("age") if profile else None,
                "experience_level": profile.get("experience_level") if profile else None,
                "interests_count": len(profile.get("interests", [])) if profile else 0
            },
            "engagement": {
                "total_interactions": analytics.get("total_interactions", 0),
                "total_conversations": analytics.get("total_conversations", 0),
                "conversations_this_month": len(conversations)
            },
            "learning": {
                "topics_covered": len(set(conv.get("topic", "") for conv in conversations if conv.get("topic"))),
                "total_messages": sum(len(conv.get("messages", [])) for conv in conversations),
                "last_activity": conversations[0].get("last_updated") if conversations else None
            }
        }
        
        return {
            "success": True,
            "user_id": user_id,
            "stats": stats,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting user stats: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
