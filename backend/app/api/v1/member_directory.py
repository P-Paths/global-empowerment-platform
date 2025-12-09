"""
Global Empowerment Platform - Member Directory API
Search and filter members by business type, skills, city, funding score
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_, func
from typing import List, Optional
from pydantic import BaseModel

from app.core.database import get_db
from app.models.gep_models import GEPMember
from app.utils.auth import get_current_user

router = APIRouter()


class MemberProfile(BaseModel):
    id: str
    business_name: Optional[str]
    business_type: Optional[str]
    industry: Optional[str]
    city: Optional[str]
    state: Optional[str]
    skills: Optional[List[str]]
    services: Optional[List[str]]
    bio: Optional[str]
    followers_count: int
    funding_readiness_score: int
    funding_status: str
    profile_image_url: Optional[str]
    
    class Config:
        from_attributes = True


@router.get("/members", response_model=List[MemberProfile])
async def search_members(
    business_type: Optional[str] = Query(None),
    industry: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    skill: Optional[str] = Query(None),
    min_funding_score: Optional[int] = Query(None),
    max_funding_score: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db)
):
    """Search members with filters"""
    query = select(GEPMember)
    
    # Apply filters
    conditions = []
    
    if business_type:
        conditions.append(GEPMember.business_type.ilike(f"%{business_type}%"))
    
    if industry:
        conditions.append(GEPMember.industry.ilike(f"%{industry}%"))
    
    if city:
        conditions.append(GEPMember.city.ilike(f"%{city}%"))
    
    if state:
        conditions.append(GEPMember.state.ilike(f"%{state}%"))
    
    if skill:
        conditions.append(GEPMember.skills.contains([skill]))
    
    if min_funding_score is not None:
        conditions.append(GEPMember.funding_readiness_score >= min_funding_score)
    
    if max_funding_score is not None:
        conditions.append(GEPMember.funding_readiness_score <= max_funding_score)
    
    if search:
        search_conditions = [
            GEPMember.business_name.ilike(f"%{search}%"),
            GEPMember.bio.ilike(f"%{search}%"),
            GEPMember.industry.ilike(f"%{search}%")
        ]
        conditions.append(or_(*search_conditions))
    
    if conditions:
        query = query.where(and_(*conditions))
    
    # Order by funding score (highest first)
    query = query.order_by(GEPMember.funding_readiness_score.desc())
    query = query.limit(limit).offset(offset)
    
    result = await db.execute(query)
    members = result.scalars().all()
    
    return [
        {
            "id": str(m.id),
            "business_name": m.business_name,
            "business_type": m.business_type,
            "industry": m.industry,
            "city": m.city,
            "state": m.state,
            "skills": m.skills or [],
            "services": m.services or [],
            "bio": m.bio,
            "followers_count": m.followers_count,
            "funding_readiness_score": m.funding_readiness_score,
            "funding_status": m.funding_status,
            "profile_image_url": m.profile_image_url
        }
        for m in members
    ]


@router.get("/members/{member_id}", response_model=MemberProfile)
async def get_member_profile(
    member_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get a specific member's profile"""
    result = await db.execute(
        select(GEPMember).where(GEPMember.id == member_id)
    )
    member = result.scalar_one_or_none()
    
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    return {
        "id": str(member.id),
        "business_name": member.business_name,
        "business_type": member.business_type,
        "industry": member.industry,
        "city": member.city,
        "state": member.state,
        "skills": member.skills or [],
        "services": member.services or [],
        "bio": member.bio,
        "followers_count": member.followers_count,
        "funding_readiness_score": member.funding_readiness_score,
        "funding_status": member.funding_status,
        "profile_image_url": member.profile_image_url
    }


@router.get("/members/top-performers", response_model=List[MemberProfile])
async def get_top_performers(
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db)
):
    """Get top performers by funding readiness score"""
    result = await db.execute(
        select(GEPMember)
        .where(GEPMember.funding_readiness_score >= 50)
        .order_by(GEPMember.funding_readiness_score.desc())
        .limit(limit)
    )
    
    members = result.scalars().all()
    
    return [
        {
            "id": str(m.id),
            "business_name": m.business_name,
            "business_type": m.business_type,
            "industry": m.industry,
            "city": m.city,
            "state": m.state,
            "skills": m.skills or [],
            "services": m.services or [],
            "bio": m.bio,
            "followers_count": m.followers_count,
            "funding_readiness_score": m.funding_readiness_score,
            "funding_status": m.funding_status,
            "profile_image_url": m.profile_image_url
        }
        for m in members
    ]

