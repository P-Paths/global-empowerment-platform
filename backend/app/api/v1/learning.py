"""
Learning API - Tracks user behavior and provides personalized AI suggestions
Scales to 8000+ users
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from app.core.database import get_db
from app.services.learning_service import LearningService
from app.utils.auth import get_current_user, get_current_user_id

router = APIRouter(prefix="/learning", tags=["learning"])


class TrackInteractionRequest(BaseModel):
    interaction_type: str
    interaction_data: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None


class AIConversationRequest(BaseModel):
    conversation_type: str
    user_message: str
    ai_response: str
    was_helpful: Optional[bool] = None
    context: Optional[Dict[str, Any]] = None


@router.post("/track")
async def track_interaction(
    request: TrackInteractionRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Track a user interaction for learning"""
    learning_service = LearningService(db)
    # Get user_id from JWT (sub field)
    user_id = current_user.get("sub") or current_user.get("user_id") or current_user.get("id")
    success = await learning_service.track_interaction(
        user_id=user_id,
        interaction_type=request.interaction_type,
        interaction_data=request.interaction_data,
        metadata=request.metadata
    )
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to track interaction")
    
    return {"success": True, "message": "Interaction tracked"}


@router.get("/suggestions")
async def get_personalized_suggestions(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get personalized AI suggestions based on learned patterns"""
    learning_service = LearningService(db)
    user_id = current_user.get("sub") or current_user.get("user_id") or current_user.get("id")
    suggestions = await learning_service.get_personalized_suggestions(user_id)
    return suggestions


@router.post("/conversation")
async def save_ai_conversation(
    request: AIConversationRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Save AI conversation for learning"""
    learning_service = LearningService(db)
    user_id = current_user.get("sub") or current_user.get("user_id") or current_user.get("id")
    success = await learning_service.save_ai_conversation(
        user_id=user_id,
        conversation_type=request.conversation_type,
        user_message=request.user_message,
        ai_response=request.ai_response,
        was_helpful=request.was_helpful,
        context=request.context
    )
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to save conversation")
    
    return {"success": True, "message": "Conversation saved"}


@router.get("/goals")
async def get_user_goals(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get user's goals and AI suggestions"""
    learning_service = LearningService(db)
    user_id = current_user.get("sub") or current_user.get("user_id") or current_user.get("id")
    goals = await learning_service.get_user_goals(user_id)
    return {"goals": goals}

