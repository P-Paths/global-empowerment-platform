"""
Market Search API using ScrapingBee - Professional web scraping
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import logging
from app.services.scrapingbee_service import ScrapingBeeService
import asyncio

logger = logging.getLogger(__name__)

router = APIRouter()

class MarketSearchRequest(BaseModel):
    search_term: str
    location: Optional[str] = "United States"
    radius: Optional[int] = 50

class MarketSearchResponse(BaseModel):
    success: bool
    results: List[Dict[str, Any]]
    summary: Dict[str, Any]
    message: str

@router.post("/scrapingbee", response_model=MarketSearchResponse)
async def market_search_scrapingbee(request: MarketSearchRequest):
    """
    Search for real vehicle listings using ScrapingBee professional scraping service
    """
    try:
        logger.info(f"Starting ScrapingBee market search for: {request.search_term}")
        
        # Use ScrapingBee service to get real vehicle listings
        async with ScrapingBeeService() as scraper:
            # Scrape from all sources
            results = await scraper.scrape_all_sources(
                search_term=request.search_term,
                max_results_per_source=5
            )
        
        if not results:
            logger.warning(f"No results found for search term: {request.search_term}")
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
                    "message": "No listings found for this search term"
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
            "message": f"Found {len(results)} real vehicle listings with direct links using ScrapingBee"
        }
        
        logger.info(f"Successfully scraped {len(results)} listings from {len(sources)} sources using ScrapingBee")
        
        return MarketSearchResponse(
            success=True,
            results=results,
            summary=summary,
            message=f"Found {len(results)} real vehicle listings using professional scraping"
        )
        
    except Exception as e:
        logger.error(f"ScrapingBee market search error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Market search failed: {str(e)}"
        )
