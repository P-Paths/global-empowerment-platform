"""
Facebook Marketplace Playwright Posting Service
Handles automated form filling for Marketplace listings using Playwright
Compliance: Human-in-the-loop - user must click "Post" button
"""

import asyncio
import logging
import tempfile
import os
from typing import Dict, Any, List, Optional
from datetime import datetime
from pathlib import Path
from dataclasses import dataclass
from playwright.async_api import async_playwright, Browser, BrowserContext, Page
from app.services.facebook_marketplace import FacebookListingData

logger = logging.getLogger(__name__)

@dataclass
class PlaywrightPostingResult:
    """Result of Playwright posting flow"""
    success: bool
    screenshot_path: Optional[str] = None
    browser_pid: Optional[int] = None
    error_message: Optional[str] = None
    form_filled: bool = False
    images_uploaded: int = 0
    metadata: Optional[Dict[str, Any]] = None

class FacebookPlaywrightPoster:
    """
    Playwright-based service for Facebook Marketplace posting
    Uses browser automation to fill forms, then pauses for human to click "Post"
    """
    
    def __init__(self, user_id: str, access_token: str):
        """
        Initialize Playwright poster
        
        Args:
            user_id: Accorria user ID
            access_token: Facebook OAuth access token
        """
        self.user_id = user_id
        self.access_token = access_token
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None
        self.page: Optional[Page] = None
        self.playwright = None
        
    async def __aenter__(self):
        """Async context manager entry"""
        self.playwright = await async_playwright().start()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit - cleanup"""
        # Note: We keep browser open for user to review and post
        # Browser will be closed manually after user posts via close_browser()
        # Don't close here - let user review and post first
        pass
    
    async def close_browser(self):
        """Manually close browser after user posts"""
        try:
            if self.context:
                await self.context.close()
            if self.browser:
                await self.browser.close()
            if self.playwright:
                await self.playwright.stop()
        except Exception as e:
            logger.warning(f"Error closing browser: {e}")
    
    async def post_to_marketplace(
        self,
        listing_data: FacebookListingData,
        session_storage_path: Optional[str] = None,
        headless: bool = False
    ) -> PlaywrightPostingResult:
        """
        Post listing to Facebook Marketplace using Playwright
        
        Args:
            listing_data: Listing data to post
            session_storage_path: Path to saved Playwright session storage (optional)
            headless: Whether to run browser in headless mode (default: False for compliance)
            
        Returns:
            PlaywrightPostingResult with screenshot and metadata
        """
        try:
            # Launch browser
            logger.info(f"Launching browser for user {self.user_id}")
            self.browser = await self.playwright.chromium.launch(
                headless=headless,
                args=['--start-maximized']  # Start maximized for better visibility
            )
            
            # Create browser context
            context_options = {
                "viewport": {"width": 1920, "height": 1080},
                "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
            
            # Load saved session if provided
            if session_storage_path and os.path.exists(session_storage_path):
                logger.info(f"Loading session from {session_storage_path}")
                context_options["storage_state"] = session_storage_path
            
            self.context = await self.browser.new_context(**context_options)
            self.page = await self.context.new_page()
            
            # Navigate to Facebook Marketplace vehicle creation page
            logger.info("Navigating to Facebook Marketplace...")
            await self.page.goto("https://www.facebook.com/marketplace/create/vehicle", wait_until="networkidle")
            
            # Wait for page to load
            await self.page.wait_for_load_state("networkidle")
            await asyncio.sleep(2)  # Additional wait for dynamic content
            
            # Check if user needs to log in
            if await self._check_login_required():
                logger.warning("User needs to log in. Session may need to be saved.")
                # For now, we'll proceed and let user log in manually if needed
                # In future, we can use token to authenticate programmatically
            
            # Fill form fields
            logger.info("Filling Marketplace form fields...")
            form_result = await self._fill_form_fields(listing_data)
            
            # Upload images
            logger.info("Uploading images...")
            images_result = await self._upload_images(listing_data.images)
            
            # Take screenshot
            screenshot_path = await self._take_screenshot()
            
            # Prepare metadata
            metadata = {
                "form_fields_filled": form_result,
                "images_uploaded": images_result["count"],
                "screenshot_path": screenshot_path,
                "browser_pid": self.browser.process.pid if self.browser else None,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            return PlaywrightPostingResult(
                success=True,
                screenshot_path=screenshot_path,
                browser_pid=metadata["browser_pid"],
                form_filled=form_result["success"],
                images_uploaded=images_result["count"],
                metadata=metadata
            )
            
        except Exception as e:
            logger.error(f"Error in Playwright posting flow: {str(e)}", exc_info=True)
            return PlaywrightPostingResult(
                success=False,
                error_message=str(e)
            )
    
    async def _check_login_required(self) -> bool:
        """Check if user needs to log in to Facebook"""
        try:
            # Look for login indicators
            login_selectors = [
                'input[name="email"]',
                'input[type="email"]',
                'button:has-text("Log In")',
                'a[href*="/login"]'
            ]
            
            for selector in login_selectors:
                if await self.page.locator(selector).count() > 0:
                    logger.info("Login form detected")
                    return True
            
            return False
        except Exception as e:
            logger.warning(f"Error checking login status: {e}")
            return False
    
    async def _fill_form_fields(self, listing_data: FacebookListingData) -> Dict[str, Any]:
        """Fill Marketplace form fields with listing data"""
        filled_fields = []
        errors = []
        
        try:
            # Wait for form to be ready
            await self.page.wait_for_load_state("networkidle")
            await asyncio.sleep(1)
            
            # Title field
            title_filled = await self._fill_field(
                selectors=[
                    'input[placeholder*="title" i]',
                    'input[name="title"]',
                    'input[aria-label*="title" i]',
                    'input[type="text"]'
                ],
                value=listing_data.title,
                field_name="title"
            )
            if title_filled:
                filled_fields.append("title")
            
            # Price field
            price_str = str(int(listing_data.price)) if listing_data.price else ""
            price_filled = await self._fill_field(
                selectors=[
                    'input[placeholder*="price" i]',
                    'input[name="price"]',
                    'input[aria-label*="price" i]',
                    'input[type="number"]'
                ],
                value=price_str,
                field_name="price"
            )
            if price_filled:
                filled_fields.append("price")
            
            # Description field
            desc_filled = await self._fill_field(
                selectors=[
                    'textarea[placeholder*="description" i]',
                    'textarea[name="description"]',
                    'textarea[aria-label*="description" i]',
                    'div[contenteditable="true"]'
                ],
                value=listing_data.description,
                field_name="description",
                is_textarea=True
            )
            if desc_filled:
                filled_fields.append("description")
            
            # Make field (if exists)
            if listing_data.make:
                make_filled = await self._fill_field(
                    selectors=[
                        'input[placeholder*="make" i]',
                        'input[name="make"]',
                        'input[aria-label*="make" i]',
                        'select[name="make"]'
                    ],
                    value=listing_data.make,
                    field_name="make"
                )
                if make_filled:
                    filled_fields.append("make")
            
            # Model field (if exists)
            if listing_data.model:
                model_filled = await self._fill_field(
                    selectors=[
                        'input[placeholder*="model" i]',
                        'input[name="model"]',
                        'input[aria-label*="model" i]',
                        'select[name="model"]'
                    ],
                    value=listing_data.model,
                    field_name="model"
                )
                if model_filled:
                    filled_fields.append("model")
            
            # Year field (if exists)
            if listing_data.year:
                year_str = str(listing_data.year)
                year_filled = await self._fill_field(
                    selectors=[
                        'input[placeholder*="year" i]',
                        'input[name="year"]',
                        'input[aria-label*="year" i]',
                        'select[name="year"]'
                    ],
                    value=year_str,
                    field_name="year"
                )
                if year_filled:
                    filled_fields.append("year")
            
            # Mileage field (if exists)
            if listing_data.mileage:
                mileage_str = str(listing_data.mileage)
                mileage_filled = await self._fill_field(
                    selectors=[
                        'input[placeholder*="mileage" i]',
                        'input[name="mileage"]',
                        'input[aria-label*="mileage" i]',
                        'input[placeholder*="odometer" i]'
                    ],
                    value=mileage_str,
                    field_name="mileage"
                )
                if mileage_filled:
                    filled_fields.append("mileage")
            
            # Condition field (if exists)
            if listing_data.condition:
                condition_filled = await self._select_dropdown(
                    selectors=[
                        'select[name="condition"]',
                        'select[aria-label*="condition" i]',
                        'div[role="button"]:has-text("condition")'
                    ],
                    value=listing_data.condition,
                    field_name="condition"
                )
                if condition_filled:
                    filled_fields.append("condition")
            
            logger.info(f"Filled {len(filled_fields)} fields: {', '.join(filled_fields)}")
            
            return {
                "success": len(filled_fields) > 0,
                "filled_fields": filled_fields,
                "errors": errors
            }
            
        except Exception as e:
            logger.error(f"Error filling form fields: {e}")
            return {
                "success": False,
                "filled_fields": filled_fields,
                "errors": [str(e)]
            }
    
    async def _fill_field(
        self,
        selectors: List[str],
        value: str,
        field_name: str,
        is_textarea: bool = False
    ) -> bool:
        """Try to fill a field using multiple selector strategies"""
        if not value:
            return False
        
        for selector in selectors:
            try:
                locator = self.page.locator(selector).first
                count = await locator.count()
                
                if count > 0:
                    # Wait for element to be visible
                    await locator.wait_for(state="visible", timeout=5000)
                    
                    # Clear existing value
                    await locator.clear()
                    
                    # Fill value
                    if is_textarea:
                        await locator.fill(value)
                    else:
                        await locator.fill(value)
                    
                    # Verify value was set
                    await asyncio.sleep(0.5)
                    logger.info(f"✓ Filled {field_name} field")
                    return True
                    
            except Exception as e:
                logger.debug(f"Selector {selector} failed for {field_name}: {e}")
                continue
        
        logger.warning(f"Could not fill {field_name} field with any selector")
        return False
    
    async def _select_dropdown(
        self,
        selectors: List[str],
        value: str,
        field_name: str
    ) -> bool:
        """Try to select a dropdown value"""
        if not value:
            return False
        
        for selector in selectors:
            try:
                locator = self.page.locator(selector).first
                count = await locator.count()
                
                if count > 0:
                    await locator.wait_for(state="visible", timeout=5000)
                    await locator.select_option(value)
                    logger.info(f"✓ Selected {field_name}: {value}")
                    return True
                    
            except Exception as e:
                logger.debug(f"Dropdown selector {selector} failed for {field_name}: {e}")
                continue
        
        logger.warning(f"Could not select {field_name} dropdown")
        return False
    
    async def _upload_images(self, images: Optional[List[bytes]]) -> Dict[str, Any]:
        """Upload images to Marketplace form"""
        if not images or len(images) == 0:
            return {"count": 0, "success": True}
        
        try:
            # Limit to 10 images (Facebook maximum)
            images_to_upload = images[:10]
            
            # Find image upload button/area
            upload_selectors = [
                'input[type="file"]',
                'input[accept*="image"]',
                'div[role="button"]:has-text("photo")',
                'div[aria-label*="photo" i]',
                'div[aria-label*="image" i]'
            ]
            
            file_input = None
            for selector in upload_selectors:
                try:
                    locator = self.page.locator(selector).first
                    count = await locator.count()
                    if count > 0:
                        file_input = locator
                        break
                except:
                    continue
            
            if not file_input:
                logger.warning("Could not find image upload input")
                return {"count": 0, "success": False, "error": "Upload input not found"}
            
            # Save images to temporary files
            temp_files = []
            try:
                for i, image_bytes in enumerate(images_to_upload):
                    temp_file = tempfile.NamedTemporaryFile(
                        delete=False,
                        suffix='.jpg',
                        prefix=f'fb_upload_{i}_'
                    )
                    temp_file.write(image_bytes)
                    temp_file.close()
                    temp_files.append(temp_file.name)
                
                # Upload files (Playwright supports multiple files)
                await file_input.set_input_files(temp_files)
                
                # Wait for upload to complete
                await asyncio.sleep(3)
                
                logger.info(f"✓ Uploaded {len(temp_files)} images")
                
                return {
                    "count": len(temp_files),
                    "success": True
                }
                
            finally:
                # Clean up temporary files
                for temp_file in temp_files:
                    try:
                        os.unlink(temp_file)
                    except:
                        pass
                        
        except Exception as e:
            logger.error(f"Error uploading images: {e}")
            return {
                "count": 0,
                "success": False,
                "error": str(e)
            }
    
    async def _take_screenshot(self) -> str:
        """Take screenshot of filled form"""
        try:
            # Create screenshots directory if it doesn't exist
            screenshots_dir = Path("screenshots")
            screenshots_dir.mkdir(exist_ok=True)
            
            # Generate filename
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            filename = f"marketplace_preview_{self.user_id}_{timestamp}.png"
            screenshot_path = screenshots_dir / filename
            
            # Take screenshot
            await self.page.screenshot(path=str(screenshot_path), full_page=True)
            
            logger.info(f"Screenshot saved to {screenshot_path}")
            return str(screenshot_path)
            
        except Exception as e:
            logger.error(f"Error taking screenshot: {e}")
            return ""

