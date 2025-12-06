"""
Knowledge Graph Service
Phase 0: Core service for managing knowledge graph nodes and vehicle knowledge
"""

import logging
from typing import Optional, Dict, Any, List
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from sqlalchemy.orm import selectinload
from app.models.knowledge_graph import (
    KnowledgeGraphNode,
    VINKnowledgeBase,
    SellerProfileRules,
    ListingRules,
    StandardQuestionsKB,
    NegotiationResponses,
    WeirdQuestionLibrary,
    KnowledgeGraphLearning,
    UserSession
)

logger = logging.getLogger(__name__)


class KnowledgeGraphService:
    """Service for managing knowledge graph nodes"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create_knowledge_graph_node(
        self,
        user_id: UUID,
        listing_id: UUID,
        vin: Optional[str] = None,
        condition: Optional[str] = None,
        rebuild_reason: Optional[str] = None,
        mileage: Optional[int] = None,
        specs: Optional[Dict[str, Any]] = None,
        history: Optional[Dict[str, Any]] = None,
        faqs: Optional[Dict[str, Any]] = None,
        images: Optional[List[str]] = None,
        market_comps: Optional[Dict[str, Any]] = None,
        ai_summary: Optional[str] = None,
        key_selling_points: Optional[List[str]] = None,
        vin_data: Optional[Dict[str, Any]] = None
    ) -> KnowledgeGraphNode:
        """Create a new knowledge graph node for a listing"""
        try:
            node = KnowledgeGraphNode(
                user_id=user_id,
                listing_id=listing_id,
                vin=vin,
                condition=condition,
                rebuild_reason=rebuild_reason,
                mileage=mileage,
                specs=specs or {},
                history=history or {},
                faqs=faqs or {},
                images=images or [],
                market_comps=market_comps or {},
                ai_summary=ai_summary,
                key_selling_points=key_selling_points or [],
                vin_data=vin_data,
                vin_decoded=vin_data is not None
            )
            
            self.db.add(node)
            await self.db.commit()
            await self.db.refresh(node)
            
            logger.info(f"Created knowledge graph node for listing {listing_id}")
            return node
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error creating knowledge graph node: {e}")
            raise
    
    async def get_knowledge_graph_node(
        self,
        listing_id: UUID,
        user_id: Optional[UUID] = None
    ) -> Optional[KnowledgeGraphNode]:
        """Get knowledge graph node for a listing"""
        try:
            query = select(KnowledgeGraphNode).where(
                KnowledgeGraphNode.listing_id == listing_id
            )
            
            if user_id:
                query = query.where(KnowledgeGraphNode.user_id == user_id)
            
            result = await self.db.execute(query)
            return result.scalar_one_or_none()
            
        except Exception as e:
            logger.error(f"Error getting knowledge graph node: {e}")
            return None
    
    async def update_knowledge_graph_node(
        self,
        listing_id: UUID,
        user_id: UUID,
        **updates
    ) -> Optional[KnowledgeGraphNode]:
        """Update knowledge graph node"""
        try:
            node = await self.get_knowledge_graph_node(listing_id, user_id)
            if not node:
                return None
            
            for key, value in updates.items():
                if hasattr(node, key) and value is not None:
                    setattr(node, key, value)
            
            await self.db.commit()
            await self.db.refresh(node)
            
            logger.info(f"Updated knowledge graph node for listing {listing_id}")
            return node
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error updating knowledge graph node: {e}")
            raise
    
    async def get_user_knowledge_graph_nodes(
        self,
        user_id: UUID,
        limit: int = 100,
        offset: int = 0
    ) -> List[KnowledgeGraphNode]:
        """Get all knowledge graph nodes for a user"""
        try:
            query = select(KnowledgeGraphNode).where(
                KnowledgeGraphNode.user_id == user_id
            ).order_by(
                KnowledgeGraphNode.updated_at.desc()
            ).limit(limit).offset(offset)
            
            result = await self.db.execute(query)
            return list(result.scalars().all())
            
        except Exception as e:
            logger.error(f"Error getting user knowledge graph nodes: {e}")
            return []


class VINKnowledgeService:
    """Service for managing VIN knowledge base"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_vin_knowledge(
        self,
        vin: str
    ) -> Optional[VINKnowledgeBase]:
        """Get VIN knowledge from knowledge base"""
        try:
            vin_clean = vin.upper().strip()
            query = select(VINKnowledgeBase).where(
                VINKnowledgeBase.vin == vin_clean
            )
            
            result = await self.db.execute(query)
            vin_kb = result.scalar_one_or_none()
            
            if vin_kb:
                # Update usage tracking
                vin_kb.usage_count += 1
                from sqlalchemy.sql import func
                vin_kb.last_used_date = func.now()
                await self.db.commit()
                await self.db.refresh(vin_kb)
            
            return vin_kb
            
        except Exception as e:
            logger.error(f"Error getting VIN knowledge: {e}")
            return None
    
    async def store_vin_knowledge(
        self,
        vin: str,
        make: Optional[str] = None,
        model: Optional[str] = None,
        year: Optional[int] = None,
        trim: Optional[str] = None,
        nhtsa_data: Optional[Dict[str, Any]] = None,
        features_interior: Optional[List[str]] = None,
        features_exterior: Optional[List[str]] = None,
        features_safety: Optional[List[str]] = None,
        features_technology: Optional[List[str]] = None,
        features_comfort: Optional[List[str]] = None,
        features_powertrain: Optional[List[str]] = None,
        features_audio_entertainment: Optional[List[str]] = None,
        all_features: Optional[List[str]] = None,
        mpg_city: Optional[int] = None,
        mpg_highway: Optional[int] = None,
        engine_type: Optional[str] = None,
        engine_size: Optional[str] = None,
        transmission_type: Optional[str] = None,
        drivetrain: Optional[str] = None,
        safety_features: Optional[List[str]] = None,
        recalls: Optional[Dict[str, Any]] = None,
        oem_packages: Optional[List[str]] = None,
        extraction_source: str = "combined",
        confidence_score: Optional[float] = None
    ) -> VINKnowledgeBase:
        """Store VIN knowledge in knowledge base"""
        try:
            vin_clean = vin.upper().strip()
            
            # Check if VIN already exists
            existing = await self.get_vin_knowledge(vin_clean)
            
            if existing:
                # Update existing
                for key, value in locals().items():
                    if key not in ['self', 'db', 'vin', 'vin_clean', 'existing'] and value is not None:
                        if hasattr(existing, key):
                            setattr(existing, key, value)
                
                await self.db.commit()
                await self.db.refresh(existing)
                return existing
            
            # Create new
            vin_kb = VINKnowledgeBase(
                vin=vin_clean,
                make=make,
                model=model,
                year=year,
                trim=trim,
                nhtsa_data=nhtsa_data,
                features_interior=features_interior or [],
                features_exterior=features_exterior or [],
                features_safety=features_safety or [],
                features_technology=features_technology or [],
                features_comfort=features_comfort or [],
                features_powertrain=features_powertrain or [],
                features_audio_entertainment=features_audio_entertainment or [],
                all_features=all_features or [],
                mpg_city=mpg_city,
                mpg_highway=mpg_highway,
                engine_type=engine_type,
                engine_size=engine_size,
                transmission_type=transmission_type,
                drivetrain=drivetrain,
                safety_features=safety_features or [],
                recalls=recalls,
                oem_packages=oem_packages or [],
                extraction_source=extraction_source,
                confidence_score=confidence_score
            )
            
            self.db.add(vin_kb)
            await self.db.commit()
            await self.db.refresh(vin_kb)
            
            logger.info(f"Stored VIN knowledge for {vin_clean}")
            return vin_kb
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error storing VIN knowledge: {e}")
            raise


