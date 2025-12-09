-- Verification Query: Check if all GEM Platform MVP tables exist
-- Run this in Supabase SQL Editor to verify all tables were created

SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM 
    information_schema.tables t
WHERE 
    table_schema = 'public' 
    AND table_name IN (
        'profiles',
        'posts',
        'comments',
        'followers',
        'messages',
        'tasks',
        'funding_score_logs',
        'persona_clones',
        'pitchdecks'
    )
ORDER BY 
    table_name;

-- Expected result: 9 rows (one for each table)
-- If you see all 9 tables, the migration was successful!

