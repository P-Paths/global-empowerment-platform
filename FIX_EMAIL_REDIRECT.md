# Fix Email Confirmation Redirect to Localhost

## Problem
When users click the confirmation link in their email, they're redirected to `localhost:3000` instead of the production URL.

## Solution

### Step 1: Update Vercel Environment Variables

1. Go to your Vercel project: https://vercel.com/preston-s-projects/global-empowerment-platform
2. Click **Settings** → **Environment Variables**
3. Add or update these variables:

   **For Production:**
   ```
   NEXT_PUBLIC_SITE_URL=https://global-empowerment-platform.vercel.app
   ```

   **For Preview (optional):**
   ```
   NEXT_PUBLIC_SITE_URL=https://global-empowerment-platform-git-main-preston-s-projects.vercel.app
   ```

4. **Redeploy** your application after adding the variable

### Step 2: Configure Supabase Redirect URLs

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/pbjwtmfbhaibnxganxdh
2. Navigate to **Authentication** → **URL Configuration**
3. Add these **Redirect URLs**:

   ```
   https://global-empowerment-platform.vercel.app/**
   https://global-empowerment-platform.vercel.app/auth/callback
   https://global-empowerment-platform-*.vercel.app/**
   http://localhost:3000/**
   http://localhost:3000/auth/callback
   ```

4. Set **Site URL** to:
   ```
   https://global-empowerment-platform.vercel.app
   ```

5. Click **Save**

### Step 3: Verify Configuration

After updating:
1. Wait for Vercel to redeploy (or trigger a new deployment)
2. Test by registering a new user
3. Check the confirmation email - the link should now point to the production URL

## Quick Fix Commands

If you need to update via Vercel CLI:

```bash
# Install Vercel CLI if needed
npm i -g vercel

# Login
vercel login

# Set environment variable
vercel env add NEXT_PUBLIC_SITE_URL production
# When prompted, enter: https://global-empowerment-platform.vercel.app

# Redeploy
vercel --prod
```

## Current Production URL

Based on your Vercel deployment:
- **Main URL:** `https://global-empowerment-platform.vercel.app`
- **Alternative:** `https://global-empowerment-platform-3ez5z3j8z.vercel.app`

Use the main URL (`global-empowerment-platform.vercel.app`) for the environment variable.
