"""
GEM Platform - Comments API
Handles post comments
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from datetime import datetime
import uuid

from app.core.database import get_db
from app.models.gep_models import Profile, Post, Comment
from app.utils.auth import get_current_user
from pydantic import BaseModel

router = APIRouter()


class CommentResponse(BaseModel):
    id: str
    post_id: str
    user_id: str
    message: str
    created_at: datetime
    user: dict
    
    class Config:
        from_attributes = True


class CommentCreate(BaseModel):
    message: str


@router.get("/posts/{post_id}/comments", response_model=List[CommentResponse])
async def get_comments(
    post_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get all comments for a post"""
    result = await db.execute(
        select(Comment, Profile)
        .join(Profile, Comment.user_id == Profile.id)
        .where(Comment.post_id == uuid.UUID(post_id))
        .order_by(Comment.created_at)
    )
    
    comments = []
    for comment, profile in result.all():
        comments.append({
            "id": str(comment.id),
            "post_id": str(comment.post_id),
            "user_id": str(comment.user_id),
            "message": comment.message,
            "created_at": comment.created_at,
            "user": {
                "id": str(profile.id),
                "full_name": profile.full_name,
                "avatar_url": profile.avatar_url,
                "business_name": profile.business_name
            }
        })
    
    return comments


@router.post("/posts/{post_id}/comments", response_model=CommentResponse)
async def create_comment(
    post_id: str,
    comment_data: CommentCreate,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Add a comment to a post"""
    current_user = get_current_user(request)
    user_id = current_user.get("sub") or current_user.get("id")
    
    # Get profile
    result = await db.execute(
        select(Profile).where(Profile.user_id == uuid.UUID(user_id))
    )
    profile = result.scalar_one_or_none()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Check if post exists
    result = await db.execute(
        select(Post).where(Post.id == uuid.UUID(post_id))
    )
    post = result.scalar_one_or_none()
    
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Create comment
    new_comment = Comment(
        post_id=uuid.UUID(post_id),
        user_id=profile.id,
        message=comment_data.message
    )
    
    db.add(new_comment)
    post.comments_count += 1
    await db.commit()
    await db.refresh(new_comment)
    
    return {
        "id": str(new_comment.id),
        "post_id": str(new_comment.post_id),
        "user_id": str(new_comment.user_id),
        "message": new_comment.message,
        "created_at": new_comment.created_at,
        "user": {
            "id": str(profile.id),
            "full_name": profile.full_name,
            "avatar_url": profile.avatar_url,
            "business_name": profile.business_name
        }
    }
