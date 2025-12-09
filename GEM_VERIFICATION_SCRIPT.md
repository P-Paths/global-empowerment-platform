# 🔍 GEM Platform - Complete Verification Script

**One command to verify everything.** Paste this entire document into Cursor to get a comprehensive verification report.

---

## ✅ STEP 1: Database Tables Verification

**Command:**
```
Cursor, list every SQL migration file that currently exists in /backend/database_migrations and summarize the tables each one creates. Show the SQL for each table.
```

**Expected Tables (GEM Platform MVP):**
- ✅ profiles
- ✅ posts
- ✅ comments
- ✅ followers
- ✅ messages
- ✅ tasks
- ✅ funding_score_logs
- ✅ persona_clones
- ✅ pitchdecks

**Expected Tables (GEP Foundation - Legacy):**
- ✅ gep_members
- ✅ gep_posts
- ✅ gep_post_likes
- ✅ gep_post_comments
- ✅ gep_post_shares
- ✅ gep_products
- ✅ gep_messages
- ✅ gep_member_follows
- ✅ gep_growth_metrics
- ✅ gep_funding_score_history
- ✅ gep_growth_tasks
- ✅ gep_user_streaks
- ✅ gep_events
- ✅ gep_event_attendances
- ✅ gep_ai_content

---

## ✅ STEP 2: SQLAlchemy Models Verification

**Command:**
```
Cursor, show me the contents of /backend/app/models and confirm that one SQLAlchemy model exists for each table in the GEM Blueprint. List each model file and display the class definitions.
```

**Expected Models (GEM Platform MVP):**
- ✅ Profile
- ✅ Post
- ✅ Comment
- ✅ Follower
- ✅ Message
- ✅ Task
- ✅ FundingScoreLog
- ✅ PersonaClone
- ✅ PitchDeck

**Expected Models (GEP Foundation - Legacy):**
- ✅ GEPMember
- ✅ GEPPost
- ✅ GEPPostLike
- ✅ GEPPostComment
- ✅ GEPProduct
- ✅ GEPMessage
- ✅ GEPMemberFollows
- ✅ GEPGrowthMetric
- ✅ GEPGrowthTask
- ✅ GEPUserStreaks

---

## ✅ STEP 3: FastAPI Routers Verification

**Command:**
```
Cursor, list all files inside /backend/app/api/v1 and show the FastAPI route definitions for each module. Confirm they match the GEM God Mode Blueprint endpoints.
```

**Expected Routers:**
- ✅ profiles.py - GET /profiles, GET /profiles/{id}, PUT /profiles/{id}
- ✅ posts.py - GET /posts, POST /posts, POST /posts/{id}/like
- ✅ comments.py - GET /posts/{id}/comments, POST /posts/{id}/comments
- ✅ followers.py - POST /follow/{id}, DELETE /follow/{id}
- ✅ messages.py - GET /messages/{id}, POST /messages/send
- ✅ tasks.py - GET /tasks, POST /tasks, POST /tasks/{id}/complete
- ✅ score.py - POST /funding-score/calculate, GET /funding-score/logs
- ✅ clone.py - GET /clone, POST /clone
- ✅ pitchdeck.py - GET /pitchdeck/{id}, POST /pitchdeck/generate

---

## ✅ STEP 4: Service Layer Verification

**Command:**
```
Cursor, list all service files inside /backend/app/services and confirm each one implements the business logic for its corresponding router. Show each service's function signatures.
```

**Expected Services:**
- ✅ funding_readiness_score.py - calculate_funding_score()
- ✅ supabase_service.py - Database operations
- ✅ platform_poster.py - Social media posting
- ✅ message_monitor.py - Message monitoring
- ✅ data_collection_service.py - Data collection
- ✅ rag_service.py - RAG operations
- ✅ cache.py - Caching utilities

**Note:** Some services may be shared across multiple routers.

---

## ✅ STEP 5: Frontend Pages Verification

**Command:**
```
Cursor, list the pages inside /frontend/src/app and show a tree for:
/feed
/profile/[id]
/tasks
/funding-score
/clone-studio
/pitchdeck

Verify each page exists and contains real React components.
```

