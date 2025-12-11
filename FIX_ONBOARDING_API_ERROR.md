# Fix Onboarding API Connection Error

## Problem
When clicking "Continue" during onboarding, you get:
```
Failed to save: Failed to connect to https://gem-backend-1094576259070.us-central1.run.app/api/v1/profiles/onboarding
```

## Solutions

### Solution 1: Set API URL in Vercel (Quick Fix)

1. Go to Vercel: https://vercel.com/preston-s-projects/global-empowerment-platform/settings/environment-variables
2. Add environment variable:
   - **Name:** `NEXT_PUBLIC_API_URL`
   - **Value:** `https://gem-backend-1094576259070.us-central1.run.app`
   - **Environment:** Production (and Preview if needed)
3. **Redeploy** your application

### Solution 2: Deploy/Verify Backend is Running

The backend might not be deployed or might be down. Check:

1. **Test backend health:**
   ```bash
   curl https://gem-backend-1094576259070.us-central1.run.app/health
   ```
   
   If this fails, the backend isn't running.

2. **Deploy the backend:**
   ```bash
   cd backend
   ./deploy-gem-backend.sh
   ```

### Solution 3: Update CORS (Already Fixed)

I've already updated the backend CORS configuration to include:
- `https://global-empowerment-platform.vercel.app`
- `https://global-empowerment-platform-*.vercel.app`

**You need to redeploy the backend** for these CORS changes to take effect.

## Quick Steps to Fix Right Now

1. **Set Vercel environment variable:**
   - Go to: https://vercel.com/preston-s-projects/global-empowerment-platform/settings/environment-variables
   - Add: `NEXT_PUBLIC_API_URL` = `https://gem-backend-1094576259070.us-central1.run.app`
   - Redeploy

2. **Check if backend is running:**
   - Visit: https://gem-backend-1094576259070.us-central1.run.app/health
   - Should return: `{"status":"healthy",...}`

3. **If backend is down, deploy it:**
   ```bash
   cd backend
   ./deploy-gem-backend.sh
   ```

4. **After backend is deployed, redeploy frontend** to pick up CORS changes

## Testing

After fixing:
1. Go to: https://global-empowerment-platform.vercel.app/onboarding
2. Fill out the form
3. Click "Continue"
4. Should save successfully without errors
