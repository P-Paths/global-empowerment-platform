-- Global Empowerment Platform (GEP) Foundation Schema
-- Creates tables for community feed, members, products, funding scores, and growth metrics

-- Members table (extends user profile with business info)
CREATE TABLE IF NOT EXISTS gep_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    business_name VARCHAR(255),
    business_type VARCHAR(100),
    industry VARCHAR(100),
    city VARCHAR(100),
    state VARCHAR(50),
    skills TEXT[],
    services TEXT[],
    products_count INTEGER DEFAULT 0,
    followers_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    bio TEXT,
    website_url VARCHAR(500),
    linkedin_url VARCHAR(500),
    instagram_handle VARCHAR(100),
    tiktok_handle VARCHAR(100),
    youtube_channel VARCHAR(200),
    funding_readiness_score INTEGER DEFAULT 0 CHECK (funding_readiness_score >= 0 AND funding_readiness_score <= 100),
    funding_status VARCHAR(20) DEFAULT 'Building' CHECK (funding_status IN ('Building', 'Emerging', 'VC-Ready')),
    profile_image_url VARCHAR(500),
    cover_image_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Community Posts table
CREATE TABLE IF NOT EXISTS gep_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES gep_members(id) ON DELETE CASCADE,
    content TEXT,
    image_urls TEXT[],
    video_url VARCHAR(500),
    video_thumbnail_url VARCHAR(500),
    post_type VARCHAR(20) DEFAULT 'text' CHECK (post_type IN ('text', 'image', 'video', 'carousel')),
    hashtags TEXT[],
    mentions TEXT[],
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    posted_to_facebook BOOLEAN DEFAULT FALSE,
    posted_to_instagram BOOLEAN DEFAULT FALSE,
    posted_to_tiktok BOOLEAN DEFAULT FALSE,
    posted_to_youtube BOOLEAN DEFAULT FALSE,
    facebook_post_id VARCHAR(200),
    instagram_post_id VARCHAR(200),
    tiktok_post_id VARCHAR(200),
    youtube_video_id VARCHAR(200),
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Post Likes table
CREATE TABLE IF NOT EXISTS gep_post_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES gep_posts(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES gep_members(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, member_id)
);

