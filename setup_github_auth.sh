#!/bin/bash
# Quick setup script for GitHub authentication
# This script configures your GitHub token for pushing to the repository

cd /home/eaton/code/GEP

TOKEN="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"
REPO_URL="https://github.com/P-Paths/global-empowerment-platform.git"

echo "🔐 Configuring GitHub Authentication"
echo "===================================="
echo ""

# Try to get username from git config
USERNAME=$(git config user.name 2>/dev/null)

if [ -z "$USERNAME" ]; then
    echo "Git username not found in config."
    echo "Please enter your GitHub username:"
    read USERNAME
fi

if [ -z "$USERNAME" ]; then
    echo "❌ Username is required. Exiting."
    exit 1
fi

echo "Using username: $USERNAME"
echo ""

# Set remote URL with token
echo "📝 Configuring remote URL with token..."
git remote set-url origin "https://${USERNAME}:${TOKEN}@github.com/P-Paths/global-empowerment-platform.git"

if [ $? -eq 0 ]; then
    echo "✅ Remote URL configured successfully!"
    echo ""
    
    # Verify the remote
    echo "🔍 Verifying remote configuration..."
    git remote -v | grep origin
    echo ""
    
    # Test the connection (dry run)
    echo "🧪 Testing authentication..."
    if git ls-remote --heads origin main > /dev/null 2>&1; then
        echo "✅ Authentication successful!"
        echo ""
        echo "🚀 You can now push your changes with:"
        echo "   git push origin main"
    else
        echo "⚠️  Could not verify authentication. Please check:"
        echo "   1. Token has 'repo' scope"
        echo "   2. Username is correct"
        echo "   3. You have access to the repository"
    fi
else
    echo "❌ Failed to configure remote URL"
    exit 1
fi

echo ""
echo "💡 Security Note:"
echo "   - Token is stored in git config (local only)"
echo "   - Never commit this script or token to git"
echo "   - Token files are in .gitignore"
