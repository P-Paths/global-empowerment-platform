"""
Authentication API endpoints
Handles user registration, login, and session management
"""

from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, timedelta
import jwt
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.config import settings
from app.models.comprehensive_models import User
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# Security
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Temporary in-memory storage for testing
temp_users = {}
temp_sessions = {}

# Pydantic models
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    user_id: str
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    user_type: str
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse

class PasswordReset(BaseModel):
    email: EmailStr

class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str

# Utility functions
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: AsyncSession = Depends(get_db)) -> User:
    """Get the current authenticated user"""
    try:
        payload = jwt.decode(credentials.credentials, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    # Check in-memory storage first
    if user_id in temp_users:
        return temp_users[user_id]
    
    # Fallback to database (if available)
    try:
        from sqlalchemy import select
        result = await db.execute(select(User).where(User.user_id == user_id))
        user = result.scalar_one_or_none()
        
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        
        return user
    except Exception as e:
        logger.error(f"Database error: {e}")
        raise HTTPException(status_code=401, detail="User not found")

# API Endpoints
@router.post("/register", response_model=TokenResponse)
async def register(user_data: UserRegister, db: AsyncSession = Depends(get_db)):
    """Register a new user"""
    try:
        # Check if user already exists in temp storage
        if user_data.email in [user.email for user in temp_users.values()]:
            raise HTTPException(status_code=400, detail="Email already registered")

        # Create new user in temp storage
        import uuid
        user_id = str(uuid.uuid4())
        hashed_password = get_password_hash(user_data.password)
        
        new_user = User(
            user_id=user_id,
            email=user_data.email,
            password_hash=hashed_password,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            phone=user_data.phone,
            user_type="standard",
            is_active=True,
            created_at=datetime.utcnow(),
            last_login=datetime.utcnow()
        )
        
        temp_users[user_id] = new_user

        # Create access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": str(new_user.user_id)}, expires_delta=access_token_expires
        )

        return TokenResponse(
            access_token=access_token,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=UserResponse(
                user_id=str(new_user.user_id),
                email=new_user.email,
                first_name=new_user.first_name,
                last_name=new_user.last_name,
                phone=new_user.phone,
                user_type=new_user.user_type,
                is_active=new_user.is_active,
                created_at=new_user.created_at,
                last_login=new_user.last_login
            )
        )

    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        raise HTTPException(status_code=500, detail="Registration failed")

@router.post("/login", response_model=TokenResponse)
async def login(user_data: UserLogin, db: AsyncSession = Depends(get_db)):
    """Login user"""
    try:
        # Check in-memory storage first
        user = None
        for temp_user in temp_users.values():
            if temp_user.email == user_data.email:
                user = temp_user
                break
        
        # If not found in temp storage, try database
        if user is None:
            try:
                from sqlalchemy import select
                result = await db.execute(select(User).where(User.email == user_data.email))
                user = result.scalar_one_or_none()
            except Exception as e:
                logger.error(f"Database error: {e}")
                raise HTTPException(status_code=401, detail="Invalid credentials")

        if not user or not verify_password(user_data.password, user.password_hash):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        if not user.is_active:
            raise HTTPException(status_code=401, detail="Account is disabled")

        # Create access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": str(user.user_id)}, expires_delta=access_token_expires
        )

        # Update last login
        user.last_login = datetime.utcnow()
        if user.user_id in temp_users:
            temp_users[user.user_id] = user

        return TokenResponse(
            access_token=access_token,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=UserResponse(
                user_id=str(user.user_id),
                email=user.email,
                first_name=user.first_name,
                last_name=user.last_name,
                phone=user.phone,
                user_type=user.user_type,
                is_active=user.is_active,
                created_at=user.created_at,
                last_login=user.last_login
            )
        )

    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(status_code=500, detail="Login failed")

@router.get("/me", response_model=UserResponse)
async def get_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return UserResponse(
        user_id=str(current_user.user_id),
        email=current_user.email,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        phone=current_user.phone,
        user_type=current_user.user_type,
        is_active=current_user.is_active,
        created_at=current_user.created_at,
        last_login=current_user.last_login
    )

@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    """Logout user (invalidate token)"""
    # In a real implementation, you would add the token to a blacklist
    # For now, we'll just return success
    return {"message": "Successfully logged out"}

@router.post("/refresh")
async def refresh_token(current_user: User = Depends(get_current_user)):
    """Refresh access token"""
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(current_user.user_id)}, expires_delta=access_token_expires
    )
    
    return TokenResponse(
        access_token=access_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse(
            user_id=str(current_user.user_id),
            email=current_user.email,
            first_name=current_user.first_name,
            last_name=current_user.last_name,
            phone=current_user.phone,
            user_type=current_user.user_type,
            is_active=current_user.is_active,
            created_at=current_user.created_at,
            last_login=current_user.last_login
        )
    )

@router.put("/update-password")
async def update_password(
    password_data: PasswordUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update user password"""
    try:
        if not verify_password(password_data.current_password, current_user.password_hash):
            raise HTTPException(status_code=400, detail="Current password is incorrect")

        new_hashed_password = get_password_hash(password_data.new_password)
        current_user.password_hash = new_hashed_password

        # Update in temp storage
        if current_user.user_id in temp_users:
            temp_users[current_user.user_id] = current_user

        return {"message": "Password updated successfully"}

    except Exception as e:
        logger.error(f"Password update error: {str(e)}")
        raise HTTPException(status_code=500, detail="Password update failed")

@router.post("/forgot-password")
async def forgot_password(password_data: PasswordReset):
    """Send password reset email"""
    # In a real implementation, you would send an email with a reset link
    # For now, we'll just return success
    return {"message": "If an account with this email exists, a password reset link has been sent"} 