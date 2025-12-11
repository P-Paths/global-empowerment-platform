#!/bin/bash
# Push changes to GitHub repository

cd /home/eaton/code/GEP

echo "📋 Checking git status..."
git status

echo ""
echo "📦 Adding all changes..."
git add -A

echo ""
echo "📝 Files to be committed:"
git status --short

echo ""
echo "💾 Committing changes..."
git commit -m "Fix onboarding profile creation error handling and add GEP confirmation email template

- Fixed empty error object handling in ensureProfileExists()
- Made profile creation non-blocking (backend API handles it)
- Improved error logging (info/warning instead of errors for expected cases)
- Added GEP-branded confirmation email template with navy/gold colors"

echo ""
echo "🚀 Pushing to GitHub..."
git push origin main

echo ""
echo "✅ Done! Changes pushed to GitHub."
