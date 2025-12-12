# Fix Cloud Run Deployment Permissions

## Problem
The deployment failed with:
```
ERROR: 1094576259070-compute@developer.gserviceaccount.com does not have storage.objects.get access
```

This is a Cloud Build service account permissions issue.

## Solution 1: Grant Permissions to Cloud Build Service Account

Run these commands to fix the permissions:

```bash
# Set the project
gcloud config set project gem-platform-480517

# Get the Cloud Build service account email
PROJECT_NUMBER=$(gcloud projects describe gem-platform-480517 --format="value(projectNumber)")
CLOUD_BUILD_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"

# Grant necessary permissions
gcloud projects add-iam-policy-binding gem-platform-480517 \
    --member="serviceAccount:${CLOUD_BUILD_SA}" \
    --role="roles/storage.admin"

gcloud projects add-iam-policy-binding gem-platform-480517 \
    --member="serviceAccount:${CLOUD_BUILD_SA}" \
    --role="roles/run.admin"

gcloud projects add-iam-policy-binding gem-platform-480517 \
    --member="serviceAccount:${CLOUD_BUILD_SA}" \
    --role="roles/iam.serviceAccountUser"
```

Then try deploying again:
```bash
cd backend
./deploy-gem-backend.sh
```

## Solution 2: Use Docker Build Locally (Alternative)

If Solution 1 doesn't work, build the Docker image locally and push it:

```bash
cd backend

# Build the image
docker build -t gcr.io/gem-platform-480517/gem-backend:latest .

# Push to Google Container Registry
docker push gcr.io/gem-platform-480517/gem-backend:latest

# Deploy the image
gcloud run deploy gem-backend \
    --image gcr.io/gem-platform-480517/gem-backend:latest \
    --platform managed \
    --region us-central1 \
    --project gem-platform-480517 \
    --allow-unauthenticated \
    --memory 2Gi \
    --cpu 2 \
    --timeout 300 \
    --concurrency 100 \
    --max-instances 50 \
    --min-instances 1 \
    --port 8000
```

## Solution 3: Enable Required APIs

Make sure these APIs are enabled:

```bash
gcloud services enable cloudbuild.googleapis.com --project=gem-platform-480517
gcloud services enable run.googleapis.com --project=gem-platform-480517
gcloud services enable storage-component.googleapis.com --project=gem-platform-480517
```

## After Fixing Permissions

1. Redeploy:
   ```bash
   cd backend
   ./deploy-gem-backend.sh
   ```

2. Verify deployment:
   ```bash
   curl https://gem-backend-rozvtdo5ma-uc.a.run.app/health
   ```

   Should return:
   ```json
   {
     "status": "healthy",
     "service": "Global Empowerment Platform Backend",
     "version": "1.0.0",
     "timestamp": "..."
   }
   ```

3. Update the frontend environment variable if the URL changed:
   - The new URL is: `https://gem-backend-rozvtdo5ma-uc.a.run.app`
   - Update `NEXT_PUBLIC_API_URL` in Vercel to this new URL

