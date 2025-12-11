#!/bin/bash
# Setup GitHub authentication

cd /home/eaton/code/GEP

echo "🔐 Setting up GitHub Authentication"
echo "===================================="
echo ""

# Get token from environment or prompt
TOKEN="${GITHUB_TOKEN}"

if [ -z "$TOKEN" ]; then
    echo "GitHub token not found in environment."
    echo "Please enter your GitHub Personal Access Token:"
    echo "(You can also set it with: export GITHUB_TOKEN=your_token)"
    read -sp "Token: " TOKEN
    echo ""
fi

if [ -z "$TOKEN" ]; then
    echo "❌ Token is required"
    exit 1
fi

USERNAME="P-Paths"

echo ""
echo "📝 Configuring remote URL..."
git remote set-url origin "https://${USERNAME}:${TOKEN}@github.com/P-Paths/global-empowerment-platform.git"

echo "✅ Remote configured"
echo ""

# Test authentication
echo "🧪 Testing authentication..."
if git ls-remote --heads origin main > /dev/null 2>&1; then
    echo "✅ Authentication successful!"
    echo ""
    echo "🚀 You can now push with:"
    echo "   git push origin main"
else
    echo "❌ Authentication failed. Please check:"
    echo "   1. Token is valid and not expired"
    echo "   2. Token has 'repo' scope"
    echo "   3. You have access to the repository"
fi