**Expected Pages:**
- ✅ /feed - page.tsx
- ✅ /profile/[id] - page.tsx
- ✅ /tasks - page.tsx
- ✅ /funding-score - page.tsx
- ✅ /clone-studio - page.tsx
- ✅ /pitchdeck - page.tsx
- ✅ /messages - page.tsx

---

## ✅ STEP 6: Frontend Hooks Verification

**Command:**
```
Cursor, show all files inside /frontend/src/hooks and confirm that hooks exist for:
usePosts, useCreatePost, useLikePost, useComments, useCreateComment, useProfile, useUpdateProfile, useFollowers, useFollow, useUnfollow, useMessages, useSendMessage, useTasks, useCompleteTask, useFundingScore, useClone, useCreateClone, usePitchDeck
```

**Expected Hooks (in useGEMPlatform.ts):**
- ✅ useProfile(profileId)
- ✅ useSearchProfiles(searchTerm)
- ✅ useUpdateProfile()
- ✅ usePosts(limit)
- ✅ useCreatePost()
- ✅ useLikePost()
- ✅ useComments(postId)
- ✅ useCreateComment()
- ✅ useFollow()
- ✅ useUnfollow()
- ✅ useMessages(userId)
- ✅ useSendMessage()
- ✅ useTasks()
- ✅ useCreateTask()
- ✅ useCompleteTask()
- ✅ useFundingScore()
- ✅ useFundingScoreLogs()
- ✅ usePersonaClones()
- ✅ useCreatePersonaClone()
- ✅ useCreatePitchDeck()
- ✅ usePitchDeck(deckId)

---

## ✅ STEP 7: Type Checking & Linting

**Command:**
```
Cursor, run backend type checking and linting:

cd backend && python -m mypy app --ignore-missing-imports
cd backend && ruff check app

Then build the frontend:

cd frontend && npm run build

Report all errors.
```

**Expected:** No critical errors (warnings are acceptable).

---

## ✅ STEP 8: API Endpoint Verification

**Command:**
```
Cursor, verify that all FastAPI routes in /backend/app/api/v1 are properly registered in the main FastAPI app. Show me the router registration in main.py.
```

**Expected:** All routers should be included in the main FastAPI app.

---

## 📊 VERIFICATION SUMMARY

After running all steps, you should have:

1. ✅ **Database**: 9 GEM tables + 15 GEP tables = 24 total tables
2. ✅ **Models**: 9 GEM models + 10 GEP models = 19 total models
3. ✅ **Routers**: 9+ API router files
4. ✅ **Services**: 7+ service files
5. ✅ **Frontend Pages**: 7+ Next.js pages
6. ✅ **Frontend Hooks**: 20+ React hooks
7. ✅ **Type Safety**: No mypy errors
8. ✅ **Code Quality**: No critical ruff errors
9. ✅ **Build**: Frontend builds successfully

---

## 🚨 COMMON ISSUES TO CHECK

1. **Missing Models**: If a table exists but no model → Create model
2. **Missing Routes**: If a model exists but no route → Create route
3. **Missing Hooks**: If a route exists but no hook → Create hook
4. **Missing Pages**: If a hook exists but no page → Create page
5. **Type Errors**: Fix mypy errors before deployment
6. **Import Errors**: Ensure all imports are correct
7. **RLS Policies**: Verify Row Level Security is enabled on all tables

---

## 🎯 QUICK VERIFICATION COMMAND

**Paste this single command to get a full report:**

```
Cursor, perform a complete verification of the GEM Platform build:

1. List all SQL migration files and their tables
2. List all SQLAlchemy models and their corresponding tables
3. List all FastAPI routers and their endpoints
4. List all service files and their main functions
5. List all frontend pages in /frontend/src/app
6. List all frontend hooks in /frontend/src/hooks
7. Check for missing connections between layers (table → model → route → service → hook → page)
8. Report any gaps or missing components

Format the output as a comprehensive verification report with checkmarks for each component.
```

---

## 📝 NOTES

- **GEP vs GEM**: The codebase has both GEP (Global Empowerment Platform) and GEM (God Mode) schemas. Verify which one is actively used.
- **Legacy Code**: Some GEP models may be legacy. Document which schema is primary.
- **Missing Features**: If any expected tables/models/routes are missing, document them for future implementation.