class SellerProfileRulesService:
    """Service for managing seller profile rules"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_or_create_seller_rules(
        self,
        user_id: UUID
    ) -> SellerProfileRules:
        """Get seller profile rules, create defaults if not exists"""
        try:
            query = select(SellerProfileRules).where(
                SellerProfileRules.user_id == user_id
            )
            
            result = await self.db.execute(query)
            rules = result.scalar_one_or_none()
            
            if not rules:
                # Create default rules
                rules = SellerProfileRules(user_id=user_id)
                self.db.add(rules)
                await self.db.commit()
                await self.db.refresh(rules)
            
            return rules
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error getting seller rules: {e}")
            raise
    
    async def update_seller_rules(
        self,
        user_id: UUID,
        **updates
    ) -> SellerProfileRules:
        """Update seller profile rules"""
        try:
            rules = await self.get_or_create_seller_rules(user_id)
            
            for key, value in updates.items():
                if hasattr(rules, key) and value is not None:
                    setattr(rules, key, value)
            
            await self.db.commit()
            await self.db.refresh(rules)
            
            return rules
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error updating seller rules: {e}")
            raise


class ListingRulesService:
    """Service for managing listing-specific rules"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_or_create_listing_rules(
        self,
        listing_id: UUID,
        user_id: UUID
    ) -> ListingRules:
        """Get listing rules, create defaults if not exists"""
        try:
            query = select(ListingRules).where(
                ListingRules.listing_id == listing_id
            )
            
            result = await self.db.execute(query)
            rules = result.scalar_one_or_none()
            
            if not rules:
                # Create default rules
                rules = ListingRules(
                    listing_id=listing_id,
                    user_id=user_id
                )
                self.db.add(rules)
                await self.db.commit()
                await self.db.refresh(rules)
            
            return rules
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error getting listing rules: {e}")
            raise
    
    async def update_listing_rules(
        self,
        listing_id: UUID,
        user_id: UUID,
        **updates
    ) -> ListingRules:
        """Update listing rules"""
        try:
            rules = await self.get_or_create_listing_rules(listing_id, user_id)
            
            for key, value in updates.items():
                if hasattr(rules, key) and value is not None:
                    setattr(rules, key, value)
            
            await self.db.commit()
            await self.db.refresh(rules)
            
            return rules
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error updating listing rules: {e}")
            raise


