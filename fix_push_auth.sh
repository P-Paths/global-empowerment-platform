#!/bin/bash
# Fix GitHub authentication for pushing

cd /home/eaton/code/GEP

echo "🔧 Fixing GitHub Authentication"
echo "==============================="
echo ""

# Check GitHub CLI auth
echo "1. Checking GitHub CLI authentication..."
gh auth status
echo ""

# Setup git to use GitHub CLI
echo "2. Configuring git to use GitHub CLI..."
gh auth setup-git
echo ""

# Clean remote URL (no embedded credentials)
echo "3. Setting clean remote URL..."
git remote set-url origin https://github.com/P-Paths/global-empowerment-platform.git
echo "✅ Remote URL set"
echo ""

# Verify remote
echo "4. Verifying remote configuration..."
git remote -v
echo ""

# Check git credential helper
echo "5. Checking git credential helper..."
git config --global --get credential.helper
echo ""

# Try to push
echo "6. Attempting to push..."
echo ""
git push origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Push successful!"
else
    echo ""
    echo "❌ Push failed. Trying alternative method..."
    echo ""
    echo "If this still fails, try:"
    echo "  gh auth refresh -s write:pack"
    echo "  git push origin main"
fi
