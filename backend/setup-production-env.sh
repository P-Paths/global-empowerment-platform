#!/bin/bash

# Accorria Production Environment Setup
# Secure configuration for 24/7 production deployment

set -e

echo "🔒 ACCORRIA PRODUCTION ENVIRONMENT SETUP"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Function to securely prompt for input
secure_input() {
    local prompt="$1"
    local var_name="$2"
    local is_secret="$3"
    
    if [ "$is_secret" = "true" ]; then
        echo -n "$prompt: "
        read -s value
        echo
    else
        echo -n "$prompt: "
        read value
    fi
    
    export "$var_name=$value"
}

# Function to validate URL
validate_url() {
    local url="$1"
    if [[ $url =~ ^https?:// ]]; then
        return 0
    else
        return 1
    fi
}

# Function to generate secure JWT secret
generate_jwt_secret() {
    openssl rand -base64 64
}

# Main setup process
main() {
    print_status "Setting up Accorria production environment..."
    
    echo ""
    print_status "Please provide the following information:"
    echo ""
    
    # Supabase Configuration
    print_status "SUPABASE CONFIGURATION"
    echo "------------------------"
    secure_input "Supabase URL (e.g., https://your-project.supabase.co)" "SUPABASE_URL" "false"
    
    if ! validate_url "$SUPABASE_URL"; then
        print_error "Invalid Supabase URL. Must start with http:// or https://"
        exit 1
    fi
    
    secure_input "Supabase Service Role Key" "SUPABASE_SERVICE_ROLE_KEY" "true"
    
    if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
        print_error "Supabase Service Role Key is required"
        exit 1
    fi
    
    echo ""
    
    # OpenAI Configuration
    print_status "OPENAI CONFIGURATION"
    echo "----------------------"
    secure_input "OpenAI API Key" "OPENAI_API_KEY" "true"
    
    if [ -z "$OPENAI_API_KEY" ]; then
        print_error "OpenAI API Key is required"
        exit 1
    fi
    
    echo ""
    
    # Google Configuration
    print_status "GOOGLE CONFIGURATION"
    echo "----------------------"
    secure_input "Google API Key (for Maps, etc.)" "GOOGLE_API_KEY" "true"
    
    if [ -z "$GOOGLE_API_KEY" ]; then
        print_warning "Google API Key is optional but recommended"
    fi
    
    echo ""
    
    # Security Configuration
    print_status "SECURITY CONFIGURATION"
    echo "-------------------------"
    
    # Generate JWT secret if not provided
    echo -n "JWT Secret Key (press Enter to generate automatically): "
    read -s jwt_secret
    echo
    
    if [ -z "$jwt_secret" ]; then
        JWT_SECRET_KEY=$(generate_jwt_secret)
        print_success "Generated secure JWT secret"
    else
        JWT_SECRET_KEY="$jwt_secret"
    fi
    
    echo ""
    
    # Optional: SendGrid Configuration
    print_status "EMAIL CONFIGURATION (Optional)"
    echo "--------------------------------"
    echo -n "SendGrid API Key (optional, for enhanced email): "
    read -s sendgrid_key
    echo
    
    if [ -n "$sendgrid_key" ]; then
        SENDGRID_API_KEY="$sendgrid_key"
        print_success "SendGrid API Key configured"
    fi
    
    echo ""
    
    # Create environment file
    print_status "Creating production environment file..."
    
    cat > .env.production << EOF
# Accorria Production Environment
# Generated on $(date)
# DO NOT COMMIT THIS FILE TO VERSION CONTROL

# Supabase Configuration
SUPABASE_URL=$SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY

# OpenAI Configuration
OPENAI_API_KEY=$OPENAI_API_KEY

# Google Configuration
GOOGLE_API_KEY=$GOOGLE_API_KEY

# Security Configuration
JWT_SECRET_KEY=$JWT_SECRET_KEY

# Email Configuration
SENDGRID_API_KEY=$SENDGRID_API_KEY

# Application Configuration
APP_NAME=Accorria
APP_VERSION=1.0.0
ENVIRONMENT=production

# Security Features
ENABLE_RATE_LIMITING=true
ENABLE_AUDIT_LOGGING=true
ENABLE_PII_ENCRYPTION=true
ENABLE_ANOMALY_DETECTION=true

# Rate Limiting
RATE_LIMIT_DEFAULT=100
RATE_LIMIT_AUTH=10
RATE_LIMIT_CHAT=5
RATE_LIMIT_UPLOAD=20

# CORS Configuration
ALLOWED_ORIGINS=https://accorria.com,https://www.accorria.com,https://accorria.vercel.app

# Database Configuration
DATABASE_URL=$SUPABASE_URL

# Logging
LOG_LEVEL=INFO
ENABLE_STRUCTURED_LOGGING=true

# Performance
WORKERS=4
MAX_CONNECTIONS=100
TIMEOUT=300
EOF
    
    print_success "Production environment file created: .env.production"
    
    # Set file permissions
    chmod 600 .env.production
    print_success "Set secure file permissions (600)"
    
    echo ""
    print_success "🎉 PRODUCTION ENVIRONMENT SETUP COMPLETE!"
    echo ""
    print_status "Next steps:"
    echo "1. Review .env.production file"
    echo "2. Run: chmod +x deploy-accorria.sh"
    echo "3. Run: ./deploy-accorria.sh"
    echo ""
    print_warning "IMPORTANT: Keep .env.production secure and never commit it to version control!"
    echo ""
}

# Run main function
main "$@"
