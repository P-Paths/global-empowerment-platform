"""
Synthesis API endpoints

Combines vision analysis, market intelligence, and user metadata
into final polished output using OpenAI synthesis.
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Any, Dict, Optional
import logging
from app.agents.synthesis_agent import synthesize
from app.utils.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter()

class SynthesisRequest(BaseModel):
    """Request model for synthesis"""
    vision_json: Dict[str, Any] = Field(..., description="Vision analysis from /enhanced-analyze")
    market_json: Dict[str, Any] = Field(..., description="Market intelligence from /market-intelligence/analyze")
    user_meta: Dict[str, Any] = Field(..., description="User-provided vehicle metadata")

class SynthesisResponse(BaseModel):
    """Response model for synthesis"""
    success: bool
    data: Dict[str, Any]
    error_message: Optional[str] = None

@router.post("/synthesis/compose", response_model=SynthesisResponse)
async def compose(
    request: SynthesisRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Synthesize vision analysis, market intelligence, and user metadata.
    
    Takes:
    - vision_json: Output from /enhanced-analyze PASS-1
    - market_json: Output from /market-intelligence/analyze
    - user_meta: Vehicle details (year, make, model, mileage, price, location, etc.)
    
    Returns:
    - summary_md: Executive summary (Markdown)
    - listing_text: Facebook-ready listing
    - feature_tags: Array of feature tags
    - pricing_reco: Pricing recommendations (list_price, floor_price)
    """
    try:
        user_email = current_user.get("email", "unknown")
        logger.info(f"Synthesis request from: {user_email}")
        
        result = await synthesize(
            vision_json=request.vision_json,
            market_json=request.market_json,
            user_meta=request.user_meta
        )
        
        return SynthesisResponse(
            success=True,
            data=result
        )
        
    except RuntimeError as e:
        error_msg = str(e) if str(e) else f"RuntimeError: {type(e).__name__}"
        logger.error(f"Synthesis failed: {error_msg}")
        raise HTTPException(status_code=500, detail=error_msg)
    except Exception as e:
        error_msg = str(e) if str(e) else f"Unknown error: {type(e).__name__}"
        logger.error(f"Synthesis exception: {error_msg}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Synthesis failed: {error_msg}")

