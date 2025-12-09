# RLS Policy Fix for Onboarding

## Problem
The onboarding flow was failing with the error:
```
new row violates row-level security policy for table "profiles"
```

This occurred because:
1. **Demo users** aren't authenticated in Supabase, so `auth.uid()` returns `NULL`
2. **RLS policies** require `auth.uid() = user_id` for INSERT operations
3. The frontend was trying to create profiles directly via Supabase client, which respects RLS

## Solution
Created a backend API endpoint that uses Supabase **service role** to bypass RLS policies.

### Changes Made

#### 1. Backend API Endpoint (`backend/app/api/v1/profiles.py`)
- Added `POST /api/v1/profiles/onboarding` endpoint
- Uses `SupabaseService` with service role key (bypasses RLS)
- Handles both profile creation and updates (upsert)
- Supports demo users by checking for demo user ID
- Maps onboarding fields to profile table columns:
  - `first_name` + `last_name` → `full_name`
  - `selected_category` → `business_category`
  - `city` → `city`
  - `onboarding_complete` → `onboarding_complete`

#### 2. Frontend Onboarding Service (`frontend/src/services/onboardingService.ts`)
- Updated `updateOnboardingData()` to call backend API instead of direct Supabase calls
- Removed complex retry logic (backend handles it)
- Simplified code by removing profile existence checks
- Uses `authenticatedFetch()` to include auth headers

### How It Works

1. **Frontend** calls `POST /api/v1/profiles/onboarding` with onboarding data
2. **Backend** verifies user authentication (allows demo users)
3. **Backend** uses Supabase service role to upsert profile (bypasses RLS)
4. **Backend** returns success/error response
5. **Frontend** handles response and continues onboarding flow

### Benefits

✅ **Bypasses RLS** - Service role has full database access
✅ **Supports demo users** - No authentication required for demo flow
✅ **Simpler code** - Removed complex retry logic
✅ **More secure** - Backend validates user ownership
✅ **Centralized logic** - Profile creation/update in one place

### Testing

To test the fix:
1. Start backend: `cd backend && source venv/bin/activate && python start_server.py`
2. Start frontend: `cd frontend && npm run dev`
3. Try onboarding flow with demo user (user/register)
4. Should no longer see RLS errors

### Files Modified

- `backend/app/api/v1/profiles.py` - Added onboarding endpoint
- `frontend/src/services/onboardingService.ts` - Updated to use backend API
- `backend/app/services/supabase_service.py` - Already had service role support

### Next Steps (Optional)

1. Add `onboarding_complete` column to `profiles` table if not exists
2. Consider adding more onboarding fields if needed
3. Add rate limiting to onboarding endpoint
4. Add logging/analytics for onboarding completion

