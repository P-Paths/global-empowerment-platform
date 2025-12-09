"""
Global Empowerment Platform - AI Growth Coach API
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
import uuid
from datetime import datetime

from app.core.database import get_db
from app.models.gep_models import GEPMember, GEPGrowthTask
from app.utils.auth import get_current_user
from app.agents.growth_coach_agent import GrowthCoachAgent
from app.services.funding_readiness_score import FundingReadinessCalculator
from pydantic import BaseModel

router = APIRouter()


class TaskResponse(BaseModel):
    id: str
    task_type: str
    title: str
    description: str
    priority: str
    is_completed: bool
    due_date: str


@router.get("/tasks", response_model=List[TaskResponse])
async def get_daily_tasks(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Get daily tasks for current user"""
    current_user = get_current_user(request)
    # Get member
    user_id = current_user.get("sub") or current_user.get("id")
    result = await db.execute(
        select(GEPMember).where(GEPMember.user_id == uuid.UUID(user_id))
    )
    member = result.scalar_one_or_none()
    
    if not member:
        raise HTTPException(status_code=404, detail="Member profile not found")
    
    # Generate tasks using Growth Coach
    coach = GrowthCoachAgent(db)
    tasks = await coach.generate_daily_tasks(str(member.id))
    
    # Save tasks to database
    for task_data in tasks:
        # Check if task already exists
        existing = await db.execute(
            select(GEPGrowthTask).where(
                GEPGrowthTask.member_id == member.id,
                GEPGrowthTask.task_type == task_data["task_type"],
                GEPGrowthTask.is_completed == False
            )
        )
        if not existing.scalar_one_or_none():
            new_task = GEPGrowthTask(
                member_id=member.id,
                **task_data
            )
            db.add(new_task)
    
    await db.commit()
    
    # Get all incomplete tasks
    result = await db.execute(
        select(GEPGrowthTask)
        .where(
            GEPGrowthTask.member_id == member.id,
            GEPGrowthTask.is_completed == False
        )
        .order_by(GEPGrowthTask.priority.desc(), GEPGrowthTask.created_at)
    )
    db_tasks = result.scalars().all()
    
    return [
        {
            "id": str(t.id),
            "task_type": t.task_type,
            "title": t.title,
            "description": t.description,
            "priority": t.priority,
            "is_completed": t.is_completed,
            "due_date": t.due_date.isoformat() if t.due_date else None
        }
        for t in db_tasks
    ]


@router.post("/tasks/{task_id}/complete")
async def complete_task(
    task_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Mark a task as completed"""
    current_user = get_current_user(request)
    # Get member
    user_id = current_user.get("sub") or current_user.get("id")
    result = await db.execute(
        select(GEPMember).where(GEPMember.user_id == uuid.UUID(user_id))
    )
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=404, detail="Member profile not found")
    
    # Get task
    result = await db.execute(
        select(GEPGrowthTask).where(
            GEPGrowthTask.id == uuid.UUID(task_id),
            GEPGrowthTask.member_id == member.id
        )
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Mark as completed
    task.is_completed = True
    task.completed_at = datetime.now()
    
    # Update streak
    coach = GrowthCoachAgent(db)
    await coach.update_streaks(str(member.id), task.task_type)
    
    await db.commit()
    
    return {"success": True, "message": "Task completed!"}


@router.get("/funding-score")
async def get_funding_score(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Get current funding readiness score"""
    current_user = get_current_user(request)
    # Get member
    user_id = current_user.get("sub") or current_user.get("id")
    result = await db.execute(
        select(GEPMember).where(GEPMember.user_id == uuid.UUID(user_id))
    )
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=404, detail="Member profile not found")
    
    # Calculate score
    calculator = FundingReadinessCalculator()
    score_data = await calculator.calculate_score(str(member.id), db)
    
    return score_data
