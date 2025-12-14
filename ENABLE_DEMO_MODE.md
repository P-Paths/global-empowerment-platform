# Enable Demo Mode to Show Dashboard Without Backend

## Quick Enable (Browser Console)

Open your browser console (F12) and run:

```javascript
localStorage.setItem('demo_mode', 'true');
location.reload();
```

This will:
- ✅ Allow dashboard access even if onboarding check fails
- ✅ Show mock data when backend calls fail
- ✅ Let you demonstrate the dashboard without backend working

## Disable Demo Mode

```javascript
localStorage.removeItem('demo_mode');
location.reload();
```

## What Demo Mode Does

1. **Bypasses onboarding check** - Allows access to dashboard even if onboarding status can't be verified
2. **Shows mock data** - Displays sample funding scores, tasks, and community posts when backend is unavailable
3. **Still requires login** - You still need to be logged in via Supabase (frontend auth)

## Alternative: Environment Variable

You can also set this in Vercel environment variables:
- **Name:** `NEXT_PUBLIC_DEMO_MODE`
- **Value:** `true`

This will enable demo mode for all users (useful for demos/presentations).

## Notes

- Demo mode only affects the dashboard page
- You still need to be logged in (Supabase authentication)
- Mock data is shown when backend calls fail
- This is temporary - fix the backend JWT secret issue for production use
