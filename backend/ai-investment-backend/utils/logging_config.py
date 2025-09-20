"""
Logging configuration for the AI Investment Backend
"""
import logging
import logging.config
import sys
from datetime import datetime
from config.settings import settings


def setup_logging():
    """Setup logging configuration"""
    
    # Determine log format based on settings
    if settings.log_format == "json":
        log_format = {
            "format": '{"timestamp": "%(asctime)s", "level": "%(levelname)s", "logger": "%(name)s", "message": "%(message)s", "module": "%(module)s", "function": "%(funcName)s", "line": %(lineno)d}',
            "datefmt": "%Y-%m-%dT%H:%M:%S"
        }
    else:
        log_format = {
            "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            "datefmt": "%Y-%m-%d %H:%M:%S"
        }
    
    # Logging configuration
    logging_config = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "default": log_format,
            "detailed": {
                "format": "%(asctime)s - %(name)s - %(levelname)s - %(module)s - %(funcName)s - %(lineno)d - %(message)s",
                "datefmt": "%Y-%m-%d %H:%M:%S"
            },
            "json": {
                "format": '{"timestamp": "%(asctime)s", "level": "%(levelname)s", "logger": "%(name)s", "message": "%(message)s", "module": "%(module)s", "function": "%(funcName)s", "line": %(lineno)d}',
                "datefmt": "%Y-%m-%dT%H:%M:%S"
            }
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "level": settings.log_level,
                "formatter": "default",
                "stream": sys.stdout
            },
            "file": {
                "class": "logging.handlers.RotatingFileHandler",
                "level": settings.log_level,
                "formatter": "detailed",
                "filename": "logs/ai_investment_backend.log",
                "maxBytes": 10485760,  # 10MB
                "backupCount": 5
            },
            "error_file": {
                "class": "logging.handlers.RotatingFileHandler",
                "level": "ERROR",
                "formatter": "detailed",
                "filename": "logs/errors.log",
                "maxBytes": 10485760,  # 10MB
                "backupCount": 5
            }
        },
        "loggers": {
            "": {  # Root logger
                "level": settings.log_level,
                "handlers": ["console", "file", "error_file"],
                "propagate": False
            },
            "uvicorn": {
                "level": "INFO",
                "handlers": ["console"],
                "propagate": False
            },
            "uvicorn.error": {
                "level": "INFO",
                "handlers": ["console", "error_file"],
                "propagate": False
            },
            "uvicorn.access": {
                "level": "INFO",
                "handlers": ["console"],
                "propagate": False
            },
            "fastapi": {
                "level": "INFO",
                "handlers": ["console"],
                "propagate": False
            },
            "firebase": {
                "level": "WARNING",
                "handlers": ["console"],
                "propagate": False
            },
            "google": {
                "level": "WARNING",
                "handlers": ["console"],
                "propagate": False
            },
            "openai": {
                "level": "INFO",
                "handlers": ["console"],
                "propagate": False
            },
            "anthropic": {
                "level": "INFO",
                "handlers": ["console"],
                "propagate": False
            },
            "sentence_transformers": {
                "level": "WARNING",
                "handlers": ["console"],
                "propagate": False
            },
            "chromadb": {
                "level": "WARNING",
                "handlers": ["console"],
                "propagate": False
            },
            "redis": {
                "level": "WARNING",
                "handlers": ["console"],
                "propagate": False
            }
        }
    }
    
    # Apply logging configuration
    logging.config.dictConfig(logging_config)
    
    # Create logs directory if it doesn't exist
    import os
    os.makedirs("logs", exist_ok=True)
    
    # Log startup message
    logger = logging.getLogger(__name__)
    logger.info("Logging configuration initialized")
    logger.info(f"Log level: {settings.log_level}")
    logger.info(f"Log format: {settings.log_format}")


def get_logger(name: str) -> logging.Logger:
    """Get a logger instance"""
    return logging.getLogger(name)


def log_function_call(func):
    """Decorator to log function calls"""
    def wrapper(*args, **kwargs):
        logger = logging.getLogger(func.__module__)
        logger.debug(f"Calling {func.__name__} with args={args}, kwargs={kwargs}")
        try:
            result = func(*args, **kwargs)
            logger.debug(f"{func.__name__} completed successfully")
            return result
        except Exception as e:
            logger.error(f"{func.__name__} failed with error: {e}")
            raise
    return wrapper


