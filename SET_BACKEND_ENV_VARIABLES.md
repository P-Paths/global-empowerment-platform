# Set Backend Environment Variables in Cloud Run

## Problem
Getting `HTTP 401: Unauthorized` because the backend can't validate JWT tokens without `SUPABASE_JWT_SECRET`.

## Solution: Set Environment Variables in Cloud Run

### Step 1: Go to Cloud Run Console
1. Open: https://console.cloud.google.com/run/detail/us-central1/gem-backend?project=gem-platform-480517
2. Click **"Edit & Deploy New Revision"** button (top right)

### Step 2: Go to Variables & Secrets Tab
1. Click on **"Variables & Secrets"** tab
2. Under **"Environment Variables"**, click **"Add Variable"**

### Step 3: Add These Required Variables

Add each of these one by one:

#### 1. SUPABASE_JWT_SECRET (CRITICAL - fixes 401 error)
- **Name:** `SUPABASE_JWT_SECRET`
- **Value:** `qQtYmpyZ+Zioc+1XDrkW05x/AfrZTKnF0SNaiRCCdA7t5AmmZ0QptsaUMNhe8PL+rwU7UUhf+1n297nVxpvVIA==`
- **Description:** JWT secret for validating Supabase tokens

#### 2. SUPABASE_URL
- **Name:** `SUPABASE_URL`
- **Value:** `https://pbjwtmfbhaibnxganxdh.supabase.co`

#### 3. SUPABASE_SERVICE_ROLE_KEY
- **Name:** `SUPABASE_SERVICE_ROLE_KEY`
- **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiand0bWZiaGFpYm54Z2FueGRoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTEyMjM4OCwiZXhwIjoyMDgwNjk4Mzg4fQ.baMFWBAvUyMqN2ObFvaE4nQ73ljil4xNgkcOvDLDZHA`

#### 4. OPENAI_API_KEY (if you have one)
- **Name:** `OPENAI_API_KEY`
- **Value:** `[YOUR_OPENAI_API_KEY]`

#### 5. GEMINI_API_KEY (if you have one)
- **Name:** `GEMINI_API_KEY`
- **Value:** `AIzaSyCQvuK8YGEur6XZxTJO5Z01cEZBfCg-zcg` (or your key)

#### 6. DATABASE_URL (optional - if using direct DB connection)
- **Name:** `DATABASE_URL`
- **Value:** `postgresql://postgres:GlobalEMP2024%24@db.pbjwtmfbhaibnxganxdh.supabase.co:5432/postgres`
- **Note:** The `%24` is URL-encoded `$` sign

### Step 4: Deploy
1. Scroll down and click **"Deploy"** button
2. Wait for deployment to complete (1-2 minutes)

### Step 5: Test
After deployment, test the health endpoint:
```bash
curl https://gem-backend-1094576259070.us-central1.run.app/health
```

Then test onboarding - the 401 error should be fixed!

## Quick Copy-Paste Values

If you want to set them all at once via command line:

```bash
gcloud run services update gem-backend \
  --region us-central1 \
  --project gem-platform-480517 \
  --update-env-vars \
    SUPABASE_JWT_SECRET="qQtYmpyZ+Zioc+1XDrkW05x/AfrZTKnF0SNaiRCCdA7t5AmmZ0QptsaUMNhe8PL+rwU7UUhf+1n297nVxpvVIA==",\
    SUPABASE_URL="https://pbjwtmfbhaibnxganxdh.supabase.co",\
    SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiand0bWZiaGFpYm54Z2FueGRoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTEyMjM4OCwiZXhwIjoyMDgwNjk4Mzg4fQ.baMFWBAvUyMqN2ObFvaE4nQ73ljil4xNgkcOvDLDZHA"
```

## Why This Fixes the 401 Error

The backend uses `SUPABASE_JWT_SECRET` to validate JWT tokens from Supabase. Without it:
- Backend can't verify tokens
- All authenticated requests get 401 Unauthorized
- Onboarding can't save data

With it set:
- Backend validates tokens correctly
- Authenticated requests work
- Onboarding saves successfully

