# Fix Backend Connection Issue

## Current Problem
The frontend is trying to connect to the backend but getting:
```
Failed to connect to https://gem-backend-1094576259070.us-central1.run.app/api/v1/profiles/onboarding
```

## Quick Fix Steps

### Step 1: Set Environment Variable in Vercel

1. Go to Vercel Dashboard:
   - https://vercel.com/preston-s-projects/global-empowerment-platform/settings/environment-variables

2. Add/Update this environment variable:
   - **Name:** `NEXT_PUBLIC_API_URL`
   - **Value:** `https://gem-backend-1094576259070.us-central1.run.app`
   - **Important:** Do NOT include `/api/v1` - just the base URL
   - **Environments:** Check Production, Preview, and Development

3. **Redeploy** after adding the variable:
   - Go to Deployments tab
   - Click "Redeploy" on the latest deployment
   - Or push a new commit to trigger auto-deploy

### Step 2: Verify Backend is Running

Test if the backend is accessible:

```bash
# Test backend health endpoint
curl https://gem-backend-1094576259070.us-central1.run.app/health
```

**Expected response:**
```json
{"status":"healthy",...}
```

**If this fails:**
- The backend might not be deployed
- Deploy it using: `cd backend && ./deploy-gem-backend.sh`

### Step 3: Check Browser Console

After redeploying with the environment variable:

1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for this log message:
   ```
   🔗 Constructed API URL: { NEXT_PUBLIC_API_URL: "...", baseUrl: "...", finalUrl: "..." }
   ```

4. Verify the `finalUrl` is correct:
   - Should be: `https://gem-backend-1094576259070.us-central1.run.app/api/v1/profiles/onboarding`

### Step 4: Test the Connection

1. Go to: https://global-empowerment-platform.vercel.app/onboarding
2. Fill out the profile form
3. Click "Continue"
4. Check browser console for any errors
5. The request should now succeed

## Troubleshooting

### If still getting connection errors:

1. **Check CORS:**
   - Backend CORS is already configured to allow `https://global-empowerment-platform.vercel.app`
   - If you changed the Vercel domain, update backend CORS in `backend/app/main.py`

2. **Check Backend Logs:**
   - Go to Google Cloud Console
   - Check Cloud Run service logs
   - Look for incoming requests

3. **Verify Environment Variable:**
   - In Vercel, make sure the variable is set for the correct environment (Production)
   - Variable name must be exactly: `NEXT_PUBLIC_API_URL`
   - Value must NOT have trailing slash or `/api/v1`

4. **Test Backend Directly:**
   ```bash
   curl -X POST https://gem-backend-1094576259070.us-central1.run.app/api/v1/profiles/onboarding \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{"user_id":"test","first_name":"Test"}'
   ```

## Code Changes Made

✅ Updated `onboardingService.ts` to:
- Use `NEXT_PUBLIC_API_URL` environment variable (highest priority)
- Fall back to `getBackendUrl()` if env var not set
- Properly construct URL: `${baseUrl}/api/v1/profiles/onboarding`
- Added logging to debug URL construction

✅ Backend CORS already configured for:
- `https://global-empowerment-platform.vercel.app`
- `http://localhost:3000`

## Next Steps

1. ✅ Set `NEXT_PUBLIC_API_URL` in Vercel
2. ✅ Redeploy frontend
3. ✅ Test onboarding flow
4. ✅ Verify backend is running and accessible

