"""
Global Empowerment Platform - Funding Readiness Score Calculator
Calculates a 0-100 score based on multiple factors
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timedelta
from typing import Dict, Any
import logging
import uuid

from app.models.gep_models import (
    GEPMember, GEPPost, GEPProduct, GEPGrowthMetric,
    GEPPostLike, GEPPostComment, GEPMemberFollows
)

logger = logging.getLogger(__name__)


class FundingReadinessCalculator:
    """Calculate funding readiness score for members"""
    
    # Weight distribution (must sum to 100)
    WEIGHTS = {
        "posting_frequency": 15,      # How often they post
        "brand_clarity": 10,          # Business name, bio completeness
        "business_model": 15,         # Products, services defined
        "community_engagement": 20,   # Likes, comments, shares received
        "follower_growth": 15,        # Follower count and growth
        "revenue_signals": 10,        # Products with pricing
        "product_catalog": 10,         # Number of products
        "pitch_deck": 5               # Pitch deck completion
    }
    
    @staticmethod
    async def calculate_score(member_id: str, db: AsyncSession) -> Dict[str, Any]:
        """Calculate comprehensive funding readiness score"""
        
        # Get member
        result = await db.execute(
            select(GEPMember).where(GEPMember.id == member_id)
        )
        member = result.scalar_one_or_none()
        if not member:
            raise ValueError("Member not found")
        
        score_breakdown = {}
        total_score = 0
        
        # 1. Posting Frequency (0-15 points)
        posting_score = await FundingReadinessCalculator._calculate_posting_frequency(member_id, db)
        score_breakdown["posting_frequency"] = posting_score
        total_score += posting_score
        
        # 2. Brand Clarity (0-10 points)
        brand_score = FundingReadinessCalculator._calculate_brand_clarity(member)
        score_breakdown["brand_clarity"] = brand_score
        total_score += brand_score
        
        # 3. Business Model (0-15 points)
        business_score = FundingReadinessCalculator._calculate_business_model(member)
        score_breakdown["business_model"] = business_score
        total_score += business_score
        
        # 4. Community Engagement (0-20 points)
        engagement_score = await FundingReadinessCalculator._calculate_engagement(member_id, db)
        score_breakdown["community_engagement"] = engagement_score
        total_score += engagement_score
        
        # 5. Follower Growth (0-15 points)
        follower_score = FundingReadinessCalculator._calculate_follower_score(member)
        score_breakdown["follower_growth"] = follower_score
        total_score += follower_score
        
        # 6. Revenue Signals (0-10 points)
        revenue_score = await FundingReadinessCalculator._calculate_revenue_signals(member_id, db)
        score_breakdown["revenue_signals"] = revenue_score
        total_score += revenue_score
        
        # 7. Product Catalog (0-10 points)
        product_score = await FundingReadinessCalculator._calculate_product_catalog(member_id, db)
        score_breakdown["product_catalog"] = product_score
        total_score += product_score
        
        # 8. Pitch Deck (0-5 points) - Placeholder for now
        pitch_score = 0  # TODO: Check if pitch deck exists
        score_breakdown["pitch_deck"] = pitch_score
        total_score += pitch_score
        
        # Determine status
        if total_score < 50:
            status = "Building"
        elif total_score < 80:
            status = "Emerging"
        else:
            status = "VC-Ready"
        
        # Update member record
        member.funding_readiness_score = int(total_score)
        member.funding_status = status
        await db.commit()
        
        return {
            "score": int(total_score),
            "status": status,
            "breakdown": score_breakdown,
            "calculated_at": datetime.now().isoformat()
        }
    
    @staticmethod
    async def _calculate_posting_frequency(member_id: str, db: AsyncSession) -> float:
        """Calculate posting frequency score (0-15)"""
        # Count posts in last 30 days
        thirty_days_ago = datetime.now() - timedelta(days=30)
        
        result = await db.execute(
            select(func.count(GEPPost.id))
            .where(
                GEPPost.member_id == member_id,
                GEPPost.created_at >= thirty_days_ago,
                GEPPost.is_published == True
            )
        )
        post_count = result.scalar() or 0
        
        # Scoring: 15+ posts = 15 points, 10-14 = 12, 5-9 = 8, 1-4 = 4, 0 = 0
        if post_count >= 15:
            return 15.0
        elif post_count >= 10:
            return 12.0
        elif post_count >= 5:
            return 8.0
        elif post_count >= 1:
            return 4.0
        else:
            return 0.0
    
    @staticmethod
    def _calculate_brand_clarity(member: GEPMember) -> float:
        """Calculate brand clarity score (0-10)"""
        score = 0.0
        
        # Business name (2 points)
        if member.business_name:
            score += 2.0
        
        # Bio (3 points)
        if member.bio and len(member.bio) > 50:
            score += 3.0
        elif member.bio:
            score += 1.5
        
        # Industry/Business type (2 points)
        if member.industry or member.business_type:
            score += 2.0
        
        # Profile image (2 points)
        if member.profile_image_url:
            score += 2.0
        
        # Website/social links (1 point)
        if member.website_url or member.instagram_handle or member.linkedin_url:
            score += 1.0
        
        return min(score, 10.0)
    
    @staticmethod
    def _calculate_business_model(member: GEPMember) -> float:
        """Calculate business model clarity (0-15)"""
        score = 0.0
        
        # Services defined (5 points)
        if member.services and len(member.services) > 0:
            score += min(5.0, len(member.services) * 1.0)
        
        # Skills defined (5 points)
        if member.skills and len(member.skills) > 0:
            score += min(5.0, len(member.skills) * 1.0)
        
        # Business type/industry (5 points)
        if member.business_type and member.industry:
            score += 5.0
        elif member.business_type or member.industry:
            score += 2.5
        
        return min(score, 15.0)
    
    @staticmethod
    async def _calculate_engagement(member_id: str, db: AsyncSession) -> float:
        """Calculate community engagement score (0-20)"""
        # Get total engagement on member's posts (last 30 days)
        thirty_days_ago = datetime.now() - timedelta(days=30)
        
        # Get posts
        result = await db.execute(
            select(GEPPost.id).where(
                GEPPost.member_id == member_id,
                GEPPost.created_at >= thirty_days_ago
            )
        )
        post_ids = [str(row[0]) for row in result.all()]
        
        if not post_ids:
            return 0.0
        
        # Count total likes received
        result = await db.execute(
            select(func.count(GEPPostLike.id))
            .where(GEPPostLike.post_id.in_([uuid.UUID(pid) for pid in post_ids]))
        )
        total_likes = result.scalar() or 0
        
        # Count total comments received
        result = await db.execute(
            select(func.count(GEPPostComment.id))
            .where(GEPPostComment.post_id.in_([uuid.UUID(pid) for pid in post_ids]))
        )
        total_comments = result.scalar() or 0
        
        # Calculate engagement score
        total_engagement = total_likes + (total_comments * 2)  # Comments worth 2x
        
        # Scoring: 100+ = 20, 50-99 = 15, 20-49 = 10, 5-19 = 5, <5 = 2
        if total_engagement >= 100:
            return 20.0
        elif total_engagement >= 50:
            return 15.0
        elif total_engagement >= 20:
            return 10.0
        elif total_engagement >= 5:
            return 5.0
        else:
            return 2.0
    
    @staticmethod
    def _calculate_follower_score(member: GEPMember) -> float:
        """Calculate follower growth score (0-15)"""
        followers = member.followers_count or 0
        
        # Scoring: 1000+ = 15, 500-999 = 12, 200-499 = 9, 50-199 = 6, 10-49 = 3, <10 = 1
        if followers >= 1000:
            return 15.0
        elif followers >= 500:
            return 12.0
        elif followers >= 200:
            return 9.0
        elif followers >= 50:
            return 6.0
        elif followers >= 10:
            return 3.0
        else:
            return 1.0
    
    @staticmethod
    async def _calculate_revenue_signals(member_id: str, db: AsyncSession) -> float:
        """Calculate revenue signals score (0-10)"""
        # Count products with pricing
        result = await db.execute(
            select(func.count(GEPProduct.id))
            .where(
                GEPProduct.member_id == member_id,
                GEPProduct.price.isnot(None),
                GEPProduct.status == 'published'
            )
        )
        priced_products = result.scalar() or 0
        
        # Scoring: 5+ = 10, 3-4 = 7, 1-2 = 4, 0 = 0
        if priced_products >= 5:
            return 10.0
        elif priced_products >= 3:
            return 7.0
        elif priced_products >= 1:
            return 4.0
        else:
            return 0.0
    
    @staticmethod
    async def _calculate_product_catalog(member_id: str, db: AsyncSession) -> float:
        """Calculate product catalog score (0-10)"""
        result = await db.execute(
            select(func.count(GEPProduct.id))
            .where(
                GEPProduct.member_id == member_id,
                GEPProduct.status == 'published'
            )
        )
        product_count = result.scalar() or 0
        
        # Scoring: 10+ = 10, 5-9 = 7, 2-4 = 4, 1 = 2, 0 = 0
        if product_count >= 10:
            return 10.0
        elif product_count >= 5:
            return 7.0
        elif product_count >= 2:
            return 4.0
        elif product_count >= 1:
            return 2.0
        else:
            return 0.0

