"""
Supabase Service for Aquaria

Handles database operations using Supabase instead of Firestore
"""

import logging
from typing import Dict, Any, Optional
from datetime import datetime
import os
from supabase import create_client, Client
from app.core.config import settings

logger = logging.getLogger(__name__)


class SupabaseService:
    """Supabase service for database operations"""
    
    def __init__(self):
        self.client: Optional[Client] = None
        self._initialize_client()
    
    def _initialize_client(self):
        """Initialize Supabase client"""
        try:
            if settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY:
                self.client = create_client(
                    supabase_url=settings.SUPABASE_URL,
                    supabase_key=settings.SUPABASE_SERVICE_ROLE_KEY
                )
                logger.info("✅ Supabase client initialized successfully")
            else:
                logger.warning("⚠️ Supabase credentials not found, using mock mode")
                self.client = None
        except Exception as e:
            logger.warning(f"⚠️ Supabase initialization failed: {e}")
            self.client = None
    
    async def save_car_analysis(self, analysis_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Save car analysis to Supabase
        
        Args:
            analysis_data: Car analysis data to save
            
        Returns:
            Dict with save result
        """
        try:
            if not self.client:
                return {
                    "status": "mock",
                    "message": "Supabase not configured, using mock save",
                    "data": analysis_data
                }
            
            # Prepare data for Supabase
            car_analysis_record = {
                "user_id": "test_user",  # For demo purposes
                "image_urls": [],  # Will be populated with actual image URLs
                "make": analysis_data.get("car_info", {}).get("make"),
                "model": analysis_data.get("car_info", {}).get("model"),
                "year": analysis_data.get("car_info", {}).get("year"),
                "mileage": None,  # Will be extracted from analysis
                "condition": "good",  # Default
                "title_status": "clean",  # Default
                "color": None,
                "features": [],
                "vision_analysis": analysis_data.get("data", {}),
                "data_extraction": {},
                "created_at": datetime.now().isoformat()
            }
            
            # Insert into car_analyses table
            result = self.client.table("car_analyses").insert(car_analysis_record).execute()
            
            logger.info(f"✅ Car analysis saved to Supabase: {result.data}")
            
            return {
                "status": "success",
                "message": "Car analysis saved to Supabase",
                "data": result.data,
                "id": result.data[0]["id"] if result.data else None
            }
            
        except Exception as e:
            logger.error(f"❌ Supabase save error: {e}")
            return {
                "status": "error",
                "error": str(e),
                "message": "Failed to save to Supabase"
            }
    
    async def get_car_analysis(self, analysis_id: str) -> Dict[str, Any]:
        """
        Get car analysis from Supabase
        
        Args:
            analysis_id: ID of the analysis to retrieve
            
        Returns:
            Dict with analysis data
        """
        try:
            if not self.client:
                return {
                    "status": "mock",
                    "message": "Supabase not configured, returning mock data"
                }
            
            result = self.client.table("car_analyses").select("*").eq("id", analysis_id).execute()
            
            if result.data:
                return {
                    "status": "success",
                    "data": result.data[0]
                }
            else:
                return {
                    "status": "not_found",
                    "message": "Analysis not found"
                }
                
        except Exception as e:
            logger.error(f"❌ Supabase get error: {e}")
            return {
                "status": "error",
                "error": str(e),
                "message": "Failed to retrieve from Supabase"
            }
    
    async def save_listing(self, listing_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Save car listing to Supabase
        
        Args:
            listing_data: Listing data to save
            
        Returns:
            Dict with save result
        """
        try:
            if not self.client:
                return {
                    "status": "mock",
                    "message": "Supabase not configured, using mock save",
                    "data": listing_data
                }
            
            # Prepare listing record
            listing_record = {
                "user_id": "test_user",  # For demo purposes
                "title": listing_data.get("title", ""),
                "description": listing_data.get("description", ""),
                "price": listing_data.get("price", 0),
                "platform": listing_data.get("platform", "facebook"),
                "status": "draft",
                "images": listing_data.get("images", []),
                "flip_score": listing_data.get("flip_score", 0),
                "pricing_strategy_used": listing_data.get("pricing_strategy", "market_price"),
                "created_at": datetime.now().isoformat()
            }
            
            # Insert into car_listings table
            result = self.client.table("car_listings").insert(listing_record).execute()
            
            logger.info(f"✅ Car listing saved to Supabase: {result.data}")
            
            return {
                "status": "success",
                "message": "Car listing saved to Supabase",
                "data": result.data,
                "id": result.data[0]["id"] if result.data else None
            }
            
        except Exception as e:
            logger.error(f"❌ Supabase listing save error: {e}")
            return {
                "status": "error",
                "error": str(e),
                "message": "Failed to save listing to Supabase"
            }


# Create global instance
supabase_service = SupabaseService()
