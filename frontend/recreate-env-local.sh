#!/bin/bash

# Script to recreate .env.local from backup files
# Based on the backup files shown in the images

echo "🔧 Recreating frontend .env.local file..."

# Check for backup files
BACKUP_FILES=(
    ".env.local.bak"
    ".env.local.backup"
    "../.env.bak"
    "../backend/.env.bak"
)

BACKUP_FOUND=""
for file in "${BACKUP_FILES[@]}"; do
    if [ -f "$file" ]; then
        BACKUP_FOUND="$file"
        echo "✅ Found backup file: $file"
        break
    fi
done

# Create .env.local based on backup or template
if [ -n "$BACKUP_FOUND" ]; then
    echo "📋 Copying from backup: $BACKUP_FOUND"
    # Extract only the frontend-relevant variables
    grep -E "^(NEXT_PUBLIC_|AUTH_|OPENAI_API_KEY)" "$BACKUP_FOUND" > .env.local.tmp 2>/dev/null || true
    
    # If we got content, use it
    if [ -s .env.local.tmp ]; then
        cat .env.local.tmp > .env.local
        rm .env.local.tmp
        echo "✅ Created .env.local from backup"
    else
        # Fall back to creating from template
        echo "⚠️  Backup file found but couldn't extract values, creating from template..."
        create_from_template
    fi
else
    echo "⚠️  No backup file found, creating from template..."
    create_from_template
fi

# Function to create from template
create_from_template() {
    cat > .env.local << 'EOF'
# Supabase Configuration
# Based on your backup files - update with full values if truncated
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key-here

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Backend API Configuration
# Using local backend since it's running on port 8000
NEXT_PUBLIC_API_URL=http://localhost:8000

# Facebook OAuth2 for NextAuth
AUTH_FACEBOOK_ID=your-facebook-app-id-here
AUTH_FACEBOOK_SECRET=your-facebook-app-secret-here

# OpenAI API Key for Accorria Chatbot
OPENAI_API_KEY=your-openai-api-key-here
EOF
    echo "✅ Created .env.local from template"
    echo "⚠️  IMPORTANT: Please update the Supabase keys with your full values!"
}

# Final check
if [ -f .env.local ]; then
    echo ""
    echo "✅ .env.local file created successfully!"
    echo "📝 Location: $(pwd)/.env.local"
    echo ""
    echo "⚠️  Please verify the Supabase keys are complete (they may be truncated)"
    echo "   You can get them from: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api"
else
    echo "❌ Failed to create .env.local"
    exit 1
fi

