"""
GEM Platform - Funding Score API
Handles funding readiness score calculation and logs
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List, Dict, Any
from datetime import datetime
import uuid

from app.core.database import get_db
from app.models.gep_models import Profile, FundingScoreLog
from app.utils.auth import get_current_user
from app.services.funding_readiness_score import FundingReadinessCalculator
from pydantic import BaseModel

router = APIRouter()


class FundingScoreResponse(BaseModel):
    score: int
    details: Dict[str, Any]
    created_at: datetime


class FundingScoreLogResponse(BaseModel):
    id: str
    user_id: str
    score: int
    details: Dict[str, Any]
    created_at: datetime
    
    class Config:
        from_attributes = True


@router.post("/funding-score/calculate", response_model=FundingScoreResponse)
async def calculate_funding_score(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Calculate funding readiness score for current user"""
    current_user = get_current_user(request)
    user_id = current_user.get("sub") or current_user.get("id")
    
    # Get profile
    result = await db.execute(
        select(Profile).where(Profile.user_id == uuid.UUID(user_id))
    )
    profile = result.scalar_one_or_none()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Calculate score using the service
    calculator = FundingReadinessCalculator()
    score_data = await calculator.calculate_score(str(profile.id), db)
    
    # Update profile score
    profile.funding_score = score_data.get("score", 0)
    await db.commit()
    
    # Log the score
    new_log = FundingScoreLog(
        user_id=profile.id,
        score=score_data.get("score", 0),
        details=score_data.get("breakdown", {})
    )
    
    db.add(new_log)
    await db.commit()
    await db.refresh(new_log)
    
    return {
        "score": score_data.get("score", 0),
        "details": score_data.get("breakdown", {}),
        "created_at": new_log.created_at
    }


@router.get("/funding-score/logs", response_model=List[FundingScoreLogResponse])
async def get_funding_score_logs(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Get funding score history for current user"""
    current_user = get_current_user(request)
    user_id = current_user.get("sub") or current_user.get("id")
    
    # Get profile
    result = await db.execute(
        select(Profile).where(Profile.user_id == uuid.UUID(user_id))
    )
    profile = result.scalar_one_or_none()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Get logs
    result = await db.execute(
        select(FundingScoreLog)
        .where(FundingScoreLog.user_id == profile.id)
        .order_by(desc(FundingScoreLog.created_at))
    )
    logs = result.scalars().all()
    
    return [
        {
            "id": str(log.id),
            "user_id": str(log.user_id),
            "score": log.score,
            "details": log.details or {},
            "created_at": log.created_at
        }
        for log in logs
    ]
