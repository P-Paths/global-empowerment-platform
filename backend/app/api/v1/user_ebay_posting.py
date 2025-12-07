"""
User-Specific eBay Posting API endpoints
Handles posting to user's own eBay account using their OAuth2 tokens
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
from app.services.user_ebay_poster import UsereBayPoster, create_ebay_listing_data
from app.services.ebay_poster import eBayListingData
from app.models.user_platform_connection import UserPlatformConnection

logger = logging.getLogger(__name__)
router = APIRouter()
security = HTTPBearer()

# Pydantic models
class eBayPostingRequest(BaseModel):
    title: str
    description: str
    price: float
    make: Optional[str] = ""
    model: Optional[str] = ""
    year: Optional[int] = 0
    mileage: Optional[int] = 0
    condition: Optional[str] = "Used"
    vin: Optional[str] = None

class eBayPostingResponse(BaseModel):
    success: bool
    message: str
    platform: str
    user_id: str
    listing_id: Optional[str] = None
    listing_url: Optional[str] = None
    error_message: Optional[str] = None
    posted_at: Optional[datetime] = None

@router.post("/ebay/post-listing", response_model=eBayPostingResponse)
async def post_to_ebay(
    request: eBayPostingRequest,
    images: Optional[List[UploadFile]] = File(None, description="Listing images (up to 12)"),
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Post a listing to user's eBay account using their OAuth2 token
    """
    try:
        # Convert uploaded images to bytes
        image_bytes = []
        if images:
            for image in images[:12]:  # eBay allows max 12 images
                content = await image.read()
                image_bytes.append(content)
        
        # Create eBay listing data
        listing_data = create_ebay_listing_data(
            title=request.title,
            description=request.description,
            price=request.price,
            make=request.make,
            model=request.model,
            year=request.year,
            mileage=request.mileage,
            condition=request.condition,
            images=image_bytes if image_bytes else None,
            vin=request.vin
        )
        
        # Post to user's eBay account
        async with UsereBayPoster(db) as poster:
            result = await poster.post_to_user_ebay(
                user_id=current_user_id,
                listing_data=listing_data
            )
            
            return eBayPostingResponse(
                success=result.success,
                message="Posted to eBay successfully" if result.success else "Failed to post to eBay",
                platform=result.platform,
                user_id=result.user_id,
                listing_id=result.listing_id,
                listing_url=result.listing_url,
                error_message=result.error_message,
                posted_at=result.posted_at
            )
                
    except Exception as e:
        logger.error(f"Error posting to eBay: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to post to eBay: {str(e)}"
        )

@router.get("/ebay/connection-status")
async def get_ebay_connection_status(
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Get user's eBay connection status
    """
    try:
        # Query user's eBay connection
        result = await db.execute(
            select(UserPlatformConnection)
            .where(
                UserPlatformConnection.user_id == current_user_id,
                UserPlatformConnection.platform == "ebay",
                UserPlatformConnection.is_active == True
            )
        )
        connection = result.scalar_one_or_none()
        
        if not connection:
            return {
                "connected": False,
                "message": "eBay account not connected"
            }
        
        user_info = connection.platform_data.get("user_info", {}) if connection.platform_data else {}
        
        return {
            "connected": True,
            "message": "eBay account connected",
            "user_info": user_info,
            "last_used": connection.last_used_at,
            "token_expires": connection.token_expires_at
        }
            
    except Exception as e:
        logger.error(f"Error getting eBay connection status: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get connection status: {str(e)}"
        )

@router.post("/ebay/test-connection")
async def test_ebay_connection(
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Test user's eBay connection by making a simple API call
    """
    try:
        # Query user's eBay connection
        result = await db.execute(
            select(UserPlatformConnection)
            .where(
                UserPlatformConnection.user_id == current_user_id,
                UserPlatformConnection.platform == "ebay",
                UserPlatformConnection.is_active == True
            )
        )
        connection = result.scalar_one_or_none()
        
        if not connection:
            raise HTTPException(
                status_code=404,
                detail="eBay account not connected"
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
        
        auth_token = decrypt_token(connection.access_token)
        
        # Test the connection by getting user info (GetUser API call)
        import aiohttp
        import xml.etree.ElementTree as ET
        
        # Build XML request for GetUser API
        xml_request = f"""<?xml version="1.0" encoding="utf-8"?>
<GetUserRequest xmlns="urn:ebay:apis:eBLBaseComponents">
    <RequesterCredentials>
        <eBayAuthToken>{auth_token}</eBayAuthToken>
    </RequesterCredentials>
    <ErrorLanguage>en_US</ErrorLanguage>
    <WarningLevel>High</WarningLevel>
</GetUserRequest>"""
        
        from app.core.config import settings
        api_url = os.getenv("EBAY_SANDBOX_URL", "https://api.sandbox.ebay.com/ws/api.dll")
        if not os.getenv("EBAY_SANDBOX", "true").lower() == "true":
            api_url = os.getenv("EBAY_API_URL", "https://api.ebay.com/ws/api.dll")
        
        headers = {
            "X-EBAY-API-COMPATIBILITY-LEVEL": "967",
            "X-EBAY-API-CALL-NAME": "GetUser",
            "X-EBAY-API-SITEID": "0",
            "Content-Type": "text/xml"
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(api_url, headers=headers, data=xml_request) as response:
                if response.status == 200:
                    xml_response = await response.text()
                    root = ET.fromstring(xml_response)
                    
                    # Check for errors
                    errors = root.findall(".//{urn:ebay:apis:eBLBaseComponents}Errors")
                    if errors:
                        error_msg = "eBay connection test failed"
                        for error in errors:
                            short_msg = error.find(".//{urn:ebay:apis:eBLBaseComponents}ShortMessage")
                            if short_msg is not None:
                                error_msg = short_msg.text
                                break
                        return {
                            "success": False,
                            "message": error_msg
                        }
                    
                    # Get user info
                    user = root.find(".//{urn:ebay:apis:eBLBaseComponents}User")
                    if user is not None:
                        user_id = user.find(".//{urn:ebay:apis:eBLBaseComponents}UserID")
                        if user_id is not None:
                            return {
                                "success": True,
                                "message": "eBay connection is working",
                                "user_id": user_id.text
                            }
                    
                    return {
                        "success": True,
                        "message": "eBay connection is working"
                    }
                else:
                    error_text = await response.text()
                    return {
                        "success": False,
                        "message": f"eBay connection test failed: {response.status}",
                        "error": error_text
                    }
                        
    except Exception as e:
        logger.error(f"Error testing eBay connection: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to test eBay connection: {str(e)}"
        )

