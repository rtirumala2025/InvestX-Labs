"""
Configuration settings for the AI Investment Backend
"""
import os
from typing import Optional
from pydantic import BaseSettings, Field


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # API Configuration
    api_host: str = Field(default="0.0.0.0", env="API_HOST")
    api_port: int = Field(default=8000, env="API_PORT")
    api_debug: bool = Field(default=False, env="API_DEBUG")
    
    # OpenAI Configuration
    openai_api_key: str = Field(..., env="OPENAI_API_KEY")
    openai_model: str = Field(default="gpt-3.5-turbo", env="OPENAI_MODEL")
    
    # Anthropic Configuration
    anthropic_api_key: Optional[str] = Field(default=None, env="ANTHROPIC_API_KEY")
    
    # Firebase Configuration
    firebase_project_id: str = Field(..., env="FIREBASE_PROJECT_ID")
    firebase_private_key_id: str = Field(..., env="FIREBASE_PRIVATE_KEY_ID")
    firebase_private_key: str = Field(..., env="FIREBASE_PRIVATE_KEY")
    firebase_client_email: str = Field(..., env="FIREBASE_CLIENT_EMAIL")
    firebase_client_id: str = Field(..., env="FIREBASE_CLIENT_ID")
    firebase_auth_uri: str = Field(default="https://accounts.google.com/o/oauth2/auth", env="FIREBASE_AUTH_URI")
    firebase_token_uri: str = Field(default="https://oauth2.googleapis.com/token", env="FIREBASE_TOKEN_URI")
    firebase_auth_provider_x509_cert_url: str = Field(
        default="https://www.googleapis.com/oauth2/v1/certs", 
        env="FIREBASE_AUTH_PROVIDER_X509_CERT_URL"
    )
    firebase_client_x509_cert_url: str = Field(..., env="FIREBASE_CLIENT_X509_CERT_URL")
    
    # Database Configuration
    redis_url: str = Field(default="redis://localhost:6379", env="REDIS_URL")
    chroma_persist_directory: str = Field(default="./chroma_db", env="CHROMA_PERSIST_DIRECTORY")
    
    # Security
    secret_key: str = Field(..., env="SECRET_KEY")
    jwt_secret_key: str = Field(..., env="JWT_SECRET_KEY")
    jwt_algorithm: str = Field(default="HS256", env="JWT_ALGORITHM")
    access_token_expire_minutes: int = Field(default=30, env="ACCESS_TOKEN_EXPIRE_MINUTES")
    
    # Rate Limiting
    rate_limit_per_minute: int = Field(default=60, env="RATE_LIMIT_PER_MINUTE")
    rate_limit_burst: int = Field(default=10, env="RATE_LIMIT_BURST")
    
    # Logging
    log_level: str = Field(default="INFO", env="LOG_LEVEL")
    log_format: str = Field(default="json", env="LOG_FORMAT")
    
    # External APIs
    news_api_key: Optional[str] = Field(default=None, env="NEWS_API_KEY")
    alpha_vantage_api_key: Optional[str] = Field(default=None, env="ALPHA_VANTAGE_API_KEY")
    
    # Content Sources
    sec_base_url: str = Field(default="https://www.sec.gov", env="SEC_BASE_URL")
    khan_academy_base_url: str = Field(default="https://www.khanacademy.org", env="KHAN_ACADEMY_BASE_URL")
    investopedia_base_url: str = Field(default="https://www.investopedia.com", env="INVESTOPEDIA_BASE_URL")
    
    # Model Configuration
    embedding_model: str = Field(default="sentence-transformers/all-MiniLM-L6-v2", env="EMBEDDING_MODEL")
    max_context_length: int = Field(default=4000, env="MAX_CONTEXT_LENGTH")
    temperature: float = Field(default=0.7, env="TEMPERATURE")
    max_tokens: int = Field(default=500, env="MAX_TOKENS")
    
    # Safety Configuration
    min_age: int = Field(default=13, env="MIN_AGE")
    max_age: int = Field(default=19, env="MAX_AGE")
    content_filter_enabled: bool = Field(default=True, env="CONTENT_FILTER_ENABLED")
    safety_threshold: float = Field(default=0.8, env="SAFETY_THRESHOLD")
    
    # Monitoring
    prometheus_port: int = Field(default=9090, env="PROMETHEUS_PORT")
    health_check_interval: int = Field(default=30, env="HEALTH_CHECK_INTERVAL")
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()


# Firebase service account configuration
FIREBASE_SERVICE_ACCOUNT = {
    "type": "service_account",
    "project_id": settings.firebase_project_id,
    "private_key_id": settings.firebase_private_key_id,
    "private_key": settings.firebase_private_key,
    "client_email": settings.firebase_client_email,
    "client_id": settings.firebase_client_id,
    "auth_uri": settings.firebase_auth_uri,
    "token_uri": settings.firebase_token_uri,
    "auth_provider_x509_cert_url": settings.firebase_auth_provider_x509_cert_url,
    "client_x509_cert_url": settings.firebase_client_x509_cert_url
}


# Teen-relevant stocks for market data collection
TEEN_RELEVANT_STOCKS = [
    "AAPL",  # Apple
    "GOOGL", # Google
    "TSLA",  # Tesla
    "MSFT",  # Microsoft
    "AMZN",  # Amazon
    "META",  # Meta
    "NFLX",  # Netflix
    "VTI",   # Vanguard Total Stock Market ETF
    "VOO",   # Vanguard S&P 500 ETF
    "SPY",   # SPDR S&P 500 ETF
    "QQQ",   # Invesco QQQ Trust
    "ARKK",  # ARK Innovation ETF
]


# Educational content categories
EDUCATIONAL_CATEGORIES = [
    "basics",
    "stocks",
    "etfs",
    "index_funds",
    "risk_management",
    "diversification",
    "compound_interest",
    "budgeting",
    "saving",
    "market_analysis",
    "portfolio_management",
    "tax_implications"
]


# Investment types for teens
INVESTMENT_TYPES = [
    "stocks",
    "etfs",
    "index_funds",
    "mutual_funds",
    "bonds",
    "savings_accounts",
    "cds",
    "robo_advisors"
]


# Risk levels
RISK_LEVELS = [
    "conservative",
    "moderate",
    "aggressive"
]


# Budget ranges for teens
BUDGET_RANGES = [
    "under_100",
    "100_500",
    "500_1000",
    "1000_5000",
    "over_5000"
]
