"""
AI model configuration and settings
"""

# Model configurations for different use cases
MODEL_CONFIGS = {
    "chat": {
        "model": "gpt-3.5-turbo",
        "temperature": 0.7,
        "max_tokens": 500,
        "top_p": 0.9,
        "frequency_penalty": 0.1,
        "presence_penalty": 0.1
    },
    "content_analysis": {
        "model": "gpt-3.5-turbo",
        "temperature": 0.3,
        "max_tokens": 300,
        "top_p": 0.8
    },
    "embedding": {
        "model": "text-embedding-ada-002",
        "dimensions": 1536
    },
    "fine_tuning": {
        "base_model": "gpt-3.5-turbo",
        "training_epochs": 3,
        "learning_rate": 1e-5,
        "batch_size": 4
    }
}

# Embedding model configuration
EMBEDDING_CONFIG = {
    "model_name": "sentence-transformers/all-MiniLM-L6-v2",
    "max_seq_length": 256,
    "device": "cpu",  # Change to "cuda" if GPU available
    "normalize_embeddings": True
}

# Vector search configuration
VECTOR_SEARCH_CONFIG = {
    "similarity_threshold": 0.7,
    "max_results": 5,
    "search_type": "similarity",  # "similarity" or "mmr" (maximal marginal relevance)
    "mmr_diversity_threshold": 0.3
}

# RAG system configuration
RAG_CONFIG = {
    "max_context_length": 4000,
    "context_overlap": 200,
    "chunk_size": 1000,
    "chunk_overlap": 100,
    "retrieval_weight": 0.7,
    "generation_weight": 0.3
}

# Content processing configuration
CONTENT_PROCESSING_CONFIG = {
    "min_content_length": 100,
    "max_content_length": 10000,
    "remove_html": True,
    "remove_extra_whitespace": True,
    "normalize_unicode": True,
    "extract_keywords": True,
    "max_keywords": 10
}

# Safety and filtering configuration
SAFETY_CONFIG = {
    "content_filter_enabled": True,
    "age_verification_required": True,
    "inappropriate_content_threshold": 0.8,
    "financial_advice_detection": True,
    "scam_detection": True,
    "personal_info_detection": True
}

# Performance optimization settings
PERFORMANCE_CONFIG = {
    "cache_responses": True,
    "cache_ttl": 3600,  # 1 hour
    "batch_processing_size": 10,
    "async_processing": True,
    "connection_pool_size": 20,
    "request_timeout": 30
}

# Monitoring and logging configuration
MONITORING_CONFIG = {
    "log_all_requests": True,
    "log_response_times": True,
    "log_error_details": True,
    "metrics_collection": True,
    "performance_tracking": True,
    "user_analytics": True
}

# Rate limiting configuration
RATE_LIMIT_CONFIG = {
    "requests_per_minute": 60,
    "requests_per_hour": 1000,
    "requests_per_day": 10000,
    "burst_limit": 10,
    "window_size": 60
}

# Content categories and their processing priorities
CONTENT_PRIORITIES = {
    "high": [
        "investment_basics",
        "risk_management",
        "diversification",
        "compound_interest"
    ],
    "medium": [
        "market_analysis",
        "portfolio_management",
        "tax_implications",
        "budgeting"
    ],
    "low": [
        "advanced_strategies",
        "derivatives",
        "options_trading",
        "forex"
    ]
}

# User profile attributes for personalization
USER_PROFILE_ATTRIBUTES = [
    "age",
    "investment_experience",
    "risk_tolerance",
    "budget_range",
    "investment_goals",
    "interests",
    "learning_style",
    "time_horizon"
]

# Content recommendation weights
RECOMMENDATION_WEIGHTS = {
    "user_interests": 0.3,
    "user_experience_level": 0.25,
    "content_popularity": 0.2,
    "content_freshness": 0.15,
    "user_engagement": 0.1
}

# Conversation context management
CONVERSATION_CONFIG = {
    "max_context_messages": 10,
    "context_window_hours": 24,
    "topic_continuity_threshold": 0.8,
    "conversation_summary_length": 200
}

# Educational content structure
EDUCATIONAL_CONTENT_STRUCTURE = {
    "required_fields": [
        "title",
        "content",
        "category",
        "difficulty_level",
        "target_age_range",
        "keywords",
        "learning_objectives"
    ],
    "optional_fields": [
        "estimated_read_time",
        "prerequisites",
        "related_topics",
        "interactive_elements",
        "quiz_questions",
        "real_world_examples"
    ]
}

# Quiz and assessment configuration
QUIZ_CONFIG = {
    "question_types": [
        "multiple_choice",
        "true_false",
        "fill_in_blank",
        "scenario_based"
    ],
    "difficulty_levels": [
        "beginner",
        "intermediate",
        "advanced"
    ],
    "scoring_system": {
        "points_per_question": 10,
        "bonus_for_streak": 5,
        "penalty_for_hint": -2
    }
}
