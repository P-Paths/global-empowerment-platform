# Fix 401 Unauthorized Error on Backend API

## Problem

You're getting `401 (Unauthorized)` errors when calling the backend API endpoint `/api/v1/profiles/onboarding`. This happens because the backend cannot validate the JWT token from Supabase.

## Root Cause

The backend requires `SUPABASE_JWT_SECRET` environment variable to be set in your Cloud Run service. This secret must match the JWT secret from your Supabase project. If it's missing or incorrect, all authenticated requests will fail with 401.

## Solution

### Step 1: Get Your Supabase JWT Secret

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Find the **JWT Secret** (it's a long base64-encoded string)
4. Copy this value

### Step 2: Set the Environment Variable in Cloud Run

You have two options:

#### Option A: Using Google Cloud Console (Easiest)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **Cloud Run** → **gem-backend** service
3. Click **Edit & Deploy New Revision**
4. Go to the **Variables & Secrets** tab
5. Click **Add Variable**
6. Add:
   - **Name**: `SUPABASE_JWT_SECRET`
   - **Value**: (paste your JWT secret from Supabase)
7. Click **Deploy**

#### Option B: Using gcloud CLI

```bash
# Set the environment variable
gcloud run services update gem-backend \
  --region us-central1 \
  --project gem-platform-480517 \
  --update-env-vars SUPABASE_JWT_SECRET="YOUR_JWT_SECRET_HERE"
```

Replace `YOUR_JWT_SECRET_HERE` with the actual JWT secret from your Supabase project.

### Step 3: Verify It's Set

Check that the environment variable is set:

```bash
gcloud run services describe gem-backend \
  --region us-central1 \
  --project gem-platform-480517 \
  --format="value(spec.template.spec.containers[0].env)"
```

You should see `SUPABASE_JWT_SECRET` in the list.

### Step 4: Test

1. Try completing onboarding again
2. The 401 error should be resolved
3. Check backend logs if you still get errors:
   ```bash
   gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=gem-backend" \
     --limit 50 \
     --format json \
     --project gem-platform-480517
   ```

## Important Notes

1. **Security**: Never commit the JWT secret to git. It should only be set as an environment variable.

2. **Matching Secrets**: The `SUPABASE_JWT_SECRET` in Cloud Run must **exactly match** the JWT secret from your Supabase project. Even a small difference will cause authentication to fail.

3. **Token Expiration**: JWT tokens expire after a certain time (default is 1 hour for Supabase). If tokens are expired, users need to refresh their session or log in again.

4. **Development vs Production**: 
   - If `SUPABASE_JWT_SECRET` is not set, the backend uses mock authentication (dev mode)
   - If it IS set, the backend validates tokens strictly (production mode)

## Troubleshooting

### Still Getting 401?

1. **Verify the secret is set correctly:**
   ```bash
   gcloud run services describe gem-backend \
     --region us-central1 \
     --project gem-platform-480517 \
     --format="value(spec.template.spec.containers[0].env)" | grep SUPABASE_JWT_SECRET
   ```

2. **Check backend logs for JWT errors:**
   ```bash
   gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=gem-backend AND textPayload=~'JWT'" \
     --limit 20 \
     --project gem-platform-480517
   ```

3. **Verify the JWT secret matches:**
   - Go to Supabase Dashboard → Settings → API
   - Compare the JWT Secret with what's set in Cloud Run
   - They must match exactly

4. **Check if token is being sent:**
   - Open browser DevTools → Network tab
   - Look for the request to `/api/v1/profiles/onboarding`
   - Check the Request Headers for `Authorization: Bearer <token>`
   - If missing, the frontend isn't sending the token

5. **Token might be expired:**
   - Try logging out and logging back in
   - This will generate a fresh token

## Related Files

- `backend/app/utils/auth.py` - Backend authentication logic
- `backend/deploy-gem-backend.sh` - Deployment script (shows env vars needed)
- `frontend/src/utils/api.ts` - Frontend API client that sends tokens
