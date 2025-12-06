from pydantic_settings import BaseSettings
from typing import List, Optional
import os


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "Global Empowerment"
    VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # Supabase Configuration
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    
    # Database (fallback for local development)
    DATABASE_URL: str = "sqlite:///./accorria.db"
    
    # Redis (optional for caching)
    REDIS_URL: str = ""
    
    # Security
    SECRET_KEY: str = "your-secret-key-here"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # JWT Configuration
    JWT_SECRET_KEY: str = "your-jwt-secret-key-here"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Password Security
    PASSWORD_MIN_LENGTH: int = 12
    PASSWORD_REQUIRE_UPPERCASE: bool = True
    PASSWORD_REQUIRE_LOWERCASE: bool = True
    PASSWORD_REQUIRE_DIGITS: bool = True
    PASSWORD_REQUIRE_SPECIAL_CHARS: bool = True
    
    # Rate Limiting
    RATE_LIMIT_DEFAULT: int = 100
    RATE_LIMIT_AUTH: int = 5
    RATE_LIMIT_UPLOAD: int = 10
    RATE_LIMIT_CHAT: int = 20
    
    # Redis Configuration (optional)
    REDIS_HOST: str = ""
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: Optional[str] = None
    REDIS_DB: int = 0
    
    # Security Headers
    ENABLE_ADVANCED_SECURITY: bool = True
    ENABLE_RATE_LIMITING: bool = True
    ENABLE_AUDIT_LOGGING: bool = True
    ENABLE_PII_ENCRYPTION: bool = True
    ENABLE_ANOMALY_DETECTION: bool = True
    
    # Trusted Hosts
    ALLOWED_HOSTS: List[str] = [
        "localhost",
        "127.0.0.1",
        "accorria-backend-tv2qihivdq-uc.a.run.app",
        "accorria-backend-19949436301.us-central1.run.app",
        "accorria-backend-beta-tv2qihivdq-uc.a.run.app",
        "accorria-backend-beta-19949436301.us-central1.run.app",
        "*.accorria.com"
    ]
    
    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://10.0.0.67:3000",
        "http://10.0.0.67:3001",
        "http://localhost:5173",
        "https://accorria.vercel.app",
        "https://accorria.com",
        "https://www.accorria.com"
    ]
    
    # OpenAI
    OPENAI_API_KEY: Optional[str] = None
    
    # Google API
    GOOGLE_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    
    # Platform API Keys (optional for MVP)
    FACEBOOK_ACCESS_TOKEN: Optional[str] = None
    OFFERUP_API_KEY: Optional[str] = None
    CARGURUS_API_KEY: Optional[str] = None
    
    # Facebook OAuth2 Configuration (Multi-Tenant)
    FACEBOOK_APP_ID: Optional[str] = None
    FACEBOOK_APP_SECRET: Optional[str] = None
    FACEBOOK_REDIRECT_URI: Optional[str] = None
    TOKEN_ENCRYPTION_KEY: Optional[str] = None
    
    # AI Reply Settings
    MIN_REPLY_DELAY_MINUTES: int = 1
    MAX_REPLY_DELAY_MINUTES: int = 30
    AI_REPLY_ENABLED: bool = True
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Allow extra fields from environment


# Create settings instance
settings = Settings()

# Validate required settings
def validate_settings():
    """Validate that all required settings are present"""
    # Only validate in production or when explicitly required
    if os.getenv("ENVIRONMENT") == "production":
        required_settings = [
            "SECRET_KEY"
        ]
        
        missing_settings = []
        for setting in required_settings:
            if not getattr(settings, setting):
                missing_settings.append(setting)
        
        if missing_settings:
            raise ValueError(f"Missing required settings: {', '.join(missing_settings)}")


# Validate on import only if not in build environment
if not os.getenv("CLOUDBUILD"):
    validate_settings() 