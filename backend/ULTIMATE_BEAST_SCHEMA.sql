-- 🚀 ACCORRIA ULTIMATE BEAST SCHEMA - THE MOST COMPREHENSIVE DATA EMPIRE EVER BUILT
-- Trust-Native Listing Infrastructure with Escrow-Integrated AI Orchestration
-- Multi-Agent AI Workflows + Dual-LLM Brain-Split + Multi-Schema Architecture
-- Real-Time Indices + Synthetic Data + API Monetization + Machine-to-Machine Transactions

-- === EXTENSIONS ===
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create dedicated schema for extensions
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move pg_trgm to dedicated schema
CREATE EXTENSION IF NOT EXISTS "pg_trgm" SCHEMA extensions;

-- === ENUMS ===
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'asset_type') THEN
    CREATE TYPE asset_type AS ENUM ('car','home','boat','collectible','digital_asset','rental','insurance_policy','carbon_credit','other');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'listing_status') THEN
    CREATE TYPE listing_status AS ENUM ('draft','published','sold','archived','escrow_pending','escrow_funded','escrow_released','escrow_refunded');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'escrow_status') THEN
    CREATE TYPE escrow_status AS ENUM ('initiated','funded','released','refunded','cancelled','disputed','verified');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'agent_type') THEN
    CREATE TYPE agent_type AS ENUM ('intake','visual','description','valuation','negotiator','escrow','learning','orchestrator');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'llm_brain_type') THEN
    CREATE TYPE llm_brain_type AS ENUM ('left_brain','right_brain','combined');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'trust_badge_level') THEN
    CREATE TYPE trust_badge_level AS ENUM ('bronze','silver','gold','platinum','diamond');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'escrow_type') THEN
    CREATE TYPE escrow_type AS ENUM ('fiat','blockchain','hybrid','smart_contract');
  END IF;
END $$;

