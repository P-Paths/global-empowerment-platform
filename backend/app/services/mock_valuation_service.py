"""
Mock Valuation Service - Simulates KBB API responses for MVP testing
"""

import json
import random
from typing import Dict, Any, Optional
from datetime import datetime

class MockValuationService:
    """
    Mock service that simulates Kelley Blue Book and other valuation APIs
    Provides realistic pricing data for MVP testing
    """
    
    def __init__(self):
        # Base pricing data by make/model/year
        self.base_prices = {
            "Honda": {
                "Civic": {
                    2015: {"excellent": 12000, "good": 10500, "fair": 9000, "poor": 7500},
                    2016: {"excellent": 13500, "good": 12000, "fair": 10500, "poor": 9000},
                    2017: {"excellent": 15000, "good": 13500, "fair": 12000, "poor": 10500}
                },
                "CR-V": {
                    2014: {"excellent": 20000, "good": 17500, "fair": 15000, "poor": 12500},
                    2015: {"excellent": 22000, "good": 19500, "fair": 17000, "poor": 14500},
                    2016: {"excellent": 24000, "good": 21500, "fair": 19000, "poor": 16500}
                }
            },
            "Toyota": {
                "Camry": {
                    2018: {"excellent": 25000, "good": 22000, "fair": 19500, "poor": 17000},
                    2019: {"excellent": 27000, "good": 24000, "fair": 21500, "poor": 19000},
                    2020: {"excellent": 29000, "good": 26000, "fair": 23500, "poor": 21000}
                }
            },
            "Ford": {
                "F-150": {
                    2012: {"excellent": 18000, "good": 14500, "fair": 12000, "poor": 9500},
                    2013: {"excellent": 20000, "good": 16500, "fair": 14000, "poor": 11500},
                    2014: {"excellent": 22000, "good": 18500, "fair": 16000, "poor": 13500}
                }
            },
            "BMW": {
                "3 Series": {
                    2016: {"excellent": 32000, "good": 26500, "fair": 22000, "poor": 17500},
                    2017: {"excellent": 35000, "good": 29500, "fair": 25000, "poor": 20500},
                    2018: {"excellent": 38000, "good": 32500, "fair": 28000, "poor": 23500}
                }
            }
        }
        
        # Mileage adjustment factors
        self.mileage_adjustments = {
            "low": 1.1,      # Under 50k miles
            "medium": 1.0,   # 50k-100k miles
            "high": 0.9,     # 100k-150k miles
            "very_high": 0.8 # Over 150k miles
        }
        
        # Regional price adjustments
        self.regional_adjustments = {
            "Austin, TX": 1.05,
            "Dallas, TX": 1.0,
            "Houston, TX": 0.95,
            "San Antonio, TX": 0.98,
            "Fort Worth, TX": 0.97
        }
    
    def get_valuation(self, car_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Get comprehensive valuation for a car
        
        Args:
            car_data: Car information including make, model, year, mileage, condition, location
            
        Returns:
            Comprehensive valuation data
        """
        try:
            make = car_data.get("make", "")
            model = car_data.get("model", "")
            year = car_data.get("year", 0)
            mileage = car_data.get("mileage", 0)
            condition = car_data.get("condition", "good")
            location = car_data.get("location", "United States")
            
            # Get base price
            base_price = self._get_base_price(make, model, year, condition)
            if not base_price:
                return self._create_error_response("Unable to determine base price")
            
            # Apply mileage adjustment
            mileage_factor = self._get_mileage_factor(mileage)
            adjusted_price = base_price * mileage_factor
            
            # Apply regional adjustment
            regional_factor = self.regional_adjustments.get(location, 1.0)
            final_price = adjusted_price * regional_factor
            
            # Calculate profit potential
            asking_price = car_data.get("price", 0)
            potential_profit = final_price - asking_price if asking_price > 0 else 0
            
            # Determine deal score
            deal_score = self._calculate_deal_score(asking_price, final_price, car_data)
            
            # Risk assessment
            risk_score = self._assess_risk(car_data)
            
            return {
                "success": True,
                "valuation": {
                    "estimated_market_value": round(final_price),
                    "base_price": round(base_price),
                    "mileage_adjustment": round(base_price * (mileage_factor - 1)),
                    "regional_adjustment": round(adjusted_price * (regional_factor - 1)),
                    "asking_price": asking_price,
                    "potential_profit": round(potential_profit),
                    "profit_margin": round((potential_profit / asking_price * 100) if asking_price > 0 else 0, 1)
                },
                "analysis": {
                    "deal_score": deal_score,
                    "risk_score": risk_score,
                    "recommendation": self._get_recommendation(deal_score, risk_score),
                    "confidence": self._get_confidence_score(car_data)
                },
                "market_data": {
                    "comparable_listings": self._get_comparable_listings(car_data),
                    "market_trend": self._get_market_trend(make, model, year),
                    "seasonal_factor": self._get_seasonal_factor()
                },
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            return self._create_error_response(f"Valuation error: {str(e)}")
    
    def _get_base_price(self, make: str, model: str, year: int, condition: str) -> Optional[float]:
        """Get base price for the vehicle"""
        try:
            return self.base_prices.get(make, {}).get(model, {}).get(year, {}).get(condition)
        except:
            return None
    
    def _get_mileage_factor(self, mileage: int) -> float:
        """Get mileage adjustment factor"""
        if mileage < 50000:
            return self.mileage_adjustments["low"]
        elif mileage < 100000:
            return self.mileage_adjustments["medium"]
        elif mileage < 150000:
            return self.mileage_adjustments["high"]
        else:
            return self.mileage_adjustments["very_high"]
    
    def _calculate_deal_score(self, asking_price: float, market_value: float, car_data: Dict[str, Any]) -> float:
        """Calculate deal score (0-1) based on multiple factors"""
        if asking_price <= 0 or market_value <= 0:
            return 0.0
        
        # Profit margin factor (40% weight)
        profit_margin = (market_value - asking_price) / asking_price
        profit_score = min(profit_margin * 2, 1.0)  # Cap at 1.0
        
        # Seller motivation factor (30% weight)
        motivation = car_data.get("seller_motivation", "medium")
        motivation_scores = {"high": 0.9, "medium": 0.6, "low": 0.3}
        motivation_score = motivation_scores.get(motivation, 0.5)
        
        # Condition factor (20% weight)
        condition = car_data.get("condition", "good")
        condition_scores = {"excellent": 0.9, "good": 0.7, "fair": 0.5, "poor": 0.3}
        condition_score = condition_scores.get(condition, 0.5)
        
        # Urgency factor (10% weight)
        urgency_indicators = car_data.get("urgency_indicators", [])
        urgency_score = min(len(urgency_indicators) * 0.2, 1.0)
        
        # Calculate weighted score
        final_score = (
            profit_score * 0.4 +
            motivation_score * 0.3 +
            condition_score * 0.2 +
            urgency_score * 0.1
        )
        
        return round(final_score, 2)
    
    def _assess_risk(self, car_data: Dict[str, Any]) -> float:
        """Assess risk score (0-1, lower is better)"""
        risk_factors = 0
        
        # High mileage risk
        mileage = car_data.get("mileage", 0)
        if mileage > 150000:
            risk_factors += 0.3
        elif mileage > 100000:
            risk_factors += 0.2
        
        # Age risk
        year = car_data.get("year", 0)
        current_year = datetime.now().year
        if current_year - year > 10:
            risk_factors += 0.2
        elif current_year - year > 5:
            risk_factors += 0.1
        
        # Condition risk
        condition = car_data.get("condition", "good")
        condition_risks = {"excellent": 0.0, "good": 0.1, "fair": 0.3, "poor": 0.5}
        risk_factors += condition_risks.get(condition, 0.2)
        
        # Luxury brand risk (higher repair costs)
        make = car_data.get("make", "")
        luxury_brands = ["BMW", "Mercedes-Benz", "Audi", "Lexus"]
        if make in luxury_brands:
            risk_factors += 0.2
        
        return min(risk_factors, 1.0)
    
    def _get_recommendation(self, deal_score: float, risk_score: float) -> str:
        """Get recommendation based on deal score and risk"""
        if deal_score >= 0.8 and risk_score <= 0.3:
            return "STRONG_BUY"
        elif deal_score >= 0.6 and risk_score <= 0.5:
            return "BUY"
        elif deal_score >= 0.4:
            return "CONSIDER"
        else:
            return "PASS"
    
    def _get_confidence_score(self, car_data: Dict[str, Any]) -> float:
        """Get confidence score for the valuation"""
        # Base confidence
        confidence = 0.7
        
        # Increase confidence for popular models
        make = car_data.get("make", "")
        model = car_data.get("model", "")
        popular_combinations = [
            ("Honda", "Civic"), ("Honda", "CR-V"), ("Toyota", "Camry"),
            ("Ford", "F-150"), ("BMW", "3 Series")
        ]
        if (make, model) in popular_combinations:
            confidence += 0.1
        
        # Increase confidence for recent years
        year = car_data.get("year", 0)
        current_year = datetime.now().year
        if current_year - year <= 5:
            confidence += 0.1
        
        return min(confidence, 0.95)
    
    def _get_comparable_listings(self, car_data: Dict[str, Any]) -> list:
        """Get mock comparable listings"""
        make = car_data.get("make", "")
        model = car_data.get("model", "")
        year = car_data.get("year", 0)
        
        # Generate mock comparables
        comparables = []
        for i in range(3):
            year_variation = random.randint(-2, 2)
            price_variation = random.uniform(0.8, 1.2)
            mileage_variation = random.uniform(0.7, 1.3)
            
            comparables.append({
                "year": year + year_variation,
                "price": round(car_data.get("price", 0) * price_variation),
                "mileage": round(car_data.get("mileage", 0) * mileage_variation),
                "location": random.choice(list(self.regional_adjustments.keys())),
                "condition": random.choice(["excellent", "good", "fair"])
            })
        
        return comparables
    
    def _get_market_trend(self, make: str, model: str, year: int) -> str:
        """Get market trend for the vehicle"""
        trends = ["stable", "increasing", "decreasing"]
        return random.choice(trends)
    
    def _get_seasonal_factor(self) -> float:
        """Get seasonal adjustment factor"""
        month = datetime.now().month
        # Summer months (6-8) typically have higher prices
        if month in [6, 7, 8]:
            return 1.05
        # Winter months (12-2) typically have lower prices
        elif month in [12, 1, 2]:
            return 0.95
        else:
            return 1.0
    
    def _create_error_response(self, error_message: str) -> Dict[str, Any]:
        """Create error response"""
        return {
            "success": False,
            "error": error_message,
            "timestamp": datetime.now().isoformat()
        }

# Global instance for easy access
mock_valuation_service = MockValuationService() 