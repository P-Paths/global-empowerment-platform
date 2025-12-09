# GEP Testing Guide - For Tonight's Demo

## 🎯 Quick Start for 3 Testers

### Demo User Login
- **Email:** `user`
- **Password:** `register`
- This creates a mock user for testing (no real Supabase account needed)

### What Works Right Now

✅ **Onboarding Flow** - Updated for GEP:
- Welcome screen
- Profile setup (name, phone, zip, city)
- Business type selection (Social Media, E-Commerce, Consulting, Content Creation, SaaS, Other)
- Social platforms screen (Facebook, TikTok, Instagram, YouTube)
- Messaging preferences
- Completion screen

✅ **Community Feed** - Instagram-like feed with posts, likes, comments

✅ **AI Growth Coach** - Daily tasks and tracking

✅ **Funding Readiness Score** - 0-100 scoring system

✅ **Member Directory** - Search and browse members

✅ **Direct Messaging** - DMs between members

✅ **Profile Pages** - View member profiles with stats

## 🚀 How to Start Everything

### Option 1: Single Command (Recommended)
```bash
cd ~/code/GEP
npm run dev
```

This starts both:
- Backend: http://localhost:8000
- Frontend: http://localhost:3000

### Option 2: Separate Terminals
```bash
# Terminal 1 - Backend
cd ~/code/GEP/backend
source venv/bin/activate
python start_server.py

# Terminal 2 - Frontend
cd ~/code/GEP/frontend
npm run dev
```

## 📝 Testing Checklist

### 1. Login & Onboarding
- [ ] Login with demo user (`user` / `register`)
- [ ] Complete onboarding flow
- [ ] Verify all screens show GEP content (not Accorria)
- [ ] Check business type options (Social Media, E-Commerce, etc.)
- [ ] Verify social platforms screen

### 2. Main Features
- [ ] Navigate to Community Feed
- [ ] Create a post
- [ ] Like/comment on posts
- [ ] Check AI Growth Coach tasks
- [ ] View Funding Readiness Score
- [ ] Browse Member Directory
- [ ] View a profile page

### 3. Navigation
- [ ] Test all menu items
- [ ] Verify routing works
- [ ] Check mobile responsiveness

## 🐛 Known Issues

1. **Demo User Foreign Key** - Demo users can't create full profiles due to FK constraint, but onboarding still works
2. **Backend Must Be Running** - Make sure backend is on port 8000
3. **CORS** - Should be configured, but if issues occur, check backend logs

## 📊 What's NOT Working Yet (MVP Scope)

- Real social media API connections (Facebook, TikTok, etc.)
- Actual posting to social platforms
- Real user authentication (only demo user works)
- Production deployment

## 🎨 What Changed for GEP

### Onboarding Updates:
- ✅ Business types: Social Media, E-Commerce, Consulting, Content Creation, SaaS, Other
- ✅ Social platforms focus (Facebook, TikTok, Instagram, YouTube)
- ✅ Removed vehicle/automotive references
- ✅ Updated messaging to be GEP-focused

### Still Needs Work:
- Social platform connection flow
- Business/product type details
- Goals/objectives screen (funding, growth, etc.)

## 💡 Tips for Testing

1. **Use Demo User** - Easiest way to test without real accounts
2. **Check Console** - Browser console will show any errors
3. **Backend Logs** - Check `/tmp/backend.log` for backend errors
4. **Refresh Often** - Frontend hot-reloads, but refresh if things seem stuck

## 🆘 If Something Breaks

1. **Backend not responding?**
   ```bash
   # Kill and restart
   lsof -ti:8000 | xargs kill -9
   cd ~/code/GEP/backend && source venv/bin/activate && python start_server.py
   ```

2. **Frontend not loading?**
   ```bash
   # Kill and restart
   lsof -ti:3000 | xargs kill -9
   cd ~/code/GEP/frontend && npm run dev
   ```

3. **Onboarding errors?**
   - Check backend is running
   - Check browser console for errors
   - Try clearing browser cache

## 📞 Quick Reference

- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:8000
- **Backend Health:** http://localhost:8000/health
- **API Docs:** http://localhost:8000/docs

---

**Ready to test!** Start with `npm run dev` and login with demo user.

