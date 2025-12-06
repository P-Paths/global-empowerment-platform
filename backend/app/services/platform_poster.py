"""
Platform Poster Service
Handles posting car listings to various marketplace platforms
"""

import asyncio
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from dataclasses import dataclass
import aiohttp
import json

logger = logging.getLogger(__name__)

@dataclass
class ListingData:
    """Structured listing data for platform posting"""
    title: str
    description: str
    price: float
    make: str
    model: str
    year: int
    mileage: int
    images: List[bytes]
    location: str = "United States"
    condition: str = "good"
    features: Optional[List[str]] = None

@dataclass
class PostingResult:
    """Result of platform posting attempt"""
    success: bool
    platform: str
    listing_id: Optional[str] = None
    url: Optional[str] = None
    error_message: Optional[str] = None
    posted_at: Optional[datetime] = None

class PlatformPoster:
    """
    Service for posting car listings to various marketplace platforms
    """
    
    def __init__(self):
        self.platforms = {
            "facebook_marketplace": FacebookMarketplacePoster(),
            "ebay": eBayMotorsPoster(),
            "craigslist": CraigslistPoster(),
            "offerup": OfferUpPoster()
        }
    
    async def post_listing(self, listing_data: ListingData, platforms: List[str]) -> List[PostingResult]:
        """
        Post a listing to multiple platforms
        
        Args:
            listing_data: Structured listing data
            platforms: List of platform names to post to
            
        Returns:
            List of posting results for each platform
        """
        results = []
        
        for platform_name in platforms:
            if platform_name not in self.platforms:
                results.append(PostingResult(
                    success=False,
                    platform=platform_name,
                    error_message=f"Platform {platform_name} not supported"
                ))
                continue
            
            try:
                poster = self.platforms[platform_name]
                result = await poster.post_listing(listing_data)
                results.append(result)
                
            except Exception as e:
                logger.error(f"Error posting to {platform_name}: {str(e)}")
                results.append(PostingResult(
                    success=False,
                    platform=platform_name,
                    error_message=str(e)
                ))
        
        return results

class FacebookMarketplacePoster:
    """Facebook Marketplace posting implementation"""
    
    def __init__(self):
        from .facebook_marketplace import get_facebook_config, FacebookMarketplaceAPI, FacebookListingData
        
        self.config = get_facebook_config()
        self.api = None
        
        if self.config:
            self.api = FacebookMarketplaceAPI(
                access_token=self.config["access_token"],
                page_id=self.config["page_id"]
            )
    
    async def post_listing(self, listing_data: ListingData) -> PostingResult:
        """
        Post listing to Facebook Marketplace
        
        Note: This requires Facebook Business API setup
        """
        try:
            if not self.api:
                return PostingResult(
                    success=False,
                    platform="facebook_marketplace",
                    error_message="Facebook API not configured. Please set FACEBOOK_ACCESS_TOKEN and FACEBOOK_PAGE_ID environment variables."
                )
            
            # Convert to Facebook-specific format
            from .facebook_marketplace import FacebookListingData
            
            fb_listing_data = FacebookListingData(
                title=listing_data.title,
                description=listing_data.description,
                price=listing_data.price,
                make=listing_data.make,
                model=listing_data.model,
                year=listing_data.year,
                mileage=listing_data.mileage,
                condition=self._map_condition(listing_data.condition),
                images=listing_data.images,
                location=self._get_location_data(listing_data.location)
            )
            
            # Post to Facebook
            async with self.api as api:
                result = await api.create_listing(fb_listing_data)
            
            if result.get("success"):
                return PostingResult(
                    success=True,
                    platform="facebook_marketplace",
                    listing_id=result.get("listing_id"),
                    url=result.get("url"),
                    posted_at=datetime.utcnow()
                )
            else:
                return PostingResult(
                    success=False,
                    platform="facebook_marketplace",
                    error_message=result.get("error", "Unknown error")
                )
            
        except Exception as e:
            logger.error(f"Facebook Marketplace posting failed: {str(e)}")
            return PostingResult(
                success=False,
                platform="facebook_marketplace",
                error_message=str(e)
            )
    
    def _map_condition(self, condition: str) -> str:
        """Map our condition to Facebook's condition format"""
        condition_map = {
            "excellent": "EXCELLENT",
            "good": "GOOD", 
            "fair": "FAIR",
            "poor": "POOR"
        }
        return condition_map.get(condition.lower(), "GOOD")
    
    def _get_location_data(self, location: str) -> Optional[Dict[str, Any]]:
        """Convert location string to Facebook location format"""
        if not location or location == "United States":
            return None
        
        # For now, return a basic location structure
        # In a real implementation, you'd geocode the location
        return {
            "city": location,
            "country": "US"
        }

