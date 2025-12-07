"""
Craigslist Integration
Handles posting car listings to Craigslist using web scraping
"""

import asyncio
import logging
import aiohttp
import re
from typing import Dict, Any, List, Optional
from datetime import datetime
from dataclasses import dataclass
from bs4 import BeautifulSoup
import urllib.parse

logger = logging.getLogger(__name__)

@dataclass
class CraigslistListingData:
    """Craigslist-specific listing data"""
    title: str
    description: str
    price: float
    make: str = ""
    model: str = ""
    year: int = 0
    mileage: int = 0
    condition: str = "good"
    images: Optional[List[bytes]] = None
    location: str = "United States"
    email: str = ""
    phone: str = ""

class CraigslistPoster:
    """
    Craigslist posting implementation using web scraping
    """
    
    def __init__(self, email: Optional[str] = None, password: Optional[str] = None):
        self.email = email or self._get_env_credential("CRAIGSLIST_EMAIL") or ""
        self.password = password or self._get_env_credential("CRAIGSLIST_PASSWORD") or ""
        self.session: Optional[aiohttp.ClientSession] = None
        self.base_url = "https://post.craigslist.org"
        self.is_logged_in = False
    
    def _get_env_credential(self, key: str) -> Optional[str]:
        """Get credential from environment variable"""
        import os
        return os.getenv(key)
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def post_listing(self, listing_data: CraigslistListingData) -> Dict[str, Any]:
        """
        Post listing to Craigslist
        
        Args:
            listing_data: Craigslist-specific listing data
            
        Returns:
            API response with listing ID and URL
        """
        try:
            if not self.session:
                raise RuntimeError("Session not initialized")
            
            # Step 1: Login to Craigslist
            if not await self._login():
                return {
                    "success": False,
                    "error": "Failed to login to Craigslist"
                }
            
            # Step 2: Navigate to posting form
            posting_url = await self._get_posting_url(listing_data.location)
            if not posting_url:
                return {
                    "success": False,
                    "error": "Could not find posting URL for location"
                }
            
            # Step 3: Fill out the posting form
            form_data = self._prepare_form_data(listing_data)
            
            # Step 4: Submit the listing
            async with self.session.post(posting_url, data=form_data) as response:
                if response.status == 200:
                    content = await response.text()
                    
                    # Extract listing ID from response
                    listing_id = self._extract_listing_id(content)
                    listing_url = self._extract_listing_url(content)
                    
                    if listing_id:
                        return {
                            "success": True,
                            "listing_id": listing_id,
                            "url": listing_url or f"https://craigslist.org/view/{listing_id}",
                            "craigslist_response": "Listing posted successfully"
                        }
                    else:
                        return {
                            "success": False,
                            "error": "Could not extract listing ID from response"
                        }
                else:
                    return {
                        "success": False,
                        "error": f"Failed to post listing: {response.status}"
                    }
                    
        except Exception as e:
            logger.error(f"Error posting to Craigslist: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def _login(self) -> bool:
        """Login to Craigslist account"""
        try:
            if not self.email or not self.password:
                logger.warning("Craigslist credentials not provided")
                return False
            
            # Get login page
            login_url = "https://accounts.craigslist.org/login"
            if not self.session:
                raise RuntimeError("Session not initialized")
                
            async with self.session.get(login_url) as response:
                if response.status != 200:
                    return False
                
                content = await response.text()
                soup = BeautifulSoup(content, 'html.parser')
                
                # Find login form
                form = soup.find('form', {'action': '/login'})
                if not form:
                    return False
                
                # Extract form fields
                form_data = {
                    'inputEmailHandle': self.email,
                    'inputPassword': self.password,
                    'step': 'confirmation'
                }
                
                # Submit login form
                async with self.session.post(login_url, data=form_data) as login_response:
                    if login_response.status == 200:
                        self.is_logged_in = True
                        return True
                    else:
                        return False
                        
        except Exception as e:
            logger.error(f"Login failed: {str(e)}")
            return False
    
    async def _get_posting_url(self, location: str) -> Optional[str]:
        """Get the posting URL for a specific location"""
        try:
            # Map location to Craigslist subdomain
            location_map = {
                "United States": "www",
                "New York": "newyork",
                "Los Angeles": "losangeles",
                "Chicago": "chicago",
                "Houston": "houston",
                "Phoenix": "phoenix",
                "Philadelphia": "philadelphia",
                "San Antonio": "sanantonio",
                "San Diego": "sandiego",
                "Dallas": "dallas"
            }
            
            subdomain = location_map.get(location, "www")
            return f"https://{subdomain}.craigslist.org/post"
            
        except Exception as e:
            logger.error(f"Error getting posting URL: {str(e)}")
            return None
    
    def _prepare_form_data(self, listing_data: CraigslistListingData) -> Dict[str, Any]:
        """Prepare form data for Craigslist posting"""
        form_data = {
            'title': listing_data.title,
            'description': listing_data.description,
            'price': str(int(listing_data.price)),
            'condition': listing_data.condition,
            'category': 'cta',  # Cars & Trucks
            'subcategory': 'cto',  # Cars & Trucks by Owner
            'make': listing_data.make,
            'model': listing_data.model,
            'year': str(listing_data.year),
            'mileage': str(listing_data.mileage),
            'email': listing_data.email,
            'phone': listing_data.phone,
            'contact_name': 'Accorria',
            'posting_title': listing_data.title,
            'fromemail': listing_data.email,
            'show_contact_name': '1',
            'show_contact_phone': '1',
            'show_contact_email': '1'
        }
        
        return form_data
    
    def _extract_listing_id(self, content: str) -> Optional[str]:
        """Extract listing ID from response content"""
        try:
            # Look for listing ID in various patterns
            patterns = [
                r'posting_id=(\d+)',
                r'/view/(\d+)',
                r'listing_id=(\d+)'
            ]
            
            for pattern in patterns:
                match = re.search(pattern, content)
                if match:
                    return match.group(1)
            
            return None
            
        except Exception as e:
            logger.error(f"Error extracting listing ID: {str(e)}")
            return None
    
    def _extract_listing_url(self, content: str) -> Optional[str]:
        """Extract listing URL from response content"""
        try:
            # Look for listing URL in response
            patterns = [
                r'https://[^/]+\.craigslist\.org/[^"\s]+',
                r'view/[^"\s]+'
            ]
            
            for pattern in patterns:
                match = re.search(pattern, content)
                if match:
                    url = match.group(0)
                    if not url.startswith('http'):
                        url = f"https://www.craigslist.org/{url}"
                    return url
            
            return None
            
        except Exception as e:
            logger.error(f"Error extracting listing URL: {str(e)}")
            return None

# Configuration helper
def get_craigslist_config() -> Dict[str, str]:
    """
    Get Craigslist configuration from environment variables
    
    Returns:
        Dictionary with email and password
    """
    import os
    
    email = os.getenv("CRAIGSLIST_EMAIL")
    password = os.getenv("CRAIGSLIST_PASSWORD")
    
    if not email or not password:
        logger.warning("Craigslist credentials not configured")
        return {}
    
    return {
        "email": email,
        "password": password
    } 