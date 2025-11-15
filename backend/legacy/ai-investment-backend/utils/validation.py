"""
Validation utilities for the AI Investment Backend
"""
import re
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, date
from config.settings import EDUCATIONAL_CATEGORIES, RISK_LEVELS, BUDGET_RANGES

logger = logging.getLogger(__name__)


def validate_user_id(user_id: str) -> bool:
    """Validate user ID format"""
    try:
        if not user_id or not isinstance(user_id, str):
            return False
        
        # User ID should be alphanumeric and between 3-50 characters
        if not re.match(r'^[a-zA-Z0-9_-]{3,50}$', user_id):
            return False
        
        return True
        
    except Exception as e:
        logger.error(f"Error validating user ID: {e}")
        return False


def validate_age(age: int) -> bool:
    """Validate user age"""
    try:
        if not isinstance(age, int):
            return False
        
        # Age should be between 13 and 19 for teen users
        if age < 13 or age > 19:
            return False
        
        return True
        
    except Exception as e:
        logger.error(f"Error validating age: {e}")
        return False


def validate_experience_level(experience_level: str) -> bool:
    """Validate experience level"""
    try:
        if not experience_level or not isinstance(experience_level, str):
            return False
        
        valid_levels = ["beginner", "intermediate", "advanced"]
        return experience_level.lower() in valid_levels
        
    except Exception as e:
        logger.error(f"Error validating experience level: {e}")
        return False


def validate_interests(interests: List[str]) -> bool:
    """Validate user interests"""
    try:
        if not interests or not isinstance(interests, list):
            return False
        
        # Check if all interests are valid categories
        for interest in interests:
            if not isinstance(interest, str) or interest not in EDUCATIONAL_CATEGORIES:
                return False
        
        # Should have at least 1 interest and at most 10
        if len(interests) < 1 or len(interests) > 10:
            return False
        
        # No duplicates
        if len(interests) != len(set(interests)):
            return False
        
        return True
        
    except Exception as e:
        logger.error(f"Error validating interests: {e}")
        return False


def validate_risk_tolerance(risk_tolerance: str) -> bool:
    """Validate risk tolerance"""
    try:
        if not risk_tolerance or not isinstance(risk_tolerance, str):
            return False
        
        return risk_tolerance.lower() in RISK_LEVELS
        
    except Exception as e:
        logger.error(f"Error validating risk tolerance: {e}")
        return False


def validate_budget_range(budget_range: str) -> bool:
    """Validate budget range"""
    try:
        if not budget_range or not isinstance(budget_range, str):
            return False
        
        return budget_range.lower() in BUDGET_RANGES
        
    except Exception as e:
        logger.error(f"Error validating budget range: {e}")
        return False


def validate_message_content(message: str) -> bool:
    """Validate chat message content"""
    try:
        if not message or not isinstance(message, str):
            return False
        
        # Message should be between 1 and 1000 characters
        if len(message.strip()) < 1 or len(message) > 1000:
            return False
        
        # Check for potentially harmful content
        harmful_patterns = [
            r'<script.*?>.*?</script>',  # Script tags
            r'javascript:',  # JavaScript URLs
            r'data:.*?base64',  # Data URLs
            r'<iframe.*?>.*?</iframe>',  # Iframe tags
        ]
        
        for pattern in harmful_patterns:
            if re.search(pattern, message, re.IGNORECASE):
                return False
        
        return True
        
    except Exception as e:
        logger.error(f"Error validating message content: {e}")
        return False


def validate_email(email: str) -> bool:
    """Validate email format"""
    try:
        if not email or not isinstance(email, str):
            return False
        
        # Basic email regex
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(email_pattern, email) is not None
        
    except Exception as e:
        logger.error(f"Error validating email: {e}")
        return False


def validate_phone_number(phone: str) -> bool:
    """Validate phone number format"""
    try:
        if not phone or not isinstance(phone, str):
            return False
        
        # Remove all non-digit characters
        digits_only = re.sub(r'\D', '', phone)
        
        # Should be 10 digits for US phone numbers
        return len(digits_only) == 10
        
    except Exception as e:
        logger.error(f"Error validating phone number: {e}")
        return False


def validate_stock_symbol(symbol: str) -> bool:
    """Validate stock symbol format"""
    try:
        if not symbol or not isinstance(symbol, str):
            return False
        
        # Stock symbols should be 1-5 uppercase letters
        return re.match(r'^[A-Z]{1,5}$', symbol) is not None
        
    except Exception as e:
        logger.error(f"Error validating stock symbol: {e}")
        return False


def validate_url(url: str) -> bool:
    """Validate URL format"""
    try:
        if not url or not isinstance(url, str):
            return False
        
        # Basic URL regex
        url_pattern = r'^https?://[^\s/$.?#].[^\s]*$'
        return re.match(url_pattern, url) is not None
        
    except Exception as e:
        logger.error(f"Error validating URL: {e}")
        return False


def validate_date_format(date_string: str) -> bool:
    """Validate ISO date format"""
    try:
        if not date_string or not isinstance(date_string, str):
            return False
        
        # Try to parse ISO format
        datetime.fromisoformat(date_string.replace('Z', '+00:00'))
        return True
        
    except Exception as e:
        logger.error(f"Error validating date format: {e}")
        return False


def validate_rating(rating: int) -> bool:
    """Validate rating value"""
    try:
        if not isinstance(rating, int):
            return False
        
        # Rating should be between 1 and 5
        return 1 <= rating <= 5
        
    except Exception as e:
        logger.error(f"Error validating rating: {e}")
        return False


