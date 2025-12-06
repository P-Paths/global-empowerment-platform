"""
Data Extraction Agent - Parses user text input and extracts structured vehicle data

This agent processes user's text input (e.g., "2014 Chevy Cruze, 148k miles, rebuilt title")
and extracts structured data like year, make, model, mileage, title status, etc.
"""

from datetime import datetime
from typing import Dict, Any, List, Optional
from .base_agent import BaseAgent, AgentOutput
import logging
import re
import json

logger = logging.getLogger(__name__)


class DataExtractionAgent(BaseAgent):
    """Data Extraction Agent - Parses user text input and extracts vehicle details"""
    
    def __init__(self, config=None):
        super().__init__("data_extraction_agent", config)
        
        # Common car makes and models for validation
        self.car_makes = {
            'toyota', 'honda', 'ford', 'chevrolet', 'chevy', 'nissan', 'bmw', 'mercedes', 
            'audi', 'volkswagen', 'vw', 'hyundai', 'kia', 'mazda', 'subaru', 'lexus',
            'acura', 'infiniti', 'volvo', 'jeep', 'dodge', 'chrysler', 'pontiac',
            'saturn', 'buick', 'cadillac', 'lincoln', 'mercury', 'oldsmobile'
        }
        
        # Common title statuses
        self.title_statuses = {
            'clean', 'rebuilt', 'salvage', 'junk', 'parts', 'flood', 'fire', 'theft'
        }
        
        # Common conditions
        self.conditions = {
            'excellent', 'good', 'fair', 'poor', 'new', 'used', 'certified'
        }
    
    async def process(self, input_data: Dict[str, Any]) -> AgentOutput:
        """
        Process user text input and extract structured vehicle data
        
        Args:
            input_data: Dict containing text input
                - text: str (user's text input)
                - car_info: Dict (optional existing car info)
        
        Returns:
            AgentOutput with extracted vehicle data
        """
        start_time = datetime.now()
        
        try:
            # Extract text input
            text = input_data.get("text", "").lower().strip()
            car_info = input_data.get("car_info", {})
            
            if not text:
                raise ValueError("No text input provided")
            
            # Extract vehicle data
            extracted_data = await self._extract_vehicle_data(text, car_info)
            
            processing_time = (datetime.now() - start_time).total_seconds()
            
            return AgentOutput(
                agent_name=self.name,
                timestamp=datetime.now(),
                success=True,
                data={
                    "extracted_data": extracted_data,
                    "original_text": text,
                    "confidence_score": extracted_data.get("confidence_score", 0.8),
                    "missing_fields": extracted_data.get("missing_fields", []),
                    "validation_errors": extracted_data.get("validation_errors", [])
                },
                confidence=extracted_data.get("confidence_score", 0.8),
                processing_time=processing_time
            )
            
        except Exception as e:
            logger.error(f"Data extraction agent error: {e}")
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
    
    async def _extract_vehicle_data(self, text: str, car_info: Dict) -> Dict[str, Any]:
        """
        Extract vehicle data from text input
        """
        extracted = {
            "year": None,
            "make": None,
            "model": None,
            "mileage": None,
            "title_status": None,
            "condition": None,
            "color": None,
            "additional_details": [],
            "confidence_score": 0.8,
            "missing_fields": [],
            "validation_errors": []
        }
        
        # Extract year (4-digit year)
        year_match = re.search(r'\b(19|20)\d{2}\b', text)
        if year_match:
            extracted["year"] = int(year_match.group())
        
        # Extract mileage
        mileage_patterns = [
            r'(\d{1,3}(?:,\d{3})*)\s*(?:k|thousand|miles?)',
            r'(\d{1,3}(?:,\d{3})*)\s*m',
            r'(\d{1,3}(?:,\d{3})*)\s*miles?'
        ]
        
        for pattern in mileage_patterns:
            mileage_match = re.search(pattern, text)
            if mileage_match:
                mileage_str = mileage_match.group(1).replace(',', '')
                extracted["mileage"] = int(mileage_str)
                break
        
        # Extract make and model
        words = text.split()
        for i, word in enumerate(words):
            if word in self.car_makes:
                extracted["make"] = word
                # Look for model in next few words
                if i + 1 < len(words):
                    model_words = []
                    for j in range(i + 1, min(i + 4, len(words))):
                        if not re.match(r'\d', words[j]):  # Not a number
                            model_words.append(words[j])
                    if model_words:
                        extracted["model"] = ' '.join(model_words)
                break
        
        # Extract title status
        for status in self.title_statuses:
            if status in text:
                extracted["title_status"] = status
                break
        
        # Extract condition
        for condition in self.conditions:
            if condition in text:
                extracted["condition"] = condition
                break
        
        # Extract color (basic colors)
        colors = ['black', 'white', 'red', 'blue', 'green', 'yellow', 'silver', 'gray', 'grey', 'brown', 'orange', 'purple']
        for color in colors:
            if color in text:
                extracted["color"] = color
                break
        
        # Extract additional details
        additional_keywords = ['accident', 'damage', 'rust', 'leather', 'sunroof', 'navigation', 'bluetooth', 'backup camera']
        for keyword in additional_keywords:
            if keyword in text:
                extracted["additional_details"].append(keyword)
        
        # Calculate confidence score
        confidence = 0.8
        if extracted["year"]:
            confidence += 0.1
        if extracted["make"]:
            confidence += 0.1
        if extracted["mileage"]:
            confidence += 0.1
        if extracted["title_status"]:
            confidence += 0.1
        
        extracted["confidence_score"] = min(confidence, 1.0)
        
        # Identify missing fields
        missing_fields = []
        if not extracted["year"]:
            missing_fields.append("year")
        if not extracted["make"]:
            missing_fields.append("make")
        if not extracted["model"]:
            missing_fields.append("model")
        if not extracted["mileage"]:
            missing_fields.append("mileage")
        if not extracted["title_status"]:
            missing_fields.append("title_status")
        
        extracted["missing_fields"] = missing_fields
        
        # Validate extracted data
        validation_errors = []
        if extracted["year"] and (extracted["year"] < 1900 or extracted["year"] > 2030):
            validation_errors.append("Invalid year")
        if extracted["mileage"] and extracted["mileage"] > 1000000:
            validation_errors.append("Unrealistic mileage")
        
        extracted["validation_errors"] = validation_errors
        
        return extracted
    
    def get_capabilities(self) -> List[str]:
        """Return list of capabilities this agent provides"""
        return [
            "Extract vehicle year from text input",
            "Extract vehicle make and model",
            "Extract mileage information",
            "Extract title status (clean, rebuilt, salvage, etc.)",
            "Extract vehicle condition",
            "Extract color information",
            "Identify additional features and details",
            "Validate extracted data for accuracy",
            "Provide confidence scores for extractions",
            "Identify missing required fields"
        ]
    
    def validate_input(self, input_data: Dict[str, Any]) -> bool:
        """Validate input data before processing"""
        if not input_data.get("text"):
            return False
        return True
    
    def preprocess(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Preprocess input data before main processing"""
        # Clean and normalize text
        text = input_data.get("text", "")
        text = text.lower().strip()
        text = re.sub(r'\s+', ' ', text)  # Normalize whitespace
        
        return {
            **input_data,
            "text": text
        }
    
    def postprocess(self, output_data: Dict[str, Any]) -> Dict[str, Any]:
        """Postprocess output data after main processing"""
        # Add any additional processing here
        return output_data
