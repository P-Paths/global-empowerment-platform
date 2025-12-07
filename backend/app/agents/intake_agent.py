"""
Intake Agent - Handles initial car data processing and validation

This agent processes incoming car data, validates information,
and prepares data for other agents in the pipeline.
"""

from datetime import datetime
from typing import Dict, Any, List, Optional
from .base_agent import BaseAgent, AgentOutput
import logging
import re
import json

logger = logging.getLogger(__name__)


class IntakeAgent(BaseAgent):
    """Intake Agent - Handles initial car data processing and validation"""
    
    def __init__(self, config=None):
        super().__init__("intake_agent", config)
        # Common car makes and models for validation
        self.car_makes = {
            "honda": ["civic", "accord", "cr-v", "pilot", "odyssey", "fit", "hr-v"],
            "toyota": ["camry", "corolla", "rav4", "highlander", "sienna", "prius", "tacoma"],
            "ford": ["f-150", "escape", "explorer", "mustang", "focus", "fusion", "edge"],
            "chevrolet": ["silverado", "equinox", "traverse", "camaro", "malibu", "cruze"],
            "bmw": ["3-series", "5-series", "x3", "x5", "m3", "m5"],
            "mercedes": ["c-class", "e-class", "s-class", "gle", "glc", "amg"],
            "audi": ["a4", "a6", "q5", "q7", "s4", "rs"],
            "lexus": ["es", "is", "rx", "nx", "ls", "gs"],
            "nissan": ["altima", "sentra", "rogue", "murano", "pathfinder", "maxima"],
            "hyundai": ["elantra", "sonata", "tucson", "santa fe", "kona", "palisade"],
            "kia": ["forte", "k5", "sportage", "sorento", "telluride", "soul"],
            "volkswagen": ["jetta", "passat", "tiguan", "atlas", "golf", "gti"],
            "mazda": ["3", "6", "cx-5", "cx-9", "mx-5", "cx-30"],
            "subaru": ["impreza", "legacy", "outback", "forester", "crosstrek", "ascent"],
            "dodge": ["challenger", "charger", "durango", "journey", "grand caravan"],
            "jeep": ["wrangler", "grand cherokee", "cherokee", "compass", "renegade"],
            "porsche": ["911", "cayenne", "macan", "panamera", "cayman", "boxster"],
            "ferrari": ["f8", "sf90", "roma", "portofino", "812", "296"],
            "lamborghini": ["huracan", "aventador", "urus", "revuelto", "gallardo"],
            "tesla": ["model 3", "model y", "model s", "model x", "cybertruck"]
        }
        
        # Common car conditions
        self.conditions = ["excellent", "good", "fair", "poor", "salvage", "rebuilt"]
        
        # Common title statuses
        self.title_statuses = ["clean", "salvage", "rebuilt", "flood", "fire", "theft"]
    
    async def process(self, input_data: Dict[str, Any]) -> AgentOutput:
        """
        Process and validate incoming car data
        
        Args:
            input_data: Dict containing car information
                - make: str (car make)
                - model: str (car model)
                - year: int (car year)
                - mileage: str/int (mileage)
                - price: float (asking price)
                - condition: str (car condition)
                - title_status: str (title status)
                - location: str (location)
                - description: str (description)
                - images: List[bytes] (car images)
        
        Returns:
            AgentOutput with processed and validated data
        """
        start_time = datetime.now()
        
        try:
            # Extract and validate basic car information
            processed_data = await self._process_car_data(input_data)
            
            # Validate and clean data
            validation_result = self._validate_data(processed_data)
            
            # Enrich data with additional information
            enriched_data = await self._enrich_data(processed_data)
            
            # Prepare data for other agents
            agent_ready_data = self._prepare_for_agents(enriched_data)
            
            processing_time = (datetime.now() - start_time).total_seconds()
            
            return AgentOutput(
                agent_name=self.name,
                timestamp=datetime.now(),
                success=True,
                data={
                    "processed_data": agent_ready_data,
                    "validation_results": validation_result,
                    "data_quality_score": self._calculate_quality_score(validation_result),
                    "processing_time_seconds": processing_time,
                    "enrichment_added": enriched_data.get("enrichment", {})
                },
                confidence=0.95,
                processing_time=processing_time
            )
            
        except Exception as e:
            logger.error(f"Intake agent error: {e}")
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
    
    async def _process_car_data(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process and clean incoming car data"""
        processed = {}
        
        # Process make and model
        make_raw = input_data.get("make")
        make = (str(make_raw).strip() if make_raw and isinstance(make_raw, str) else "").lower()
        model_raw = input_data.get("model")
        model = (str(model_raw).strip() if model_raw and isinstance(model_raw, str) else "").lower()
        
        # Normalize make
        make_mapping = {
            "honda": "honda", "toyota": "toyota", "ford": "ford", "chevrolet": "chevrolet",
            "chevy": "chevrolet", "bmw": "bmw", "mercedes": "mercedes", "benz": "mercedes",
            "audi": "audi", "lexus": "lexus", "nissan": "nissan", "hyundai": "hyundai",
            "kia": "kia", "volkswagen": "volkswagen", "vw": "volkswagen", "mazda": "mazda",
            "subaru": "subaru", "dodge": "dodge", "jeep": "jeep", "porsche": "porsche",
            "ferrari": "ferrari", "lamborghini": "lamborghini", "tesla": "tesla"
        }
        
        processed["make"] = make_mapping.get(make, make)
        processed["model"] = model
        
        # Process year
        year = input_data.get("year")
        if year:
            try:
                year_int = int(year)
                if 1900 <= year_int <= datetime.now().year + 1:
                    processed["year"] = year_int
                else:
                    processed["year"] = None
            except (ValueError, TypeError):
                processed["year"] = None
        
        # Process mileage
        mileage = input_data.get("mileage")
        if mileage:
            try:
                # Remove common mileage indicators
                mileage_str = str(mileage).lower()
                mileage_str = re.sub(r'[,\s]', '', mileage_str)
                mileage_str = re.sub(r'(miles?|mi|k|km)', '', mileage_str)
                
                mileage_int = int(mileage_str)
                if mileage_int > 0:
                    processed["mileage"] = mileage_int
                else:
                    processed["mileage"] = None
            except (ValueError, TypeError):
                processed["mileage"] = None
        
        # Process price
        price = input_data.get("price")
        if price:
            try:
                # Remove currency symbols and commas
                price_str = str(price).replace("$", "").replace(",", "")
                price_float = float(price_str)
                if price_float > 0:
                    processed["price"] = price_float
                else:
                    processed["price"] = None
            except (ValueError, TypeError):
                processed["price"] = None
        
        # Process condition
        condition_raw = input_data.get("condition")
        condition = (str(condition_raw).strip() if condition_raw and isinstance(condition_raw, str) else "").lower()
        processed["condition"] = condition if condition in self.conditions else "good"
        
        # Process title status
        title_status_raw = input_data.get("title_status")
        title_status = (str(title_status_raw).strip() if title_status_raw and isinstance(title_status_raw, str) else "").lower()
        processed["title_status"] = title_status if title_status in self.title_statuses else "clean"
        
        # Process location
        location = input_data.get("location", "").strip()
        processed["location"] = location
        
        # Process description
        description = input_data.get("description", "").strip()
        processed["description"] = description
        
        # Process images
        images = input_data.get("images", [])
        if isinstance(images, list):
            processed["images"] = images
        else:
            processed["images"] = []
        
        # Add metadata
        processed["metadata"] = {
            "processed_at": datetime.now().isoformat(),
            "original_data": input_data,
            "data_source": input_data.get("source", "manual_input")
        }
        
        return processed
    
    def _validate_data(self, processed_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate processed car data"""
        validation_results = {
            "make_valid": False,
            "model_valid": False,
            "year_valid": False,
            "mileage_valid": False,
            "price_valid": False,
            "condition_valid": False,
            "title_status_valid": False,
            "location_valid": False,
            "overall_valid": False,
            "warnings": [],
            "errors": []
        }
        
        # Validate make
        make = processed_data.get("make")
        if make and make in self.car_makes:
            validation_results["make_valid"] = True
        elif make:
            validation_results["warnings"].append(f"Unknown make: {make}")
        
        # Validate model
        model = processed_data.get("model")
        make = processed_data.get("make")
        if model and make and make in self.car_makes:
            if model in self.car_makes[make]:
                validation_results["model_valid"] = True
            else:
                validation_results["warnings"].append(f"Model '{model}' not found for make '{make}'")
        elif model:
            validation_results["model_valid"] = True  # Assume valid if we can't validate
        
        # Validate year
        year = processed_data.get("year")
        if year and 1900 <= year <= datetime.now().year + 1:
            validation_results["year_valid"] = True
        elif year:
            validation_results["errors"].append(f"Invalid year: {year}")
        
        # Validate mileage
        mileage = processed_data.get("mileage")
        if mileage and mileage > 0:
            validation_results["mileage_valid"] = True
        elif mileage is not None:
            validation_results["warnings"].append(f"Invalid mileage: {mileage}")
        
        # Validate price
        price = processed_data.get("price")
        if price and price > 0:
            validation_results["price_valid"] = True
        elif price is not None:
            validation_results["warnings"].append(f"Invalid price: {price}")
        
        # Validate condition
        condition = processed_data.get("condition")
        if condition in self.conditions:
            validation_results["condition_valid"] = True
        
        # Validate title status
        title_status = processed_data.get("title_status")
        if title_status in self.title_statuses:
            validation_results["title_status_valid"] = True
        
        # Validate location
        location = processed_data.get("location")
        if location and len(location.strip()) > 0:
            validation_results["location_valid"] = True
        else:
            validation_results["warnings"].append("Location is required")
        
        # Calculate overall validity
        required_fields = ["make", "model", "year", "mileage", "price", "location"]
        valid_required = sum(1 for field in required_fields 
                           if validation_results.get(f"{field}_valid", False))
        
        validation_results["overall_valid"] = valid_required >= 4  # At least 4 out of 6 required fields
        
        return validation_results
    
    async def _enrich_data(self, processed_data: Dict[str, Any]) -> Dict[str, Any]:
        """Enrich processed data with additional information"""
        enriched = processed_data.copy()
        enrichment = {}
        
        # Add car category based on make/model
        make = enriched.get("make")
        model = enriched.get("model")
        year = enriched.get("year")
        
        if make and model:
            # Determine car category
            category = self._determine_car_category(make, model, year)
            enrichment["category"] = category
            
            # Add market segment
            segment = self._determine_market_segment(make, model, year)
            enrichment["market_segment"] = segment
            
            # Add estimated value range
            if year and make and model:
                value_range = self._estimate_value_range(make, model, year)
                enrichment["estimated_value_range"] = value_range
        
        # Add location analysis
        location = enriched.get("location")
        if location:
            location_info = self._analyze_location(location)
            enrichment["location_analysis"] = location_info
        
        # Add data quality indicators
        enrichment["data_completeness"] = self._calculate_completeness(enriched)
        enrichment["data_confidence"] = self._calculate_confidence(enriched)
        
        enriched["enrichment"] = enrichment
        return enriched
    
    def _determine_car_category(self, make: str, model: str, year: int = None) -> str:
        """Determine car category based on make, model, and year"""
        if not make or not model:
            return "unknown"
        
        make_lower = make.lower()
        model_lower = model.lower()
        
        # Luxury cars
        luxury_makes = ["bmw", "mercedes", "audi", "lexus", "porsche", "ferrari", "lamborghini"]
        if make_lower in luxury_makes:
            return "luxury"
        
        # Sports cars
        sports_models = ["mustang", "camaro", "challenger", "charger", "corvette", "911", "cayman", "boxster"]
        if model_lower in sports_models:
            return "sports"
        
        # SUVs
        suv_models = ["cr-v", "rav4", "escape", "equinox", "x3", "x5", "gle", "glc", "q5", "q7", "nx", "rx"]
        if model_lower in suv_models:
            return "suv"
        
        # Trucks
        truck_models = ["f-150", "silverado", "tacoma", "tundra", "ram"]
        if model_lower in truck_models:
            return "truck"
        
        # Electric/Hybrid
        if make_lower == "tesla" or "hybrid" in model_lower or "electric" in model_lower:
            return "electric"
        
        # Default to sedan
        return "sedan"
    
    def _determine_market_segment(self, make: str, model: str, year: int = None) -> str:
        """Determine market segment for pricing analysis"""
        category = self._determine_car_category(make, model, year)
        
        if category == "luxury":
            return "premium"
        elif category == "sports":
            return "performance"
        elif category == "electric":
            return "alternative_fuel"
        else:
            return "mainstream"
    
    def _estimate_value_range(self, make: str, model: str, year: int) -> Dict[str, float]:
        """Estimate value range based on make, model, and year"""
        # This is a simplified estimation - in production, this would use real market data
        base_value = 15000  # Default base value
        
        # Adjust for year
        current_year = datetime.now().year
        age_factor = max(0.3, 1 - (current_year - year) * 0.1)
        
        # Adjust for make/model popularity
        popular_makes = ["honda", "toyota", "ford", "chevrolet"]
        if make.lower() in popular_makes:
            popularity_factor = 1.1
        else:
            popularity_factor = 0.9
        
        estimated_value = base_value * age_factor * popularity_factor
        
        return {
            "low": estimated_value * 0.8,
            "average": estimated_value,
            "high": estimated_value * 1.2
        }
    
    def _analyze_location(self, location: str) -> Dict[str, Any]:
        """Analyze location for market insights"""
        # Simplified location analysis
        location_lower = location.lower()
        
        # Determine if it's a major market
        major_markets = ["new york", "los angeles", "chicago", "houston", "phoenix", "philadelphia", "san antonio", "san diego", "dallas", "san jose"]
        is_major_market = any(market in location_lower for market in major_markets)
        
        # Determine region
        regions = {
            "northeast": ["new york", "boston", "philadelphia", "washington", "baltimore"],
            "southeast": ["atlanta", "miami", "orlando", "tampa", "charlotte"],
            "midwest": ["chicago", "detroit", "milwaukee", "minneapolis", "indianapolis"],
            "southwest": ["houston", "dallas", "austin", "san antonio", "phoenix"],
            "west": ["los angeles", "san francisco", "seattle", "portland", "denver"]
        }
        
        region = "other"
        for reg, cities in regions.items():
            if any(city in location_lower for city in cities):
                region = reg
                break
        
        return {
            "is_major_market": is_major_market,
            "region": region,
            "market_size": "large" if is_major_market else "medium"
        }
    
    def _calculate_completeness(self, data: Dict[str, Any]) -> float:
        """Calculate data completeness score"""
        required_fields = ["make", "model", "year", "mileage", "price", "condition", "title_status", "location"]
        present_fields = sum(1 for field in required_fields if data.get(field))
        return present_fields / len(required_fields)
    
    def _calculate_confidence(self, data: Dict[str, Any]) -> float:
        """Calculate data confidence score"""
        # Simplified confidence calculation
        confidence = 0.8  # Base confidence
        
        # Boost confidence for complete data
        if data.get("make") and data.get("model") and data.get("year"):
            confidence += 0.1
        
        # Boost confidence for valid mileage
        if data.get("mileage") and data.get("mileage") > 0:
            confidence += 0.05
        
        # Boost confidence for valid price
        if data.get("price") and data.get("price") > 0:
            confidence += 0.05
        
        return min(1.0, confidence)
    
    def _prepare_for_agents(self, enriched_data: Dict[str, Any]) -> Dict[str, Any]:
        """Prepare data for consumption by other agents"""
        agent_data = {
            "car_info": {
                "make": enriched_data.get("make"),
                "model": enriched_data.get("model"),
                "year": enriched_data.get("year"),
                "mileage": enriched_data.get("mileage"),
                "price": enriched_data.get("price"),
                "condition": enriched_data.get("condition"),
                "title_status": enriched_data.get("title_status"),
                "location": enriched_data.get("location"),
                "description": enriched_data.get("description")
            },
            "images": enriched_data.get("images", []),
            "enrichment": enriched_data.get("enrichment", {}),
            "metadata": enriched_data.get("metadata", {}),
            "validation": enriched_data.get("validation", {})
        }
        
        return agent_data
    
    def _calculate_quality_score(self, validation_result: Dict[str, Any]) -> float:
        """Calculate overall data quality score"""
        if not validation_result.get("overall_valid"):
            return 0.0
        
        valid_fields = sum(1 for key, value in validation_result.items() 
                          if key.endswith("_valid") and value)
        total_fields = len([key for key in validation_result.keys() if key.endswith("_valid")])
        
        return valid_fields / total_fields if total_fields > 0 else 0.0
    
    def get_capabilities(self) -> List[str]:
        """Return list of capabilities this agent provides"""
        return [
            "data_processing",
            "data_validation",
            "data_enrichment",
            "car_classification",
            "market_segmentation",
            "quality_assessment"
        ]
    
    def validate_input(self, input_data: Dict[str, Any]) -> bool:
        """Validate input data before processing"""
        # At minimum, we need either make/model or images
        has_basic_info = bool(input_data.get("make") or input_data.get("model"))
        has_images = bool(input_data.get("images") and len(input_data.get("images", [])) > 0)
        
        return has_basic_info or has_images 