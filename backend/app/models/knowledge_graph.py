"""
Knowledge Graph Models
Phase 0: Foundation models for Knowledge Graph, VIN fingerprinting, and session persistence
"""

from sqlalchemy import Column, String, Integer, Boolean, Text, DECIMAL, ForeignKey, ARRAY, JSON
from sqlalchemy.dialects.postgresql import UUID, JSONB, TIMESTAMP
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import uuid


class KnowledgeGraphNode(Base):
    """Core vehicle knowledge graph node - stores all vehicle knowledge"""
    __tablename__ = "knowledge_graph_nodes"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    listing_id = Column(UUID(as_uuid=True), ForeignKey("car_listings.id", ondelete="CASCADE"), unique=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    
    # Core vehicle data
    vin = Column(String(17))
    condition = Column(Text)
    rebuild_reason = Column(Text)
    mileage = Column(Integer)
    specs = Column(JSONB)  # Full vehicle specifications
    
    # Knowledge graph data
    history = Column(JSONB)  # Vehicle history (accidents, repairs, etc.)
    faqs = Column(JSONB)  # Frequently asked questions and answers
    images = Column(ARRAY(Text))  # Image URLs
    market_comps = Column(JSONB)  # Market comparisons and pricing data
    
    # AI-generated data
    ai_summary = Column(Text)
    key_selling_points = Column(ARRAY(Text))
    
    # VIN fingerprint data
    vin_decoded = Column(Boolean, default=False)
    vin_data = Column(JSONB)  # Full VIN decode data from NHTSA
    
    # Metadata
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())


class VINKnowledgeBase(Base):
    """Enhanced VIN fingerprint storage - shared knowledge across all users"""
    __tablename__ = "vin_knowledge_base"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vin = Column(Text, unique=True, nullable=False)
    make = Column(Text)
    model = Column(Text)
    year = Column(Integer)
    trim = Column(Text)
    
    # NHTSA Decoded Data
    nhtsa_data = Column(JSONB)
    
    # Extracted Features
    features_interior = Column(ARRAY(Text))
    features_exterior = Column(ARRAY(Text))
    features_safety = Column(ARRAY(Text))
    features_technology = Column(ARRAY(Text))
    features_comfort = Column(ARRAY(Text))
    features_powertrain = Column(ARRAY(Text))
    features_audio_entertainment = Column(ARRAY(Text))
    all_features = Column(ARRAY(Text))
    
    # VIN-specific knowledge
    mpg_city = Column(Integer)
    mpg_highway = Column(Integer)
    engine_type = Column(Text)
    engine_size = Column(Text)
    transmission_type = Column(Text)
    drivetrain = Column(Text)
    safety_features = Column(ARRAY(Text))
    recalls = Column(JSONB)
    oem_packages = Column(ARRAY(Text))
    
    # Metadata
    extraction_source = Column(Text)
    extraction_date = Column(TIMESTAMP(timezone=True), server_default=func.now())
    last_used_date = Column(TIMESTAMP(timezone=True), server_default=func.now())
    usage_count = Column(Integer, default=1)
    confidence_score = Column(DECIMAL(3, 2))
    verified = Column(Boolean, default=False)
    
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())


class SellerProfileRules(Base):
    """Seller profile rules - thresholds, policies, preferences"""
    __tablename__ = "seller_profile_rules"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    # Pricing rules
    default_price_threshold = Column(DECIMAL(10, 2))
    price_threshold_percentage = Column(DECIMAL(5, 2), default=20.00)
    
    # Policy flags
    no_financing = Column(Boolean, default=False)
    no_trades = Column(Boolean, default=False)
    no_delivery = Column(Boolean, default=False)
    no_out_of_state = Column(Boolean, default=False)
    
    # Negotiation preferences
    negotiation_style = Column(String(50), default="balanced")  # 'firm', 'flexible', 'balanced'
    max_concessions = Column(Integer, default=3)
    auto_decline_percentage = Column(DECIMAL(5, 2), default=20.00)
    
    # Communication preferences
    response_tone = Column(String(50), default="professional")
    response_speed = Column(String(50), default="normal")
    emoji_usage = Column(Boolean, default=True)
    
    # UARE settings
    auto_send_factual = Column(Boolean, default=True)
    require_approval_negotiation = Column(Boolean, default=True)
    require_approval_relationship = Column(Boolean, default=True)
    
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())


class ListingRules(Base):
    """Listing-specific rules - per-listing thresholds and policies"""
    __tablename__ = "listing_rules"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    listing_id = Column(UUID(as_uuid=True), ForeignKey("car_listings.id", ondelete="CASCADE"), unique=True, nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    
    # Listing-specific pricing
    asking_price = Column(DECIMAL(10, 2))
    price_threshold = Column(DECIMAL(10, 2))
    
    # Listing-specific policies (NULL = use seller default)
    no_financing = Column(Boolean, default=None)
    no_trades = Column(Boolean, default=None)
    no_delivery = Column(Boolean, default=None)
    no_out_of_state = Column(Boolean, default=None)
    
    # Rebuild explanation
    rebuild_reason = Column(Text)
    rebuild_details = Column(Text)
    
    # Mechanical notes
    mechanical_notes = Column(ARRAY(Text))
    repair_history = Column(ARRAY(Text))
    
    # Warranty status
    warranty_status = Column(String(50))
    warranty_details = Column(Text)
    
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())


