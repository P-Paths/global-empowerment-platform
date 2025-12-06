"""
Pricing Strategy Agent - Generates 3-tier pricing strategy and FlipScore

This agent takes vehicle data and market intelligence to generate:
- Quick Sale price (sell fast)
- Market Price (balanced)
- Top Dollar price (premium)
- FlipScore (0-100 resale potential)
"""

from datetime import datetime
from typing import Dict, Any, List, Optional
from .base_agent import BaseAgent, AgentOutput
import logging
from app.utils.pricing_rules import (
    calculate_feature_bonus,
    calculate_mileage_penalty_percent,
    detect_trim_tier,
    format_trim_tier_label,
    get_reliability_tier,
    get_trim_adjustment_percent,
    normalize_title_status,
)

logger = logging.getLogger(__name__)


class PricingStrategyAgent(BaseAgent):
    """Pricing Strategy Agent - Generates pricing strategies and FlipScore"""
    
    def __init__(self, config=None):
        super().__init__("pricing_strategy_agent", config)
        
        # Base pricing multipliers for different strategies
        self.pricing_multipliers = {
            "quick_sale": 0.85,  # 15% below market for fast sale
            "market_price": 1.0,  # Market rate
            "top_dollar": 1.15   # 15% above market for premium
        }
        
        # Title status impact on pricing (Step 5: Rebuilt -30%, Salvage -47% to -50%)
        self.title_status_impact = {
            "clean": 1.0,
            "rebuilt": 0.70,   # Rebuilt title = -30% reduction
            "salvage": 0.515,  # Salvage title = -47% to -50% reduction (avg -48.5%)
            "junk": 0.3,       # 70% reduction
            "parts": 0.2       # 80% reduction
        }
        
        # Condition impact on pricing
        self.condition_impact = {
            "excellent": 1.1,   # 10% premium
            "good": 1.0,        # Market rate
            "fair": 0.85,       # 15% reduction
            "poor": 0.7         # 30% reduction
        }
    
    async def process(self, input_data: Dict[str, Any]) -> AgentOutput:
        """
        Generate pricing strategy and FlipScore
        
        Args:
            input_data: Dict containing:
                - vehicle_data: Dict (year, make, model, mileage, condition, title_status)
                - market_intelligence: Dict (market_comps, demand_analysis, price_trends)
                - user_goals: str (optional: 'quick_sale', 'max_profit', 'balanced')
        
        Returns:
            AgentOutput with pricing strategy and FlipScore
        """
        start_time = datetime.now()
        
        try:
            vehicle_data = input_data.get("vehicle_data", {})
            market_intelligence = input_data.get("market_intelligence", {})
            user_goals = input_data.get("user_goals", "balanced")
            
            if not vehicle_data:
                raise ValueError("No vehicle data provided")
            
            market_meta = {}
            if market_intelligence:
                pricing_analysis = market_intelligence.get("pricing_analysis", {})
                market_prices = pricing_analysis.get("market_prices", {})
                market_meta = {
                    "data_source": market_prices.get("data_source"),
                    "search_query": market_prices.get("search_query"),
                    "location": market_prices.get("location_used"),
                    "google_raw_price": market_prices.get("google_raw_price"),  # Raw Google price before adjustments
                }
            
            # Generate pricing strategy
            pricing_strategy = await self._generate_pricing_strategy(
                vehicle_data, market_intelligence, user_goals, market_meta
            )
            
            # Calculate FlipScore
            flip_score = await self._calculate_flip_score(
                vehicle_data, market_intelligence, pricing_strategy
            )
            
            processing_time = (datetime.now() - start_time).total_seconds()
            
            return AgentOutput(
                agent_name=self.name,
                timestamp=datetime.now(),
                success=True,
                data={
                    "pricing_strategy": pricing_strategy,
                    "flip_score": flip_score,
                    "recommendation": self._get_recommendation(flip_score, user_goals),
                    "processing_time": processing_time
                },
                confidence=0.9,
                processing_time=processing_time
            )
            
        except Exception as e:
            logger.error(f"Pricing strategy agent error: {e}")
            processing_time = (datetime.now() - start_time).total_seconds()
            
            return AgentOutput(
                agent_name=self.name,
                timestamp=datetime.now(),
                success=False,
                data={"error": str(e)},
                confidence=0.0,
                processing_time=processing_time,
                error_message=str(e)
            )
    
    async def _generate_pricing_strategy(
        self,
        vehicle_data: Dict,
        market_intelligence: Dict,
        user_goals: str,
        market_meta: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Generate 3-tier pricing strategy with detailed breakdown
        """
        # Get base market value
        base_value = self._get_base_market_value(vehicle_data, market_intelligence)
        
        # Calculate detailed adjustments
        adjustments = self._calculate_detailed_adjustments(base_value, vehicle_data, market_meta)
        
        # Apply adjustments for vehicle condition and title status
        adjusted_value = adjustments["final_adjusted_price"]
        
        # Generate 3 pricing tiers
        pricing_strategy = {
            "quick_sale": {
                "price": round(adjusted_value * self.pricing_multipliers["quick_sale"], 2),
                "rationale": "Priced 15% below market for quick sale (2-4 weeks)",
                "time_to_sell": "2-4 weeks",
                "risk_level": "low"
            },
            "market_price": {
                "price": round(adjusted_value * self.pricing_multipliers["market_price"], 2),
                "rationale": "Market rate pricing for balanced time-to-sale (4-8 weeks)",
                "time_to_sell": "4-8 weeks",
                "risk_level": "medium"
            },
            "top_dollar": {
                "price": round(adjusted_value * self.pricing_multipliers["top_dollar"], 2),
                "rationale": "Premium pricing for maximum profit (8-12 weeks)",
                "time_to_sell": "8-12 weeks",
                "risk_level": "high"
            },
            "base_market_value": base_value,
            "adjusted_value": adjusted_value,
            "pricing_factors": self._get_pricing_factors(vehicle_data, market_intelligence),
            "pricing_breakdown": adjustments  # Add detailed breakdown
        }
        
        return pricing_strategy
    
    def _get_base_market_value(self, vehicle_data: Dict, market_intelligence: Dict) -> float:
        """
        Get base market value from market intelligence
        """
        # First, try to get market average from pricing analysis
        pricing_analysis = market_intelligence.get("pricing_analysis", {})
        market_prices = pricing_analysis.get("market_prices", {})
        market_average = market_prices.get("market_average", 0)
        data_source = market_prices.get("data_source", "unknown")
        
        if market_average > 0:
            print(f"[PRICING-STRATEGY] ✅ Using Google Search market_average: ${market_average:,.0f} (source: {data_source})")
            print(f"[PRICING-STRATEGY] 📊 DEBUG: Full market_prices dict: {market_prices}")
            return float(market_average)
        else:
            print(f"[PRICING-STRATEGY] ⚠️  WARNING: market_average is 0 or missing! Data source: {data_source}")
            print(f"[PRICING-STRATEGY] ⚠️  This means Google Search failed or returned no results - will use fallback")
            print(f"[PRICING-STRATEGY] 📊 DEBUG: Full market_prices dict: {market_prices}")
            print(f"[PRICING-STRATEGY] 📊 DEBUG: Full pricing_analysis dict keys: {list(pricing_analysis.keys())}")
        
        # Use market comps if available
        market_comps = market_intelligence.get("market_comps", [])
        if market_comps:
            # Calculate average from comps
            prices = [comp.get("price", 0) for comp in market_comps if comp.get("price")]
            if prices:
                return sum(prices) / len(prices)
        
        # DO NOT use user's price - ONLY use real market data
        # Fallback: Use realistic pricing based on year, make, model, and mileage
        year = vehicle_data.get("year", 2020)
        make_raw = vehicle_data.get("make")
        make = (str(make_raw).lower() if make_raw and isinstance(make_raw, str) else "")
        model_raw = vehicle_data.get("model")
        model = (str(model_raw).lower() if model_raw and isinstance(model_raw, str) else "")
        mileage = vehicle_data.get("mileage", 100000)
        trim_raw = vehicle_data.get("trim")
        trim = (str(trim_raw).lower() if trim_raw and isinstance(trim_raw, str) else "")
        
        # Realistic base pricing logic
        base_price = 25000  # More realistic default for modern vehicles
        
        # Adjust for year (newer = more valuable)
        current_year = 2024  # Adjust if needed
        year_factor = 1.0 + (year - 2020) * 0.08  # $800 per year for newer cars
        
        # Adjust for mileage (lower = more valuable)
        mileage_factor = 1.0 - max(0, (mileage - 50000) / 100000 * 0.25)  # Up to 25% reduction for high mileage
        
        # Adjust for make/model (Jeep Wrangler holds value well)
        make_model_factor = 1.0
        if "jeep" in make and "wrangler" in model:
            make_model_factor = 1.4  # Wranglers hold value very well
            if "rubicon" in trim:
                make_model_factor = 1.6  # Rubicon is premium trim
        elif make in ['bmw', 'mercedes', 'audi', 'lexus', 'acura', 'infiniti']:
            make_model_factor = 1.3  # Premium brands
        elif make in ['honda', 'toyota']:
            make_model_factor = 1.1  # Reliable brands hold value
        
        calculated_price = base_price * year_factor * mileage_factor * make_model_factor
        
        # Ensure minimum reasonable price
        return max(calculated_price, 10000)
    
    def _apply_vehicle_adjustments(
        self,
        base_value: float,
        vehicle_data: Dict,
        market_meta: Optional[Dict[str, Any]] = None,
    ) -> float:
        """
        Apply adjustments for vehicle condition and title status
        """
        adjustments = self._calculate_detailed_adjustments(base_value, vehicle_data, market_meta)
        return adjustments["final_adjusted_price"]
    
    def _calculate_detailed_adjustments(
        self,
        base_value: float,
        vehicle_data: Dict,
        market_meta: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Calculate detailed pricing adjustments with NEW SIMPLIFIED LOGIC:
        - Rebuilt title: 30% reduction
        - Salvage: 40% reduction
        - Flat mileage deductions (not percentages)
        - Year mismatch: -$300 per year (up to 2 years)
        - Price floors based on vehicle year
        """
        # Get raw Google price from market_meta if available, otherwise use base_value
        raw_google_price = (market_meta or {}).get("google_raw_price", base_value)
        
        breakdown = {
            "base_market_value": round(base_value, 2),
            "raw_google_price": round(raw_google_price, 2),  # Store raw Google price before any adjustments
            "title_status_adjustment": 0,
            "title_status_percent": 0,
            "mileage_adjustment": 0,
            "mileage_deduction": 0,
            "year_mismatch_adjustment": 0,
            "year_mismatch_deduction": 0,
            "price_floor_applied": 0,
            "final_adjusted_price": base_value,
            "market_data_source": (market_meta or {}).get("data_source"),
            "market_search_query": (market_meta or {}).get("search_query"),
            "market_location": (market_meta or {}).get("location"),
        }
        
        current_price = base_value
        
        print(f"[PRICING-STRATEGY] 💰 Starting pricing calculation:")
        print(f"[PRICING-STRATEGY]   Base value (from Google Search): ${base_value:,.0f}")
        print(f"[PRICING-STRATEGY]   Vehicle: {vehicle_data.get('year')} {vehicle_data.get('make')} {vehicle_data.get('model')}")
        print(f"[PRICING-STRATEGY]   Mileage: {vehicle_data.get('mileage'):,} miles" if vehicle_data.get('mileage') else "   Mileage: Unknown")
        print(f"[PRICING-STRATEGY]   Title Status: {vehicle_data.get('title_status') or vehicle_data.get('title') or 'clean'}")
        print(f"[PRICING-STRATEGY]   Location from vehicle_data: {vehicle_data.get('location')}")
        print(f"[PRICING-STRATEGY]   Location from market_meta: {market_meta.get('location') if market_meta else 'None'}")
        
        # STEP 0: Market Reality Adjustment - REDUCED/REMOVED
        # Google Search Grounding now returns ACTUAL listing prices, not theoretical KBB values
        # We should trust Google's results more - only apply small adjustment if needed
        location = vehicle_data.get("location") or (market_meta.get("location") if market_meta else "") or ""
        location_lower = location.lower() if location else ""
        is_detroit_michigan = any(term in location_lower for term in ["detroit", "michigan", "mi", "flint", "redford", "warren", "troy", "dearborn", "48239"])
        
        print(f"[PRICING-STRATEGY]   Location check: '{location}' -> is_detroit_michigan: {is_detroit_michigan}")
        print(f"[PRICING-STRATEGY]   Raw Google Search price: ${base_value:,.0f}")
        
        # REDUCED: Only apply 5% adjustment (down from 17.5%) since Google Search returns real listing prices
        # This accounts for slight differences between Google's aggregated data and actual marketplace prices
        if is_detroit_michigan:
            # Reduced from 17.5% to 5% - Google Search is more accurate now
            market_reality_adjustment = current_price * 0.05  # 5% reduction (much smaller)
            current_price -= market_reality_adjustment
            breakdown["market_reality_adjustment"] = round(-market_reality_adjustment, 2)
            breakdown["market_reality_percent"] = -5.0
            print(f"[PRICING-STRATEGY] 🏭 Market Reality Adjustment (Detroit/Michigan): -5% = -${market_reality_adjustment:,.0f} (REDUCED from 17.5%)")
            print(f"[PRICING-STRATEGY] 📊 Google Search price ${base_value:,.0f} → After small adjustment ${current_price:,.0f}")
        else:
            breakdown["market_reality_adjustment"] = 0
            breakdown["market_reality_percent"] = 0
            print(f"[PRICING-STRATEGY] 📊 No market reality adjustment (location: {location})")
        
        # STEP 1: Apply title status adjustment (CONDITIONAL - based on damage severity)
        raw_title_status = vehicle_data.get("title_status") or vehicle_data.get("title")
        title_status = normalize_title_status(raw_title_status)
        breakdown["title_status_label"] = title_status.title()
        
        # Check if Google Search query already included "rebuilt title" - if so, Google may have already priced it lower
        search_query = (market_meta or {}).get("search_query", "").lower() if market_meta else ""
        google_already_accounted_for_title = "rebuilt" in search_query or "salvage" in search_query
        
        if title_status == "rebuilt":
            # Check damage description to determine severity
            about_vehicle = (vehicle_data.get("about_vehicle") or "").lower()
            title_rebuild_reason = (vehicle_data.get("title_rebuild_reason") or "").lower()
            damage_text = (about_vehicle + " " + title_rebuild_reason).lower()
            
            # Minor damage keywords (bumper, cosmetic, etc.) = smaller penalty
            minor_damage_keywords = [
                "bumper", "fender", "cosmetic", "minor", "small", "scratch", "dent",
                "rear bumper", "front bumper", "back bumper", "side panel", "door"
            ]
            
            # Major damage keywords = larger penalty
            major_damage_keywords = [
                "frame", "structural", "airbag", "totaled", "flood", "fire", "severe",
                "engine", "transmission", "suspension", "major accident"
            ]
            
            has_minor_damage = any(keyword in damage_text for keyword in minor_damage_keywords)
            has_major_damage = any(keyword in damage_text for keyword in major_damage_keywords)
            
            # Determine penalty percentage
            if google_already_accounted_for_title:
                # Google Search already included "rebuilt title" in query - Google may have priced it lower
                # Apply smaller penalty (10-15%) since Google already accounted for it
                if has_minor_damage:
                    title_percent = -10.0  # Only 10% penalty for minor damage when Google already accounted for it
                elif has_major_damage:
                    title_percent = -20.0  # 20% for major damage
                else:
                    title_percent = -15.0  # Default 15% when Google already accounted for it
                print(f"[PRICING-STRATEGY] 🏷️  Rebuilt title (Google already accounted): {title_percent:.0f}% penalty")
            else:
                # Google Search didn't include rebuilt title - apply standard penalty
                if has_minor_damage:
                    title_percent = -15.0  # 15% for minor damage (bumper, cosmetic)
                elif has_major_damage:
                    title_percent = -25.0  # 25% for major damage
                else:
                    title_percent = -20.0  # Default 20% for rebuilt title
            
            title_deduction = current_price * (abs(title_percent) / 100)
            current_price -= title_deduction
            breakdown["title_status_adjustment"] = round(-title_deduction, 2)
            breakdown["title_status_percent"] = title_percent
            
            damage_type = "minor" if has_minor_damage else ("major" if has_major_damage else "unknown")
            print(f"[PRICING-STRATEGY] 🏷️  Rebuilt title ({damage_type} damage): {title_percent:.0f}% = -${title_deduction:,.0f}")
            if google_already_accounted_for_title:
                print(f"[PRICING-STRATEGY] 📊 Note: Google Search query included 'rebuilt title' - may have already priced it lower")
        elif title_status == "salvage":
            title_deduction = current_price * 0.40  # 40% reduction
            current_price -= title_deduction
            breakdown["title_status_adjustment"] = round(-title_deduction, 2)
            breakdown["title_status_percent"] = -40.0
            print(f"[PRICING-STRATEGY] 🏷️  Salvage title: -40% = -${title_deduction:,.0f}")
        else:
            breakdown["title_status_adjustment"] = 0
            breakdown["title_status_percent"] = 0
        
        # STEP 2: Apply flat mileage deductions (NOT percentages)
        mileage_value = vehicle_data.get("mileage")
        if mileage_value:
            mileage_deduction = 0
            if mileage_value >= 220000:
                mileage_deduction = 1500
                breakdown["mileage_range_label"] = "Over 220K miles"
            elif mileage_value >= 180000:
                mileage_deduction = 1000
                breakdown["mileage_range_label"] = "180K-220K miles"
            elif mileage_value >= 150000:
                mileage_deduction = 600
                breakdown["mileage_range_label"] = "150K-180K miles"
            elif mileage_value >= 120000:
                mileage_deduction = 300
                breakdown["mileage_range_label"] = "120K-150K miles"
            else:
                breakdown["mileage_range_label"] = f"Under 120K miles ({mileage_value:,})"
            
            if mileage_deduction > 0:
                current_price -= mileage_deduction
                breakdown["mileage_adjustment"] = round(-mileage_deduction, 2)
                breakdown["mileage_deduction"] = mileage_deduction
                print(f"[PRICING-STRATEGY] 📉 Mileage {breakdown['mileage_range_label']}: -${mileage_deduction:,}")
            else:
                breakdown["mileage_adjustment"] = 0
                breakdown["mileage_deduction"] = 0
        else:
            breakdown["mileage_adjustment"] = 0
            breakdown["mileage_deduction"] = 0
            breakdown["mileage_range_label"] = "Unknown mileage"
        
        # STEP 3: Apply year mismatch deduction (if Google result year doesn't match input year)
        # Check if market_meta contains year information from Google Search
        vehicle_year = vehicle_data.get("year")
        if vehicle_year and market_meta:
            # Try to extract year from search query or other metadata
            # For now, we'll skip this as it requires parsing the Google Search result
            # This can be enhanced later if needed
            breakdown["year_mismatch_adjustment"] = 0
            breakdown["year_mismatch_deduction"] = 0
        else:
            breakdown["year_mismatch_adjustment"] = 0
            breakdown["year_mismatch_deduction"] = 0
        
        # STEP 4: Apply price floors ONLY as safety net for clearly wrong Google Search results
        # We trust Google Search - floors only prevent junk vehicle pricing when Google returns suspiciously low values
        # Example: Google says $500 for a 2015 car = clearly wrong, apply floor
        # Example: Google says $3,500 for a 2010 Beetle = legitimate, trust it
        if vehicle_year:
            # Only apply floor if Google Search returned a value that's suspiciously low
            # This is a safety net, not a blanket minimum
            suspiciously_low = False
            if vehicle_year >= 2010 and current_price < 2000:
                # A 2010+ car worth less than $2,000 is suspicious (unless severe damage)
                suspiciously_low = True
            elif vehicle_year >= 2005 and current_price < 1500:
                # A 2005+ car worth less than $1,500 is suspicious
                suspiciously_low = True
            elif vehicle_year >= 2000 and current_price < 1000:
                # A 2000+ car worth less than $1,000 is suspicious
                suspiciously_low = True
            
            if suspiciously_low:
                # Check if user entered severe conditions that would justify the low price
                condition_value = vehicle_data.get("condition", "").lower()
                about_vehicle = (vehicle_data.get("about_vehicle") or "").lower()
                severe_conditions = any(keyword in (condition_value + " " + about_vehicle) for keyword in [
                    "engine failure", "transmission failure", "severe damage", "no title", "blown engine",
                    "blown transmission", "totaled", "parts only", "junk", "salvage", "non-running"
                ])
                
                if not severe_conditions:
                    # Google Search returned suspiciously low value - apply minimal safety floor
                    # But use a very low floor (just to prevent $500 pricing errors)
                    safety_floor = 2000 if vehicle_year >= 2010 else (1500 if vehicle_year >= 2005 else 1000)
                    if current_price < safety_floor:
                        price_floor_applied = safety_floor - current_price
                        current_price = safety_floor
                        breakdown["price_floor_applied"] = round(price_floor_applied, 2)
                        print(f"[PRICING-STRATEGY] 🛡️  Safety floor applied: ${current_price:,.0f} (Google returned suspiciously low ${current_price - price_floor_applied:,.0f} for {vehicle_year} vehicle)")
                else:
                    breakdown["price_floor_applied"] = 0
                    print(f"[PRICING-STRATEGY] ✅ Low price accepted due to severe conditions")
            else:
                breakdown["price_floor_applied"] = 0
                # Trust Google Search - no floor needed
        else:
            breakdown["price_floor_applied"] = 0
        
        breakdown["final_adjusted_price"] = round(current_price, 2)
        
        print(f"[PRICING-STRATEGY] 💰 Final calculation summary:")
        print(f"[PRICING-STRATEGY]   Base (Google Search): ${base_value:,.0f}")
        print(f"[PRICING-STRATEGY]   After market reality adj: ${base_value + breakdown.get('market_reality_adjustment', 0):,.0f}")
        print(f"[PRICING-STRATEGY]   Market reality adj: ${breakdown.get('market_reality_adjustment', 0):,.0f} ({breakdown.get('market_reality_percent', 0):.1f}%)")
        print(f"[PRICING-STRATEGY]   Title status adj: ${breakdown.get('title_status_adjustment', 0):,.0f} ({breakdown.get('title_status_percent', 0):.1f}%)")
        print(f"[PRICING-STRATEGY]   Mileage adj: ${breakdown.get('mileage_adjustment', 0):,.0f} ({breakdown.get('mileage_range_label', 'N/A')})")
        print(f"[PRICING-STRATEGY]   Price floor applied: ${breakdown.get('price_floor_applied', 0):,.0f}")
        print(f"[PRICING-STRATEGY]   Final adjusted price: ${current_price:,.0f}")
        print(f"[PRICING-STRATEGY] 📊 STEP-BY-STEP CALCULATION:")
        step1 = base_value
        print(f"[PRICING-STRATEGY]   Step 1 - Base value: ${step1:,.0f}")
        step2 = step1 + breakdown.get('market_reality_adjustment', 0)
        print(f"[PRICING-STRATEGY]   Step 2 - After market reality: ${step2:,.0f}")
        step3 = step2 + breakdown.get('title_status_adjustment', 0)
        print(f"[PRICING-STRATEGY]   Step 3 - After title status: ${step3:,.0f}")
        step4 = step3 + breakdown.get('mileage_adjustment', 0)
        print(f"[PRICING-STRATEGY]   Step 4 - After mileage: ${step4:,.0f}")
        if breakdown.get('price_floor_applied', 0) > 0:
            step5 = step4 + breakdown.get('price_floor_applied', 0)
            print(f"[PRICING-STRATEGY]   Step 5 - After price floor: ${step5:,.0f}")
        print(f"[PRICING-STRATEGY]   FINAL: ${current_price:,.0f}")
        
        return breakdown
    
    def _get_pricing_factors(self, vehicle_data: Dict, market_intelligence: Dict) -> Dict[str, Any]:
        """
        Get factors that influenced pricing
        """
        title_status_raw = vehicle_data.get("title_status")
        title_status_safe = (str(title_status_raw).lower() if title_status_raw and isinstance(title_status_raw, str) else "clean")
        condition_raw = vehicle_data.get("condition")
        condition_safe = (str(condition_raw).lower() if condition_raw and isinstance(condition_raw, str) else "good")
        factors = {
            "title_status_impact": self.title_status_impact.get(title_status_safe, 1.0),
            "condition_impact": self.condition_impact.get(condition_safe, 1.0),
            "market_demand": market_intelligence.get("demand_analysis", {}).get("demand_level", "medium"),
            "price_trend": market_intelligence.get("price_trends", {}).get("trend", "stable"),
            "competition": len(market_intelligence.get("market_comps", []))
        }
        
        return factors
    
    def _apply_midwest_discount(self, price: float, make: str, model: str, mileage: Optional[int], location: str) -> float:
        """
        Apply Detroit/Michigan Midwest discount curve to market prices (Step 6).
        Applied AFTER all other adjustments (trim, mileage, title).
        
        Discounts:
        - Sedans: -15% to -20% (average -17.5%)
        - Coupes: -10%
        - SUVs/Trucks: -5% to -10% (average -7.5%)
        - Luxury brands: -20% to -30% (average -25%)
        - High mileage (>150k): additional -3% to -7%
        """
        location_lower = (location or "").lower()
        is_detroit_michigan = any(term in location_lower for term in ["detroit", "michigan", "mi", "flint", "redford", "warren", "troy", "dearborn"])
        
        if not is_detroit_michigan:
            return price  # No discount for non-Midwest locations
        
        make_lower = (make or "").lower()
        model_lower = (model or "").lower()
        
        # Determine vehicle type and base discount
        base_discount = 0.0
        
        # Luxury brands: -20% to -30% (average -25%)
        luxury_brands = ["bmw", "mercedes", "mercedes-benz", "audi", "lexus", "infiniti", "acura", "cadillac", "lincoln", "porsche", "jaguar", "land rover"]
        if any(brand in make_lower for brand in luxury_brands):
            base_discount = 0.25  # Average -25% for luxury
        # SUVs/Trucks: -5% to -10% (average -7.5%)
        elif any(term in model_lower for term in ["truck", "pickup", "f-150", "f150", "silverado", "ram", "tundra", "tacoma"]):
            base_discount = 0.075  # Average -7.5% for trucks
        elif any(term in model_lower for term in ["suv", "explorer", "escape", "cr-v", "rav4", "highlander", "pilot", "pathfinder", "tahoe", "suburban", "yukon", "escalade"]):
            base_discount = 0.075  # Average -7.5% for SUVs
        # Coupes: -10%
        elif any(term in model_lower for term in ["coupe", "camaro", "mustang", "challenger", "charger"]):
            base_discount = 0.10
        # Sedans: -15% to -20% (average -17.5%)
        else:
            base_discount = 0.175  # Average -17.5% for sedans
        
        # High mileage additional discount: -3% to -7%
        mileage_discount = 0.0
        if mileage and mileage > 150000:
            # Scale from -3% at 150k to -7% at 200k+
            mileage_discount = min(0.07, 0.03 + ((mileage - 150000) / 50000) * 0.04)
        
        total_discount = base_discount + mileage_discount
        discounted_price = price * (1 - total_discount)
        
        print(f"[PRICING-STRATEGY] 🏭 Midwest discount applied (Step 6 - LAST): {make} {model} in {location}")
        print(f"[PRICING-STRATEGY]   Base discount: -{base_discount*100:.1f}% ({'luxury' if any(brand in make_lower for brand in luxury_brands) else 'truck/suv' if base_discount == 0.075 else 'coupe' if base_discount == 0.10 else 'sedan'})")
        if mileage_discount > 0:
            print(f"[PRICING-STRATEGY]   High mileage discount: -{mileage_discount*100:.1f}% ({mileage:,} miles)")
        print(f"[PRICING-STRATEGY]   Total discount: -{total_discount*100:.1f}%")
        print(f"[PRICING-STRATEGY]   Price: ${price:,.0f} → ${discounted_price:,.0f}")
        
        return discounted_price
    
    async def _calculate_flip_score(self, vehicle_data: Dict, market_intelligence: Dict, pricing_strategy: Dict) -> Dict[str, Any]:
        """
        Calculate FlipScore (0-100) and rationale
        """
        score = 50  # Base score
        factors = []
        
        # Title status impact
        title_status = (vehicle_data.get("title_status") or "clean").lower()
        if title_status == "clean":
            score += 20
            factors.append("Clean title (+20 points)")
        elif title_status == "rebuilt":
            score += 10
            factors.append("Rebuilt title (+10 points)")
        elif title_status == "salvage":
            score -= 20
            factors.append("Salvage title (-20 points)")
        else:
            score -= 30
            factors.append(f"{title_status.title()} title (-30 points)")
        
        # Condition impact
        condition_value = vehicle_data.get("condition")
        condition = (str(condition_value) if condition_value and isinstance(condition_value, str) else "good").lower()
        if condition == "excellent":
            score += 15
            factors.append("Excellent condition (+15 points)")
        elif condition == "good":
            score += 10
            factors.append("Good condition (+10 points)")
        elif condition == "fair":
            score += 5
            factors.append("Fair condition (+5 points)")
        elif condition == "poor":
            score -= 15
            factors.append("Poor condition (-15 points)")
        
        # Mileage impact
        mileage = vehicle_data.get("mileage", 100000)
        if mileage < 50000:
            score += 15
            factors.append("Low mileage (+15 points)")
        elif mileage < 100000:
            score += 10
            factors.append("Average mileage (+10 points)")
        elif mileage < 150000:
            score += 5
            factors.append("High mileage (+5 points)")
        else:
            score -= 10
            factors.append("Very high mileage (-10 points)")
        
        # Market demand impact
        demand_level = market_intelligence.get("demand_analysis", {}).get("demand_level", "medium")
        if demand_level == "high":
            score += 10
            factors.append("High market demand (+10 points)")
        elif demand_level == "medium":
            score += 5
            factors.append("Medium market demand (+5 points)")
        else:
            score -= 5
            factors.append("Low market demand (-5 points)")
        
        # Price trend impact
        price_trend = market_intelligence.get("price_trends", {}).get("trend", "stable")
        if price_trend == "increasing":
            score += 10
            factors.append("Rising prices (+10 points)")
        elif price_trend == "stable":
            score += 5
            factors.append("Stable prices (+5 points)")
        else:
            score -= 5
            factors.append("Falling prices (-5 points)")
        
        # Ensure score is between 0 and 100
        score = max(0, min(100, score))
        
        # Determine recommendation
        if score >= 80:
            recommendation = "Excellent flip candidate"
        elif score >= 60:
            recommendation = "Good flip candidate"
        elif score >= 40:
            recommendation = "Fair flip candidate"
        else:
            recommendation = "Poor flip candidate"
        
        return {
            "score": score,
            "factors": factors,
            "recommendation": recommendation,
            "confidence": 0.85
        }
    
    def _get_recommendation(self, flip_score: Dict, user_goals: str) -> str:
        """
        Get pricing recommendation based on FlipScore and user goals
        """
        score = flip_score.get("score", 50)
        
        if user_goals == "quick_sale":
            return "Use Quick Sale pricing for fast turnaround"
        elif user_goals == "max_profit":
            if score >= 70:
                return "Use Top Dollar pricing - high FlipScore supports premium pricing"
            else:
                return "Use Market Price pricing - moderate FlipScore suggests balanced approach"
        else:  # balanced
            if score >= 80:
                return "Use Top Dollar pricing - excellent FlipScore"
            elif score >= 60:
                return "Use Market Price pricing - good FlipScore"
            else:
                return "Use Quick Sale pricing - lower FlipScore suggests faster sale"
    
    def get_capabilities(self) -> List[str]:
        """Return list of capabilities this agent provides"""
        return [
            "Generate 3-tier pricing strategy (Quick Sale, Market Price, Top Dollar)",
            "Calculate FlipScore (0-100 resale potential)",
            "Apply vehicle condition and title status adjustments",
            "Consider market demand and price trends",
            "Provide pricing rationale for each tier",
            "Estimate time-to-sell for each pricing strategy",
            "Assess risk levels for different pricing approaches",
            "Generate personalized recommendations based on user goals"
        ]
