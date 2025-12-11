"""
GEM Platform - Pitch Deck Generator API
Handles pitch deck generation and management
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Dict, Any, Optional
from datetime import datetime
import uuid
import logging

from app.core.database import get_db
from app.models.gep_models import Profile, PitchDeck
from app.utils.auth import get_current_user
from app.services.pitchdeck_generator import PitchDeckGenerator
from pydantic import BaseModel

router = APIRouter()
logger = logging.getLogger(__name__)


class PitchDeckResponse(BaseModel):
    id: str
    user_id: str
    deck_json: Dict[str, Any]
    created_at: datetime
    
    class Config:
        from_attributes = True


class PitchDeckGenerateRequest(BaseModel):
    companyName: Optional[str] = ""
    tagline: Optional[str] = ""
    problem: Optional[str] = ""
    solution: Optional[str] = ""
    marketSize: Optional[str] = ""
    businessModel: Optional[str] = ""
    traction: Optional[str] = ""
    team: Optional[str] = ""
    ask: Optional[str] = ""
    
    class Config:
        # Allow extra fields to be ignored (for backwards compatibility)
        extra = "ignore"


@router.post("/pitchdeck/generate", response_model=PitchDeckResponse)
async def generate_pitchdeck(
    deck_data: PitchDeckGenerateRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Generate a new pitch deck using AI"""
    try:
        logger.info(f"Received pitch deck generation request: {deck_data.model_dump()}")
        current_user = get_current_user(request)
        user_id = current_user.get("sub") or current_user.get("id")
        
        # Get profile
        result = await db.execute(
            select(Profile).where(Profile.user_id == uuid.UUID(user_id))
        )
        profile = result.scalar_one_or_none()
        
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        # Generate pitch deck using AI
        logger.info(f"Generating pitch deck for user {user_id}")
        generator = PitchDeckGenerator()
        
        # Convert Pydantic model to dict
        input_data = deck_data.model_dump()
        
        # Generate the deck
        generated_deck = await generator.generate_pitch_deck(input_data)
        
        # Create pitch deck record
        new_deck = PitchDeck(
            user_id=profile.id,
            deck_json=generated_deck
        )
        
        db.add(new_deck)
        await db.commit()
        await db.refresh(new_deck)
        
        logger.info(f"Successfully generated pitch deck {new_deck.id}")
        
        return {
            "id": str(new_deck.id),
            "user_id": str(new_deck.user_id),
            "deck_json": new_deck.deck_json or {},
            "created_at": new_deck.created_at
        }
        
    except ValueError as e:
        # Missing OpenAI API key or other configuration error
        logger.error(f"Configuration error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Pitch deck generation not configured: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Error generating pitch deck: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate pitch deck: {str(e)}"
        )


@router.get("/pitchdeck/{deck_id}", response_model=PitchDeckResponse)
async def get_pitchdeck(
    deck_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Get a pitch deck by ID"""
    current_user = get_current_user(request)
    user_id = current_user.get("sub") or current_user.get("id")
    
    # Get profile
    result = await db.execute(
        select(Profile).where(Profile.user_id == uuid.UUID(user_id))
    )
    profile = result.scalar_one_or_none()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Get deck
    result = await db.execute(
        select(PitchDeck).where(
            PitchDeck.id == uuid.UUID(deck_id),
            PitchDeck.user_id == profile.id
        )
    )
    deck = result.scalar_one_or_none()
    
    if not deck:
        raise HTTPException(status_code=404, detail="Pitch deck not found")
    
    return {
        "id": str(deck.id),
        "user_id": str(deck.user_id),
        "deck_json": deck.deck_json or {},
        "created_at": deck.created_at
    }
