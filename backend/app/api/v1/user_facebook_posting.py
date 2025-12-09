"""
GEP Platform - Facebook Social Posting API
Simple endpoint for posting social media content to Facebook
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.utils.auth import get_current_user_id
from app.models.user_platform_connection import UserPlatformConnection
from app.services.user_facebook_poster import post_to_facebook
from cryptography.fernet import Fernet
import os

logger = logging.getLogger(__name__)
router = APIRouter()


class FacebookPostRequest(BaseModel):
    """Request model for Facebook posting"""
    message: str
    mediaUrl: Optional[str] = None


class FacebookPostResponse(BaseModel):
    """Response model for Facebook posting"""
    status: str  # "success" or "error"
    facebookResponse: Optional[dict] = None
    error: Optional[str] = None


def _get_encryption_key() -> bytes:
    """Get encryption key for tokens"""
    key = os.getenv("TOKEN_ENCRYPTION_KEY")
    if not key:
        raise ValueError("TOKEN_ENCRYPTION_KEY not set")
    return key.encode()


def _decrypt_token(encrypted_token: str) -> str:
    """Decrypt a stored token"""
    f = Fernet(_get_encryption_key())
    return f.decrypt(encrypted_token.encode()).decode()


@router.post("/post", response_model=FacebookPostResponse)
async def post_to_facebook_endpoint(
    request: FacebookPostRequest,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Post content to user's Facebook account
    
    Request body:
    {
        "message": "Your post text here",
        "mediaUrl": "https://example.com/image.jpg" (optional)
    }
    
    Returns:
    {
        "status": "success",
        "facebookResponse": {...}
    }
    """
    try:
        # Get user's Facebook connection
        result = await db.execute(
            select(UserPlatformConnection)
            .where(
                UserPlatformConnection.user_id == current_user_id,
                UserPlatformConnection.platform == "facebook",
                UserPlatformConnection.is_active == True
            )
        )
        connection = result.scalar_one_or_none()
        
        if not connection:
            raise HTTPException(
                status_code=404,
                detail="Facebook account not connected. Please connect your Facebook account first."
            )
        
        # Decrypt access token
        access_token = _decrypt_token(connection.access_token)
        
        # TODO: Get user's default page ID if they want to post to a page instead of timeline
        # For now, we'll post to user's timeline (page_id=None)
        page_id = None
        
        # Post to Facebook using the simplified service
        result = await post_to_facebook(
            user_access_token=access_token,
            message=request.message,
            media_url=request.mediaUrl,
            page_id=page_id
        )
        
        if result["success"]:
            return FacebookPostResponse(
                status="success",
                facebookResponse=result
            )
        else:
            return FacebookPostResponse(
                status="error",
                error=result.get("error", "Unknown error"),
                facebookResponse=result
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error posting to Facebook: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to post to Facebook: {str(e)}"
        )
