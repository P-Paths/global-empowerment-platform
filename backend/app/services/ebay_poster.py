"""
eBay Motors Integration
Handles posting car listings to eBay Motors using the Trading API
"""

import asyncio
import logging
import aiohttp
import json
import os
from typing import Dict, Any, List, Optional
from datetime import datetime
from dataclasses import dataclass
import xml.etree.ElementTree as ET

logger = logging.getLogger(__name__)

@dataclass
class eBayListingData:
    """eBay Motors specific listing data"""
    title: str
    description: str
    price: float
    make: str = ""
    model: str = ""
    year: int = 0
    mileage: int = 0
    condition: str = "Used"
    images: Optional[List[bytes]] = None
    location: Optional[Dict[str, Any]] = None
    vin: Optional[str] = None
    vehicle_type: str = "Car"

class eBayPoster:
    """
    eBay Motors API integration
    Uses eBay Trading API for posting vehicle listings
    """
    
    def __init__(self, app_id: Optional[str] = None, dev_id: Optional[str] = None, cert_id: Optional[str] = None, auth_token: Optional[str] = None):
        from app.core.config import settings
        
        self.app_id = app_id or os.getenv("EBAY_APP_ID") or settings.EBAY_APP_ID
        self.dev_id = dev_id or os.getenv("EBAY_DEV_ID") or settings.EBAY_DEV_ID
        self.cert_id = cert_id or os.getenv("EBAY_CERT_ID") or settings.EBAY_CERT_ID
        self.auth_token = auth_token or os.getenv("EBAY_AUTH_TOKEN") or settings.EBAY_AUTH_TOKEN
        
        # eBay API endpoints
        self.api_url = "https://api.ebay.com/ws/api.dll"
        self.sandbox_url = "https://api.sandbox.ebay.com/ws/api.dll"
        self.use_sandbox = os.getenv("EBAY_SANDBOX", "true").lower() == "true"
        
        self.session: Optional[aiohttp.ClientSession] = None
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def create_listing(self, listing_data: eBayListingData) -> Dict[str, Any]:
        """
        Create a new vehicle listing on eBay Motors
        
        Args:
            listing_data: eBay-specific listing data
            
        Returns:
            API response with listing ID and URL
        """
        try:
            if not self.app_id or not self.auth_token:
                return {
                    "success": False,
                    "error": "eBay API credentials not configured. Please set EBAY_APP_ID and EBAY_AUTH_TOKEN environment variables."
                }
            
            # Build XML request for eBay Trading API
            xml_request = self._build_listing_request(listing_data)
            
            # Build API headers
            headers = {
                "X-EBAY-API-COMPATIBILITY-LEVEL": "967",
                "X-EBAY-API-DEV-NAME": self.dev_id or "",
                "X-EBAY-API-APP-NAME": self.app_id,
                "X-EBAY-API-CERT-NAME": self.cert_id or "",
                "X-EBAY-API-SITEID": "0",  # US site
                "X-EBAY-API-CALL-NAME": "AddItem",
                "Content-Type": "text/xml"
            }
            
            # Upload images first if provided
            picture_urls = []
            if listing_data.images:
                picture_urls = await self._upload_images(listing_data.images)
            
            # Update XML with picture URLs
            if picture_urls:
                xml_request = self._add_pictures_to_xml(xml_request, picture_urls)
            
            # Make API call
            api_url = self.sandbox_url if self.use_sandbox else self.api_url
            
            if not self.session:
                raise RuntimeError("Session not initialized")
            
            async with self.session.post(
                api_url,
                headers=headers,
                data=xml_request,
                timeout=aiohttp.ClientTimeout(total=30)
            ) as response:
                if response.status == 200:
                    xml_response = await response.text()
                    result = self._parse_listing_response(xml_response)
                    
                    if result.get("success"):
                        listing_id = result.get("listing_id")
                        listing_url = f"https://www.ebay.com/itm/{listing_id}" if not self.use_sandbox else f"https://sandbox.ebay.com/itm/{listing_id}"
                        
                        return {
                            "success": True,
                            "listing_id": listing_id,
                            "url": listing_url,
                            "ebay_response": result
                        }
                    else:
                        return {
                            "success": False,
                            "error": result.get("error", "Unknown error"),
                            "ebay_response": result
                        }
                else:
                    error_text = await response.text()
                    logger.error(f"eBay API error: {response.status} - {error_text}")
                    return {
                        "success": False,
                        "error": f"eBay API error: {response.status}",
                        "details": error_text
                    }
                    
        except Exception as e:
            logger.error(f"Error creating eBay listing: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def _build_listing_request(self, listing_data: eBayListingData) -> str:
        """Build XML request for eBay AddItem API"""
        
        # Map condition
        condition_id_map = {
            "New": "1000",
            "Used": "3000",
            "Refurbished": "2000",
            "For Parts or Not Working": "7000"
        }
        condition_id = condition_id_map.get(listing_data.condition, "3000")
        
        # Category ID for Vehicles (eBay Motors)
        category_id = "6001"  # eBay Motors > Cars & Trucks
        
        # Build XML
        xml = f"""<?xml version="1.0" encoding="utf-8"?>
<AddItemRequest xmlns="urn:ebay:apis:eBLBaseComponents">
    <RequesterCredentials>
        <eBayAuthToken>{self.auth_token}</eBayAuthToken>
    </RequesterCredentials>
    <ErrorLanguage>en_US</ErrorLanguage>
    <WarningLevel>High</WarningLevel>
    <Item>
        <Title>{listing_data.title}</Title>
        <Description><![CDATA[{listing_data.description}]]></Description>
        <PrimaryCategory>
            <CategoryID>{category_id}</CategoryID>
        </PrimaryCategory>
        <StartPrice>{listing_data.price}</StartPrice>
        <Currency>USD</Currency>
        <Country>US</Country>
        <Location>US</Location>
        <ConditionID>{condition_id}</ConditionID>
        <ListingDuration>Days_30</ListingDuration>
        <ListingType>FixedPriceItem</ListingType>
        <Quantity>1</Quantity>
        <PaymentMethods>PayPal</PaymentMethods>
        <PayPalEmailAddress>seller@example.com</PayPalEmailAddress>
        <ReturnPolicy>
            <ReturnsAcceptedOption>ReturnsNotAccepted</ReturnsAcceptedOption>
        </ReturnPolicy>
        <ShippingDetails>
            <ShippingType>Flat</ShippingType>
            <ShippingServiceOptions>
                <ShippingServicePriority>1</ShippingServicePriority>
                <ShippingService>USPSPriority</ShippingService>
                <ShippingServiceCost>0.0</ShippingServiceCost>
                <ShippingServiceAdditionalCost>0.0</ShippingServiceAdditionalCost>
            </ShippingServiceOptions>
        </ShippingDetails>
"""
        
        # Add vehicle specifics if available
        if listing_data.make or listing_data.model or listing_data.year:
            xml += """        <ItemSpecifics>
            <NameValueList>
"""
            if listing_data.make:
                xml += f"""                <Name>Make</Name>
                <Value>{listing_data.make}</Value>
"""
            if listing_data.model:
                xml += f"""                <Name>Model</Name>
                <Value>{listing_data.model}</Value>
"""
            if listing_data.year:
                xml += f"""                <Name>Year</Name>
                <Value>{listing_data.year}</Value>
"""
            if listing_data.mileage:
                xml += f"""                <Name>Mileage</Name>
                <Value>{listing_data.mileage}</Value>
"""
            xml += """            </NameValueList>
        </ItemSpecifics>
"""
        
        xml += """    </Item>
</AddItemRequest>"""
        
        return xml
    
    def _add_pictures_to_xml(self, xml: str, picture_urls: List[str]) -> str:
        """Add picture URLs to XML request"""
        
        pictures_xml = "<PictureDetails>\n"
        for url in picture_urls[:12]:  # eBay allows max 12 pictures
            pictures_xml += f"    <PictureURL>{url}</PictureURL>\n"
        pictures_xml += "</PictureDetails>"
        
        # Insert before closing Item tag
        xml = xml.replace("    </Item>", f"        {pictures_xml}\n    </Item>")
        
        return xml
    
    async def _upload_images(self, images: List[bytes]) -> List[str]:
        """
        Upload images to eBay picture service
        
        Note: For production, you'd upload to eBay's picture hosting service
        For now, we'll return placeholder URLs that need to be hosted
        """
        try:
            # TODO: Implement actual eBay image upload
            # For now, return placeholder URLs
            # In production, upload to eBay Picture Service or your own CDN
            logger.warning("Image upload not fully implemented. Using placeholder URLs.")
            
            # Return placeholder URLs - in production, these would be actual hosted images
            picture_urls = []
            for i in range(len(images)):
                picture_urls.append(f"https://placeholder.ebay.com/image{i+1}.jpg")
            
            return picture_urls
            
        except Exception as e:
            logger.error(f"Error uploading images: {str(e)}")
            return []
    
    def _parse_listing_response(self, xml_response: str) -> Dict[str, Any]:
        """Parse eBay API XML response"""
        try:
            root = ET.fromstring(xml_response)
            
            # Check for errors
            errors = root.findall(".//{urn:ebay:apis:eBLBaseComponents}Errors")
            if errors:
                error_messages = []
                for error in errors:
                    short_message = error.find(".//{urn:ebay:apis:eBLBaseComponents}ShortMessage")
                    long_message = error.find(".//{urn:ebay:apis:eBLBaseComponents}LongMessage")
                    if short_message is not None:
                        error_messages.append(short_message.text)
                    elif long_message is not None:
                        error_messages.append(long_message.text)
                
                if error_messages:
                    return {
                        "success": False,
                        "error": "; ".join(error_messages)
                    }
            
            # Get listing ID
            item_id = root.find(".//{urn:ebay:apis:eBLBaseComponents}ItemID")
            if item_id is not None and item_id.text:
                return {
                    "success": True,
                    "listing_id": item_id.text
                }
            
            # Check for warnings
            warnings = root.findall(".//{urn:ebay:apis:eBLBaseComponents}Warnings")
            if warnings:
                logger.warning(f"eBay API warnings: {warnings}")
            
            return {
                "success": False,
                "error": "Could not parse listing ID from response"
            }
            
        except Exception as e:
            logger.error(f"Error parsing eBay response: {str(e)}")
            return {
                "success": False,
                "error": f"Error parsing response: {str(e)}"
            }