-- Post Comments table
CREATE TABLE IF NOT EXISTS gep_post_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES gep_posts(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES gep_members(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    likes_count INTEGER DEFAULT 0,
    parent_comment_id UUID REFERENCES gep_post_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Post Shares table
CREATE TABLE IF NOT EXISTS gep_post_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES gep_posts(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES gep_members(id) ON DELETE CASCADE,
    shared_to_platform VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table
CREATE TABLE IF NOT EXISTS gep_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES gep_members(id) ON DELETE CASCADE,
    sku VARCHAR(100),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2),
    price_range_min DECIMAL(10, 2),
    price_range_max DECIMAL(10, 2),
    category VARCHAR(100),
    image_urls TEXT[],
    video_url VARCHAR(500),
    target_audience TEXT,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'sold', 'archived')),
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Direct Messages table
CREATE TABLE IF NOT EXISTS gep_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES gep_members(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES gep_members(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (sender_id != recipient_id)
);

-- Member Follows table
CREATE TABLE IF NOT EXISTS gep_member_follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL REFERENCES gep_members(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES gep_members(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- Growth Metrics table (tracks daily/weekly metrics)
CREATE TABLE IF NOT EXISTS gep_growth_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES gep_members(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL,
    posts_count INTEGER DEFAULT 0,
    likes_received INTEGER DEFAULT 0,
    comments_received INTEGER DEFAULT 0,
    shares_received INTEGER DEFAULT 0,
    new_followers INTEGER DEFAULT 0,
    engagement_rate DECIMAL(5, 2),
    reach INTEGER DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    products_uploaded INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(member_id, metric_date)
);

-- Funding Readiness Score History
CREATE TABLE IF NOT EXISTS gep_funding_score_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES gep_members(id) ON DELETE CASCADE,
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
    score_breakdown JSONB, -- Stores detailed breakdown of scoring factors
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Growth Coach Tasks
CREATE TABLE IF NOT EXISTS gep_growth_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES gep_members(id) ON DELETE CASCADE,
    task_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Streaks (for gamification)
CREATE TABLE IF NOT EXISTS gep_user_streaks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES gep_members(id) ON DELETE CASCADE,
    streak_type VARCHAR(50) NOT NULL, -- 'posting', 'engagement', 'product_upload', etc.
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_activity_date DATE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(member_id, streak_type)
);

-- Events/Mentorship table
CREATE TABLE IF NOT EXISTS gep_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_type VARCHAR(50) DEFAULT 'mentorship' CHECK (event_type IN ('mentorship', 'workshop', 'networking', 'pitch', 'training')),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    location VARCHAR(255),
    virtual_link VARCHAR(500),
    max_attendees INTEGER,
    created_by UUID REFERENCES gep_members(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event Attendances
CREATE TABLE IF NOT EXISTS gep_event_attendances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES gep_events(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES gep_members(id) ON DELETE CASCADE,
    attended BOOLEAN DEFAULT FALSE,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, member_id)
);

-- AI Generated Content (flyers, captions, etc.)
CREATE TABLE IF NOT EXISTS gep_ai_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES gep_members(id) ON DELETE CASCADE,
    content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('caption', 'flyer', 'pitch_deck', 'product_description', 'branding', 'social_calendar')),
    prompt TEXT,
    generated_content JSONB, -- Stores the actual generated content
    metadata JSONB, -- Stores additional metadata like style, platform, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_gep_posts_member_id ON gep_posts(member_id);
CREATE INDEX IF NOT EXISTS idx_gep_posts_created_at ON gep_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gep_post_likes_post_id ON gep_post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_gep_post_comments_post_id ON gep_post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_gep_products_member_id ON gep_products(member_id);
CREATE INDEX IF NOT EXISTS idx_gep_messages_sender_recipient ON gep_messages(sender_id, recipient_id);
CREATE INDEX IF NOT EXISTS idx_gep_member_follows_follower ON gep_member_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_gep_member_follows_following ON gep_member_follows(following_id);
CREATE INDEX IF NOT EXISTS idx_gep_growth_metrics_member_date ON gep_growth_metrics(member_id, metric_date);
CREATE INDEX IF NOT EXISTS idx_gep_members_funding_score ON gep_members(funding_readiness_score DESC);
CREATE INDEX IF NOT EXISTS idx_gep_members_business_type ON gep_members(business_type);
CREATE INDEX IF NOT EXISTS idx_gep_members_city ON gep_members(city);

-- Enable Row Level Security (RLS)
ALTER TABLE gep_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE gep_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gep_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE gep_post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE gep_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE gep_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE gep_member_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE gep_growth_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE gep_funding_score_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE gep_growth_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE gep_ai_content ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (users can read all, but only modify their own)
-- Note: These are basic policies - you may want to customize based on your needs

-- Members: Users can read all, update only their own
CREATE POLICY "Members are viewable by everyone" ON gep_members FOR SELECT USING (true);
CREATE POLICY "Users can update own member profile" ON gep_members FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own member profile" ON gep_members FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Posts: Users can read all, create/update/delete only their own
CREATE POLICY "Posts are viewable by everyone" ON gep_posts FOR SELECT USING (true);
CREATE POLICY "Users can create own posts" ON gep_posts FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM gep_members WHERE id = member_id AND user_id = auth.uid())
);
CREATE POLICY "Users can update own posts" ON gep_posts FOR UPDATE USING (
    EXISTS (SELECT 1 FROM gep_members WHERE id = member_id AND user_id = auth.uid())
);
CREATE POLICY "Users can delete own posts" ON gep_posts FOR DELETE USING (
    EXISTS (SELECT 1 FROM gep_members WHERE id = member_id AND user_id = auth.uid())
);

