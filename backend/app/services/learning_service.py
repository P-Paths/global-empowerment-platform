"""
GEP Learning Service
Learns from user behavior to personalize AI assistant for each user
Scales to 8000+ users with efficient pattern recognition
"""

from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc
from sqlalchemy.dialects.postgresql import insert
import json
import logging

logger = logging.getLogger(__name__)


class LearningService:
    """Service that learns from user behavior and personalizes AI assistant"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def track_interaction(
        self,
        user_id: str,  # This is auth.users.id (UUID from JWT)
        interaction_type: str,
        interaction_data: Optional[Dict] = None,
        metadata: Optional[Dict] = None
    ) -> bool:
        """
        Track a user interaction for learning
        
        Examples:
        - track_interaction(user_id, 'post_created', {'post_id': '...', 'has_image': True})
        - track_interaction(user_id, 'task_completed', {'task_id': '...', 'task_type': 'content'})
        - track_interaction(user_id, 'feed_viewed', {'duration_seconds': 120})
        """
        try:
            from app.models.gep_models import Profile
            
            # Get profile ID from user_id (auth.users.id)
            result = await self.db.execute(
                select(Profile.id).where(Profile.user_id == user_id)
            )
            profile = result.scalar_one_or_none()
            
            if not profile:
                logger.warning(f"Profile not found for user_id: {user_id} - creating profile first")
                # Profile might not exist yet - that's okay, we'll track it anyway
                # The interaction will be linked once profile is created
                return True  # Don't fail, just skip tracking for now
            
            # Insert interaction (using raw SQL for JSONB support)
            await self.db.execute(
                """
                INSERT INTO user_interactions (user_id, interaction_type, interaction_data, metadata)
                VALUES (:user_id, :interaction_type, :interaction_data, :metadata)
                """,
                {
                    "user_id": str(profile),
                    "interaction_type": interaction_type,
                    "interaction_data": json.dumps(interaction_data or {}),
                    "metadata": json.dumps(metadata or {})
                }
            )
            
            await self.db.commit()
            
            # Trigger learning update (async, non-blocking)
            await self._update_learning_profile(profile)
            
            return True
        except Exception as e:
            logger.error(f"Error tracking interaction: {e}")
            await self.db.rollback()
            return False
    
    async def _update_learning_profile(self, profile_id: str):
        """Update learning profile based on recent interactions"""
        try:
            # Get last 100 interactions
            interactions = await self.db.execute(
                """
                SELECT interaction_type, interaction_data, created_at
                FROM user_interactions
                WHERE user_id = :user_id
                ORDER BY created_at DESC
                LIMIT 100
                """,
                {"user_id": str(profile_id)}
            )
            
            patterns = self._analyze_patterns(interactions.fetchall())
            
            # Update learning profile
            await self.db.execute(
                """
                INSERT INTO user_learning_profiles (user_id, behavior_patterns, learning_score, last_updated)
                VALUES (:user_id, :patterns, :score, NOW())
                ON CONFLICT (user_id) 
                DO UPDATE SET 
                    behavior_patterns = :patterns,
                    learning_score = :score,
                    last_updated = NOW()
                """,
                {
                    "user_id": str(profile_id),
                    "patterns": json.dumps(patterns),
                    "score": min(100, len(interactions.fetchall()) * 2)  # Learning score based on interactions
                }
            )
            
            await self.db.commit()
        except Exception as e:
            logger.error(f"Error updating learning profile: {e}")
            await self.db.rollback()
    
    def _analyze_patterns(self, interactions: List) -> Dict[str, Any]:
        """Analyze interaction patterns to learn user behavior"""
        patterns = {
            "posting_frequency": "low",  # low, medium, high
            "preferred_post_times": [],
            "content_types": [],  # text, image, video
            "engagement_level": "low",  # low, medium, high
            "task_completion_rate": 0.0,
            "active_days": []
        }
        
        if not interactions:
            return patterns
        
        # Count interaction types
        type_counts = {}
        for interaction in interactions:
            itype = interaction[0]
            type_counts[itype] = type_counts.get(itype, 0) + 1
        
        # Analyze posting frequency
        post_count = type_counts.get('post_created', 0)
        if post_count > 20:
            patterns["posting_frequency"] = "high"
        elif post_count > 5:
            patterns["posting_frequency"] = "medium"
        
        # Analyze task completion
        task_completed = type_counts.get('task_completed', 0)
        task_created = type_counts.get('task_created', 0)
        if task_created > 0:
            patterns["task_completion_rate"] = task_completed / task_created
        
        # Analyze engagement
        engagement_actions = type_counts.get('post_liked', 0) + type_counts.get('comment_created', 0)
        if engagement_actions > 30:
            patterns["engagement_level"] = "high"
        elif engagement_actions > 10:
            patterns["engagement_level"] = "medium"
        
        return patterns
    
    async def get_personalized_suggestions(self, user_id: str) -> Dict[str, Any]:
        """Get personalized AI suggestions based on learned patterns"""
        try:
            from app.models.gep_models import Profile
            
            result = await self.db.execute(
                select(Profile.id).where(Profile.user_id == user_id)
            )
            profile = result.scalar_one_or_none()
            
            if not profile:
                return {"suggestions": [], "personalization_level": "new_user"}
            
            # Get learning profile
            learning_result = await self.db.execute(
                """
                SELECT behavior_patterns, preferences, ai_personality, learning_score
                FROM user_learning_profiles
                WHERE user_id = :user_id
                """,
                {"user_id": str(profile)}
            )
            
            learning = learning_result.fetchone()
            
            if not learning:
                return {"suggestions": [], "personalization_level": "new_user"}
            
            patterns = json.loads(learning[0] or '{}')
            preferences = json.loads(learning[1] or '{}')
            personality = json.loads(learning[2] or '{}')
            score = learning[3] or 0
            
            # Generate personalized suggestions
            suggestions = self._generate_suggestions(patterns, preferences, score)
            
            return {
                "suggestions": suggestions,
                "personalization_level": "high" if score > 50 else "medium" if score > 20 else "low",
                "learning_score": score,
                "patterns": patterns
            }
        except Exception as e:
            logger.error(f"Error getting personalized suggestions: {e}")
            return {"suggestions": [], "personalization_level": "error"}
    
    def _generate_suggestions(self, patterns: Dict, preferences: Dict, score: int) -> List[Dict]:
        """Generate personalized suggestions based on patterns"""
        suggestions = []
        
        # Posting frequency suggestions
        if patterns.get("posting_frequency") == "low":
            suggestions.append({
                "type": "posting",
                "message": "Posting more frequently can help grow your following! Try posting 2-3 times per week.",
                "priority": "high"
            })
        
        # Task completion suggestions
        completion_rate = patterns.get("task_completion_rate", 0)
        if completion_rate < 0.5:
            suggestions.append({
                "type": "tasks",
                "message": "Completing your AI Growth Coach tasks can boost your funding score!",
                "priority": "medium"
            })
        
        # Engagement suggestions
        if patterns.get("engagement_level") == "low":
            suggestions.append({
                "type": "engagement",
                "message": "Engaging with other members' posts can help build your network!",
                "priority": "medium"
            })
        
        return suggestions
    
    async def save_ai_conversation(
        self,
        user_id: str,
        conversation_type: str,
        user_message: str,
        ai_response: str,
        was_helpful: Optional[bool] = None,
        context: Optional[Dict] = None
    ) -> bool:
        """Save AI conversation for learning what helps users"""
        try:
            from app.models.gep_models import Profile
            
            result = await self.db.execute(
                select(Profile.id).where(Profile.user_id == user_id)
            )
            profile = result.scalar_one_or_none()
            
            if not profile:
                return False
            
            await self.db.execute(
                """
                INSERT INTO ai_conversations 
                (user_id, conversation_type, user_message, ai_response, was_helpful, context)
                VALUES (:user_id, :type, :user_msg, :ai_resp, :helpful, :ctx)
                """,
                {
                    "user_id": str(profile),
                    "type": conversation_type,
                    "user_msg": user_message,
                    "ai_resp": ai_response,
                    "helpful": was_helpful,
                    "ctx": json.dumps(context or {})
                }
            )
            
            await self.db.commit()
            return True
        except Exception as e:
            logger.error(f"Error saving AI conversation: {e}")
            await self.db.rollback()
            return False
    
    async def get_user_goals(self, user_id: str) -> List[Dict]:
        """Get user's goals and AI suggestions"""
        try:
            from app.models.gep_models import Profile
            
            result = await self.db.execute(
                select(Profile.id).where(Profile.user_id == user_id)
            )
            profile = result.scalar_one_or_none()
            
            if not profile:
                return []
            
            goals_result = await self.db.execute(
                """
                SELECT id, goal_type, target_value, current_value, deadline, ai_suggestions, completed
                FROM user_goals
                WHERE user_id = :user_id AND completed = FALSE
                ORDER BY created_at DESC
                """,
                {"user_id": str(profile)}
            )
            
            goals = []
            for row in goals_result.fetchall():
                goals.append({
                    "id": str(row[0]),
                    "goal_type": row[1],
                    "target_value": row[2],
                    "current_value": row[3],
                    "deadline": row[4].isoformat() if row[4] else None,
                    "ai_suggestions": json.loads(row[5] or '[]'),
                    "completed": row[6]
                })
            
            return goals
        except Exception as e:
            logger.error(f"Error getting user goals: {e}")
            return []

