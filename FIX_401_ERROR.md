# Fix 401 Unauthorized Error

## 🔍 **The Problem:**

Backend is returning `401 Unauthorized` when trying to save onboarding data. This means the JWT token validation is failing.

## 🎯 **Root Causes:**

### **Most Likely: JWT Secret Mismatch**
The `SUPABASE_JWT_SECRET` in Cloud Run doesn't match what Supabase uses to sign tokens.

### **How to Fix:**

1. **Get the correct JWT secret from Supabase:**
   - Go to: https://supabase.com/dashboard
   - Select your project: `pbjwtmfbhaibnxganxdh`
   - Go to: **Settings** → **API**
   - Scroll down to **JWT Settings**
   - Copy the **JWT Secret** (it's the long base64 string)

2. **Update Cloud Run environment variable:**
   ```bash
   gcloud run services update gem-backend \
     --region us-central1 \
     --project gem-platform-480517 \
     --update-env-vars SUPABASE_JWT_SECRET="<paste-the-secret-here>"
   ```

3. **Verify it's set:**
   ```bash
   gcloud run services describe gem-backend \
     --region us-central1 \
     --project gem-platform-480517 \
     --format="value(spec.template.spec.containers[0].env)" | grep SUPABASE_JWT_SECRET
   ```

## 🔍 **Check Backend Logs:**

After updating the secret, try onboarding again and check the logs:

1. Go to: https://console.cloud.google.com/run/detail/us-central1/gem-backend/logs?project=gem-platform-480517
2. Look for lines with:
   - `✅ Authenticated user:` = Success
   - `❌ JWT decode error:` = JWT secret mismatch
   - `Missing or invalid authorization header` = Token not being sent

## 🐛 **Other Possible Issues:**

### **Issue 2: Token Not Being Sent**
If logs show "Missing or invalid authorization header":
- Check browser console for: `🔐 Auth token present:`
- If it shows `hasToken: false`, the user session expired
- Solution: User needs to log in again

### **Issue 3: Token Expired**
If logs show "Invalid or expired token":
- Supabase tokens expire after 1 hour
- Solution: Frontend should auto-refresh, but user may need to log in again

## ✅ **Verification Steps:**

1. **Check backend logs** after trying onboarding
2. **Look for these log messages:**
   - `Received token (first 20 chars):` = Token is being received
   - `SUPABASE_JWT_SECRET is set: True` = Secret is configured
   - `✅ Authenticated user:` = Success!
   - `❌ JWT decode error:` = Secret mismatch

3. **Check browser console** for:
   - `🔐 Auth token present:` = Token is being sent
   - `📤 Calling backend API:` = Request is being made

## 🚨 **Quick Test:**

Run this in browser console on production:
```javascript
// Check if you have a session
const { createClient } = await import('@supabase/supabase-js');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', {
  hasSession: !!session,
  hasToken: !!session?.access_token,
  tokenLength: session?.access_token?.length,
  userId: session?.user?.id
});
```

If `hasToken: false`, you need to log in again.

---

## 📋 **Summary:**

**Most likely fix:** Update `SUPABASE_JWT_SECRET` in Cloud Run to match Supabase's JWT secret.

**To verify:** Check backend logs after trying onboarding - they'll show exactly what's wrong.

