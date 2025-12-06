#!/bin/bash

# Setup environment variables for Accorria Frontend

echo "🚀 Setting up Accorria Frontend Environment Variables"

# Create .env.local file
cat > .env.local << EOF
# Backend API Configuration
# Cloud Run backend URL
NEXT_PUBLIC_API_URL=https://accorria-backend-19949436301.us-central1.run.app

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Supabase Configuration (you'll need to fill these in)
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-URL.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...YOUR-ANON-KEY

# OpenAI API Key for Accorria Chatbot
OPENAI_API_KEY=your_openai_api_key_here
EOF

echo "✅ Created .env.local file"
echo "📝 Please update the Supabase and OpenAI API keys in .env.local"
echo "🔗 Backend URL set to: https://accorria-backend-19949436301.us-central1.run.app"
