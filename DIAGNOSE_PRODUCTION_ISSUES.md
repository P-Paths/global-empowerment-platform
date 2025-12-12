# Production Issues Diagnosis & Fix Guide

## 🔍 **What We Know:**

### ✅ **Working Locally:**
- No diagonal lines
- Smooth onboarding flow
- Backend connects successfully
- All screens work perfectly

### ❌ **Not Working in Production:**
- Diagonal lines still appear
- Backend connection errors (401 Unauthorized)
- Onboarding flow may be broken

---

## 🎯 **Root Causes:**

### **Issue #1: Vercel CSS Cache**
**Problem:** Vercel is serving cached CSS bundle from before our fixes
**Solution:** Force rebuild + clear browser cache

### **Issue #2: Missing/Incorrect Vercel Environment Variables**
**Problem:** `NEXT_PUBLIC_API_URL` might not be set correctly in Vercel
**Solution:** Verify and set environment variables in Vercel dashboard

### **Issue #3: Backend Authentication**
**Problem:** JWT tokens might not be validating correctly
**Solution:** Verify `SUPABASE_JWT_SECRET` matches in both places

---

## 🔧 **Step-by-Step Fix:**

### **Step 1: Verify Vercel Environment Variables**

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

**Required Variables:**
```
NEXT_PUBLIC_API_URL=https://gem-backend-1094576259070.us-central1.run.app
NEXT_PUBLIC_SUPABASE_URL=https://pbjwtmfbhaibnxganxdh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Important:** 
- Make sure `NEXT_PUBLIC_API_URL` does NOT have `/api/v1` at the end
- Should be: `https://gem-backend-1094576259070.us-central1.run.app`
- NOT: `https://gem-backend-1094576259070.us-central1.run.app/api/v1`

### **Step 2: Force Vercel Rebuild**

1. Go to Vercel Dashboard → Deployments
2. Click "..." on latest deployment
3. Click "Redeploy"
4. Wait for build to complete (2-3 minutes)

### **Step 3: Verify Backend is Working**

Test the backend health endpoint:
```bash
curl https://gem-backend-1094576259070.us-central1.run.app/health
```

Should return:
```json
{
  "status": "healthy",
  "service": "Global Empowerment Platform Backend",
  "version": "1.0.0",
  "timestamp": "..."
}
```

### **Step 4: Test CORS Preflight**

Test if OPTIONS requests work:
```bash
curl -X OPTIONS https://gem-backend-1094576259070.us-central1.run.app/api/v1/profiles/onboarding \
  -H "Origin: https://global-empowerment-platform.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -i
```

Should return `200 OK` with CORS headers.

### **Step 5: Clear Browser Cache**

**Chrome/Edge:**
- Press `Ctrl + Shift + Delete` (Windows) or `Cmd + Shift + Delete` (Mac)
- Select "Cached images and files"
- Time range: "All time"
- Click "Clear data"

**Or Hard Refresh:**
- Windows/Linux: `Ctrl + Shift + R` or `Ctrl + F5`
- Mac: `Cmd + Shift + R`

### **Step 6: Test in Incognito/Private Window**

Open production site in incognito mode to bypass all cache.

---

## 🐛 **Debugging Steps:**

### **Check Browser Console:**

1. Open production site
2. Press `F12` to open DevTools
3. Go to Console tab
4. Look for errors:
   - `Failed to connect to...` → Backend connection issue
   - `401 Unauthorized` → Authentication issue
   - `CORS error` → CORS configuration issue

### **Check Network Tab:**

1. Open DevTools → Network tab
2. Try to complete onboarding
3. Look for failed requests:
   - Red requests = failed
   - Check status code (401, 403, 500, etc.)
   - Check request URL (is it correct?)
   - Check request headers (is Authorization header present?)

### **Check Environment Variables in Production:**

Add this to a test page to see what's actually set:
```typescript
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
```

---

## ✅ **Verification Checklist:**

- [ ] Vercel environment variables are set correctly
- [ ] Vercel deployment completed successfully
- [ ] Backend health endpoint returns 200
- [ ] CORS preflight (OPTIONS) returns 200
- [ ] Browser cache cleared
- [ ] Tested in incognito mode
- [ ] No console errors
- [ ] Network requests show correct URLs
- [ ] Authorization headers are present in requests

---

## 🚨 **If Still Not Working:**

### **Check Backend Logs:**
1. Go to Google Cloud Console
2. Cloud Run → gem-backend → Logs
3. Look for errors when you try onboarding

### **Check Vercel Logs:**
1. Go to Vercel Dashboard
2. Your Project → Deployments → Latest → Functions
3. Check for runtime errors

### **Verify JWT Secret:**
The `SUPABASE_JWT_SECRET` in Cloud Run must match the one Supabase uses to sign tokens.

---

## 📞 **Quick Test:**

Run this in browser console on production site:
```javascript
// Check environment variables
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);

// Test backend connection
fetch('https://gem-backend-1094576259070.us-central1.run.app/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

If this fails, the backend is down or unreachable.

