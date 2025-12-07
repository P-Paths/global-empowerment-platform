"""
Supabase Authentication API for Accorria MVP
Simplified auth endpoints using Supabase
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from app.core.supabase_config import get_supabase
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

class UserSignUp(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None

class UserSignIn(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    created_at: str

@router.post("/signup", response_model=UserResponse)
async def sign_up(user_data: UserSignUp):
    """User registration"""
    try:
        supabase = get_supabase()
        
        # Create user in Supabase
        response = supabase.auth.sign_up({
            "email": user_data.email,
            "password": user_data.password,
            "options": {
                "data": {
                    "full_name": user_data.full_name
                }
            }
        })
        
        if response.user:
            return UserResponse(
                id=response.user.id,
                email=response.user.email,
                full_name=user_data.full_name,
                created_at=response.user.created_at
            )
        else:
            raise HTTPException(status_code=400, detail="Failed to create user")
            
    except Exception as e:
        logger.error(f"Sign up error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/signin", response_model=dict)
async def sign_in(user_data: UserSignIn):
    """User login"""
    try:
        supabase = get_supabase()
        
        # Sign in user
        response = supabase.auth.sign_in_with_password({
            "email": user_data.email,
            "password": user_data.password
        })
        
        if response.user and response.session:
            return {
                "user": {
                    "id": response.user.id,
                    "email": response.user.email,
                    "full_name": response.user.user_metadata.get("full_name")
                },
                "access_token": response.session.access_token,
                "refresh_token": response.session.refresh_token
            }
        else:
            raise HTTPException(status_code=401, detail="Invalid credentials")
            
    except Exception as e:
        logger.error(f"Sign in error: {e}")
        raise HTTPException(status_code=401, detail="Invalid credentials")

@router.post("/signout")
async def sign_out():
    """User logout"""
    try:
        supabase = get_supabase()
        supabase.auth.sign_out()
        return {"message": "Successfully signed out"}
    except Exception as e:
        logger.error(f"Sign out error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/me", response_model=UserResponse)
async def get_current_user():
    """Get current user info"""
    try:
        supabase = get_supabase()
        user = supabase.auth.get_user()
        
        if user.user:
            return UserResponse(
                id=user.user.id,
                email=user.user.email,
                full_name=user.user.user_metadata.get("full_name"),
                created_at=user.user.created_at
            )
        else:
            raise HTTPException(status_code=401, detail="Not authenticated")
            
    except Exception as e:
        logger.error(f"Get user error: {e}")
        raise HTTPException(status_code=401, detail="Not authenticated")
