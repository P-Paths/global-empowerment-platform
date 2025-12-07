"""
Knowledge Graph API Endpoints
Phase 0: API endpoints for Knowledge Graph foundation
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.utils.auth import get_current_user_id
from app.services.knowledge_graph_service import (
    KnowledgeGraphService,
    VINKnowledgeService,
    SellerProfileRulesService,
    ListingRulesService,
    KnowledgeLearningService,
    SessionPersistenceService
)

router = APIRouter()


# ============================================================================
# Pydantic Models
# ============================================================================

class KnowledgeGraphNodeCreate(BaseModel):
    listing_id: UUID
    vin: Optional[str] = None
    condition: Optional[str] = None
    rebuild_reason: Optional[str] = None
    mileage: Optional[int] = None
    specs: Optional[Dict[str, Any]] = None
    history: Optional[Dict[str, Any]] = None
    faqs: Optional[Dict[str, Any]] = None
    images: Optional[List[str]] = None
    market_comps: Optional[Dict[str, Any]] = None
    ai_summary: Optional[str] = None
    key_selling_points: Optional[List[str]] = None
    vin_data: Optional[Dict[str, Any]] = None


class KnowledgeGraphNodeUpdate(BaseModel):
    vin: Optional[str] = None
    condition: Optional[str] = None
    rebuild_reason: Optional[str] = None
    mileage: Optional[int] = None
    specs: Optional[Dict[str, Any]] = None
    history: Optional[Dict[str, Any]] = None
    faqs: Optional[Dict[str, Any]] = None
    images: Optional[List[str]] = None
    market_comps: Optional[Dict[str, Any]] = None
    ai_summary: Optional[str] = None
    key_selling_points: Optional[List[str]] = None
    vin_data: Optional[Dict[str, Any]] = None


class SellerProfileRulesUpdate(BaseModel):
    default_price_threshold: Optional[float] = None
    price_threshold_percentage: Optional[float] = None
    no_financing: Optional[bool] = None
    no_trades: Optional[bool] = None
    no_delivery: Optional[bool] = None
    no_out_of_state: Optional[bool] = None
    negotiation_style: Optional[str] = None
    max_concessions: Optional[int] = None
    auto_decline_percentage: Optional[float] = None
    response_tone: Optional[str] = None
    response_speed: Optional[str] = None
    emoji_usage: Optional[bool] = None
    auto_send_factual: Optional[bool] = None
    require_approval_negotiation: Optional[bool] = None
    require_approval_relationship: Optional[bool] = None


class ListingRulesUpdate(BaseModel):
    asking_price: Optional[float] = None
    price_threshold: Optional[float] = None
    no_financing: Optional[bool] = None
    no_trades: Optional[bool] = None
    no_delivery: Optional[bool] = None
    no_out_of_state: Optional[bool] = None
    rebuild_reason: Optional[str] = None
    rebuild_details: Optional[str] = None
    mechanical_notes: Optional[List[str]] = None
    repair_history: Optional[List[str]] = None
    warranty_status: Optional[str] = None
    warranty_details: Optional[str] = None


class KnowledgeLearningCreate(BaseModel):
    question: str
    answer: str
    listing_id: Optional[UUID] = None
    vin: Optional[str] = None
    source: str = "manual"
    uare_layer: str = "layer1_factual"
    applies_to_vin: bool = False
    applies_to_similar: bool = False
    applies_to_all_listings: bool = False
    can_auto_send: bool = False


class SessionDataUpdate(BaseModel):
    session_data: Dict[str, Any]
    device_type: Optional[str] = "desktop"
    device_id: Optional[str] = None
    user_agent: Optional[str] = None


# ============================================================================
# Knowledge Graph Node Endpoints
# ============================================================================

@router.post("/knowledge-graph/nodes")
async def create_knowledge_graph_node(
    data: KnowledgeGraphNodeCreate,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Create a knowledge graph node for a listing"""
    try:
        service = KnowledgeGraphService(db)
        node = await service.create_knowledge_graph_node(
            user_id=UUID(current_user_id),
            listing_id=data.listing_id,
            vin=data.vin,
            condition=data.condition,
            rebuild_reason=data.rebuild_reason,
            mileage=data.mileage,
            specs=data.specs,
            history=data.history,
            faqs=data.faqs,
            images=data.images,
            market_comps=data.market_comps,
            ai_summary=data.ai_summary,
            key_selling_points=data.key_selling_points,
            vin_data=data.vin_data
        )
        
        return {
            "id": str(node.id),
            "listing_id": str(node.listing_id),
            "vin": node.vin,
            "created_at": node.created_at.isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/knowledge-graph/nodes/{listing_id}")
async def get_knowledge_graph_node(
    listing_id: UUID,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Get knowledge graph node for a listing"""
    try:
        service = KnowledgeGraphService(db)
        node = await service.get_knowledge_graph_node(
            listing_id=listing_id,
            user_id=UUID(current_user_id)
        )
        
        if not node:
            raise HTTPException(status_code=404, detail="Knowledge graph node not found")
        
        return {
            "id": str(node.id),
            "listing_id": str(node.listing_id),
            "vin": node.vin,
            "condition": node.condition,
            "rebuild_reason": node.rebuild_reason,
            "mileage": node.mileage,
            "specs": node.specs,
            "history": node.history,
            "faqs": node.faqs,
            "images": node.images,
            "market_comps": node.market_comps,
            "ai_summary": node.ai_summary,
            "key_selling_points": node.key_selling_points,
            "vin_data": node.vin_data,
            "vin_decoded": node.vin_decoded,
            "created_at": node.created_at.isoformat(),
            "updated_at": node.updated_at.isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/knowledge-graph/nodes/{listing_id}")
async def update_knowledge_graph_node(
    listing_id: UUID,
    data: KnowledgeGraphNodeUpdate,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Update knowledge graph node"""
    try:
        service = KnowledgeGraphService(db)
        updates = data.dict(exclude_unset=True)
        
        node = await service.update_knowledge_graph_node(
            listing_id=listing_id,
            user_id=UUID(current_user_id),
            **updates
        )
        
        if not node:
            raise HTTPException(status_code=404, detail="Knowledge graph node not found")
        
        return {
            "id": str(node.id),
            "listing_id": str(node.listing_id),
            "updated_at": node.updated_at.isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/knowledge-graph/nodes")
async def get_user_knowledge_graph_nodes(
    limit: int = 100,
    offset: int = 0,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Get all knowledge graph nodes for current user"""
    try:
        service = KnowledgeGraphService(db)
        nodes = await service.get_user_knowledge_graph_nodes(
            user_id=UUID(current_user_id),
            limit=limit,
            offset=offset
        )
        
        return [
            {
                "id": str(node.id),
                "listing_id": str(node.listing_id),
                "vin": node.vin,
                "condition": node.condition,
                "mileage": node.mileage,
                "updated_at": node.updated_at.isoformat()
            }
            for node in nodes
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# VIN Knowledge Endpoints
# ============================================================================

@router.get("/vin/{vin}/knowledge")
async def get_vin_knowledge(
    vin: str,
    db: AsyncSession = Depends(get_db)
):
    """Get VIN knowledge from knowledge base"""
    try:
        service = VINKnowledgeService(db)
        vin_kb = await service.get_vin_knowledge(vin)
        
        if not vin_kb:
            raise HTTPException(status_code=404, detail="VIN knowledge not found")
        
        return {
            "vin": vin_kb.vin,
            "make": vin_kb.make,
            "model": vin_kb.model,
            "year": vin_kb.year,
            "trim": vin_kb.trim,
            "nhtsa_data": vin_kb.nhtsa_data,
            "features_interior": vin_kb.features_interior,
            "features_exterior": vin_kb.features_exterior,
            "features_safety": vin_kb.features_safety,
            "features_technology": vin_kb.features_technology,
            "features_comfort": vin_kb.features_comfort,
            "features_powertrain": vin_kb.features_powertrain,
            "features_audio_entertainment": vin_kb.features_audio_entertainment,
            "all_features": vin_kb.all_features,
            "mpg_city": vin_kb.mpg_city,
            "mpg_highway": vin_kb.mpg_highway,
            "engine_type": vin_kb.engine_type,
            "engine_size": vin_kb.engine_size,
            "transmission_type": vin_kb.transmission_type,
            "drivetrain": vin_kb.drivetrain,
            "safety_features": vin_kb.safety_features,
            "recalls": vin_kb.recalls,
            "oem_packages": vin_kb.oem_packages,
            "usage_count": vin_kb.usage_count,
            "last_used_date": vin_kb.last_used_date.isoformat() if vin_kb.last_used_date else None
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Seller Profile Rules Endpoints
# ============================================================================

@router.get("/seller-profile/rules")
async def get_seller_profile_rules(
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Get seller profile rules"""
    try:
        service = SellerProfileRulesService(db)
        rules = await service.get_or_create_seller_rules(UUID(current_user_id))
        
        return {
            "id": str(rules.id),
            "user_id": str(rules.user_id),
            "default_price_threshold": float(rules.default_price_threshold) if rules.default_price_threshold else None,
            "price_threshold_percentage": float(rules.price_threshold_percentage) if rules.price_threshold_percentage else None,
            "no_financing": rules.no_financing,
            "no_trades": rules.no_trades,
            "no_delivery": rules.no_delivery,
            "no_out_of_state": rules.no_out_of_state,
            "negotiation_style": rules.negotiation_style,
            "max_concessions": rules.max_concessions,
            "auto_decline_percentage": float(rules.auto_decline_percentage) if rules.auto_decline_percentage else None,
            "response_tone": rules.response_tone,
            "response_speed": rules.response_speed,
            "emoji_usage": rules.emoji_usage,
            "auto_send_factual": rules.auto_send_factual,
            "require_approval_negotiation": rules.require_approval_negotiation,
            "require_approval_relationship": rules.require_approval_relationship
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/seller-profile/rules")
async def update_seller_profile_rules(
    data: SellerProfileRulesUpdate,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Update seller profile rules"""
    try:
        service = SellerProfileRulesService(db)
        updates = data.dict(exclude_unset=True)
        
        rules = await service.update_seller_rules(
            user_id=UUID(current_user_id),
            **updates
        )
        
        return {
            "id": str(rules.id),
            "updated_at": rules.updated_at.isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Listing Rules Endpoints
# ============================================================================

@router.get("/listings/{listing_id}/rules")
async def get_listing_rules(
    listing_id: UUID,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Get listing-specific rules"""
    try:
        service = ListingRulesService(db)
        rules = await service.get_or_create_listing_rules(
            listing_id=listing_id,
            user_id=UUID(current_user_id)
        )
        
        return {
            "id": str(rules.id),
            "listing_id": str(rules.listing_id),
            "asking_price": float(rules.asking_price) if rules.asking_price else None,
            "price_threshold": float(rules.price_threshold) if rules.price_threshold else None,
            "no_financing": rules.no_financing,
            "no_trades": rules.no_trades,
            "no_delivery": rules.no_delivery,
            "no_out_of_state": rules.no_out_of_state,
            "rebuild_reason": rules.rebuild_reason,
            "rebuild_details": rules.rebuild_details,
            "mechanical_notes": rules.mechanical_notes,
            "repair_history": rules.repair_history,
            "warranty_status": rules.warranty_status,
            "warranty_details": rules.warranty_details
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/listings/{listing_id}/rules")
async def update_listing_rules(
    listing_id: UUID,
    data: ListingRulesUpdate,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Update listing-specific rules"""
    try:
        service = ListingRulesService(db)
        updates = data.dict(exclude_unset=True)
        
        rules = await service.update_listing_rules(
            listing_id=listing_id,
            user_id=UUID(current_user_id),
            **updates
        )
        
        return {
            "id": str(rules.id),
            "updated_at": rules.updated_at.isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Knowledge Learning Endpoints (UARE Layer 1 Foundation)
# ============================================================================

@router.post("/knowledge-learning/learn")
async def learn_from_answer(
    data: KnowledgeLearningCreate,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Learn from a manual answer and store in knowledge graph"""
    try:
        service = KnowledgeLearningService(db)
        learning = await service.learn_from_answer(
            user_id=UUID(current_user_id),
            question=data.question,
            answer=data.answer,
            listing_id=data.listing_id,
            vin=data.vin,
            source=data.source,
            uare_layer=data.uare_layer,
            applies_to_vin=data.applies_to_vin,
            applies_to_similar=data.applies_to_similar,
            applies_to_all_listings=data.applies_to_all_listings,
            can_auto_send=data.can_auto_send
        )
        
        return {
            "id": str(learning.id),
            "question": learning.question,
            "answer": learning.answer,
            "created_at": learning.created_at.isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/knowledge-learning/find")
async def find_learned_answer(
    question: str,
    listing_id: Optional[UUID] = None,
    vin: Optional[str] = None,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Find a learned answer for a question"""
    try:
        service = KnowledgeLearningService(db)
        learning = await service.find_answer(
            user_id=UUID(current_user_id),
            question=question,
            listing_id=listing_id,
            vin=vin
        )
        
        if not learning:
            raise HTTPException(status_code=404, detail="No learned answer found")
        
        return {
            "id": str(learning.id),
            "question": learning.question,
            "answer": learning.answer,
            "source": learning.source,
            "uare_layer": learning.uare_layer,
            "can_auto_send": learning.can_auto_send,
            "usage_count": learning.usage_count,
            "success_rate": float(learning.success_rate) if learning.success_rate else None
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Session Persistence Endpoints (Supabase-only, no localStorage)
# ============================================================================

@router.post("/sessions")
async def create_or_update_session(
    data: SessionDataUpdate,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Create or update user session (stored in Supabase, not localStorage)"""
    try:
        service = SessionPersistenceService(db)
        session = await service.create_or_update_session(
            user_id=UUID(current_user_id),
            session_data=data.session_data,
            device_type=data.device_type or "desktop",
            device_id=data.device_id,
            user_agent=data.user_agent
        )
        
        return {
            "id": str(session.id),
            "device_type": session.device_type,
            "device_id": session.device_id,
            "last_activity_at": session.last_activity_at.isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sessions")
async def get_session(
    device_id: Optional[str] = None,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Get user session"""
    try:
        service = SessionPersistenceService(db)
        session = await service.get_session(
            user_id=UUID(current_user_id),
            device_id=device_id
        )
        
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        return {
            "id": str(session.id),
            "session_data": session.session_data,
            "device_type": session.device_type,
            "device_id": session.device_id,
            "last_activity_at": session.last_activity_at.isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/sessions")
async def invalidate_session(
    device_id: Optional[str] = None,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Invalidate user session"""
    try:
        service = SessionPersistenceService(db)
        success = await service.invalidate_session(
            user_id=UUID(current_user_id),
            device_id=device_id
        )
        
        return {"success": success}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))













