"""
Enhanced Image Analysis Service

Analyzes multiple car images to extract detailed information using OpenAI Vision API:
- Make, model, year from badges and text
- Mileage from odometer photos
- Interior features from dashboard/interior shots
- Exterior features from body shots
- Condition assessment from all images
"""

import logging
import base64
from typing import List, Dict, Any, Optional
import openai
import os
import json
import re
from datetime import datetime

logger = logging.getLogger(__name__)

class EnhancedImageAnalyzer:
    def __init__(self):
        from app.core.config import settings
        api_key = settings.OPENAI_API_KEY or os.getenv('OPENAI_API_KEY')
        if not api_key:
            raise ValueError("OpenAI API key not found")
        self.client = openai.OpenAI(api_key=api_key)
        
    async def analyze_car_images(self, image_bytes: List[bytes], car_details: Dict[str, Any]) -> Dict[str, Any]:
        """
        Two-pass analysis: Pass 1 (Analysis) → Pass 2 (Formatting)
        """
        try:
            # Pass 1: Analysis - Extract features and confidence scores
            analysis_result = await self._pass_1_analysis(image_bytes, car_details)
            logger.info(f"Pass 1 completed: {analysis_result}")
            
            # Pass 2: Formatting - Generate final listing text
            final_result = await self._pass_2_formatting(car_details, analysis_result)
            logger.info(f"Pass 2 completed: {final_result}")
            
            return final_result
            
        except Exception as e:
            logger.error(f"Two-pass analysis failed: {e}")
            return self._get_fallback_analysis(car_details)
    
    async def analyze_car_images_simple(self, image_bytes: List[bytes], car_details: Dict[str, Any]) -> Dict[str, Any]:
        """
        Simple single-pass analysis for faster response
        """
        try:
            logger.info("Starting simple analysis")
            
            # Convert images to base64
            image_data = []
            for img_bytes in image_bytes:
                base64_image = base64.b64encode(img_bytes).decode('utf-8')
                image_data.append({
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/jpeg;base64,{base64_image}"
                    }
                })
            
            # Simple prompt for quick analysis
            system_prompt = """You are a car listing assistant. Analyze the car images and extract key information. Return a JSON response with the following structure:
{
  "make": "detected make or 'Unknown'",
  "model": "detected model or 'Unknown'", 
  "year": "detected year or 'Unknown'",
  "trim": "detected trim level or 'Unknown'",
  "mileage": "detected mileage or 'Unknown'",
  "features": ["list", "of", "detected", "features"],
  "condition": "overall condition assessment",
  "description": "brief description of the car"
}"""
            
            user_prompt = f"""Analyze these {len(image_bytes)} car images and extract information. User provided: Make={car_details.get('make')}, Model={car_details.get('model')}, Year={car_details.get('year')}. Return only valid JSON."""
            
            # Make OpenAI API call
            response = await self.client.chat.completions.acreate(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt + "\n\nImages:", "content_type": "text"},
                    *image_data
                ],
                max_tokens=1000,
                temperature=0.1
            )
            
            # Parse response
            content = response.choices[0].message.content
            logger.info(f"OpenAI response: {content}")
            
            # Try to extract JSON from response
            try:
                # Find JSON in the response
                json_start = content.find('{')
                json_end = content.rfind('}') + 1
                if json_start != -1 and json_end != 0:
                    json_str = content[json_start:json_end]
                    result = json.loads(json_str)
                else:
                    result = self._get_fallback_analysis(car_details)
            except json.JSONDecodeError:
                logger.warning("Failed to parse JSON from OpenAI response")
                result = self._get_fallback_analysis(car_details)
            
            # Add user-provided details
            result.update({
                "user_make": car_details.get("make"),
                "user_model": car_details.get("model"),
                "user_year": car_details.get("year"),
                "user_mileage": car_details.get("mileage"),
                "user_price": car_details.get("price"),
                "analysis_type": "simple"
            })
            
            logger.info("Simple analysis completed successfully")
            return result
            
        except Exception as e:
            logger.error(f"Simple analysis failed: {e}")
            return self._get_fallback_analysis(car_details)
    
    async def _pass_1_analysis(self, image_bytes: List[bytes], car_details: Dict[str, Any]) -> Dict[str, Any]:
        """Pass 1: Analyze images and extract features with confidence scores"""
        
        # Convert images to base64
        image_data = []
        for img_bytes in image_bytes:
            base64_image = base64.b64encode(img_bytes).decode('utf-8')
            image_data.append({
                "type": "image_url",
                "image_url": {
                    "url": f"data:image/jpeg;base64,{base64_image}"
                }
            })
        
        # Prepare user input for the prompt
        user_input = {
            "year": car_details.get("year", "Unknown"),
            "make": car_details.get("make", "Unknown"),
            "model": car_details.get("model", "Unknown"),
            "trim": car_details.get("trim", ""),
            "miles": car_details.get("mileage", "Unknown"),
            "title_status": car_details.get("titleStatus", "clean"),
            "ask_price": car_details.get("price", "15000"),
            "location": "Refer",  # Default location
            "notes": car_details.get("aboutVehicle", "")
        }
        
        # System prompt for Pass 1
        system_prompt = """You are an expert vehicle appraiser and listing assistant.
Analyze the provided car photos and the user's facts.
Return STRICT JSON that matches the schema. Do not add prose.
If a fact is not clearly visible, leave value null or set a low confidence.
Never contradict user_input—only augment it with detections and confidence scores.
Prefer obvious badges (model, trim, AWD), interior options (leather, sunroof, heated seats),
infotainment clues (CarPlay/Android Auto icons, touchscreen), and backup camera lines."""
        
        # User prompt for Pass 1
        user_prompt = f"""TASK:
1) Inspect ALL images.
2) Extract make/model/year/trim/drivetrain if visually clear.
3) Detect features from the allowed set: backup_camera, touchscreen, carplay_android,
   bluetooth, usb, leather_seats, heated_seats, sunroof, cruise_control, alloy_wheels.
4) Add brief condition_notes if visible (e.g., "minor curb rash LF wheel").
5) Choose best cover photo index (front 3/4 exterior preferred).
6) Return STRICT JSON only that matches analysis_result schema below.

USER_INPUT:
{json.dumps(user_input, indent=2)}

SCHEMA (REQUIRED OUTPUT SHAPE):
{{
  "detected": {{
    "make": {{"value": "string or null", "confidence": 0.0-1.0}},
    "model": {{"value": "string or null", "confidence": 0.0-1.0}},
    "year": {{"value": "number or null", "confidence": 0.0-1.0}},
    "trim": {{"value": "string or null", "confidence": 0.0-1.0}},
    "drivetrain": {{"value": "FWD/AWD or null", "confidence": 0.0-1.0}},
    "body_style": {{"value": "string", "confidence": 0.0-1.0}},
    "features": {{
      "backup_camera": true/false,
      "touchscreen": true/false,
      "carplay_android": true/false,
      "bluetooth": true/false,
      "usb": true/false,
      "leather_seats": true/false,
      "heated_seats": true/false,
      "sunroof": true/false,
      "cruise_control": true/false,
      "alloy_wheels": true/false
    }},
    "condition_notes": ["string array"]
  }},
  "cover_photo_index": 0,
  "confidence_overall": 0.0-1.0,
  "warnings": ["string array"]
}}

RULES:
- Only include features you can see or infer with high confidence.
- If trim or drivetrain are uncertain (confidence < 0.6), keep value null or generic.
- Do not invent mileage, VIN, or options that aren't visible.
- Keep condition_notes short phrases, 0–4 max.
- Output JSON only. No markdown, no explanations."""
        
        # Prepare messages for OpenAI
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": [
                {"type": "text", "text": user_prompt}
            ] + image_data}
        ]
        
        # Call OpenAI for Pass 1
        response = self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            temperature=0,
            max_tokens=1200
        )
        
        # Parse the JSON response
        try:
            analysis_result = json.loads(response.choices[0].message.content)
            return analysis_result
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Pass 1 JSON: {e}")
            return self._get_default_analysis_result()
    
    async def _pass_2_formatting(self, car_details: Dict[str, Any], analysis_result: Dict[str, Any]) -> Dict[str, Any]:
        """Pass 2: Format the analysis into final listing text"""
        
        # Prepare user input
        user_input = {
            "year": car_details.get("year", "Unknown"),
            "make": car_details.get("make", "Unknown"),
            "model": car_details.get("model", "Unknown"),
            "trim": car_details.get("trim", ""),
            "miles": car_details.get("mileage", "Unknown"),
            "title_status": car_details.get("titleStatus", "clean"),
            "ask_price": car_details.get("price", "15000"),
            "location": "Refer",
            "notes": car_details.get("aboutVehicle", "")
        }
        
        # System prompt for Pass 2
        system_prompt = """You format vehicle listings for Facebook Marketplace.
Use the Quick-Post template EXACTLY.
- Align bullets with a leading "•" and a single space.
- No extra blank lines.
- Do NOT place "+" after the year (e.g., "2019 Chevrolet", not "2019+ Chevrolet").
- Place AWD/FWD only inside the Details section line list, not the title.
- Keep 5–7 features bullets maximum.
- Vary the final hook line; avoid repeating the same phrase every time.
- Output ONLY the final post text. No JSON, no commentary."""
        
        # User prompt for Pass 2
        user_prompt = f"""DATA:
user_input = {json.dumps(user_input, indent=2)}
detected = {json.dumps(analysis_result.get('detected', {}), indent=2)}

TEMPLATE:
🚙 {{year}} {{make}} {{model}}{{trim_suffix}}
💰 Asking Price: ${{ask_price}}
🏁 Mileage: {{miles}} miles
📄 Title: {{title_status}}
📍 Location: {{location}}

💡 Details:
• Runs and drives excellent
• Transmission shifts smooth
{{awdx_line_optional}}
• {{body_summary}}
• Clean interior & exterior

🔧 Features & Equipment:
{{features_bullets}}

🔑 {{one_line_hook}}

📱 Message me to schedule a test drive or ask questions!

TEMPLATE RULES:
- year/make/model come from user_input; include trim only if provided by user_input OR detected.confidence ≥ 0.6.
- {{trim_suffix}} = "" OR " " + trim
- {{awdx_line_optional}}:
   • If drivetrain == "AWD": include the line "• All-wheel drive"
   • Else omit this line completely (no blank gap)
- {{body_summary}}: short phrase, e.g., "Roomy midsize sedan" / "Compact SUV with good cargo space" / "Sporty coupe"
- {{features_bullets}}: choose up to 6 true features from this priority order:
   backup_camera, touchscreen, carplay_android, bluetooth, usb, heated_seats,
   leather_seats, sunroof, cruise_control, alloy_wheels, power_windows_locks
  (If "power windows & locks" isn't detected, you may add it as a generic feature.)
- {{one_line_hook}}: rotate among lines like:
  "Great on gas and easy to maintain."
  "Comfortable daily driver with modern tech."
  "Smooth, quiet ride—ready for trips or commuting."
  "Solid and reliable—priced to move."
- No duplicate bullets. No trailing spaces. No extra blank lines. No plus sign after the year.
- Output the finished post text only."""
        
        # Call OpenAI for Pass 2
        response = self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.2,
            max_tokens=900
        )
        
        # Get the formatted post text
        post_text = response.choices[0].message.content.strip()
        
        # Return the final result
        return {
            "post_text": post_text,
            "cover_photo_index": analysis_result.get("cover_photo_index", 0),
            "extracted": analysis_result,
            "success": True
        }
    
    def _get_default_analysis_result(self) -> Dict[str, Any]:
        """Default analysis result when Pass 1 fails"""
        return {
            "detected": {
                "make": {"value": None, "confidence": 0.0},
                "model": {"value": None, "confidence": 0.0},
                "year": {"value": None, "confidence": 0.0},
                "trim": {"value": None, "confidence": 0.0},
                "drivetrain": {"value": None, "confidence": 0.0},
                "body_style": {"value": "vehicle", "confidence": 0.5},
                "features": {
                    "backup_camera": False,
                    "touchscreen": False,
                    "carplay_android": False,
                    "bluetooth": False,
                    "usb": False,
                    "leather_seats": False,
                    "heated_seats": False,
                    "sunroof": False,
                    "cruise_control": False,
                    "alloy_wheels": False
                },
                "condition_notes": []
            },
            "cover_photo_index": 0,
            "confidence_overall": 0.0,
            "warnings": ["Analysis failed, using default values"]
        }
    
    def _get_fallback_analysis(self, car_details: Dict[str, Any]) -> Dict[str, Any]:
        """Fallback when the entire analysis fails"""
        return {
            "post_text": f"""🚙 {car_details.get('year', 'Unknown')} {car_details.get('make', 'Unknown')} {car_details.get('model', 'Unknown')}
💰 Asking Price: ${car_details.get('price', '15000')}
🏁 Mileage: {car_details.get('mileage', 'Unknown')} miles
📄 Title: {car_details.get('titleStatus', 'clean')}
📍 Location: Refer

💡 Details:
• Runs and drives excellent
• Transmission shifts smooth
• Clean interior & exterior

🔧 Features & Equipment:
• Power windows & locks
• Cruise control
• Bluetooth connectivity

🔑 Great on gas and easy to maintain.

📱 Message me to schedule a test drive or ask questions!""",
            "cover_photo_index": 0,
            "extracted": self._get_default_analysis_result(),
            "success": False,
            "error": "Analysis failed, using fallback template"
        }


# Create global instance (lazy initialization)
_enhanced_analyzer = None

def get_enhanced_analyzer():
    """Get the enhanced analyzer instance (lazy initialization)"""
    global _enhanced_analyzer
    if _enhanced_analyzer is None:
        _enhanced_analyzer = EnhancedImageAnalyzer()
    return _enhanced_analyzer
