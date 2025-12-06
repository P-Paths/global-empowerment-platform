-- Add listings table for cross-device data persistence
-- This replaces localStorage with proper database storage

-- Create listings table
CREATE TABLE IF NOT EXISTS public.listings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    sold_for DECIMAL(10,2),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'sold', 'draft')),
    images TEXT[] DEFAULT '{}',
    
    -- Car-specific fields
    make TEXT,
    model TEXT,
    year INTEGER,
    mileage INTEGER,
    condition TEXT,
    location TEXT,
    
    -- Component-expected fields
    title_status TEXT DEFAULT 'Clean',
    platforms TEXT[] DEFAULT '{}',
    messages INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    sold_at TIMESTAMP WITH TIME ZONE,
    sold_to TEXT,
    detected_features TEXT[] DEFAULT '{}',
    ai_analysis TEXT,
    final_description TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own listings" ON public.listings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own listings" ON public.listings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own listings" ON public.listings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own listings" ON public.listings
    FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_listings_user_id ON public.listings(user_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON public.listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON public.listings(created_at DESC);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_listings_updated_at 
    BEFORE UPDATE ON public.listings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON public.listings TO authenticated;
GRANT ALL ON public.listings TO service_role;
