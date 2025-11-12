"""
Firebase Firestore client for the AI Investment Backend
"""
import json
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import firebase_admin
from firebase_admin import credentials, firestore
from google.cloud.firestore_v1 import FieldFilter, Query
from config.settings import FIREBASE_SERVICE_ACCOUNT, settings

logger = logging.getLogger(__name__)


class FirestoreClient:
    """Firebase Firestore client for data operations"""
    
    def __init__(self):
        """Initialize Firestore client"""
        self.db = None
        self._initialize_firebase()
    
    def _initialize_firebase(self):
        """Initialize Firebase Admin SDK"""
        try:
            # Check if Firebase is already initialized
            if not firebase_admin._apps:
                cred = credentials.Certificate(FIREBASE_SERVICE_ACCOUNT)
                firebase_admin.initialize_app(cred)
            
            self.db = firestore.client()
            logger.info("Firebase Firestore client initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize Firebase: {e}")
            raise
    
    # User-related operations
    async def create_user_profile(self, user_id: str, profile_data: Dict[str, Any]) -> bool:
        """Create or update user profile"""
        try:
            profile_data.update({
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            })
            
            self.db.collection("user_profiles").document(user_id).set(profile_data)
            logger.info(f"User profile created/updated for user: {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error creating user profile: {e}")
            return False
    
    async def get_user_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user profile by ID"""
        try:
            doc = self.db.collection("user_profiles").document(user_id).get()
            if doc.exists:
                return doc.to_dict()
            return None
            
        except Exception as e:
            logger.error(f"Error getting user profile: {e}")
            return None
    
    async def update_user_interests(self, user_id: str, interests: List[str]) -> bool:
        """Update user interests based on chat interactions"""
        try:
            self.db.collection("user_profiles").document(user_id).update({
                "interests": interests,
                "updated_at": datetime.utcnow()
            })
            return True
            
        except Exception as e:
            logger.error(f"Error updating user interests: {e}")
            return False
    
    # Conversation management
    async def save_conversation(self, user_id: str, conversation_data: Dict[str, Any]) -> str:
        """Save conversation to Firestore"""
        try:
            conversation_data.update({
                "user_id": user_id,
                "timestamp": datetime.utcnow(),
                "created_at": datetime.utcnow()
            })
            
            doc_ref = self.db.collection("user_conversations").add(conversation_data)
            conversation_id = doc_ref[1].id
            logger.info(f"Conversation saved for user: {user_id}")
            return conversation_id
            
        except Exception as e:
            logger.error(f"Error saving conversation: {e}")
            return None
    
    async def get_conversation_history(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Get user's conversation history"""
        try:
            query = (self.db.collection("user_conversations")
                    .where("user_id", "==", user_id)
                    .order_by("timestamp", direction=Query.DESCENDING)
                    .limit(limit))
            
            docs = query.stream()
            conversations = []
            
            for doc in docs:
                conversation = doc.to_dict()
                conversation["id"] = doc.id
                conversations.append(conversation)
            
            return conversations
            
        except Exception as e:
            logger.error(f"Error getting conversation history: {e}")
            return []
    
    async def update_conversation_feedback(self, conversation_id: str, feedback: Dict[str, Any]) -> bool:
        """Update conversation with user feedback"""
        try:
            self.db.collection("user_conversations").document(conversation_id).update({
                "feedback": feedback,
                "feedback_timestamp": datetime.utcnow()
            })
            return True
            
        except Exception as e:
            logger.error(f"Error updating conversation feedback: {e}")
            return False
    
    # Educational content operations
    async def save_educational_content(self, content_data: Dict[str, Any]) -> str:
        """Save educational content to Firestore"""
        try:
            content_data.update({
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "is_active": True
            })
            
            doc_ref = self.db.collection("educational_content").add(content_data)
            content_id = doc_ref[1].id
            logger.info(f"Educational content saved: {content_id}")
            return content_id
            
        except Exception as e:
            logger.error(f"Error saving educational content: {e}")
            return None
    
    async def get_educational_content(self, category: Optional[str] = None, 
                                    difficulty: Optional[str] = None,
                                    limit: int = 20) -> List[Dict[str, Any]]:
        """Get educational content with optional filters"""
        try:
            query = self.db.collection("educational_content").where("is_active", "==", True)
            
            if category:
                query = query.where("category", "==", category)
            
            if difficulty:
                query = query.where("difficulty_level", "==", difficulty)
            
            query = query.order_by("created_at", direction=Query.DESCENDING).limit(limit)
            
            docs = query.stream()
            content = []
            
            for doc in docs:
                item = doc.to_dict()
                item["id"] = doc.id
                content.append(item)
            
            return content
            
        except Exception as e:
            logger.error(f"Error getting educational content: {e}")
            return []
    
    async def get_personalized_content(self, user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Get personalized educational content for user"""
        try:
            # Get user profile first
            user_profile = await self.get_user_profile(user_id)
            if not user_profile:
                return []
            
            # Build query based on user interests and experience
            query = self.db.collection("educational_content").where("is_active", "==", True)
            
            # Filter by user's experience level
            if "experience_level" in user_profile:
                query = query.where("difficulty_level", "<=", user_profile["experience_level"])
            
            # Filter by user's interests
            if "interests" in user_profile and user_profile["interests"]:
                query = query.where("category", "in", user_profile["interests"][:5])
            
            query = query.order_by("popularity_score", direction=Query.DESCENDING).limit(limit)
            
            docs = query.stream()
            content = []
            
            for doc in docs:
                item = doc.to_dict()
                item["id"] = doc.id
                content.append(item)
            
            return content
            
        except Exception as e:
            logger.error(f"Error getting personalized content: {e}")
            return []
    
    # Market data operations
    async def save_market_data(self, symbol: str, market_data: Dict[str, Any]) -> bool:
        """Save market data for a symbol"""
        try:
            market_data.update({
                "symbol": symbol,
                "timestamp": datetime.utcnow(),
                "created_at": datetime.utcnow()
            })
            
            self.db.collection("market_data").document(symbol).set(market_data)
            return True
            
        except Exception as e:
            logger.error(f"Error saving market data: {e}")
            return False
    
    async def get_market_data(self, symbol: str) -> Optional[Dict[str, Any]]:
        """Get latest market data for a symbol"""
        try:
            doc = self.db.collection("market_data").document(symbol).get()
            if doc.exists:
                return doc.to_dict()
            return None
            
        except Exception as e:
            logger.error(f"Error getting market data: {e}")
            return None
    
    # News articles operations
    async def save_news_article(self, article_data: Dict[str, Any]) -> str:
        """Save news article"""
        try:
            article_data.update({
                "created_at": datetime.utcnow(),
                "is_active": True
            })
            
            doc_ref = self.db.collection("news_articles").add(article_data)
            article_id = doc_ref[1].id
            return article_id
            
        except Exception as e:
            logger.error(f"Error saving news article: {e}")
            return None
    
    async def get_recent_news(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Get recent news articles"""
        try:
            query = (self.db.collection("news_articles")
                    .where("is_active", "==", True)
                    .order_by("created_at", direction=Query.DESCENDING)
                    .limit(limit))
            
            docs = query.stream()
            articles = []
            
            for doc in docs:
                article = doc.to_dict()
                article["id"] = doc.id
                articles.append(article)
            
            return articles
            
        except Exception as e:
            logger.error(f"Error getting recent news: {e}")
            return []
    
    # Vector embeddings operations
    async def save_embedding(self, content_id: str, embedding_data: Dict[str, Any]) -> bool:
        """Save vector embedding for content"""
        try:
            embedding_data.update({
                "content_id": content_id,
                "created_at": datetime.utcnow()
            })
            
            self.db.collection("content_embeddings").document(content_id).set(embedding_data)
            return True
            
        except Exception as e:
            logger.error(f"Error saving embedding: {e}")
            return False
    
    async def get_embeddings_by_category(self, category: str) -> List[Dict[str, Any]]:
        """Get embeddings for a specific category"""
        try:
            query = (self.db.collection("content_embeddings")
                    .where("category", "==", category)
                    .limit(100))
            
            docs = query.stream()
            embeddings = []
            
            for doc in docs:
                embedding = doc.to_dict()
                embedding["id"] = doc.id
                embeddings.append(embedding)
            
            return embeddings
            
        except Exception as e:
            logger.error(f"Error getting embeddings by category: {e}")
            return []
    
    # Analytics and tracking
    async def track_user_engagement(self, user_id: str, engagement_data: Dict[str, Any]) -> bool:
        """Track user engagement metrics"""
        try:
            engagement_data.update({
                "user_id": user_id,
                "timestamp": datetime.utcnow()
            })
            
            self.db.collection("user_engagement").add(engagement_data)
            return True
            
        except Exception as e:
            logger.error(f"Error tracking user engagement: {e}")
            return False
    
    async def get_user_analytics(self, user_id: str, days: int = 30) -> Dict[str, Any]:
        """Get user analytics for the past N days"""
        try:
            start_date = datetime.utcnow() - timedelta(days=days)
            
            # Get engagement data
            engagement_query = (self.db.collection("user_engagement")
                              .where("user_id", "==", user_id)
                              .where("timestamp", ">=", start_date))
            
            engagement_docs = engagement_query.stream()
            engagement_data = [doc.to_dict() for doc in engagement_docs]
            
            # Get conversation data
            conversation_query = (self.db.collection("user_conversations")
                                .where("user_id", "==", user_id)
                                .where("timestamp", ">=", start_date))
            
            conversation_docs = conversation_query.stream()
            conversation_data = [doc.to_dict() for doc in conversation_docs]
            
            return {
                "engagement_data": engagement_data,
                "conversation_data": conversation_data,
                "total_interactions": len(engagement_data),
                "total_conversations": len(conversation_data)
            }
            
        except Exception as e:
            logger.error(f"Error getting user analytics: {e}")
            return {}
    
    # Cache management
    async def save_to_cache(self, key: str, data: Dict[str, Any], ttl: int = 3600) -> bool:
        """Save data to cache with TTL"""
        try:
            cache_data = {
                "data": data,
                "created_at": datetime.utcnow(),
                "expires_at": datetime.utcnow() + timedelta(seconds=ttl)
            }
            
            self.db.collection("cache").document(key).set(cache_data)
            return True
            
        except Exception as e:
            logger.error(f"Error saving to cache: {e}")
            return False
    
    async def get_from_cache(self, key: str) -> Optional[Dict[str, Any]]:
        """Get data from cache if not expired"""
        try:
            doc = self.db.collection("cache").document(key).get()
            if doc.exists:
                cache_data = doc.to_dict()
                if cache_data["expires_at"] > datetime.utcnow():
                    return cache_data["data"]
                else:
                    # Cache expired, delete it
                    self.db.collection("cache").document(key).delete()
            return None
            
        except Exception as e:
            logger.error(f"Error getting from cache: {e}")
            return None


# Global Firestore client instance
firestore_client = FirestoreClient()
