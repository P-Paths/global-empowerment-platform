"""
Car Listing Generator API endpoints

Provides endpoints for AI-powered car listing generation that replicates ChatGPT workflow:
1. Upload car photos
2. AI analysis of photos and details
3. Market value analysis
4. Price recommendations
5. Generate formatted listings for multiple platforms
"""

from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session
from app.services.car_listing_generator import CarListingGenerator
from app.core.database import get_sync_db as get_db
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

class CarListingRequest(BaseModel):
    """Request model for car listing generation"""
    make: Optional[str] = Field(None, description="Car make (e.g., Toyota, Honda)")
    model: Optional[str] = Field(None, description="Car model (e.g., Camry, Civic)")
    year: Optional[int] = Field(None, description="Car year")
    mileage: Optional[str] = Field(None, description="Car mileage")
    description: Optional[str] = Field(None, description="Car description")
    location: str = Field("Detroit, MI", description="Location for market analysis")
    title_status: str = Field("clean", description="Title status (clean, rebuilt, salvage)")
    additional_details: Optional[str] = Field(None, description="Additional car details")

class CarListingResponse(BaseModel):
    """Response model for car listing generation"""
    success: bool
    timestamp: str
    image_analysis: Dict[str, Any]
    market_analysis: Dict[str, Any]
    pricing_recommendations: Dict[str, Any]
    formatted_listings: Dict[str, Any]
    processing_time: float
    error_message: Optional[str] = None

@router.post("/car-listing/generate", response_model=CarListingResponse)
async def generate_car_listing(
    images: List[UploadFile] = File([], description="Up to 20 car images"),
    make: Optional[str] = Form(None, description="Car make"),
    model: Optional[str] = Form(None, description="Car model"),
    year: Optional[int] = Form(None, description="Car year"),
    mileage: Optional[str] = Form(None, description="Car mileage"),
    description: Optional[str] = Form(None, description="Car description"),
    location: str = Form("Detroit, MI", description="Location for market analysis"),
    title_status: str = Form("clean", description="Title status"),
    additional_details: Optional[str] = Form(None, description="Additional details"),
    db: Session = Depends(get_db)
):
    """
    Generate a complete car listing using AI analysis.
    
    This endpoint replicates the ChatGPT workflow:
    1. Analyzes uploaded car images using OpenAI Vision
    2. Provides market intelligence using Gemini/OpenAI
    3. Generates pricing recommendations
    4. Creates formatted listings for multiple platforms
    
    Returns comprehensive analysis and ready-to-use listings.
    """
    try:
        if len(images) > 20:
            raise HTTPException(status_code=400, detail="Maximum 20 images allowed.")
        
        # Read image bytes
        image_bytes = []
        for img in images:
            if not img.content_type.startswith('image/'):
                raise HTTPException(status_code=400, detail=f"File {img.filename} is not an image")
            image_bytes.append(await img.read())
        
        # Prepare car details
        car_details = {
            "make": make,
            "model": model,
            "year": year,
            "mileage": mileage,
            "description": description,
            "title_status": title_status,
            "additional_details": additional_details
        }
        
        # Remove None values
        car_details = {k: v for k, v in car_details.items() if v is not None}
        
        # Initialize the car listing generator
        generator = CarListingGenerator()
        
        # Generate the listing
        start_time = datetime.now()
        result = await generator.generate_car_listing(
            images=image_bytes,
            car_details=car_details,
            location=location
        )
        processing_time = (datetime.now() - start_time).total_seconds()
        
        if not result["success"]:
            raise HTTPException(status_code=500, detail=result.get("error", "Unknown error"))
        
        return CarListingResponse(
            success=True,
            timestamp=result["timestamp"],
            image_analysis=result["image_analysis"],
            market_analysis=result["market_analysis"],
            pricing_recommendations=result["pricing_recommendations"],
            formatted_listings=result["formatted_listings"],
            processing_time=processing_time
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating car listing: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating car listing: {str(e)}")

@router.post("/car-listing/generate-with-details", response_model=CarListingResponse)
async def generate_car_listing_with_details(
    request: CarListingRequest,
    images: Optional[List[UploadFile]] = File(None, description="Optional car images (up to 20)"),
    db: Session = Depends(get_db)
):
    """
    Generate car listing with detailed car information.
    
    This endpoint allows you to provide detailed car information
    and optionally upload images for enhanced analysis.
    """
    try:
        # Read image bytes if provided
        image_bytes = []
        if images:
            if len(images) > 20:
                raise HTTPException(status_code=400, detail="Maximum 20 images allowed.")
            
            for img in images:
                if not img.content_type.startswith('image/'):
                    raise HTTPException(status_code=400, detail=f"File {img.filename} is not an image")
                image_bytes.append(await img.read())
        
        # Prepare car details from request
        car_details = {
            "make": request.make,
            "model": request.model,
            "year": request.year,
            "mileage": request.mileage,
            "description": request.description,
            "title_status": request.title_status,
            "additional_details": request.additional_details
        }
        
        # Remove None values
        car_details = {k: v for k, v in car_details.items() if v is not None}
        
        # Initialize the car listing generator
        generator = CarListingGenerator()
        
        # Generate the listing
        start_time = datetime.now()
        result = await generator.generate_car_listing(
            images=image_bytes,
            car_details=car_details,
            location=request.location
        )
        processing_time = (datetime.now() - start_time).total_seconds()
        
        if not result["success"]:
            raise HTTPException(status_code=500, detail=result.get("error", "Unknown error"))
        
        return CarListingResponse(
            success=True,
            timestamp=result["timestamp"],
            image_analysis=result["image_analysis"],
            market_analysis=result["market_analysis"],
            pricing_recommendations=result["pricing_recommendations"],
            formatted_listings=result["formatted_listings"],
            processing_time=processing_time
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating car listing with details: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating car listing: {str(e)}")

@router.get("/car-listing/platforms")
async def get_supported_platforms():
    """
    Get list of supported listing platforms.
    """
    return {
        "platforms": [
            {
                "name": "Craigslist",
                "description": "Classified ads platform",
                "features": ["Free posting", "Local audience", "Simple interface"]
            },
            {
                "name": "Facebook Marketplace",
                "description": "Social media marketplace",
                "features": ["Large audience", "Social features", "Mobile-friendly"]
            },
            {
                "name": "OfferUp",
                "description": "Mobile marketplace app",
                "features": ["Mobile-first", "Local deals", "User ratings"]
            },
            {
                "name": "AutoTrader",
                "description": "Automotive marketplace",
                "features": ["Car-specific", "Dealer tools", "Market data"]
            }
        ]
    }

@router.post("/car-listing/test")
async def test_car_listing_generation():
    """
    Test endpoint to verify the car listing generator is working.
    """
    try:
        generator = CarListingGenerator()
        
        # Test with sample data
        test_images = []  # No images for test
        test_details = {
            "make": "Toyota",
            "model": "Camry",
            "year": 2018,
            "mileage": "45,000",
            "title_status": "clean"
        }
        
        result = await generator.generate_car_listing(
            images=test_images,
            car_details=test_details,
            location="Detroit, MI"
        )
        
        return {
            "success": True,
            "message": "Car listing generator is working",
            "test_result": result
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Car listing generator test failed"
        } 