def validate_pagination_params(page: int, limit: int) -> bool:
    """Validate pagination parameters"""
    try:
        if not isinstance(page, int) or not isinstance(limit, int):
            return False
        
        # Page should be >= 1, limit should be between 1 and 100
        return page >= 1 and 1 <= limit <= 100
        
    except Exception as e:
        logger.error(f"Error validating pagination params: {e}")
        return False


def validate_search_query(query: str) -> bool:
    """Validate search query"""
    try:
        if not query or not isinstance(query, str):
            return False
        
        # Query should be between 1 and 200 characters
        if len(query.strip()) < 1 or len(query) > 200:
            return False
        
        # Check for potentially harmful content
        harmful_patterns = [
            r'<script.*?>.*?</script>',
            r'javascript:',
            r'<iframe.*?>.*?</iframe>',
        ]
        
        for pattern in harmful_patterns:
            if re.search(pattern, query, re.IGNORECASE):
                return False
        
        return True
        
    except Exception as e:
        logger.error(f"Error validating search query: {e}")
        return False


def validate_content_id(content_id: str) -> bool:
    """Validate content ID format"""
    try:
        if not content_id or not isinstance(content_id, str):
            return False
        
        # Content ID should be alphanumeric and between 5-50 characters
        return re.match(r'^[a-zA-Z0-9_-]{5,50}$', content_id) is not None
        
    except Exception as e:
        logger.error(f"Error validating content ID: {e}")
        return False


def validate_session_id(session_id: str) -> bool:
    """Validate session ID format"""
    try:
        if not session_id or not isinstance(session_id, str):
            return False
        
        # Session ID should be a valid UUID format
        uuid_pattern = r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        return re.match(uuid_pattern, session_id, re.IGNORECASE) is not None
        
    except Exception as e:
        logger.error(f"Error validating session ID: {e}")
        return False


def validate_feedback_type(feedback_type: str) -> bool:
    """Validate feedback type"""
    try:
        if not feedback_type or not isinstance(feedback_type, str):
            return False
        
        valid_types = [
            "helpful", "not_helpful", "accurate", "inaccurate",
            "appropriate", "inappropriate", "clear", "unclear",
            "relevant", "irrelevant", "complete", "incomplete"
        ]
        
        return feedback_type.lower() in valid_types
        
    except Exception as e:
        logger.error(f"Error validating feedback type: {e}")
        return False


def validate_difficulty_level(difficulty: str) -> bool:
    """Validate difficulty level"""
    try:
        if not difficulty or not isinstance(difficulty, str):
            return False
        
        valid_levels = ["beginner", "intermediate", "advanced"]
        return difficulty.lower() in valid_levels
        
    except Exception as e:
        logger.error(f"Error validating difficulty level: {e}")
        return False


def validate_category(category: str) -> bool:
    """Validate content category"""
    try:
        if not category or not isinstance(category, str):
            return False
        
        return category.lower() in [cat.lower() for cat in EDUCATIONAL_CATEGORIES]
        
    except Exception as e:
        logger.error(f"Error validating category: {e}")
        return False


def validate_time_period(time_period: str) -> bool:
    """Validate time period for analytics"""
    try:
        if not time_period or not isinstance(time_period, str):
            return False
        
        valid_periods = ["day", "week", "month", "quarter", "year"]
        return time_period.lower() in valid_periods
        
    except Exception as e:
        logger.error(f"Error validating time period: {e}")
        return False


def sanitize_input(input_string: str) -> str:
    """Sanitize user input"""
    try:
        if not input_string or not isinstance(input_string, str):
            return ""
        
        # Remove HTML tags
        sanitized = re.sub(r'<[^>]+>', '', input_string)
        
        # Remove potentially harmful characters
        sanitized = re.sub(r'[<>"\']', '', sanitized)
        
        # Trim whitespace
        sanitized = sanitized.strip()
        
        return sanitized
        
    except Exception as e:
        logger.error(f"Error sanitizing input: {e}")
        return ""


def validate_user_profile(profile: Dict[str, Any]) -> Dict[str, List[str]]:
    """Validate complete user profile and return validation errors"""
    errors = {}
    
    try:
        # Validate required fields
        if not profile.get("user_id"):
            errors["user_id"] = ["User ID is required"]
        elif not validate_user_id(profile["user_id"]):
            errors["user_id"] = ["Invalid user ID format"]
        
        if not profile.get("age"):
            errors["age"] = ["Age is required"]
        elif not validate_age(profile["age"]):
            errors["age"] = ["Age must be between 13 and 19"]
        
        if not profile.get("experience_level"):
            errors["experience_level"] = ["Experience level is required"]
        elif not validate_experience_level(profile["experience_level"]):
            errors["experience_level"] = ["Invalid experience level"]
        
        if not profile.get("interests"):
            errors["interests"] = ["At least one interest is required"]
        elif not validate_interests(profile["interests"]):
            errors["interests"] = ["Invalid interests"]
        
        # Validate optional fields
        if profile.get("risk_tolerance") and not validate_risk_tolerance(profile["risk_tolerance"]):
            errors["risk_tolerance"] = ["Invalid risk tolerance"]
        
        if profile.get("budget_range") and not validate_budget_range(profile["budget_range"]):
            errors["budget_range"] = ["Invalid budget range"]
        
        return errors
        
    except Exception as e:
        logger.error(f"Error validating user profile: {e}")
        return {"general": ["Validation error occurred"]}


def validate_api_request(request_data: Dict[str, Any], required_fields: List[str]) -> Dict[str, List[str]]:
    """Validate API request data"""
    errors = {}
    
    try:
        # Check required fields
        for field in required_fields:
            if field not in request_data or request_data[field] is None:
                errors[field] = [f"{field} is required"]
        
        return errors
        
    except Exception as e:
        logger.error(f"Error validating API request: {e}")
        return {"general": ["Validation error occurred"]}
