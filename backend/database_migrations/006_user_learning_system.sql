-- GEP User Learning System
-- Tracks user behavior and learns from interactions to personalize AI assistant

-- User Behavior Tracking
CREATE TABLE IF NOT EXISTS user_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    interaction_type VARCHAR(50) NOT NULL, -- 'post_created', 'task_completed', 'profile_updated', 'feed_viewed', etc.
    interaction_data JSONB, -- Flexible data storage for different interaction types
    metadata JSONB, -- Additional context (device, time, location, etc.)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Learning Profile (AI Assistant Personalization)
CREATE TABLE IF NOT EXISTS user_learning_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
    behavior_patterns JSONB DEFAULT '{}', -- Learned patterns (posting frequency, preferred times, etc.)
    preferences JSONB DEFAULT '{}', -- User preferences learned over time
    ai_personality JSONB DEFAULT '{}', -- Personalized AI assistant traits
    learning_score INTEGER DEFAULT 0, -- How much we've learned about this user (0-100)
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Assistant Conversations (for learning from interactions)
CREATE TABLE IF NOT EXISTS ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    conversation_type VARCHAR(50), -- 'growth_coach', 'content_suggestion', 'funding_advice', etc.
    user_message TEXT,
    ai_response TEXT,
    user_feedback INTEGER, -- 1-5 rating, or NULL if no feedback
    was_helpful BOOLEAN, -- User marked as helpful/not helpful
    context JSONB, -- Conversation context
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Goals & Progress Tracking
CREATE TABLE IF NOT EXISTS user_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    goal_type VARCHAR(50) NOT NULL, -- 'follower_count', 'funding_score', 'post_frequency', etc.
    target_value INTEGER,
    current_value INTEGER DEFAULT 0,
    deadline DATE,
    ai_suggestions JSONB, -- AI-generated suggestions for this goal
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance (scales to 8000+ users)
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_id ON user_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_type ON user_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_user_interactions_created_at ON user_interactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_type ON user_interactions(user_id, interaction_type);

CREATE INDEX IF NOT EXISTS idx_learning_profiles_user_id ON user_learning_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_profiles_learning_score ON user_learning_profiles(learning_score DESC);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_type ON ai_conversations(conversation_type);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_created_at ON ai_conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_feedback ON ai_conversations(was_helpful) WHERE was_helpful IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_goals_user_id ON user_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_goals_completed ON user_goals(user_id, completed);
CREATE INDEX IF NOT EXISTS idx_user_goals_type ON user_goals(goal_type);

-- Enable RLS
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_learning_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only access their own data
CREATE POLICY "Users can read own interactions" ON user_interactions FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = user_id AND profiles.user_id = auth.uid())
);

CREATE POLICY "Users can read own learning profile" ON user_learning_profiles FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = user_id AND profiles.user_id = auth.uid())
);

CREATE POLICY "Users can update own learning profile" ON user_learning_profiles FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = user_id AND profiles.user_id = auth.uid())
);

CREATE POLICY "Users can read own conversations" ON ai_conversations FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = user_id AND profiles.user_id = auth.uid())
);

CREATE POLICY "Users can create own conversations" ON ai_conversations FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = user_id AND profiles.user_id = auth.uid())
);

CREATE POLICY "Users can read own goals" ON user_goals FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = user_id AND profiles.user_id = auth.uid())
);

CREATE POLICY "Users can manage own goals" ON user_goals FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = user_id AND profiles.user_id = auth.uid())
);

-- Function to auto-create learning profile when user signs up
CREATE OR REPLACE FUNCTION create_user_learning_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_learning_profiles (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_learning_profile
    AFTER INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION create_user_learning_profile();

COMMENT ON TABLE user_interactions IS 'Tracks all user interactions for learning patterns';
COMMENT ON TABLE user_learning_profiles IS 'Stores learned user preferences and AI personalization data';
COMMENT ON TABLE ai_conversations IS 'Stores AI assistant conversations for learning what helps users';
COMMENT ON TABLE user_goals IS 'Tracks user goals and AI-generated suggestions';

