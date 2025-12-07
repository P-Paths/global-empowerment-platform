"""
User-Specific eBay Posting Service
Handles posting to user's own eBay account using their OAuth2 tokens
"""

import asyncio
import logging
import aiohttp
import json
import os
from typing import Dict, Any, List, Optional
from datetime import datetime
from dataclasses import dataclass
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.services.ebay_poster import eBayPoster, eBayListingData
from app.models.user_platform_connection import UserPlatformConnection
from cryptography.fernet import Fernet

logger = logging.getLogger(__name__)

@dataclass
class UsereBayPostingResult:
    """Result of posting to user's eBay account"""
    success: bool
    platform: str = "ebay"
    user_id: str = ""
    listing_id: Optional[str] = None
    listing_url: Optional[str] = None
    error_message: Optional[str] = None
    posted_at: Optional[datetime] = None

class UsereBayPoster:
    """
    Service for posting to user's own eBay account
    Uses user-specific OAuth2 tokens for multi-tenant posting
    """
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.session: Optional[aiohttp.ClientSession] = None
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    def _get_encryption_key(self) -> bytes:
        """Get encryption key for tokens"""
        key = os.getenv("TOKEN_ENCRYPTION_KEY")
        if not key:
            key = Fernet.generate_key().decode()
            logger.warning("TOKEN_ENCRYPTION_KEY not set. Generated temporary key.")
        else:
            key = key.encode()
        return key
    
    def _decrypt_token(self, encrypted_token: str) -> str:
        """Decrypt a stored token"""
        f = Fernet(self._get_encryption_key())
        return f.decrypt(encrypted_token.encode()).decode()
    
    async def get_user_ebay_connection(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get user's eBay connection from database
        
        Args:
            user_id: Accorria user ID
            
        Returns:
            User's eBay connection data or None
        """
        try:
            # Query user's eBay connection
            result = await self.db.execute(
                select(UserPlatformConnection)
                .where(
                    UserPlatformConnection.user_id == user_id,
                    UserPlatformConnection.platform == "ebay",
                    UserPlatformConnection.is_active == True
                )
            )
            connection = result.scalar_one_or_none()
            
            if not connection:
                return None
            
            # Decrypt access tokens
            decrypted_connection = {
                "user_id": str(connection.user_id),
                "platform": connection.platform,
                "platform_user_id": connection.platform_user_id,
                "platform_username": connection.platform_username,
                "access_token": self._decrypt_token(connection.access_token),
                "token_expires_at": connection.token_expires_at,
                "scopes": connection.scopes,
                "platform_data": connection.platform_data,
                "is_active": connection.is_active,
                "last_used_at": connection.last_used_at
            }
            
            return decrypted_connection
            
        except Exception as e:
            logger.error(f"Error getting user eBay connection: {str(e)}")
            return None
    
    async def post_to_user_ebay(
        self, 
        user_id: str, 
        listing_data: eBayListingData
    ) -> UsereBayPostingResult:
        """
        Post a listing to user's eBay account
        
        Args:
            user_id: Accorria user ID
            listing_data: Listing data to post
            
        Returns:
            Posting result
        """
        try:
            # Get user's eBay connection
            connection = await self.get_user_ebay_connection(user_id)
            
            if not connection:
                return UsereBayPostingResult(
                    success=False,
                    user_id=user_id,
                    error_message="eBay account not connected"
                )
            
            # Check if connection is active
            if not connection["is_active"]:
                return UsereBayPostingResult(
                    success=False,
                    user_id=user_id,
                    error_message="eBay connection is inactive"
                )
            
            # Check token expiration
            if connection["token_expires_at"] and connection["token_expires_at"] < datetime.utcnow():
                return UsereBayPostingResult(
                    success=False,
                    user_id=user_id,
                    error_message="eBay access token has expired. Please reconnect your account."
                )
            
            # Get user's eBay auth token from connection
            ebay_auth_token = connection["access_token"]
            
            # Get eBay API credentials from environment or connection
            from app.core.config import settings
            ebay_app_id = connection.get("platform_data", {}).get("app_id") or os.getenv("EBAY_APP_ID") or settings.EBAY_APP_ID
            ebay_dev_id = connection.get("platform_data", {}).get("dev_id") or os.getenv("EBAY_DEV_ID") or settings.EBAY_DEV_ID
            ebay_cert_id = connection.get("platform_data", {}).get("cert_id") or os.getenv("EBAY_CERT_ID") or settings.EBAY_CERT_ID
            
            # Create eBay API instance with user's token
            async with eBayPoster(
                app_id=ebay_app_id,
                dev_id=ebay_dev_id,
                cert_id=ebay_cert_id,
                auth_token=ebay_auth_token
            ) as ebay_api:
                # Post the listing
                result = await ebay_api.create_listing(listing_data)
                
                if result["success"]:
                    # Update last used timestamp
                    await self._update_connection_last_used(user_id)
                    
                    return UsereBayPostingResult(
                        success=True,
                        user_id=user_id,
                        listing_id=result["listing_id"],
                        listing_url=result["url"],
                        posted_at=datetime.utcnow()
                    )
                else:
                    return UsereBayPostingResult(
                        success=False,
                        user_id=user_id,
                        error_message=result.get("error", "Unknown error")
                    )
                    
        except Exception as e:
            logger.error(f"Error posting to user eBay account: {str(e)}")
            return UsereBayPostingResult(
                success=False,
                user_id=user_id,
                error_message=str(e)
            )
    
    async def _update_connection_last_used(self, user_id: str):
        """Update the last_used_at timestamp for user's eBay connection"""
        try:
            # Update last_used_at timestamp in database
            await self.db.execute(
                update(UserPlatformConnection)
                .where(
                    UserPlatformConnection.user_id == user_id,
                    UserPlatformConnection.platform == "ebay"
                )
                .values(last_used_at=datetime.utcnow())
            )
            await self.db.commit()
            logger.info(f"Updated last_used_at for user {user_id} eBay connection")
            
        except Exception as e:
            logger.error(f"Error updating connection last_used_at: {str(e)}")
            await self.db.rollback()

# Helper function to create eBay listing data from Accorria listing
def create_ebay_listing_data(
    title: str,
    description: str,
    price: float,
    make: str = "",
    model: str = "",
    year: int = 0,
    mileage: int = 0,
    condition: str = "Used",
    images: Optional[List[bytes]] = None,
    location: Optional[Dict[str, Any]] = None,
    vin: Optional[str] = None
) -> eBayListingData:
    """
    Create eBayListingData from Accorria listing data
    
    Args:
        title: Listing title
        description: Listing description
        price: Listing price
        make: Vehicle make
        model: Vehicle model
        year: Vehicle year
        mileage: Vehicle mileage
        condition: Vehicle condition
        images: Listing images
        location: Listing location
        vin: Vehicle VIN
        
    Returns:
        eBayListingData object
    """
    return eBayListingData(
        title=title,
        description=description,
        price=price,
        make=make,
        model=model,
        year=year,
        mileage=mileage,
        condition=condition,
        images=images,
        location=location,
        vin=vin
    )

