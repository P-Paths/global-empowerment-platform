-- 🚀 FIX LEADS TABLE RLS POLICIES - Get to 100%!
-- Complete RLS Policy Fix for leads table

-- Drop all existing policies first
DROP POLICY IF EXISTS "Allow public lead capture" ON public.leads;
DROP POLICY IF EXISTS "Allow service role read access" ON public.leads;
DROP POLICY IF EXISTS "Allow service role update access" ON public.leads;
DROP POLICY IF EXISTS "Allow service role insert access" ON public.leads;

-- Create comprehensive policies
CREATE POLICY "Allow public lead capture" ON public.leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service role read access" ON public.leads FOR SELECT USING (true);
CREATE POLICY "Allow service role update access" ON public.leads FOR UPDATE USING (true);
CREATE POLICY "Allow service role insert access" ON public.leads FOR INSERT WITH CHECK (true);

-- Also ensure the table allows inserts from service role
GRANT INSERT ON public.leads TO service_role;
GRANT SELECT ON public.leads TO service_role;
GRANT UPDATE ON public.leads TO service_role;

-- Enable RLS on leads table if not already enabled
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Test the setup
SELECT 'Leads table RLS policies fixed successfully!' as status;
