#!/bin/bash
# Clean git history to remove token - simpler approach

cd /home/eaton/code/GEP

echo "🧹 Cleaning git history to remove token..."
echo "=========================================="
echo ""
echo "This will:"
echo "1. Remove the token from all commits in history"
echo "2. Rewrite the git history"
echo ""
echo "⚠️  WARNING: This rewrites history. Make sure no one else has pushed!"
echo ""

# The token to remove
TOKEN="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"

# Use git filter-branch to replace token with placeholder in all files
echo "📝 Replacing token in git history..."
git filter-branch --force --tree-filter "
    find . -type f -name '*.sh' -exec sed -i 's|${TOKEN}|REDACTED_TOKEN|g' {} + 2>/dev/null || true
" --prune-empty --tag-name-filter cat -- --all

# Clean up backup refs
echo ""
echo "🧹 Cleaning up backup refs..."
git for-each-ref --format="%(refname)" refs/original/ | xargs -n 1 git update-ref -d 2>/dev/null || true

# Expire reflog and garbage collect
echo "🗑️  Running garbage collection..."
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo ""
echo "✅ History cleaned!"
echo ""
echo "📝 Now you can push:"
echo "   git push --force-with-lease origin main"
echo ""
echo "⚠️  If others have cloned, they'll need to:"
echo "   git fetch origin"
echo "   git reset --hard origin/main"
