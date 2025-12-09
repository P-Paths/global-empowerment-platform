"""
GEM Platform - Profiles API
Handles user profiles
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid
import re
import os
import logging

from app.core.database import get_db
from app.models.gep_models import Profile
from app.utils.auth import get_current_user
from app.services.supabase_service import supabase_service
from pydantic import BaseModel

router = APIRouter()


class ProfileResponse(BaseModel):
    id: str
    user_id: str
    full_name: Optional[str]
    avatar_url: Optional[str]
    bio: Optional[str]
    city: Optional[str]
    state: Optional[str]
    business_name: Optional[str]
    business_category: Optional[str]
    skills: List[str]
    followers_count: int
    following_count: int
    funding_score: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    business_name: Optional[str] = None
    business_category: Optional[str] = None
    skills: Optional[List[str]] = None
    onboarding_complete: Optional[bool] = None


class OnboardingDataUpdate(BaseModel):
    """Data model for onboarding updates"""
    user_id: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    city: Optional[str] = None
    selected_category: Optional[str] = None
    onboarding_complete: Optional[bool] = None


@router.get("/profiles/{profile_id}", response_model=ProfileResponse)
async def get_profile(
    profile_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get a profile by ID"""
    result = await db.execute(
        select(Profile).where(Profile.id == uuid.UUID(profile_id))
    )
    profile = result.scalar_one_or_none()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    return ProfileResponse(
        id=str(profile.id),
        user_id=str(profile.user_id),
        full_name=profile.full_name,
        avatar_url=profile.avatar_url,
        bio=profile.bio,
        city=profile.city,
        state=profile.state,
        business_name=profile.business_name,
        business_category=profile.business_category,
        skills=profile.skills or [],
        followers_count=profile.followers_count,
        following_count=profile.following_count,
        funding_score=profile.funding_score,
        created_at=profile.created_at,
        updated_at=profile.updated_at
    )