class StandardQuestionsKB(Base):
    """Standard questions knowledge base - MPG, rebuild reason, VIN lookups"""
    __tablename__ = "standard_questions_kb"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    listing_id = Column(UUID(as_uuid=True), ForeignKey("car_listings.id", ondelete="SET NULL"))
    vin = Column(String(17))
    
    # Question and answer
    question_text = Column(Text, nullable=False)
    question_category = Column(String(50))  # 'mpg', 'vin', 'rebuild', 'specs', 'features', 'pricing', 'general'
    answer_text = Column(Text, nullable=False)
    
    # Answer source
    answer_source = Column(String(50), default="manual")
    
    # Application rules
    applies_to_vin = Column(Boolean, default=False)
    applies_to_similar = Column(Boolean, default=False)
    applies_to_all_listings = Column(Boolean, default=False)
    
    # Usage tracking
    usage_count = Column(Integer, default=1)
    last_used_at = Column(TIMESTAMP(timezone=True))
    success_rate = Column(DECIMAL(3, 2))
    
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())


class NegotiationResponses(Base):
    """Stored negotiation logic and responses"""
    __tablename__ = "negotiation_responses"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    listing_id = Column(UUID(as_uuid=True), ForeignKey("car_listings.id", ondelete="SET NULL"))
    
    # Negotiation scenario
    offer_amount = Column(DECIMAL(10, 2))
    offer_percentage = Column(DECIMAL(5, 2))
    scenario_type = Column(String(50))  # 'lowball', 'acceptable', 'above_threshold', 'repeat_lowball'
    
    # Response
    response_text = Column(Text, nullable=False)
    response_type = Column(String(50))  # 'decline', 'counter', 'accept', 'escalate'
    
    # Threshold logic
    below_threshold = Column(Boolean)
    threshold_amount = Column(DECIMAL(10, 2))
    
    # Usage tracking
    usage_count = Column(Integer, default=1)
    success_rate = Column(DECIMAL(3, 2))
    last_used_at = Column(TIMESTAMP(timezone=True))
    
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())


class WeirdQuestionLibrary(Base):
    """Learning system for unusual questions"""
    __tablename__ = "weird_question_library"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    listing_id = Column(UUID(as_uuid=True), ForeignKey("car_listings.id", ondelete="SET NULL"))
    
    # Question and answer
    question_text = Column(Text, nullable=False)
    answer_text = Column(Text, nullable=False)
    
    # Question classification
    question_type = Column(String(50))
    is_scam = Column(Boolean, default=False)
    is_danger_zone = Column(Boolean, default=False)
    
    # Learning rules
    applies_to_all_listings = Column(Boolean, default=False)
    auto_draft = Column(Boolean, default=True)
    
    # Usage tracking
    usage_count = Column(Integer, default=1)
    last_used_at = Column(TIMESTAMP(timezone=True))
    success_rate = Column(DECIMAL(3, 2))
    
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())


class KnowledgeGraphLearning(Base):
    """UARE Layer 1 foundation - learning from every interaction"""
    __tablename__ = "knowledge_graph_learning"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    listing_id = Column(UUID(as_uuid=True), ForeignKey("car_listings.id", ondelete="SET NULL"))
    vin = Column(String(17))
    
    # Learning data
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    source = Column(String(50), default="manual")
    
    # Application rules
    applies_to_vin = Column(Boolean, default=False)
    applies_to_similar = Column(Boolean, default=False)
    applies_to_all_listings = Column(Boolean, default=False)
    
    # UARE Layer classification
    uare_layer = Column(String(50))  # 'layer1_factual', 'layer2_relationship', 'layer3_negotiation'
    can_auto_send = Column(Boolean, default=False)
    
    # Usage tracking
    usage_count = Column(Integer, default=1)
    last_used_at = Column(TIMESTAMP(timezone=True))
    success_rate = Column(DECIMAL(3, 2))
    
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())


class UserSession(Base):
    """Session persistence - Supabase-only, no localStorage"""
    __tablename__ = "user_sessions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    
    # Session data (stored in Supabase, not localStorage)
    session_data = Column(JSONB, nullable=False)
    
    # Device information
    device_type = Column(String(50))  # 'mobile', 'desktop', 'tablet'
    device_id = Column(String(255))
    user_agent = Column(Text)
    
    # Session metadata
    last_activity_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    expires_at = Column(TIMESTAMP(timezone=True))
    is_active = Column(Boolean, default=True)
    
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())













