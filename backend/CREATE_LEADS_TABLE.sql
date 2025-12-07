-- 🚀 CREATE LEADS TABLE - Missing from Ultimate Beast Schema
-- This table is needed for the leads API to work

-- Create the leads table
CREATE TABLE IF NOT EXISTS public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Contact Info
  name text,
  email text NOT NULL,
  phone text,
  
  -- Lead Source & Attribution
  source text NOT NULL,
  utm_campaign text,
  utm_source text,
  utm_medium text,
  utm_content text,
  utm_term text,
  
  -- Lead Qualification
  score smallint DEFAULT 50,
  status text DEFAULT 'new',
  
  -- Additional Data
  notes text,
  demo_engagement jsonb,
  survey_responses jsonb,
  
  -- Meeting Info
  meeting_booked_at timestamptz,
  meeting_type text,
  meeting_completed_at timestamptz,
  
  -- Conversion Tracking
  trial_started_at timestamptz,
  paid_conversion_at timestamptz,
  revenue decimal(10,2)
);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Allow public lead capture" ON public.leads;
DROP POLICY IF EXISTS "Allow service role read access" ON public.leads;
DROP POLICY IF EXISTS "Allow service role update access" ON public.leads;
DROP POLICY IF EXISTS "Allow service role insert access" ON public.leads;

CREATE POLICY "Allow public lead capture" ON public.leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service role read access" ON public.leads FOR SELECT USING (true);
CREATE POLICY "Allow service role update access" ON public.leads FOR UPDATE USING (true);
CREATE POLICY "Allow service role insert access" ON public.leads FOR INSERT WITH CHECK (true);

-- Grant permissions
GRANT INSERT ON public.leads TO service_role;
GRANT SELECT ON public.leads TO service_role;
GRANT UPDATE ON public.leads TO service_role;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_source ON public.leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_score ON public.leads(score);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Success message
SELECT '✅ Leads table created successfully with RLS policies!' as status;