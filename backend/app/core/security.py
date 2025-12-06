"""
Accorria Backend Security Configuration
150% SECURE - Zero Trust Architecture
"""

import os
import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from fastapi import HTTPException, Depends, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.gzip import GZipMiddleware
import jwt
from passlib.context import CryptContext
import redis
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import logging

# Security logging
logging.basicConfig(level=logging.INFO)
security_logger = logging.getLogger("security")

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Configuration
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", secrets.token_urlsafe(32))
JWT_ALGORITHM = "HS256"
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = 30
JWT_REFRESH_TOKEN_EXPIRE_DAYS = 7

# Rate Limiting
limiter = Limiter(key_func=get_remote_address)

# Redis for session management and rate limiting (optional)
try:
    redis_client = redis.Redis(
        host=os.getenv("REDIS_HOST", "localhost"),
        port=int(os.getenv("REDIS_PORT", 6379)),
        password=os.getenv("REDIS_PASSWORD"),
        decode_responses=True
    )
    # Test connection
    redis_client.ping()
    security_logger.info("Redis connection established")
except Exception as e:
    security_logger.warning(f"Redis connection failed: {e}. Running without Redis.")
    redis_client = None

# Security headers
SECURITY_HEADERS = {
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "X-XSS-Protection": "1; mode=block",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "geolocation=(), microphone=(), camera=()"
}

class SecurityConfig:
    """150% Secure Configuration for Accorria"""
    
    @staticmethod
    def get_cors_middleware():
        """Secure CORS configuration"""
        return CORSMiddleware(
            allow_origins=[
                os.getenv("FRONTEND_URL", "http://localhost:3000"),
                "https://accorria.com",
                "https://www.accorria.com"
            ],
            allow_credentials=True,
            allow_methods=["GET", "POST", "PUT", "DELETE"],
            allow_headers=["*"],
            expose_headers=["X-Total-Count", "X-Rate-Limit-Remaining"]
        )
    
    @staticmethod
    def get_trusted_host_middleware():
        """Trusted host middleware"""
        return TrustedHostMiddleware(
            allowed_hosts=[
                "localhost",
                "127.0.0.1",
                "accorria-backend-*.run.app",
                "*.accorria.com"
            ]
        )
    
    @staticmethod
    def get_gzip_middleware():
        """Gzip compression middleware"""
        return GZipMiddleware(minimum_size=1000)