class KnowledgeLearningService:
    """Service for knowledge graph learning (UARE Layer 1 foundation)"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def learn_from_answer(
        self,
        user_id: UUID,
        question: str,
        answer: str,
        listing_id: Optional[UUID] = None,
        vin: Optional[str] = None,
        source: str = "manual",
        uare_layer: str = "layer1_factual",
        applies_to_vin: bool = False,
        applies_to_similar: bool = False,
        applies_to_all_listings: bool = False,
        can_auto_send: bool = False
    ) -> KnowledgeGraphLearning:
        """Learn from a manual answer and store in knowledge graph"""
        try:
            learning = KnowledgeGraphLearning(
                user_id=user_id,
                listing_id=listing_id,
                vin=vin,
                question=question,
                answer=answer,
                source=source,
                uare_layer=uare_layer,
                applies_to_vin=applies_to_vin,
                applies_to_similar=applies_to_similar,
                applies_to_all_listings=applies_to_all_listings,
                can_auto_send=can_auto_send
            )
            
            self.db.add(learning)
            await self.db.commit()
            await self.db.refresh(learning)
            
            logger.info(f"Learned from answer: {question[:50]}...")
            return learning
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error learning from answer: {e}")
            raise
    
    async def find_answer(
        self,
        user_id: UUID,
        question: str,
        listing_id: Optional[UUID] = None,
        vin: Optional[str] = None
    ) -> Optional[KnowledgeGraphLearning]:
        """Find a learned answer for a question"""
        try:
            # Try to find exact match first
            query = select(KnowledgeGraphLearning).where(
                KnowledgeGraphLearning.user_id == user_id,
                KnowledgeGraphLearning.question.ilike(f"%{question}%")
            )
            
            # Prioritize by application rules
            if listing_id:
                query = query.where(
                    (KnowledgeGraphLearning.listing_id == listing_id) |
                    (KnowledgeGraphLearning.applies_to_all_listings == True)
                )
            
            if vin:
                query = query.where(
                    (KnowledgeGraphLearning.vin == vin) |
                    (KnowledgeGraphLearning.applies_to_vin == True) |
                    (KnowledgeGraphLearning.applies_to_all_listings == True)
                )
            
            query = query.order_by(
                KnowledgeGraphLearning.usage_count.desc(),
                KnowledgeGraphLearning.success_rate.desc()
            ).limit(1)
            
            result = await self.db.execute(query)
            learning = result.scalar_one_or_none()
            
            if learning:
                # Update usage tracking
                learning.usage_count += 1
                from sqlalchemy.sql import func
                learning.last_used_at = func.now()
                await self.db.commit()
                await self.db.refresh(learning)
            
            return learning
            
        except Exception as e:
            logger.error(f"Error finding answer: {e}")
            return None


class SessionPersistenceService:
    """Service for session persistence (Supabase-only, no localStorage)"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create_or_update_session(
        self,
        user_id: UUID,
        session_data: Dict[str, Any],
        device_type: str = "desktop",
        device_id: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> UserSession:
        """Create or update user session (stored in Supabase, not localStorage)"""
        try:
            # Try to find existing active session for this device
            query = select(UserSession).where(
                UserSession.user_id == user_id,
                UserSession.device_id == device_id,
                UserSession.is_active == True
            )
            
            result = await self.db.execute(query)
            session = result.scalar_one_or_none()
            
            if session:
                # Update existing session
                session.session_data = session_data
                from sqlalchemy.sql import func
                session.last_activity_at = func.now()
            else:
                # Create new session
                session = UserSession(
                    user_id=user_id,
                    session_data=session_data,
                    device_type=device_type,
                    device_id=device_id,
                    user_agent=user_agent
                )
                self.db.add(session)
            
            await self.db.commit()
            await self.db.refresh(session)
            
            return session
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error creating/updating session: {e}")
            raise
    
    async def get_session(
        self,
        user_id: UUID,
        device_id: Optional[str] = None
    ) -> Optional[UserSession]:
        """Get user session"""
        try:
            query = select(UserSession).where(
                UserSession.user_id == user_id,
                UserSession.is_active == True
            )
            
            if device_id:
                query = query.where(UserSession.device_id == device_id)
            
            query = query.order_by(UserSession.last_activity_at.desc()).limit(1)
            
            result = await self.db.execute(query)
            return result.scalar_one_or_none()
            
        except Exception as e:
            logger.error(f"Error getting session: {e}")
            return None
    
    async def invalidate_session(
        self,
        user_id: UUID,
        device_id: Optional[str] = None
    ) -> bool:
        """Invalidate user session"""
        try:
            query = select(UserSession).where(
                UserSession.user_id == user_id,
                UserSession.is_active == True
            )
            
            if device_id:
                query = query.where(UserSession.device_id == device_id)
            
            result = await self.db.execute(query)
            sessions = result.scalars().all()
            
            for session in sessions:
                session.is_active = False
            
            await self.db.commit()
            return True
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error invalidating session: {e}")
            return False













