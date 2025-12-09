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

from app.core.database import get_db
from app.models.gep_models import Profile, PitchDeck
from app.utils.auth import get_current_user
from pydantic import BaseModel

router = APIRouter()


class PitchDeckResponse(BaseModel):
    id: str
    user_id: str
    deck_json: Dict[str, Any]
    created_at: datetime
    
    class Config:
        from_attributes = True


class PitchDeckCreate(BaseModel):
    deck_json: Dict[str, Any]


@router.post("/pitchdeck/generate", response_model=PitchDeckResponse)
async def generate_pitchdeck(
    deck_data: PitchDeckCreate,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Generate a new pitch deck"""
    current_user = get_current_user(request)
    user_id = current_user.get("sub") or current_user.get("id")
    
    # Get profile
    result = await db.execute(
        select(Profile).where(Profile.user_id == uuid.UUID(user_id))
    )
    profile = result.scalar_one_or_none()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Create pitch deck
    new_deck = PitchDeck(
        user_id=profile.id,
        deck_json=deck_data.deck_json
    )
    
    db.add(new_deck)
    await db.commit()
    await db.refresh(new_deck)
    
    return {
        "id": str(new_deck.id),
        "user_id": str(new_deck.user_id),
        "deck_json": new_deck.deck_json or {},
        "created_at": new_deck.created_at
    }


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
