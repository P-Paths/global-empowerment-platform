-- GEM Platform MVP - Complete Database Schema
-- This migration creates all tables for the GEM Platform MVP

-- ============================================
-- 1. PROFILES (Users)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    city TEXT,
    state TEXT,
    business_name TEXT,
    business_category TEXT,
    skills TEXT[] DEFAULT '{}',
    followers_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    funding_score INTEGER DEFAULT 0 CHECK (funding_score >= 0 AND funding_score <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. POSTS (Social Feed)
-- ============================================
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    message TEXT,
    media_url TEXT,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. COMMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. FOLLOWERS
-- ============================================
CREATE TABLE IF NOT EXISTS followers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- ============================================
-- 5. DIRECT MESSAGES
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (sender_id != receiver_id)
);

-- ============================================
-- 6. AI GROWTH COACH (Tasks)
-- ============================================
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- 7. FUNDING READINESS SCORE LOGS
-- ============================================
CREATE TABLE IF NOT EXISTS funding_score_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 8. PERSONA CLONE STUDIO
-- ============================================
CREATE TABLE IF NOT EXISTS persona_clones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    prompt TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 9. PITCH DECK GENERATOR
-- ============================================
CREATE TABLE IF NOT EXISTS pitchdecks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    deck_json JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_business_category ON profiles(business_category);
CREATE INDEX IF NOT EXISTS idx_profiles_city ON profiles(city);
CREATE INDEX IF NOT EXISTS idx_profiles_funding_score ON profiles(funding_score DESC);

CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);

CREATE INDEX IF NOT EXISTS idx_followers_follower_id ON followers(follower_id);
CREATE INDEX IF NOT EXISTS idx_followers_following_id ON followers(following_id);

CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(user_id, completed);

CREATE INDEX IF NOT EXISTS idx_funding_score_logs_user_id ON funding_score_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_funding_score_logs_created_at ON funding_score_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_persona_clones_user_id ON persona_clones(user_id);
CREATE INDEX IF NOT EXISTS idx_pitchdecks_user_id ON pitchdecks(user_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE funding_score_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE persona_clones ENABLE ROW LEVEL SECURITY;
ALTER TABLE pitchdecks ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Profiles: Everyone can read, users can update their own
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Posts: Everyone can read, users can create/update/delete their own
CREATE POLICY "Posts are viewable by everyone" ON posts FOR SELECT USING (true);
CREATE POLICY "Users can create own posts" ON posts FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = user_id AND profiles.user_id = auth.uid())
);
CREATE POLICY "Users can update own posts" ON posts FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = user_id AND profiles.user_id = auth.uid())
);
CREATE POLICY "Users can delete own posts" ON posts FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = user_id AND profiles.user_id = auth.uid())
);

-- Comments: Everyone can read, users can create/update/delete their own
CREATE POLICY "Comments are viewable by everyone" ON comments FOR SELECT USING (true);
CREATE POLICY "Users can create own comments" ON comments FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = user_id AND profiles.user_id = auth.uid())
);
CREATE POLICY "Users can update own comments" ON comments FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = user_id AND profiles.user_id = auth.uid())
);
CREATE POLICY "Users can delete own comments" ON comments FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = user_id AND profiles.user_id = auth.uid())
);

-- Followers: Users can read all, create/delete their own follows
CREATE POLICY "Followers are viewable by everyone" ON followers FOR SELECT USING (true);
CREATE POLICY "Users can create own follows" ON followers FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = follower_id AND profiles.user_id = auth.uid())
);
CREATE POLICY "Users can delete own follows" ON followers FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = follower_id AND profiles.user_id = auth.uid())
);

-- Messages: Users can only read their own messages
CREATE POLICY "Users can read own messages" ON messages FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE (id = sender_id OR id = receiver_id) AND profiles.user_id = auth.uid())
);
CREATE POLICY "Users can create own messages" ON messages FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = sender_id AND profiles.user_id = auth.uid())
);
CREATE POLICY "Users can update own received messages" ON messages FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = receiver_id AND profiles.user_id = auth.uid())
);

-- Tasks: Users can only access their own tasks
CREATE POLICY "Users can read own tasks" ON tasks FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = user_id AND profiles.user_id = auth.uid())
);
CREATE POLICY "Users can create own tasks" ON tasks FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = user_id AND profiles.user_id = auth.uid())
);
CREATE POLICY "Users can update own tasks" ON tasks FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = user_id AND profiles.user_id = auth.uid())
);
CREATE POLICY "Users can delete own tasks" ON tasks FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = user_id AND profiles.user_id = auth.uid())
);

-- Funding Score Logs: Users can only access their own logs
CREATE POLICY "Users can read own funding score logs" ON funding_score_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = user_id AND profiles.user_id = auth.uid())
);
CREATE POLICY "Users can create own funding score logs" ON funding_score_logs FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = user_id AND profiles.user_id = auth.uid())
);

-- Persona Clones: Users can only access their own clones
CREATE POLICY "Users can read own persona clones" ON persona_clones FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = user_id AND profiles.user_id = auth.uid())
);
CREATE POLICY "Users can create own persona clones" ON persona_clones FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = user_id AND profiles.user_id = auth.uid())
);
CREATE POLICY "Users can update own persona clones" ON persona_clones FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = user_id AND profiles.user_id = auth.uid())
);
CREATE POLICY "Users can delete own persona clones" ON persona_clones FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = user_id AND profiles.user_id = auth.uid())
);

-- Pitch Decks: Users can only access their own pitch decks
CREATE POLICY "Users can read own pitch decks" ON pitchdecks FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = user_id AND profiles.user_id = auth.uid())
);
CREATE POLICY "Users can create own pitch decks" ON pitchdecks FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = user_id AND profiles.user_id = auth.uid())
);
CREATE POLICY "Users can update own pitch decks" ON pitchdecks FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = user_id AND profiles.user_id = auth.uid())
);
CREATE POLICY "Users can delete own pitch decks" ON pitchdecks FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = user_id AND profiles.user_id = auth.uid())
);

