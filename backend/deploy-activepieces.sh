#!/bin/bash

# Activepieces Cloud Run Deployment Script
# Usage: ./deploy-activepieces.sh

set -e

# Configuration
PROJECT_ID="accorria-beta"
SERVICE_NAME="activepieces-accorria"
REGION="us-central1"
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"

echo "🚀 Deploying Activepieces to Cloud Run"
echo "Project: $PROJECT_ID"
echo "Service: $SERVICE_NAME"
echo "Region: $REGION"
echo ""

# Check if gcloud is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "❌ Not authenticated with gcloud. Please run:"
    echo "   gcloud auth login"
    echo "   gcloud auth application-default login"
    exit 1
fi

# Set the project
echo "📋 Setting project..."
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "🔧 Enabling required APIs..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Use the existing Activepieces image directly
echo "🏗️  Using existing Activepieces image..."
IMAGE_NAME="activepieces/activepieces"

# Deploy to Cloud Run
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
    --image $IMAGE_NAME \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --port 80 \
    --memory 2Gi \
    --cpu 2 \
    --min-instances 1 \
    --max-instances 3 \
    --timeout 300 \
    --concurrency 80 \
    --set-env-vars="AP_FRONTEND_URL=https://$SERVICE_NAME-19949436301.$REGION.run.app,SUPABASE_DB_PASSWORD=Mycompany5729\$1985*" \
    --quiet

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)')

echo ""
echo "✅ Activepieces deployment successful!"
echo "🌐 Service URL: $SERVICE_URL"
echo ""
echo "📝 Next steps:"
echo "1. Update your Google Forms webhook URL to: $SERVICE_URL"
echo "2. Update your Activepieces flows to use the new URL"
echo "3. Test the automation flow"
echo ""
echo "🔧 To update environment variables:"
echo "   gcloud run services update $SERVICE_NAME --region $REGION --set-env-vars='KEY=VALUE'"
