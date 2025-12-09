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
    DATABASE_URL: str = "sqlite:///./gep.db"
    
    # Redis (optional for caching)
    REDIS_URL: str = ""
    
    # Security
    SECRET_KEY: str = "your-secret-key-here"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120
    
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
        "gep-backend-tv2qihivdq-uc.a.run.app",
        "gep-backend-19949436301.us-central1.run.app",
        "gep-backend-beta-tv2qihivdq-uc.a.run.app",
        "gep-backend-beta-19949436301.us-central1.run.app",
        "gem-backend-1094576259070.us-central1.run.app",  # GEM Platform backend
        "*.run.app",  # Allow all Cloud Run services
        "*.gep.com",
        "*.globalempowerment.app"
    ]
    
    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://gep.vercel.app",
        "https://globalempowerment.app",
        "https://www.globalempowerment.app"
    ]
    
    # AI Services
    OPENAI_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    NANOBANANA_API_KEY: Optional[str] = None
    
    # Image/Video Enhancement
    CLOUDINARY_CLOUD_NAME: Optional[str] = None
    CLOUDINARY_API_KEY: Optional[str] = None
    CLOUDINARY_API_SECRET: Optional[str] = None
    
    # Social Platform APIs - Facebook/Instagram (Meta)
    FACEBOOK_APP_ID: Optional[str] = None
    FACEBOOK_APP_SECRET: Optional[str] = None
    FACEBOOK_REDIRECT_URI: Optional[str] = None
    
    INSTAGRAM_APP_ID: Optional[str] = None
    INSTAGRAM_APP_SECRET: Optional[str] = None
    INSTAGRAM_REDIRECT_URI: Optional[str] = None
    
    # YouTube
    YOUTUBE_CLIENT_ID: Optional[str] = None
    YOUTUBE_CLIENT_SECRET: Optional[str] = None
    YOUTUBE_REDIRECT_URI: Optional[str] = None
    
    # TikTok
    TIKTOK_CLIENT_KEY: Optional[str] = None
    TIKTOK_CLIENT_SECRET: Optional[str] = None
    
    # Security
    TOKEN_ENCRYPTION_KEY: Optional[str] = None
    
    # Email/Notifications
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USERNAME: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    
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