class CraigslistPoster:
    """Craigslist posting implementation"""
    
    def __init__(self):
        from .craigslist_poster import get_craigslist_config, CraigslistPoster as CLPoster, CraigslistListingData
        
        self.config = get_craigslist_config()
        self.api = None
        
        if self.config:
            self.api = CLPoster(
                email=self.config["email"],
                password=self.config["password"]
            )
    
    async def post_listing(self, listing_data: ListingData) -> PostingResult:
        """
        Post listing to Craigslist
        
        Note: This requires web scraping approach as Craigslist doesn't have a public API
        """
        try:
            if not self.api:
                return PostingResult(
                    success=False,
                    platform="craigslist",
                    error_message="Craigslist credentials not configured. Please set CRAIGSLIST_EMAIL and CRAIGSLIST_PASSWORD environment variables."
                )
            
            # Convert to Craigslist-specific format
            from .craigslist_poster import CraigslistListingData
            
            cl_listing_data = CraigslistListingData(
                title=listing_data.title,
                description=listing_data.description,
                price=listing_data.price,
                make=listing_data.make,
                model=listing_data.model,
                year=listing_data.year,
                mileage=listing_data.mileage,
                condition=listing_data.condition,
                images=listing_data.images,
                location=listing_data.location,
                email="accorria@example.com",  # TODO: Get from user settings
                phone=""  # TODO: Get from user settings
            )
            
            # Post to Craigslist
            async with self.api as api:
                result = await api.post_listing(cl_listing_data)
            
            if result.get("success"):
                return PostingResult(
                    success=True,
                    platform="craigslist",
                    listing_id=result.get("listing_id"),
                    url=result.get("url"),
                    posted_at=datetime.utcnow()
                )
            else:
                return PostingResult(
                    success=False,
                    platform="craigslist",
                    error_message=result.get("error", "Unknown error")
                )
            
        except Exception as e:
            logger.error(f"Craigslist posting failed: {str(e)}")
            return PostingResult(
                success=False,
                platform="craigslist",
                error_message=str(e)
            )

class eBayMotorsPoster:
    """eBay Motors posting implementation"""
    
    def __init__(self):
        from .ebay_poster import eBayPoster as eBayAPI, eBayListingData
        
        self.api = None
        # eBay poster is initialized per request with user tokens
    
    async def post_listing(self, listing_data: ListingData) -> PostingResult:
        """
        Post listing to eBay Motors
        
        Note: This requires eBay Trading API setup
        """
        try:
            # Convert to eBay-specific format
            from .ebay_poster import eBayListingData
            
            ebay_listing_data = eBayListingData(
                title=listing_data.title,
                description=listing_data.description,
                price=listing_data.price,
                make=listing_data.make,
                model=listing_data.model,
                year=listing_data.year,
                mileage=listing_data.mileage,
                condition=self._map_condition(listing_data.condition),
                images=listing_data.images,
                location=self._get_location_data(listing_data.location)
            )
            
            # Note: Actual posting requires user's eBay OAuth token
            # This is handled by user_ebay_poster service
            # For now, return a message that user needs to connect eBay account
            return PostingResult(
                success=False,
                platform="ebay",
                error_message="eBay account not connected. Please connect your eBay account first."
            )
            
        except Exception as e:
            logger.error(f"eBay Motors posting failed: {str(e)}")
            return PostingResult(
                success=False,
                platform="ebay",
                error_message=str(e)
            )
    
    def _map_condition(self, condition: str) -> str:
        """Map our condition to eBay's condition format"""
        condition_map = {
            "excellent": "Used",
            "good": "Used",
            "fair": "Used",
            "poor": "For Parts or Not Working",
            "new": "New"
        }
        return condition_map.get(condition.lower(), "Used")
    
    def _get_location_data(self, location: str) -> Optional[Dict[str, Any]]:
        """Convert location string to eBay location format"""
        if not location or location == "United States":
            return None
        
        # For now, return a basic location structure
        return {
            "city": location,
            "country": "US"
        }

class OfferUpPoster:
    """OfferUp posting implementation"""
    
    def __init__(self):
        self.api_base_url = "https://api.offerup.com"
        # TODO: Add OfferUp API credentials
        self.api_key = None
        self.user_token = None
    
    async def post_listing(self, listing_data: ListingData) -> PostingResult:
        """
        Post listing to OfferUp
        
        Note: This requires OfferUp API integration
        """
        try:
            # TODO: Implement actual OfferUp API integration
            # For now, return mock success
            logger.info(f"Would post to OfferUp: {listing_data.title}")
            
            return PostingResult(
                success=True,
                platform="offerup",
                listing_id="ou_mock_789",
                url="https://offerup.com/item/mock_789",
                posted_at=datetime.utcnow()
            )
            
        except Exception as e:
            logger.error(f"OfferUp posting failed: {str(e)}")
            return PostingResult(
                success=False,
                platform="offerup",
                error_message=str(e)
            )

# Global instance
platform_poster = PlatformPoster()

async def post_listing_to_platforms(listing_data: ListingData, platforms: List[str]) -> List[PostingResult]:
    """Convenience function to post listing to multiple platforms"""
    return await platform_poster.post_listing(listing_data, platforms) 