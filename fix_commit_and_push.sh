#!/bin/bash
# Fix the commit by removing the token and push again

cd /home/eaton/code/GEP

echo "🔧 Fixing commit to remove token..."
echo ""

# Stage the updated files (without hardcoded token)
git add push_all.sh setup_github_auth.sh configure_token.sh

# Amend the previous commit
echo "📝 Amending previous commit..."
git commit --amend --no-edit

echo ""
echo "✅ Commit amended - token removed from files"
echo ""

# Show what will be pushed
echo "📋 Files in commit:"
git show --name-only --oneline HEAD
echo ""

# Push (this should work now since token is removed)
echo "🚀 Pushing to GitHub..."
git push origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully pushed to GitHub!"
    echo "   Repository: https://github.com/P-Paths/global-empowerment-platform"
else
    echo ""
    echo "❌ Push failed. You may need to force push:"
    echo "   git push --force-with-lease origin main"
    echo ""
    echo "⚠️  Only use force push if you're sure no one else has pushed changes"
fi
