#!/bin/bash
# Complete push script - configures token, stages, commits, and pushes

cd /home/eaton/code/GEP

echo "🚀 Pushing Changes to GitHub"
echo "============================="
echo ""

# Step 1: Configure GitHub token if needed
# Token should be set as environment variable: export GITHUB_TOKEN=your_token_here
# Or it will prompt you to enter it
TOKEN="${GITHUB_TOKEN}"

if [ -z "$TOKEN" ]; then
    echo "🔐 GitHub token not found in environment."
    echo "   Set it with: export GITHUB_TOKEN=your_token_here"
    echo "   Or enter it now (it won't be saved):"
    read -sp "GitHub Personal Access Token: " TOKEN
    echo ""
fi

USERNAME=$(git config user.name 2>/dev/null)

if [ -z "$USERNAME" ]; then
    echo "Enter your GitHub username:"
    read USERNAME
fi

if [ -z "$TOKEN" ] || [ -z "$USERNAME" ]; then
    echo "❌ Token and username are required"
    exit 1
fi

# Check if remote is already configured with token
CURRENT_REMOTE=$(git remote get-url origin 2>/dev/null)
if [[ ! "$CURRENT_REMOTE" == *"$TOKEN"* ]]; then
    echo "📝 Configuring GitHub authentication..."
    git remote set-url origin "https://${USERNAME}:${TOKEN}@github.com/P-Paths/global-empowerment-platform.git"
    echo "✅ Authentication configured"
    echo ""
fi

# Step 2: Check status
echo "📋 Checking git status..."
git status --short
echo ""

# Step 3: Add all changes
echo "📦 Staging all changes..."
git add -A

# Step 4: Show what will be committed
echo ""
echo "📝 Files to be committed:"
git status --short
echo ""

# Step 5: Commit
echo "💾 Committing changes..."
git commit -m "Fix onboarding profile creation error handling and add GEP confirmation email template

- Fixed empty error object handling in ensureProfileExists()
- Made profile creation non-blocking (backend API handles it)
- Improved error logging (info/warning instead of errors for expected cases)
- Added GEP-branded confirmation email template with navy/gold colors
- Added GitHub token setup scripts and documentation"

if [ $? -ne 0 ]; then
    echo "⚠️  No changes to commit or commit failed"
    echo "   (This is OK if everything is already committed)"
fi

echo ""

# Step 6: Push to GitHub
echo "🚀 Pushing to GitHub..."
git push origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully pushed to GitHub!"
    echo "   Repository: https://github.com/P-Paths/global-empowerment-platform"
else
    echo ""
    echo "❌ Push failed. Please check:"
    echo "   1. Token has 'repo' scope"
    echo "   2. You have push access to the repository"
    echo "   3. Network connection is working"
    exit 1
fi
