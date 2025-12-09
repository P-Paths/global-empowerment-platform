"""
GEM Platform - Posts API
Handles social feed posts
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List, Optional
from datetime import datetime
import uuid

from app.core.database import get_db
from app.models.gep_models import Profile, Post
from app.utils.auth import get_current_user
from pydantic import BaseModel

router = APIRouter()


class PostResponse(BaseModel):
    id: str
    user_id: str
    message: Optional[str]
    media_url: Optional[str]
    likes_count: int
    comments_count: int
    created_at: datetime
    user: dict
    
    class Config:
        from_attributes = True


class PostCreate(BaseModel):
    message: Optional[str] = None
    media_url: Optional[str] = None


@router.get("/posts", response_model=List[PostResponse])
async def get_posts(
    limit: int = 50,
    db: AsyncSession = Depends(get_db)
):
    """Get latest 50 posts"""
    result = await db.execute(
        select(Post, Profile)
        .join(Profile, Post.user_id == Profile.id)
        .order_by(desc(Post.created_at))
        .limit(limit)
    )
    
    posts = []
    for post, profile in result.all():
        posts.append({
            "id": str(post.id),
            "user_id": str(post.user_id),
            "message": post.message,
            "media_url": post.media_url,
            "likes_count": post.likes_count,
            "comments_count": post.comments_count,
            "created_at": post.created_at,
            "user": {
                "id": str(profile.id),
                "full_name": profile.full_name,
                "avatar_url": profile.avatar_url,
                "business_name": profile.business_name
            }
        })
    
    return posts


@router.post("/posts", response_model=PostResponse)
async def create_post(
    post_data: PostCreate,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Create a new post"""
    current_user = get_current_user(request)
    user_id = current_user.get("sub") or current_user.get("id")
    
    # Get profile
    result = await db.execute(
        select(Profile).where(Profile.user_id == uuid.UUID(user_id))
    )
    profile = result.scalar_one_or_none()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found. Please complete your profile.")
    
    # Create post
    new_post = Post(
        user_id=profile.id,
        message=post_data.message,
        media_url=post_data.media_url
    )
    
    db.add(new_post)
    await db.commit()
    await db.refresh(new_post)
    
    return {
        "id": str(new_post.id),
        "user_id": str(new_post.user_id),
        "message": new_post.message,
        "media_url": new_post.media_url,
        "likes_count": new_post.likes_count,
        "comments_count": new_post.comments_count,
        "created_at": new_post.created_at,
        "user": {
            "id": str(profile.id),
            "full_name": profile.full_name,
            "avatar_url": profile.avatar_url,
            "business_name": profile.business_name
        }
    }


@router.post("/posts/{post_id}/like")
async def like_post(
    post_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Like or unlike a post"""
    current_user = get_current_user(request)
    user_id = current_user.get("sub") or current_user.get("id")
    
    # Get profile
    result = await db.execute(
        select(Profile).where(Profile.user_id == uuid.UUID(user_id))
    )
    profile = result.scalar_one_or_none()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Get post
    result = await db.execute(
        select(Post).where(Post.id == uuid.UUID(post_id))
    )
    post = result.scalar_one_or_none()
    
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Toggle like (simplified - in production, use a likes table)
    # For MVP, we'll just increment/decrement
    post.likes_count += 1
    await db.commit()
    
    return {"liked": True, "likes_count": post.likes_count}
