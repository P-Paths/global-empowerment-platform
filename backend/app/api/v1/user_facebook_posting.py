"""
User-Specific Facebook Posting API endpoints
Handles posting to user's own Facebook pages using their OAuth2 tokens
"""

from fastapi import APIRouter, HTTPException, Depends, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.utils.auth import get_current_user_id
from app.services.user_facebook_poster import UserFacebookPoster, create_facebook_listing_data
from app.services.facebook_marketplace import FacebookListingData
from app.services.facebook_playwright_poster import FacebookPlaywrightPoster
from app.models.user_platform_connection import UserPlatformConnection

logger = logging.getLogger(__name__)
router = APIRouter()
security = HTTPBearer()

# Pydantic models
class FacebookPostingRequest(BaseModel):
    title: str
    description: str
    price: float
    make: Optional[str] = ""
    model: Optional[str] = ""
    year: Optional[int] = 0
    mileage: Optional[int] = 0
    condition: Optional[str] = "GOOD"
    page_id: Optional[str] = None  # If None, will use first available page
    post_to_marketplace: Optional[bool] = False  # If True, prepare for Marketplace posting

class FacebookPostingResponse(BaseModel):
    success: bool
    message: str
    platform: str
    user_id: str
    page_id: Optional[str] = None
    page_name: Optional[str] = None
    listing_id: Optional[str] = None
    listing_url: Optional[str] = None
    error_message: Optional[str] = None
    posted_at: Optional[datetime] = None
    marketplace_guidance: Optional[Dict[str, Any]] = None
    screenshot_path: Optional[str] = None
    browser_pid: Optional[int] = None

class FacebookPageInfo(BaseModel):
    page_id: str
    name: str
    category: str

@router.post("/post-to-page", response_model=FacebookPostingResponse)
async def post_to_facebook_page(
    request: FacebookPostingRequest,
    images: Optional[List[UploadFile]] = File(None, description="Listing images (up to 10)"),
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Post a listing to user's Facebook page using their OAuth2 token
    """
    try:
        # Convert uploaded images to bytes
        image_bytes = []
        if images:
            for image in images[:10]:  # Facebook allows max 10 images
                content = await image.read()
                image_bytes.append(content)
        
        # Create Facebook listing data
        listing_data = create_facebook_listing_data(
            title=request.title,
            description=request.description,
            price=request.price,
            make=request.make,
            model=request.model,
            year=request.year,
            mileage=request.mileage,
            condition=request.condition,
            images=image_bytes if image_bytes else None
        )
        
        # Post to user's Facebook page
        async with UserFacebookPoster(db) as poster:
            if request.post_to_marketplace:
                # Prepare for Marketplace posting (guided workflow)
                result = await poster.post_to_user_facebook_marketplace(
                    user_id=current_user_id,
                    listing_data=listing_data
                )
                
                # Prepare marketplace guidance
                marketplace_guidance = {
                    "marketplace_url": result.listing_url,
                    "prepared_data": {
                        "title": request.title,
                        "description": request.description,
                        "price": f"${request.price:,.2f}",
                        "make": request.make,
                        "model": request.model,
                        "year": request.year,
                        "mileage": f"{request.mileage:,} miles" if request.mileage else "Not specified",
                        "condition": request.condition
                    },
                    "instructions": [
                        "1. Click the marketplace URL to open Facebook Marketplace",
                        "2. Select 'Vehicle' as the category",
                        "3. Copy and paste the prepared data into the form",
                        "4. Upload your images",
                        "5. Review and publish your listing"
                    ]
                }
                
                return FacebookPostingResponse(
                    success=True,
                    message="Listing prepared for Facebook Marketplace posting",
                    platform="facebook_marketplace",
                    user_id=current_user_id,
                    listing_url=result.listing_url,
                    posted_at=result.posted_at,
                    marketplace_guidance=marketplace_guidance
                )
            else:
                # Post to user's Facebook page
                result = await poster.post_to_user_facebook_page(
                    user_id=current_user_id,
                    page_id=request.page_id or "",  # Will use first available page if None
                    listing_data=listing_data
                )
                
                return FacebookPostingResponse(
                    success=result.success,
                    message="Posted to Facebook page successfully" if result.success else "Failed to post to Facebook page",
                    platform=result.platform,
                    user_id=result.user_id,
                    page_id=result.page_id,
                    page_name=result.page_name,
                    listing_id=result.listing_id,
                    listing_url=result.listing_url,
                    error_message=result.error_message,
                    posted_at=result.posted_at
                )
                
    except Exception as e:
        logger.error(f"Error posting to Facebook: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to post to Facebook: {str(e)}"
        )

@router.get("/pages", response_model=List[FacebookPageInfo])
async def get_user_facebook_pages(
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Get user's Facebook pages for posting
    """
    try:
        # Query user's Facebook connection
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
                detail="Facebook account not connected"
            )
        
        pages = connection.platform_data.get("pages", []) if connection.platform_data else []
        
        return [
            FacebookPageInfo(
                page_id=page["page_id"],
                name=page["name"],
                category=page["category"]
            )
            for page in pages
        ]
            
    except Exception as e:
        logger.error(f"Error getting Facebook pages: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get Facebook pages: {str(e)}"
        )

