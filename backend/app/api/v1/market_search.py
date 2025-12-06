"""
Main Market Search API - Routes to appropriate search methods
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import logging
from datetime import datetime

from app.services.scraping_service import scraping_service
from app.core.security import get_current_user
from fastapi import Depends, HTTPException
from app.core.database import get_db
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

router = APIRouter()


class MarketSearchRequest(BaseModel):
    searchTerm: str
    location: Optional[str] = "United States"
    radius: Optional[int] = 50
    max_results: Optional[int] = 20
    sources: Optional[List[str]] = ["ebay", "cargurus"]


class MarketSearchResponse(BaseModel):
    success: bool
    results: List[Dict[str, Any]]
    summary: Dict[str, Any]
    message: str
    error_message: Optional[str] = None


@router.post("/", response_model=MarketSearchResponse)
async def market_search(
    request: MarketSearchRequest
):
    """
    Main market search endpoint that routes to the best available search method
    """
    try:
        logger.info(f"Market search request: {request.searchTerm}")
        
        # Validate search term
        if not request.searchTerm or len(request.searchTerm.strip()) < 2:
            raise HTTPException(
                status_code=400, 
                detail="Search term must be at least 2 characters long"
            )
        
        # Try the scraping service first (most reliable)
        try:
            results = await scraping_service.search_cars(
                search_term=request.searchTerm,
                max_results=request.max_results,
                sources=request.sources
            )
            
            if results:
                # Calculate summary statistics
                prices = [r.get('price', 0) for r in results if r.get('price', 0) > 0]
                sources = list(set([r.get('source', 'Unknown') for r in results]))
                
                summary = {
                    "totalListings": len(results),
                    "averagePrice": sum(prices) / len(prices) if prices else 0,
                    "priceRange": {
                        "min": min(prices) if prices else 0,
                        "max": max(prices) if prices else 0
                    },
                    "sources": sources,
                    "searchTerm": request.searchTerm,
                    "isRealData": True,
                    "isDirectListings": True,
                    "message": f"Found {len(results)} listings for {request.searchTerm}"
                }
                
                return MarketSearchResponse(
                    success=True,
                    results=results,
                    summary=summary,
                    message=f"Found {len(results)} vehicle listings"
                )
        
        except Exception as scraping_error:
            logger.warning(f"Scraping service failed: {scraping_error}")
        
        # Fallback to mock data if scraping fails
        logger.info("Falling back to mock data for market search")
        
        # Generate mock results based on the search term
        mock_results = generate_mock_results(request.searchTerm, request.max_results)
        
        if mock_results:
            prices = [r.get('price', 0) for r in mock_results if r.get('price', 0) > 0]
            sources = list(set([r.get('source', 'Unknown') for r in mock_results]))
            
            summary = {
                "totalListings": len(mock_results),
                "averagePrice": sum(prices) / len(prices) if prices else 0,
                "priceRange": {
                    "min": min(prices) if prices else 0,
                    "max": max(prices) if prices else 0
                },
                "sources": sources,
                "searchTerm": request.searchTerm,
                "isRealData": False,
                "isDirectListings": False,
                "message": f"Mock data: Found {len(mock_results)} sample listings for {request.searchTerm}"
            }
            
            return MarketSearchResponse(
                success=True,
                results=mock_results,
                summary=summary,
                message=f"Found {len(mock_results)} sample vehicle listings (mock data)"
            )
        
        # No results found
        return MarketSearchResponse(
            success=False,
            results=[],
            summary={
                "totalListings": 0,
                "averagePrice": 0,
                "priceRange": {"min": 0, "max": 0},
                "sources": [],
                "searchTerm": request.searchTerm,
                "isRealData": False,
                "isDirectListings": False,
                "message": f"No listings found for {request.searchTerm}"
            },
            message="No vehicle listings found"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Market search error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Market search failed: {str(e)}"
        )


def generate_mock_results(search_term: str, max_results: int = 20) -> List[Dict[str, Any]]:
    """Generate mock market search results for demo purposes"""
    
    # Extract make and model from search term
    search_lower = search_term.lower()
    
    # Mock data based on common car makes
    mock_data = {
        "bmw": [
            {"title": "2018 BMW 3 Series", "price": 28000, "mileage": 45000, "location": "Los Angeles, CA", "source": "eBay Motors"},
            {"title": "2019 BMW 5 Series", "price": 35000, "mileage": 32000, "location": "Miami, FL", "source": "CarGurus"},
            {"title": "2020 BMW X3", "price": 42000, "mileage": 28000, "location": "Austin, TX", "source": "AutoTrader"},
        ],
        "toyota": [
            {"title": "2019 Toyota Camry", "price": 22000, "mileage": 38000, "location": "Phoenix, AZ", "source": "eBay Motors"},
            {"title": "2020 Toyota RAV4", "price": 28000, "mileage": 25000, "location": "Denver, CO", "source": "CarGurus"},
            {"title": "2018 Toyota Prius", "price": 18000, "mileage": 55000, "location": "Portland, OR", "source": "AutoTrader"},
        ],
        "honda": [
            {"title": "2019 Honda Civic", "price": 20000, "mileage": 40000, "location": "Seattle, WA", "source": "eBay Motors"},
            {"title": "2020 Honda CR-V", "price": 26000, "mileage": 30000, "location": "Boston, MA", "source": "CarGurus"},
            {"title": "2018 Honda Accord", "price": 23000, "mileage": 45000, "location": "Atlanta, GA", "source": "AutoTrader"},
        ],
        "ford": [
            {"title": "2019 Ford F-150", "price": 35000, "mileage": 35000, "location": "Dallas, TX", "source": "eBay Motors"},
            {"title": "2020 Ford Explorer", "price": 32000, "mileage": 28000, "location": "Chicago, IL", "source": "CarGurus"},
            {"title": "2018 Ford Mustang", "price": 25000, "mileage": 40000, "location": "Detroit, MI", "source": "AutoTrader"},
        ],
        "mercedes": [
            {"title": "2019 Mercedes C-Class", "price": 38000, "mileage": 30000, "location": "New York, NY", "source": "eBay Motors"},
            {"title": "2020 Mercedes GLC", "price": 45000, "mileage": 25000, "location": "San Francisco, CA", "source": "CarGurus"},
            {"title": "2018 Mercedes E-Class", "price": 42000, "mileage": 35000, "location": "Las Vegas, NV", "source": "AutoTrader"},
        ]
    }
    
    # Find matching make
    results = []
    for make, cars in mock_data.items():
        if make in search_lower:
            results.extend(cars)
            break
    
    # If no specific make found, return a mix
    if not results:
        for make, cars in mock_data.items():
            results.extend(cars[:2])  # Take 2 from each make
    
    # Limit results
    return results[:max_results]
