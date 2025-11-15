"""
Conversation manager for handling chat conversations and context
"""
import logging
import uuid
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from database.firestore_client import firestore_client
from database.cache_manager import cache_manager
from config.model_config import CONVERSATION_CONFIG

logger = logging.getLogger(__name__)


class ConversationManager:
    """Manages chat conversations and context"""
    
    def __init__(self):
        """Initialize conversation manager"""
        self.max_context_messages = CONVERSATION_CONFIG["max_context_messages"]
        self.context_window_hours = CONVERSATION_CONFIG["context_window_hours"]
        self.topic_continuity_threshold = CONVERSATION_CONFIG["topic_continuity_threshold"]
        self.summary_length = CONVERSATION_CONFIG["conversation_summary_length"]
    
    async def create_conversation(self, user_id: str, session_id: str = None) -> Dict[str, Any]:
        """Create a new conversation"""
        try:
            logger.info(f"Creating new conversation for user: {user_id}")
            
            # Generate session ID if not provided
            if not session_id:
                session_id = str(uuid.uuid4())
            
            # Create conversation object
            conversation = {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "session_id": session_id,
                "messages": [],
                "created_at": datetime.utcnow().isoformat(),
                "last_updated": datetime.utcnow().isoformat(),
                "ended": False,
                "topic": "",
                "summary": "",
                "message_count": 0,
                "context": {
                    "current_topic": "",
                    "user_interests": [],
                    "conversation_goals": [],
                    "key_points": []
                }
            }
            
            # Save to database
            conversation_id = await firestore_client.save_conversation(user_id, conversation)
            conversation["id"] = conversation_id
            
            # Cache conversation
            cache_key = f"conversation:{user_id}:{session_id}"
            cache_manager.set(cache_key, conversation, ttl=3600)  # 1 hour cache
            
            logger.info(f"Created conversation {conversation_id} for user {user_id}")
            return conversation
            
        except Exception as e:
            logger.error(f"Error creating conversation: {e}")
            raise
    
    async def get_conversation(self, user_id: str, session_id: str) -> Optional[Dict[str, Any]]:
        """Get existing conversation"""
        try:
            # Check cache first
            cache_key = f"conversation:{user_id}:{session_id}"
            cached_conversation = cache_manager.get(cache_key)
            
            if cached_conversation:
                return cached_conversation
            
            # Get from database
            conversations = await firestore_client.get_conversation_history(user_id, limit=100)
            
            for conversation in conversations:
                if conversation.get("session_id") == session_id:
                    # Cache the conversation
                    cache_manager.set(cache_key, conversation, ttl=3600)
                    return conversation
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting conversation: {e}")
            return None
    
    async def get_or_create_conversation(self, user_id: str, session_id: str = None) -> Dict[str, Any]:
        """Get existing conversation or create new one"""
        try:
            if session_id:
                # Try to get existing conversation
                conversation = await self.get_conversation(user_id, session_id)
                if conversation:
                    return conversation
            
            # Create new conversation
            return await self.create_conversation(user_id, session_id)
            
        except Exception as e:
            logger.error(f"Error getting or creating conversation: {e}")
            raise
    
    async def save_conversation(self, conversation: Dict[str, Any]) -> bool:
        """Save conversation to database"""
        try:
            # Update last_updated timestamp
            conversation["last_updated"] = datetime.utcnow().isoformat()
            conversation["message_count"] = len(conversation.get("messages", []))
            
            # Update context if needed
            await self._update_conversation_context(conversation)
            
            # Save to database
            conversation_id = conversation.get("id")
            if conversation_id:
                # Update existing conversation
                success = await firestore_client.db.collection("user_conversations").document(conversation_id).update(conversation)
            else:
                # Create new conversation
                conversation_id = await firestore_client.save_conversation(
                    conversation["user_id"], conversation
                )
                conversation["id"] = conversation_id
            
            # Update cache
            cache_key = f"conversation:{conversation['user_id']}:{conversation['session_id']}"
            cache_manager.set(cache_key, conversation, ttl=3600)
            
            return True
            
        except Exception as e:
            logger.error(f"Error saving conversation: {e}")
            return False
    
    async def get_user_conversations(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Get all conversations for a user"""
        try:
            # Get from database
            conversations = await firestore_client.get_conversation_history(user_id, limit)
            
            # Sort by last_updated (most recent first)
            conversations.sort(key=lambda x: x.get("last_updated", ""), reverse=True)
            
            return conversations
            
        except Exception as e:
            logger.error(f"Error getting user conversations: {e}")
            return []
    
    async def _update_conversation_context(self, conversation: Dict[str, Any]):
        """Update conversation context based on messages"""
        try:
            messages = conversation.get("messages", [])
            if not messages:
                return
            
            # Get recent messages for context analysis
            recent_messages = messages[-self.max_context_messages:]
            
            # Analyze conversation topic
            current_topic = self._analyze_conversation_topic(recent_messages)
            conversation["topic"] = current_topic
            conversation["context"]["current_topic"] = current_topic
            
            # Extract user interests
            user_interests = self._extract_user_interests(recent_messages)
            conversation["context"]["user_interests"] = user_interests
            
            # Extract key points
            key_points = self._extract_key_points(recent_messages)
            conversation["context"]["key_points"] = key_points
            
            # Generate conversation summary if needed
            if len(messages) > 10:  # Only summarize longer conversations
                summary = self._generate_conversation_summary(recent_messages)
                conversation["summary"] = summary
            
        except Exception as e:
            logger.error(f"Error updating conversation context: {e}")
    
    def _analyze_conversation_topic(self, messages: List[Dict[str, Any]]) -> str:
        """Analyze the main topic of conversation"""
        try:
            if not messages:
                return ""
            
            # Extract text from recent messages
            recent_text = " ".join([
                msg.get("content", "") for msg in messages[-5:]  # Last 5 messages
            ]).lower()
            
            # Common investment topics
            topics = {
                "stocks": ["stock", "stocks", "share", "shares", "equity", "equities"],
                "bonds": ["bond", "bonds", "fixed income", "treasury", "corporate bond"],
                "etfs": ["etf", "etfs", "exchange traded fund", "index fund"],
                "portfolio": ["portfolio", "diversification", "asset allocation", "balance"],
                "risk": ["risk", "risky", "safe", "volatility", "uncertainty"],
                "savings": ["save", "saving", "savings", "budget", "budgeting"],
                "retirement": ["retirement", "401k", "ira", "pension", "future"],
                "market": ["market", "trading", "buy", "sell", "price", "value"],
                "education": ["learn", "learning", "understand", "explain", "teach"]
            }
            
            # Count topic mentions
            topic_scores = {}
            for topic, keywords in topics.items():
                score = sum(1 for keyword in keywords if keyword in recent_text)
                if score > 0:
                    topic_scores[topic] = score
            
            # Return most mentioned topic
            if topic_scores:
                return max(topic_scores, key=topic_scores.get)
            
            return "general"
            
        except Exception as e:
            logger.error(f"Error analyzing conversation topic: {e}")
            return "general"
    
    def _extract_user_interests(self, messages: List[Dict[str, Any]]) -> List[str]:
        """Extract user interests from conversation"""
        try:
            interests = set()
            
            # Extract from user messages
            user_messages = [msg for msg in messages if msg.get("role") == "user"]
            
            for message in user_messages:
                content = message.get("content", "").lower()
                
                # Look for interest indicators
                interest_keywords = [
                    "interested in", "want to learn about", "curious about",
                    "like", "love", "enjoy", "fascinated by", "want to know more about"
                ]
                
                for keyword in interest_keywords:
                    if keyword in content:
                        # Extract the topic after the keyword
                        parts = content.split(keyword)
                        if len(parts) > 1:
                            topic = parts[1].strip().split()[0:3]  # First few words
                            interests.add(" ".join(topic))
            
            return list(interests)[:5]  # Limit to 5 interests
            
        except Exception as e:
            logger.error(f"Error extracting user interests: {e}")
            return []
    
    def _extract_key_points(self, messages: List[Dict[str, Any]]) -> List[str]:
        """Extract key points from conversation"""
        try:
            key_points = []
            
            # Extract from assistant messages (educational content)
            assistant_messages = [msg for msg in messages if msg.get("role") == "assistant"]
            
            for message in assistant_messages:
                content = message.get("content", "")
                
                # Look for key point indicators
                if any(indicator in content for indicator in ["important", "key", "remember", "note"]):
                    # Extract sentences with key indicators
                    sentences = content.split(".")
                    for sentence in sentences:
                        if any(indicator in sentence.lower() for indicator in ["important", "key", "remember", "note"]):
                            key_points.append(sentence.strip())
            
            return key_points[:5]  # Limit to 5 key points
            
        except Exception as e:
            logger.error(f"Error extracting key points: {e}")
            return []
    
    def _generate_conversation_summary(self, messages: List[Dict[str, Any]]) -> str:
        """Generate a summary of the conversation"""
        try:
            if not messages:
                return ""
            
            # Extract main topics and key information
            topics = self._analyze_conversation_topic(messages)
            interests = self._extract_user_interests(messages)
            key_points = self._extract_key_points(messages)
            
            # Create summary
            summary_parts = []
            
            if topics and topics != "general":
                summary_parts.append(f"Discussed {topics}")
            
            if interests:
                summary_parts.append(f"User interested in {', '.join(interests[:2])}")
            
            if key_points:
                summary_parts.append(f"Key points: {key_points[0][:100]}...")
            
            summary = ". ".join(summary_parts)
            
            # Limit summary length
            if len(summary) > self.summary_length:
                summary = summary[:self.summary_length] + "..."
            
            return summary
            
        except Exception as e:
            logger.error(f"Error generating conversation summary: {e}")
            return ""
    
    async def get_conversation_context(self, user_id: str, session_id: str) -> Dict[str, Any]:
        """Get conversation context for RAG system"""
        try:
            conversation = await self.get_conversation(user_id, session_id)
            
            if not conversation:
                return {}
            
            # Extract context information
            context = {
                "conversation_id": conversation.get("id"),
                "session_id": conversation.get("session_id"),
                "current_topic": conversation.get("context", {}).get("current_topic", ""),
                "user_interests": conversation.get("context", {}).get("user_interests", []),
                "key_points": conversation.get("context", {}).get("key_points", []),
                "conversation_summary": conversation.get("summary", ""),
                "message_count": conversation.get("message_count", 0),
                "last_updated": conversation.get("last_updated", "")
            }
            
            return context
            
        except Exception as e:
            logger.error(f"Error getting conversation context: {e}")
            return {}
    
    async def cleanup_old_conversations(self, days_old: int = 30) -> int:
        """Clean up old conversations"""
        try:
            logger.info(f"Cleaning up conversations older than {days_old} days")
            
            cutoff_date = datetime.utcnow() - timedelta(days=days_old)
            
            # Get old conversations
            old_conversations = await firestore_client.db.collection("user_conversations").where(
                "last_updated", "<", cutoff_date.isoformat()
            ).get()
            
            # Delete old conversations
            deleted_count = 0
            for doc in old_conversations:
                try:
                    doc.reference.delete()
                    deleted_count += 1
                except Exception as e:
                    logger.error(f"Error deleting conversation {doc.id}: {e}")
            
            logger.info(f"Cleaned up {deleted_count} old conversations")
            return deleted_count
            
        except Exception as e:
            logger.error(f"Error cleaning up old conversations: {e}")
            return 0
    
    async def get_conversation_stats(self) -> Dict[str, Any]:
        """Get conversation statistics"""
        try:
            # Get total conversations
            total_conversations = await firestore_client.db.collection("user_conversations").count().get()
            
            # Get active conversations (last 24 hours)
            active_cutoff = datetime.utcnow() - timedelta(hours=24)
            active_conversations = await firestore_client.db.collection("user_conversations").where(
                "last_updated", ">", active_cutoff.isoformat()
            ).count().get()
            
            return {
                "total_conversations": total_conversations[0][0].value,
                "active_conversations": active_conversations[0][0].value,
                "generated_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting conversation stats: {e}")
            return {"error": str(e)}


# Global conversation manager instance
conversation_manager = ConversationManager()
