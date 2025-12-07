from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid
from app.services.listen_agent import CarDetails, run_listen_agent

router = APIRouter()

class ListingCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=10, max_length=2000)
    price: float = Field(..., gt=0)
    mileage: int = Field(..., ge=0)
    make: str
    model: str
    year: int
    images: Optional[List[str]] = []

class ListingResponse(BaseModel):
    id: str
    title: str
    description: str
    price: float
    mileage: int
    make: str
    model: str
    year: int
    images: List[str]
    status: str
    created_at: datetime
    updated_at: datetime

@router.post("/", response_model=ListingResponse)
async def create_listing(listing: ListingCreate):
    """Create a new car listing"""
    # TODO: Implement actual database storage
    listing_id = str(uuid.uuid4())
    now = datetime.utcnow()
    
    return ListingResponse(
        id=listing_id,
        title=listing.title,
        description=listing.description,
        price=listing.price,
        mileage=listing.mileage,
        make=listing.make,
        model=listing.model,
        year=listing.year,
        images=listing.images or [],
        status="draft",
        created_at=now,
        updated_at=now
    )

@router.get("/", response_model=List[ListingResponse])
async def get_listings():
    """Get all listings for the current user"""
    # TODO: Implement actual database query
    return []

@router.get("/{listing_id}", response_model=ListingResponse)
async def get_listing(listing_id: str):
    """Get a specific listing by ID"""
    # TODO: Implement actual database query
    raise HTTPException(status_code=404, detail="Listing not found")

@router.put("/{listing_id}", response_model=ListingResponse)
async def update_listing(listing_id: str, listing: ListingCreate):
    """Update a listing"""
    # TODO: Implement actual database update
    raise HTTPException(status_code=404, detail="Listing not found")

@router.delete("/{listing_id}")
async def delete_listing(listing_id: str):
    """Delete a listing"""
    # TODO: Implement actual database deletion
    return {"message": "Listing deleted successfully"}

# Listen Agent Endpoints
class ListenAgentRequest(BaseModel):
    year: int = Field(..., ge=1900, le=2025)
    make: str = Field(..., min_length=1, max_length=50)
    model: str = Field(..., min_length=1, max_length=50)
    mileage: int = Field(..., ge=0)
    condition: str = Field(default="good", pattern="^(excellent|good|fair|poor)$")
    features: Optional[List[str]] = []
    images: Optional[List[str]] = []

@router.post("/listen-agent/generate")
async def generate_listing_with_agent(request: ListenAgentRequest) -> Dict[str, Any]:
    """
    Use the listening agent to generate a listing draft
    """
    try:
        # Convert request to CarDetails
        car_details = CarDetails(
            year=request.year,
            make=request.make,
            model=request.model,
            mileage=request.mileage,
            condition=request.condition,
            features=request.features,
            images=request.images
        )
        
        # Run the listening agent
        result = await run_listen_agent(car_details)
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Listen agent error: {str(e)}")

@router.get("/listen-agent/status")
async def get_listen_agent_status() -> Dict[str, Any]:
    """
    Get the status of the listening agent
    """
    return {
        "agent_name": "listen_agent_v1",
        "version": "1.0.0",
        "status": "active",
        "tools_available": [
            "describe_car",
            "fetch_market_price", 
            "generate_listing_text",
            "analyze_negotiation"
        ],
        "last_updated": datetime.utcnow().isoformat()
    } 