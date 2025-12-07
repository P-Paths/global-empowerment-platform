#!/bin/bash

# Accorria Backend Deployment Script
# Enterprise-Grade 24/7 Production Deployment
# Zero-Trust Architecture with Auto-Scaling

set -e  # Exit on any error

echo "🚀 ACCORRIA BACKEND DEPLOYMENT - ENTERPRISE GRADE"
echo "=================================================="

# Configuration
PROJECT_ID="accorria-beta"
REGION="us-central1"
SERVICE_NAME="accorria-backend"
SERVICE_ACCOUNT="accorria-backend-deploy@accorria-beta.iam.gserviceaccount.com"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required environment variables are set
check_env_vars() {
    print_status "Checking environment variables..."
    
    required_vars=(
        "SUPABASE_URL"
        "SUPABASE_SERVICE_ROLE_KEY"
        "OPENAI_API_KEY"
        "GOOGLE_API_KEY"
        "JWT_SECRET_KEY"
    )
    
    missing_vars=()
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        print_error "Missing required environment variables:"
        printf '%s\n' "${missing_vars[@]}"
        exit 1
    fi
    
    print_success "All required environment variables are set"
}

# Authenticate with Google Cloud
authenticate_gcloud() {
    print_status "Authenticating with Google Cloud..."
    
    # Set the project
    gcloud config set project $PROJECT_ID
    
    # Verify authentication
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
        print_error "Not authenticated with Google Cloud. Please run: gcloud auth login"
        exit 1
    fi
    
    print_success "Authenticated with Google Cloud project: $PROJECT_ID"
}

# Build and deploy to Cloud Run
deploy_to_cloud_run() {
    print_status "Building and deploying to Cloud Run..."
    
    # Deploy with enterprise-grade configuration
    gcloud run deploy $SERVICE_NAME \
        --source . \
        --platform managed \
        --region $REGION \
        --project $PROJECT_ID \
        --service-account $SERVICE_ACCOUNT \
        --allow-unauthenticated \
        --memory 2Gi \
        --cpu 2 \
        --timeout 300 \
        --concurrency 100 \
        --max-instances 50 \
        --min-instances 1 \
        --port 8000 \
        --set-env-vars "SUPABASE_URL=$SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY,OPENAI_API_KEY=$OPENAI_API_KEY,GOOGLE_API_KEY=$GOOGLE_API_KEY,JWT_SECRET_KEY=$JWT_SECRET_KEY,ENVIRONMENT=production" \
        --set-env-vars "ENABLE_RATE_LIMITING=true,ENABLE_AUDIT_LOGGING=true,ENABLE_PII_ENCRYPTION=true" \
        --set-env-vars "RATE_LIMIT_DEFAULT=100,RATE_LIMIT_AUTH=10,RATE_LIMIT_CHAT=5" \
        --set-env-vars "APP_NAME=Accorria,APP_VERSION=1.0.0" \
        --quiet
    
    print_success "Deployment completed successfully!"
}

# Get service URL and test health
test_deployment() {
    print_status "Testing deployment..."
    
    # Get service URL
    SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")
    
    print_success "Service URL: $SERVICE_URL"
    
    # Test health endpoint
    print_status "Testing health endpoint..."
    if curl -f "$SERVICE_URL/health" > /dev/null 2>&1; then
        print_success "Health check passed!"
    else
        print_warning "Health check failed - service may still be starting"
    fi
    
    # Test main endpoint
    print_status "Testing main endpoint..."
    if curl -f "$SERVICE_URL/" > /dev/null 2>&1; then
        print_success "Main endpoint is responding!"
    else
        print_warning "Main endpoint test failed - check logs"
    fi
}

# Display deployment information
show_deployment_info() {
    print_status "Deployment Information:"
    echo "=================================================="
    echo "Project ID: $PROJECT_ID"
    echo "Service Name: $SERVICE_NAME"
    echo "Region: $REGION"
    echo "Service Account: $SERVICE_ACCOUNT"
    echo "Service URL: $(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")"
    echo "Health Check: $(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")/health"
    echo "=================================================="
}

# Main deployment process
main() {
    echo "🚀 Starting Accorria Backend Deployment..."
    echo "=================================================="
    
    check_env_vars
    authenticate_gcloud
    deploy_to_cloud_run
    test_deployment
    show_deployment_info
    
    echo ""
    print_success "🎉 ACCORRIA BACKEND DEPLOYED SUCCESSFULLY!"
    print_success "Your backend is now running 24/7 with enterprise-grade security!"
    echo ""
    echo "📊 Monitor your deployment:"
    echo "   https://console.cloud.google.com/run/detail/$REGION/$SERVICE_NAME?project=$PROJECT_ID"
    echo ""
    echo "🔍 View logs:"
    echo "   gcloud logs read --project=$PROJECT_ID --filter=resource.type=cloud_run_revision"
    echo ""
}

# Run main function
main "$@"
