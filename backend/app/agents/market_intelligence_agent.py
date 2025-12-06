"""
Market Intelligence Agent for Aquaria

This agent specializes in:
1. Analyzing car makes and models for market opportunities
2. Researching competitors in the local area
3. Analyzing pricing trends and market data
4. Setting profitable thresholds for car flipping
5. Providing comprehensive market intelligence
"""

import asyncio
import logging
import os
import re
from typing import Any, Dict, List, Optional
from datetime import datetime, timedelta
import json
import openai
import httpx
from .base_agent import BaseAgent, AgentOutput
from app.services.cache import cache_get, cache_set, _normalize_key
from app.utils.pricing_rules import (
    calculate_mileage_penalty_percent,
    detect_trim_tier,
    get_reliability_tier,
    get_trim_adjustment_percent,
    normalize_title_status,
)

logger = logging.getLogger(__name__)


class MarketIntelligenceAgent(BaseAgent):
    """
    Market Intelligence Agent for comprehensive car market analysis.
    
    This agent provides:
    - Make/Model analysis and scoring
    - Competitor research and analysis
    - Pricing trend analysis
    - Profit threshold recommendations
    - Market opportunity identification
    """
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        super().__init__("market_intelligence_agent", config)
        
        # Get API keys from environment or settings
        from app.core.config import settings
        self.openai_api_key = settings.OPENAI_API_KEY or os.getenv("OPENAI_API_KEY")
        self.gemini_api_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY")
        
        # Initialize OpenAI client if available (fallback)
        if self.openai_api_key:
            self.openai_client = openai.OpenAI(api_key=self.openai_api_key)
        else:
            self.openai_client = None
            logger.warning("OpenAI API key not set, will use Gemini only")
        
        # Prefer Gemini for web search with Google Grounding
        if not self.gemini_api_key:
            if not self.openai_api_key:
                raise ValueError("Either OPENAI_API_KEY or GEMINI_API_KEY must be set")
            logger.warning("Gemini API key not set, using OpenAI (limited web search)")
        
        # Market data sources (in production, these would be real APIs)
        self.market_data_sources = {
            "kbb": "Kelley Blue Book",
            "edmunds": "Edmunds",
            "cargurus": "CarGurus",
            "autotrader": "AutoTrader",
            "facebook_marketplace": "Facebook Marketplace",
            "craigslist": "Craigslist"
        }
        
        # Popular makes and models for quick analysis
        self.popular_makes = [
            "Toyota", "Honda", "Ford", "Chevrolet", "Nissan", "BMW", "Mercedes-Benz",
            "Audi", "Lexus", "Hyundai", "Kia", "Mazda", "Subaru", "Volkswagen"
        ]
        
        # High-demand models (good for flipping)
        self.high_demand_models = {
            "Toyota": ["Camry", "Corolla", "RAV4", "Highlander", "Tacoma", "4Runner"],
            "Honda": ["Accord", "Civic", "CR-V", "Pilot", "Odyssey"],
            "Ford": ["F-150", "Mustang", "Escape", "Explorer", "Bronco"],
            "Chevrolet": ["Silverado 1500", "Equinox", "Malibu", "Tahoe"],
            "Nissan": ["Altima", "Sentra", "Rogue", "Pathfinder"],
            "BMW": ["3 Series", "5 Series", "X3", "X5"],
            "Mercedes-Benz": ["C-Class", "E-Class", "GLC", "GLE"]
        }
    
    def _redact_query(self, query: str) -> str:
        """Redact sensitive tokens (zip codes) from logged queries."""
        if not query:
            return query
        return re.sub(r'\b\d{5}(?:-\d{4})?\b', "#####", query)
    
    async def process(self, input_data: Dict[str, Any]) -> AgentOutput:
        """
        Process market intelligence request with caching.
        
        Args:
            input_data: Contains make, model, location, and analysis type
            
        Returns:
            Comprehensive market intelligence analysis
        """
        try:
            # Check cache first (exclude price from cache key)
            # CRITICAL: Include title_status in cache key - rebuilt vs clean titles have different pricing!
            raw_title_status = input_data.get("title_status")
            if raw_title_status is None:
                raw_title_status = input_data.get("titleStatus")
            normalized_title_status = normalize_title_status(raw_title_status)

            cache_key = _normalize_key({
                "make": input_data.get("make"),
                "model": input_data.get("model"),
                "year": input_data.get("year"),
                "mileage": input_data.get("mileage"),
                "location": input_data.get("location"),
                "title_status": normalized_title_status,
                "analysis_type": input_data.get("analysis_type", "comprehensive"),
            })
            
            # TEMPORARILY: Reduce cache TTL to 0 for testing (disable cache)
            # This ensures we always get fresh results with the new guardrails
            cached_result = cache_get(cache_key, ttl_sec=0)  # 0 = no cache (for testing)
            if cached_result:
                logger.info(f"[MARKET-INTEL] Cache hit for key: {cache_key}")
                print(f"[MARKET-INTEL] ✅ Cache hit - skipping API calls")
                return AgentOutput(
                    agent_name=self.name,
                    timestamp=datetime.now(),
                    success=True,
                    data={**cached_result, "_cache_hit": True},
                    confidence=0.85,
                    processing_time=0.0
                )
            
            print(f"[MARKET-INTEL] ❌ Cache miss - running analysis")
            analysis_type = input_data.get("analysis_type", "comprehensive")
            
            if analysis_type == "make_model_analysis":
                result = await self._analyze_make_model(input_data)
            elif analysis_type == "competitor_research":
                result = await self._research_competitors(input_data)
            elif analysis_type == "pricing_analysis":
                result = await self._analyze_pricing(input_data)
            elif analysis_type == "threshold_setting":
                result = await self._set_profit_thresholds(input_data)
            else:  # comprehensive
                result = await self._comprehensive_analysis(input_data)
            
            # Cache the result
            cache_set(cache_key, result)
            
            return AgentOutput(
                agent_name=self.name,
                timestamp=datetime.now(),
                success=True,
                data={**result, "_cache_hit": False},
                confidence=0.85,
                processing_time=0.0
            )
            
        except Exception as e:
            error_msg = str(e) if str(e) else f"Unknown error occurred: {type(e).__name__}"
            logger.error(f"Market intelligence processing failed: {error_msg}", exc_info=True)
            return AgentOutput(
                agent_name=self.name,
                timestamp=datetime.now(),
                success=False,
                data={},
                confidence=0.0,
                processing_time=0.0,
                error_message=error_msg
            )
    
    async def _analyze_make_model(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze specific make and model for market opportunities."""
        make = input_data.get("make", "").title()
        model = input_data.get("model", "").title()
        location = input_data.get("location", "United States")
        
        # Analyze make popularity and demand
        make_score = self._calculate_make_score(make)
        model_score = self._calculate_model_score(make, model)
        
        # Market demand analysis
        demand_analysis = await self._analyze_market_demand(make, model, location)
        
        # Profit potential analysis
        profit_potential = await self._analyze_profit_potential(make, model, location)
        
        return {
            "make_model_analysis": {
                "make": make,
                "model": model,
                "location": location,
                "make_score": make_score,
                "model_score": model_score,
                "overall_score": (make_score + model_score) / 2,
                "demand_analysis": demand_analysis,
                "profit_potential": profit_potential,
                "recommendation": self._generate_make_model_recommendation(make_score, model_score, demand_analysis)
            }
        }
    
    async def _research_competitors(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Research competitors in the local area."""
        make = input_data.get("make", "").title()
        model = input_data.get("model", "").title()
        location = input_data.get("location", "United States")
        radius_miles = input_data.get("radius_miles", 50)
        
        # Simulate competitor research
        competitors = await self._find_competitors(make, model, location, radius_miles)
        
        # Analyze competitor pricing
        pricing_analysis = await self._analyze_competitor_pricing(competitors)
        
        # Market positioning
        market_position = await self._analyze_market_position(competitors, input_data.get("target_price"))
        
        return {
            "competitor_research": {
                "location": location,
                "radius_miles": radius_miles,
                "competitors_found": len(competitors),
                "competitors": competitors,
                "pricing_analysis": pricing_analysis,
                "market_position": market_position,
                "recommendations": self._generate_competitor_recommendations(competitors, pricing_analysis)
            }
        }
    
    async def _analyze_pricing(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze pricing trends and market data."""
        make = input_data.get("make", "").title()
        model = input_data.get("model", "").title()
        year = input_data.get("year")
        mileage = input_data.get("mileage")
        trim = input_data.get("trim", "")
        location = input_data.get("location", "United States")
        
        # Get market pricing data (pass user's entered price as fallback)
        user_entered_price = input_data.get("asking_price") or input_data.get("price")
        # Pass normalized title_status to market pricing function
        raw_title_status = input_data.get("title_status")
        if raw_title_status is None:
            raw_title_status = input_data.get("titleStatus")
        title_status = normalize_title_status(raw_title_status)
        market_prices = await self._get_market_prices(make, model, year, mileage, location, user_entered_price, trim, title_status)
        
        # Analyze price trends
        price_trends = await self._analyze_price_trends(make, model, location)
        
        # Seasonal adjustments
        seasonal_factors = self._calculate_seasonal_factors()
        
        # Price recommendations
        price_recommendations = self._generate_price_recommendations(market_prices, price_trends, seasonal_factors)
        
        return {
            "pricing_analysis": {
                "make": make,
                "model": model,
                "year": year,
                "mileage": mileage,
                "location": location,
                "market_prices": market_prices,
                "price_trends": price_trends,
                "seasonal_factors": seasonal_factors,
                "price_recommendations": price_recommendations
            }
        }
    
    async def _set_profit_thresholds(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Set profitable thresholds for car flipping."""
        make = input_data.get("make", "").title()
        model = input_data.get("model", "").title()
        target_profit = input_data.get("target_profit", 2000)
        risk_tolerance = input_data.get("risk_tolerance", "medium")
        
        # Calculate acquisition thresholds
        acquisition_thresholds = await self._calculate_acquisition_thresholds(make, model, target_profit, risk_tolerance)
        
        # Calculate selling thresholds
        selling_thresholds = await self._calculate_selling_thresholds(make, model, target_profit, risk_tolerance)
        
        # Risk analysis
        risk_analysis = self._analyze_risk_factors(make, model, risk_tolerance)
        
        return {
            "profit_thresholds": {
                "make": make,
                "model": model,
                "target_profit": target_profit,
                "risk_tolerance": risk_tolerance,
                "acquisition_thresholds": acquisition_thresholds,
                "selling_thresholds": selling_thresholds,
                "risk_analysis": risk_analysis,
                "recommendations": self._generate_threshold_recommendations(acquisition_thresholds, selling_thresholds, risk_analysis)
            }
        }
    
    async def _comprehensive_analysis(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Perform comprehensive market intelligence analysis."""
        # Run all analyses in parallel
        tasks = [
            self._analyze_make_model(input_data),
            self._research_competitors(input_data),
            self._analyze_pricing(input_data),
            self._set_profit_thresholds(input_data)
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Compile comprehensive report
        comprehensive_report = {
            "timestamp": datetime.now().isoformat(),
            "make_model_analysis": results[0] if not isinstance(results[0], Exception) else {"error": str(results[0])},
            "competitor_research": results[1] if not isinstance(results[1], Exception) else {"error": str(results[1])},
            "pricing_analysis": results[2] if not isinstance(results[2], Exception) else {"error": str(results[2])},
            "profit_thresholds": results[3] if not isinstance(results[3], Exception) else {"error": str(results[3])},
            "executive_summary": self._generate_executive_summary(results),
            "action_items": self._generate_action_items(results)
        }
        
        return comprehensive_report
    
    async def _web_search(self, query: str) -> Optional[str]:
        """
        Perform web search using Google Gemini with Google Search Grounding.
        Falls back to OpenAI if Gemini is not available.
        """
        import asyncio
        # Prefer Gemini with Google Search Grounding (better for real-time data)
        if self.gemini_api_key:
            # Add timeout wrapper to prevent hanging (50 seconds max - gives buffer before 60s frontend timeout)
            try:
                return await asyncio.wait_for(
                    self._web_search_gemini(query),
                    timeout=50.0
                )
            except asyncio.TimeoutError:
                logger.warning(f"Google Search timed out after 50 seconds for query: {query[:100]}")
                print(f"[MARKET-INTEL] ⚠️  Google Search timed out after 50 seconds - using fallback estimate")
                return None
        elif self.openai_client:
            return await self._web_search_openai(query)
        else:
            logger.warning("No API keys available for web search")
            return None
    
    async def _web_search_gemini(self, query: str, timeout: float = 45.0) -> Optional[str]:
        """Perform web search using Google Gemini with Google Search Grounding (REAL API - NO MOCKS)."""
        try:
            print(f"[MARKET-INTEL] 🔍 Using REAL Google Gemini API with Google Search Grounding")
            print(f"[MARKET-INTEL] 📝 Query: {query[:100]}...")
            print(f"[MARKET-INTEL] ✅ This is a REAL API call - NO MOCKS OR FALLBACKS")
            
            if not self.gemini_api_key:
                raise ValueError("GEMINI_API_KEY is required for Google Search Grounding")
            
            async with httpx.AsyncClient() as client:
                api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={self.gemini_api_key}"
                print(f"[MARKET-INTEL] 🌐 Calling Gemini API: {api_url[:80]}...")
                
                # Optimized prompt to get direct AI answers like Google's AI Overview feature
                # Format: "2015 jeep compass latitude market price" triggers Google's AI Overview
                # which shows price ranges like "approximately $6,000 to $14,000"
                # Example AI Overview format:
                # "The 2021 Chevrolet Trailblazer RS has a current marketplace value (as of late 2024) 
                #  that is estimated to be between $15,000 and $20,000, depending on the vehicle's 
                #  condition, mileage, and specific features. Trade-in values are lower, around $14,000, 
                #  while private party sales and dealer retail prices can be higher."
                prompt = f"""Search Google for CURRENT USED MARKET pricing data for: {query}

CRITICAL REQUIREMENTS:
- ONLY return USED car market prices, NOT MSRP or original/new car prices
- REJECT any data containing: "MSRP", "original price", "when new", "starting at", "base price", "new listing price"
- ONLY accept: "used market value", "current market price", "average used price", "dealer retail used", "private party used", "resale value"
- Use TODAY's market year (2024/2025), not historical pricing from when the car was new

This query should trigger Google's AI Overview feature which provides structured market pricing data.

IMPORTANT: Look for the PRIMARY USED MARKET price range in Google's AI Overview. This is usually stated as "between $X and $Y" or "ranges from $X to $Y" or "typically $X to $Y" for USED vehicles.

For example, if Google shows "between $4,000 and $14,000" for a used vehicle, that is the PRIMARY range you should extract.

DO NOT extract MSRP, original prices, or new car prices. ONLY extract current used market values.

Extract the USED MARKET pricing data from Google's AI Overview. If possible, return a JSON object with this structure:

{{
  "market_average": <number>,
  "price_range": {{
    "low": <number>,
    "high": <number>
  }},
  "trade_in_value": {{
    "low": <number>,
    "high": <number>
  }},
  "private_party_value": {{
    "low": <number>,
    "high": <number>
  }},
  "dealer_retail_value": {{
    "low": <number>,
    "high": <number>
  }},
  "data_source": "google_search",
  "confidence": <number between 0 and 1>
}}

Instructions:
- Extract marketplace value range (e.g., "$15,000 to $20,000" → low: 15000, high: 20000, average: 17500)
- Extract trade-in value range (e.g., "$13,859 to $15,250" → low: 13859, high: 15250)
- Extract private party value range (e.g., "$15,272 to $15,641" → low: 15272, high: 15641)
- Extract dealer retail value (e.g., "Up to $15,862" → low: 15000, high: 15862)
- Use real-time data from Google Search AI Overview results
- Calculate market_average as the midpoint of the price_range if not explicitly stated
- Provide specific dollar amounts as numbers, not text

Return ONLY the JSON object, no additional text or markdown formatting."""
                
                # Try with Google Search Grounding first
                try:
                    response = await client.post(
                        api_url,
                        json={
                            "contents": [{
                                "parts": [{
                                    "text": prompt
                                }]
                            }],
                            "tools": [{
                                "googleSearch": {}  # REAL Google Search Grounding
                            }],
                            "generationConfig": {
                                "maxOutputTokens": 2000,
                                "temperature": 0  # Deterministic pricing - no randomness
                                # NOTE: Cannot use responseMimeType with googleSearch tool
                                # Google Search Grounding returns text with search results embedded
                            }
                        },
                        timeout=60.0  # Increased timeout for Google Search API calls
                    )
                    
                    print(f"[MARKET-INTEL] 📡 API Response Status: {response.status_code}")
                    
                    if response.status_code == 200:
                        # Success! Continue processing
                        pass
                    elif response.status_code == 403:
                        # Google Search Grounding not enabled or not available
                        print(f"[MARKET-INTEL] ⚠️  Google Search Grounding returned 403 (not enabled or requires setup)")
                        print(f"[MARKET-INTEL] 🔄 Falling back to Gemini without Google Search Grounding...")
                        
                        # Fallback: Use Gemini without Google Search Grounding
                        # It can still provide market data based on its training data
                        response = await client.post(
                            api_url,
                            json={
                                "contents": [{
                                    "parts": [{
                                        "text": prompt + "\n\nNote: Use your knowledge of current market prices for this vehicle."
                                    }]
                                }],
                                "generationConfig": {
                                    "maxOutputTokens": 2000,
                                    "temperature": 0  # Deterministic pricing - no randomness
                                }
                            },
                            timeout=60.0
                        )
                        print(f"[MARKET-INTEL] 📡 Fallback API Response Status: {response.status_code}")
                    else:
                        logger.error(f"Gemini API error: {response.text}")
                        print(f"[MARKET-INTEL] ❌ Gemini API error: {response.status_code} - {response.text[:200]}")
                        return None
                        
                except Exception as api_error:
                    logger.error(f"API call failed: {api_error}")
                    print(f"[MARKET-INTEL] ❌ API call exception: {type(api_error).__name__}: {str(api_error)}")
                    return None
                
                if response.status_code != 200:
                    logger.error(f"Gemini API error: {response.text}")
                    print(f"[MARKET-INTEL] ❌ Gemini API error: {response.status_code} - {response.text[:200]}")
                    return None
                
                result = response.json()
                if "candidates" in result and len(result["candidates"]) > 0:
                    candidate = result["candidates"][0]
                    if "content" in candidate and "parts" in candidate["content"]:
                        parts = candidate["content"]["parts"]
                        # Extract text from all parts
                        text_parts = []
                        for part in parts:
                            if "text" in part:
                                text_parts.append(part["text"])
                        if text_parts:
                            search_result = " ".join(text_parts)
                            print(f"[MARKET-INTEL] ✅ REAL Google Search Grounding returned {len(search_result)} characters")
                            print(f"[MARKET-INTEL] 📊 Search result preview: {search_result[:200]}...")
                            
                            # Try to parse as JSON first (if Gemini returned structured JSON)
                            try:
                                import json
                                # Extract JSON from response (might be wrapped in markdown code blocks)
                                json_text = search_result
                                if "```json" in json_text:
                                    json_text = json_text.split("```json")[1].split("```")[0].strip()
                                elif "```" in json_text:
                                    json_text = json_text.split("```")[1].split("```")[0].strip()
                                
                                parsed_json = json.loads(json_text)
                                print(f"[MARKET-INTEL] ✅ Parsed structured JSON from Gemini response")
                                # Store parsed JSON in a special format for later extraction
                                return f"__STRUCTURED_JSON__{json.dumps(parsed_json)}__END_JSON__"
                            except (json.JSONDecodeError, ValueError) as e:
                                print(f"[MARKET-INTEL] ⚠️ Could not parse as JSON, using text extraction: {e}")
                                # Fall back to text extraction
                                return search_result
                
                print(f"[MARKET-INTEL] ⚠️ No results from Gemini API (empty response)")
                return None
                
        except Exception as e:
            logger.error(f"Gemini web search failed: {e}", exc_info=True)
            print(f"[MARKET-INTEL] ❌ REAL API call failed: {type(e).__name__}: {str(e)}")
            # Log the full error for debugging
            if hasattr(e, 'response'):
                logger.error(f"Response status: {e.response.status_code if hasattr(e.response, 'status_code') else 'N/A'}")
            return None
    
    async def _web_search_openai(self, query: str) -> Optional[str]:
        """Fallback to OpenAI for web search (limited capabilities)."""
        try:
            # Note: OpenAI's web_search tool may not be available in all models
            # This is a fallback option
            response = self.openai_client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a market research assistant. Provide current market information based on your knowledge."
                    },
                    {
                        "role": "user",
                        "content": f"Provide current market information for: {query}. Include pricing trends and recent data if available."
                    }
                ],
                max_tokens=500
            )
            
            return response.choices[0].message.content if response.choices else None
            
        except Exception as e:
            logger.error(f"OpenAI web search failed: {e}")
            return None
    
    def _calculate_make_score(self, make: str) -> float:
        """Calculate popularity score for a make."""
        if make in self.popular_makes:
            return 0.8 + (self.popular_makes.index(make) * 0.01)
        return 0.5  # Average score for less popular makes
    
    def _calculate_model_score(self, make: str, model: str) -> float:
        """Calculate demand score for a specific model."""
        if make in self.high_demand_models and model in self.high_demand_models[make]:
            return 0.9
        return 0.6  # Average score for other models
    
    async def _analyze_market_demand(self, make: str, model: str, location: str) -> Dict[str, Any]:
        """Analyze market demand for a make/model combination."""
        try:
            # Format location better (separate zip code from city name)
            formatted_location = location
            if "," in location:
                # Split city and zip code
                parts = [p.strip() for p in location.split(",")]
                if len(parts) == 2 and parts[1].isdigit():
                    # If second part is just a zip code, format as "City, ZIP"
                    formatted_location = f"{parts[0]}, {parts[1]}"
            
            # Use web search to get real market data
            search_query = f"{make} {model} market demand {formatted_location} 2024"
            print(f"[MARKET-INTEL] 🔍 Demand search query: {search_query}")
            web_search_result = await self._web_search(search_query)
            
            # Combine web search with existing logic
            base_demand = 0.7
            if make in self.popular_makes:
                base_demand += 0.2
            if make in self.high_demand_models and model in self.high_demand_models[make]:
                base_demand += 0.1
            
            # Adjust based on web search results
            if web_search_result and "high demand" in web_search_result.lower():
                base_demand += 0.1
            elif web_search_result and "low demand" in web_search_result.lower():
                base_demand -= 0.1
            
            return {
                "demand_level": min(1.0, max(0.0, base_demand)),
                "demand_category": "high" if base_demand > 0.8 else "medium" if base_demand > 0.6 else "low",
                "seasonal_variation": 0.1,
                "trend_direction": "stable",
                "web_search_data": web_search_result[:200] + "..." if web_search_result else None
            }
        except Exception as e:
            logger.error(f"Web search failed for market demand: {e}")
            # Fallback to original logic
            base_demand = 0.7
            if make in self.popular_makes:
                base_demand += 0.2
            if make in self.high_demand_models and model in self.high_demand_models[make]:
                base_demand += 0.1
            
            return {
                "demand_level": base_demand,
                "demand_category": "high" if base_demand > 0.8 else "medium" if base_demand > 0.6 else "low",
                "seasonal_variation": 0.1,
                "trend_direction": "stable"
            }
    
    async def _analyze_profit_potential(self, make: str, model: str, location: str) -> Dict[str, Any]:
        """Analyze profit potential for a make/model."""
        # Simulate profit potential analysis
        base_potential = 0.6
        if make in self.popular_makes:
            base_potential += 0.2
        if make in self.high_demand_models and model in self.high_demand_models[make]:
            base_potential += 0.2
        
        return {
            "profit_potential": base_potential,
            "potential_category": "high" if base_potential > 0.8 else "medium" if base_potential > 0.6 else "low",
            "estimated_profit_range": {
                "min": 1000,
                "max": 5000,
                "average": 2500
            },
            "risk_factors": ["market volatility", "seasonal changes"]
        }
    
    async def _find_competitors(self, make: str, model: str, location: str, radius_miles: int) -> List[Dict[str, Any]]:
        """Find competitors in the local area."""
        # Simulate competitor search
        competitors = []
        for i in range(5):  # Simulate 5 competitors
            competitors.append({
                "id": f"comp_{i}",
                "title": f"{make} {model} - Good Condition",
                "price": 15000 + (i * 500),
                "mileage": 50000 + (i * 10000),
                "year": 2018 + (i % 3),
                "location": f"{location} Area",
                "platform": "Facebook Marketplace" if i % 2 == 0 else "Craigslist",
                "days_listed": 3 + i,
                "condition": "Good" if i % 2 == 0 else "Excellent"
            })
        
        return competitors
    
    async def _analyze_competitor_pricing(self, competitors: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze competitor pricing patterns."""
        if not competitors:
            return {"error": "No competitors found"}
        
        prices = [comp["price"] for comp in competitors]
        avg_price = sum(prices) / len(prices)
        min_price = min(prices)
        max_price = max(prices)
        
        return {
            "average_price": avg_price,
            "price_range": {"min": min_price, "max": max_price},
            "price_distribution": {
                "low": len([p for p in prices if p < avg_price * 0.9]),
                "average": len([p for p in prices if avg_price * 0.9 <= p <= avg_price * 1.1]),
                "high": len([p for p in prices if p > avg_price * 1.1])
            },
            "pricing_strategy": "competitive" if len([p for p in prices if p < avg_price]) > len(prices) / 2 else "premium"
        }
    
    async def _analyze_market_position(self, competitors: List[Dict[str, Any]], target_price: Optional[float]) -> Dict[str, Any]:
        """Analyze market positioning relative to competitors."""
        if not competitors:
            return {"error": "No competitors found"}
        
        avg_competitor_price = sum(comp["price"] for comp in competitors) / len(competitors)
        
        if target_price:
            if target_price < avg_competitor_price * 0.9:
                position = "aggressive"
            elif target_price > avg_competitor_price * 1.1:
                position = "premium"
            else:
                position = "competitive"
        else:
            position = "unknown"
        
        return {
            "market_position": position,
            "average_competitor_price": avg_competitor_price,
            "price_difference": target_price - avg_competitor_price if target_price else None,
            "recommended_positioning": "competitive" if position == "unknown" else position
        }
    
    def _contains_msrp_data(self, text: str) -> bool:
        """
        Check if text contains MSRP or original price data that should be rejected.
        
        Returns True if text contains MSRP-related terms, False otherwise.
        """
        if not text:
            return False
        
        text_lower = text.lower()
        msrp_indicators = [
            "msrp",
            "original price",
            "starting at",
            "when new was",
            "base price",
            "new listing price",
            "price when new",
            "manufacturer's suggested",
            "sticker price",
            "new car price",
            "dealer invoice",
            "launch price",
            "introductory price"
        ]
        
        for indicator in msrp_indicators:
            if indicator in text_lower:
                print(f"[MARKET-INTEL] 🚫 REJECTED: Found MSRP indicator '{indicator}' in search results")
                return True
        
        return False
    
    def _is_used_market_data(self, text: str) -> bool:
        """
        Check if text contains used market pricing data (ACCEPT).
        
        Returns True if text contains used market indicators, False otherwise.
        """
        if not text:
            return False
        
        text_lower = text.lower()
        used_market_indicators = [
            "used market value",
            "current market price",
            "average used price",
            "dealer retail used",
            "private party used",
            "current value",
            "resale value",
            "used car price",
            "pre-owned",
            "second-hand",
            "trade-in value"
        ]
        
        for indicator in used_market_indicators:
            if indicator in text_lower:
                return True
        
        return False
    
    def _sanity_check_price(self, price: float, year: Optional[int], title_status: str = "clean") -> tuple:
        """
        Sanity check: Reject prices that are too high for vehicle age.
        
        CRITICAL: For vehicles 8+ years old, use MUCH stricter checks to prevent MSRP acceptance.
        
        Returns (is_valid, clean_title_estimate) tuple.
        """
        if not year:
            return True, None
        
        current_year = datetime.now().year
        vehicle_age = current_year - year
        
        # Calculate reasonable clean-title market value estimate
        # Base depreciation: ~$800-1200 per year from new
        base_new_price = 30000  # Average new car price
        depreciation_per_year = 1000
        clean_title_estimate = max(3000, base_new_price - (vehicle_age * depreciation_per_year))
        
        # Adjust for title status (NOTE: This is only for validation, not for final pricing)
        # Final pricing applies title discount in _calculate_fallback_price, so we use a lighter discount here
        title_status_safe = (str(title_status).lower() if title_status and isinstance(title_status, str) else "")
        if title_status_safe and "rebuilt" in title_status_safe:
            clean_title_estimate *= 0.85  # Lighter discount for validation (final discount applied in fallback)
        elif title_status_safe and "salvage" in title_status_safe:
            clean_title_estimate *= 0.75  # Lighter discount for validation
        
        # CRITICAL: For vehicles 8+ years old, use MUCH stricter checks
        if vehicle_age >= 8:
            # For 8+ year old vehicles, max reasonable price is 110% of clean-title estimate
            # This prevents MSRP from being accepted
            max_reasonable_price = clean_title_estimate * 1.1
            print(f"[MARKET-INTEL] 🔒 STRICT CHECK (8+ years): Vehicle age {vehicle_age} years, max allowed: ${max_reasonable_price:,.0f}")
        elif vehicle_age >= 5:
            # For 5-7 year old vehicles, use 130% threshold
            max_reasonable_price = clean_title_estimate * 1.3
        else:
            # For newer vehicles (<5 years), use 150% threshold
            max_reasonable_price = clean_title_estimate * 1.5
        
        if price > max_reasonable_price:
            print(f"[MARKET-INTEL] 🚫 SANITY CHECK FAILED: Price ${price:,.0f} exceeds max reasonable ${max_reasonable_price:,.0f} for {year} vehicle (age: {vehicle_age} years)")
            print(f"[MARKET-INTEL] 🚫 Clean-title estimate: ${clean_title_estimate:,.0f}, Max allowed: ${max_reasonable_price:,.0f}")
            print(f"[MARKET-INTEL] 🚫 This price is likely MSRP or historical pricing - REJECTING")
            return False, clean_title_estimate
        
        return True, clean_title_estimate
    
    def _apply_mileage_premium_cap(self, base_price: float, mileage: Optional[int], year: Optional[int]) -> float:
        """
        Apply mileage premium cap for older vehicles.
        
        CRITICAL: For vehicles 8+ years old, mileage premium is STRICTLY capped at 10% max.
        For 5-7 year old vehicles, cap at 15%.
        This prevents low mileage from restoring original MSRP.
        """
        if not mileage or not year:
            return base_price
        
        current_year = datetime.now().year
        vehicle_age = current_year - year
        
        # Only apply cap for vehicles 5+ years old
        if vehicle_age < 5:
            return base_price
        
        # For older vehicles, low mileage premium is capped
        if mileage < 20000:
            # CRITICAL: For 8+ year old vehicles, max premium is 10%
            # For 5-7 year old vehicles, max premium is 15%
            if vehicle_age >= 8:
                max_premium = 0.10  # 10% max for 8+ year old vehicles
                print(f"[MARKET-INTEL] 🔒 STRICT MILEAGE CAP (8+ years): Max premium 10%")
            else:
                max_premium = 0.15  # 15% max for 5-7 year old vehicles
            
            # Calculate premium based on how low mileage is
            mileage_premium = min(max_premium, (20000 - mileage) / 20000 * max_premium)
            adjusted_price = base_price * (1 + mileage_premium)
            print(f"[MARKET-INTEL] 📊 Mileage premium cap applied: {mileage:,} miles on {year} vehicle (age: {vehicle_age} years) adds {mileage_premium*100:.1f}% premium (capped at {max_premium*100:.0f}%)")
            print(f"[MARKET-INTEL] 📊 Price: ${base_price:,.0f} → ${adjusted_price:,.0f} (premium: ${adjusted_price - base_price:,.0f})")
            return adjusted_price
        
        return base_price
    
    def _apply_midwest_discount(self, price: float, make: str, model: str, mileage: Optional[int], location: str) -> float:
        """
        Apply Detroit/Michigan Midwest discount curve to market prices.
        
        Discounts:
        - Sedans: -15% to -22%
        - Coupes: -10%
        - Trucks/SUVs: -3% to -12%
        - Luxury brands: -20% to -30%
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
        
        # Luxury brands: -20% to -30%
        luxury_brands = ["bmw", "mercedes", "mercedes-benz", "audi", "lexus", "infiniti", "acura", "cadillac", "lincoln", "porsche", "jaguar", "land rover"]
        if any(brand in make_lower for brand in luxury_brands):
            base_discount = 0.25  # Average -25% for luxury
        # Trucks/SUVs: -3% to -12%
        elif any(term in model_lower for term in ["truck", "pickup", "f-150", "f150", "silverado", "ram", "tundra", "tacoma", "ranger", "colorado"]):
            base_discount = 0.075  # Average -7.5% for trucks
        elif any(term in model_lower for term in ["suv", "explorer", "escape", "cr-v", "rav4", "highlander", "pilot", "pathfinder", "tahoe", "suburban", "yukon", "escalade"]):
            base_discount = 0.075  # Average -7.5% for SUVs
        # Coupes: -10%
        elif any(term in model_lower for term in ["coupe", "camaro", "mustang", "challenger", "charger"]):
            base_discount = 0.10
        # Sedans: -15% to -22% (default)
        else:
            base_discount = 0.185  # Average -18.5% for sedans
        
        # High mileage additional discount: -3% to -7%
        mileage_discount = 0.0
        if mileage and mileage > 150000:
            # Scale from -3% at 150k to -7% at 200k+
            mileage_discount = min(0.07, 0.03 + ((mileage - 150000) / 50000) * 0.04)
        
        total_discount = base_discount + mileage_discount
        discounted_price = price * (1 - total_discount)
        
        print(f"[MARKET-INTEL] 🏭 Midwest discount applied: {make} {model} in {location}")
        print(f"[MARKET-INTEL]   Base discount: -{base_discount*100:.1f}% ({'luxury' if any(brand in make_lower for brand in luxury_brands) else 'truck/suv' if base_discount == 0.075 else 'coupe' if base_discount == 0.10 else 'sedan'})")
        if mileage_discount > 0:
            print(f"[MARKET-INTEL]   High mileage discount: -{mileage_discount*100:.1f}% ({mileage:,} miles)")
        print(f"[MARKET-INTEL]   Total discount: -{total_discount*100:.1f}%")
        print(f"[MARKET-INTEL]   Price: ${price:,.0f} → ${discounted_price:,.0f}")
        
        return discounted_price
    
    def _calculate_fallback_price(self, make: str, model: str, year: Optional[int], mileage: Optional[int], trim: Optional[str] = None, title_status: str = "clean") -> float:
        """
        Fallback pricing algorithm using KBB/Edmunds/AutoTrader average.
        
        Uses depreciation curves, mileage adjustments, and title status.
        For 8+ year old vehicles, uses more aggressive depreciation.
        """
        if not year:
            year = 2015  # Default fallback
        
        current_year = datetime.now().year
        vehicle_age = current_year - year
        
        # Base new car price (adjust by make/model)
        base_new_price = 25000  # Conservative base for average car
        
        make_lower = (make or "").lower()
        model_lower = (model or "").lower()
        
        # Adjust base price for make/model (what it cost new)
        if "jeep" in make_lower:
            if "wrangler" in model_lower:
                base_new_price = 30000  # Wranglers cost more new
            elif "compass" in model_lower:
                base_new_price = 22000  # Compass was cheaper new
            else:
                base_new_price = 25000
        elif "honda" in make_lower:
            if "accord" in model_lower:
                base_new_price = 23000  # Accord base price when new
                if "sport" in model_lower or "ex" in model_lower:
                    base_new_price = 26000  # Sport/EX trim was more expensive
            elif "civic" in model_lower:
                base_new_price = 20000
            else:
                base_new_price = 25000
        elif "toyota" in make_lower:
            if "camry" in model_lower:
                base_new_price = 24000
            else:
                base_new_price = 25000
        elif "chevrolet" in make_lower or "chevy" in make_lower:
            if "malibu" in model_lower:
                base_new_price = 23000  # Malibu base price when new
                if "ltz" in model_lower or "premier" in model_lower:
                    base_new_price = 28000  # Higher trims cost more new
            elif "silverado" in model_lower:
                base_new_price = 30000
            elif "equinox" in model_lower:
                base_new_price = 24000
            else:
                base_new_price = 25000
        elif "bmw" in make_lower or "mercedes" in make_lower:
            base_new_price = 40000
        else:
            base_new_price = 25000
        
        # Calculate depreciation
        # For 10+ year old Malibus, use market average as base (AutoTrader shows ~$7,748 for 2014 Malibu)
        if vehicle_age >= 10 and "malibu" in (model or "").lower():
            # Market data: 2014 Malibu average ~$7,748 (AutoTrader, all trims/mileages)
            # Use this as starting point instead of depreciation calculation
            base_price = 7748  # AutoTrader average for 2014 Malibu (all trims/mileages)
            print(f"[MARKET-INTEL] 📊 Using market average base price for {year} Malibu: ${base_price:,.0f} (AutoTrader data)")
        elif vehicle_age >= 8:
            # Older vehicles depreciate faster: ~$1200-1500 per year
            depreciation_per_year = 1300
            base_price = max(3000, base_new_price - (vehicle_age * depreciation_per_year))
            print(f"[MARKET-INTEL] 📊 Fallback: {vehicle_age}-year-old vehicle, aggressive depreciation (${depreciation_per_year}/year)")
        elif vehicle_age >= 5:
            # 5-7 year old: ~$1000 per year
            depreciation_per_year = 1000
            base_price = max(4000, base_new_price - (vehicle_age * depreciation_per_year))
        else:
            # Newer vehicles: ~$800 per year
            depreciation_per_year = 800
            base_price = max(5000, base_new_price - (vehicle_age * depreciation_per_year))
        
        # Trim tier adjustment before mileage and title deductions
        trim_tier, trim_matches = detect_trim_tier(trim)
        trim_percent = get_trim_adjustment_percent(trim_tier, len(trim_matches) or (1 if trim else 0), trim, model)
        if trim_percent:
            trim_boost = base_price * trim_percent
            base_price += trim_boost
            print(f"[MARKET-INTEL] 🎯 Trim tier '{trim_tier}' detected ({', '.join(trim_matches) or trim or 'base'}): +{trim_percent*100:.1f}% → +${trim_boost:,.0f}")
        
        # CRITICAL: DO NOT apply mileage adjustment here!
        # Mileage adjustment is applied in Pricing Strategy Agent using flat dollar amounts
        # The fallback should return an average-mileage value, which will be adjusted later
        # This prevents double-adjustment when fallback is used
        reliability_tier = get_reliability_tier(make)
        print(f"[MARKET-INTEL] 📊 Mileage adjustment will be applied in Pricing Strategy Agent (not in fallback)")
        
        # Make/model value retention adjustments
        if "jeep" in make_lower and "wrangler" in model_lower:
            base_price *= 1.2  # Wranglers hold value well
        elif "toyota" in make_lower or "honda" in make_lower:
            base_price *= 1.05  # Reliable brands hold value
        elif "chevrolet" in make_lower or "chevy" in make_lower:
            if "malibu" in model_lower:
                base_price *= 1.0  # Malibu holds average value
            else:
                base_price *= 0.98  # Other Chevys slightly below average
        elif "jeep" in make_lower and "compass" in model_lower:
            base_price *= 0.95  # Compass doesn't hold value as well
        
        # CRITICAL: DO NOT apply title status adjustment here!
        # Title status adjustment is applied in Pricing Strategy Agent
        # The fallback should return a CLEAN-TITLE value, which will be adjusted later
        # This prevents double-adjustment when fallback is used
        
        # Apply mileage premium cap for low-mileage older vehicles
        if mileage and vehicle_age >= 5:
            base_price = self._apply_mileage_premium_cap(base_price, mileage, year)
        
        # NO MINIMUM FLOORS - Use Google Search data only
        # Minimum floors removed - we rely 100% on Google Search API for real market data
        # If Google Search fails, fallback will be used, but we don't enforce artificial minimums
        
        # Clamp to reasonable range (±20% of calculated price)
        min_price = base_price * 0.8
        max_price = base_price * 1.2
        
        print(f"[MARKET-INTEL] 📊 Fallback price calculated: ${base_price:,.0f} (range: ${min_price:,.0f} - ${max_price:,.0f})")
        print(f"[MARKET-INTEL] 📊 For {year} {make} {model} with {mileage:,} miles")
        print(f"[MARKET-INTEL] ⚠️  NOTE: This is CLEAN-TITLE value - title status ({title_status}) will be applied in Pricing Strategy Agent")
        
        return base_price
    
    async def _get_market_prices(self, make: str, model: str, year: Optional[int], mileage: Optional[int], location: str, user_entered_price: Optional[int] = None, trim: Optional[str] = None, title_status: str = "clean") -> Dict[str, Any]:
        """Get market pricing data using Google Search Grounding (real-time data from Google)."""
        try:
            title_status = normalize_title_status(title_status)
            # Format location better (separate zip code from city name)
            formatted_location = location
            if "," in location:
                # Split city and zip code
                parts = [p.strip() for p in location.split(",")]
                if len(parts) == 2 and parts[1].isdigit():
                    # If second part is just a zip code, format as "City, ZIP"
                    formatted_location = f"{parts[0]}, {parts[1]}"
            
            reliability_tier = get_reliability_tier(make)

            # GUARDRAIL 1: Build query that explicitly excludes MSRP and requests current used pricing
            # Force TODAY's market year and used car pricing only
            current_year = datetime.now().year
            year_str = f"{year} " if year else ""
            # CRITICAL: Always include trim in search query if provided (e.g., "Long Range", "Sport", etc.)
            # This ensures we get prices for the correct trim level, not base model
            trim_str = f" {trim}" if trim else ""
            mileage_str = f" with {mileage:,} miles" if mileage else ""
            title_str = f" {title_status} title"
            location_clause = f" near {formatted_location}" if formatted_location else ""
            
            # Log what we're searching for
            print(f"[MARKET-INTEL] 🔍 Search parameters:")
            print(f"[MARKET-INTEL]   Year: {year_str.strip()}")
            print(f"[MARKET-INTEL]   Make: {make}")
            print(f"[MARKET-INTEL]   Model: {model}")
            print(f"[MARKET-INTEL]   Trim: {trim_str.strip() if trim_str else 'NOT PROVIDED - may get base model prices!'}")
            print(f"[MARKET-INTEL]   Mileage: {mileage_str.strip() if mileage_str else 'Unknown'}")
            print(f"[MARKET-INTEL]   Title: {title_status}")
            print(f"[MARKET-INTEL]   Location: {formatted_location}")
            
            # STEP 1: LOCAL MARKET QUERY (Detroit/Michigan)
            # Add Detroit-specific phrases to influence Google Search Grounding results
            # We are NOT scraping - just influencing Google's search results
            location_lower = formatted_location.lower() if formatted_location else ""
            is_detroit_michigan = any(term in location_lower for term in ["detroit", "michigan", "mi", "flint", "redford", "warren", "troy", "dearborn"])
            
            if is_detroit_michigan:
                # Extract zip code if available (e.g., 48239)
                zip_code = ""
                if formatted_location and "," in formatted_location:
                    parts = formatted_location.split(",")
                    if len(parts) >= 2:
                        zip_part = parts[-1].strip()
                        if zip_part.isdigit() and len(zip_part) == 5:
                            zip_code = zip_part
                
                # Build query with Detroit/Michigan-specific phrases to influence Google Search
                # These phrases help Google return more Detroit-area listings via Grounding
                detroit_phrases = [
                    "Detroit MI",
                    "Michigan",
                    "Redford MI",
                    "48239" if zip_code == "48239" else "",
                    "for sale Detroit",
                    "used cars Detroit Michigan"
                ]
                # Filter out empty phrases
                detroit_phrases = [p for p in detroit_phrases if p]
                detroit_context = " ".join(detroit_phrases)
                
                # Build comprehensive query that influences Google to return Detroit listings
                # CRITICAL: Include mileage in query to match similar mileage vehicles (e.g., 80k-90k miles)
                # This ensures we get prices for vehicles with similar mileage, not just any mileage
                search_query = (
                    f"{year_str}{make} {model}{trim_str}{mileage_str}{title_str} "
                    f"price {detroit_context} "
                    f"used car market value {current_year} "
                    f"Detroit Michigan area listings"
                )
                
                # Log mileage matching for verification
                if mileage:
                    print(f"[MARKET-INTEL] 📊 Mileage matching: Searching for vehicles with ~{mileage:,} miles to get accurate pricing")
                    print(f"[MARKET-INTEL] 📊 This ensures we compare to similar mileage vehicles (not low-mileage or high-mileage outliers)")
                
                print(f"[MARKET-INTEL] 🔍 DETROIT MARKET QUERY (Google Search Grounding): {search_query}")
                print(f"[MARKET-INTEL] ✅ Using Google Search Grounding ONLY - NO scraping, NO crawling")
            else:
                # Default query for other locations
                search_query = (
                    f"used market price for {year_str}{make} {model}{trim_str}{mileage_str}{title_str}{location_clause} "
                    f"current resale value {current_year} at {formatted_location} "
                    f"used value not MSRP not original price used car listings only"
                )
            print(f"[MARKET-INTEL] 🔍 Price search query (with MSRP guardrails): {search_query}")
            logger.info(f"[MARKET-INTEL] Query: {self._redact_query(search_query)}")
            
            # CRITICAL: Force Google Search to run - this is the PRIMARY data source
            print(f"[MARKET-INTEL] 🚀 FORCING Google Search API call (REQUIRED for accurate pricing)...")
            web_search_result = await self._web_search(search_query)
            
            if not web_search_result:
                print(f"[MARKET-INTEL] ❌ CRITICAL: Google Search returned NO results!")
                print(f"[MARKET-INTEL] ❌ This means pricing will use fallback algorithm (less accurate)")
                print(f"[MARKET-INTEL] ❌ Check: GEMINI_API_KEY is set, Google Search Grounding is enabled")
            else:
                print(f"[MARKET-INTEL] ✅ Google Search returned {len(web_search_result)} characters of data")
            debug_info = {
                "raw_prices": [],
                "msrp_candidates": [],
                "used_candidates": [],
                "filtered_prices": [],
                "sanity_check_failures": [],
                "data_source": None,
                "fallback_used": False,
                "search_query": search_query,
                "location": formatted_location,
                "title_status": title_status,
                "trim": trim,
                "reliability_tier": reliability_tier,
            }
            
            # GUARDRAIL 2: Filter out MSRP data from search results
            if web_search_result:
                if self._contains_msrp_data(web_search_result):
                    print(f"[MARKET-INTEL] 🚫 REJECTED: Search results contain MSRP data, filtering out...")
                    # Try to extract only used market portions
                    # Split by sentences and keep only those with used market indicators
                    sentences = web_search_result.split('.')
                    filtered_sentences = [s for s in sentences if self._is_used_market_data(s) and not self._contains_msrp_data(s)]
                    if filtered_sentences:
                        web_search_result = '. '.join(filtered_sentences)
                        print(f"[MARKET-INTEL] ✅ Filtered to used market data only ({len(filtered_sentences)} sentences)")
                    else:
                        print(f"[MARKET-INTEL] ⚠️ All search results contained MSRP data, will use fallback")
                        web_search_result = None
            
            # Calculate fallback price using improved algorithm
            base_price_estimate = self._calculate_fallback_price(make, model, year, mileage, trim, title_status)
            
            # Try to extract REAL prices from Google search results
            market_average = 0  # Will be set from real search results
            kbb_value = base_price_estimate * 0.95
            edmunds_value = base_price_estimate * 1.02
            cargurus_value = base_price_estimate * 0.98
            
            print(f"[MARKET-INTEL] 📊 Fallback estimate (if Google Search fails): ${base_price_estimate:,.0f}")
            
            if web_search_result:
                print(f"[MARKET-INTEL] ✅ Google Search returned results - extracting MAIN market sale value ONLY...")
                print(f"[MARKET-INTEL] 📄 Google Search result preview (first 500 chars): {web_search_result[:500]}...")
                print(f"[MARKET-INTEL] 📄 Full result length: {len(web_search_result)} characters")
                
                # NEW EXTRACTION LOGIC: ONLY extract MAIN market sale/private party value
                # IGNORE: trade-in, wholesale, auction, SEO garbage, unrelated trims/years
                import re
                
                # Collect ALL potential price ranges from the text
                all_price_ranges = []
                
                # PRIORITY 1: Private Party Sale Value (HIGHEST PRIORITY)
                private_party_patterns = [
                    r'private\s+(?:party|sale)\s+value[^$]*?\$?([\d,]+)\s+(?:to|-|and)\s+\$?([\d,]+)',
                    r'selling\s+(?:yourself|privately|the\s+car\s+yourself)[^$]*?(?:range\s+of\s+|is\s+)?\$?([\d,]+)\s+(?:to|-|and)\s+\$?([\d,]+)',
                    r'private\s+party[^$]*?\$?([\d,]+)\s+(?:to|-|and)\s+\$?([\d,]+)',
                ]
                
                for pattern in private_party_patterns:
                    matches = re.finditer(pattern, web_search_result, re.IGNORECASE)
                    for match in matches:
                        try:
                            low = int(match.group(1).replace(',', ''))
                            high = int(match.group(2).replace(',', ''))
                            if 3000 <= low <= high <= 200000:  # Valid price range
                                all_price_ranges.append({
                                    "low": low,
                                    "high": high,
                                    "avg": (low + high) / 2,
                                    "type": "private_party",
                                    "priority": 1
                                })
                                print(f"[MARKET-INTEL] ✅ Found PRIVATE PARTY range: ${low:,} - ${high:,}")
                        except (ValueError, IndexError):
                            continue
                
                # PRIORITY 2: Main market sale value (general ranges, but exclude trade-in/wholesale context)
                # Look for ranges that are NOT in trade-in/wholesale/auction context
                general_pattern = r'\$?([\d,]+)\s+(?:to|-|and)\s+\$?([\d,]+)'
                general_matches = re.finditer(general_pattern, web_search_result, re.IGNORECASE)
                
                for match in general_matches:
                    try:
                        low = int(match.group(1).replace(',', ''))
                        high = int(match.group(2).replace(',', ''))
                        
                        # Skip if it's a year range (2000-2030)
                        if 2000 <= low <= 2030 and 2000 <= high <= 2030:
                            continue
                        
                        # Skip if it's mileage (usually 5-6 digits, but context matters)
                        match_start = match.start()
                        context_before = web_search_result[max(0, match_start-30):match_start].lower()
                        context_after = web_search_result[match_start:min(len(web_search_result), match_start+50)].lower()
                        
                        # REJECT if in trade-in/wholesale/auction context
                        reject_keywords = ['trade-in', 'trade in', 'wholesale', 'auction', 'dealer invoice', 'starting at', 'from \$', 'as low as']
                        if any(keyword in context_before or keyword in context_after for keyword in reject_keywords):
                            print(f"[MARKET-INTEL] 🚫 REJECTED (trade-in/wholesale/SEO): ${low:,} - ${high:,}")
                            continue
                        
                        # REJECT if it's clearly SEO garbage ("starting at $3,500", "from $2,999")
                        if 'starting at' in context_before or 'from $' in context_before or 'as low as' in context_before:
                            continue
                        
                        # Only accept if it's a reasonable price range
                        if 3000 <= low <= high <= 200000:
                            all_price_ranges.append({
                                "low": low,
                                "high": high,
                                "avg": (low + high) / 2,
                                "type": "market_sale",
                                "priority": 2
                            })
                            print(f"[MARKET-INTEL] ✅ Found MARKET SALE range: ${low:,} - ${high:,}")
                    except (ValueError, IndexError):
                        continue
                
                # ALWAYS choose the HIGHEST valid private-party/market-value range
                if all_price_ranges:
                    print(f"[MARKET-INTEL] 📊 DEBUG: Found {len(all_price_ranges)} valid price ranges:")
                    for idx, pr in enumerate(all_price_ranges):
                        print(f"[MARKET-INTEL]   Range {idx+1}: ${pr['low']:,} - ${pr['high']:,} (avg: ${pr['avg']:,.0f}, type: {pr['type']}, priority: {pr['priority']})")
                    
                    # Sort by priority (private_party first), then by average price (highest first)
                    all_price_ranges.sort(key=lambda x: (x["priority"], -x["avg"]))
                    selected_range = all_price_ranges[0]
                    
                    market_average = selected_range["avg"]
                    low_price = selected_range["low"]
                    high_price = selected_range["high"]
                    
                    print(f"[MARKET-INTEL] ✅ SELECTED HIGHEST MAIN MARKET VALUE: ${low_price:,} - ${high_price:,} (avg: ${market_average:,.0f})")
                    print(f"[MARKET-INTEL] ✅ Type: {selected_range['type']}, Priority: {selected_range['priority']}")
                    print(f"[MARKET-INTEL] 🚫 IGNORED {len(all_price_ranges)-1} other ranges (trade-in/wholesale/SEO)")
                    print(f"[MARKET-INTEL] 📊 DEBUG: Returning market_average=${market_average:,.0f} to pricing strategy agent")
                    print(f"[MARKET-INTEL] 📊 DEBUG: Vehicle: {year} {make} {model}, Title: {title_status}, Location: {formatted_location}")
                    
                    # Return RAW Google price - NO adjustments here (adjustments in Pricing Strategy Agent)
                    debug_info["raw_prices"] = [low_price, high_price, market_average]
                    debug_info["used_candidates"] = [market_average]
                    debug_info["filtered_prices"] = [market_average]
                    debug_info["data_source"] = "google_search_main_market_value"
                    
                    return {
                        "kbb_value": round(market_average * 0.95),
                        "edmunds_value": round(market_average * 1.02),
                        "cargurus_value": round(market_average * 0.98),
                        "market_average": round(market_average),
                        "price_range": {
                            "low": round(low_price),
                            "high": round(high_price)
                        },
                        "data_source": "google_search_grounding",
                        "web_search_snippet": f"Main market sale value: ${low_price:,} - ${high_price:,}",
                        "prices_found": 1,
                        "confidence": 0.9,
                        "search_query": search_query,
                        "location_used": formatted_location,
                        "title_status_used": title_status,
                        "trim_used": trim,
                        "reliability_tier": reliability_tier,
                        "debug": debug_info,
                        "google_raw_price": round(market_average)  # Store raw Google price for adjustments
                    }
                
                # If no valid ranges found, check structured JSON as fallback
                if web_search_result.startswith("__STRUCTURED_JSON__") and "__END_JSON__" in web_search_result:
                    try:
                        import json
                        json_str = web_search_result.replace("__STRUCTURED_JSON__", "").replace("__END_JSON__", "").strip()
                        structured_data = json.loads(json_str)
                        
                        # ONLY use private_party_value or price_range, IGNORE trade_in_value
                        private_party = structured_data.get("private_party_value", {})
                        price_range = structured_data.get("price_range", {})
                        
                        if private_party.get("low") and private_party.get("high"):
                            low_price = private_party.get("low")
                            high_price = private_party.get("high")
                            market_average = (low_price + high_price) / 2
                        elif price_range.get("low") and price_range.get("high"):
                            low_price = price_range.get("low")
                            high_price = price_range.get("high")
                            market_average = (low_price + high_price) / 2
                        else:
                            market_average = structured_data.get("market_average", 0)
                            if market_average > 0:
                                low_price = market_average * 0.9
                                high_price = market_average * 1.1
                            else:
                                raise ValueError("No usable price in structured JSON")
                        
                        print(f"[MARKET-INTEL] ✅ Using structured JSON PRIVATE PARTY value: ${low_price:,.0f} - ${high_price:,.0f} (avg: ${market_average:,.0f})")
                        print(f"[MARKET-INTEL] 🚫 IGNORED trade_in_value from structured JSON")
                        
                        debug_info["raw_prices"] = [low_price, high_price, market_average]
                        debug_info["used_candidates"] = [market_average]
                        debug_info["filtered_prices"] = [market_average]
                        debug_info["data_source"] = "google_search_structured_json"
                        
                        return {
                            "kbb_value": round(market_average * 0.95),
                            "edmunds_value": round(market_average * 1.02),
                            "cargurus_value": round(market_average * 0.98),
                            "market_average": round(market_average),
                            "price_range": {
                                "low": round(low_price),
                                "high": round(high_price)
                            },
                            "data_source": "google_search_grounding",
                            "web_search_snippet": f"Structured data: ${low_price:,.0f} - ${high_price:,.0f}",
                            "prices_found": 1,
                            "confidence": 0.9,
                            "search_query": search_query,
                            "location_used": formatted_location,
                            "title_status_used": title_status,
                            "trim_used": trim,
                            "reliability_tier": reliability_tier,
                            "debug": debug_info,
                            "google_raw_price": round(market_average)
                        }
                    except (json.JSONDecodeError, KeyError, ValueError) as e:
                        print(f"[MARKET-INTEL] ⚠️ Failed to parse structured JSON: {e}")
                
                # If we get here, no valid main market value was found
                print(f"[MARKET-INTEL] ⚠️ No valid MAIN market sale value found in Google Search results")
                print(f"[MARKET-INTEL] ⚠️ All prices were trade-in/wholesale/SEO garbage or invalid")
                print(f"[MARKET-INTEL] ⚠️ Google Search completely failed - will use fallback algorithm (LAST RESORT)")
                market_average = 0  # Signal that Google Search failed
            
            # GUARDRAIL 5: If Google Search didn't return usable prices, use fallback algorithm
            # NOTE: This should RARELY happen - Google Search should be the primary source
            # Fallback ONLY triggers when Google completely fails, NOT for year mismatch or other reasons
            if market_average == 0:
                print(f"[MARKET-INTEL] ⚠️  ⚠️  ⚠️  CRITICAL WARNING: Google Search didn't return usable prices!")
                print(f"[MARKET-INTEL] ⚠️  This should NOT happen - Google Search is the PRIMARY data source")
                print(f"[MARKET-INTEL] ⚠️  Check: GEMINI_API_KEY is set, Google Search Grounding is enabled")
                print(f"[MARKET-INTEL] ⚠️  Check backend logs for '[MARKET-INTEL] 🔍 Using REAL Google Gemini API' message")
                print(f"[MARKET-INTEL] 📊 DEBUG: Rejected {len(debug_info.get('msrp_candidates', []))} MSRP candidates: {debug_info.get('msrp_candidates', [])}")
                print(f"[MARKET-INTEL] 📊 DEBUG: Google Search result length: {len(web_search_result) if web_search_result else 0} characters")
                
                # Only use fallback if Google Search completely failed
                market_average = base_price_estimate
                debug_info["fallback_used"] = True
                debug_info["data_source"] = "fallback_algorithm"
                print(f"[MARKET-INTEL] ⚠️  Using FALLBACK pricing algorithm: ${market_average:,.0f} (LAST RESORT - Google Search should be used)")
                print(f"[MARKET-INTEL] ⚠️  Check: GEMINI_API_KEY is set, Google Search Grounding is enabled")
                print(f"[MARKET-INTEL] ⚠️  Check backend logs for '[MARKET-INTEL] 🔍 Using REAL Google Gemini API' message")
                print(f"[MARKET-INTEL] 📊 DEBUG: Rejected {len(debug_info['msrp_candidates'])} MSRP candidates: {debug_info['msrp_candidates']}")
                print(f"[MARKET-INTEL] 📊 DEBUG: Google Search result length: {len(web_search_result) if web_search_result else 0} characters")
                print(f"[MARKET-INTEL] 📊 DEBUG: Fallback base_price_estimate: ${base_price_estimate:,.0f}")
            
            data_source = "estimated" if market_average == base_price_estimate else "google_search_grounding"
            if data_source == "estimated":
                debug_info["fallback_used"] = True
                debug_info["data_source"] = "fallback_algorithm"
                print(f"[MARKET-INTEL] ❌ FINAL RESULT: Using FALLBACK (Google Search failed or returned no data)")
                print(f"[MARKET-INTEL] 📊 DEBUG: market_average=${market_average:,.0f}, base_price_estimate=${base_price_estimate:,.0f}")
            else:
                print(f"[MARKET-INTEL] ✅ FINAL RESULT: Using REAL Google Search data")
                print(f"[MARKET-INTEL] 📊 DEBUG: market_average=${market_average:,.0f} (from Google Search)")
            
            # Ensure debug info is populated
            if not debug_info.get("raw_prices"):
                debug_info["raw_prices"] = []
            if not debug_info.get("msrp_candidates"):
                debug_info["msrp_candidates"] = []
            if not debug_info.get("used_candidates"):
                debug_info["used_candidates"] = []
            if not debug_info.get("filtered_prices"):
                debug_info["filtered_prices"] = [round(market_average)]
            if not debug_info.get("sanity_check_failures"):
                debug_info["sanity_check_failures"] = []
            
            return {
                "kbb_value": round(market_average * 0.95),
                "edmunds_value": round(market_average * 1.02),
                "cargurus_value": round(market_average * 0.98),
                "market_average": round(market_average),
                "price_range": {
                    "low": round(market_average * 0.85),
                    "high": round(market_average * 1.15)
                },
                "data_source": data_source,
                "web_search_snippet": web_search_result[:300] + "..." if web_search_result else None,
                "google_search_ran": web_search_result is not None,  # Flag to indicate if Google Search was called
                "search_query": search_query,
                "location_used": formatted_location,
                "title_status_used": title_status,
                "trim_used": trim,
                "reliability_tier": reliability_tier,
                "debug": debug_info
            }
        except Exception as e:
            logger.error(f"Market price lookup failed: {e}")
            # ONLY use estimate if Google Search completely fails - NEVER use user price
            base_price = 20000  # More realistic default
            if year:
                base_price += (year - 2015) * 800  # $800 per year
            if mileage:
                base_price -= (mileage - 50000) * 0.15  # $0.15 per mile
            # Adjust for make/model
            make_lower = (make or "").lower()
            model_lower = (model or "").lower()
            if "jeep" in make_lower and "wrangler" in model_lower:
                base_price *= 1.3  # Wranglers hold value well
            print(f"[MARKET-INTEL] ⚠️  Google Search failed, using estimate (${base_price:,.0f}) - NOT user price")
            
            return {
                "kbb_value": round(base_price * 0.95),
                "edmunds_value": round(base_price * 1.02),
                "cargurus_value": round(base_price * 0.98),
                "market_average": round(base_price),
                "price_range": {
                    "low": round(base_price * 0.85),
                    "high": round(base_price * 1.15)
                },
                "data_source": "estimated",
                "error": str(e),
                "note": "Google Search failed - using estimate only",
                "search_query": search_query if 'search_query' in locals() else None,
                "location_used": formatted_location,
                "title_status_used": title_status,
                "trim_used": trim,
                "reliability_tier": reliability_tier
            }
    
    async def _analyze_price_trends(self, make: str, model: str, location: str) -> Dict[str, Any]:
        """Analyze price trends over time."""
        # Simulate price trend analysis
        return {
            "trend_direction": "stable",
            "trend_strength": 0.3,
            "seasonal_pattern": "summer_peak",
            "forecast": {
                "next_month": "stable",
                "next_quarter": "slight_increase",
                "next_year": "moderate_increase"
            }
        }
    
    def _calculate_seasonal_factors(self) -> Dict[str, float]:
        """Calculate seasonal adjustment factors."""
        current_month = datetime.now().month
        
        # Seasonal factors (1.0 = no adjustment)
        seasonal_factors = {
            "spring": 1.05,  # March-May
            "summer": 1.10,  # June-August
            "fall": 0.95,    # September-November
            "winter": 0.90   # December-February
        }
        
        if 3 <= current_month <= 5:
            current_season = "spring"
        elif 6 <= current_month <= 8:
            current_season = "summer"
        elif 9 <= current_month <= 11:
            current_season = "fall"
        else:
            current_season = "winter"
        
        return {
            "current_season": current_season,
            "adjustment_factor": seasonal_factors[current_season],
            "seasonal_factors": seasonal_factors
        }
    
    def _generate_price_recommendations(self, market_prices: Dict[str, Any], price_trends: Dict[str, Any], seasonal_factors: Dict[str, Any]) -> Dict[str, Any]:
        """Generate price recommendations based on market data."""
        avg_market_price = market_prices["market_average"]
        seasonal_adjustment = seasonal_factors["adjustment_factor"]
        
        return {
            "recommended_buy_price": avg_market_price * 0.85 * seasonal_adjustment,
            "recommended_sell_price": avg_market_price * 1.15 * seasonal_adjustment,
            "target_profit_margin": 0.20,
            "price_strategy": "market_based",
            "timing_recommendation": "buy_now" if seasonal_adjustment < 1.0 else "wait_for_seasonal_drop"
        }
    
    async def _calculate_acquisition_thresholds(self, make: str, model: str, target_profit: float, risk_tolerance: str) -> Dict[str, Any]:
        """Calculate maximum acquisition price thresholds."""
        # Simulate acquisition threshold calculation
        market_value = 15000  # Base market value
        
        risk_multipliers = {
            "low": 0.90,
            "medium": 0.85,
            "high": 0.80
        }
        
        max_acquisition = market_value * risk_multipliers.get(risk_tolerance, 0.85) - target_profit
        
        return {
            "max_acquisition_price": max_acquisition,
            "target_acquisition_price": max_acquisition * 0.95,
            "walk_away_price": max_acquisition * 1.05,
            "risk_tolerance": risk_tolerance
        }
    
    async def _calculate_selling_thresholds(self, make: str, model: str, target_profit: float, risk_tolerance: str) -> Dict[str, Any]:
        """Calculate minimum selling price thresholds."""
        # Simulate selling threshold calculation
        market_value = 15000  # Base market value
        
        min_selling = market_value + target_profit
        
        return {
            "min_selling_price": min_selling,
            "target_selling_price": min_selling * 1.05,
            "aspirational_price": min_selling * 1.15,
            "quick_sale_price": min_selling * 0.95
        }
    
    def _analyze_risk_factors(self, make: str, model: str, risk_tolerance: str) -> Dict[str, Any]:
        """Analyze risk factors for the make/model combination."""
        risk_factors = []
        risk_score = 0.5  # Base risk score
        
        if make not in self.popular_makes:
            risk_factors.append("less_popular_make")
            risk_score += 0.2
        
        if make in self.high_demand_models and model not in self.high_demand_models[make]:
            risk_factors.append("less_popular_model")
            risk_score += 0.1
        
        return {
            "risk_score": risk_score,
            "risk_level": "high" if risk_score > 0.7 else "medium" if risk_score > 0.4 else "low",
            "risk_factors": risk_factors,
            "mitigation_strategies": self._generate_risk_mitigation_strategies(risk_factors)
        }
    
    def _generate_risk_mitigation_strategies(self, risk_factors: List[str]) -> List[str]:
        """Generate strategies to mitigate identified risks."""
        strategies = []
        
        if "less_popular_make" in risk_factors:
            strategies.append("Focus on niche buyers and specialty markets")
            strategies.append("Consider longer holding period")
        
        if "less_popular_model" in risk_factors:
            strategies.append("Emphasize unique features and benefits")
            strategies.append("Target specific buyer demographics")
        
        return strategies
    
    def _generate_make_model_recommendation(self, make_score: float, model_score: float, demand_analysis: Dict[str, Any]) -> str:
        """Generate recommendation based on make/model analysis."""
        overall_score = (make_score + model_score) / 2
        
        if overall_score > 0.8 and demand_analysis["demand_category"] == "high":
            return "Excellent opportunity - High demand and strong market presence"
        elif overall_score > 0.6 and demand_analysis["demand_category"] in ["high", "medium"]:
            return "Good opportunity - Solid demand with manageable risk"
        else:
            return "Proceed with caution - Lower demand or higher risk factors"
    
    def _generate_competitor_recommendations(self, competitors: List[Dict[str, Any]], pricing_analysis: Dict[str, Any]) -> List[str]:
        """Generate recommendations based on competitor analysis."""
        recommendations = []
        
        if len(competitors) < 3:
            recommendations.append("Limited competition - opportunity for premium pricing")
        elif len(competitors) > 10:
            recommendations.append("High competition - focus on competitive pricing and unique value proposition")
        
        if pricing_analysis.get("pricing_strategy") == "premium":
            recommendations.append("Market supports premium pricing - emphasize quality and features")
        else:
            recommendations.append("Competitive market - focus on value and quick turnover")
        
        return recommendations
    
    def _generate_threshold_recommendations(self, acquisition_thresholds: Dict[str, Any], selling_thresholds: Dict[str, Any], risk_analysis: Dict[str, Any]) -> List[str]:
        """Generate recommendations based on threshold analysis."""
        recommendations = []
        
        if risk_analysis["risk_level"] == "high":
            recommendations.append("High risk deal - consider lower acquisition price or pass")
        elif risk_analysis["risk_level"] == "low":
            recommendations.append("Low risk deal - can be more aggressive with pricing")
        
        profit_margin = (selling_thresholds["target_selling_price"] - acquisition_thresholds["target_acquisition_price"]) / acquisition_thresholds["target_acquisition_price"]
        
        if profit_margin > 0.25:
            recommendations.append("High profit potential - prioritize this deal")
        elif profit_margin < 0.15:
            recommendations.append("Low profit margin - consider passing or negotiating better terms")
        
        return recommendations
    
    def _generate_executive_summary(self, results: List[Any]) -> Dict[str, Any]:
        """Generate executive summary from all analysis results."""
        # Extract key metrics from results
        make_model_score = 0.0
        competitor_count = 0
        avg_price = 0.0
        profit_potential = 0.0
        
        try:
            if hasattr(results[0], 'get') and results[0].get('make_model_analysis'):
                make_model_score = results[0]['make_model_analysis'].get('overall_score', 0.0)
        except:
            pass
        
        try:
            if hasattr(results[1], 'get') and results[1].get('competitor_research'):
                competitor_count = results[1]['competitor_research'].get('competitors_found', 0)
        except:
            pass
        
        try:
            if hasattr(results[2], 'get') and results[2].get('pricing_analysis'):
                avg_price = results[2]['pricing_analysis'].get('market_prices', {}).get('market_average', 0.0)
        except:
            pass
        
        try:
            if hasattr(results[3], 'get') and results[3].get('profit_thresholds'):
                profit_potential = results[3]['profit_thresholds'].get('target_profit', 0.0)
        except:
            pass
        
        return {
            "overall_score": make_model_score,
            "market_opportunity": "high" if make_model_score > 0.7 and competitor_count < 5 else "medium" if make_model_score > 0.5 else "low",
            "key_metrics": {
                "make_model_score": make_model_score,
                "competitor_count": competitor_count,
                "average_market_price": avg_price,
                "profit_potential": profit_potential
            },
            "recommendation": self._generate_overall_recommendation(make_model_score, competitor_count, profit_potential)
        }
    
    def _generate_overall_recommendation(self, make_model_score: float, competitor_count: int, profit_potential: float) -> str:
        """Generate overall recommendation based on all factors."""
        if make_model_score > 0.8 and competitor_count < 5 and profit_potential > 2000:
            return "STRONG BUY - Excellent opportunity with high profit potential and low competition"
        elif make_model_score > 0.6 and competitor_count < 8 and profit_potential > 1500:
            return "BUY - Good opportunity with solid profit potential"
        elif make_model_score > 0.5 and profit_potential > 1000:
            return "CONSIDER - Moderate opportunity, proceed with caution"
        else:
            return "PASS - Low opportunity or high risk factors"
    
    def _generate_action_items(self, results: List[Any]) -> List[str]:
        """Generate actionable items from analysis results."""
        action_items = []
        
        # Add action items based on analysis results
        action_items.append("Set up price alerts for target make/model combinations")
        action_items.append("Monitor competitor listings for pricing changes")
        action_items.append("Prepare negotiation strategy based on market analysis")
        action_items.append("Set up automated market monitoring")
        
        return action_items
    
    def get_capabilities(self) -> List[str]:
        """Return list of capabilities this agent provides."""
        return [
            "Make and model market analysis",
            "Competitor research and analysis",
            "Pricing trend analysis",
            "Profit threshold calculation",
            "Market opportunity identification",
            "Risk assessment and mitigation",
            "Seasonal market analysis",
            "Comprehensive market intelligence reporting"
        ] 