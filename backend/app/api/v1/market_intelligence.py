"""
Market Intelligence API endpoints

Provides endpoints for:
- Market analysis and intelligence
- Competitor research
- Pricing recommendations
- Demand analysis
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
import logging
from app.agents import MarketIntelligenceAgent
from app.core.database import get_sync_db
from sqlalchemy.orm import Session
from app.utils.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter()

class MarketIntelligenceRequest(BaseModel):
    """Request model for market intelligence analysis"""
    make: str = Field(..., description="Car make")
    model: str = Field(..., description="Car model")
    year: Optional[int] = Field(None, description="Car year")
    mileage: Optional[int] = Field(None, description="Car mileage")
    location: str = Field("United States", description="Location for analysis")
    radius_miles: int = Field(50, description="Search radius in miles")
    target_profit: float = Field(2000, description="Target profit amount")
    risk_tolerance: str = Field("medium", description="Risk tolerance level")
    analysis_type: str = Field("comprehensive", description="Type of analysis")

class MarketIntelligenceResponse(BaseModel):
    """Response model for market intelligence analysis"""
    success: bool
    timestamp: str
    analysis_type: str
    data: Dict[str, Any]
    processing_time: float
    confidence: float
    error_message: Optional[str] = None

@router.post("/market-intelligence/analyze", response_model=MarketIntelligenceResponse)
async def analyze_market_intelligence(
    request: MarketIntelligenceRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_sync_db)
):
    """
    Analyze market intelligence for a specific make and model.
    
    This endpoint provides comprehensive market analysis including:
    - Make/Model popularity and demand analysis
    - Competitor research in the local area
    - Pricing trends and market data
    - Profit threshold recommendations
    - Risk assessment and mitigation strategies
    """
    try:
        # Log the authenticated user
        user_email = current_user.get("email", "unknown")
        logger.info(f"Market intelligence analysis requested by: {user_email}")
        
        # Database is optional - don't fail if it's None
        if db is None:
            logger.warning("Database session not available, continuing without DB")
        
        # Initialize the market intelligence agent
        try:
            agent = MarketIntelligenceAgent()
        except ValueError as ve:
            # Handle missing API key specifically
            error_msg = str(ve) if str(ve) else f"ValueError: {type(ve).__name__}"
            if "OPENAI_API_KEY" in error_msg or "GEMINI_API_KEY" in error_msg:
                raise HTTPException(
                    status_code=500,
                    detail="API key is not configured. Please set OPENAI_API_KEY or GEMINI_API_KEY environment variable."
                )
            raise
        
        # Prepare input data
        input_data = {
            "make": request.make,
            "model": request.model,
            "year": request.year,
            "mileage": request.mileage,
            "location": request.location,
            "radius_miles": request.radius_miles,
            "target_profit": request.target_profit,
            "risk_tolerance": request.risk_tolerance,
            "analysis_type": request.analysis_type
        }
        
        # Process the request
        result = await agent.execute(input_data)
        
        if not result.success:
            logger.error(f"Market intelligence analysis failed: {result.error_message}")
        
        return MarketIntelligenceResponse(
            success=result.success,
            timestamp=result.timestamp.isoformat(),
            analysis_type=request.analysis_type,
            data=result.data,
            processing_time=result.processing_time,
            confidence=result.confidence,
            error_message=result.error_message
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        error_msg = str(e) if str(e) else f"Unknown error: {type(e).__name__}"
        logger.error(f"Market intelligence analysis exception: {error_msg}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Market intelligence analysis failed: {error_msg}")

@router.get("/market-intelligence/makes")
async def get_popular_makes(current_user: dict = Depends(get_current_user)):
    """
    Get list of popular car makes for analysis.
    
    Returns makes that are commonly analyzed for car flipping opportunities.
    """
    try:
        agent = MarketIntelligenceAgent()
    except ValueError as ve:
        if "OPENAI_API_KEY" in str(ve):
            # Return basic data even without OpenAI (for GET endpoints that don't require AI)
            return {
                "popular_makes": [
                    "Toyota", "Honda", "Ford", "Chevrolet", "Nissan", "BMW", "Mercedes-Benz",
                    "Audi", "Lexus", "Hyundai", "Kia", "Mazda", "Subaru", "Volkswagen"
                ],
                "high_demand_models": {
                    "Toyota": ["Camry", "Corolla", "RAV4", "Highlander", "Tacoma", "4Runner"],
                    "Honda": ["Accord", "Civic", "CR-V", "Pilot", "Odyssey"],
                    "Ford": ["F-150", "Mustang", "Escape", "Explorer", "Bronco"],
                    "Chevrolet": ["Silverado 1500", "Equinox", "Malibu", "Tahoe"],
                    "Nissan": ["Altima", "Sentra", "Rogue", "Pathfinder"]
                }
            }
        raise
    
    return {
        "popular_makes": agent.popular_makes,
        "high_demand_models": agent.high_demand_models
    }

@router.get("/market-intelligence/models/{make}")
async def get_models_for_make(
    make: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get list of models for a specific make.
    
    Args:
        make: Car make (e.g., Toyota, Honda)
    """
    try:
        agent = MarketIntelligenceAgent()
        high_demand_models = agent.high_demand_models
    except ValueError as ve:
        if "OPENAI_API_KEY" in str(ve):
            # Return basic data even without OpenAI (for GET endpoints that don't require AI)
            high_demand_models = {
                "Toyota": ["Camry", "Corolla", "RAV4", "Highlander", "Tacoma", "4Runner"],
                "Honda": ["Accord", "Civic", "CR-V", "Pilot", "Odyssey"],
                "Ford": ["F-150", "Mustang", "Escape", "Explorer", "Bronco"],
                "Chevrolet": ["Silverado 1500", "Equinox", "Malibu", "Tahoe"],
                "Nissan": ["Altima", "Sentra", "Rogue", "Pathfinder"]
            }
        else:
            raise
    
    make = make.title()
    
    if make in high_demand_models:
        return {
            "make": make,
            "models": high_demand_models[make],
            "is_high_demand": True
        }
    else:
        return {
            "make": make,
            "models": [],
            "is_high_demand": False,
            "message": f"No specific model data for {make}. Consider using comprehensive analysis."
        }

