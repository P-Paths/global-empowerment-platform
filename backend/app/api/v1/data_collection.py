"""
Data Collection API Endpoints
Provides comprehensive data collection capabilities for Accorria
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
from datetime import datetime
import logging
from app.services.data_collection_service import (
    data_collection_service, 
    EventType, 
    DataCategory
)
from app.core.database import get_sync_db as get_db
from sqlalchemy.orm import Session
from app.api.v1.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()

# Request Models
class SessionStartRequest(BaseModel):
    user_id: Optional[str] = None
    referrer: Optional[str] = None
    utm_source: Optional[str] = None
    utm_medium: Optional[str] = None
    utm_campaign: Optional[str] = None

class EventTrackRequest(BaseModel):
    event_type: str
    session_id: str
    user_id: Optional[str] = None
    properties: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None

class ListingViewRequest(BaseModel):
    session_id: str
    user_id: Optional[str] = None
    listing_id: str
    asset_type: str
    price: float
    region: str
    source: str = "organic"

class OfferMadeRequest(BaseModel):
    session_id: str
    user_id: str
    listing_id: str
    offer_amount: float
    list_price: float
    asset_type: str
    region: str

class EscrowEventRequest(BaseModel):
    session_id: str
    user_id: str
    listing_id: str
    escrow_status: str
    amount: float
    asset_type: str
    region: str
    failure_reason: Optional[str] = None

class AIInteractionRequest(BaseModel):
    session_id: str
    user_id: Optional[str] = None
    ai_feature: str
    user_action: str
    input_data: Dict[str, Any]
    output_data: Dict[str, Any]
    processing_time_ms: int

class CrossPlatformPostRequest(BaseModel):
    session_id: str
    user_id: str
    listing_id: str
    platform: str
    success: bool
    response_data: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None

class SearchBehaviorRequest(BaseModel):
    session_id: str
    user_id: Optional[str] = None
    search_query: str
    filters: Dict[str, Any]
    results_count: int
    clicked_results: List[str]

class ConversionFunnelRequest(BaseModel):
    session_id: str
    user_id: Optional[str] = None
    funnel_stage: str
    asset_type: str
    region: str

# Response Models
class SessionResponse(BaseModel):
    session_id: str
    success: bool
    message: str

class EventResponse(BaseModel):
    event_id: str
    success: bool
    message: str

class AnalyticsResponse(BaseModel):
    user_id: str
    period_days: int
    total_events: int
    sessions_count: int
    avg_session_duration: float
    most_viewed_asset_types: List[str]
    conversion_rate: float
    preferred_regions: List[str]

class MarketIntelligenceResponse(BaseModel):
    asset_type: Optional[str]
    region: Optional[str]
    signal_type: Optional[str]
    period_days: int
    signals_count: int
    avg_confidence: float
    trend_direction: str
    key_insights: List[str]

# API Endpoints
@router.post("/session/start", response_model=SessionResponse)
async def start_session(
    request: SessionStartRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Start a new user session (Google Analytics style)"""
    try:
        user_id = current_user.get("user_id") if current_user else request.user_id
        
        session_id = await data_collection_service.start_session(
            user_id=user_id,
            referrer=request.referrer
        )
        
        return SessionResponse(
            session_id=session_id,
            success=True,
            message="Session started successfully"
        )
        
    except Exception as e:
        logger.error(f"Failed to start session: {e}")
        raise HTTPException(status_code=500, detail="Failed to start session")

