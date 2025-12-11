"""
Pitch Deck Generator Service
Uses OpenAI to generate professional pitch decks from user input
"""
import os
import json
import logging
import asyncio
from typing import Dict, Any, Optional
from openai import OpenAI

logger = logging.getLogger(__name__)


class PitchDeckGenerator:
    """Generate pitch decks using OpenAI"""
    
    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY not found in environment variables")
        
        self.client = OpenAI(api_key=api_key)
        self.model = "gpt-4o"  # Use GPT-4 for better quality
    
    async def generate_pitch_deck(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate a complete pitch deck from user input.
        
        Args:
            input_data: Dictionary containing:
                - companyName: Company name
                - tagline: Company tagline
                - problem: Problem statement
                - solution: Solution description
                - marketSize: Market size information
                - businessModel: Business model
                - traction: Traction/metrics
                - team: Team information
                - ask: Funding ask
        
        Returns:
            Dictionary containing structured pitch deck with slides
        """
        try:
            system_prompt = """You are an expert pitch deck consultant. Generate a professional, investor-ready pitch deck in JSON format.

The pitch deck should follow the standard structure:
1. Title Slide (company name, tagline, logo placeholder)
2. Problem (clear problem statement)
3. Solution (your product/service)
4. Market Opportunity (TAM/SAM/SOM)
5. Business Model (how you make money)
6. Traction (key metrics, milestones, growth)
7. Team (key team members and their expertise)
8. Competition (competitive landscape)
9. Financials (revenue model, projections if available)
10. The Ask (funding amount and use of funds)

Return a JSON object with this structure:
{
  "slides": [
    {
      "slide_number": 1,
      "title": "Slide Title",
      "content": "Main content text",
      "subtitle": "Optional subtitle",
      "bullets": ["bullet 1", "bullet 2"],
      "slide_type": "title|problem|solution|market|business_model|traction|team|competition|financials|ask"
    }
  ],
  "metadata": {
    "company_name": "...",
    "tagline": "...",
    "total_slides": 10
  }
}

Make it professional, compelling, and investor-ready. Use clear, concise language."""
            
            user_prompt = f"""Generate a pitch deck for:

Company Name: {input_data.get('companyName', 'N/A')}
Tagline: {input_data.get('tagline', 'N/A')}
Problem: {input_data.get('problem', 'N/A')}
Solution: {input_data.get('solution', 'N/A')}
Market Size: {input_data.get('marketSize', 'N/A')}
Business Model: {input_data.get('businessModel', 'N/A')}
Traction: {input_data.get('traction', 'N/A')}
Team: {input_data.get('team', 'N/A')}
Funding Ask: {input_data.get('ask', 'N/A')}

Generate a complete, professional pitch deck with all 10 slides. Return ONLY valid JSON, no markdown formatting."""
            
            logger.info(f"Generating pitch deck for: {input_data.get('companyName', 'Unknown')}")
            
            # Run the synchronous OpenAI call in a thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                lambda: self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    temperature=0.7,
                    max_tokens=4000,
                    response_format={"type": "json_object"}  # Force JSON response
                )
            )
            
            result_text = response.choices[0].message.content
            
            # Parse JSON response
            try:
                deck_json = json.loads(result_text)
                logger.info(f"Successfully generated pitch deck with {len(deck_json.get('slides', []))} slides")
                return deck_json
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse JSON response: {e}")
                logger.error(f"Response was: {result_text[:500]}")
                # Fallback: create a basic structure
                return self._create_fallback_deck(input_data)
                
        except Exception as e:
            logger.error(f"Error generating pitch deck: {e}", exc_info=True)
            # Return a fallback deck structure
            return self._create_fallback_deck(input_data)
    
    def _create_fallback_deck(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a basic pitch deck structure if AI generation fails"""
        company_name = input_data.get('companyName', 'Your Company')
        tagline = input_data.get('tagline', 'Your tagline')
        
        return {
            "slides": [
                {
                    "slide_number": 1,
                    "title": company_name,
                    "content": tagline,
                    "slide_type": "title"
                },
                {
                    "slide_number": 2,
                    "title": "The Problem",
                    "content": input_data.get('problem', 'Describe the problem you are solving.'),
                    "slide_type": "problem"
                },
                {
                    "slide_number": 3,
                    "title": "Our Solution",
                    "content": input_data.get('solution', 'Describe your solution.'),
                    "slide_type": "solution"
                },
                {
                    "slide_number": 4,
                    "title": "Market Opportunity",
                    "content": input_data.get('marketSize', 'Describe your target market.'),
                    "slide_type": "market"
                },
                {
                    "slide_number": 5,
                    "title": "Business Model",
                    "content": input_data.get('businessModel', 'Explain how you make money.'),
                    "slide_type": "business_model"
                },
                {
                    "slide_number": 6,
                    "title": "Traction",
                    "content": input_data.get('traction', 'Share your key metrics and milestones.'),
                    "slide_type": "traction"
                },
                {
                    "slide_number": 7,
                    "title": "Team",
                    "content": input_data.get('team', 'Introduce your key team members.'),
                    "slide_type": "team"
                },
                {
                    "slide_number": 8,
                    "title": "The Ask",
                    "content": input_data.get('ask', 'Specify your funding needs.'),
                    "slide_type": "ask"
                }
            ],
            "metadata": {
                "company_name": company_name,
                "tagline": tagline,
                "total_slides": 8
            }
        }
