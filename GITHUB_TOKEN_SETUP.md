# GitHub Token Setup Guide

## Creating a Personal Access Token

1. **Go to GitHub Settings**
   - Visit: https://github.com/settings/tokens
   - Or: Profile Picture → Settings → Developer settings → Personal access tokens → Tokens (classic)

2. **Generate New Token (Classic)**
   - Click "Generate new token" → "Generate new token (classic)"
   - Give it a descriptive name: `GEP Repository Access`
   - Set expiration (recommended: 90 days or custom)
   - **Select scopes:**
     - ✅ `repo` - Full control of private repositories
       - This includes: repo:status, repo_deployment, public_repo, repo:invite, security_events

3. **Generate and Copy**
   - Click "Generate token"
   - **IMPORTANT:** Copy the token immediately - you won't see it again!
   - Store it securely (password manager recommended)

## Using the Token

### Option 1: Configure Remote URL (Easiest)

```bash
cd /home/eaton/code/GEP

# Replace YOUR_USERNAME and YOUR_TOKEN with your actual values
git remote set-url origin https://YOUR_USERNAME:YOUR_TOKEN@github.com/P-Paths/global-empowerment-platform.git

# Verify
git remote -v
```

### Option 2: Use Git Credential Helper

```bash
# Configure credential helper
git config --global credential.helper store

# When you push, git will prompt:
# Username: your_github_username
# Password: paste_your_token_here (not your GitHub password!)
```

### Option 3: Environment Variable (Most Secure)

```bash
# Add to ~/.bashrc or ~/.zshrc
export GITHUB_TOKEN=your_token_here

# Then use in remote URL
git remote set-url origin https://$GITHUB_TOKEN@github.com/P-Paths/global-empowerment-platform.git
```

### Option 4: Use the Setup Script

```bash
chmod +x setup_github_token.sh
./setup_github_token.sh
```

## Testing the Token

```bash
cd /home/eaton/code/GEP

# Test authentication
git fetch origin

# If successful, you're all set!
```

## Security Best Practices

1. ✅ **Never commit tokens to git** - Add `.env` and token files to `.gitignore`
2. ✅ **Use token expiration** - Set tokens to expire after a reasonable time
3. ✅ **Use fine-grained tokens** (if available) - Only grant minimum required permissions
4. ✅ **Store tokens securely** - Use password managers, not plain text files
5. ✅ **Rotate tokens regularly** - Delete old tokens when creating new ones

## Troubleshooting

### "Authentication failed"
- Verify token has `repo` scope
- Check token hasn't expired
- Ensure username is correct

### "Permission denied"
- Verify you have push access to the repository
- Check token has correct scopes

### "Repository not found"
- Verify repository URL is correct
- Check you have access to the repository

## Quick Reference

**Repository URL:** `https://github.com/P-Paths/global-empowerment-platform.git`

**Token Creation:** https://github.com/settings/tokens

**Required Scope:** `repo` (full control of private repositories)