@router.post("/event/track", response_model=EventResponse)
async def track_event(
    request: EventTrackRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Track a generic event (Mixpanel style)"""
    try:
        user_id = current_user.get("user_id") if current_user else request.user_id
        
        # Convert string to EventType enum
        event_type = EventType(request.event_type)
        
        event_id = await data_collection_service.track_event(
            event_type=event_type,
            session_id=request.session_id,
            user_id=user_id,
            properties=request.properties,
            metadata=request.metadata
        )
        
        return EventResponse(
            event_id=event_id,
            success=True,
            message="Event tracked successfully"
        )
        
    except Exception as e:
        logger.error(f"Failed to track event: {e}")
        raise HTTPException(status_code=500, detail="Failed to track event")

@router.post("/listing/view", response_model=EventResponse)
async def track_listing_view(
    request: ListingViewRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Track listing view (Amazon style)"""
    try:
        user_id = current_user.get("user_id") if current_user else request.user_id
        
        await data_collection_service.track_listing_view(
            session_id=request.session_id,
            user_id=user_id,
            listing_id=request.listing_id,
            asset_type=request.asset_type,
            price=request.price,
            region=request.region,
            source=request.source
        )
        
        return EventResponse(
            event_id="listing_view_tracked",
            success=True,
            message="Listing view tracked successfully"
        )
        
    except Exception as e:
        logger.error(f"Failed to track listing view: {e}")
        raise HTTPException(status_code=500, detail="Failed to track listing view")

@router.post("/offer/made", response_model=EventResponse)
async def track_offer_made(
    request: OfferMadeRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Track offer made (eBay style)"""
    try:
        user_id = current_user.get("user_id") if current_user else request.user_id
        
        await data_collection_service.track_offer_made(
            session_id=request.session_id,
            user_id=user_id,
            listing_id=request.listing_id,
            offer_amount=request.offer_amount,
            list_price=request.list_price,
            asset_type=request.asset_type,
            region=request.region
        )
        
        return EventResponse(
            event_id="offer_made_tracked",
            success=True,
            message="Offer made tracked successfully"
        )
        
    except Exception as e:
        logger.error(f"Failed to track offer made: {e}")
        raise HTTPException(status_code=500, detail="Failed to track offer made")

@router.post("/escrow/event", response_model=EventResponse)
async def track_escrow_event(
    request: EscrowEventRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Track escrow event (PayPal style)"""
    try:
        user_id = current_user.get("user_id") if current_user else request.user_id
        
        await data_collection_service.track_escrow_event(
            session_id=request.session_id,
            user_id=user_id,
            listing_id=request.listing_id,
            escrow_status=request.escrow_status,
            amount=request.amount,
            asset_type=request.asset_type,
            region=request.region,
            failure_reason=request.failure_reason
        )
        
        return EventResponse(
            event_id="escrow_event_tracked",
            success=True,
            message="Escrow event tracked successfully"
        )
        
    except Exception as e:
        logger.error(f"Failed to track escrow event: {e}")
        raise HTTPException(status_code=500, detail="Failed to track escrow event")

@router.post("/ai/interaction", response_model=EventResponse)
async def track_ai_interaction(
    request: AIInteractionRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Track AI interaction (OpenAI style)"""
    try:
        user_id = current_user.get("user_id") if current_user else request.user_id
        
        await data_collection_service.track_ai_interaction(
            session_id=request.session_id,
            user_id=user_id,
            ai_feature=request.ai_feature,
            user_action=request.user_action,
            input_data=request.input_data,
            output_data=request.output_data,
            processing_time_ms=request.processing_time_ms
        )
        
        return EventResponse(
            event_id="ai_interaction_tracked",
            success=True,
            message="AI interaction tracked successfully"
        )
        
    except Exception as e:
        logger.error(f"Failed to track AI interaction: {e}")
        raise HTTPException(status_code=500, detail="Failed to track AI interaction")

@router.post("/cross-platform/post", response_model=EventResponse)
async def track_cross_platform_posting(
    request: CrossPlatformPostRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Track cross-platform posting (Buffer style)"""
    try:
        user_id = current_user.get("user_id") if current_user else request.user_id
        
        await data_collection_service.track_cross_platform_posting(
            session_id=request.session_id,
            user_id=user_id,
            listing_id=request.listing_id,
            platform=request.platform,
            success=request.success,
            response_data=request.response_data,
            error_message=request.error_message
        )
        
        return EventResponse(
            event_id="cross_platform_post_tracked",
            success=True,
            message="Cross-platform posting tracked successfully"
        )
        
    except Exception as e:
        logger.error(f"Failed to track cross-platform posting: {e}")
        raise HTTPException(status_code=500, detail="Failed to track cross-platform posting")

@router.post("/search/behavior", response_model=EventResponse)
async def track_search_behavior(
    request: SearchBehaviorRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Track search behavior (Google style)"""
    try:
        user_id = current_user.get("user_id") if current_user else request.user_id
        
        await data_collection_service.track_search_behavior(
            session_id=request.session_id,
            user_id=user_id,
            search_query=request.search_query,
            filters=request.filters,
            results_count=request.results_count,
            clicked_results=request.clicked_results
        )
        
        return EventResponse(
            event_id="search_behavior_tracked",
            success=True,
            message="Search behavior tracked successfully"
        )
        
    except Exception as e:
        logger.error(f"Failed to track search behavior: {e}")
        raise HTTPException(status_code=500, detail="Failed to track search behavior")

@router.post("/conversion/funnel", response_model=EventResponse)
async def track_conversion_funnel(
    request: ConversionFunnelRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Track conversion funnel (Facebook Ads style)"""
    try:
        user_id = current_user.get("user_id") if current_user else request.user_id
        
        await data_collection_service.track_conversion_funnel(
            session_id=request.session_id,
            user_id=user_id,
            funnel_stage=request.funnel_stage,
            asset_type=request.asset_type,
            region=request.region
        )
        
        return EventResponse(
            event_id="conversion_funnel_tracked",
            success=True,
            message="Conversion funnel tracked successfully"
        )
        
    except Exception as e:
        logger.error(f"Failed to track conversion funnel: {e}")
        raise HTTPException(status_code=500, detail="Failed to track conversion funnel")

@router.get("/analytics/user/{user_id}", response_model=AnalyticsResponse)
async def get_user_analytics(
    user_id: str,
    days: int = 30,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user analytics (Mixpanel style)"""
    try:
        # Verify user can access this data
        if current_user and current_user.get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        analytics = await data_collection_service.get_user_analytics(user_id, days)
        
        return AnalyticsResponse(**analytics)
        
    except Exception as e:
        logger.error(f"Failed to get user analytics: {e}")
        raise HTTPException(status_code=500, detail="Failed to get user analytics")

@router.get("/market/intelligence", response_model=MarketIntelligenceResponse)
async def get_market_intelligence(
    asset_type: Optional[str] = None,
    region: Optional[str] = None,
    signal_type: Optional[str] = None,
    days: int = 30,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get market intelligence (Bloomberg style)"""
    try:
        intelligence = await data_collection_service.get_market_intelligence(
            asset_type=asset_type,
            region=region,
            signal_type=signal_type,
            days=days
        )
        
        return MarketIntelligenceResponse(**intelligence)
        
    except Exception as e:
        logger.error(f"Failed to get market intelligence: {e}")
        raise HTTPException(status_code=500, detail="Failed to get market intelligence")

@router.post("/flush/events")
async def flush_events(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Manually flush events to database"""
    try:
        await data_collection_service.flush_events()
        await data_collection_service.flush_market_signals()
        
        return {"success": True, "message": "Events flushed successfully"}
        
    except Exception as e:
        logger.error(f"Failed to flush events: {e}")
        raise HTTPException(status_code=500, detail="Failed to flush events")

@router.post("/cleanup/sessions")
async def cleanup_sessions(
    max_age_hours: int = 24,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Clean up old sessions (privacy compliance)"""
    try:
        await data_collection_service.cleanup_old_sessions(max_age_hours)
        
        return {"success": True, "message": "Sessions cleaned up successfully"}
        
    except Exception as e:
        logger.error(f"Failed to cleanup sessions: {e}")
        raise HTTPException(status_code=500, detail="Failed to cleanup sessions")
