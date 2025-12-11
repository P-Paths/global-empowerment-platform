#!/bin/bash

# GEM Platform Backend Deployment Script
# Deploys to gem-platform-480517 project

echo "🚀 GEM PLATFORM BACKEND - DEPLOYMENT"
echo "======================================"

# Set project - GEM Platform project
PROJECT_ID="gem-platform-480517"
REGION="us-central1"
SERVICE_NAME="gem-backend"

echo "📦 Deploying to project: $PROJECT_ID"
echo "🌍 Region: $REGION"
echo "🔧 Service: $SERVICE_NAME"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI not found. Please install it first:"
    echo "   sudo apt-get install -y google-cloud-cli"
    exit 1
fi

# Authenticate if needed
echo "🔐 Checking authentication..."
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "⚠️  Not authenticated. Please run:"
    echo "   gcloud auth login"
    exit 1
fi

# Set the project
echo "📋 Setting project to $PROJECT_ID..."
gcloud config set project $PROJECT_ID

# Deploy to Cloud Run
echo ""
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
    --source . \
    --platform managed \
    --region $REGION \
    --project $PROJECT_ID \
    --allow-unauthenticated \
    --memory 2Gi \
    --cpu 2 \
    --timeout 300 \
    --concurrency 100 \
    --max-instances 50 \
    --min-instances 1 \
    --port 8000 \
    --quiet

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
    --region $REGION \
    --project $PROJECT_ID \
    --format 'value(status.url)' 2>/dev/null)

echo ""
echo "✅ Deployment complete!"
if [ ! -z "$SERVICE_URL" ]; then
    echo "🌐 Service URL: $SERVICE_URL"
    echo "📊 Monitor: https://console.cloud.google.com/run/detail/$REGION/$SERVICE_NAME?project=$PROJECT_ID"
    echo ""
    echo "⚠️  IMPORTANT: Set environment variables in Cloud Console:"
    echo "   - SUPABASE_URL"
    echo "   - SUPABASE_SERVICE_ROLE_KEY"
    echo "   - SUPABASE_JWT_SECRET (required for auth fix)"
    echo "   - OPENAI_API_KEY"
    echo "   - GEMINI_API_KEY"
    echo "   - DATABASE_URL"
else
    echo "⚠️  Could not retrieve service URL. Check Cloud Console."
fi

