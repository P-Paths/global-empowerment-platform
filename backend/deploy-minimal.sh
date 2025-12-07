#!/bin/bash

# Minimal Accorria Backend Deployment
# Simple deployment without complex build

echo "🚀 ACCORRIA BACKEND - MINIMAL DEPLOYMENT"
echo "========================================"

# Set project
PROJECT_ID="accorria-beta"
REGION="us-central1"
SERVICE_NAME="accorria-backend"

echo "📦 Deploying to project: $PROJECT_ID"
echo "🌍 Region: $REGION"
echo "🔧 Service: $SERVICE_NAME"

# Deploy to Cloud Run with minimal configuration
gcloud run deploy $SERVICE_NAME \
    --source . \
    --platform managed \
    --region $REGION \
    --project $PROJECT_ID \
    --allow-unauthenticated \
    --memory 1Gi \
    --cpu 1 \
    --timeout 300 \
    --port 8000 \
    --quiet

echo "✅ Deployment complete!"
echo "🌐 Service URL: https://$SERVICE_NAME-$(gcloud config get-value project).$REGION.run.app"
echo "📊 Monitor: https://console.cloud.google.com/run/detail/$REGION/$SERVICE_NAME?project=$PROJECT_ID"
