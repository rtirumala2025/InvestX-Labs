"""
Response generator for RAG system to generate personalized responses
"""
import logging
import openai
from typing import Dict, Any, List, Optional
from datetime import datetime
from config.settings import settings
from config.model_config import MODEL_CONFIGS, RAG_CONFIG
from config.prompts import SYSTEM_PROMPTS, FINLEY_PERSONALITY
from ai_models.rag_system.context_retriever import context_retriever

logger = logging.getLogger(__name__)


class ResponseGenerator:
    """Response generator for RAG system"""
    
    def __init__(self):
        """Initialize response generator"""
        openai.api_key = settings.openai_api_key
        self.model_config = MODEL_CONFIGS["chat"]
        self.retrieval_weight = RAG_CONFIG["retrieval_weight"]
        self.generation_weight = RAG_CONFIG["generation_weight"]
    
    def generate_response(self, query: str, user_profile: Dict[str, Any] = None,
                         conversation_history: List[Dict[str, Any]] = None,
                         context_type: str = "educational") -> Dict[str, Any]:
        """Generate personalized response using RAG"""
        try:
            logger.info(f"Generating response for query: {query[:50]}...")
            
            # Retrieve relevant context
            context_data = context_retriever.retrieve_context(
                query=query,
                user_profile=user_profile,
                conversation_history=conversation_history,
                context_type=context_type
            )
            
            # Determine response type and system prompt
            response_type = self._determine_response_type(query, context_data)
            system_prompt = self._get_system_prompt(response_type, user_profile)
            
            # Format context for prompt
            formatted_context = context_retriever.format_context_for_prompt(context_data)
            
            # Generate response
            response = self._generate_ai_response(
                query=query,
                system_prompt=system_prompt,
                context=formatted_context,
                user_profile=user_profile,
                conversation_history=conversation_history
            )
            
            # Post-process response
            processed_response = self._post_process_response(
                response=response,
                context_data=context_data,
                user_profile=user_profile
            )
            
            # Create response metadata
            response_metadata = {
                "query": query,
                "response_type": response_type,
                "context_used": len(context_data.get("educational_content", [])),
                "generated_at": datetime.utcnow().isoformat(),
                "model_used": self.model_config["model"],
                "user_profile": user_profile,
                "conversation_length": len(conversation_history) if conversation_history else 0
            }
            
            return {
                "response": processed_response,
                "metadata": response_metadata,
                "context_data": context_data,
                "recommendations": context_data.get("recommendations", [])
            }
            
        except Exception as e:
            logger.error(f"Error generating response: {e}")
            return {
                "response": "I'm sorry, I'm having trouble processing your request right now. Please try again! 😅",
                "metadata": {"error": str(e)},
                "context_data": {},
                "recommendations": []
            }
    
    def _determine_response_type(self, query: str, context_data: Dict[str, Any]) -> str:
        """Determine the type of response needed"""
        try:
            query_lower = query.lower()
            
            # Check for specific response types
            if any(word in query_lower for word in ["explain", "what is", "how does", "tell me about"]):
                return "explanation"
            elif any(word in query_lower for word in ["how to", "steps", "guide", "walk me through"]):
                return "guidance"
            elif any(word in query_lower for word in ["risk", "safe", "dangerous", "risky"]):
                return "risk_assessment"
            elif any(word in query_lower for word in ["diversify", "portfolio", "spread", "balance"]):
                return "portfolio_diversification"
            elif any(word in query_lower for word in ["market", "stock", "price", "trading"]):
                return "market_explanation"
            elif any(word in query_lower for word in ["quiz", "test", "question", "check"]):
                return "quiz_mode"
            else:
                return "general"
                
        except Exception as e:
            logger.error(f"Error determining response type: {e}")
            return "general"
    
    def _get_system_prompt(self, response_type: str, user_profile: Dict[str, Any] = None) -> str:
        """Get appropriate system prompt based on response type"""
        try:
            base_prompt = SYSTEM_PROMPTS.get(response_type, SYSTEM_PROMPTS["general"])
            
            # Customize prompt based on user profile
            if user_profile:
                age = user_profile.get("age", 16)
                experience = user_profile.get("experience_level", "beginner")
                
                # Add age-specific guidance
                if age < 16:
                    base_prompt += "\n\nFocus on basic concepts and simple explanations suitable for younger teens."
                elif age > 18:
                    base_prompt += "\n\nYou can include more advanced concepts and detailed explanations."
                
                # Add experience-specific guidance
                if experience == "beginner":
                    base_prompt += "\n\nUse simple language and avoid jargon. Explain everything step by step."
                elif experience == "advanced":
                    base_prompt += "\n\nYou can use more technical terms and provide detailed analysis."
            
            return base_prompt
            
        except Exception as e:
            logger.error(f"Error getting system prompt: {e}")
            return SYSTEM_PROMPTS["general"]
    
    def _generate_ai_response(self, query: str, system_prompt: str, context: str,
                            user_profile: Dict[str, Any] = None,
                            conversation_history: List[Dict[str, Any]] = None) -> str:
        """Generate AI response using OpenAI"""
        try:
            # Build messages
            messages = [
                {"role": "system", "content": system_prompt}
            ]
            
            # Add conversation history if available
            if conversation_history:
                # Add last few messages for context
                recent_history = conversation_history[-3:]  # Last 3 messages
                for msg in recent_history:
                    messages.append({
                        "role": "user" if msg.get("role") == "user" else "assistant",
                        "content": msg.get("content", "")
                    })
            
            # Add context if available
            if context:
                context_message = f"Here's some relevant information to help answer the question:\n\n{context}\n\n"
                messages.append({"role": "system", "content": context_message})
            
            # Add current query
            messages.append({"role": "user", "content": query})
            
            # Generate response
            response = openai.ChatCompletion.create(
                model=self.model_config["model"],
                messages=messages,
                temperature=self.model_config["temperature"],
                max_tokens=self.model_config["max_tokens"],
                top_p=self.model_config["top_p"],
                frequency_penalty=self.model_config["frequency_penalty"],
                presence_penalty=self.model_config["presence_penalty"]
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"Error generating AI response: {e}")
            return "I'm sorry, I'm having trouble generating a response right now. Please try again! 😅"
    
    def _post_process_response(self, response: str, context_data: Dict[str, Any],
                             user_profile: Dict[str, Any] = None) -> str:
        """Post-process the generated response"""
        try:
            # Add safety disclaimers if needed
            if self._needs_safety_disclaimer(response):
                response += "\n\n" + self._get_safety_disclaimer()
            
            # Add follow-up suggestions
            if self._should_add_follow_up(response):
                response += "\n\n" + self._get_follow_up_suggestion(context_data)
            
            # Add encouragement if appropriate
            if self._should_add_encouragement(response, user_profile):
                response += "\n\n" + self._get_encouragement_message()
            
            # Ensure response is teen-friendly
            response = self._make_teen_friendly(response)
            
            return response
            
        except Exception as e:
            logger.error(f"Error post-processing response: {e}")
            return response
    
    def _needs_safety_disclaimer(self, response: str) -> bool:
        """Check if response needs safety disclaimer"""
        try:
            # Keywords that might need disclaimers
            disclaimer_keywords = [
                "invest", "buy", "sell", "recommend", "suggest", "advise",
                "guarantee", "promise", "risk-free", "sure thing"
            ]
            
            response_lower = response.lower()
            return any(keyword in response_lower for keyword in disclaimer_keywords)
            
        except Exception as e:
            logger.error(f"Error checking safety disclaimer need: {e}")
            return False
    
    def _get_safety_disclaimer(self) -> str:
        """Get appropriate safety disclaimer"""
        from config.prompts import SAFETY_DISCLAIMERS
        import random
        
        return random.choice(SAFETY_DISCLAIMERS)
    
    def _should_add_follow_up(self, response: str) -> bool:
        """Check if response should include follow-up suggestions"""
        try:
            # Add follow-up if response is educational and not too long
            return len(response) < 500 and any(word in response.lower() for word in ["learn", "understand", "know", "explain"])
            
        except Exception as e:
            logger.error(f"Error checking follow-up need: {e}")
            return False
    
    def _get_follow_up_suggestion(self, context_data: Dict[str, Any]) -> str:
        """Get follow-up suggestion based on context"""
        try:
            from config.prompts import FOLLOW_UP_QUESTIONS
            import random
            
            # Get related topics for more specific suggestions
            related_topics = context_data.get("related_topics", [])
            
            if related_topics:
                topic = related_topics[0]
                return f"Want to learn more about {topic}? Just ask! 😊"
            else:
                return random.choice(FOLLOW_UP_QUESTIONS)
                
        except Exception as e:
            logger.error(f"Error getting follow-up suggestion: {e}")
            return "Have any other questions? I'm here to help! 😊"
    
    def _should_add_encouragement(self, response: str, user_profile: Dict[str, Any] = None) -> bool:
        """Check if response should include encouragement"""
        try:
            # Add encouragement for beginners or if response is educational
            if user_profile and user_profile.get("experience_level") == "beginner":
                return True
            
            return any(word in response.lower() for word in ["learn", "understand", "great question", "good question"])
            
        except Exception as e:
            logger.error(f"Error checking encouragement need: {e}")
            return False
    
    def _get_encouragement_message(self) -> str:
        """Get encouragement message"""
        from config.prompts import ENCOURAGEMENT_MESSAGES
        import random
        
        return random.choice(ENCOURAGEMENT_MESSAGES)
    
    def _make_teen_friendly(self, response: str) -> str:
        """Make response more teen-friendly"""
        try:
            # Replace formal language with casual language
            replacements = {
                "Furthermore": "Also",
                "Moreover": "Plus",
                "Therefore": "So",
                "However": "But",
                "Nevertheless": "Still",
                "Consequently": "So",
                "In conclusion": "To wrap up",
                "It is important to note": "Just so you know",
                "It should be noted": "Keep in mind"
            }
            
            for formal, casual in replacements.items():
                response = response.replace(formal, casual)
            
            # Ensure appropriate emoji usage
            if not any(emoji in response for emoji in ["😊", "💡", "💰", "📈", "🎯", "🚀", "⭐", "👍"]):
                # Add a friendly emoji if none present
                response += " 😊"
            
            return response
            
        except Exception as e:
            logger.error(f"Error making response teen-friendly: {e}")
            return response
    
    def generate_quiz_question(self, topic: str, difficulty: str = "beginner") -> Dict[str, Any]:
        """Generate a quiz question on a specific topic"""
        try:
            prompt = f"""
            Generate a quiz question about {topic} for a {difficulty} level teen investor.
            
            The question should be:
            - Age-appropriate for teenagers
            - Educational and informative
            - Not too easy or too hard
            - Include 4 multiple choice options
            - Have a clear correct answer
            - Include a brief explanation
            
            Format as JSON with:
            {{
                "question": "Question text",
                "options": ["A", "B", "C", "D"],
                "correct_answer": "A",
                "explanation": "Why this answer is correct"
            }}
            """
            
            response = openai.ChatCompletion.create(
                model=self.model_config["model"],
                messages=[
                    {"role": "system", "content": "You are Finley, creating educational quiz questions for teen investors."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=300
            )
            
            # Parse response
            import json
            try:
                quiz_data = json.loads(response.choices[0].message.content)
                return quiz_data
            except json.JSONDecodeError:
                # Fallback if JSON parsing fails
                return {
                    "question": f"What should you know about {topic}?",
                    "options": ["Option A", "Option B", "Option C", "Option D"],
                    "correct_answer": "A",
                    "explanation": "This is the correct answer because..."
                }
            
        except Exception as e:
            logger.error(f"Error generating quiz question: {e}")
            return {
                "question": f"What should you know about {topic}?",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "correct_answer": "A",
                "explanation": "This is the correct answer because..."
            }
    
    def generate_market_explanation(self, symbol: str, market_data: Dict[str, Any]) -> str:
        """Generate explanation for market movements"""
        try:
            name = market_data.get("name", symbol)
            price = market_data.get("current_price", 0)
            change = market_data.get("price_change", 0)
            percent_change = market_data.get("percent_change", 0)
            
            prompt = f"""
            Explain why {name} ({symbol}) stock moved the way it did today in simple terms for a teenager.
            
            Current data:
            - Price: ${price}
            - Change: ${change} ({percent_change}%)
            
            Make it:
            - Easy to understand
            - Educational
            - Not too technical
            - Encouraging about learning
            """
            
            response = openai.ChatCompletion.create(
                model=self.model_config["model"],
                messages=[
                    {"role": "system", "content": "You are Finley, explaining market movements to teen investors in simple terms."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=300
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"Error generating market explanation: {e}")
            return f"Great question about {symbol}! Stock prices can move for many reasons - let me help you understand what might be happening! 📈"
    
    def generate_learning_path(self, user_profile: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate personalized learning path for user"""
        try:
            interests = user_profile.get("interests", [])
            experience = user_profile.get("experience_level", "beginner")
            age = user_profile.get("age", 16)
            
            prompt = f"""
            Create a personalized learning path for a {age}-year-old {experience} investor interested in: {', '.join(interests)}
            
            The learning path should include:
            - 5-7 topics in logical order
            - Each topic with a brief description
            - Estimated time to complete
            - Prerequisites if any
            
            Format as JSON array of objects with:
            {{
                "topic": "Topic name",
                "description": "What they'll learn",
                "estimated_time": "X minutes",
                "prerequisites": ["prerequisite1", "prerequisite2"],
                "order": 1
            }}
            """
            
            response = openai.ChatCompletion.create(
                model=self.model_config["model"],
                messages=[
                    {"role": "system", "content": "You are Finley, creating personalized learning paths for teen investors."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=500
            )
            
            # Parse response
            import json
            try:
                learning_path = json.loads(response.choices[0].message.content)
                return learning_path
            except json.JSONDecodeError:
                # Fallback learning path
                return self._get_fallback_learning_path(experience)
            
        except Exception as e:
            logger.error(f"Error generating learning path: {e}")
            return self._get_fallback_learning_path(experience)
    
    def _get_fallback_learning_path(self, experience: str) -> List[Dict[str, Any]]:
        """Get fallback learning path"""
        if experience == "beginner":
            return [
                {"topic": "Investment Basics", "description": "Learn what investing means and why it matters", "estimated_time": "10 minutes", "prerequisites": [], "order": 1},
                {"topic": "Risk and Return", "description": "Understand the relationship between risk and potential returns", "estimated_time": "15 minutes", "prerequisites": ["Investment Basics"], "order": 2},
                {"topic": "Diversification", "description": "Learn how to spread your investments", "estimated_time": "12 minutes", "prerequisites": ["Risk and Return"], "order": 3},
                {"topic": "Stocks and ETFs", "description": "Understand different types of investments", "estimated_time": "20 minutes", "prerequisites": ["Diversification"], "order": 4},
                {"topic": "Building Your First Portfolio", "description": "Put it all together and start planning", "estimated_time": "15 minutes", "prerequisites": ["Stocks and ETFs"], "order": 5}
            ]
        else:
            return [
                {"topic": "Advanced Portfolio Theory", "description": "Dive deeper into portfolio optimization", "estimated_time": "25 minutes", "prerequisites": [], "order": 1},
                {"topic": "Market Analysis", "description": "Learn to analyze market trends and indicators", "estimated_time": "30 minutes", "prerequisites": ["Advanced Portfolio Theory"], "order": 2},
                {"topic": "Tax Implications", "description": "Understand how taxes affect your investments", "estimated_time": "20 minutes", "prerequisites": ["Market Analysis"], "order": 3}
            ]


# Global response generator instance
response_generator = ResponseGenerator()
