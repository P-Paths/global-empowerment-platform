"""
GEM Platform - Direct Messages API
Handles direct messaging between users
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, desc
from typing import List
from datetime import datetime
import uuid

from app.core.database import get_db
from app.models.gep_models import Profile, Message
from app.utils.auth import get_current_user
from pydantic import BaseModel

router = APIRouter()


class MessageResponse(BaseModel):
    id: str
    sender_id: str
    receiver_id: str
    message: str
    read: bool
    created_at: datetime
    sender: dict
    receiver: dict
    
    class Config:
        from_attributes = True


class MessageCreate(BaseModel):
    receiver_id: str
    message: str


@router.get("/messages/{user_id}", response_model=List[MessageResponse])
async def get_messages(
    user_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Get messages between current user and another user"""
    current_user = get_current_user(request)
    current_user_id = current_user.get("sub") or current_user.get("id")
    
    # Get current user's profile
    result = await db.execute(
        select(Profile).where(Profile.user_id == uuid.UUID(current_user_id))
    )
    current_profile = result.scalar_one_or_none()
    
    if not current_profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Get target profile
    result = await db.execute(
        select(Profile).where(Profile.id == uuid.UUID(user_id))
    )
    target_profile = result.scalar_one_or_none()
    
    if not target_profile:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get messages between the two users
    result = await db.execute(
        select(Message, Profile)
        .join(Profile, or_(
            (Message.sender_id == Profile.id),
            (Message.receiver_id == Profile.id)
        ))
        .where(
            or_(
                (Message.sender_id == current_profile.id) & (Message.receiver_id == target_profile.id),
                (Message.sender_id == target_profile.id) & (Message.receiver_id == current_profile.id)
            )
        )
        .order_by(Message.created_at)
    )
    
    messages = []
    for msg, profile in result.all():
        # Determine sender and receiver
        sender = current_profile if msg.sender_id == current_profile.id else target_profile
        receiver = target_profile if msg.sender_id == current_profile.id else current_profile
        
        messages.append({
            "id": str(msg.id),
            "sender_id": str(msg.sender_id),
            "receiver_id": str(msg.receiver_id),
            "message": msg.message,
            "read": msg.read,
            "created_at": msg.created_at,
            "sender": {
                "id": str(sender.id),
                "full_name": sender.full_name,
                "avatar_url": sender.avatar_url
            },
            "receiver": {
                "id": str(receiver.id),
                "full_name": receiver.full_name,
                "avatar_url": receiver.avatar_url
            }
        })
    
    return messages


@router.post("/messages/send", response_model=MessageResponse)
async def send_message(
    message_data: MessageCreate,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Send a direct message"""
    current_user = get_current_user(request)
    current_user_id = current_user.get("sub") or current_user.get("id")
    
    # Get current user's profile
    result = await db.execute(
        select(Profile).where(Profile.user_id == uuid.UUID(current_user_id))
    )
    sender_profile = result.scalar_one_or_none()
    
    if not sender_profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Get receiver profile
    result = await db.execute(
        select(Profile).where(Profile.id == uuid.UUID(message_data.receiver_id))
    )
    receiver_profile = result.scalar_one_or_none()
    
    if not receiver_profile:
        raise HTTPException(status_code=404, detail="Receiver not found")
    
    if sender_profile.id == receiver_profile.id:
        raise HTTPException(status_code=400, detail="Cannot message yourself")
    
    # Create message
    new_message = Message(
        sender_id=sender_profile.id,
        receiver_id=receiver_profile.id,
        message=message_data.message,
        read=False
    )
    
    db.add(new_message)
    await db.commit()
    await db.refresh(new_message)
    
    return {
        "id": str(new_message.id),
        "sender_id": str(new_message.sender_id),
        "receiver_id": str(new_message.receiver_id),
        "message": new_message.message,
        "read": new_message.read,
        "created_at": new_message.created_at,
        "sender": {
            "id": str(sender_profile.id),
            "full_name": sender_profile.full_name,
            "avatar_url": sender_profile.avatar_url
        },
        "receiver": {
            "id": str(receiver_profile.id),
            "full_name": receiver_profile.full_name,
            "avatar_url": receiver_profile.avatar_url
        }
    }

