#!/bin/bash

# Minimal deployment script to fix the container startup issue
set -e

echo "🚀 ACCORRIA BACKEND - MINIMAL DEPLOYMENT FIX"
echo "============================================="

# Set project
gcloud config set project accorria-beta

# Deploy with minimal configuration
gcloud run deploy accorria-backend \
    --source . \
    --region us-central1 \
    --platform managed \
    --allow-unauthenticated \
    --port 8000 \
    --timeout 300 \
    --memory 1Gi \
    --cpu 1 \
    --max-instances 10 \
    --min-instances 0 \
    --set-env-vars "ENVIRONMENT=production,DEBUG=false" \
    --quiet

echo "✅ Minimal deployment complete!"
echo "🌐 Service URL: https://accorria-backend-accorria-beta.us-central1.run.app"
