# GEM Platform vs Accorria - Separation Guide

## ✅ Projects Are Now Separate

### GEM Platform
- **Google Cloud Project:** `gem-platform-480517`
- **Backend Service:** `gem-backend`
- **Region:** `us-central1`
- **Purpose:** Global Empowerment Platform - Business incubator for entrepreneurs
- **Deployment Script:** `backend/deploy-gem-backend.sh`

### Accorria
- **Google Cloud Project:** `accorria-beta` (separate project)
- **Backend Service:** `accorria-backend` or `accorria-backend-beta`
- **Region:** `us-central1`
- **Purpose:** Car/home selling platform (separate business)
- **Deployment Script:** `backend/deploy-simple-accorria.sh` (for Accorria project only)

## 🔧 Configuration Files

### Backend Deployment
- **GEM Backend:** `backend/deploy-gem-backend.sh` → Deploys to `gem-platform-480517`
- **Accorria Backend:** `backend/deploy-simple-accorria.sh` → Deploys to `accorria-beta`

### Frontend Configuration
- **File:** `frontend/src/config/api.ts`
- **GEM Platform uses:** `GEM_BACKEND_URL` (points to `gem-backend` service)
- **Accorria uses:** `ACCORRIA_BACKEND_URL` (points to `accorria-backend` service)

## 🚀 Deploying GEM Backend

### Option 1: Using Deployment Script
```bash
cd backend
./deploy-gem-backend.sh
```

### Option 2: Using Google Cloud Console
1. Go to: https://console.cloud.google.com/run?project=gem-platform-480517
2. Click "CREATE SERVICE"
3. Service name: `gem-backend`
4. Region: `us-central1`
5. Deploy from source or container image
6. Set environment variables (see below)

### Required Environment Variables (GEM Backend)
Set these in Cloud Run after deployment:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `SUPABASE_JWT_SECRET` - **REQUIRED** for authentication (fixes onboarding error)
- `OPENAI_API_KEY` - OpenAI API key
- `GEMINI_API_KEY` - Google Gemini API key
- `DATABASE_URL` - PostgreSQL connection string

## 📝 Important Notes

1. **Never deploy GEM code to Accorria backend** - They are separate projects
2. **Never deploy Accorria code to GEM backend** - They serve different purposes
3. **Frontend config** automatically uses GEM backend for GEM Platform
4. **Environment variables** must be set separately for each backend

## 🔍 Verifying Separation

### Check GEM Backend
```bash
gcloud run services list --project gem-platform-480517
```

### Check Accorria Backend
```bash
gcloud run services list --project accorria-beta
```

## 🎯 Next Steps

1. **Deploy GEM backend** using `deploy-gem-backend.sh` or Cloud Console
2. **Update frontend config** with the actual GEM backend URL after deployment
3. **Set environment variables** in Cloud Run for GEM backend
4. **Test onboarding** to verify the authorization fix works

