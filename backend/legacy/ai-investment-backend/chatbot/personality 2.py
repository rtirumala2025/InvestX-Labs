"""
Personality manager for Finley - the teen investment education assistant
"""
import logging
import random
from typing import Dict, Any, List, Optional
from datetime import datetime
from config.prompts import (
    FINLEY_PERSONALITY, CONVERSATION_STARTERS, FOLLOW_UP_QUESTIONS,
    CONTENT_SUGGESTIONS, ENCOURAGEMENT_MESSAGES, ERROR_MESSAGES
)

logger = logging.getLogger(__name__)


class PersonalityManager:
    """Manages Finley's personality and conversation style"""
    
    def __init__(self):
        """Initialize personality manager"""
        self.personality = FINLEY_PERSONALITY
        self.conversation_starters = CONVERSATION_STARTERS
        self.follow_up_questions = FOLLOW_UP_QUESTIONS
        self.content_suggestions = CONTENT_SUGGESTIONS
        self.encouragement_messages = ENCOURAGEMENT_MESSAGES
        self.error_messages = ERROR_MESSAGES
        
        # Personality traits
        self.traits = {
            "enthusiasm_level": 0.8,  # High enthusiasm
            "formality_level": 0.2,   # Low formality (casual)
            "emoji_usage": 0.7,       # High emoji usage
            "question_frequency": 0.6, # Moderate question asking
            "encouragement_frequency": 0.8, # High encouragement
            "explanation_detail": 0.7  # Moderate detail level
        }
    
    def apply_personality(self, response: str, user_profile: Dict[str, Any] = None) -> str:
        """Apply Finley's personality to a response"""
        try:
            # Start with the base response
            personalized_response = response
            
            # Adjust based on user profile
            if user_profile:
                personalized_response = self._adjust_for_user_profile(personalized_response, user_profile)
            
            # Apply personality traits
            personalized_response = self._apply_enthusiasm(personalized_response)
            personalized_response = self._apply_casual_tone(personalized_response)
            personalized_response = self._apply_emoji_usage(personalized_response)
            personalized_response = self._apply_encouragement(personalized_response)
            
            # Ensure teen-friendly language
            personalized_response = self._make_teen_friendly(personalized_response)
            
            return personalized_response
            
        except Exception as e:
            logger.error(f"Error applying personality: {e}")
            return response
    
    def _adjust_for_user_profile(self, response: str, user_profile: Dict[str, Any]) -> str:
        """Adjust response based on user profile"""
        try:
            age = user_profile.get("age", 16)
            experience = user_profile.get("experience_level", "beginner")
            
            # Adjust for age
            if age < 16:
                # Younger teens - more simple language, more emojis
                response = self._simplify_language(response)
                response = self._add_more_emojis(response)
            elif age > 18:
                # Older teens - can handle more complex concepts
                response = self._add_more_detail(response)
            
            # Adjust for experience level
            if experience == "beginner":
                # More explanations, simpler terms
                response = self._add_explanations(response)
                response = self._simplify_terms(response)
            elif experience == "advanced":
                # Can use more technical terms
                response = self._add_technical_details(response)
            
            return response
            
        except Exception as e:
            logger.error(f"Error adjusting for user profile: {e}")
            return response
    
    def _apply_enthusiasm(self, response: str) -> str:
        """Apply enthusiasm to response"""
        try:
            if random.random() < self.traits["enthusiasm_level"]:
                # Add enthusiastic words
                enthusiastic_words = ["awesome", "amazing", "fantastic", "great", "wonderful", "exciting"]
                word = random.choice(enthusiastic_words)
                
                # Add at the beginning if not already enthusiastic
                if not any(enth_word in response.lower() for enth_word in enthusiastic_words):
                    response = f"{word.title()} question! {response}"
            
            return response
            
        except Exception as e:
            logger.error(f"Error applying enthusiasm: {e}")
            return response
    
    def _apply_casual_tone(self, response: str) -> str:
        """Apply casual, friendly tone"""
        try:
            # Replace formal language with casual equivalents
            casual_replacements = {
                "Furthermore": "Also",
                "Moreover": "Plus",
                "Therefore": "So",
                "However": "But",
                "Nevertheless": "Still",
                "Consequently": "So",
                "In conclusion": "To wrap up",
                "It is important to note": "Just so you know",
                "It should be noted": "Keep in mind",
                "Please note": "Just a heads up",
                "I recommend": "I'd suggest",
                "You should": "You might want to",
                "It is necessary": "You'll need to"
            }
            
            for formal, casual in casual_replacements.items():
                response = response.replace(formal, casual)
            
            return response
            
        except Exception as e:
            logger.error(f"Error applying casual tone: {e}")
            return response
    
    def _apply_emoji_usage(self, response: str) -> str:
        """Apply appropriate emoji usage"""
        try:
            if random.random() < self.traits["emoji_usage"]:
                # Check if response already has emojis
                if not any(ord(char) > 127 for char in response):  # No emojis present
                    # Add appropriate emoji based on content
                    emoji = self._get_contextual_emoji(response)
                    if emoji:
                        response += f" {emoji}"
            
            return response
            
        except Exception as e:
            logger.error(f"Error applying emoji usage: {e}")
            return response
    
    def _apply_encouragement(self, response: str) -> str:
        """Apply encouragement to response"""
        try:
            if random.random() < self.traits["encouragement_frequency"]:
                # Check if response is educational
                if any(word in response.lower() for word in ["learn", "understand", "know", "explain"]):
                    # Add encouragement
                    encouragement = random.choice(self.encouragement_messages)
                    response += f"\n\n{encouragement}"
            
            return response
            
        except Exception as e:
            logger.error(f"Error applying encouragement: {e}")
            return response
    
    def _simplify_language(self, response: str) -> str:
        """Simplify language for younger teens"""
        try:
            # Replace complex words with simpler ones
            simplifications = {
                "utilize": "use",
                "facilitate": "help",
                "implement": "do",
                "comprehensive": "complete",
                "substantial": "big",
                "significant": "important",
                "approximately": "about",
                "consequently": "so",
                "furthermore": "also",
                "moreover": "plus"
            }
            
            for complex_word, simple_word in simplifications.items():
                response = response.replace(complex_word, simple_word)
            
            return response
            
        except Exception as e:
            logger.error(f"Error simplifying language: {e}")
            return response
    
    def _add_more_emojis(self, response: str) -> str:
        """Add more emojis for younger teens"""
        try:
            # Add emojis based on content
            emoji_mappings = {
                "money": "💰",
                "invest": "📈",
                "learn": "📚",
                "great": "🌟",
                "awesome": "🚀",
                "question": "❓",
                "help": "💡",
                "success": "🎯",
                "fun": "😊",
                "excited": "🤩"
            }
            
            for word, emoji in emoji_mappings.items():
                if word in response.lower() and emoji not in response:
                    response = response.replace(word, f"{word} {emoji}")
            
            return response
            
        except Exception as e:
            logger.error(f"Error adding more emojis: {e}")
            return response
    
    def _add_more_detail(self, response: str) -> str:
        """Add more detail for older teens"""
        try:
            # Add additional context and explanations
            if "stock" in response.lower() and "company" not in response.lower():
                response = response.replace("stock", "stock (which represents ownership in a company)")
            
            if "etf" in response.lower() and "exchange-traded fund" not in response.lower():
                response = response.replace("ETF", "ETF (Exchange-Traded Fund)")
            
            return response
            
        except Exception as e:
            logger.error(f"Error adding more detail: {e}")
            return response
    
    def _add_explanations(self, response: str) -> str:
        """Add explanations for beginners"""
        try:
            # Add explanations for common terms
            explanations = {
                "portfolio": " (your collection of investments)",
                "diversification": " (spreading your money across different investments)",
                "risk": " (the chance that you might lose money)",
                "return": " (the money you make from your investments)",
                "dividend": " (money that companies pay to their shareholders)"
            }
            
            for term, explanation in explanations.items():
                if term in response.lower() and explanation not in response:
                    response = response.replace(term, f"{term}{explanation}")
            
            return response
            
        except Exception as e:
            logger.error(f"Error adding explanations: {e}")
            return response
    
    def _simplify_terms(self, response: str) -> str:
        """Simplify technical terms for beginners"""
        try:
            term_simplifications = {
                "volatility": "ups and downs",
                "liquidity": "how easy it is to buy or sell",
                "asset allocation": "how you spread your money",
                "market capitalization": "how big a company is",
                "price-to-earnings ratio": "how expensive a stock is compared to its profits"
            }
            
            for technical, simple in term_simplifications.items():
                response = response.replace(technical, simple)
            
            return response
            
        except Exception as e:
            logger.error(f"Error simplifying terms: {e}")
            return response
    
    def _add_technical_details(self, response: str) -> str:
        """Add technical details for advanced users"""
        try:
            # Add technical context where appropriate
            if "risk" in response.lower() and "beta" not in response.lower():
                response += " (You might also want to consider beta, which measures how much a stock moves compared to the market)"
            
            return response
            
        except Exception as e:
            logger.error(f"Error adding technical details: {e}")
            return response
    
    def _make_teen_friendly(self, response: str) -> str:
        """Ensure response is teen-friendly"""
        try:
            # Remove any overly formal language
            formal_removals = [
                "Dear", "Sincerely", "Best regards", "Yours truly",
                "Please be advised", "It is my pleasure", "I hope this finds you well"
            ]
            
            for formal_phrase in formal_removals:
                response = response.replace(formal_phrase, "")
            
            # Ensure casual greeting
            if response.startswith("Hello") or response.startswith("Hi there"):
                response = response.replace("Hello", "Hey").replace("Hi there", "Hi")
            
            return response.strip()
            
        except Exception as e:
            logger.error(f"Error making teen-friendly: {e}")
            return response
    
    def _get_contextual_emoji(self, response: str) -> str:
        """Get appropriate emoji based on response content"""
        try:
            response_lower = response.lower()
            
            # Money and investment related
            if any(word in response_lower for word in ["money", "invest", "stock", "portfolio"]):
                return "💰"
            elif any(word in response_lower for word in ["learn", "teach", "explain", "understand"]):
                return "📚"
            elif any(word in response_lower for word in ["great", "awesome", "fantastic", "amazing"]):
                return "🌟"
            elif any(word in response_lower for word in ["question", "ask", "wonder", "curious"]):
                return "❓"
            elif any(word in response_lower for word in ["help", "assist", "guide", "support"]):
                return "💡"
            elif any(word in response_lower for word in ["success", "achieve", "goal", "target"]):
                return "🎯"
            elif any(word in response_lower for word in ["fun", "exciting", "cool", "interesting"]):
                return "😊"
            else:
                return "💡"  # Default emoji
                
        except Exception as e:
            logger.error(f"Error getting contextual emoji: {e}")
            return "💡"
    
    def get_conversation_starter(self) -> str:
        """Get a conversation starter"""
        try:
            return random.choice(self.conversation_starters)
            
        except Exception as e:
            logger.error(f"Error getting conversation starter: {e}")
            return "Hey there! 👋 I'm Finley, your investment education buddy! What would you like to learn about today?"
    
    def get_follow_up_question(self, topic: str = None) -> str:
        """Get a follow-up question"""
        try:
            if topic and topic in self.content_suggestions:
                return random.choice(self.content_suggestions[topic])
            else:
                return random.choice(self.follow_up_questions)
                
        except Exception as e:
            logger.error(f"Error getting follow-up question: {e}")
            return "What else would you like to know?"
    
    def get_encouragement_message(self) -> str:
        """Get an encouragement message"""
        try:
            return random.choice(self.encouragement_messages)
            
        except Exception as e:
            logger.error(f"Error getting encouragement message: {e}")
            return "You're doing great! Keep asking questions - that's how you learn! 🌟"
    
    def get_error_message(self, error_type: str = "not_understood") -> str:
        """Get an appropriate error message"""
        try:
            return self.error_messages.get(error_type, self.error_messages["not_understood"])
            
        except Exception as e:
            logger.error(f"Error getting error message: {e}")
            return "Hmm, I'm not sure I understand that. Could you rephrase your question? I'm here to help! 🤔"
    
    def adjust_personality_traits(self, user_feedback: Dict[str, Any]):
        """Adjust personality traits based on user feedback"""
        try:
            # This would typically involve machine learning to adjust personality
            # For now, we'll use simple rules based on feedback
            
            if user_feedback.get("too_formal"):
                self.traits["formality_level"] = max(0.0, self.traits["formality_level"] - 0.1)
            
            if user_feedback.get("too_casual"):
                self.traits["formality_level"] = min(1.0, self.traits["formality_level"] + 0.1)
            
            if user_feedback.get("too_many_emojis"):
                self.traits["emoji_usage"] = max(0.0, self.traits["emoji_usage"] - 0.1)
            
            if user_feedback.get("not_enough_emojis"):
                self.traits["emoji_usage"] = min(1.0, self.traits["emoji_usage"] + 0.1)
            
            if user_feedback.get("too_enthusiastic"):
                self.traits["enthusiasm_level"] = max(0.0, self.traits["enthusiasm_level"] - 0.1)
            
            if user_feedback.get("not_enthusiastic_enough"):
                self.traits["enthusiasm_level"] = min(1.0, self.traits["enthusiasm_level"] + 0.1)
            
            logger.info(f"Adjusted personality traits: {self.traits}")
            
        except Exception as e:
            logger.error(f"Error adjusting personality traits: {e}")
    
    def get_personality_summary(self) -> Dict[str, Any]:
        """Get summary of current personality traits"""
        try:
            return {
                "traits": self.traits,
                "personality_description": self.personality,
                "last_updated": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting personality summary: {e}")
            return {"error": str(e)}


# Global personality manager instance
personality_manager = PersonalityManager()
