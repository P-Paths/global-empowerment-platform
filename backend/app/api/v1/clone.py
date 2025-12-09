"""
GEM Platform - Persona Clone Studio API
Handles persona clone creation and management
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from datetime import datetime
import uuid

from app.core.database import get_db
from app.models.gep_models import Profile, PersonaClone
from app.utils.auth import get_current_user
from pydantic import BaseModel

router = APIRouter()


class PersonaCloneResponse(BaseModel):
    id: str
    user_id: str
    title: str
    prompt: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


class PersonaCloneCreate(BaseModel):
    title: str
    prompt: Optional[str] = None


@router.post("/clone", response_model=PersonaCloneResponse)
async def create_persona_clone(
    clone_data: PersonaCloneCreate,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Create a new persona clone"""
    current_user = get_current_user(request)
    user_id = current_user.get("sub") or current_user.get("id")
    
    # Get profile
    result = await db.execute(
        select(Profile).where(Profile.user_id == uuid.UUID(user_id))
    )
    profile = result.scalar_one_or_none()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Create persona clone
    new_clone = PersonaClone(
        user_id=profile.id,
        title=clone_data.title,
        prompt=clone_data.prompt
    )
    
    db.add(new_clone)
    await db.commit()
    await db.refresh(new_clone)
    
    return {
        "id": str(new_clone.id),
        "user_id": str(new_clone.user_id),
        "title": new_clone.title,
        "prompt": new_clone.prompt,
        "created_at": new_clone.created_at
    }


@router.get("/clone/{clone_id}", response_model=PersonaCloneResponse)
async def get_persona_clone(
    clone_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Get a persona clone by ID"""
    current_user = get_current_user(request)
    user_id = current_user.get("sub") or current_user.get("id")
    
    # Get profile
    result = await db.execute(
        select(Profile).where(Profile.user_id == uuid.UUID(user_id))
    )
    profile = result.scalar_one_or_none()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Get clone
    result = await db.execute(
        select(PersonaClone).where(
            PersonaClone.id == uuid.UUID(clone_id),
            PersonaClone.user_id == profile.id
        )
    )
    clone = result.scalar_one_or_none()
    
    if not clone:
        raise HTTPException(status_code=404, detail="Persona clone not found")
    
    return {
        "id": str(clone.id),
        "user_id": str(clone.user_id),
        "title": clone.title,
        "prompt": clone.prompt,
        "created_at": clone.created_at
    }


@router.get("/clone", response_model=List[PersonaCloneResponse])
async def get_persona_clones(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Get all persona clones for current user"""
    current_user = get_current_user(request)
    user_id = current_user.get("sub") or current_user.get("id")
    
    # Get profile
    result = await db.execute(
        select(Profile).where(Profile.user_id == uuid.UUID(user_id))
    )
    profile = result.scalar_one_or_none()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Get clones
    result = await db.execute(
        select(PersonaClone)
        .where(PersonaClone.user_id == profile.id)
        .order_by(PersonaClone.created_at.desc())
    )
    clones = result.scalars().all()
    
    return [
        {
            "id": str(c.id),
            "user_id": str(c.user_id),
            "title": c.title,
            "prompt": c.prompt,
            "created_at": c.created_at
        }
        for c in clones
    ]