@router.post("/market-intelligence/quick-analysis")
async def quick_market_analysis(
    make: str,
    model: str,
    location: str = "United States",
    current_user: dict = Depends(get_current_user)
):
    """
    Quick market analysis for a specific make and model.
    
    Provides rapid market insights without comprehensive analysis.
    """
    try:
        try:
            agent = MarketIntelligenceAgent()
        except ValueError as ve:
            if "OPENAI_API_KEY" in str(ve):
                raise HTTPException(
                    status_code=500,
                    detail="OpenAI API key is not configured. Please set the OPENAI_API_KEY environment variable."
                )
            raise
        
        input_data = {
            "make": make,
            "model": model,
            "location": location,
            "analysis_type": "quick"
        }
        
        result = await agent.execute(input_data)
        
        return {
            "success": result.success,
            "data": result.data,
            "processing_time": result.processing_time
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quick analysis failed: {str(e)}")

@router.post("/market-intelligence/competitor-search")
async def competitor_search(
    make: str,
    model: str,
    location: str = "United States",
    radius_miles: int = 50,
    current_user: dict = Depends(get_current_user)
):
    """
    Search for competitors in the local market.
    
    Analyzes similar vehicles for sale in the specified area.
    """
    try:
        try:
            agent = MarketIntelligenceAgent()
        except ValueError as ve:
            if "OPENAI_API_KEY" in str(ve):
                raise HTTPException(
                    status_code=500,
                    detail="OpenAI API key is not configured. Please set the OPENAI_API_KEY environment variable."
                )
            raise
        
        input_data = {
            "make": make,
            "model": model,
            "location": location,
            "radius_miles": radius_miles,
            "analysis_type": "competitor_search"
        }
        
        result = await agent.execute(input_data)
        
        return {
            "success": result.success,
            "competitors": result.data.get("competitors", []),
            "market_insights": result.data.get("market_insights", {})
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Competitor search failed: {str(e)}")

@router.post("/market-intelligence/profit-thresholds")
async def calculate_profit_thresholds(
    make: str,
    model: str,
    purchase_price: float,
    target_profit: float,
    location: str = "United States",
    current_user: dict = Depends(get_current_user)
):
    """
    Calculate profit thresholds and recommendations.
    
    Provides pricing strategy based on market data and profit goals.
    """
    try:
        try:
            agent = MarketIntelligenceAgent()
        except ValueError as ve:
            if "OPENAI_API_KEY" in str(ve):
                raise HTTPException(
                    status_code=500,
                    detail="OpenAI API key is not configured. Please set the OPENAI_API_KEY environment variable."
                )
            raise
        
        input_data = {
            "make": make,
            "model": model,
            "purchase_price": purchase_price,
            "target_profit": target_profit,
            "location": location,
            "analysis_type": "profit_analysis"
        }
        
        result = await agent.execute(input_data)
        
        return {
            "success": result.success,
            "profit_analysis": result.data.get("profit_analysis", {}),
            "pricing_recommendations": result.data.get("pricing_recommendations", [])
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Profit analysis failed: {str(e)}") 