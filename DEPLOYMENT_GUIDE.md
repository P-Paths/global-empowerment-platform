# Deployment Guide - Backend Fix for Onboarding Authorization

## Problem Fixed
The backend was rejecting onboarding profile updates with "Not authorized to update this profile" error in development mode. This has been fixed in `backend/app/api/v1/profiles.py`.

## Project Information
- **Google Cloud Project ID:** `gem-platform-480517`
- **Project Display Name:** GEM Platform
- **Backend Service:** ⚠️ **NEEDS CONFIRMATION** - Currently references `accorria-backend-beta` but should be GEM Platform service
- **Region:** `us-central1`

## ⚠️ Important: Backend Service Name
The deployment scripts currently reference "Accorria" backend, but this is GEM Platform. We need to:
1. **Option A:** Create a new `gem-backend` or `gep-backend` service in `gem-platform-480517`
2. **Option B:** Use existing Accorria backend if it's shared
3. **Option C:** Update all references to use correct GEM Platform backend service name

## Deployment Options

### Option 1: Deploy via Google Cloud Console (Easiest - No CLI needed)

1. **Open Cloud Run Console:**
   - Go to: https://console.cloud.google.com/run?project=gem-platform-480517
   - Or navigate: Cloud Run → Services → Select your backend service

2. **Deploy New Revision:**
   - Click on your service (`accorria-backend-beta` or `accorria-backend`)
   - Click "EDIT & DEPLOY NEW REVISION"
   - Under "Source", you can:
     - **Option A:** Use Cloud Build (if connected to GitHub)
     - **Option B:** Upload code directly
     - **Option C:** Use existing container image

3. **If using Cloud Build:**
   - Make sure your code is pushed to GitHub
   - Cloud Build will automatically build and deploy

4. **Verify Environment Variables:**
   - Ensure these are set in Cloud Run:
     - `SUPABASE_URL`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `SUPABASE_JWT_SECRET` (IMPORTANT - this fixes the auth issue)
     - `OPENAI_API_KEY`
     - `GEMINI_API_KEY` (or `GOOGLE_API_KEY`)
     - `DATABASE_URL`

5. **Deploy:**
   - Click "DEPLOY"
   - Wait for deployment to complete

### Option 2: Deploy via gcloud CLI

1. **Install gcloud CLI:**
   ```bash
   sudo apt-get update
   sudo apt-get install -y google-cloud-cli
   ```

2. **Authenticate:**
   ```bash
   gcloud auth login
   gcloud config set project gem-platform-480517
   ```

3. **Deploy from backend directory:**
   ```bash
   cd backend
   gcloud run deploy accorria-backend-beta \
     --source . \
     --platform managed \
     --region us-central1 \
     --project gem-platform-480517 \
     --allow-unauthenticated \
     --memory 2Gi \
     --cpu 2 \
     --timeout 300 \
     --port 8000
   ```

### Option 3: Deploy via Deployment Script

1. **Make script executable:**
   ```bash
   chmod +x backend/deploy-simple-accorria.sh
   ```

2. **Run deployment:**
   ```bash
   cd backend
   ./deploy-simple-accorria.sh
   ```

## Important: Set SUPABASE_JWT_SECRET

The fix requires `SUPABASE_JWT_SECRET` to be set in production. Without it, the backend will use mock authentication which causes the authorization error.

**To set in Cloud Console:**
1. Go to Cloud Run → Your Service → Edit
2. Go to "Variables & Secrets" tab
3. Add environment variable:
   - Name: `SUPABASE_JWT_SECRET`
   - Value: (from your backend/.env file)

**To set via CLI:**
```bash
gcloud run services update accorria-backend-beta \
  --update-env-vars SUPABASE_JWT_SECRET=your-secret-here \
  --region us-central1 \
  --project gem-platform-480517
```

## Verify Deployment

After deployment, test the onboarding endpoint:

```bash
# Get your service URL
SERVICE_URL=$(gcloud run services describe accorria-backend-beta \
  --region us-central1 \
  --project gem-platform-480517 \
  --format 'value(status.url)')

# Test health endpoint
curl $SERVICE_URL/health

# Test onboarding endpoint (with auth token)
curl -X POST $SERVICE_URL/api/v1/profiles/onboarding \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test-user-id", "first_name": "Test"}'
```

## Frontend Configuration

Make sure your frontend is pointing to the production backend:

1. **Check `frontend/src/config/api.ts`:**
   - Should use: `https://accorria-backend-beta-19949436301.us-central1.run.app`
   - Or set `NEXT_PUBLIC_API_URL` environment variable in Vercel

2. **Vercel Environment Variables:**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Set: `NEXT_PUBLIC_API_URL=https://accorria-backend-beta-19949436301.us-central1.run.app`

## Troubleshooting

### Error: "Not authorized to update this profile"
- **Cause:** `SUPABASE_JWT_SECRET` not set in Cloud Run
- **Fix:** Add `SUPABASE_JWT_SECRET` environment variable to Cloud Run service

### Error: "Service not found"
- **Cause:** Wrong service name or project
- **Fix:** List services: `gcloud run services list --project gem-platform-480517`

### Error: "Permission denied"
- **Cause:** Not authenticated or wrong project
- **Fix:** Run `gcloud auth login` and `gcloud config set project gem-platform-480517`

## Next Steps

1. Deploy backend with the fix
2. Verify `SUPABASE_JWT_SECRET` is set
3. Test onboarding flow on production
4. Update frontend to use production backend (if not already)
5. Test end-to-end on Vercel deployment

