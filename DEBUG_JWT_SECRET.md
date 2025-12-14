# Debug JWT Secret Not Working

## Step 1: Check Backend Logs

The backend now has enhanced logging. After deploying, check the logs:

1. Go to Google Cloud Console → Cloud Run → `gem-backend` → **Logs**
2. Try to complete onboarding again
3. Look for log entries with "=== ONBOARDING REQUEST DEBUG ==="
4. Check what it says about:
   - `SUPABASE_JWT_SECRET is set: true/false`
   - `SUPABASE_JWT_SECRET length: X`
   - The actual error message

## Step 2: Test Diagnostic Endpoint

After deploying the updated code, test the diagnostic endpoint:

```javascript
// Get token from localStorage
const storageKeys = Object.keys(localStorage).filter(k => k.includes('supabase') || k.includes('auth'));
let accessToken = null;
for (const key of storageKeys) {
  try {
    const data = JSON.parse(localStorage.getItem(key) || '{}');
    if (data.access_token) { accessToken = data.access_token; break; }
    if (data.session?.access_token) { accessToken = data.session.access_token; break; }
  } catch (e) {}
}

if (accessToken) {
  fetch('https://gem-backend-1094576259070.us-central1.run.app/api/v1/auth/diagnostic', {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  })
  .then(r => r.json())
  .then(data => {
    console.log('📊 Diagnostic Results:', data);
    console.log('🔍 Key Checks:');
    console.log('- JWT secret configured:', data.jwt_secret_configured);
    console.log('- JWT secret length:', data.jwt_secret_length, '(should be 88)');
    console.log('- First 10 chars:', data.jwt_secret_first_10, '(should be "qQtYmpyZ+Z")');
    console.log('- Last 10 chars:', data.jwt_secret_last_10, '(should end with "vVIA==")');
    if (data.jwt_error) {
      console.error('❌ JWT Error:', data.jwt_error);
    }
  })
  .catch(console.error);
}
```

## Step 3: Verify Secret in Cloud Run

1. Go to Cloud Run → `gem-backend` → Edit & Deploy New Revision
2. Variables & Secrets tab
3. Check `SUPABASE_JWT_SECRET`:
   - **Does it exist?** (should be there)
   - **Value length:** Should be exactly 88 characters
   - **First 10 chars:** Should be `qQtYmpyZ+Z`
   - **Last 10 chars:** Should end with `vVIA==`
   - **No spaces:** Make sure there are no spaces before or after
   - **No quotes:** Don't wrap it in quotes

## Step 4: Common Issues

### Issue 1: Secret Not Actually Set
**Symptom:** `jwt_secret_configured: false` in diagnostic
**Fix:** Make sure you clicked "Deploy" after setting the variable

### Issue 2: Secret Truncated
**Symptom:** `jwt_secret_length` is less than 88
**Fix:** Copy the FULL secret from Supabase, make sure it's not cut off

### Issue 3: Secret Has Extra Characters
**Symptom:** `jwt_secret_length` is more than 88, or first/last chars don't match
**Fix:** Remove any spaces, quotes, or extra characters

### Issue 4: Secret Doesn't Match
**Symptom:** `jwt_secret_first_10` or `jwt_secret_last_10` don't match expected values
**Fix:** Get the secret fresh from Supabase and copy it exactly

### Issue 5: Old Revision Still Running
**Symptom:** Changes don't seem to take effect
**Fix:** 
- Make sure the new revision is deployed
- Check that it's receiving 100% traffic
- Wait 2-3 minutes after deployment

## Step 5: Get Fresh Secret from Supabase

1. Go to Supabase Dashboard → Settings → API → JWT Keys
2. Click "Legacy JWT Secret" tab
3. Click "Reveal" button
4. **Select ALL** the text (Ctrl+A / Cmd+A)
5. **Copy** (Ctrl+C / Cmd+C)
6. **Paste directly** into Cloud Run (no editing, no spaces)

## Step 6: Verify Deployment

After setting the secret and deploying:

1. Wait 2-3 minutes
2. Check Cloud Run → Revisions
3. Make sure the latest revision shows "100% (to latest)" traffic
4. If it shows 0%, the new revision isn't active yet

## What to Share

Please share:
1. **Diagnostic endpoint results** (run the JavaScript above)
2. **Backend logs** (the "=== ONBOARDING REQUEST DEBUG ===" section)
3. **What the error response says** (from Network tab → Response)

This will tell us exactly what's wrong!
