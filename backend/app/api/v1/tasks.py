"""
GEM Platform - Tasks API
Handles AI Growth Coach tasks
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from datetime import datetime
import uuid

from app.core.database import get_db
from app.models.gep_models import Profile, Task
from app.utils.auth import get_current_user
from pydantic import BaseModel

router = APIRouter()


class TaskResponse(BaseModel):
    id: str
    user_id: str
    title: str
    description: Optional[str]
    completed: bool
    created_at: datetime
    completed_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None


@router.get("/tasks", response_model=List[TaskResponse])
async def get_tasks(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Get all tasks for current user"""
    current_user = get_current_user(request)
    user_id = current_user.get("sub") or current_user.get("id")
    
    # Get profile
    result = await db.execute(
        select(Profile).where(Profile.user_id == uuid.UUID(user_id))
    )
    profile = result.scalar_one_or_none()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Get tasks
    result = await db.execute(
        select(Task).where(Task.user_id == profile.id).order_by(Task.created_at.desc())
    )
    tasks = result.scalars().all()
    
    return [
        {
            "id": str(t.id),
            "user_id": str(t.user_id),
            "title": t.title,
            "description": t.description,
            "completed": t.completed,
            "created_at": t.created_at,
            "completed_at": t.completed_at
        }
        for t in tasks
    ]


@router.post("/tasks", response_model=TaskResponse)
async def create_task(
    task_data: TaskCreate,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Create a new task"""
    current_user = get_current_user(request)
    user_id = current_user.get("sub") or current_user.get("id")
    
    # Get profile
    result = await db.execute(
        select(Profile).where(Profile.user_id == uuid.UUID(user_id))
    )
    profile = result.scalar_one_or_none()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Create task
    new_task = Task(
        user_id=profile.id,
        title=task_data.title,
        description=task_data.description,
        completed=False
    )
    
    db.add(new_task)
    await db.commit()
    await db.refresh(new_task)
    
    return {
        "id": str(new_task.id),
        "user_id": str(new_task.user_id),
        "title": new_task.title,
        "description": new_task.description,
        "completed": new_task.completed,
        "created_at": new_task.created_at,
        "completed_at": new_task.completed_at
    }


@router.post("/tasks/{task_id}/complete", response_model=TaskResponse)
async def complete_task(
    task_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Mark a task as completed"""
    current_user = get_current_user(request)
    user_id = current_user.get("sub") or current_user.get("id")
    
    # Get profile
    result = await db.execute(
        select(Profile).where(Profile.user_id == uuid.UUID(user_id))
    )
    profile = result.scalar_one_or_none()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Get task
    result = await db.execute(
        select(Task).where(
            Task.id == uuid.UUID(task_id),
            Task.user_id == profile.id
        )
    )
    task = result.scalar_one_or_none()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Mark as completed
    task.completed = True
    task.completed_at = datetime.now()
    await db.commit()
    await db.refresh(task)
    
    return {
        "id": str(task.id),
        "user_id": str(task.user_id),
        "title": task.title,
        "description": task.description,
        "completed": task.completed,
        "created_at": task.created_at,
        "completed_at": task.completed_at
    }
