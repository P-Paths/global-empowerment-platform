-- VIN Knowledge Base Table
-- Stores VIN feature data so we can reuse it without expensive API calls
-- This allows the system to learn from previous VIN lookups

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

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_vin_knowledge_base_vin ON public.vin_knowledge_base(vin);
CREATE INDEX IF NOT EXISTS idx_vin_knowledge_base_make_model_year ON public.vin_knowledge_base(make, model, year);
CREATE INDEX IF NOT EXISTS idx_vin_knowledge_base_last_used ON public.vin_knowledge_base(last_used_date DESC);

-- Function to update last_used_date and usage_count
-- Drop trigger first if it exists
DROP TRIGGER IF EXISTS trigger_update_vin_knowledge_base_usage ON public.vin_knowledge_base;

-- Drop function if it exists, then recreate
DROP FUNCTION IF EXISTS update_vin_knowledge_base_usage();

CREATE OR REPLACE FUNCTION update_vin_knowledge_base_usage()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_used_date = NOW();
    NEW.usage_count = OLD.usage_count + 1;
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update usage stats
CREATE TRIGGER trigger_update_vin_knowledge_base_usage
    BEFORE UPDATE ON public.vin_knowledge_base
    FOR EACH ROW
    WHEN (OLD.vin = NEW.vin)
    EXECUTE FUNCTION update_vin_knowledge_base_usage();

-- Enable Row Level Security
ALTER TABLE public.vin_knowledge_base ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "VIN knowledge base is publicly readable" ON public.vin_knowledge_base;
DROP POLICY IF EXISTS "Authenticated users can manage VIN knowledge base" ON public.vin_knowledge_base;

-- Policy: Anyone can read VIN knowledge base (it's public knowledge)
CREATE POLICY "VIN knowledge base is publicly readable"
    ON public.vin_knowledge_base
    FOR SELECT
    USING (true);

-- Policy: Only authenticated users can insert/update (via backend service)
CREATE POLICY "Authenticated users can manage VIN knowledge base"
    ON public.vin_knowledge_base
    FOR ALL
    USING (auth.role() = 'authenticated');

COMMENT ON TABLE public.vin_knowledge_base IS 'Stores VIN feature data for reuse. When a VIN is looked up, we check here first before making expensive API calls. This allows the system to learn and improve over time.';