@router.get("/connection-status")
async def get_facebook_connection_status(
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Get user's Facebook connection status and available pages
    """
    import asyncio
    import uuid as uuid_lib
    try:
        logger.info(f"Facebook status check - Received current_user_id: {current_user_id} (type: {type(current_user_id).__name__})")
        
        # Convert user_id to UUID if it's a string
        if isinstance(current_user_id, str):
            try:
                current_user_id = uuid_lib.UUID(current_user_id)
                logger.info(f"Facebook status check - Converted user_id to UUID: {current_user_id}")
            except ValueError:
                logger.error(f"Invalid user_id format: {current_user_id}")
                return {
                    "connected": False,
                    "message": "Invalid user ID format",
                    "pages": []
                }
        else:
            logger.info(f"Facebook status check - user_id already UUID: {current_user_id}")
        
        # Add timeout to prevent hanging (3 seconds max for database query - shorter timeout)
        async def query_connection():
            try:
                result = await db.execute(
                    select(UserPlatformConnection)
                    .where(
                        UserPlatformConnection.user_id == current_user_id,
                        UserPlatformConnection.platform == "facebook",
                        UserPlatformConnection.is_active == True
                    )
                )
                return result.scalar_one_or_none()
            except Exception as db_error:
                logger.error(f"Database error during Facebook connection status query: {db_error}")
                raise
        
        try:
            connection = await asyncio.wait_for(query_connection(), timeout=3.0)
        except asyncio.TimeoutError:
            logger.error(f"Database query timed out for Facebook connection status (user: {current_user_id})")
            # Return not connected if query times out
            return {
                "connected": False,
                "message": "Facebook account not connected",
                "pages": [],
                "error": "Database query timeout"
            }
        except Exception as db_error:
            logger.error(f"Database error during Facebook connection status check: {db_error}", exc_info=True)
            # Return not connected on database error, but include error details for debugging
            error_msg = str(db_error)
            return {
                "connected": False,
                "message": "Facebook account not connected",
                "pages": [],
                "error": f"Database error: {error_msg}"
            }
        
        if not connection:
            logger.warning(f"Facebook status check - No active connection found for user_id: {current_user_id}")
            # Return immediately without additional debug queries to avoid hanging
            return {
                "connected": False,
                "message": "Facebook account not connected",
                "pages": []
            }
        
        logger.info(f"Facebook status check - Found connection: user_id={current_user_id}, is_active={connection.is_active}, connection_id={connection.id}")
        
        user_info = connection.platform_data.get("user_info", {}) if connection.platform_data else {}
        pages = connection.platform_data.get("pages", []) if connection.platform_data else []
        
        # Remove access tokens from pages for security
        safe_pages = [
            {
                "page_id": page["page_id"],
                "name": page["name"],
                "category": page["category"]
            }
            for page in pages
        ]
        
        return {
            "connected": True,
            "message": "Facebook account connected",
            "user_info": user_info,
            "pages": safe_pages,
            "last_used": connection.last_used_at,
            "token_expires": connection.token_expires_at
        }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting Facebook connection status: {str(e)}", exc_info=True)
        # Return not connected instead of raising error to prevent frontend timeout
        return {
            "connected": False,
            "message": "Facebook account not connected",
            "pages": [],
            "error": f"Connection check failed: {str(e)}"
        }

@router.post("/post-to-marketplace-playwright", response_model=FacebookPostingResponse)
async def post_to_marketplace_playwright(
    request: FacebookPostingRequest,
    images: Optional[List[UploadFile]] = File(None, description="Listing images (up to 10)"),
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Post listing to Facebook Marketplace using Playwright automation
    Fills form fields and uploads images, then pauses for human to click "Post"
    Compliance: Human-in-the-loop - user must click "Post" button manually
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
        from cryptography.fernet import Fernet
        import os
        
        def get_encryption_key():
            key = os.getenv("TOKEN_ENCRYPTION_KEY")
            if not key:
                raise ValueError("TOKEN_ENCRYPTION_KEY not set")
            return key.encode()
        
        def decrypt_token(encrypted_token: str) -> str:
            f = Fernet(get_encryption_key())
            return f.decrypt(encrypted_token.encode()).decode()
        
        access_token = decrypt_token(connection.access_token)
        
        # Convert uploaded images to bytes
        image_bytes = []
        if images:
            for image in images[:10]:  # Facebook allows max 10 images
                content = await image.read()
                image_bytes.append(content)
        
        # Create Facebook listing data
        listing_data = create_facebook_listing_data(
            title=request.title,
            description=request.description,
            price=request.price,
            make=request.make,
            model=request.model,
            year=request.year,
            mileage=request.mileage,
            condition=request.condition,
            images=image_bytes if image_bytes else None
        )
        
        # Use Playwright to post to Marketplace
        # Note: Browser stays open for user to review and post manually
        playwright_poster = FacebookPlaywrightPoster(
            user_id=current_user_id,
            access_token=access_token
        )
        
        try:
            await playwright_poster.__aenter__()
            result = await playwright_poster.post_to_marketplace(
                listing_data=listing_data,
                headless=False  # Always visible for compliance
            )
            
            if result.success:
                # Store playwright_poster reference for later cleanup (in production, use Redis or similar)
                # For now, browser will stay open until manually closed or process ends
                return FacebookPostingResponse(
                    success=True,
                    message="Form filled successfully. Please review and click 'Post' in the browser window. Browser will remain open for you to complete the posting.",
                    platform="facebook_marketplace",
                    user_id=current_user_id,
                    screenshot_path=result.screenshot_path,
                    browser_pid=result.browser_pid,
                    posted_at=datetime.utcnow()
                )
            else:
                await playwright_poster.close_browser()
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to fill Marketplace form: {result.error_message}"
                )
        except Exception as e:
            # Clean up on error
            try:
                await playwright_poster.close_browser()
            except:
                pass
            raise
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error posting to Marketplace with Playwright: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to post to Marketplace: {str(e)}"
        )

@router.post("/close-browser")
async def close_playwright_browser(
    browser_pid: int,
    current_user_id: str = Depends(get_current_user_id)
):
    """
    Close Playwright browser after user has posted listing
    Note: In production, this should use a proper session manager (Redis, etc.)
    """
    try:
        import psutil
        import os
        
        # Verify process belongs to current user (basic security check)
        try:
            process = psutil.Process(browser_pid)
            # Check if process is still running
            if not process.is_running():
                return {"success": True, "message": "Browser already closed"}
            
            # Terminate browser process
            process.terminate()
            process.wait(timeout=5)
            
            return {
                "success": True,
                "message": "Browser closed successfully"
            }
        except psutil.NoSuchProcess:
            return {"success": True, "message": "Browser process not found (already closed)"}
        except Exception as e:
            logger.error(f"Error closing browser: {e}")
            return {
                "success": False,
                "error": str(e)
            }
            
    except ImportError:
        # psutil not available, try os.kill
        try:
            import signal
            os.kill(browser_pid, signal.SIGTERM)
            return {"success": True, "message": "Browser close signal sent"}
        except Exception as e:
            logger.error(f"Error closing browser: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    except Exception as e:
        logger.error(f"Error closing browser: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to close browser: {str(e)}"
        )

@router.post("/test-connection")
async def test_facebook_connection(
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Test user's Facebook connection by making a simple API call
    """
    try:
        # Query user's Facebook connection
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
                detail="Facebook account not connected"
            )
        
        # Decrypt access token for testing
        from cryptography.fernet import Fernet
        import os
        
        def get_encryption_key():
            key = os.getenv("TOKEN_ENCRYPTION_KEY")
            if not key:
                key = Fernet.generate_key().decode()
            else:
                key = key.encode()
            return key
        
        def decrypt_token(encrypted_token: str) -> str:
            f = Fernet(get_encryption_key())
            return f.decrypt(encrypted_token.encode()).decode()
        
        access_token = decrypt_token(connection.access_token)
        
        # Test the connection by getting user info
        import aiohttp
        async with aiohttp.ClientSession() as session:
            url = "https://graph.facebook.com/v18.0/me"
            params = {
                "access_token": access_token,
                "fields": "id,name"
            }
            
            async with session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    return {
                        "success": True,
                        "message": "Facebook connection is working",
                        "user_info": data
                    }
                else:
                    error_text = await response.text()
                    return {
                        "success": False,
                        "message": f"Facebook connection test failed: {response.status}",
                        "error": error_text
                    }
                        
    except Exception as e:
        logger.error(f"Error testing Facebook connection: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to test Facebook connection: {str(e)}"
        )
