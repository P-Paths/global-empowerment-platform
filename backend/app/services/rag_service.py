"""
RAG Service - Retrieval-Augmented Generation for Accorria

Provides real-time access to successful listings and market intelligence
to enhance AI responses with actual data from successful sales.
"""

import json
import os
from typing import List, Dict, Any, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class RAGService:
    """
    RAG Service that provides access to successful listings and market data
    """
    
    def __init__(self):
        self.data_file = os.path.join(os.path.dirname(__file__), '..', 'data', 'successful_listings.json')
        self.data = self._load_data()
        
    def _load_data(self) -> Dict[str, Any]:
        """Load successful listings data"""
        try:
            with open(self.data_file, 'r') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Failed to load RAG data: {e}")
            return {"successful_listings": [], "market_trends": {}, "success_patterns": {}}
    
    def get_similar_successful_listings(self, make: str, model: str, year: int, location: str = "Detroit, MI") -> List[Dict[str, Any]]:
        """
        Get successful listings similar to the given car
        
        Args:
            make: Car make (e.g., "Honda")
            model: Car model (e.g., "Civic") 
            year: Car year (e.g., 2019)
            location: Location (default: "Detroit, MI")
            
        Returns:
            List of similar successful listings
        """
        similar_listings = []
        
        for listing in self.data.get("successful_listings", []):
            # Check if it's the same make/model
            if (listing.get("make", "").lower() == make.lower() and 
                listing.get("model", "").lower() == model.lower()):
                
                # Check if year is within 2 years
                year_diff = abs(listing.get("year", 0) - year)
                if year_diff <= 2:
                    similar_listings.append(listing)
        
        # Sort by most recent sales
        similar_listings.sort(key=lambda x: x.get("sold_date", ""), reverse=True)
        
        return similar_listings[:3]  # Return top 3 most similar
    
    def get_market_insights(self, make: str, model: str, location: str = "Detroit, MI") -> Dict[str, Any]:
        """
        Get market insights for a specific make/model
        
        Args:
            make: Car make
            model: Car model
            location: Location
            
        Returns:
            Market insights dictionary
        """
        location_data = self.data.get("market_trends", {}).get(location.lower(), {})
        
        # Get specific make/model trend
        make_model_key = f"{make.lower()}_{model.lower()}"
        price_trend = location_data.get("price_trends", {}).get(make_model_key, "No recent trend data")
        
        return {
            "avg_days_on_market": location_data.get("avg_days_on_market", 7),
            "price_trend": price_trend,
            "seasonal_factors": location_data.get("seasonal_factors", {}),
            "local_preferences": location_data.get("local_preferences", {})
        }
    
    def get_success_patterns(self) -> Dict[str, Any]:
        """
        Get patterns from successful listings
        
        Returns:
            Success patterns dictionary
        """
        return self.data.get("success_patterns", {})
    
    def get_pricing_recommendation(self, make: str, model: str, year: int, mileage: int, condition: str) -> Dict[str, Any]:
        """
        Get pricing recommendation based on successful listings
        
        Args:
            make: Car make
            model: Car model
            year: Car year
            mileage: Car mileage
            condition: Car condition
            
        Returns:
            Pricing recommendation
        """
        similar_listings = self.get_similar_successful_listings(make, model, year)
        
        if not similar_listings:
            return {
                "recommended_price": None,
                "market_analysis": "No similar successful listings found",
                "confidence": 0.0
            }
        
        # Calculate average sold price
        sold_prices = [listing.get("sold_price", 0) for listing in similar_listings]
        avg_sold_price = sum(sold_prices) / len(sold_prices)
        
        # Adjust for mileage
        avg_mileage = sum([listing.get("mileage", 0) for listing in similar_listings]) / len(similar_listings)
        mileage_factor = 1.0
        
        if mileage > avg_mileage:
            # Higher mileage = lower price
            mileage_diff = (mileage - avg_mileage) / avg_mileage
            mileage_factor = 1.0 - (mileage_diff * 0.1)  # 10% reduction per 10% higher mileage
        elif mileage < avg_mileage:
            # Lower mileage = higher price
            mileage_diff = (avg_mileage - mileage) / avg_mileage
            mileage_factor = 1.0 + (mileage_diff * 0.1)  # 10% increase per 10% lower mileage
        
        # Adjust for condition
        condition_factors = {
            "excellent": 1.05,
            "good": 1.0,
            "fair": 0.9,
            "poor": 0.8
        }
        condition_factor = condition_factors.get(condition.lower(), 1.0)
        
        # Calculate recommended price
        recommended_price = avg_sold_price * mileage_factor * condition_factor
        
        return {
            "recommended_price": round(recommended_price, 2),
            "market_analysis": f"Based on {len(similar_listings)} similar successful sales",
            "confidence": min(0.9, len(similar_listings) * 0.2),  # Higher confidence with more data
            "similar_listings": similar_listings,
            "pricing_factors": {
                "avg_sold_price": avg_sold_price,
                "mileage_factor": mileage_factor,
                "condition_factor": condition_factor
            }
        }
    
    def get_demo_insights(self, make: str, model: str, year: int) -> str:
        """
        Get demo-ready insights for showing to users
        
        Args:
            make: Car make
            model: Car model
            year: Car year
            
        Returns:
            Formatted insights string for demo
        """
        similar_listings = self.get_similar_successful_listings(make, model, year)
        market_insights = self.get_market_insights(make, model)
        
        if not similar_listings:
            return f"No recent successful sales data for {year} {make} {model} in your area."
        
        # Get the most recent successful sale
        recent_sale = similar_listings[0]
        
        insights = f"""
🎯 **Real Market Intelligence for {year} {make} {model}:**

✅ **Recent Successful Sale:** 
   • Sold for ${recent_sale.get('sold_price', 0):,} in {recent_sale.get('days_on_market', 0)} days
   • Listed at ${recent_sale.get('listing_price', 0):,}
   • {recent_sale.get('mileage', 0):,} miles, {recent_sale.get('condition', 'Unknown')} condition

📊 **Market Trends:**
   • Average days on market: {market_insights.get('avg_days_on_market', 7)} days
   • Price trend: {market_insights.get('price_trend', 'No recent data')}
   • {len(similar_listings)} similar successful sales in our database

💡 **Success Patterns:**
   • Cars with 8+ photos sell 40% faster
   • Well-maintained cars sell 40% faster
   • Automatic transmission preferred in your area
        """
        
        return insights.strip()
