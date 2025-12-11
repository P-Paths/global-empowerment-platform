#!/bin/bash
# Fix git history to remove token

cd /home/eaton/code/GEP

TOKEN="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"

echo "🧹 Removing token from git history..."
echo ""

# Replace token in all commits using git filter-branch
git filter-branch --force --tree-filter "
    if [ -f push_all.sh ]; then sed -i 's|${TOKEN}|REDACTED|g' push_all.sh; fi
    if [ -f setup_github_auth.sh ]; then sed -i 's|${TOKEN}|REDACTED|g' setup_github_auth.sh; fi
    if [ -f push_now.sh ]; then sed -i 's|${TOKEN}|REDACTED|g' push_now.sh; fi
    if [ -f configure_token.sh ]; then sed -i 's|${TOKEN}|REDACTED|g' configure_token.sh; fi
" --prune-empty --tag-name-filter cat -- --all

# Clean up
git for-each-ref --format="%(refname)" refs/original/ | xargs -n 1 git update-ref -d 2>/dev/null || true
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo "✅ Done! Now push with: git push --force-with-lease origin main"
