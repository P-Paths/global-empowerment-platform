# Fix Backend Deployment - Wrong Service Deployed

## Problem
The backend at `https://gem-backend-1094576259070.us-central1.run.app` is returning "Accorria API" instead of "Global Empowerment Platform Backend". This means the **wrong backend** is deployed.

## Solution: Redeploy GEP Backend

### Step 1: Make sure you're in the right project
```bash
cd backend
gcloud config set project gem-platform-480517
```

### Step 2: Deploy the GEP backend
```bash
chmod +x deploy-gem-backend.sh
./deploy-gem-backend.sh
```

This will:
- Deploy to the correct project: `gem-platform-480517`
- Deploy the correct service: `gem-backend`
- Use the GEP backend code (not Accorria)

### Step 3: Verify the deployment
After deployment, test the health endpoint:
```bash
curl https://gem-backend-1094576259070.us-central1.run.app/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "service": "Global Empowerment Platform Backend",
  "version": "1.0.0",
  "timestamp": "2025-12-12T..."
}
```

**NOT:**
```json
{
  "message": "Accorria API",
  "version": "1.0.0",
  "status": "healthy"
}
```

### Step 4: Set environment variables in Cloud Run
After deployment, go to Google Cloud Console and set these environment variables for the `gem-backend` service:

1. Go to: https://console.cloud.google.com/run/detail/us-central1/gem-backend?project=gem-platform-480517
2. Click "Edit & Deploy New Revision"
3. Go to "Variables & Secrets" tab
4. Add/Update these variables:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_JWT_SECRET`
   - `OPENAI_API_KEY`
   - `GEMINI_API_KEY`
   - `DATABASE_URL` (if needed)

### Step 5: Verify it's working
1. Test health endpoint - should show "Global Empowerment Platform Backend"
2. Test onboarding API - should connect successfully
3. Check frontend - onboarding should work

## Why This Happened
The Accorria backend was deployed instead of the GEP backend. This can happen if:
- Wrong deployment script was used (`deploy-accorria.sh` instead of `deploy-gem-backend.sh`)
- Wrong project was selected in gcloud
- Environment variables were set to Accorria values

## Prevention
Always use:
- ✅ `deploy-gem-backend.sh` for GEP/GEM Platform
- ❌ `deploy-accorria.sh` for Accorria (different project)