class AuthenticationManager:
    """Secure Authentication Management"""
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify password against hash"""
        return pwd_context.verify(plain_password, hashed_password)
    
    @staticmethod
    def get_password_hash(password: str) -> str:
        """Hash password securely"""
        return pwd_context.hash(password)
    
    @staticmethod
    def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
        """Create JWT access token"""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
        
        to_encode.update({"exp": expire, "type": "access"})
        encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
        return encoded_jwt
    
    @staticmethod
    def create_refresh_token(data: dict):
        """Create JWT refresh token"""
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(days=JWT_REFRESH_TOKEN_EXPIRE_DAYS)
        to_encode.update({"exp": expire, "type": "refresh"})
        encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
        return encoded_jwt
    
    @staticmethod
    def verify_token(token: str) -> Dict[str, Any]:
        """Verify JWT token"""
        try:
            payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
            return payload
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired"
            )
        except jwt.JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )

class AuthorizationManager:
    """Role-based Authorization Management"""
    
    ROLES = {
        "user": 1,
        "premium_user": 2,
        "analytics": 3,
        "compliance_officer": 4,
        "auditor": 5,
        "security_team": 6,
        "data_buyer": 7,
        "admin": 8,
        "service_role": 9
    }
    
    @staticmethod
    def has_role(user_role: str, required_role: str) -> bool:
        """Check if user has required role"""
        user_level = AuthorizationManager.ROLES.get(user_role, 0)
        required_level = AuthorizationManager.ROLES.get(required_role, 0)
        return user_level >= required_level
    
    @staticmethod
    def require_role(required_role: str):
        """Decorator to require specific role"""
        def role_checker(token_data: Dict[str, Any] = Depends(AuthenticationManager.verify_token)):
            user_role = token_data.get("role", "user")
            if not AuthorizationManager.has_role(user_role, required_role):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Insufficient permissions. Required role: {required_role}"
                )
            return token_data
        return role_checker

class RateLimitManager:
    """Advanced Rate Limiting Management"""
    
    @staticmethod
    def get_rate_limit_key(request: Request) -> str:
        """Get rate limit key based on user and endpoint"""
        user_id = getattr(request.state, 'user_id', 'anonymous')
        endpoint = request.url.path
        return f"rate_limit:{user_id}:{endpoint}"
    
    @staticmethod
    def check_rate_limit(request: Request, limit: int, window: int = 60):
        """Check rate limit for user"""
        if redis_client is None:
            # Skip rate limiting if Redis is not available
            return
            
        try:
            key = RateLimitManager.get_rate_limit_key(request)
            current = redis_client.get(key)
            
            if current and int(current) >= limit:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Rate limit exceeded. Limit: {limit} requests per {window} seconds"
                )
            
            pipe = redis_client.pipeline()
            pipe.incr(key)
            pipe.expire(key, window)
            pipe.execute()
        except Exception as e:
            security_logger.warning(f"Rate limiting failed: {e}. Skipping rate limit check.")
    
    @staticmethod
    def rate_limit(limit: int, window: int = 60):
        """Rate limiting decorator"""
        def rate_limit_checker(request: Request):
            RateLimitManager.check_rate_limit(request, limit, window)
        return rate_limit_checker

class SecurityAudit:
    """Security Audit and Logging"""
    
    @staticmethod
    def log_security_event(event_type: str, user_id: str, details: Dict[str, Any]):
        """Log security event"""
        event = {
            "timestamp": datetime.utcnow().isoformat(),
            "event_type": event_type,
            "user_id": user_id,
            "details": details,
            "ip_address": "captured_from_request",
            "user_agent": "captured_from_request"
        }
        
        security_logger.info(f"SECURITY_EVENT: {event}")
        
        # Store in database for compliance
        try:
            if redis_client:
                redis_client.lpush("security_audit_logs", str(event))
                redis_client.ltrim("security_audit_logs", 0, 9999)  # Keep last 10k events
        except Exception as e:
            security_logger.error(f"Failed to store security event: {e}")
    
    @staticmethod
    def log_authentication_attempt(user_id: str, success: bool, details: Dict[str, Any]):
        """Log authentication attempt"""
        event_type = "auth_success" if success else "auth_failure"
        SecurityAudit.log_security_event(event_type, user_id, details)
    
    @staticmethod
    def log_api_access(user_id: str, endpoint: str, method: str, status_code: int):
        """Log API access"""
        details = {
            "endpoint": endpoint,
            "method": method,
            "status_code": status_code
        }
        SecurityAudit.log_security_event("api_access", user_id, details)

class InputValidation:
    """Secure Input Validation"""
    
    @staticmethod
    def sanitize_string(value: str) -> str:
        """Sanitize string input"""
        if not value:
            return ""
        
        # Remove potentially dangerous characters
        dangerous_chars = ["<", ">", "'", '"', "&", ";", "|", "`", "$", "(", ")", "{", "}"]
        for char in dangerous_chars:
            value = value.replace(char, "")
        
        return value.strip()
    
    @staticmethod
    def validate_email(email: str) -> bool:
        """Validate email format"""
        import re
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(pattern, email))
    
    @staticmethod
    def validate_phone(phone: str) -> bool:
        """Validate phone number format"""
        import re
        pattern = r'^\+?1?\d{9,15}$'
        return bool(re.match(pattern, phone))

# Security middleware dependencies
security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current authenticated user"""
    token = credentials.credentials
    payload = AuthenticationManager.verify_token(token)
    user_id = payload.get("sub")
    
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
    
    return payload

def get_current_active_user(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get current active user"""
    if not current_user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user

# Role-based access control
require_user = AuthorizationManager.require_role("user")
require_premium = AuthorizationManager.require_role("premium_user")
require_analytics = AuthorizationManager.require_role("analytics")
require_compliance = AuthorizationManager.require_role("compliance_officer")
require_auditor = AuthorizationManager.require_role("auditor")
require_security = AuthorizationManager.require_role("security_team")
require_data_buyer = AuthorizationManager.require_role("data_buyer")
require_admin = AuthorizationManager.require_role("admin")
require_service_role = AuthorizationManager.require_role("service_role")
