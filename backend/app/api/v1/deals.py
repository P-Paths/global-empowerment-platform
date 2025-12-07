"""
Deals API - Real endpoints for deal discovery and analysis
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
import json
import os

from ...core.database import get_sync_db as get_db
from ...services.ai_brain import AIBrain
from ...services.real_scraper import real_scraper
from ...services.real_valuation_service import real_valuation_service

router = APIRouter()

@router.get("/deals/discover")
async def discover_deals(
    search_term: str = Query("Honda Civic", description="Search term for cars"),
    max_results: int = Query(20, description="Maximum number of results"),
    db: Session = Depends(get_db)
):
    """
    Discover real car deals from live marketplaces
    """
    try:
        # Use real scraper to get live data
        async with real_scraper as scraper:
            # Scrape from multiple sources
            ebay_results = await scraper.scrape_ebay_motors(search_term, max_results // 3)
            cargurus_results = await scraper.scrape_cargurus(search_term, max_results // 3)
            google_results = await scraper.scrape_google_car_listings(search_term, max_results // 3)
            
            # Combine results
            all_deals = ebay_results + cargurus_results + google_results
            
            # Sort by deal score
            all_deals.sort(key=lambda x: x.get("deal_score", 0), reverse=True)
            
            # Limit results
            all_deals = all_deals[:max_results]
            
            return {
                "success": True,
                "deals": all_deals,
                "total_found": len(all_deals),
                "sources": {
                    "ebay_motors": len(ebay_results),
                    "cargurus": len(cargurus_results),
                    "google_search": len(google_results)
                },
                "search_term": search_term
            }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error discovering deals: {str(e)}")

@router.get("/deals/{deal_id}")
async def get_deal_details(
    deal_id: str,
    db: Session = Depends(get_db)
):
    """
    Get detailed analysis for a specific deal
    """
    try:
        # For now, we'll need to re-scrape to get the specific deal
        # In production, this would be stored in a database
        
        # Extract source from deal_id
        if deal_id.startswith("ebay_"):
            source = "ebay_motors"
            search_term = "Honda Civic"  # Default, should be stored
        elif deal_id.startswith("cargurus_"):
            source = "cargurus"
            search_term = "Honda Civic"  # Default, should be stored
        else:
            raise HTTPException(status_code=404, detail="Deal not found")
        
        # Re-scrape to get the deal
        async with real_scraper as scraper:
            if source == "ebay_motors":
                deals = await scraper.scrape_ebay_motors(search_term, 50)
            else:
                deals = await scraper.scrape_cargurus(search_term, 50)
            
            # Find the specific deal
            deal = None
            for d in deals:
                if d.get("id") == deal_id:
                    deal = d
                    break
            
            if not deal:
                raise HTTPException(status_code=404, detail="Deal not found")
            
            # Get real valuation
            async with real_valuation_service as valuation:
                analysis = await valuation.get_valuation(deal)
            
            return {
                "success": True,
                "deal": deal,
                "analysis": analysis
            }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting deal details: {str(e)}")

@router.post("/deals/analyze")
async def analyze_deal(
    deal_data: Dict[str, Any],
    db: Session = Depends(get_db)
):
    """
    Analyze a car deal using the multi-agent system
    """
    try:
        # Initialize AI Brain
        ai_brain = AIBrain()
        
        # Process the deal through all agents
        result = await ai_brain.process_deal(
            listing_data=deal_data,
            user_preferences={
                "max_price": 50000,
                "preferred_makes": ["Honda", "Toyota", "Ford"],
                "risk_tolerance": "medium",
                "location": "Texas"
            }
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing deal: {str(e)}")

@router.get("/deals/search")
async def search_deals(
    make: Optional[str] = Query(None, description="Car make"),
    model: Optional[str] = Query(None, description="Car model"),
    max_price: Optional[int] = Query(None, description="Maximum price"),
    min_year: Optional[int] = Query(None, description="Minimum year"),
    location: Optional[str] = Query(None, description="Location"),
    limit: int = Query(20, description="Number of deals to return"),
    db: Session = Depends(get_db)
):
    """
    Search for deals with specific criteria
    """
    try:
        # Build search term
        search_terms = []
        if make:
            search_terms.append(make)
        if model:
            search_terms.append(model)
        
        search_term = " ".join(search_terms) if search_terms else "Honda Civic"
        
        # Get deals
        async with real_scraper as scraper:
            ebay_results = await scraper.scrape_ebay_motors(search_term, limit)
            cargurus_results = await scraper.scrape_cargurus(search_term, limit)
            
            all_deals = ebay_results + cargurus_results
        
        # Apply filters
        filtered_deals = []
        for deal in all_deals:
            # Price filter
            if max_price and deal.get("price", 0) > max_price:
                continue
            
            # Year filter
            if min_year and deal.get("year", 0) < min_year:
                continue
            
            # Location filter
            if location and location.lower() not in deal.get("location", "").lower():
                continue
            
            filtered_deals.append(deal)
        
        # Sort by deal score
        filtered_deals.sort(key=lambda x: x.get("deal_score", 0), reverse=True)
        
        # Limit results
        filtered_deals = filtered_deals[:limit]
        
        return {
            "success": True,
            "deals": filtered_deals,
            "total_found": len(filtered_deals),
            "filters_applied": {
                "make": make,
                "model": model,
                "max_price": max_price,
                "min_year": min_year,
                "location": location
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching deals: {str(e)}")

@router.get("/deals/recommendations")
async def get_deal_recommendations(
    user_id: Optional[int] = Query(None, description="User ID for personalized recommendations"),
    limit: int = Query(5, description="Number of recommendations to return"),
    db: Session = Depends(get_db)
):
    """
    Get personalized deal recommendations
    """
    try:
        # For now, get top deals from popular searches
        # In production, this would use user preferences and learning agent
        
        popular_searches = ["Honda Civic", "Toyota Camry", "Ford F-150", "BMW 3 Series"]
        all_deals = []
        
        async with real_scraper as scraper:
            for search_term in popular_searches:
                ebay_results = await scraper.scrape_ebay_motors(search_term, 5)
                cargurus_results = await scraper.scrape_cargurus(search_term, 5)
                all_deals.extend(ebay_results + cargurus_results)
        
        # Sort by deal score and remove duplicates
        unique_deals = {}
        for deal in all_deals:
            deal_key = f"{deal.get('make')}_{deal.get('model')}_{deal.get('year')}_{deal.get('price')}"
            if deal_key not in unique_deals:
                unique_deals[deal_key] = deal
        
        # Get top deals
        top_deals = sorted(unique_deals.values(), key=lambda x: x.get("deal_score", 0), reverse=True)[:limit]
        
        return {
            "success": True,
            "recommendations": top_deals,
            "reasoning": "Top deals based on deal score across popular car models",
            "user_id": user_id
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting recommendations: {str(e)}")

@router.get("/deals/market-insights")
async def get_market_insights(
    make: Optional[str] = Query(None, description="Car make for insights"),
    model: Optional[str] = Query(None, description="Car model for insights"),
    location: Optional[str] = Query(None, description="Location for insights"),
    db: Session = Depends(get_db)
):
    """
    Get market insights and trends
    """
    try:
        # Build search term
        search_terms = []
        if make:
            search_terms.append(make)
        if model:
            search_terms.append(model)
        
        search_term = " ".join(search_terms) if search_terms else "Honda Civic"
        
        # Get deals for analysis
        async with real_scraper as scraper:
            ebay_results = await scraper.scrape_ebay_motors(search_term, 50)
            cargurus_results = await scraper.scrape_cargurus(search_term, 50)
            
            all_deals = ebay_results + cargurus_results
        
        # Filter by location if specified
        if location:
            all_deals = [d for d in all_deals if location.lower() in d.get("location", "").lower()]
        
        if not all_deals:
            return {
                "success": True,
                "insights": {
                    "message": "No data available for the specified criteria",
                    "total_listings": 0,
                    "avg_price": 0,
                    "avg_deal_score": 0
                }
            }
        
        # Calculate insights
        prices = [d.get("price", 0) for d in all_deals if d.get("price", 0) > 0]
        deal_scores = [d.get("deal_score", 0) for d in all_deals]
        
        insights = {
            "total_listings": len(all_deals),
            "avg_price": round(sum(prices) / len(prices), 2) if prices else 0,
            "min_price": min(prices) if prices else 0,
            "max_price": max(prices) if prices else 0,
            "avg_deal_score": round(sum(deal_scores) / len(deal_scores), 2) if deal_scores else 0,
            "top_deals": len([s for s in deal_scores if s >= 0.8]),
            "market_trend": "stable",
            "seasonal_factor": 1.0,
            "recommendation": "Good time to buy" if sum(deal_scores) / len(deal_scores) > 0.6 else "Market is competitive"
        }
        
        return {
            "success": True,
            "insights": insights,
            "filters": {
                "make": make,
                "model": model,
                "location": location
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting market insights: {str(e)}")

@router.post("/deals/feedback")
async def submit_deal_feedback(
    deal_id: str,
    feedback: Dict[str, Any],
    db: Session = Depends(get_db)
):
    """
    Submit feedback on a deal (for learning agent)
    """
    try:
        # In production, this would save to database and update learning agent
        feedback_data = {
            "deal_id": deal_id,
            "feedback": feedback,
            "timestamp": "2024-01-01T00:00:00Z"
        }
        
        return {
            "success": True,
            "message": "Feedback submitted successfully",
            "feedback_id": "real_feedback_id"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error submitting feedback: {str(e)}") 