def log_async_function_call(func):
    """Decorator to log async function calls"""
    async def wrapper(*args, **kwargs):
        logger = logging.getLogger(func.__module__)
        logger.debug(f"Calling async {func.__name__} with args={args}, kwargs={kwargs}")
        try:
            result = await func(*args, **kwargs)
            logger.debug(f"Async {func.__name__} completed successfully")
            return result
        except Exception as e:
            logger.error(f"Async {func.__name__} failed with error: {e}")
            raise
    return wrapper


class StructuredLogger:
    """Structured logger for consistent logging format"""
    
    def __init__(self, name: str):
        self.logger = logging.getLogger(name)
    
    def info(self, message: str, **kwargs):
        """Log info message with additional context"""
        self.logger.info(f"{message} | {self._format_context(kwargs)}")
    
    def warning(self, message: str, **kwargs):
        """Log warning message with additional context"""
        self.logger.warning(f"{message} | {self._format_context(kwargs)}")
    
    def error(self, message: str, **kwargs):
        """Log error message with additional context"""
        self.logger.error(f"{message} | {self._format_context(kwargs)}")
    
    def debug(self, message: str, **kwargs):
        """Log debug message with additional context"""
        self.logger.debug(f"{message} | {self._format_context(kwargs)}")
    
    def _format_context(self, context: dict) -> str:
        """Format context dictionary for logging"""
        if not context:
            return ""
        
        formatted_items = []
        for key, value in context.items():
            formatted_items.append(f"{key}={value}")
        
        return " | ".join(formatted_items)


def log_performance(func):
    """Decorator to log function performance"""
    import time
    
    def wrapper(*args, **kwargs):
        logger = logging.getLogger(func.__module__)
        start_time = time.time()
        
        try:
            result = func(*args, **kwargs)
            execution_time = time.time() - start_time
            logger.info(f"{func.__name__} executed in {execution_time:.3f}s")
            return result
        except Exception as e:
            execution_time = time.time() - start_time
            logger.error(f"{func.__name__} failed after {execution_time:.3f}s with error: {e}")
            raise
    
    return wrapper


def log_async_performance(func):
    """Decorator to log async function performance"""
    import time
    
    async def wrapper(*args, **kwargs):
        logger = logging.getLogger(func.__module__)
        start_time = time.time()
        
        try:
            result = await func(*args, **kwargs)
            execution_time = time.time() - start_time
            logger.info(f"Async {func.__name__} executed in {execution_time:.3f}s")
            return result
        except Exception as e:
            execution_time = time.time() - start_time
            logger.error(f"Async {func.__name__} failed after {execution_time:.3f}s with error: {e}")
            raise
    
    return wrapper


def log_api_request(request_data: dict):
    """Log API request data"""
    logger = logging.getLogger("api")
    logger.info(f"API Request: {request_data}")


def log_api_response(response_data: dict, status_code: int):
    """Log API response data"""
    logger = logging.getLogger("api")
    logger.info(f"API Response: {status_code} - {response_data}")


def log_database_operation(operation: str, collection: str, document_id: str = None):
    """Log database operations"""
    logger = logging.getLogger("database")
    context = f"operation={operation} | collection={collection}"
    if document_id:
        context += f" | document_id={document_id}"
    logger.debug(f"Database operation: {context}")


def log_ai_operation(operation: str, model: str, tokens_used: int = None):
    """Log AI operations"""
    logger = logging.getLogger("ai")
    context = f"operation={operation} | model={model}"
    if tokens_used:
        context += f" | tokens_used={tokens_used}"
    logger.info(f"AI operation: {context}")


def log_user_action(user_id: str, action: str, details: dict = None):
    """Log user actions"""
    logger = logging.getLogger("user")
    context = f"user_id={user_id} | action={action}"
    if details:
        context += f" | details={details}"
    logger.info(f"User action: {context}")


def log_system_event(event: str, details: dict = None):
    """Log system events"""
    logger = logging.getLogger("system")
    context = f"event={event}"
    if details:
        context += f" | details={details}"
    logger.info(f"System event: {context}")


def log_security_event(event: str, user_id: str = None, details: dict = None):
    """Log security events"""
    logger = logging.getLogger("security")
    context = f"event={event}"
    if user_id:
        context += f" | user_id={user_id}"
    if details:
        context += f" | details={details}"
    logger.warning(f"Security event: {context}")


def log_error(error: Exception, context: dict = None):
    """Log errors with context"""
    logger = logging.getLogger("error")
    error_context = f"error={type(error).__name__} | message={str(error)}"
    if context:
        error_context += f" | context={context}"
    logger.error(f"Error occurred: {error_context}", exc_info=True)
