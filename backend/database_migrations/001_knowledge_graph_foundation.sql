-- Phase 0: Knowledge Graph Foundation Migration
-- Run this in Supabase SQL Editor
-- This creates all tables needed for Knowledge Graph, VIN fingerprinting, and session persistence

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. KNOWLEDGE GRAPH NODES (Core vehicle knowledge structure)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.knowledge_graph_nodes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    listing_id UUID REFERENCES public.car_listings(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Core vehicle data
    vin VARCHAR(17),
    condition TEXT,
    rebuild_reason TEXT,
    mileage INTEGER,
    specs JSONB, -- Full vehicle specifications
    
    -- Knowledge graph data
    history JSONB, -- Vehicle history (accidents, repairs, etc.)
    faqs JSONB, -- Frequently asked questions and answers
    images TEXT[], -- Image URLs
    market_comps JSONB, -- Market comparisons and pricing data
    
    -- AI-generated data
    ai_summary TEXT,
    key_selling_points TEXT[],
    
    -- VIN fingerprint data
    vin_decoded BOOLEAN DEFAULT FALSE,
    vin_data JSONB, -- Full VIN decode data from NHTSA
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(listing_id) -- One knowledge graph node per listing
);

-- Indexes for knowledge graph nodes
CREATE INDEX IF NOT EXISTS idx_knowledge_graph_nodes_user_id ON public.knowledge_graph_nodes(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_graph_nodes_listing_id ON public.knowledge_graph_nodes(listing_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_graph_nodes_vin ON public.knowledge_graph_nodes(vin);
CREATE INDEX IF NOT EXISTS idx_knowledge_graph_nodes_updated_at ON public.knowledge_graph_nodes(updated_at DESC);

-- ============================================================================
-- 2. VIN KNOWLEDGE BASE (Enhanced VIN fingerprint storage)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.vin_knowledge_base (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    vin TEXT NOT NULL UNIQUE,
    make TEXT,
    model TEXT,
    year INTEGER,
    trim TEXT,
    
    -- NHTSA Decoded Data
    nhtsa_data JSONB,
    
    -- Extracted Features (comprehensive list)
    features_interior TEXT[],
    features_exterior TEXT[],
    features_safety TEXT[],
    features_technology TEXT[],
    features_comfort TEXT[],
    features_powertrain TEXT[],
    features_audio_entertainment TEXT[],
    
    -- All features combined (for quick lookup)
    all_features TEXT[],
    
    -- VIN-specific knowledge
    mpg_city INTEGER,
    mpg_highway INTEGER,
    engine_type TEXT,
    engine_size TEXT,
    transmission_type TEXT,
    drivetrain TEXT,
    safety_features TEXT[],
    recalls JSONB, -- Recall information
    oem_packages TEXT[], -- OEM package codes
    
    -- Metadata
    extraction_source TEXT, -- 'nhtsa', 'google_search', 'ai_extraction', 'combined'
    extraction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    usage_count INTEGER DEFAULT 1,
    
    -- Quality indicators
    confidence_score DECIMAL(3,2), -- 0.00 to 1.00
    verified BOOLEAN DEFAULT FALSE, -- Manually verified features
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for VIN knowledge base
CREATE INDEX IF NOT EXISTS idx_vin_knowledge_base_vin ON public.vin_knowledge_base(vin);
CREATE INDEX IF NOT EXISTS idx_vin_knowledge_base_make_model_year ON public.vin_knowledge_base(make, model, year);
CREATE INDEX IF NOT EXISTS idx_vin_knowledge_base_last_used ON public.vin_knowledge_base(last_used_date DESC);

-- ============================================================================
-- 3. SELLER PROFILE RULES (Threshold, policies, preferences)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.seller_profile_rules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    
    -- Pricing rules
    default_price_threshold DECIMAL(10,2), -- Default minimum price threshold
    price_threshold_percentage DECIMAL(5,2) DEFAULT 20.00, -- Percentage below asking price
    
    -- Policy flags
    no_financing BOOLEAN DEFAULT FALSE,
    no_trades BOOLEAN DEFAULT FALSE,
    no_delivery BOOLEAN DEFAULT FALSE,
    no_out_of_state BOOLEAN DEFAULT FALSE,
    
    -- Negotiation preferences
    negotiation_style VARCHAR(50) DEFAULT 'balanced', -- 'firm', 'flexible', 'balanced'
    max_concessions INTEGER DEFAULT 3,
    auto_decline_percentage DECIMAL(5,2) DEFAULT 20.00, -- Auto-decline if offer < threshold - X%
    
    -- Communication preferences
    response_tone VARCHAR(50) DEFAULT 'professional', -- 'professional', 'casual', 'friendly'
    response_speed VARCHAR(50) DEFAULT 'normal', -- 'instant', 'normal', 'delayed'
    emoji_usage BOOLEAN DEFAULT TRUE,
    
    -- UARE settings
    auto_send_factual BOOLEAN DEFAULT TRUE, -- Auto-send Layer 1 (factual) answers
    require_approval_negotiation BOOLEAN DEFAULT TRUE, -- Require approval for Layer 3 (negotiation)
    require_approval_relationship BOOLEAN DEFAULT TRUE, -- Require approval for Layer 2 (relationship)
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for seller profile rules
CREATE INDEX IF NOT EXISTS idx_seller_profile_rules_user_id ON public.seller_profile_rules(user_id);

-- ============================================================================
-- 4. LISTING-SPECIFIC RULES (Per-listing thresholds and policies)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.listing_rules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    listing_id UUID REFERENCES public.car_listings(id) ON DELETE CASCADE UNIQUE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Listing-specific pricing
    asking_price DECIMAL(10,2),
    price_threshold DECIMAL(10,2), -- Minimum acceptable price for this listing
    
    -- Listing-specific policies (override seller defaults)
    no_financing BOOLEAN DEFAULT NULL, -- NULL = use seller default
    no_trades BOOLEAN DEFAULT NULL,
    no_delivery BOOLEAN DEFAULT NULL,
    no_out_of_state BOOLEAN DEFAULT NULL,
    
    -- Rebuild explanation
    rebuild_reason TEXT,
    rebuild_details TEXT, -- Detailed explanation of rebuild
    
    -- Mechanical notes
    mechanical_notes TEXT[],
    repair_history TEXT[],
    
    -- Warranty status
    warranty_status VARCHAR(50), -- 'none', 'dealer', 'extended', 'manufacturer'
    warranty_details TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for listing rules
CREATE INDEX IF NOT EXISTS idx_listing_rules_listing_id ON public.listing_rules(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_rules_user_id ON public.listing_rules(user_id);

-- ============================================================================
-- 5. STANDARD QUESTIONS KNOWLEDGE BASE (MPG, rebuild reason, VIN lookups)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.standard_questions_kb (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES public.car_listings(id) ON DELETE SET NULL,
    vin VARCHAR(17), -- Link to VIN for VIN-specific answers
    
    -- Question and answer
    question_text TEXT NOT NULL,
    question_category VARCHAR(50), -- 'mpg', 'vin', 'rebuild', 'specs', 'features', 'pricing', 'general'
    answer_text TEXT NOT NULL,
    
    -- Answer source
    answer_source VARCHAR(50) DEFAULT 'manual', -- 'manual', 'vin_decode', 'ai_generated', 'learned'
    
    -- Application rules
    applies_to_vin BOOLEAN DEFAULT FALSE, -- Apply to all vehicles with same VIN
    applies_to_similar BOOLEAN DEFAULT FALSE, -- Apply to similar vehicles (same make/model/year)
    applies_to_all_listings BOOLEAN DEFAULT FALSE, -- Apply to all user's listings
    
    -- Usage tracking
    usage_count INTEGER DEFAULT 1,
    last_used_at TIMESTAMP WITH TIME ZONE,
    success_rate DECIMAL(3,2), -- 0.00 to 1.00 (how often this answer satisfies buyer)
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for standard questions KB
CREATE INDEX IF NOT EXISTS idx_standard_questions_kb_user_id ON public.standard_questions_kb(user_id);
CREATE INDEX IF NOT EXISTS idx_standard_questions_kb_listing_id ON public.standard_questions_kb(listing_id);
CREATE INDEX IF NOT EXISTS idx_standard_questions_kb_vin ON public.standard_questions_kb(vin);
CREATE INDEX IF NOT EXISTS idx_standard_questions_kb_category ON public.standard_questions_kb(question_category);
CREATE INDEX IF NOT EXISTS idx_standard_questions_kb_question_text ON public.standard_questions_kb(question_text);

-- ============================================================================
-- 6. NEGOTIATION RESPONSES (Stored negotiation logic and responses)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.negotiation_responses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES public.car_listings(id) ON DELETE SET NULL,
    
    -- Negotiation scenario
    offer_amount DECIMAL(10,2),
    offer_percentage DECIMAL(5,2), -- Percentage of asking price
    scenario_type VARCHAR(50), -- 'lowball', 'acceptable', 'above_threshold', 'repeat_lowball'
    
    -- Response
    response_text TEXT NOT NULL,
    response_type VARCHAR(50), -- 'decline', 'counter', 'accept', 'escalate'
    
    -- Threshold logic
    below_threshold BOOLEAN,
    threshold_amount DECIMAL(10,2),
    
    -- Usage tracking
    usage_count INTEGER DEFAULT 1,
    success_rate DECIMAL(3,2), -- Did this response lead to sale?
    last_used_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for negotiation responses
CREATE INDEX IF NOT EXISTS idx_negotiation_responses_user_id ON public.negotiation_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_negotiation_responses_listing_id ON public.negotiation_responses(listing_id);
CREATE INDEX IF NOT EXISTS idx_negotiation_responses_scenario_type ON public.negotiation_responses(scenario_type);

-- ============================================================================
-- 7. WEIRD QUESTION LIBRARY (Learning system for unusual questions)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.weird_question_library (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES public.car_listings(id) ON DELETE SET NULL,
    
    -- Question and answer
    question_text TEXT NOT NULL,
    answer_text TEXT NOT NULL,
    
    -- Question classification
    question_type VARCHAR(50), -- 'weird', 'scam', 'unusual', 'trade', 'delivery', 'financing'
    is_scam BOOLEAN DEFAULT FALSE,
    is_danger_zone BOOLEAN DEFAULT FALSE, -- "Danger Zone" folder
    
    -- Learning rules
    applies_to_all_listings BOOLEAN DEFAULT FALSE,
    auto_draft BOOLEAN DEFAULT TRUE, -- Auto-draft this answer in future
    
    -- Usage tracking
    usage_count INTEGER DEFAULT 1,
    last_used_at TIMESTAMP WITH TIME ZONE,
    success_rate DECIMAL(3,2), -- Did this answer satisfy buyer?
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint: one answer per question per user
    UNIQUE(user_id, question_text)
);

-- Indexes for weird question library
CREATE INDEX IF NOT EXISTS idx_weird_question_library_user_id ON public.weird_question_library(user_id);
CREATE INDEX IF NOT EXISTS idx_weird_question_library_listing_id ON public.weird_question_library(listing_id);
CREATE INDEX IF NOT EXISTS idx_weird_question_library_question_text ON public.weird_question_library(question_text);
CREATE INDEX IF NOT EXISTS idx_weird_question_library_type ON public.weird_question_library(question_type);

-- ============================================================================
-- 8. KNOWLEDGE GRAPH LEARNING (UARE Layer 1 foundation)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.knowledge_graph_learning (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES public.car_listings(id) ON DELETE SET NULL,
    vin VARCHAR(17),
    
    -- Learning data
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    source VARCHAR(50) DEFAULT 'manual', -- 'manual', 'ai', 'learned', 'vin_decode'
    
    -- Application rules
    applies_to_vin BOOLEAN DEFAULT FALSE, -- Apply to all vehicles with same VIN
    applies_to_similar BOOLEAN DEFAULT FALSE, -- Apply to similar vehicles
    applies_to_all_listings BOOLEAN DEFAULT FALSE, -- Apply to all user's listings
    
    -- UARE Layer classification
    uare_layer VARCHAR(50), -- 'layer1_factual', 'layer2_relationship', 'layer3_negotiation'
    can_auto_send BOOLEAN DEFAULT FALSE, -- Can this be auto-sent (Layer 1 only)
    
    -- Usage tracking
    usage_count INTEGER DEFAULT 1,
    last_used_at TIMESTAMP WITH TIME ZONE,
    success_rate DECIMAL(3,2), -- 0.00 to 1.00
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for knowledge graph learning
CREATE INDEX IF NOT EXISTS idx_knowledge_graph_learning_user_id ON public.knowledge_graph_learning(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_graph_learning_listing_id ON public.knowledge_graph_learning(listing_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_graph_learning_vin ON public.knowledge_graph_learning(vin);
CREATE INDEX IF NOT EXISTS idx_knowledge_graph_learning_uare_layer ON public.knowledge_graph_learning(uare_layer);
CREATE INDEX IF NOT EXISTS idx_knowledge_graph_learning_question ON public.knowledge_graph_learning(question_text);

-- ============================================================================
-- 9. SESSION PERSISTENCE (Supabase-only, no localStorage)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Session data (stored in Supabase, not localStorage)
    session_data JSONB NOT NULL, -- All session state (drafts, preferences, etc.)
    
    -- Device information
    device_type VARCHAR(50), -- 'mobile', 'desktop', 'tablet'
    device_id VARCHAR(255), -- Unique device identifier
    user_agent TEXT,
    
    -- Session metadata
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for user sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_device_id ON public.user_sessions(device_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity ON public.user_sessions(last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON public.user_sessions(is_active) WHERE is_active = TRUE;

-- ============================================================================
-- 10. TRIGGERS FOR UPDATED_AT
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables
CREATE TRIGGER update_knowledge_graph_nodes_updated_at
    BEFORE UPDATE ON public.knowledge_graph_nodes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vin_knowledge_base_updated_at
    BEFORE UPDATE ON public.vin_knowledge_base
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seller_profile_rules_updated_at
    BEFORE UPDATE ON public.seller_profile_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_listing_rules_updated_at
    BEFORE UPDATE ON public.listing_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_standard_questions_kb_updated_at
    BEFORE UPDATE ON public.standard_questions_kb
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_negotiation_responses_updated_at
    BEFORE UPDATE ON public.negotiation_responses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_weird_question_library_updated_at
    BEFORE UPDATE ON public.weird_question_library
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_graph_learning_updated_at
    BEFORE UPDATE ON public.knowledge_graph_learning
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_sessions_updated_at
    BEFORE UPDATE ON public.user_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 11. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.knowledge_graph_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vin_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_profile_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.standard_questions_kb ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.negotiation_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weird_question_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_graph_learning ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only access their own data
CREATE POLICY "Users can view own knowledge_graph_nodes" ON public.knowledge_graph_nodes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own knowledge_graph_nodes" ON public.knowledge_graph_nodes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own knowledge_graph_nodes" ON public.knowledge_graph_nodes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own seller_profile_rules" ON public.seller_profile_rules
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own seller_profile_rules" ON public.seller_profile_rules
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own seller_profile_rules" ON public.seller_profile_rules
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own listing_rules" ON public.listing_rules
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own listing_rules" ON public.listing_rules
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own listing_rules" ON public.listing_rules
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own standard_questions_kb" ON public.standard_questions_kb
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own standard_questions_kb" ON public.standard_questions_kb
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own standard_questions_kb" ON public.standard_questions_kb
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own negotiation_responses" ON public.negotiation_responses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own negotiation_responses" ON public.negotiation_responses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own negotiation_responses" ON public.negotiation_responses
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own weird_question_library" ON public.weird_question_library
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weird_question_library" ON public.weird_question_library
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weird_question_library" ON public.weird_question_library
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own knowledge_graph_learning" ON public.knowledge_graph_learning
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own knowledge_graph_learning" ON public.knowledge_graph_learning
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own knowledge_graph_learning" ON public.knowledge_graph_learning
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own user_sessions" ON public.user_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own user_sessions" ON public.user_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own user_sessions" ON public.user_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- VIN knowledge base is read-only for all authenticated users (shared knowledge)
CREATE POLICY "Authenticated users can view vin_knowledge_base" ON public.vin_knowledge_base
    FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================================================
-- 12. FUNCTIONS FOR VIN KNOWLEDGE BASE USAGE TRACKING
-- ============================================================================

-- Function to update VIN knowledge base usage
CREATE OR REPLACE FUNCTION update_vin_knowledge_base_usage()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_used_date = NOW();
    NEW.usage_count = COALESCE(OLD.usage_count, 0) + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to track VIN knowledge base usage (when queried)
-- Note: This will be called from application code when VIN is accessed

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- This migration creates the complete Knowledge Graph foundation
-- All data is stored in Supabase (no localStorage)
-- RLS policies ensure users can only access their own data
-- Indexes optimize query performance
-- Triggers maintain updated_at timestamps automatically