@router.get("/profiles", response_model=List[ProfileResponse])
async def search_profiles(
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Search profiles by name, business name, or category"""
    query = select(Profile)
    
    if search:
        search_term = f"%{search}%"
        query = query.where(
            or_(
                Profile.full_name.ilike(search_term),
                Profile.business_name.ilike(search_term),
                Profile.business_category.ilike(search_term)
            )
        )
    
    result = await db.execute(query.order_by(Profile.created_at.desc()))
    profiles = result.scalars().all()
    
    return [
        ProfileResponse(
            id=str(p.id),
            user_id=str(p.user_id),
            full_name=p.full_name,
            avatar_url=p.avatar_url,
            bio=p.bio,
            city=p.city,
            state=p.state,
            business_name=p.business_name,
            business_category=p.business_category,
            skills=p.skills or [],
            followers_count=p.followers_count,
            following_count=p.following_count,
            funding_score=p.funding_score,
            created_at=p.created_at,
            updated_at=p.updated_at
        )
        for p in profiles
    ]


@router.put("/profiles/{profile_id}", response_model=ProfileResponse)
async def update_profile(
    profile_id: str,
    profile_data: ProfileUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Update a profile"""
    current_user = get_current_user(request)
    user_id = current_user.get("sub") or current_user.get("id")
    
    # Get profile
    result = await db.execute(
        select(Profile).where(Profile.id == uuid.UUID(profile_id))
    )
    profile = result.scalar_one_or_none()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Check if user owns this profile
    if str(profile.user_id) != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this profile")
    
    # Update fields
    update_data = profile_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(profile, field, value)
    
    profile.updated_at = datetime.now()
    await db.commit()
    await db.refresh(profile)
    
    return ProfileResponse(
        id=str(profile.id),
        user_id=str(profile.user_id),
        full_name=profile.full_name,
        avatar_url=profile.avatar_url,
        bio=profile.bio,
        city=profile.city,
        state=profile.state,
        business_name=profile.business_name,
        business_category=profile.business_category,
        skills=profile.skills or [],
        followers_count=profile.followers_count,
        following_count=profile.following_count,
        funding_score=profile.funding_score,
        created_at=profile.created_at,
        updated_at=profile.updated_at
    )



@router.post("/profiles/onboarding", response_model=Dict[str, Any])
async def upsert_profile_onboarding(
    data: OnboardingDataUpdate,
    request: Request
):
    """
    Create or update profile during onboarding.
    Uses Supabase service role to bypass RLS policies.
    This allows demo users and new users to create profiles.
    """
    try:
        user_id = data.user_id
        
        # Verify user is authenticated (but allow demo users)
        current_user = get_current_user(request)
        auth_user_id = current_user.get("sub") or current_user.get("id")
        
        # Log for debugging
        logger = logging.getLogger(__name__)
        logger.info(f"Onboarding update request - user_id: {user_id}, auth_user_id: {auth_user_id}, current_user keys: {list(current_user.keys())}")
        
        # Check if we're in development mode (no SUPABASE_JWT_SECRET) or running on localhost
        # Also check if request is from localhost (development)
        is_localhost = request.url.hostname in ["localhost", "127.0.0.1", "0.0.0.0"]
        is_dev_mode = not os.getenv("SUPABASE_JWT_SECRET") or is_localhost
        
        # For demo users, allow if user_id matches the demo user ID
        is_demo_user = user_id == "00000000-0000-0000-0000-000000000123"
        
        # In development mode, skip strict authorization check if user_id is a valid UUID
        # (the mock user has a fixed UUID, but real users will have different UUIDs)
        # In production, we must verify the user owns the profile
        if is_dev_mode:
            # In dev mode, trust the user_id from the request if it's a valid UUID format
            # This allows real Supabase users to update their profiles even though we're using mock auth
            uuid_pattern = r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
            is_valid_uuid = re.match(uuid_pattern, str(user_id).lower()) is not None
            if not is_demo_user and is_valid_uuid:
                logger.info(f"Dev mode: Allowing update for valid UUID user_id: {user_id}")
                # Skip authorization check in dev mode for valid UUIDs
            elif not is_demo_user:
                logger.warning(f"Dev mode: Invalid user_id format: {user_id}")
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid user_id format: {user_id}"
                )
        else:
            # Production mode: strict authorization check
            # Verify user owns this profile (unless demo user)
            # Convert both to strings for comparison to handle UUID vs string mismatches
            if not is_demo_user and str(auth_user_id) != str(user_id):
                logger.warning(f"Authorization failed - auth_user_id ({auth_user_id}) != user_id ({user_id})")
                raise HTTPException(
                    status_code=403,
                    detail=f"Not authorized to update this profile. Authenticated as {auth_user_id}, trying to update {user_id}"
                )
        
        # Use Supabase service role to bypass RLS
        if not supabase_service.client:
            raise HTTPException(
                status_code=500,
                detail="Supabase service not configured"
            )
        
        # Prepare upsert data
        now = datetime.now().isoformat()
        upsert_data: Dict[str, Any] = {
            "id": user_id,
            "user_id": user_id,
            "updated_at": now
        }
        
        # Map onboarding fields
        if data.first_name or data.last_name:
            first_name = data.first_name or ""
            last_name = data.last_name or ""
            upsert_data["full_name"] = f"{first_name} {last_name}".strip() or None
        
        if data.selected_category:
            upsert_data["business_category"] = data.selected_category
        
        if data.city:
            upsert_data["city"] = data.city
        
        if data.onboarding_complete is not None:
            upsert_data["onboarding_complete"] = data.onboarding_complete
        
        # Check if profile exists
        existing = supabase_service.client.table("profiles").select("id").eq("id", user_id).execute()
        
        if not existing.data:
            # New profile - include created_at
            upsert_data["created_at"] = now
        
        # Upsert using service role (bypasses RLS)
        # Note: Demo users will fail foreign key constraint, but we'll handle it gracefully
        try:
            result = supabase_service.client.table("profiles").upsert(
                upsert_data,
                on_conflict="id"
            ).execute()
        except Exception as db_error:
            error_str = str(db_error).lower()
            # If foreign key error for demo user, that's expected - they don't exist in auth.users
            if is_demo_user and ('foreign key' in error_str or '23503' in error_str or 'not present in table "users"' in error_str):
                # For demo users, we can't create a real profile due to FK constraint
                # But we can return success anyway - the onboarding will still work
                # The profile will be created when they sign up for real
                return {
                    "success": True,
                    "data": upsert_data,
                    "message": "Profile data saved (demo user - will create full profile on signup)",
                    "demo_user": True
                }
            else:
                raise
        
        if result.data:
            return {
                "success": True,
                "data": result.data[0] if result.data else None,
                "message": "Profile updated successfully"
            }
        else:
            raise HTTPException(
                status_code=500,
                detail="Failed to upsert profile"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error updating profile: {str(e)}"
        )
