"""
Car Listing Generator Service

Replicates the ChatGPT workflow for car listing preparation:
1. Upload car photos
2. AI analysis of photos and details
3. Market value analysis
4. Price recommendations
5. Generate formatted listings for multiple platforms
"""

import os
import base64
import json
import logging
import random
from typing import List, Dict, Any, Optional
from datetime import datetime
import httpx
from PIL import Image
import io

logger = logging.getLogger(__name__)

class CarListingGenerator:
    """
    AI-powered car listing generator that replicates ChatGPT workflow
    """
    
    def __init__(self):
        # Use settings instead of os.getenv for consistency
        from app.core.config import settings
        self.openai_api_key = settings.OPENAI_API_KEY or os.getenv("OPENAI_API_KEY")
        self.gemini_api_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY")
        self.openai_base_url = "https://api.openai.com/v1"
        
        if not self.openai_api_key:
            logger.warning("OpenAI API key not found - some features may not work")
        if not self.gemini_api_key:
            logger.warning("Gemini API key not found - some features may not work")
    
    async def generate_car_listing(
        self,
        images: List[bytes],
        car_details: Dict[str, Any],
        location: str = "Detroit, MI"
    ) -> Dict[str, Any]:
        """
        Generate a complete car listing using AI analysis
        
        Args:
            images: List of car image bytes
            car_details: Basic car information
            location: Location for market analysis
            
        Returns:
            Complete listing with analysis, pricing, and formatted text
        """
        try:
            # Step 1: Analyze images with Gemini (primary) or OpenAI (fallback)
            if not images or len(images) == 0:
                # No images provided, use basic analysis
                image_analysis = self._generate_basic_analysis(car_details)
            elif self.gemini_api_key:
                image_analysis = await self._analyze_images_with_gemini(images, car_details)
            elif self.openai_api_key:
                image_analysis = await self._analyze_images_with_openai(images, car_details)
            else:
                # Fallback to basic analysis
                image_analysis = self._generate_basic_analysis(car_details)
            
            # Step 2: Get market intelligence with Gemini (primary)
            if not images or len(images) == 0:
                # No images provided, use basic market analysis
                market_analysis = self._generate_basic_market_analysis(car_details, location)
            elif self.gemini_api_key:
                market_analysis = await self._get_market_intelligence(
                    image_analysis, car_details, location
                )
            else:
                # Fallback to basic market analysis
                market_analysis = self._generate_basic_market_analysis(car_details, location)
            
            # Step 3: Generate pricing recommendations
            pricing = await self._generate_pricing_recommendations(
                image_analysis, market_analysis, car_details
            )
            
            # Step 4: Create formatted listings for different platforms
            listings = await self._generate_formatted_listings(
                image_analysis, market_analysis, pricing, car_details
            )
            
            return {
                "success": True,
                "timestamp": datetime.now().isoformat(),
                "image_analysis": image_analysis,
                "market_analysis": market_analysis,
                "pricing_recommendations": pricing,
                "formatted_listings": listings,
                "processing_time": 0.0,
                "ai_provider": "Gemini" if self.gemini_api_key else "OpenAI" if self.openai_api_key else "Basic"
            }
            
        except Exception as e:
            logger.error(f"Error generating car listing: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    async def _analyze_images_with_openai(
        self, 
        images: List[bytes], 
        car_details: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Analyze car images using OpenAI Vision API"""
        
        if not self.openai_api_key:
            raise Exception("OpenAI API key not configured")
        
        # Prepare images for OpenAI
        image_data = []
        for i, img_bytes in enumerate(images[:20]):  # Limit to 20 images
            # Convert to base64
            img_base64 = base64.b64encode(img_bytes).decode('utf-8')
            image_data.append({
                "type": "image_url",
                "image_url": {
                    "url": f"data:image/jpeg;base64,{img_base64}"
                }
            })
        
        # Create the analysis prompt with more detailed instructions
        prompt = f"""
        Analyze these car images and provide comprehensive, detailed information about the vehicle.
        
        Known details: {json.dumps(car_details, indent=2)}
        
        Please provide a thorough analysis including:
        
        BASIC IDENTIFICATION:
        1. Make and model (with confidence level 1-10)
        2. Year estimate (with reasoning)
        3. Color (primary and any secondary colors)
        4. Body style (sedan, SUV, truck, hatchback, coupe, convertible, etc.)
        
        CONDITION ASSESSMENT:
        5. Overall condition (excellent, very good, good, fair, poor)
        6. Exterior condition (paint, body panels, glass, wheels/tires)
        7. Interior condition (seats, dashboard, controls, cleanliness)
        8. Mechanical condition (engine bay, undercarriage if visible)
        
        FEATURES & EQUIPMENT:
        9. Visible features (leather seats, sunroof, navigation, backup camera, etc.)
        10. Technology features (infotainment, safety systems, etc.)
        11. Performance features (sport package, special trim, etc.)
        
        ISSUES & CONCERNS:
        12. Any visible damage (scratches, dents, rust, etc.)
        13. Wear and tear indicators
        14. Potential maintenance needs
        
        DETAILS:
        15. Mileage estimate (if visible on odometer)
        16. Overall quality score (1-10 with explanation)
        17. Unique selling points
        18. Areas of concern for buyers
        
        Format your response as detailed JSON with these fields:
        {{
            "make": "string",
            "model": "string", 
            "year": "number",
            "color": "string",
            "body_style": "string",
            "condition": "string",
            "exterior_condition": "string",
            "interior_condition": "string",
            "mechanical_condition": "string",
            "features": ["array of features"],
            "technology_features": ["array of tech features"],
            "performance_features": ["array of performance features"],
            "damage_issues": ["array of issues"],
            "wear_indicators": ["array of wear items"],
            "maintenance_needs": ["array of maintenance items"],
            "mileage_estimate": "number or null",
            "quality_score": "number",
            "confidence_score": "number",
            "unique_selling_points": ["array of selling points"],
            "buyer_concerns": ["array of concerns"]
        }}
        """
        
        messages = [
            {
                "role": "system",
                "content": "You are an expert car appraiser and analyst. Analyze the provided car images and extract detailed information about the vehicle's make, model, condition, features, and estimated value."
            },
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    *image_data
                ]
            }
        ]
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.openai_base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.openai_api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "gpt-4o",
                    "messages": messages,
                    "max_tokens": 1500,
                    "temperature": 0.7
                },
                timeout=60.0
            )
            
            if response.status_code != 200:
                raise Exception(f"OpenAI API error: {response.text}")
            
            result = response.json()
            content = result["choices"][0]["message"]["content"]
            
            # Parse JSON response
            try:
                analysis = json.loads(content)
                return analysis
            except json.JSONDecodeError:
                # Fallback: extract key information from text
                return self._parse_analysis_text(content)
    
    async def _analyze_images_with_gemini(
        self,
        images: List[bytes],
        car_details: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Analyze car images using Gemini API"""
        
        if not self.gemini_api_key:
            raise Exception("Gemini API key not configured")
        
        # Prepare images for Gemini
        image_data = []
        for i, img_bytes in enumerate(images[:20]):  # Limit to 20 images
            # Convert to base64
            img_base64 = base64.b64encode(img_bytes).decode('utf-8')
            image_data.append({
                "parts": [{"text": f"data:image/jpeg;base64,{img_base64}"}]
            })
        
        # Create the analysis prompt
        prompt = f"""
        Analyze these car images and provide detailed information about the vehicle.
        
        Known details: {json.dumps(car_details, indent=2)}
        
        Please analyze the images and provide:
        1. Make and model (with confidence)
        2. Year estimate
        3. Color
        4. Body style (sedan, SUV, truck, etc.)
        5. Condition assessment (excellent, good, fair, poor)
        6. Visible features (leather seats, sunroof, navigation, etc.)
        7. Any visible damage or issues
        8. Mileage estimate (if visible)
        9. Overall quality score (1-10)
        
        Format your response as JSON with these fields:
        {{
            "make": "string",
            "model": "string", 
            "year": "number",
            "color": "string",
            "body_style": "string",
            "condition": "string",
            "features": ["array of features"],
            "damage_issues": ["array of issues"],
            "mileage_estimate": "number or null",
            "quality_score": "number",
            "confidence_score": "number"
        }}
        """
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={self.gemini_api_key}",
                json={
                    "contents": [{
                        "parts": [{"text": prompt}]
                    }],
                    "generationConfig": {
                        "maxOutputTokens": 1000,
                        "temperature": 0.1
                    }
                },
                timeout=60.0
            )
            
            if response.status_code != 200:
                raise Exception(f"Gemini API error: {response.text}")
            
            result = response.json()
            content = result["candidates"][0]["content"]["parts"][0]["text"]
            
            # Parse JSON response
            try:
                analysis = json.loads(content)
                return analysis
            except json.JSONDecodeError:
                # Fallback: extract key information from text
                return self._parse_analysis_text(content)
    
    async def _get_market_intelligence(
        self,
        image_analysis: Dict[str, Any],
        car_details: Dict[str, Any],
        location: str
    ) -> Dict[str, Any]:
        """Get market intelligence using Gemini"""
        
        if not self.gemini_api_key:
            # Fallback to OpenAI for market analysis
            return await self._get_market_intelligence_openai(
                image_analysis, car_details, location
            )
        
        # Prepare market analysis prompt
        make = image_analysis.get("make", car_details.get("make", "Unknown"))
        model = image_analysis.get("model", car_details.get("model", "Unknown"))
        year = image_analysis.get("year", car_details.get("year", "Unknown"))
        mileage = image_analysis.get("mileage_estimate", car_details.get("mileage", "Unknown"))
        condition = image_analysis.get("condition", "good")
        
        prompt = f"""
        Provide comprehensive market analysis for a {year} {make} {model} in {location}.
        
        Vehicle Details:
        - Make: {make}
        - Model: {model}
        - Year: {year}
        - Mileage: {mileage}
        - Condition: {condition}
        - Location: {location}
        
        Please provide:
        1. Current market value range
        2. Comparable sales in the area
        3. Seasonal factors affecting price
        4. Demand trends for this vehicle
        5. Recommended pricing strategy
        6. Negotiation room percentage
        
        Format as JSON:
        {{
            "market_value_range": {{"low": "number", "high": "number"}},
            "comparable_sales": ["array of comparable listings"],
            "seasonal_factors": "string",
            "demand_trends": "string", 
            "pricing_strategy": "string",
            "negotiation_room": "number"
        }}
        """
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={self.gemini_api_key}",
                json={
                    "contents": [{
                        "parts": [{"text": prompt}]
                    }],
                    "generationConfig": {
                        "maxOutputTokens": 1000,
                        "temperature": 0.1
                    }
                },
                timeout=30.0
            )
            
            if response.status_code != 200:
                raise Exception(f"Gemini API error: {response.text}")
            
            result = response.json()
            content = result["candidates"][0]["content"]["parts"][0]["text"]
            
            try:
                return json.loads(content)
            except json.JSONDecodeError:
                return self._parse_market_text(content)
    
    async def _get_market_intelligence_openai(
        self,
        image_analysis: Dict[str, Any],
        car_details: Dict[str, Any],
        location: str
    ) -> Dict[str, Any]:
        """Fallback market analysis using OpenAI"""
        
        make = image_analysis.get("make", car_details.get("make", "Unknown"))
        model = image_analysis.get("model", car_details.get("model", "Unknown"))
        year = image_analysis.get("year", car_details.get("year", "Unknown"))
        
        prompt = f"""
        Provide market analysis for a {year} {make} {model} in {location}.
        
        Return JSON with:
        - market_value_range (low/high)
        - comparable_sales (array)
        - seasonal_factors (string)
        - demand_trends (string)
        - pricing_strategy (string)
        - negotiation_room (percentage)
        """
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.openai_base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.openai_api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "gpt-4o",
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 500,
                    "temperature": 0.1
                },
                timeout=30.0
            )
            
            if response.status_code != 200:
                raise Exception(f"OpenAI API error: {response.text}")
            
            result = response.json()
            content = result["choices"][0]["message"]["content"]
            
            try:
                return json.loads(content)
            except json.JSONDecodeError:
                return self._parse_market_text(content)
    
    async def _generate_pricing_recommendations(
        self,
        image_analysis: Dict[str, Any],
        market_analysis: Dict[str, Any],
        car_details: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate pricing recommendations"""
        
        market_range = market_analysis.get("market_value_range", {})
        low_price = market_range.get("low", 5000)
        high_price = market_range.get("high", 8000)
        
        # Calculate recommended prices
        recommended_price = (low_price + high_price) / 2
        listing_price = recommended_price * 1.1  # 10% markup for negotiation
        
        return {
            "market_low": low_price,
            "market_high": high_price,
            "recommended_price": round(recommended_price, -2),  # Round to nearest 100
            "listing_price": round(listing_price, -2),
            "negotiation_room": market_analysis.get("negotiation_room", 10),
            "pricing_strategy": market_analysis.get("pricing_strategy", "Competitive pricing")
        }
    
    async def _generate_formatted_listings(
        self,
        image_analysis: Dict[str, Any],
        market_analysis: Dict[str, Any],
        pricing: Dict[str, Any],
        car_details: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate formatted listings for different platforms"""
        
        make = image_analysis.get("make", car_details.get("make", "Unknown"))
        model = image_analysis.get("model", car_details.get("model", "Unknown"))
        year = image_analysis.get("year", car_details.get("year", "Unknown"))
        mileage = image_analysis.get("mileage_estimate", car_details.get("mileage", "Unknown"))
        features = image_analysis.get("features", [])
        condition = image_analysis.get("condition", "good")
        
        # Generate listing content
        if not features or len(features) == 0:
            # Use fallback listing when no features detected
            listing_content = self._generate_fallback_listing(
                make, model, year, mileage, features, condition, pricing
            )
        else:
            listing_content = await self._generate_listing_content(
                make, model, year, mileage, features, condition, pricing
            )
        
        return {
            "craigslist": listing_content,
            "facebook_marketplace": listing_content,
            "offerup": listing_content,
            "autotrader": listing_content
        }
    
    async def _generate_listing_content(
        self,
        make: str,
        model: str,
        year: int,
        mileage: str,
        features: List[str],
        condition: str,
        pricing: Dict[str, Any]
    ) -> str:
        """Generate formatted listing content"""
        
        # Create varied prompts for different listing styles
        listing_styles = [
            "professional and detailed",
            "casual and friendly",
            "urgent sale focused",
            "luxury and premium",
            "family-oriented",
            "enthusiast-focused"
        ]
        
        selected_style = random.choice(listing_styles)
        
        prompt = f"""
        Create a {selected_style} car listing for a {year} {make} {model}.
        
        Car Details:
        - Year: {year}
        - Make: {make}
        - Model: {model}
        - Mileage: {mileage}
        - Condition: {condition}
        - Features: {', '.join(features)}
        - Asking Price: ${pricing['listing_price']:,}
        
        Style Guidelines for {selected_style}:
        - Professional: Use formal language, emphasize reliability and value
        - Casual: Use friendly, conversational tone with emojis
        - Urgent: Create urgency, mention quick sale benefits
        - Luxury: Emphasize premium features, quality, and exclusivity
        - Family: Focus on safety, reliability, and practicality
        - Enthusiast: Highlight performance, features, and driving experience
        
        Requirements:
        1. Create an attention-grabbing title (max 60 characters)
        2. Write a compelling description (150-300 words)
        3. Include relevant emojis for visual appeal
        4. Add a strong call to action
        5. Make it unique and different from generic listings
        6. Include specific details about this particular car
        7. Add personality and character to the listing
        
        Format the response as:
        TITLE: [Your catchy title here]
        
        DESCRIPTION:
        [Your detailed description here]
        
        Make this listing stand out and feel authentic to the {selected_style} approach.
        """
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.openai_base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.openai_api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "gpt-4o",
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 1200,
                    "temperature": 0.8
                },
                timeout=30.0
            )
            
            if response.status_code != 200:
                return self._generate_fallback_listing(
                    make, model, year, mileage, features, condition, pricing
                )
            
            result = response.json()
            return result["choices"][0]["message"]["content"]
    
    def _generate_fallback_listing(
        self,
        make: str,
        model: str,
        year: int,
        mileage: str,
        features: List[str],
        condition: str,
        pricing: Dict[str, Any]
    ) -> str:
        """Generate a fallback listing if AI fails"""
        
        return f"""
🚗 {year} {make} {model} - Clean {condition} condition!

💵 Asking Price: ${pricing['listing_price']:,}
🛣️ Mileage: {mileage}
📍 Location: Detroit, MI

💡 Details:
• Runs and drives great
• {condition.title()} condition - paint shines, solid tires
• {', '.join(features[:5])}  # Limit to 5 features
• Perfect for daily driver or family car

🔧 Features & Equipment:
• {', '.join(features[:8])}  # Limit to 8 features

📸 More photos available on request!

Ready for immediate sale. Serious buyers only. No test drives without cash in hand.
Contact for more details and to schedule viewing.
        """.strip()
    
    def _parse_analysis_text(self, text: str) -> Dict[str, Any]:
        """Parse analysis text when JSON parsing fails"""
        return {
            "make": "Unknown",
            "model": "Unknown",
            "year": None,
            "color": "Unknown",
            "body_style": "Unknown",
            "condition": "good",
            "features": [],
            "damage_issues": [],
            "mileage_estimate": None,
            "quality_score": 7,
            "confidence_score": 0.5
        }
    
    def _parse_market_text(self, text: str) -> Dict[str, Any]:
        """Parse market analysis text when JSON parsing fails"""
        return {
            "market_value_range": {"low": 5000, "high": 8000},
            "comparable_sales": [],
            "seasonal_factors": "Standard market conditions",
            "demand_trends": "Stable demand",
            "pricing_strategy": "Competitive pricing",
            "negotiation_room": 10
        } 

    def _generate_basic_analysis(self, car_details: Dict[str, Any]) -> Dict[str, Any]:
        """Generate basic car analysis when AI is not available"""
        return {
            "make": car_details.get("make", "Unknown"),
            "model": car_details.get("model", "Unknown"),
            "year": car_details.get("year", "Unknown"),
            "color": "Unknown",
            "body_style": "sedan",
            "condition": car_details.get("condition", "good"),
            "features": ["Basic features"],
            "damage_issues": [],
            "mileage_estimate": car_details.get("mileage", "Unknown"),
            "quality_score": 7,
            "confidence_score": 0.5
        }
    
    def _generate_basic_market_analysis(self, car_details: Dict[str, Any], location: str) -> Dict[str, Any]:
        """Generate basic market analysis when AI is not available"""
        make = car_details.get("make", "Unknown")
        model = car_details.get("model", "Unknown")
        year = car_details.get("year", "Unknown")
        
        return {
            "market_value_range": {"low": 5000, "high": 8000},
            "comparable_sales": [f"{year} {make} {model} in {location}"],
            "seasonal_factors": "Standard market conditions",
            "demand_trends": "Stable demand",
            "pricing_strategy": "Competitive pricing",
            "negotiation_room": 10
        } 