"""
Global Empowerment Platform - AI Growth Coach Agent
Provides daily personalized tasks and tracks member progress
"""
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
import logging

from app.models.gep_models import GEPMember, GEPPost, GEPProduct, GEPGrowthTask, GEPUserStreaks
from app.services.funding_readiness_score import FundingReadinessCalculator

logger = logging.getLogger(__name__)


class GrowthCoachAgent:
    """AI Growth Coach that provides personalized daily tasks"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def generate_daily_tasks(self, member_id: str) -> List[Dict[str, Any]]:
        """Generate personalized daily tasks for a member"""
        # Get member profile
        result = await self.db.execute(
            select(GEPMember).where(GEPMember.id == member_id)
        )
        member = result.scalar_one_or_none()
        if not member:
            return []
        
        tasks = []
        
        # Check posting streak
        posting_streak = await self._get_streak(member_id, "posting")
        if posting_streak == 0 or posting_streak < 3:
            tasks.append({
                "task_type": "post_content",
                "title": "Post a reel today",
                "description": "Keep your posting streak alive! Share something about your business.",
                "priority": "high",
                "due_date": (datetime.now() + timedelta(days=1)).isoformat()
            })
        
        # Check engagement
        recent_engagement = await self._check_recent_engagement(member_id)
        if not recent_engagement:
            tasks.append({
                "task_type": "engage",
                "title": "Engage with 3 members",
                "description": "Like and comment on posts from other members to build community.",
                "priority": "medium",
                "due_date": (datetime.now() + timedelta(days=1)).isoformat()
            })
        
        # Check business bio
        if not member.bio or len(member.bio) < 50:
            tasks.append({
                "task_type": "update_bio",
                "title": "Update your business bio",
                "description": "A complete bio helps people understand your business and increases your funding score.",
                "priority": "medium",
                "due_date": (datetime.now() + timedelta(days=3)).isoformat()
            })
        
        # Check products
        product_count = await self._get_product_count(member_id)
        if product_count == 0:
            tasks.append({
                "task_type": "upload_product",
                "title": "Upload your first product",
                "description": "Showcase what you're selling! Products help demonstrate your business model.",
                "priority": "high",
                "due_date": (datetime.now() + timedelta(days=2)).isoformat()
            })
        elif product_count < 3:
            tasks.append({
                "task_type": "upload_product",
                "title": f"Upload more products (you have {product_count})",
                "description": "A strong product catalog shows business maturity.",
                "priority": "medium",
                "due_date": (datetime.now() + timedelta(days=5)).isoformat()
            })
        
        # Check pricing
        products_without_pricing = await self._get_products_without_pricing(member_id)
        if products_without_pricing > 0:
            tasks.append({
                "task_type": "add_pricing",
                "title": f"Fix pricing for {products_without_pricing} product(s)",
                "description": "Products with pricing show revenue potential to investors.",
                "priority": "medium",
                "due_date": (datetime.now() + timedelta(days=3)).isoformat()
            })
        
        # Check brand assets
        if not member.profile_image_url:
            tasks.append({
                "task_type": "upload_branding",
                "title": "Upload a profile image",
                "description": "A professional profile image builds trust and brand recognition.",
                "priority": "medium",
                "due_date": (datetime.now() + timedelta(days=2)).isoformat()
            })
        
        return tasks
    
    async def _get_streak(self, member_id: str, streak_type: str) -> int:
        """Get current streak for a member"""
        result = await self.db.execute(
            select(GEPUserStreaks)
            .where(
                GEPUserStreaks.member_id == member_id,
                GEPUserStreaks.streak_type == streak_type
            )
        )
        streak = result.scalar_one_or_none()
        return streak.current_streak if streak else 0
    
    async def _check_recent_engagement(self, member_id: str) -> bool:
        """Check if member has engaged recently"""
        # Check if they've liked/commented in last 2 days
        two_days_ago = datetime.now() - timedelta(days=2)
        
        # This would require additional queries - simplified for now
        return False
    
    async def _get_product_count(self, member_id: str) -> int:
        """Get count of published products"""
        result = await self.db.execute(
            select(func.count(GEPProduct.id))
            .where(
                GEPProduct.member_id == member_id,
                GEPProduct.status == 'published'
            )
        )
        return result.scalar() or 0
    
    async def _get_products_without_pricing(self, member_id: str) -> int:
        """Get count of products without pricing"""
        result = await self.db.execute(
            select(func.count(GEPProduct.id))
            .where(
                GEPProduct.member_id == member_id,
                GEPProduct.price.is_(None),
                GEPProduct.status == 'published'
            )
        )
        return result.scalar() or 0
    
    async def update_streaks(self, member_id: str, activity_type: str):
        """Update streaks when member completes an activity"""
        today = datetime.now().date()
        
        result = await self.db.execute(
            select(GEPUserStreaks)
            .where(
                GEPUserStreaks.member_id == member_id,
                GEPUserStreaks.streak_type == activity_type
            )
        )
        streak = result.scalar_one_or_none()
        
        if not streak:
            # Create new streak
            streak = GEPUserStreaks(
                member_id=member_id,
                streak_type=activity_type,
                current_streak=1,
                longest_streak=1,
                last_activity_date=today
            )
            self.db.add(streak)
        else:
            # Check if streak continues
            if streak.last_activity_date:
                days_diff = (today - streak.last_activity_date.date()).days
                if days_diff == 1:
                    # Continue streak
                    streak.current_streak += 1
                    streak.longest_streak = max(streak.longest_streak, streak.current_streak)
                elif days_diff > 1:
                    # Reset streak
                    streak.current_streak = 1
            else:
                # First activity
                streak.current_streak = 1
            
            streak.last_activity_date = today
        
        await self.db.commit()

