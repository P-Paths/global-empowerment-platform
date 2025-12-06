"""
Facebook Marketplace Integration
Handles posting car listings to Facebook Marketplace using the Business API
"""

import asyncio
import logging
import aiohttp
import json
from typing import Dict, Any, List, Optional
from datetime import datetime
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class FacebookListingData:
    """Facebook Marketplace specific listing data"""
    title: str
    description: str
    price: float
    category: str = "VEHICLES"
    subcategory: str = "CARS_TRUCKS"
    make: str = ""
    model: str = ""
    year: int = 0
    mileage: int = 0
    condition: str = "GOOD"
    images: Optional[List[bytes]] = None
    location: Optional[Dict[str, Any]] = None

class FacebookMarketplaceAPI:
    """
    Facebook Marketplace API integration
    Uses Facebook Business API for posting listings with user-specific tokens
    """
    
    def __init__(self, access_token: str, page_id: str, user_id: str = None):
        self.access_token = access_token
        self.page_id = page_id
        self.user_id = user_id  # Track which user this posting is for
        self.api_base_url = "https://graph.facebook.com/v18.0"
        self.session: Optional[aiohttp.ClientSession] = None
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def create_listing(self, listing_data: FacebookListingData) -> Dict[str, Any]:
        """
        Create a new listing on Facebook Marketplace
        
        Args:
            listing_data: Facebook-specific listing data
            
        Returns:
            API response with listing ID and URL
        """
        try:
            # Step 1: Upload images
            image_ids = []
            if listing_data.images:
                image_ids = await self._upload_images(listing_data.images)
            
            # Step 2: Create the listing
            listing_payload = {
                "title": listing_data.title,
                "description": listing_data.description,
                "price": int(listing_data.price * 100),  # Facebook expects price in cents
                "category": listing_data.category,
                "subcategory": listing_data.subcategory,
                "condition": listing_data.condition,
                "availability": "IN_STOCK",
                "marketplace_listing": True
            }
            
            # Add vehicle-specific fields
            if listing_data.make and listing_data.model:
                listing_payload["vehicle"] = {
                    "make": listing_data.make,
                    "model": listing_data.model,
                    "year": listing_data.year,
                    "mileage": listing_data.mileage
                }
            
            # Add location if provided
            if listing_data.location:
                listing_payload["location"] = listing_data.location
            
            # Add images if uploaded
            if image_ids:
                listing_payload["image_ids"] = image_ids
            
            # Create the listing
            url = f"{self.api_base_url}/{self.page_id}/marketplace_listings"
            params = {"access_token": self.access_token}
            
            if not self.session:
                raise RuntimeError("Session not initialized")
                
            async with self.session.post(url, params=params, json=listing_payload) as response:
                if response.status == 200:
                    result = await response.json()
                    listing_id = result.get("id")
                    
                    return {
                        "success": True,
                        "listing_id": listing_id,
                        "url": f"https://facebook.com/marketplace/item/{listing_id}",
                        "facebook_response": result
                    }
                else:
                    error_text = await response.text()
                    logger.error(f"Facebook API error: {response.status} - {error_text}")
                    return {
                        "success": False,
                        "error": f"Facebook API error: {response.status}",
                        "details": error_text
                    }
                    
        except Exception as e:
            logger.error(f"Error creating Facebook listing: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def _upload_images(self, images: List[bytes]) -> List[str]:
        """
        Upload images to Facebook and get image IDs
        
        Args:
            images: List of image bytes
            
        Returns:
            List of Facebook image IDs
        """
        image_ids = []
        
        for i, image_data in enumerate(images[:10]):  # Facebook allows max 10 images
            try:
                # Step 1: Get upload URL
                url = f"{self.api_base_url}/{self.page_id}/photos"
                params = {
                    "access_token": self.access_token,
                    "published": False,
                    "source": image_data
                }
                
                if not self.session:
                    raise RuntimeError("Session not initialized")
                    
                async with self.session.post(url, params=params) as response:
                    if response.status == 200:
                        result = await response.json()
                        image_id = result.get("id")
                        if image_id:
                            image_ids.append(image_id)
                    else:
                        logger.warning(f"Failed to upload image {i}: {response.status}")
                        
            except Exception as e:
                logger.error(f"Error uploading image {i}: {str(e)}")
                continue
        
        return image_ids
    
    async def get_listing_status(self, listing_id: str) -> Dict[str, Any]:
        """
        Get the status of a listing
        
        Args:
            listing_id: Facebook listing ID
            
        Returns:
            Listing status information
        """
        try:
            url = f"{self.api_base_url}/{listing_id}"
            params = {
                "access_token": self.access_token,
                "fields": "id,title,status,marketplace_listing_category,price,created_time"
            }
            
            if not self.session:
                raise RuntimeError("Session not initialized")
                
            async with self.session.get(url, params=params) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    return {"error": f"Failed to get listing status: {response.status}"}
                    
        except Exception as e:
            logger.error(f"Error getting listing status: {str(e)}")
            return {"error": str(e)}
    
    async def delete_listing(self, listing_id: str) -> Dict[str, Any]:
        """
        Delete a listing
        
        Args:
            listing_id: Facebook listing ID
            
        Returns:
            Deletion result
        """
        try:
            url = f"{self.api_base_url}/{listing_id}"
            params = {"access_token": self.access_token}
            
            if not self.session:
                raise RuntimeError("Session not initialized")
                
            async with self.session.delete(url, params=params) as response:
                if response.status == 200:
                    return {"success": True, "message": "Listing deleted"}
                else:
                    return {"success": False, "error": f"Failed to delete: {response.status}"}
                    
        except Exception as e:
            logger.error(f"Error deleting listing: {str(e)}")
            return {"success": False, "error": str(e)}

# Configuration helper
def get_facebook_config() -> Dict[str, str]:
    """
    Get Facebook API configuration from environment variables
    
    Returns:
        Dictionary with access_token and page_id
    """
    import os
    
    access_token = os.getenv("FACEBOOK_ACCESS_TOKEN")
    page_id = os.getenv("FACEBOOK_PAGE_ID")
    
    if not access_token or not page_id:
        logger.warning("Facebook API credentials not configured")
        return {}
    
    return {
        "access_token": access_token,
        "page_id": page_id
    } 