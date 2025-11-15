"""
Main chatbot handler for Finley - the teen investment education assistant
"""
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from chatbot.conversation_manager import conversation_manager
from chatbot.personality import personality_manager
from chatbot.safety_filters import safety_filters
from ai_models.rag_system.response_generator import response_generator
from database.firestore_client import firestore_client
from database.cache_manager import cache_manager
from config.prompts import CONVERSATION_STARTERS, ERROR_MESSAGES

logger = logging.getLogger(__name__)


class ChatHandler:
    """Main chatbot handler for Finley"""
    
    def __init__(self):
        """Initialize chat handler"""
        self.conversation_manager = conversation_manager
        self.personality_manager = personality_manager
        self.safety_filters = safety_filters
        self.response_generator = response_generator
    
    async def handle_message(self, user_id: str, message: str, 
                           session_id: str = None) -> Dict[str, Any]:
        """Handle incoming chat message"""
        try:
            logger.info(f"Handling message from user {user_id}: {message[:50]}...")
            
            # Validate input
            if not message or not message.strip():
                return self._create_error_response("Please send me a message! I'm here to help! 😊")
            
            # Check message length
            if len(message) > 1000:
                return self._create_error_response("Your message is a bit long! Could you break it down into smaller questions? 📝")
            
            # Safety check
            safety_result = await self.safety_filters.check_message_safety(message, user_id)
            if not safety_result["is_safe"]:
                return self._create_safety_response(safety_result["reason"])
            
            # Get or create conversation
            conversation = await self.conversation_manager.get_or_create_conversation(
                user_id, session_id
            )
            
            # Get user profile
            user_profile = await firestore_client.get_user_profile(user_id)
            
            # Get conversation history
            conversation_history = conversation.get("messages", [])
            
            # Generate response
            response_data = await self._generate_chat_response(
                message=message,
                user_id=user_id,
                user_profile=user_profile,
                conversation_history=conversation_history
            )
            
            # Update conversation
            await self._update_conversation(
                conversation=conversation,
                user_message=message,
                bot_response=response_data["response"],
                user_id=user_id
            )
            
            # Track engagement
            await self._track_user_engagement(user_id, message, response_data)
            
            # Return response
            return {
                "success": True,
                "response": response_data["response"],
                "session_id": conversation.get("session_id"),
                "conversation_id": conversation.get("id"),
                "metadata": {
                    "response_type": response_data.get("metadata", {}).get("response_type", "general"),
                    "context_used": response_data.get("metadata", {}).get("context_used", 0),
                    "generated_at": datetime.utcnow().isoformat(),
                    "user_profile_used": bool(user_profile)
                },
                "recommendations": response_data.get("recommendations", [])
            }
            
        except Exception as e:
            logger.error(f"Error handling message: {e}")
            return self._create_error_response("I'm having trouble processing your message right now. Please try again! 😅")
    
    async def _generate_chat_response(self, message: str, user_id: str, 
                                    user_profile: Dict[str, Any] = None,
                                    conversation_history: List[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Generate chat response using RAG system"""
        try:
            # Determine context type based on message
            context_type = self._determine_context_type(message)
            
            # Generate response using RAG system
            response_data = self.response_generator.generate_response(
                query=message,
                user_profile=user_profile,
                conversation_history=conversation_history,
                context_type=context_type
            )
            
            # Apply personality adjustments
            response_data["response"] = self.personality_manager.apply_personality(
                response_data["response"], user_profile
            )
            
            return response_data
            
        except Exception as e:
            logger.error(f"Error generating chat response: {e}")
            return {
                "response": "I'm sorry, I'm having trouble generating a response right now. Please try again! 😅",
                "metadata": {"error": str(e)},
                "recommendations": []
            }
    
    def _determine_context_type(self, message: str) -> str:
        """Determine what type of context to retrieve"""
        try:
            message_lower = message.lower()
            
            # Check for market-related queries
            market_keywords = ["stock", "price", "market", "trading", "buy", "sell", "portfolio"]
            if any(keyword in message_lower for keyword in market_keywords):
                return "market"
            
            # Check for news-related queries
            news_keywords = ["news", "update", "recent", "latest", "happening"]
            if any(keyword in message_lower for keyword in news_keywords):
                return "news"
            
            # Default to educational content
            return "educational"
            
        except Exception as e:
            logger.error(f"Error determining context type: {e}")
            return "educational"
    
    async def _update_conversation(self, conversation: Dict[str, Any], 
                                 user_message: str, bot_response: str, user_id: str):
        """Update conversation with new messages"""
        try:
            # Add user message
            user_message_data = {
                "role": "user",
                "content": user_message,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            # Add bot response
            bot_message_data = {
                "role": "assistant",
                "content": bot_response,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            # Update conversation
            conversation["messages"].append(user_message_data)
            conversation["messages"].append(bot_message_data)
            conversation["last_updated"] = datetime.utcnow().isoformat()
            
            # Save to database
            await self.conversation_manager.save_conversation(conversation)
            
        except Exception as e:
            logger.error(f"Error updating conversation: {e}")
    
    async def _track_user_engagement(self, user_id: str, message: str, response_data: Dict[str, Any]):
        """Track user engagement metrics"""
        try:
            engagement_data = {
                "user_id": user_id,
                "message_length": len(message),
                "response_type": response_data.get("metadata", {}).get("response_type", "general"),
                "context_used": response_data.get("metadata", {}).get("context_used", 0),
                "timestamp": datetime.utcnow().isoformat(),
                "session_id": response_data.get("metadata", {}).get("session_id")
            }
            
            await firestore_client.track_user_engagement(user_id, engagement_data)
            
        except Exception as e:
            logger.error(f"Error tracking user engagement: {e}")
    
    def _create_error_response(self, error_message: str) -> Dict[str, Any]:
        """Create standardized error response"""
        return {
            "success": False,
            "response": error_message,
            "error": True,
            "metadata": {
                "error_type": "general_error",
                "generated_at": datetime.utcnow().isoformat()
            }
        }
    
    def _create_safety_response(self, safety_reason: str) -> Dict[str, Any]:
        """Create safety-related response"""
        return {
            "success": False,
            "response": "I want to make sure I'm giving you the right kind of help. Could you rephrase your question in a way that's more focused on learning about investing? 🛡️",
            "error": True,
            "safety_concern": True,
            "metadata": {
                "error_type": "safety_concern",
                "safety_reason": safety_reason,
                "generated_at": datetime.utcnow().isoformat()
            }
        }
    
    async def start_conversation(self, user_id: str, session_id: str = None) -> Dict[str, Any]:
        """Start a new conversation"""
        try:
            logger.info(f"Starting new conversation for user: {user_id}")
            
            # Create new conversation
            conversation = await self.conversation_manager.create_conversation(user_id, session_id)
            
            # Get conversation starter
            starter_message = self.personality_manager.get_conversation_starter()
            
            # Add starter message to conversation
            starter_data = {
                "role": "assistant",
                "content": starter_message,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            conversation["messages"].append(starter_data)
            await self.conversation_manager.save_conversation(conversation)
            
            return {
                "success": True,
                "response": starter_message,
                "session_id": conversation.get("session_id"),
                "conversation_id": conversation.get("id"),
                "metadata": {
                    "conversation_started": True,
                    "generated_at": datetime.utcnow().isoformat()
                }
            }
            
        except Exception as e:
            logger.error(f"Error starting conversation: {e}")
            return self._create_error_response("I'm having trouble starting our conversation. Please try again! 😅")
    
    async def end_conversation(self, user_id: str, session_id: str) -> Dict[str, Any]:
        """End a conversation"""
        try:
            logger.info(f"Ending conversation for user: {user_id}, session: {session_id}")
            
            # Get conversation
            conversation = await self.conversation_manager.get_conversation(user_id, session_id)
            
            if conversation:
                # Mark conversation as ended
                conversation["ended"] = True
                conversation["ended_at"] = datetime.utcnow().isoformat()
                
                # Save updated conversation
                await self.conversation_manager.save_conversation(conversation)
                
                return {
                    "success": True,
                    "message": "Conversation ended successfully",
                    "metadata": {
                        "conversation_ended": True,
                        "ended_at": datetime.utcnow().isoformat()
                    }
                }
            else:
                return {
                    "success": False,
                    "message": "Conversation not found",
                    "error": True
                }
                
        except Exception as e:
            logger.error(f"Error ending conversation: {e}")
            return {
                "success": False,
                "message": "Error ending conversation",
                "error": True
            }
    
    async def get_conversation_history(self, user_id: str, session_id: str = None, 
                                     limit: int = 50) -> Dict[str, Any]:
        """Get conversation history"""
        try:
            logger.info(f"Getting conversation history for user: {user_id}")
            
            if session_id:
                # Get specific conversation
                conversation = await self.conversation_manager.get_conversation(user_id, session_id)
                if conversation:
                    return {
                        "success": True,
                        "conversation": conversation,
                        "metadata": {
                            "conversation_id": conversation.get("id"),
                            "message_count": len(conversation.get("messages", [])),
                            "retrieved_at": datetime.utcnow().isoformat()
                        }
                    }
                else:
                    return {
                        "success": False,
                        "message": "Conversation not found",
                        "error": True
                    }
            else:
                # Get all conversations for user
                conversations = await self.conversation_manager.get_user_conversations(user_id, limit)
                
                return {
                    "success": True,
                    "conversations": conversations,
                    "metadata": {
                        "conversation_count": len(conversations),
                        "retrieved_at": datetime.utcnow().isoformat()
                    }
                }
                
        except Exception as e:
            logger.error(f"Error getting conversation history: {e}")
            return {
                "success": False,
                "message": "Error retrieving conversation history",
                "error": True
            }
    
    async def provide_feedback(self, conversation_id: str, feedback_data: Dict[str, Any]) -> Dict[str, Any]:
        """Provide feedback on chatbot response"""
        try:
            logger.info(f"Providing feedback for conversation: {conversation_id}")
            
            # Validate feedback data
            if not feedback_data.get("rating") or not feedback_data.get("feedback_type"):
                return {
                    "success": False,
                    "message": "Invalid feedback data",
                    "error": True
                }
            
            # Save feedback
            success = await firestore_client.update_conversation_feedback(conversation_id, feedback_data)
            
            if success:
                return {
                    "success": True,
                    "message": "Feedback saved successfully",
                    "metadata": {
                        "conversation_id": conversation_id,
                        "feedback_saved_at": datetime.utcnow().isoformat()
                    }
                }
            else:
                return {
                    "success": False,
                    "message": "Error saving feedback",
                    "error": True
                }
                
        except Exception as e:
            logger.error(f"Error providing feedback: {e}")
            return {
                "success": False,
                "message": "Error processing feedback",
                "error": True
            }
    
    async def get_chat_stats(self, user_id: str) -> Dict[str, Any]:
        """Get chat statistics for user"""
        try:
            logger.info(f"Getting chat stats for user: {user_id}")
            
            # Get user analytics
            user_analytics = await firestore_client.get_user_analytics(user_id, days=30)
            
            # Calculate stats
            total_interactions = user_analytics.get("total_interactions", 0)
            total_conversations = user_analytics.get("total_conversations", 0)
            
            # Get conversation history
            conversations = await self.conversation_manager.get_user_conversations(user_id, limit=100)
            
            # Calculate additional stats
            total_messages = sum(len(conv.get("messages", [])) for conv in conversations)
            avg_messages_per_conversation = total_messages / max(total_conversations, 1)
            
            return {
                "success": True,
                "stats": {
                    "total_interactions": total_interactions,
                    "total_conversations": total_conversations,
                    "total_messages": total_messages,
                    "avg_messages_per_conversation": round(avg_messages_per_conversation, 2),
                    "period": "30 days",
                    "generated_at": datetime.utcnow().isoformat()
                }
            }
            
        except Exception as e:
            logger.error(f"Error getting chat stats: {e}")
            return {
                "success": False,
                "message": "Error retrieving chat statistics",
                "error": True
            }


# Global chat handler instance
chat_handler = ChatHandler()
