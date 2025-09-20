"""
Safety filters for ensuring appropriate and responsible chatbot responses
"""
import logging
import re
from typing import Dict, Any, List, Optional
from datetime import datetime
from config.settings import settings
from config.model_config import SAFETY_CONFIG

logger = logging.getLogger(__name__)


class SafetyFilters:
    """Safety filters for chatbot responses"""
    
    def __init__(self):
        """Initialize safety filters"""
        self.content_filter_enabled = SAFETY_CONFIG["content_filter_enabled"]
        self.age_verification_required = SAFETY_CONFIG["age_verification_required"]
        self.inappropriate_content_threshold = SAFETY_CONFIG["inappropriate_content_threshold"]
        self.financial_advice_detection = SAFETY_CONFIG["financial_advice_detection"]
        self.scam_detection = SAFETY_CONFIG["scam_detection"]
        self.personal_info_detection = SAFETY_CONFIG["personal_info_detection"]
        
        # Safety patterns
        self._initialize_safety_patterns()
    
    def _initialize_safety_patterns(self):
        """Initialize safety detection patterns"""
        try:
            # Financial advice patterns (things we should avoid)
            self.financial_advice_patterns = [
                r"you should (buy|sell|invest in)",
                r"i recommend (buying|selling|investing in)",
                r"you must (buy|sell|invest in)",
                r"guaranteed (return|profit|gain)",
                r"risk-free (investment|return)",
                r"get rich quick",
                r"make money fast",
                r"insider (tip|information)",
                r"secret (formula|strategy)",
                r"can't lose",
                r"guaranteed to (make|earn)",
                r"promise (profit|return|gain)"
            ]
            
            # Scam detection patterns
            self.scam_patterns = [
                r"send (money|cash|bitcoin)",
                r"wire (money|funds)",
                r"urgent (investment|opportunity)",
                r"limited time (offer|deal)",
                r"act now or (lose|miss)",
                r"exclusive (offer|deal)",
                r"no risk (investment|opportunity)",
                r"double your (money|investment)",
                r"free (money|investment)",
                r"click here to (invest|earn)",
                r"guaranteed (profit|return)",
                r"get rich (quick|fast)"
            ]
            
            # Personal information patterns
            self.personal_info_patterns = [
                r"what's your (name|address|phone|email)",
                r"give me your (social security|ssn|credit card)",
                r"what's your (bank account|routing number)",
                r"share your (personal|private) (info|information)",
                r"tell me your (password|pin|code)"
            ]
            
            # Inappropriate content patterns
            self.inappropriate_patterns = [
                r"(hate|violence|harm|hurt)",
                r"(illegal|unlawful|criminal)",
                r"(adult|sexual|inappropriate)",
                r"(drugs|alcohol|substances)",
                r"(gambling|betting|casino)"
            ]
            
            # Age-inappropriate patterns
            self.age_inappropriate_patterns = [
                r"you're too young to",
                r"adults only",
                r"mature content",
                r"not for kids",
                r"parental guidance"
            ]
            
        except Exception as e:
            logger.error(f"Error initializing safety patterns: {e}")
    
    async def check_message_safety(self, message: str, user_id: str) -> Dict[str, Any]:
        """Check if a message is safe to process"""
        try:
            logger.debug(f"Checking message safety for user {user_id}")
            
            safety_result = {
                "is_safe": True,
                "reason": "",
                "confidence": 1.0,
                "flagged_patterns": [],
                "suggestions": []
            }
            
            # Check for financial advice
            if self.financial_advice_detection:
                advice_result = self._check_financial_advice(message)
                if not advice_result["is_safe"]:
                    safety_result["is_safe"] = False
                    safety_result["reason"] = "Contains financial advice"
                    safety_result["flagged_patterns"].extend(advice_result["patterns"])
                    safety_result["suggestions"].append("Focus on educational content only")
            
            # Check for scam indicators
            if self.scam_detection:
                scam_result = self._check_scam_indicators(message)
                if not scam_result["is_safe"]:
                    safety_result["is_safe"] = False
                    safety_result["reason"] = "Contains scam indicators"
                    safety_result["flagged_patterns"].extend(scam_result["patterns"])
                    safety_result["suggestions"].append("Avoid suspicious investment opportunities")
            
            # Check for personal information requests
            if self.personal_info_detection:
                personal_result = self._check_personal_info_requests(message)
                if not personal_result["is_safe"]:
                    safety_result["is_safe"] = False
                    safety_result["reason"] = "Requests personal information"
                    safety_result["flagged_patterns"].extend(personal_result["patterns"])
                    safety_result["suggestions"].append("Never share personal information")
            
            # Check for inappropriate content
            if self.content_filter_enabled:
                inappropriate_result = self._check_inappropriate_content(message)
                if not inappropriate_result["is_safe"]:
                    safety_result["is_safe"] = False
                    safety_result["reason"] = "Contains inappropriate content"
                    safety_result["flagged_patterns"].extend(inappropriate_result["patterns"])
                    safety_result["suggestions"].append("Keep conversations educational and appropriate")
            
            # Check for age-inappropriate content
            age_result = self._check_age_appropriateness(message)
            if not age_result["is_safe"]:
                safety_result["is_safe"] = False
                safety_result["reason"] = "Not age-appropriate for teens"
                safety_result["flagged_patterns"].extend(age_result["patterns"])
                safety_result["suggestions"].append("Content should be suitable for teenagers")
            
            # Calculate overall confidence
            safety_result["confidence"] = self._calculate_safety_confidence(safety_result)
            
            return safety_result
            
        except Exception as e:
            logger.error(f"Error checking message safety: {e}")
            return {
                "is_safe": False,
                "reason": "Error in safety check",
                "confidence": 0.0,
                "flagged_patterns": [],
                "suggestions": []
            }
    
    def _check_financial_advice(self, message: str) -> Dict[str, Any]:
        """Check for financial advice patterns"""
        try:
            message_lower = message.lower()
            flagged_patterns = []
            
            for pattern in self.financial_advice_patterns:
                if re.search(pattern, message_lower):
                    flagged_patterns.append(pattern)
            
            return {
                "is_safe": len(flagged_patterns) == 0,
                "patterns": flagged_patterns,
                "confidence": 1.0 - (len(flagged_patterns) * 0.2)
            }
            
        except Exception as e:
            logger.error(f"Error checking financial advice: {e}")
            return {"is_safe": True, "patterns": [], "confidence": 1.0}
    
    def _check_scam_indicators(self, message: str) -> Dict[str, Any]:
        """Check for scam indicators"""
        try:
            message_lower = message.lower()
            flagged_patterns = []
            
            for pattern in self.scam_patterns:
                if re.search(pattern, message_lower):
                    flagged_patterns.append(pattern)
            
            return {
                "is_safe": len(flagged_patterns) == 0,
                "patterns": flagged_patterns,
                "confidence": 1.0 - (len(flagged_patterns) * 0.3)
            }
            
        except Exception as e:
            logger.error(f"Error checking scam indicators: {e}")
            return {"is_safe": True, "patterns": [], "confidence": 1.0}
    
    def _check_personal_info_requests(self, message: str) -> Dict[str, Any]:
        """Check for personal information requests"""
        try:
            message_lower = message.lower()
            flagged_patterns = []
            
            for pattern in self.personal_info_patterns:
                if re.search(pattern, message_lower):
                    flagged_patterns.append(pattern)
            
            return {
                "is_safe": len(flagged_patterns) == 0,
                "patterns": flagged_patterns,
                "confidence": 1.0 - (len(flagged_patterns) * 0.4)
            }
            
        except Exception as e:
            logger.error(f"Error checking personal info requests: {e}")
            return {"is_safe": True, "patterns": [], "confidence": 1.0}
    
    def _check_inappropriate_content(self, message: str) -> Dict[str, Any]:
        """Check for inappropriate content"""
        try:
            message_lower = message.lower()
            flagged_patterns = []
            
            for pattern in self.inappropriate_patterns:
                if re.search(pattern, message_lower):
                    flagged_patterns.append(pattern)
            
            return {
                "is_safe": len(flagged_patterns) == 0,
                "patterns": flagged_patterns,
                "confidence": 1.0 - (len(flagged_patterns) * 0.2)
            }
            
        except Exception as e:
            logger.error(f"Error checking inappropriate content: {e}")
            return {"is_safe": True, "patterns": [], "confidence": 1.0}
    
    def _check_age_appropriateness(self, message: str) -> Dict[str, Any]:
        """Check for age-appropriate content"""
        try:
            message_lower = message.lower()
            flagged_patterns = []
            
            for pattern in self.age_inappropriate_patterns:
                if re.search(pattern, message_lower):
                    flagged_patterns.append(pattern)
            
            return {
                "is_safe": len(flagged_patterns) == 0,
                "patterns": flagged_patterns,
                "confidence": 1.0 - (len(flagged_patterns) * 0.3)
            }
            
        except Exception as e:
            logger.error(f"Error checking age appropriateness: {e}")
            return {"is_safe": True, "patterns": [], "confidence": 1.0}
    
    def _calculate_safety_confidence(self, safety_result: Dict[str, Any]) -> float:
        """Calculate overall safety confidence score"""
        try:
            if safety_result["is_safe"]:
                return 1.0
            
            # Reduce confidence based on number of flagged patterns
            pattern_count = len(safety_result["flagged_patterns"])
            confidence = max(0.0, 1.0 - (pattern_count * 0.2))
            
            return confidence
            
        except Exception as e:
            logger.error(f"Error calculating safety confidence: {e}")
            return 0.0
    
    async def check_response_safety(self, response: str, user_id: str) -> Dict[str, Any]:
        """Check if a generated response is safe to send"""
        try:
            logger.debug(f"Checking response safety for user {user_id}")
            
            safety_result = {
                "is_safe": True,
                "reason": "",
                "confidence": 1.0,
                "flagged_patterns": [],
                "suggestions": []
            }
            
            # Check for financial advice in response
            if self.financial_advice_detection:
                advice_result = self._check_financial_advice(response)
                if not advice_result["is_safe"]:
                    safety_result["is_safe"] = False
                    safety_result["reason"] = "Response contains financial advice"
                    safety_result["flagged_patterns"].extend(advice_result["patterns"])
                    safety_result["suggestions"].append("Modify response to be educational only")
            
            # Check for inappropriate content in response
            if self.content_filter_enabled:
                inappropriate_result = self._check_inappropriate_content(response)
                if not inappropriate_result["is_safe"]:
                    safety_result["is_safe"] = False
                    safety_result["reason"] = "Response contains inappropriate content"
                    safety_result["flagged_patterns"].extend(inappropriate_result["patterns"])
                    safety_result["suggestions"].append("Modify response to be appropriate")
            
            # Check for age-appropriate content
            age_result = self._check_age_appropriateness(response)
            if not age_result["is_safe"]:
                safety_result["is_safe"] = False
                safety_result["reason"] = "Response not age-appropriate"
                safety_result["flagged_patterns"].extend(age_result["patterns"])
                safety_result["suggestions"].append("Modify response for teen audience")
            
            # Calculate overall confidence
            safety_result["confidence"] = self._calculate_safety_confidence(safety_result)
            
            return safety_result
            
        except Exception as e:
            logger.error(f"Error checking response safety: {e}")
            return {
                "is_safe": False,
                "reason": "Error in safety check",
                "confidence": 0.0,
                "flagged_patterns": [],
                "suggestions": []
            }
    
    def sanitize_response(self, response: str) -> str:
        """Sanitize response to remove potentially problematic content"""
        try:
            sanitized_response = response
            
            # Remove financial advice patterns
            for pattern in self.financial_advice_patterns:
                sanitized_response = re.sub(pattern, "[Educational content only]", sanitized_response, flags=re.IGNORECASE)
            
            # Remove scam patterns
            for pattern in self.scam_patterns:
                sanitized_response = re.sub(pattern, "[Avoid suspicious offers]", sanitized_response, flags=re.IGNORECASE)
            
            # Remove personal info requests
            for pattern in self.personal_info_patterns:
                sanitized_response = re.sub(pattern, "[Never share personal info]", sanitized_response, flags=re.IGNORECASE)
            
            # Remove inappropriate content
            for pattern in self.inappropriate_patterns:
                sanitized_response = re.sub(pattern, "[Inappropriate content removed]", sanitized_response, flags=re.IGNORECASE)
            
            return sanitized_response
            
        except Exception as e:
            logger.error(f"Error sanitizing response: {e}")
            return response
    
    def add_safety_disclaimer(self, response: str) -> str:
        """Add safety disclaimer to response"""
        try:
            disclaimers = [
                "Remember: This is educational content only, not financial advice! Always do your own research and talk to trusted adults about big financial decisions. 💡",
                "Just a friendly reminder: This is for learning purposes only. Make sure to research thoroughly and involve your parents in major financial decisions! 🛡️",
                "Important: I'm teaching you about investing, but you should always do your own research and get advice from trusted adults! 📚",
                "Keep in mind: This is educational content, not financial advice. Always research and consult with parents or guardians! 🎓"
            ]
            
            # Add disclaimer if response contains investment-related content
            if any(word in response.lower() for word in ["invest", "stock", "portfolio", "buy", "sell"]):
                import random
                disclaimer = random.choice(disclaimers)
                response += f"\n\n{disclaimer}"
            
            return response
            
        except Exception as e:
            logger.error(f"Error adding safety disclaimer: {e}")
            return response
    
    def get_safety_stats(self) -> Dict[str, Any]:
        """Get safety filter statistics"""
        try:
            return {
                "content_filter_enabled": self.content_filter_enabled,
                "age_verification_required": self.age_verification_required,
                "inappropriate_content_threshold": self.inappropriate_content_threshold,
                "financial_advice_detection": self.financial_advice_detection,
                "scam_detection": self.scam_detection,
                "personal_info_detection": self.personal_info_detection,
                "pattern_counts": {
                    "financial_advice_patterns": len(self.financial_advice_patterns),
                    "scam_patterns": len(self.scam_patterns),
                    "personal_info_patterns": len(self.personal_info_patterns),
                    "inappropriate_patterns": len(self.inappropriate_patterns),
                    "age_inappropriate_patterns": len(self.age_inappropriate_patterns)
                },
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting safety stats: {e}")
            return {"error": str(e)}


# Global safety filters instance
safety_filters = SafetyFilters()
