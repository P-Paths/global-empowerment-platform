"""
Market Search API with Scrapy Integration
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import logging
from datetime import datetime

from app.services.scraping_service import scraping_service
from app.core.security import get_current_user
from app.core.database import get_db
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

router = APIRouter()


class MarketSearchRequest(BaseModel):
    search_term: str
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


@router.post("/scraping", response_model=MarketSearchResponse)
async def market_search_scraping(
    request: MarketSearchRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Search for cars using Scrapy spiders across multiple marketplaces
    """
    try:
        logger.info(f"Market search request: {request.search_term}")
        
        # Validate search term
        if not request.search_term or len(request.search_term.strip()) < 2:
            raise HTTPException(
                status_code=400, 
                detail="Search term must be at least 2 characters long"
            )
        
        # Run scraping service
        results = await scraping_service.search_cars(
            search_term=request.search_term,
            max_results=request.max_results,
            sources=request.sources
        )
        
        if not results:
            logger.warning(f"No results found for search: {request.search_term}")
            return MarketSearchResponse(
                success=False,
                results=[],
                summary={
                    "totalListings": 0,
                    "averagePrice": 0,
                    "priceRange": {"min": 0, "max": 0},
                    "sources": [],
                    "searchTerm": request.search_term,
                    "isRealData": True,
                    "isDirectListings": True,
                    "message": f"No listings found for {request.search_term}"
                },
                message="No vehicle listings found"
            )
        
        # Calculate summary statistics
        prices = [r.get('price', 0) for r in results if r.get('price', 0) > 0]
        sources = list(set([r.get('source', 'Unknown') for r in results]))
        
        summary = {
            "totalListings": len(results),
            "averagePrice": round(sum(prices) / len(prices)) if prices else 0,
            "priceRange": {
                "min": min(prices) if prices else 0,
                "max": max(prices) if prices else 0
            },
            "sources": sources,
            "searchTerm": request.search_term,
            "isRealData": True,
            "isDirectListings": True,
            "message": f"Found {len(results)} real vehicle listings with direct marketplace links"
        }
        
        logger.info(f"Successfully found {len(results)} listings using scraping")
        
        return MarketSearchResponse(
            success=True,
            results=results,
            summary=summary,
            message="Real vehicle listings found - click any link to view the actual vehicle posting"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Market search scraping failed: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Market search failed: {str(e)}"
        )


@router.get("/scraping/status")
async def get_scraping_status(current_user: dict = Depends(get_current_user)):
    """
    Get status of scraping spiders
    """
    try:
        status = await scraping_service.get_spider_status()
        return {
            "success": True,
            "status": status,
            "message": "Scraping service status retrieved"
        }
    except Exception as e:
        logger.error(f"Failed to get scraping status: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get scraping status: {str(e)}"
        )


@router.post("/scraping/test/{spider_name}")
async def test_spider(
    spider_name: str,
    search_term: str = "2015 Honda Civic",
    current_user: dict = Depends(get_current_user)
):
    """
    Test a specific spider with a sample search
    """
    try:
        if spider_name not in ['ebay', 'cargurus']:
            raise HTTPException(
                status_code=400,
                detail="Invalid spider name. Must be 'ebay' or 'cargurus'"
            )
        
        result = await scraping_service.test_spider(spider_name, search_term)
        
        return {
            "success": True,
            "test_result": result,
            "message": f"Spider test completed for {spider_name}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Spider test failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Spider test failed: {str(e)}"
        )


@router.get("/scraping/sources")
async def get_available_sources(current_user: dict = Depends(get_current_user)):
    """
    Get list of available scraping sources
    """
    return {
        "success": True,
        "sources": [
            {
                "name": "ebay",
                "display_name": "eBay Motors",
                "description": "eBay Motors car listings with direct links to individual postings",
                "status": "active"
            },
            {
                "name": "cargurus",
                "display_name": "CarGurus",
                "description": "CarGurus dealer listings with 404 fallback to search results",
                "status": "active"
            }
        ],
        "message": "Available scraping sources retrieved"
    }
