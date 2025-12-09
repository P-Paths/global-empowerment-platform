"""
Global Empowerment Platform - Community Feed API
Handles posts, likes, comments, shares
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from typing import List, Optional
from datetime import datetime
import uuid

from app.core.database import get_db
from app.models.gep_models import GEPPost, GEPPostLike, GEPPostComment, GEPMember
from app.utils.auth import get_current_user
from pydantic import BaseModel

router = APIRouter()


class PostCreate(BaseModel):
    content: Optional[str] = None
    image_urls: Optional[List[str]] = []
    video_url: Optional[str] = None
    post_type: str = "text"
    hashtags: Optional[List[str]] = []
    mentions: Optional[List[str]] = []


class PostResponse(BaseModel):
    id: str
    member_id: str
    content: Optional[str]
    image_urls: Optional[List[str]]
    video_url: Optional[str]
    post_type: str
    hashtags: Optional[List[str]]
    likes_count: int
    comments_count: int
    shares_count: int
    created_at: datetime
    member: dict
    
    class Config:
        from_attributes = True


class CommentCreate(BaseModel):
    content: str
    parent_comment_id: Optional[str] = None


@router.post("/posts", response_model=PostResponse)
async def create_post(
    post_data: PostCreate,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Create a new post"""
    current_user = get_current_user(request)
    # Get or create member profile
    user_id = current_user.get("sub") or current_user.get("id")
    result = await db.execute(
        select(GEPMember).where(GEPMember.user_id == uuid.UUID(user_id))
    )
    member = result.scalar_one_or_none()
    
    if not member:
        raise HTTPException(status_code=404, detail="Member profile not found. Please complete your profile.")
    
    # Create post
    new_post = GEPPost(
        member_id=member.id,
        content=post_data.content,
        image_urls=post_data.image_urls or [],
        video_url=post_data.video_url,
        post_type=post_data.post_type,
        hashtags=post_data.hashtags or [],
        mentions=post_data.mentions or []
    )
    
    db.add(new_post)
    await db.commit()
    await db.refresh(new_post)
    
    # Return with member info
    return {
        "id": str(new_post.id),
        "member_id": str(new_post.member_id),
        "content": new_post.content,
        "image_urls": new_post.image_urls or [],
        "video_url": new_post.video_url,
        "post_type": new_post.post_type,
        "hashtags": new_post.hashtags or [],
        "likes_count": new_post.likes_count,
        "comments_count": new_post.comments_count,
        "shares_count": new_post.shares_count,
        "created_at": new_post.created_at,
        "member": {
            "id": str(member.id),
            "business_name": member.business_name,
            "profile_image_url": member.profile_image_url
        }
    }


@router.get("/feed", response_model=List[PostResponse])
async def get_feed(
    limit: int = 20,
    offset: int = 0,
    db: AsyncSession = Depends(get_db)
):
    """Get community feed (latest posts)"""
    result = await db.execute(
        select(GEPPost, GEPMember)
        .join(GEPMember, GEPPost.member_id == GEPMember.id)
        .where(GEPPost.is_published == True)
        .order_by(desc(GEPPost.created_at))
        .limit(limit)
        .offset(offset)
    )
    
    posts = []
    for post, member in result.all():
        posts.append({
            "id": str(post.id),
            "member_id": str(post.member_id),
            "content": post.content,
            "image_urls": post.image_urls or [],
            "video_url": post.video_url,
            "post_type": post.post_type,
            "hashtags": post.hashtags or [],
            "likes_count": post.likes_count,
            "comments_count": post.comments_count,
            "shares_count": post.shares_count,
            "created_at": post.created_at,
            "member": {
                "id": str(member.id),
                "business_name": member.business_name,
                "profile_image_url": member.profile_image_url
            }
        })
    
    return posts


@router.post("/posts/{post_id}/like")
async def like_post(
    post_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    current_user = get_current_user(request)
    """Like a post"""
    # Get member
    user_id = current_user.get("sub") or current_user.get("id")
    result = await db.execute(
        select(GEPMember).where(GEPMember.user_id == uuid.UUID(user_id))
    )
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=404, detail="Member profile not found")
    
    # Check if post exists
    result = await db.execute(
        select(GEPPost).where(GEPPost.id == uuid.UUID(post_id))
    )
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Check if already liked
    result = await db.execute(
        select(GEPPostLike).where(
            GEPPostLike.post_id == uuid.UUID(post_id),
            GEPPostLike.member_id == member.id
        )
    )
    existing_like = result.scalar_one_or_none()
    
    if existing_like:
        # Unlike
        await db.delete(existing_like)
        post.likes_count = max(0, post.likes_count - 1)
        await db.commit()
        return {"liked": False, "likes_count": post.likes_count}
    else:
        # Like
        new_like = GEPPostLike(
            post_id=uuid.UUID(post_id),
            member_id=member.id
        )
        db.add(new_like)
        post.likes_count += 1
        await db.commit()
        return {"liked": True, "likes_count": post.likes_count}


@router.post("/posts/{post_id}/comments")
async def create_comment(
    post_id: str,
    comment_data: CommentCreate,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    current_user = get_current_user(request)
    """Add a comment to a post"""
    # Get member
    user_id = current_user.get("sub") or current_user.get("id")
    result = await db.execute(
        select(GEPMember).where(GEPMember.user_id == uuid.UUID(user_id))
    )
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=404, detail="Member profile not found")
    
    # Check if post exists
    result = await db.execute(
        select(GEPPost).where(GEPPost.id == uuid.UUID(post_id))
    )
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Create comment
    new_comment = GEPPostComment(
        post_id=uuid.UUID(post_id),
        member_id=member.id,
        content=comment_data.content,
        parent_comment_id=uuid.UUID(comment_data.parent_comment_id) if comment_data.parent_comment_id else None
    )
    
    db.add(new_comment)
    post.comments_count += 1
    await db.commit()
    await db.refresh(new_comment)
    
    return {
        "id": str(new_comment.id),
        "content": new_comment.content,
        "member_id": str(member.id),
        "member_name": member.business_name,
        "created_at": new_comment.created_at
    }


@router.get("/posts/{post_id}/comments")
async def get_comments(
    post_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get all comments for a post"""
    result = await db.execute(
        select(GEPPostComment, GEPMember)
        .join(GEPMember, GEPPostComment.member_id == GEPMember.id)
        .where(GEPPostComment.post_id == uuid.UUID(post_id))
        .order_by(GEPPostComment.created_at)
    )
    
    comments = []
    for comment, member in result.all():
        comments.append({
            "id": str(comment.id),
            "content": comment.content,
            "member_id": str(member.id),
            "member_name": member.business_name,
            "member_image": member.profile_image_url,
            "created_at": comment.created_at
        })
    
    return comments

