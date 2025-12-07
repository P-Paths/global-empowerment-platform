"""
Platform Posting API endpoints

Provides endpoints for:
- Posting listings to multiple platforms
- Platform selection and configuration
- Posting status tracking
"""

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session
from app.services.listen_agent import ListenerAgent
from app.services.platform_poster import ListingData, post_listing_to_platforms
from app.core.database import get_sync_db as get_db

router = APIRouter()

class PlatformPostingRequest(BaseModel):
    """Request model for platform posting"""
    platforms: List[str] = Field(..., description="List of platforms to post to")
    title: Optional[str] = Field(None, description="Custom title for listing")
    description: Optional[str] = Field(None, description="Custom description")
    price: float = Field(..., gt=0, description="Listing price")
    make: str = Field(..., description="Car make")
    model: str = Field(..., description="Car model")
    year: int = Field(..., ge=1900, le=2025, description="Car year")
    mileage: int = Field(..., ge=0, description="Car mileage")
    location: str = Field("United States", description="Location")
    condition: str = Field("good", description="Car condition")
    features: Optional[List[str]] = Field([], description="Car features")

class PlatformPostingResponse(BaseModel):
    """Response model for platform posting"""
    success: bool
    timestamp: str
    posting_results: List[Dict[str, Any]]
    total_platforms: int
    successful_postings: int
    failed_postings: int

@router.post("/platform-posting/post-listing", response_model=PlatformPostingResponse)
async def post_listing_to_platforms_endpoint(
    request: PlatformPostingRequest,
    images: Optional[List[UploadFile]] = File(None, description="Car images"),
    db: Session = Depends(get_db)
):
    """
    Post a car listing to multiple platforms
    
    This endpoint:
    1. Processes uploaded images (if any)
    2. Creates structured listing data
    3. Posts to selected platforms
    4. Returns posting results for each platform
    """
    try:
        # Process images if provided
        image_bytes = []
        if images:
            image_bytes = [await img.read() for img in images]
        
        # Create listing data
        listing_data = ListingData(
            title=request.title or f"{request.year} {request.make} {request.model}",
            description=request.description or f"Clean {request.year} {request.make} {request.model} with {request.mileage:,} miles. Well-maintained and ready to drive!",
            price=request.price,
            make=request.make,
            model=request.model,
            year=request.year,
            mileage=request.mileage,
            images=image_bytes,
            location=request.location,
            condition=request.condition,
            features=request.features
        )
        
        # Post to platforms
        results = await post_listing_to_platforms(listing_data, request.platforms)
        
        # Convert results to dict format
        posting_results = []
        successful_count = 0
        failed_count = 0
        
        for result in results:
            posting_result = {
                "platform": result.platform,
                "success": result.success,
                "listing_id": result.listing_id,
                "url": result.url,
                "error_message": result.error_message,
                "posted_at": result.posted_at.isoformat() if result.posted_at else None
            }
            posting_results.append(posting_result)
            
            if result.success:
                successful_count += 1
            else:
                failed_count += 1
        
        return PlatformPostingResponse(
            success=successful_count > 0,
            timestamp=datetime.utcnow().isoformat(),
            posting_results=posting_results,
            total_platforms=len(request.platforms),
            successful_postings=successful_count,
            failed_postings=failed_count
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Platform posting failed: {str(e)}")

@router.post("/platform-posting/analyze-and-post")
async def analyze_and_post_listing(
    images: List[UploadFile] = File(..., description="Car images for analysis"),
    platforms: List[str] = Form(..., description="Platforms to post to"),
    user_id: int = Form(...),
    custom_price: Optional[float] = Form(None),
    custom_description: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Analyze car images and post listing to platforms
    
    This endpoint combines image analysis with platform posting:
    1. Analyzes uploaded images using AI
    2. Extracts car details automatically
    3. Posts to selected platforms
    4. Returns comprehensive results
    """
    try:
        if len(images) > 15:
            raise HTTPException(status_code=400, detail="Maximum 15 images allowed.")
        
        # Read image bytes
        image_bytes = [await img.read() for img in images]
        
        # Step 1: Analyze images using ListenerAgent
        listener_agent = ListenerAgent(db)
        car_data = await listener_agent.extract_details_from_images(image_bytes)
        
        # Step 2: Override with custom values if provided
        if custom_price:
            car_data["price"] = custom_price
        if custom_description:
            car_data["description"] = custom_description
        
        # Step 3: Post to platforms
        posting_results = await listener_agent.post_listing_to_platforms(car_data, platforms)
        
        # Step 4: Save to database
        saved_car = listener_agent.save_listing(car_data)
        
        return {
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "car_analysis": car_data,
            "posting_results": posting_results,
            "saved_car_id": saved_car.car_id,
            "total_platforms": len(platforms),
            "successful_postings": len([r for r in posting_results if r.get("success")]),
            "failed_postings": len([r for r in posting_results if not r.get("success")])
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analyze and post failed: {str(e)}")

@router.post("/platform-posting/post-listing-simple", response_model=PlatformPostingResponse)
async def post_listing_simple(
    request: PlatformPostingRequest,
    db: Session = Depends(get_db)
):
    """
    Simple posting endpoint for testing (JSON only, no file uploads)
    
    This endpoint:
    1. Creates structured listing data
    2. Posts to selected platforms
    3. Returns posting results for each platform
    """
    try:
        # Create listing data
        listing_data = ListingData(
            title=request.title or f"{request.year} {request.make} {request.model}",
            description=request.description or f"Clean {request.year} {request.make} {request.model} with {request.mileage:,} miles. Well-maintained and ready to drive!",
            price=request.price,
            make=request.make,
            model=request.model,
            year=request.year,
            mileage=request.mileage,
            images=[],  # No images for simple endpoint
            location=request.location,
            condition=request.condition,
            features=request.features
        )
        
        # Post to platforms
        results = await post_listing_to_platforms(listing_data, request.platforms)
        
        # Convert results to dict format
        posting_results = []
        successful_count = 0
        failed_count = 0
        
        for result in results:
            posting_result = {
                "platform": result.platform,
                "success": result.success,
                "listing_id": result.listing_id,
                "url": result.url,
                "error_message": result.error_message,
                "posted_at": result.posted_at.isoformat() if result.posted_at else None
            }
            posting_results.append(posting_result)
            
            if result.success:
                successful_count += 1
            else:
                failed_count += 1
        
        return PlatformPostingResponse(
            success=successful_count > 0,
            timestamp=datetime.utcnow().isoformat(),
            posting_results=posting_results,
            total_platforms=len(request.platforms),
            successful_postings=successful_count,
            failed_postings=failed_count
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Platform posting failed: {str(e)}")

@router.get("/platform-posting/supported-platforms")
async def get_supported_platforms():
    """Get list of supported platforms"""
    return {
        "platforms": [
            {
                "name": "facebook_marketplace",
                "display_name": "Facebook Marketplace",
                "description": "Post to Facebook Marketplace",
                "requires_auth": True,
                "api_type": "Facebook Business API"
            },
            {
                "name": "craigslist",
                "display_name": "Craigslist",
                "description": "Post to Craigslist",
                "requires_auth": True,
                "api_type": "Web Scraping"
            },
            {
                "name": "offerup",
                "display_name": "OfferUp",
                "description": "Post to OfferUp",
                "requires_auth": True,
                "api_type": "OfferUp API"
            }
        ]
    } 