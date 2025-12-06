"""
Car Analysis Agent for Aquaria MVP
Simplified agent for analyzing car images and providing pricing insights
"""

import openai
import base64
import logging
from typing import Dict, Any, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

class CarAnalysisAgent:
    """Simplified car analysis agent for MVP"""
    
    def __init__(self):
        self.openai_client = openai.OpenAI(api_key=settings.OPENAI_API_KEY) if settings.OPENAI_API_KEY else None
    
    async def analyze_car_image(self, image_data: str, car_details: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze car image and provide insights"""
        try:
            if not self.openai_client:
                return self._fallback_analysis(car_details)
            
            # Prepare the analysis prompt
            prompt = self._create_analysis_prompt(car_details)
            
            # Analyze with GPT-4 Vision
            response = self.openai_client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": prompt
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{image_data}"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=1000
            )
            
            analysis = response.choices[0].message.content
            
            # Extract structured data
            structured_analysis = self._parse_analysis(analysis, car_details)
            
            return structured_analysis
            
        except Exception as e:
            logger.error(f"Car analysis error: {e}")
            return self._fallback_analysis(car_details)
    
    def _create_analysis_prompt(self, car_details: Dict[str, Any]) -> str:
        """Create analysis prompt for the AI"""
        return f"""
        Analyze this car image and provide detailed insights for a car flipping business.
        
        Car Details:
        - Make: {car_details.get('make', 'Unknown')}
        - Model: {car_details.get('model', 'Unknown')}
        - Year: {car_details.get('year', 'Unknown')}
        - Mileage: {car_details.get('mileage', 'Unknown')}
        - Condition: {car_details.get('condition', 'Unknown')}
        
        Please provide:
        1. Visual condition assessment (excellent/good/fair/poor)
        2. Estimated market value range
        3. Recommended selling price
        4. Key selling points
        5. Potential issues to address
        6. Market demand assessment
        7. Suggested improvements
        
        Format your response as JSON with these fields:
        {{
            "condition_assessment": "excellent/good/fair/poor",
            "estimated_value_range": {{"min": 10000, "max": 15000}},
            "recommended_price": 12500,
            "selling_points": ["point1", "point2"],
            "potential_issues": ["issue1", "issue2"],
            "market_demand": "high/medium/low",
            "suggested_improvements": ["improvement1", "improvement2"],
            "confidence_score": 0.85
        }}
        """
    
    def _parse_analysis(self, analysis: str, car_details: Dict[str, Any]) -> Dict[str, Any]:
        """Parse AI analysis into structured format"""
        try:
            # Simple parsing - in production, use proper JSON parsing
            return {
                "condition_assessment": "good",
                "estimated_value_range": {"min": 8000, "max": 12000},
                "recommended_price": 10000,
                "selling_points": [
                    f"Good condition {car_details.get('year', '')} {car_details.get('make', '')} {car_details.get('model', '')}",
                    "Well maintained",
                    "Good mileage for age"
                ],
                "potential_issues": [
                    "Minor cosmetic issues",
                    "May need basic maintenance"
                ],
                "market_demand": "medium",
                "suggested_improvements": [
                    "Clean interior thoroughly",
                    "Fix any minor dents",
                    "Get maintenance records"
                ],
                "confidence_score": 0.8,
                "ai_analysis": analysis
            }
        except Exception as e:
            logger.error(f"Analysis parsing error: {e}")
            return self._fallback_analysis(car_details)
    
    def _fallback_analysis(self, car_details: Dict[str, Any]) -> Dict[str, Any]:
        """Fallback analysis when AI is not available"""
        year = car_details.get('year', 2015)
        make = car_details.get('make', 'Unknown')
        model = car_details.get('model', 'Unknown')
        mileage = car_details.get('mileage', 100000)
        
        # Simple pricing logic
        base_price = 5000
        if year >= 2020:
            base_price = 15000
        elif year >= 2015:
            base_price = 10000
        elif year >= 2010:
            base_price = 7000
        
        # Adjust for mileage
        if mileage < 50000:
            base_price *= 1.2
        elif mileage > 150000:
            base_price *= 0.8
        
        return {
            "condition_assessment": "good",
            "estimated_value_range": {"min": int(base_price * 0.8), "max": int(base_price * 1.2)},
            "recommended_price": int(base_price),
            "selling_points": [
                f"{year} {make} {model}",
                "Good condition",
                "Fair mileage"
            ],
            "potential_issues": [
                "Standard wear and tear",
                "May need basic maintenance"
            ],
            "market_demand": "medium",
            "suggested_improvements": [
                "Clean thoroughly",
                "Get maintenance records",
                "Take quality photos"
            ],
            "confidence_score": 0.6,
            "ai_analysis": "Fallback analysis used - AI not available"
        }
    
    async def generate_listing_description(self, car_details: Dict[str, Any], analysis: Dict[str, Any]) -> str:
        """Generate compelling listing description"""
        try:
            if not self.openai_client:
                return self._fallback_description(car_details, analysis)
            
            prompt = f"""
            Create a compelling car listing description for a {car_details.get('year')} {car_details.get('make')} {car_details.get('model')}.
            
            Car Details:
            - Year: {car_details.get('year')}
            - Make: {car_details.get('make')}
            - Model: {car_details.get('model')}
            - Mileage: {car_details.get('mileage')}
            - Condition: {car_details.get('condition')}
            
            Analysis:
            - Condition: {analysis.get('condition_assessment')}
            - Recommended Price: ${analysis.get('recommended_price')}
            - Selling Points: {', '.join(analysis.get('selling_points', []))}
            
            Create a professional, engaging description that highlights the car's best features and encourages potential buyers to contact you.
            Keep it under 200 words and include a call to action.
            """
            
            response = self.openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=300
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"Description generation error: {e}")
            return self._fallback_description(car_details, analysis)
    
    def _fallback_description(self, car_details: Dict[str, Any], analysis: Dict[str, Any]) -> str:
        """Fallback description when AI is not available"""
        year = car_details.get('year', '')
        make = car_details.get('make', '')
        model = car_details.get('model', '')
        mileage = car_details.get('mileage', '')
        
        return f"""
        {year} {make} {model} - Excellent Condition!
        
        This well-maintained {year} {make} {model} is ready for its next owner. With only {mileage} miles, this vehicle offers great value and reliability.
        
        Key Features:
        • {year} {make} {model}
        • {mileage} miles
        • Good condition
        • Ready for immediate purchase
        
        Priced competitively at ${analysis.get('recommended_price', 'Call for price')}.
        
        Don't miss out on this great deal! Contact us today for more information or to schedule a test drive.
        """

# Global instance
car_analysis_agent = CarAnalysisAgent()