-- === EXISTING QUICKFLIP TABLES (KEEPING YOUR WORKING FUNCTIONALITY) ===

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    subscription_tier TEXT DEFAULT 'free_trial',
    posts_used INTEGER DEFAULT 0,
    posts_limit INTEGER DEFAULT 3,
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Car analyses table (Vision Agent + Data Extraction Agent output)
CREATE TABLE IF NOT EXISTS public.car_analyses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    image_urls TEXT[],
    make TEXT,
    model TEXT,
    year INTEGER,
    mileage INTEGER,
    condition TEXT,
    title_status TEXT,
    color TEXT,
    features TEXT[],
    vision_analysis JSONB, -- Vision Agent output
    data_extraction JSONB, -- Data Extraction Agent output
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Market intelligence table (Market Intelligence Agent output)
CREATE TABLE IF NOT EXISTS public.market_intelligence (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    car_analysis_id UUID REFERENCES public.car_analyses(id) ON DELETE CASCADE,
    market_comps JSONB,
    demand_analysis JSONB,
    price_trends JSONB,
    competitor_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pricing strategies table (Pricing Strategy Agent output)
CREATE TABLE IF NOT EXISTS public.pricing_strategies (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    car_analysis_id UUID REFERENCES public.car_analyses(id) ON DELETE CASCADE,
    quick_sale_price DECIMAL(10,2),
    market_price DECIMAL(10,2),
    top_dollar_price DECIMAL(10,2),
    pricing_rationale JSONB,
    flip_score INTEGER, -- 0-100 score
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content generation table (Content Generation Agent output)
CREATE TABLE IF NOT EXISTS public.content_generation (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    car_analysis_id UUID REFERENCES public.car_analyses(id) ON DELETE CASCADE,
    pricing_strategy_id UUID REFERENCES public.pricing_strategies(id) ON DELETE CASCADE,
    title TEXT,
    description TEXT,
    feature_bullets TEXT[],
    platform_specific_content JSONB, -- Different content for Facebook, Craigslist, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Car listings table (final user-approved listings)
CREATE TABLE IF NOT EXISTS public.car_listings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    car_analysis_id UUID REFERENCES public.car_analyses(id) ON DELETE CASCADE,
    pricing_strategy_id UUID REFERENCES public.pricing_strategies(id) ON DELETE CASCADE,
    content_generation_id UUID REFERENCES public.content_generation(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    platform VARCHAR,
    platform_listing_id VARCHAR,
    status VARCHAR DEFAULT 'draft',
    images TEXT[],
    flip_score INTEGER,
    pricing_strategy_used TEXT, -- 'quick_sale', 'market_price', 'top_dollar'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messenger bot interactions table (Messenger Bot Agent)
CREATE TABLE IF NOT EXISTS public.messenger_interactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES public.car_listings(id) ON DELETE CASCADE,
    buyer_message TEXT,
    bot_response TEXT,
    buyer_intent TEXT, -- 'serious_buyer', 'tire_kicker', 'price_negotiation'
    action_required BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Deals table (completed sales)
CREATE TABLE IF NOT EXISTS public.deals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES public.car_listings(id) ON DELETE CASCADE,
    buyer_name TEXT,
    buyer_phone TEXT,
    buyer_email TEXT,
    offer_amount DECIMAL(10,2),
    final_sale_price DECIMAL(10,2),
    status VARCHAR DEFAULT 'pending',
    days_to_sell INTEGER,
    buyer_source TEXT, -- 'facebook', 'craigslist', 'offerup'
    messages JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Learning data table (Learning Agent input/output)
CREATE TABLE IF NOT EXISTS public.learning_data (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES public.car_listings(id) ON DELETE CASCADE,
    outcome_data JSONB, -- Sale success, price achieved, time to sell
    feature_importance JSONB, -- Which features drove success
    model_improvements JSONB, -- Learning agent recommendations
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User sessions table (Orchestrator Agent state)
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    session_data JSONB, -- Current workflow state
    agent_outputs JSONB, -- Combined outputs from all agents
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- === ULTIMATE BEAST INTELLIGENCE LAYER ===

-- === MULTI-AGENT ORCHESTRATION ===
CREATE TABLE IF NOT EXISTS agent_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL,
    agent_type agent_type NOT NULL,
    agent_version TEXT,
    input_data JSONB,
    output_data JSONB,
    processing_time_ms INTEGER,
    success BOOLEAN,
    error_message TEXT,
    llm_brain_type llm_brain_type,
    confidence_score NUMERIC(3,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orchestrator_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    session_id UUID,
    workflow_state JSONB, -- Current state of multi-agent workflow
    left_brain_output JSONB, -- Analytical LLM output
    right_brain_output JSONB, -- Creative LLM output
    combined_output JSONB, -- Merged brain outputs
    agent_sequence TEXT[], -- Order of agents executed
    total_processing_time_ms INTEGER,
    workflow_success BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- === ESCROW & TRUST LAYER ===
CREATE TABLE IF NOT EXISTS escrow_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID,
    escrow_type escrow_type NOT NULL,
    amount_cents INTEGER NOT NULL,
    currency TEXT DEFAULT 'USD',
    buyer_id UUID,
    seller_id UUID,
    status escrow_status NOT NULL DEFAULT 'initiated',
    verification_events JSONB, -- Multi-party verification events
    smart_contract_address TEXT, -- For blockchain escrow
    fiat_escrow_provider TEXT, -- For traditional escrow
    trust_score NUMERIC(3,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trust_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    listing_id UUID,
    badge_level trust_badge_level NOT NULL,
    badge_type TEXT, -- 'escrow_verified', 'reputation', 'completion_rate'
    verification_criteria JSONB,
    badge_metadata JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS verification_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    escrow_id UUID REFERENCES escrow_workflows(id),
    event_type TEXT NOT NULL, -- 'inspection', 'iot_trigger', 'document_signature'
    event_data JSONB,
    verification_status BOOLEAN,
    verified_by TEXT, -- 'buyer', 'seller', 'agent', 'iot_device'
    verification_timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- === NEGOTIATOR AGENT ===
CREATE TABLE IF NOT EXISTS negotiator_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID,
    buyer_id UUID,
    seller_id UUID,
    message_sequence JSONB, -- Full conversation history
    escrow_references JSONB, -- Escrow status in negotiations
    offer_history JSONB, -- All offers and counters
    fraud_indicators JSONB, -- Fraud detection signals
    negotiation_outcome TEXT, -- 'success', 'failure', 'pending'
    final_agreement JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- === MULTI-SCHEMA ARCHITECTURE ===

-- PII Schema (Sensitive User Data)
CREATE TABLE IF NOT EXISTS pii_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    data_type TEXT NOT NULL, -- 'personal_info', 'financial', 'identity'
    encrypted_data JSONB, -- Encrypted sensitive data
    encryption_key_id TEXT,
    data_retention_policy TEXT,
    consent_status BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- Compliance Schema
CREATE TABLE IF NOT EXISTS compliance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    regulatory_framework TEXT, -- 'GDPR', 'CCPA', 'HIPAA'
    consent_type TEXT,
    consent_granted BOOLEAN,
    consent_date TIMESTAMPTZ,
    withdrawal_date TIMESTAMPTZ,
    audit_trail JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS escrow_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    escrow_id UUID REFERENCES escrow_workflows(id),
    action_type TEXT NOT NULL,
    action_data JSONB,
    regulatory_compliance JSONB,
    audit_timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics Schema (Anonymized)
CREATE TABLE IF NOT EXISTS analytics_events (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID,
    session_id UUID,
    event_name TEXT NOT NULL,
    event_ts TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    properties JSONB,
    anonymization_level TEXT -- 'none', 'partial', 'full'
);

-- Domain Schema (Asset-Specific)
CREATE TABLE IF NOT EXISTS asset_attributes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID,
    asset_type asset_type NOT NULL,
    domain_specific_data JSONB, -- Asset-specific attributes
    escrow_workflow_config JSONB, -- Asset-specific escrow rules
    verification_requirements JSONB, -- Asset-specific verification needs
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Market Schema (Aggregated Intelligence)
CREATE TABLE IF NOT EXISTS market_intelligence (
    id BIGSERIAL PRIMARY KEY,
    asset_type asset_type,
    region TEXT,
    market_data JSONB, -- Aggregated market intelligence
    escrow_verified_data BOOLEAN, -- Whether data comes from escrow-verified transactions
    confidence_score NUMERIC(3,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- === REAL-TIME INDEX GENERATOR ===
CREATE TABLE IF NOT EXISTS accorria_confidence_index (
    id BIGSERIAL PRIMARY KEY,
    region TEXT,
    asset_type asset_type,
    confidence_score NUMERIC(4,3),
    escrow_acceptance_rate NUMERIC(4,3),
    escrow_cancellation_rate NUMERIC(4,3),
    trust_badge_distribution JSONB,
    market_sentiment_score NUMERIC(3,2),
    index_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS accorria_migration_index (
    id BIGSERIAL PRIMARY KEY,
    origin_region TEXT,
    destination_region TEXT,
    asset_type asset_type,
    migration_score NUMERIC(4,3),
    escrow_verified_transactions INTEGER,
    population_flow_rate NUMERIC(5,2),
    asset_demand_shift_percentage NUMERIC(5,2),
    index_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS accorria_ev_index (
    id BIGSERIAL PRIMARY KEY,
    region TEXT,
    ev_adoption_score NUMERIC(4,3),
    escrow_verified_ev_transactions INTEGER,
    ev_vs_gas_price_premium NUMERIC(5,2),
    charging_infrastructure_score NUMERIC(3,2),
    policy_support_score NUMERIC(3,2),
    index_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS accorria_risk_index (
    id BIGSERIAL PRIMARY KEY,
    region TEXT,
    asset_type asset_type,
    risk_score NUMERIC(4,3),
    escrow_failure_rate NUMERIC(4,3),
    fraud_incidence_rate NUMERIC(4,3),
    anomaly_detection_signals JSONB,
    systemic_risk_indicators JSONB,
    index_date TIMESTAMPTZ DEFAULT NOW()
);

-- === SYNTHETIC DATA & MONETIZATION ===
CREATE TABLE IF NOT EXISTS synthetic_datasets (
    id BIGSERIAL PRIMARY KEY,
    dataset_name TEXT NOT NULL UNIQUE,
    dataset_type TEXT NOT NULL,
    asset_type asset_type,
    region TEXT,
    escrow_verified_source BOOLEAN, -- Whether derived from escrow-verified data
    data_volume INTEGER,
    anonymization_level TEXT,
    privacy_guarantees JSONB,
    predictive_accuracy_score NUMERIC(3,2),
    licensing_terms TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS synthetic_records (
    id BIGSERIAL PRIMARY KEY,
    dataset_id BIGINT REFERENCES synthetic_datasets(id),
    original_record_id TEXT,
    synthetic_data JSONB,
    privacy_score NUMERIC(3,2),
    utility_score NUMERIC(3,2),
    generation_method TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- === API LICENSING & ANALYTICS DELIVERY ===
CREATE TABLE IF NOT EXISTS api_licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_name TEXT NOT NULL,
    license_type TEXT, -- 'free', 'smb', 'enterprise', 'institutional'
    licensed_products JSONB, -- Which indices, datasets, APIs
    rate_limits JSONB,
    pricing_model TEXT,
    revenue_generated_cents INTEGER DEFAULT 0,
    start_date TIMESTAMPTZ DEFAULT NOW(),
    end_date TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS api_usage_tracking (
    id BIGSERIAL PRIMARY KEY,
    license_id UUID REFERENCES api_licenses(id),
    endpoint TEXT,
    request_count INTEGER,
    data_volume_mb NUMERIC,
    response_time_ms INTEGER,
    error_rate NUMERIC(4,3),
    usage_date DATE DEFAULT CURRENT_DATE
);

-- === ANOMALY DETECTION ===
CREATE TABLE IF NOT EXISTS anomaly_detections (
    id BIGSERIAL PRIMARY KEY,
    anomaly_type TEXT NOT NULL, -- 'fraud', 'systemic_risk', 'compliance_violation'
    asset_type asset_type,
    region TEXT,
    severity_level TEXT, -- 'low', 'medium', 'high', 'critical'
    detection_method TEXT,
    anomaly_score NUMERIC(3,2),
    escrow_impact BOOLEAN, -- Whether anomaly affects escrow
    trigger_conditions JSONB,
    alert_sent BOOLEAN DEFAULT FALSE,
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- === MACHINE-TO-MACHINE TRANSACTIONS ===
CREATE TABLE IF NOT EXISTS m2m_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    autonomous_agent_id TEXT,
    listing_id UUID,
    buyer_agent_id TEXT,
    seller_agent_id TEXT,
    negotiation_log JSONB,
    escrow_workflow_id UUID REFERENCES escrow_workflows(id),
    transaction_outcome TEXT,
    human_intervention_required BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- === MULTI-ASSET CLASS SUPPORT ===
CREATE TABLE IF NOT EXISTS multi_asset_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID,
    asset_type asset_type NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    price_cents INTEGER,
    currency TEXT DEFAULT 'USD',
    status listing_status DEFAULT 'draft',
    asset_specific_data JSONB, -- Asset-specific attributes
    escrow_workflow_id UUID REFERENCES escrow_workflows(id),
    trust_badge_id UUID REFERENCES trust_badges(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- === BLOCKCHAIN/SMART CONTRACT ESCROW ===
CREATE TABLE IF NOT EXISTS blockchain_escrow (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    escrow_workflow_id UUID REFERENCES escrow_workflows(id),
    blockchain_network TEXT, -- 'ethereum', 'polygon', 'solana'
    smart_contract_address TEXT,
    contract_abi JSONB,
    transaction_hash TEXT,
    gas_used INTEGER,
    block_number INTEGER,
    verification_status BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- === SECURITY & COMPLIANCE AUDIT ENGINE ===
CREATE TABLE IF NOT EXISTS security_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID,
    action_type TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    api_key TEXT,
    data_accessed JSONB,
    compliance_check BOOLEAN,
    fraud_detection_score NUMERIC(3,2),
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS compliance_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_type TEXT, -- 'gdpr', 'ccpa', 'regulatory'
    report_period TEXT,
    compliance_status BOOLEAN,
    violations JSONB,
    remediation_actions JSONB,
    generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- === ROW LEVEL SECURITY (RLS) ===
-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.car_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_generation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.car_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messenger_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Enable RLS on ULTIMATE BEAST tables
ALTER TABLE public.agent_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orchestrator_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.negotiator_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pii_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accorria_confidence_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accorria_migration_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accorria_ev_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accorria_risk_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.synthetic_datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.synthetic_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anomaly_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.m2m_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.multi_asset_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trust_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blockchain_escrow ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_reports ENABLE ROW LEVEL SECURITY;

-- === RLS POLICIES ===
-- Drop existing policies first to avoid conflicts
DO $$ 
BEGIN
    -- Profiles policies
    DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
    
    -- Car analyses policies
    DROP POLICY IF EXISTS "Users can view own car analyses" ON public.car_analyses;
    DROP POLICY IF EXISTS "Users can insert own car analyses" ON public.car_analyses;
    DROP POLICY IF EXISTS "Users can update own car analyses" ON public.car_analyses;
    
    -- Market intelligence policies
    DROP POLICY IF EXISTS "Users can view own market intelligence" ON public.market_intelligence;
    DROP POLICY IF EXISTS "Users can insert own market intelligence" ON public.market_intelligence;
    
    -- Pricing strategies policies
    DROP POLICY IF EXISTS "Users can view own pricing strategies" ON public.pricing_strategies;
    DROP POLICY IF EXISTS "Users can insert own pricing strategies" ON public.pricing_strategies;
    
    -- Content generation policies
    DROP POLICY IF EXISTS "Users can view own content generation" ON public.content_generation;
    DROP POLICY IF EXISTS "Users can insert own content generation" ON public.content_generation;
    
    -- Car listings policies
    DROP POLICY IF EXISTS "Users can view own car listings" ON public.car_listings;
    DROP POLICY IF EXISTS "Users can insert own car listings" ON public.car_listings;
    DROP POLICY IF EXISTS "Users can update own car listings" ON public.car_listings;
    DROP POLICY IF EXISTS "Users can delete own car listings" ON public.car_listings;
    
    -- Messenger interactions policies
    DROP POLICY IF EXISTS "Users can view own messenger interactions" ON public.messenger_interactions;
    DROP POLICY IF EXISTS "Users can insert own messenger interactions" ON public.messenger_interactions;
    
    -- Deals policies
    DROP POLICY IF EXISTS "Users can view own deals" ON public.deals;
    DROP POLICY IF EXISTS "Users can insert own deals" ON public.deals;
    DROP POLICY IF EXISTS "Users can update own deals" ON public.deals;
    
    -- Learning data policies
    DROP POLICY IF EXISTS "Users can view own learning data" ON public.learning_data;
    DROP POLICY IF EXISTS "Users can insert own learning data" ON public.learning_data;
    
    -- User sessions policies
    DROP POLICY IF EXISTS "Users can view own sessions" ON public.user_sessions;
    DROP POLICY IF EXISTS "Users can insert own sessions" ON public.user_sessions;
    DROP POLICY IF EXISTS "Users can update own sessions" ON public.user_sessions;
    
    -- === NEW SECURITY POLICIES FOR ALL TABLES ===
    
    -- Agent workflows policies (System access only)
    DROP POLICY IF EXISTS "System can manage agent workflows" ON public.agent_workflows;
    DROP POLICY IF EXISTS "Admin can view agent workflows" ON public.agent_workflows;
    
    -- Orchestrator sessions policies (System access only)
    DROP POLICY IF EXISTS "System can manage orchestrator sessions" ON public.orchestrator_sessions;
    DROP POLICY IF EXISTS "Admin can view orchestrator sessions" ON public.orchestrator_sessions;
    
    -- Escrow workflows policies (System + authorized users)
    DROP POLICY IF EXISTS "System can manage escrow workflows" ON public.escrow_workflows;
    DROP POLICY IF EXISTS "Users can view own escrow workflows" ON public.escrow_workflows;
    
    -- Verification events policies (System + authorized users)
    DROP POLICY IF EXISTS "System can manage verification events" ON public.verification_events;
    DROP POLICY IF EXISTS "Users can view own verification events" ON public.verification_events;
    
    -- Negotiator interactions policies (System + authorized users)
    DROP POLICY IF EXISTS "System can manage negotiator interactions" ON public.negotiator_interactions;
    DROP POLICY IF EXISTS "Users can view own negotiator interactions" ON public.negotiator_interactions;
    
    -- PII data policies (Strict access control)
    DROP POLICY IF EXISTS "System can manage PII data" ON public.pii_data;
    DROP POLICY IF EXISTS "Users can view own PII data" ON public.pii_data;
    
    -- Compliance records policies (System + compliance officers)
    DROP POLICY IF EXISTS "System can manage compliance records" ON public.compliance_records;
    DROP POLICY IF EXISTS "Compliance officers can view compliance records" ON public.compliance_records;
    
    -- Escrow audit logs policies (System + auditors)
    DROP POLICY IF EXISTS "System can manage escrow audit logs" ON public.escrow_audit_logs;
    DROP POLICY IF EXISTS "Auditors can view escrow audit logs" ON public.escrow_audit_logs;
    
    -- Analytics events policies (System + authorized analytics)
    DROP POLICY IF EXISTS "System can manage analytics events" ON public.analytics_events;
    DROP POLICY IF EXISTS "Analytics can view analytics events" ON public.analytics_events;
    
    -- Asset attributes policies (System + authorized users)
    DROP POLICY IF EXISTS "System can manage asset attributes" ON public.asset_attributes;
    DROP POLICY IF EXISTS "Users can view own asset attributes" ON public.asset_attributes;
    
    -- Accorria indices policies (Read-only for authenticated users)
    DROP POLICY IF EXISTS "Authenticated users can view indices" ON public.accorria_confidence_index;
    DROP POLICY IF EXISTS "Authenticated users can view indices" ON public.accorria_migration_index;
    DROP POLICY IF EXISTS "Authenticated users can view indices" ON public.accorria_ev_index;
    DROP POLICY IF EXISTS "Authenticated users can view indices" ON public.accorria_risk_index;
    
    -- Synthetic datasets policies (System + authorized buyers)
    DROP POLICY IF EXISTS "System can manage synthetic datasets" ON public.synthetic_datasets;
    DROP POLICY IF EXISTS "Authorized buyers can view synthetic datasets" ON public.synthetic_datasets;
    
    -- Synthetic records policies (System + authorized buyers)
    DROP POLICY IF EXISTS "System can manage synthetic records" ON public.synthetic_records;
    DROP POLICY IF EXISTS "Authorized buyers can view synthetic records" ON public.synthetic_records;
    
    -- API licenses policies (System + license holders)
    DROP POLICY IF EXISTS "System can manage API licenses" ON public.api_licenses;
    DROP POLICY IF EXISTS "License holders can view own licenses" ON public.api_licenses;
    
    -- API usage tracking policies (System + license holders)
    DROP POLICY IF EXISTS "System can manage API usage tracking" ON public.api_usage_tracking;
    DROP POLICY IF EXISTS "License holders can view own usage" ON public.api_usage_tracking;
    
    -- Anomaly detections policies (System + security team)
    DROP POLICY IF EXISTS "System can manage anomaly detections" ON public.anomaly_detections;
    DROP POLICY IF EXISTS "Security team can view anomaly detections" ON public.anomaly_detections;
    
    -- M2M transactions policies (System + authorized machines)
    DROP POLICY IF EXISTS "System can manage M2M transactions" ON public.m2m_transactions;
    DROP POLICY IF EXISTS "Authorized machines can view own transactions" ON public.m2m_transactions;
    
    -- Multi-asset listings policies (System + authorized users)
    DROP POLICY IF EXISTS "System can manage multi-asset listings" ON public.multi_asset_listings;
    DROP POLICY IF EXISTS "Users can view own multi-asset listings" ON public.multi_asset_listings;
    
    -- Trust badges policies (System + authorized users)
    DROP POLICY IF EXISTS "System can manage trust badges" ON public.trust_badges;
    DROP POLICY IF EXISTS "Users can view own trust badges" ON public.trust_badges;
    
    -- Blockchain escrow policies (System + authorized users)
    DROP POLICY IF EXISTS "System can manage blockchain escrow" ON public.blockchain_escrow;
    DROP POLICY IF EXISTS "Users can view own blockchain escrow" ON public.blockchain_escrow;
    
    -- Security audit logs policies (System + security team)
    DROP POLICY IF EXISTS "System can manage security audit logs" ON public.security_audit_logs;
    DROP POLICY IF EXISTS "Security team can view security audit logs" ON public.security_audit_logs;
    
    -- Compliance reports policies (System + compliance team)
    DROP POLICY IF EXISTS "System can manage compliance reports" ON public.compliance_reports;
    DROP POLICY IF EXISTS "Compliance team can view compliance reports" ON public.compliance_reports;
END $$;

-- Create new policies
-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Car analyses policies
CREATE POLICY "Users can view own car analyses" ON public.car_analyses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own car analyses" ON public.car_analyses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own car analyses" ON public.car_analyses
    FOR UPDATE USING (auth.uid() = user_id);

-- Market intelligence policies
CREATE POLICY "Users can view own market intelligence" ON public.market_intelligence
    FOR SELECT USING (auth.role() IS NOT NULL);

CREATE POLICY "Users can insert own market intelligence" ON public.market_intelligence
    FOR INSERT WITH CHECK (auth.role() IS NOT NULL);

-- Pricing strategies policies
CREATE POLICY "Users can view own pricing strategies" ON public.pricing_strategies
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pricing strategies" ON public.pricing_strategies
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Content generation policies
CREATE POLICY "Users can view own content generation" ON public.content_generation
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own content generation" ON public.content_generation
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Car listings policies
CREATE POLICY "Users can view own car listings" ON public.car_listings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own car listings" ON public.car_listings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own car listings" ON public.car_listings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own car listings" ON public.car_listings
    FOR DELETE USING (auth.uid() = user_id);

-- Messenger interactions policies
CREATE POLICY "Users can view own messenger interactions" ON public.messenger_interactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own messenger interactions" ON public.messenger_interactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Deals policies
CREATE POLICY "Users can view own deals" ON public.deals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own deals" ON public.deals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own deals" ON public.deals
    FOR UPDATE USING (auth.uid() = user_id);

-- Learning data policies
CREATE POLICY "Users can view own learning data" ON public.learning_data
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own learning data" ON public.learning_data
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User sessions policies
CREATE POLICY "Users can view own sessions" ON public.user_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON public.user_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON public.user_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- === NEW SECURITY POLICIES FOR ALL TABLES ===

-- Agent workflows policies (System access only)
CREATE POLICY "System can manage agent workflows" ON public.agent_workflows
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Admin can view agent workflows" ON public.agent_workflows
    FOR SELECT USING (auth.role() = 'admin');

-- Orchestrator sessions policies (System access only)
CREATE POLICY "System can manage orchestrator sessions" ON public.orchestrator_sessions
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Admin can view orchestrator sessions" ON public.orchestrator_sessions
    FOR SELECT USING (auth.role() = 'admin');

-- Escrow workflows policies (System + authorized users)
CREATE POLICY "System can manage escrow workflows" ON public.escrow_workflows
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view own escrow workflows" ON public.escrow_workflows
    FOR SELECT USING (auth.uid() = seller_id OR auth.uid() = buyer_id);

-- Verification events policies (System + authorized users)
CREATE POLICY "System can manage verification events" ON public.verification_events
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view own verification events" ON public.verification_events
    FOR SELECT USING (auth.uid() IN (
        SELECT buyer_id FROM escrow_workflows WHERE id = escrow_id
        UNION
        SELECT seller_id FROM escrow_workflows WHERE id = escrow_id
    ));

-- Negotiator interactions policies (System + authorized users)
CREATE POLICY "System can manage negotiator interactions" ON public.negotiator_interactions
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view own negotiator interactions" ON public.negotiator_interactions
    FOR SELECT USING (auth.uid() = seller_id OR auth.uid() = buyer_id);

-- PII data policies (Strict access control)
CREATE POLICY "System can manage PII data" ON public.pii_data
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view own PII data" ON public.pii_data
    FOR SELECT USING (auth.uid() = user_id);

-- Compliance records policies (System + compliance officers)
CREATE POLICY "System can manage compliance records" ON public.compliance_records
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Compliance officers can view compliance records" ON public.compliance_records
    FOR SELECT USING (auth.role() = 'compliance_officer');

-- Escrow audit logs policies (System + auditors)
CREATE POLICY "System can manage escrow audit logs" ON public.escrow_audit_logs
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Auditors can view escrow audit logs" ON public.escrow_audit_logs
    FOR SELECT USING (auth.role() = 'auditor');

-- Analytics events policies (System + authorized analytics)
CREATE POLICY "System can manage analytics events" ON public.analytics_events
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Analytics can view analytics events" ON public.analytics_events
    FOR SELECT USING (auth.role() = 'analytics');

-- Asset attributes policies (System + authorized users)
CREATE POLICY "System can manage asset attributes" ON public.asset_attributes
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view own asset attributes" ON public.asset_attributes
    FOR SELECT USING (auth.uid() IN (
        SELECT user_id FROM car_listings WHERE id = listing_id
    ));

-- Accorria indices policies (Read-only for authenticated users)
CREATE POLICY "Authenticated users can view indices" ON public.accorria_confidence_index
    FOR SELECT USING (auth.role() IS NOT NULL);

CREATE POLICY "Authenticated users can view indices" ON public.accorria_migration_index
    FOR SELECT USING (auth.role() IS NOT NULL);

CREATE POLICY "Authenticated users can view indices" ON public.accorria_ev_index
    FOR SELECT USING (auth.role() IS NOT NULL);

CREATE POLICY "Authenticated users can view indices" ON public.accorria_risk_index
    FOR SELECT USING (auth.role() IS NOT NULL);

-- Synthetic datasets policies (System + authorized buyers)
CREATE POLICY "System can manage synthetic datasets" ON public.synthetic_datasets
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Authorized buyers can view synthetic datasets" ON public.synthetic_datasets
    FOR SELECT USING (auth.role() = 'data_buyer');

-- Synthetic records policies (System + authorized buyers)
CREATE POLICY "System can manage synthetic records" ON public.synthetic_records
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Authorized buyers can view synthetic records" ON public.synthetic_records
    FOR SELECT USING (auth.role() = 'data_buyer');

-- API licenses policies (System + license holders)
CREATE POLICY "System can manage API licenses" ON public.api_licenses
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "License holders can view own licenses" ON public.api_licenses
    FOR SELECT USING (auth.role() = 'data_buyer' OR auth.role() = 'admin');

-- API usage tracking policies (System + license holders)
CREATE POLICY "System can manage API usage tracking" ON public.api_usage_tracking
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "License holders can view own usage" ON public.api_usage_tracking
    FOR SELECT USING (auth.role() = 'data_buyer' OR auth.role() = 'admin');

-- Anomaly detections policies (System + security team)
CREATE POLICY "System can manage anomaly detections" ON public.anomaly_detections
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Security team can view anomaly detections" ON public.anomaly_detections
    FOR SELECT USING (auth.role() = 'security_team');

-- M2M transactions policies (System + authorized machines)
CREATE POLICY "System can manage M2M transactions" ON public.m2m_transactions
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Authorized machines can view own transactions" ON public.m2m_transactions
    FOR SELECT USING (auth.role() = 'service_role');

-- Multi-asset listings policies (System + authorized users)
CREATE POLICY "System can manage multi-asset listings" ON public.multi_asset_listings
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view own multi-asset listings" ON public.multi_asset_listings
    FOR SELECT USING (auth.uid() = owner_id);

-- Trust badges policies (System + authorized users)
CREATE POLICY "System can manage trust badges" ON public.trust_badges
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view own trust badges" ON public.trust_badges
    FOR SELECT USING (auth.uid() = user_id);

-- Blockchain escrow policies (System + authorized users)
CREATE POLICY "System can manage blockchain escrow" ON public.blockchain_escrow
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view own blockchain escrow" ON public.blockchain_escrow
    FOR SELECT USING (auth.uid() IN (
        SELECT buyer_id FROM escrow_workflows WHERE id = escrow_workflow_id
        UNION
        SELECT seller_id FROM escrow_workflows WHERE id = escrow_workflow_id
    ));

-- Security audit logs policies (System + security team)
CREATE POLICY "System can manage security audit logs" ON public.security_audit_logs
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Security team can view security audit logs" ON public.security_audit_logs
    FOR SELECT USING (auth.role() = 'security_team');

-- Compliance reports policies (System + compliance team)
CREATE POLICY "System can manage compliance reports" ON public.compliance_reports
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Compliance team can view compliance reports" ON public.compliance_reports
    FOR SELECT USING (auth.role() = 'compliance_team');

-- === FUNCTIONS ===
-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER SET search_path = public;

-- === TRIGGERS ===
-- Drop existing triggers first to avoid conflicts
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_car_listings_updated_at ON public.car_listings;
DROP TRIGGER IF EXISTS update_deals_updated_at ON public.deals;
DROP TRIGGER IF EXISTS update_escrow_workflows_updated_at ON escrow_workflows;

-- Create new triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_car_listings_updated_at BEFORE UPDATE ON public.car_listings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON public.deals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_escrow_workflows_updated_at BEFORE UPDATE ON escrow_workflows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- === INDEXES FOR PERFORMANCE ===
-- Existing QuickFlip indexes
CREATE INDEX IF NOT EXISTS idx_car_analyses_user_id ON public.car_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_car_listings_user_id ON public.car_listings(user_id);
CREATE INDEX IF NOT EXISTS idx_deals_user_id ON public.deals(user_id);
CREATE INDEX IF NOT EXISTS idx_car_listings_status ON public.car_listings(status);
CREATE INDEX IF NOT EXISTS idx_deals_status ON public.deals(status);

-- ULTIMATE BEAST indexes
CREATE INDEX IF NOT EXISTS idx_agent_workflows_workflow ON agent_workflows(workflow_id, agent_type);
CREATE INDEX IF NOT EXISTS idx_orchestrator_sessions_user ON orchestrator_sessions(user_id, session_id);
CREATE INDEX IF NOT EXISTS idx_escrow_workflows_listing ON escrow_workflows(listing_id, status);
CREATE INDEX IF NOT EXISTS idx_trust_badges_user ON trust_badges(user_id, badge_level);
CREATE INDEX IF NOT EXISTS idx_negotiator_interactions_listing ON negotiator_interactions(listing_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON analytics_events(user_id, event_name);
CREATE INDEX IF NOT EXISTS idx_confidence_index_region ON accorria_confidence_index(region, asset_type);
CREATE INDEX IF NOT EXISTS idx_migration_index_flow ON accorria_migration_index(origin_region, destination_region);
CREATE INDEX IF NOT EXISTS idx_ev_index_region ON accorria_ev_index(region);
CREATE INDEX IF NOT EXISTS idx_risk_index_region ON accorria_risk_index(region, asset_type);
CREATE INDEX IF NOT EXISTS idx_synthetic_datasets_type ON synthetic_datasets(dataset_type, asset_type);
CREATE INDEX IF NOT EXISTS idx_api_licenses_partner ON api_licenses(partner_name, license_type);
CREATE INDEX IF NOT EXISTS idx_anomaly_detections_type ON anomaly_detections(anomaly_type, severity_level);
CREATE INDEX IF NOT EXISTS idx_m2m_transactions_agent ON m2m_transactions(autonomous_agent_id);
CREATE INDEX IF NOT EXISTS idx_multi_asset_listings_type ON multi_asset_listings(asset_type, status);
CREATE INDEX IF NOT EXISTS idx_blockchain_escrow_workflow ON blockchain_escrow(escrow_workflow_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_user ON security_audit_logs(user_id, action_type);

-- === SUCCESS MESSAGE ===
SELECT '🚀 ACCORRIA ULTIMATE BEAST SCHEMA - THE MOST COMPREHENSIVE DATA EMPIRE EVER DEPLOYED! 💰' as status;
SELECT '✅ Trust-Native + Multi-Agent AI + Dual-LLM Brain-Split + Escrow-Integrated Intelligence!' as status;
SELECT '✅ Multi-Schema Architecture + Real-Time Indices + Synthetic Data + API Monetization!' as status;
SELECT '✅ Machine-to-Machine Transactions + Multi-Asset Support + Blockchain Escrow!' as status;

-- === SECURITY RECOMMENDATIONS ===
-- Enable these in Supabase Auth Settings for maximum security:
-- 1. Go to Authentication > Settings > Password Security
-- 2. Enable "Leaked password protection"
-- 3. Go to Authentication > Settings > Multi-Factor Authentication
-- 4. Enable multiple MFA options (SMS, TOTP, Email)
-- 5. Set up enterprise-grade security policies
