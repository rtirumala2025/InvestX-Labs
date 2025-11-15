"""
Supabase service for the AI Investment Backend
Handles all database operations with Supabase
"""
import os
from typing import Optional, Dict, Any, List
from supabase import create_client, Client as SupabaseClient
from fastapi import HTTPException, status
import logging

logger = logging.getLogger(__name__)

class SupabaseService:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(SupabaseService, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance
    
    def _initialize(self):
        """Initialize Supabase client with environment variables"""
        supabase_url = os.getenv('SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_SERVICE_KEY')
        
        if not supabase_url or not supabase_key:
            raise ValueError("Missing Supabase configuration in environment variables")
        
        self.supabase: SupabaseClient = create_client(supabase_url, supabase_key)
        logger.info("Supabase client initialized successfully")
    
    # User Management
    async def get_user_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user profile by ID"""
        try:
            result = self.supabase.table('user_profiles').select('*').eq('id', user_id).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Error fetching user profile: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to fetch user profile"
            )
    
    async def create_or_update_user(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create or update user profile"""
        try:
            user_id = user_data.get('id')
            if not user_id:
                raise ValueError("User ID is required")
                
            # Check if user exists
            existing_user = await self.get_user_profile(user_id)
            
            if existing_user:
                # Update existing user
                result = self.supabase.table('user_profiles')\
                    .update(user_data)\
                    .eq('id', user_id)\
                    .execute()
            else:
                # Create new user
                result = self.supabase.table('user_profiles').insert(user_data).execute()
                
            return result.data[0] if result.data else None
            
        except Exception as e:
            logger.error(f"Error creating/updating user: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create/update user profile"
            )
    
    # Chat Operations
    async def create_chat_session(self, session_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new chat session"""
        try:
            result = self.supabase.table('chat_sessions').insert(session_data).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Error creating chat session: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create chat session"
            )
    
    async def get_chat_session(self, session_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        """Get chat session by ID and user ID"""
        try:
            result = self.supabase.table('chat_sessions')\
                .select('*')\
                .eq('id', session_id)\
                .eq('user_id', user_id)\
                .execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Error fetching chat session: {str(e)}")
            return None
    
    async def save_chat_message(self, message_data: Dict[str, Any]) -> Dict[str, Any]:
        """Save a chat message"""
        try:
            result = self.supabase.table('chat_messages').insert(message_data).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Error saving chat message: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save chat message"
            )
    
    async def get_chat_messages(self, session_id: str, limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
        """Get chat messages for a session"""
        try:
            result = self.supabase.table('chat_messages')\
                .select('*')\
                .eq('session_id', session_id)\
                .order('created_at', desc=True)\
                .range(offset, offset + limit - 1)\
                .execute()
            return result.data or []
        except Exception as e:
            logger.error(f"Error fetching chat messages: {str(e)}")
            return []
    
    # Analytics
    async def log_analytics_event(self, event_data: Dict[str, Any]) -> bool:
        """Log an analytics event"""
        try:
            self.supabase.table('analytics_events').insert(event_data).execute()
            return True
        except Exception as e:
            logger.error(f"Error logging analytics event: {str(e)}")
            return False

# Singleton instance
supabase_service = SupabaseService()
