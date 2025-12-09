"""
GEM Platform - Followers API
Handles follow/unfollow relationships
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List
import uuid

from app.core.database import get_db
from app.models.gep_models import Profile, Follower
from app.utils.auth import get_current_user
from pydantic import BaseModel

router = APIRouter()


class FollowerResponse(BaseModel):
    id: str
    follower_id: str
    following_id: str
    created_at: str


@router.post("/follow/{user_id}")
async def follow_user(
    user_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Follow a user"""
    current_user = get_current_user(request)
    current_user_id = current_user.get("sub") or current_user.get("id")
    
    # Get current user's profile
    result = await db.execute(
        select(Profile).where(Profile.user_id == uuid.UUID(current_user_id))
    )
    current_profile = result.scalar_one_or_none()
    
    if not current_profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Get target profile
    result = await db.execute(
        select(Profile).where(Profile.id == uuid.UUID(user_id))
    )
    target_profile = result.scalar_one_or_none()
    
    if not target_profile:
        raise HTTPException(status_code=404, detail="User not found")
    
    if current_profile.id == target_profile.id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")
    
    # Check if already following
    result = await db.execute(
        select(Follower).where(
            Follower.follower_id == current_profile.id,
            Follower.following_id == target_profile.id
        )
    )
    existing = result.scalar_one_or_none()
    
    if existing:
        raise HTTPException(status_code=400, detail="Already following this user")
    
    # Create follow relationship
    new_follow = Follower(
        follower_id=current_profile.id,
        following_id=target_profile.id
    )
    
    db.add(new_follow)
    current_profile.following_count += 1
    target_profile.followers_count += 1
    await db.commit()
    
    return {"success": True, "message": "Now following user"}


@router.delete("/follow/{user_id}")
async def unfollow_user(
    user_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Unfollow a user"""
    current_user = get_current_user(request)
    current_user_id = current_user.get("sub") or current_user.get("id")
    
    # Get current user's profile
    result = await db.execute(
        select(Profile).where(Profile.user_id == uuid.UUID(current_user_id))
    )
    current_profile = result.scalar_one_or_none()
    
    if not current_profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Get target profile
    result = await db.execute(
        select(Profile).where(Profile.id == uuid.UUID(user_id))
    )
    target_profile = result.scalar_one_or_none()
    
    if not target_profile:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Find and delete follow relationship
    result = await db.execute(
        select(Follower).where(
            Follower.follower_id == current_profile.id,
            Follower.following_id == target_profile.id
        )
    )
    follow = result.scalar_one_or_none()
    
    if not follow:
        raise HTTPException(status_code=404, detail="Not following this user")
    
    await db.delete(follow)
    current_profile.following_count = max(0, current_profile.following_count - 1)
    target_profile.followers_count = max(0, target_profile.followers_count - 1)
    await db.commit()
    
    return {"success": True, "message": "Unfollowed user"}


@router.get("/followers/{user_id}", response_model=List[FollowerResponse])
async def get_followers(
    user_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get followers of a user"""
    result = await db.execute(
        select(Follower).where(Follower.following_id == uuid.UUID(user_id))
    )
    followers = result.scalars().all()
    
    return [
        {
            "id": str(f.id),
            "follower_id": str(f.follower_id),
            "following_id": str(f.following_id),
            "created_at": f.created_at.isoformat()
        }
        for f in followers
    ]


@router.get("/following/{user_id}", response_model=List[FollowerResponse])
async def get_following(
    user_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get users that a user is following"""
    result = await db.execute(
        select(Follower).where(Follower.follower_id == uuid.UUID(user_id))
    )
    following = result.scalars().all()
    
    return [
        {
            "id": str(f.id),
            "follower_id": str(f.follower_id),
            "following_id": str(f.following_id),
            "created_at": f.created_at.isoformat()
        }
        for f in following
    ]

