"""
Synthesis Agent for Accorria

Combines:
- Vision analysis (from OpenAI Vision /enhanced-analyze PASS-1)
- Market intelligence (from Gemini Google Search)
- User metadata (form inputs)

Produces:
- Executive summary (Markdown)
- Facebook-ready listing text
- Feature tags
- Pricing recommendations
"""

import json
import logging
import os
from typing import Any, Dict
import httpx
import openai
from app.core.config import settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are Accorria's professional listing writer. 

You combine three data sources:
1. VISION: Detailed image analysis with confirmed features
2. MARKET: Real-time market data, pricing, and demand trends
3. USER_META: Vehicle details provided by the user

Rules:
- Only state features that are CONFIRMED (in Vision or User data)
- Mark typical-but-unconfirmed features as 'typical for this trim'
- No wild claims or assumptions
- Use ✅ safe, professional wording
- Keep Facebook formatting clean and bullet-aligned
- Match Accorria's exact formatting style
"""

USER_PROMPT_TEMPLATE = """You will receive three JSON blobs: VISION, MARKET, and USER_META.

TASKS:

1) Write a concise executive summary (120–180 words) of:
   - Market position relative to competitors
   - Price fit within market range
   - Demand trends and seasonality
   - Risk assessment
   Format as Markdown.

2) Generate a Facebook-ready listing in this EXACT format:

🚘 {year} {make} {model} {trim}{badge}
💰 Price: ${list_price}
{finance_line_if_true}
🏁 Mileage: {miles} miles
📄 Title: {title_status}
📍 Location: {location}

💡 Details:
• {engine}/{drivetrain} — {condition_note}
• Cold A/C + hot heat
• {interior_condition} + {exterior_condition}
• {recent_work_or_tires}

🔧 Features & Equipment:
{confirmed_features_bulleted}

🔑 {compelling_benefit_line}

📱 DM to schedule a test drive or get pre-approved — first come, first served!

3) Suggest top 8–12 feature tags (lowercase, hyphenated, e.g., "backup-camera", "heated-seats")

4) Suggest pricing recommendation:
   - list_price: Optimal asking price based on market
   - floor_price: Minimum acceptable price (for negotiation)

Return valid JSON with this exact structure:
{{
  "summary_md": "markdown text here",
  "listing_text": "full facebook listing here",
  "feature_tags": ["tag1", "tag2", ...],
  "pricing_reco": {{
    "list_price": 11500,
    "floor_price": 10500
  }}
}}

USER_META:
{user_meta}

VISION:
{vision}

MARKET:
{market}
"""


async def synthesize(
    vision_json: Dict[str, Any],
    market_json: Dict[str, Any],
    user_meta: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Synthesize vision analysis, market intelligence, and user metadata into final output.
    
    Args:
        vision_json: Output from /enhanced-analyze PASS-1 (OpenAI Vision)
        market_json: Output from /market-intelligence/analyze (Gemini Google Search)
        user_meta: User-provided vehicle details
        
    Returns:
        Dict with: summary_md, listing_text, feature_tags, pricing_reco
    """
    # Get OpenAI API key
    openai_api_key = settings.OPENAI_API_KEY or os.getenv("OPENAI_API_KEY")
    if not openai_api_key:
        raise RuntimeError("OPENAI_API_KEY is not configured")
    
    # Format the prompt with all three data sources
    user_prompt = USER_PROMPT_TEMPLATE.format(
        user_meta=json.dumps(user_meta, indent=2),
        vision=json.dumps(vision_json, indent=2),
        market=json.dumps(market_json, indent=2)
    )
    
    logger.info("[SYNTHESIS] Starting OpenAI synthesis of vision + market + user data")
    print(f"[SYNTHESIS] ===== SYNTHESIS REQUEST =====")
    print(f"[SYNTHESIS] User Meta: {user_meta.get('make')} {user_meta.get('model')} {user_meta.get('year')}")
    print(f"[SYNTHESIS] Vision has: {bool(vision_json)}")
    print(f"[SYNTHESIS] Market has: {bool(market_json)}")
    
    try:
        # Initialize OpenAI client
        client = openai.OpenAI(api_key=openai_api_key)
        
        # Call OpenAI with JSON response format
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.2,
            max_tokens=2000,
            response_format={"type": "json_object"}
        )
        
        # Extract and parse JSON response
        content = response.choices[0].message.content
        result = json.loads(content)
        
        logger.info("[SYNTHESIS] ✅ Synthesis completed successfully")
        print(f"[SYNTHESIS] ✅ Synthesis completed")
        print(f"[SYNTHESIS] Summary length: {len(result.get('summary_md', ''))} chars")
        print(f"[SYNTHESIS] Listing length: {len(result.get('listing_text', ''))} chars")
        print(f"[SYNTHESIS] Feature tags: {len(result.get('feature_tags', []))} tags")
        print(f"[SYNTHESIS] ==========================")
        
        return result
        
    except json.JSONDecodeError as e:
        logger.error(f"[SYNTHESIS] Failed to parse JSON response: {e}")
        logger.error(f"[SYNTHESIS] Response content: {content[:500]}")
        raise RuntimeError(f"Synthesis returned invalid JSON: {str(e)}")
    except Exception as e:
        logger.error(f"[SYNTHESIS] Synthesis failed: {e}", exc_info=True)
        raise RuntimeError(f"Synthesis failed: {str(e)}")

