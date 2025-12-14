# Fix RLS and Authentication Issues

This document explains the fixes for the 403 Forbidden and 401 Unauthorized errors during onboarding.

## Issues Identified

### 1. Missing INSERT Policy for `user_learning_profiles` (403 Error)
**Error**: `new row violates row-level security policy for table "user_learning_profiles"`

**Root Cause**: The trigger `create_user_learning_profile()` tries to insert into `user_learning_profiles` when a profile is created, but there was no INSERT RLS policy allowing this operation.

**Fix**: Added INSERT policy in `backend/database_migrations/008_fix_rls_policies.sql` that allows inserts when the `user_id` matches a profile that belongs to the authenticated user.

### 2. Profiles RLS Policy Issues (403 Error)
**Error**: `POST https://pbjwtmfbhaibnxganxdh.supabase.co/rest/v1/profiles?on_conflict=id 403 (Forbidden)`

**Root Cause**: The RLS policies for the `profiles` table were correctly checking `auth.uid() = user_id`, but the policies needed to be recreated to ensure they work correctly with upsert operations.

**Fix**: Recreated the INSERT and UPDATE policies in `backend/database_migrations/008_fix_rls_policies.sql` to ensure they properly handle upsert operations.

### 3. Backend Authentication (401 Error)
**Error**: `POST https://gem-backend-1094576259070.us-central1.run.app/api/v1/profiles/onboarding 401 (Unauthorized)`

**Root Cause**: The backend requires a valid JWT token in production mode (when `SUPABASE_JWT_SECRET` is set). The 401 error indicates either:
- The JWT token is missing or invalid
- The JWT secret doesn't match the one used to sign the token
- The token has expired

**Fix**: The authentication code is already correct. The issue is likely a configuration problem. See "Deployment Steps" below.

## Migration File

Created `backend/database_migrations/008_fix_rls_policies.sql` with the following fixes:

1. **INSERT policy for `user_learning_profiles`**: Allows the trigger to create learning profiles when a user profile is created.

2. **Recreated `profiles` INSERT policy**: Ensures users can create their own profiles when `user_id` matches `auth.uid()`.

3. **Recreated `profiles` UPDATE policy**: Ensures users can update their own profiles when `user_id` matches `auth.uid()`.

## Deployment Steps

### 1. Apply Database Migration

Run the migration on your Supabase database:

```sql
-- Run the contents of backend/database_migrations/008_fix_rls_policies.sql
-- This can be done via Supabase SQL Editor or your migration tool
```

Or if you have a migration runner:

```bash
# Apply the migration
psql $DATABASE_URL -f backend/database_migrations/008_fix_rls_policies.sql
```

### 2. Verify Backend Environment Variables

Ensure your backend has the correct `SUPABASE_JWT_SECRET` set:

```bash
# Check if the secret is set
echo $SUPABASE_JWT_SECRET

# The secret should match the JWT secret from your Supabase project
# Get it from: Supabase Dashboard > Settings > API > JWT Secret
```

**Important**: The `SUPABASE_JWT_SECRET` in your backend environment must match the JWT secret from your Supabase project settings. If they don't match, all authenticated requests will fail with 401.

### 3. Verify Frontend is Sending Tokens

The frontend code in `frontend/src/utils/api.ts` should automatically include the JWT token in the `Authorization` header. Verify this is working by:

1. Opening browser DevTools > Network tab
2. Making a request to the backend API
3. Checking the request headers for `Authorization: Bearer <token>`

### 4. Test the Fix

1. **Test Profile Creation**: Try completing onboarding again. The 403 errors should be resolved.

2. **Test Backend API**: The backend API should now accept valid JWT tokens. If you still get 401:
   - Verify `SUPABASE_JWT_SECRET` is set correctly
   - Check backend logs for JWT validation errors
   - Ensure the token from Supabase is not expired

## Verification

After applying the fixes, you should see:

1. ✅ No more 403 errors when creating profiles via Supabase client
2. ✅ No more RLS violations for `user_learning_profiles`
3. ✅ Backend API accepts valid JWT tokens (no 401 for authenticated users)

## Troubleshooting

### Still Getting 403 on Profiles?

- Verify the migration was applied: Check Supabase SQL Editor for the new policies
- Check that `user_id` in the insert matches `auth.uid()`: The RLS policy requires `auth.uid() = user_id`
- Verify RLS is enabled: `SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'profiles';`

### Still Getting 401 on Backend API?

- Verify `SUPABASE_JWT_SECRET` is set in backend environment
- Check backend logs for JWT validation errors
- Verify the JWT secret matches your Supabase project's JWT secret
- Test with a fresh token: Log out and log back in to get a new token

### Token Validation Errors?

If you see errors like "Invalid token" or "Token expired":
- Tokens expire after a certain time (default is 1 hour for Supabase)
- Users need to refresh their session or log in again
- Check if token refresh is working in your frontend

## Related Files

- `backend/database_migrations/008_fix_rls_policies.sql` - RLS policy fixes
- `backend/app/utils/auth.py` - Backend authentication logic
- `frontend/src/utils/api.ts` - Frontend API client with auth
- `frontend/src/services/onboardingService.ts` - Onboarding service that uses the API
