"""
User-Specific Facebook Posting Service
Handles posting to user's own Facebook pages using their OAuth2 tokens
"""

import asyncio
import logging
import aiohttp
import json
from typing import Dict, Any, List, Optional
from datetime import datetime
from dataclasses import dataclass
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.services.facebook_marketplace import FacebookMarketplaceAPI, FacebookListingData
from app.services.facebook_oauth import FacebookOAuthService, get_facebook_oauth_config
from app.models.user_platform_connection import UserPlatformConnection
from cryptography.fernet import Fernet
import os

logger = logging.getLogger(__name__)

@dataclass
class UserFacebookPostingResult:
    """Result of posting to user's Facebook account"""
    success: bool
    platform: str = "facebook"
    user_id: str = ""
    page_id: str = ""
    page_name: str = ""
    listing_id: Optional[str] = None
    listing_url: Optional[str] = None
    error_message: Optional[str] = None
    posted_at: Optional[datetime] = None

class UserFacebookPoster:
    """
    Service for posting to user's own Facebook pages
    Uses user-specific OAuth2 tokens for multi-tenant posting
    """
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.api_base_url = "https://graph.facebook.com/v18.0"
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
    
    async def get_user_facebook_connection(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get user's Facebook connection from database
        
        Args:
            user_id: Accorria user ID
            
        Returns:
            User's Facebook connection data or None
        """
        try:
            # Query user's Facebook connection
            result = await self.db.execute(
                select(UserPlatformConnection)
                .where(
                    UserPlatformConnection.user_id == user_id,
                    UserPlatformConnection.platform == "facebook",
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
            
            # Decrypt page access tokens
            if connection.platform_data and "pages" in connection.platform_data:
                for page in connection.platform_data["pages"]:
                    if "access_token" in page:
                        page["access_token"] = self._decrypt_token(page["access_token"])
            
            return decrypted_connection
            
        except Exception as e:
            logger.error(f"Error getting user Facebook connection: {str(e)}")
            return None
    
    async def post_to_user_facebook_page(
        self, 
        user_id: str, 
        page_id: str, 
        listing_data: FacebookListingData
    ) -> UserFacebookPostingResult:
        """
        Post a listing to user's specific Facebook page
        
        Args:
            user_id: Accorria user ID
            page_id: Facebook page ID to post to
            listing_data: Listing data to post
            
        Returns:
            Posting result
        """
        try:
            # Get user's Facebook connection
            connection = await self.get_user_facebook_connection(user_id)
            
            if not connection:
                return UserFacebookPostingResult(
                    success=False,
                    user_id=user_id,
                    error_message="Facebook account not connected"
                )
            
            # Check if connection is active
            if not connection["is_active"]:
                return UserFacebookPostingResult(
                    success=False,
                    user_id=user_id,
                    error_message="Facebook connection is inactive"
                )
            
            # Check token expiration
            if connection["token_expires_at"] and connection["token_expires_at"] < datetime.utcnow():
                return UserFacebookPostingResult(
                    success=False,
                    user_id=user_id,
                    error_message="Facebook access token has expired. Please reconnect your account."
                )
            
            # Find the specific page
            page_info = None
            for page in connection["platform_data"].get("pages", []):
                if page["page_id"] == page_id:
                    page_info = page
                    break
            
            if not page_info:
                return UserFacebookPostingResult(
                    success=False,
                    user_id=user_id,
                    error_message=f"Page {page_id} not found in your Facebook account"
                )
            
            # Use the page's access token for posting
            page_access_token = page_info["access_token"]
            
            # Create Facebook API instance with user's token
            async with FacebookMarketplaceAPI(
                access_token=page_access_token,
                page_id=page_id,
                user_id=user_id
            ) as facebook_api:
                # Post the listing
                result = await facebook_api.create_listing(listing_data)
                
                if result["success"]:
                    # Update last used timestamp
                    await self._update_connection_last_used(user_id)
                    
                    return UserFacebookPostingResult(
                        success=True,
                        user_id=user_id,
                        page_id=page_id,
                        page_name=page_info["name"],
                        listing_id=result["listing_id"],
                        listing_url=result["url"],
                        posted_at=datetime.utcnow()
                    )
                else:
                    return UserFacebookPostingResult(
                        success=False,
                        user_id=user_id,
                        page_id=page_id,
                        page_name=page_info["name"],
                        error_message=result.get("error", "Unknown error")
                    )
                    
        except Exception as e:
            logger.error(f"Error posting to user Facebook page: {str(e)}")
            return UserFacebookPostingResult(
                success=False,
                user_id=user_id,
                page_id=page_id,
                error_message=str(e)
            )
    
    async def post_to_user_facebook_marketplace(
        self, 
        user_id: str, 
        listing_data: FacebookListingData
    ) -> UserFacebookPostingResult:
        """
        Post a listing to user's Facebook Marketplace
        Note: Direct Marketplace API posting requires special approval from Facebook
        This method provides a guided workflow for manual posting
        
        Args:
            user_id: Accorria user ID
            listing_data: Listing data to post
            
        Returns:
            Posting result with guidance for manual posting
        """
        try:
            # Get user's Facebook connection
            connection = await self.get_user_facebook_connection(user_id)
            
            if not connection:
                return UserFacebookPostingResult(
                    success=False,
                    user_id=user_id,
                    error_message="Facebook account not connected"
                )
            
            # Since direct Marketplace posting isn't available for most apps,
            # we'll provide a guided workflow
            marketplace_url = "https://www.facebook.com/marketplace/create/vehicle"
            
            # Prepare data for easy copy-paste
            prepared_data = {
                "title": listing_data.title,
                "description": listing_data.description,
                "price": f"${listing_data.price:,.2f}",
                "make": listing_data.make,
                "model": listing_data.model,
                "year": listing_data.year,
                "mileage": f"{listing_data.mileage:,} miles" if listing_data.mileage else "Not specified",
                "condition": listing_data.condition,
                "marketplace_url": marketplace_url
            }
            
            return UserFacebookPostingResult(
                success=True,
                user_id=user_id,
                platform="facebook_marketplace",
                listing_url=marketplace_url,
                posted_at=datetime.utcnow(),
                error_message=None  # No error, but this is a guided workflow
            )
            
        except Exception as e:
            logger.error(f"Error preparing Facebook Marketplace posting: {str(e)}")
            return UserFacebookPostingResult(
                success=False,
                user_id=user_id,
                platform="facebook_marketplace",
                error_message=str(e)
            )
    
    async def get_user_facebook_pages(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Get user's Facebook pages for posting
        
        Args:
            user_id: Accorria user ID
            
        Returns:
            List of user's Facebook pages
        """
        try:
            connection = await self.get_user_facebook_connection(user_id)
            
            if not connection:
                return []
            
            pages = connection["platform_data"].get("pages", [])
            
            # Return pages without access tokens for security
            safe_pages = [
                {
                    "page_id": page["page_id"],
                    "name": page["name"],
                    "category": page["category"]
                }
                for page in pages
            ]
            
            return safe_pages
            
        except Exception as e:
            logger.error(f"Error getting user Facebook pages: {str(e)}")
            return []
    
    async def _update_connection_last_used(self, user_id: str):
        """Update the last_used_at timestamp for user's Facebook connection"""
        try:
            # Update last_used_at timestamp in database
            await self.db.execute(
                update(UserPlatformConnection)
                .where(
                    UserPlatformConnection.user_id == user_id,
                    UserPlatformConnection.platform == "facebook"
                )
                .values(last_used_at=datetime.utcnow())
            )
            await self.db.commit()
            logger.info(f"Updated last_used_at for user {user_id} Facebook connection")
            
        except Exception as e:
            logger.error(f"Error updating connection last_used_at: {str(e)}")
            await self.db.rollback()

# Helper function to create Facebook listing data from Accorria listing
def create_facebook_listing_data(
    title: str,
    description: str,
    price: float,
    make: str = "",
    model: str = "",
    year: int = 0,
    mileage: int = 0,
    condition: str = "GOOD",
    images: Optional[List[bytes]] = None,
    location: Optional[Dict[str, Any]] = None
) -> FacebookListingData:
    """
    Create FacebookListingData from Accorria listing data
    
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
        
    Returns:
        FacebookListingData object
    """
    return FacebookListingData(
        title=title,
        description=description,
        price=price,
        make=make,
        model=model,
        year=year,
        mileage=mileage,
        condition=condition,
        images=images,
        location=location
    )
