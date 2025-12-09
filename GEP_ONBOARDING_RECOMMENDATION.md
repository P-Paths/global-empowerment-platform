# 🎯 GEP Onboarding - Recommended Approach

## The Issue
The current onboarding collects marketplace-specific fields (phone, zip, experience_level, escrow preferences) that don't fit GEP's focus on **entrepreneurs and funding**.

## 🏆 **Recommended: GEP-Specific Simplified Onboarding**

Since GEP is about:
- ✅ Building digital presence
- ✅ Growing followers
- ✅ Preparing for funding
- ✅ AI Growth Coach
- ✅ Community networking

**We don't need:**
- ❌ Phone/Zip (not relevant for GEP)
- ❌ Experience level (everyone starts at "Building")
- ❌ Escrow preferences (not part of GEP)
- ❌ Marketplace categories (GEP is about business growth)

## ✅ **Simplified GEP Onboarding Flow**

### Screen 1: Welcome
- Welcome to GEP
- What GEP does

### Screen 2: Business Profile
- Business name (use `business_name`)
- Business category (use `business_category`)
- City/State (use `city`, `state`)
- Bio (use `bio`)

### Screen 3: Skills
- Select skills (use `skills` array)

### Screen 4: Goals
- What do you want to achieve? (store in `bio` or new `goals` field)

### Screen 5: Complete
- Mark `onboarding_complete = true`

**All fields already exist in profiles table!** ✅

---

## 🚀 **Quick Fix Options**

### Option A: Run Full Migration (if you want all fields)
```sql
-- Run: 004_add_onboarding_fields.sql
-- Adds all onboarding fields for maximum flexibility
```

### Option B: Run Minimal Migration (GEP-focused)
```sql
-- Run: 005_gep_simplified_onboarding.sql
-- Only adds onboarding_complete flag
-- Uses existing profile fields
```

### Option C: Update Onboarding Service (No DB changes)
- Map onboarding fields to existing profile columns
- Remove fields that don't apply to GEP
- Simplify onboarding flow

---

## 💡 **My Recommendation**

**Use Option B + Update Onboarding Service:**

1. Run `005_gep_simplified_onboarding.sql` (adds `onboarding_complete`)
2. Update onboarding to use existing fields:
   - `first_name` + `last_name` → `full_name`
   - `business_name` → already exists
   - `business_category` → already exists
   - `city`, `state` → already exist
   - Remove: phone, zip, experience_level, messaging_preference, wants_escrow
3. Simplify onboarding screens to 3-4 screens instead of 8

**Benefits:**
- ✅ No complex migrations
- ✅ Uses existing schema
- ✅ Faster onboarding
- ✅ Focused on GEP's mission
- ✅ Less code to maintain

---

## 🎨 **Creative Alternative: Two-Track Onboarding**

**Track 1: GEP Core (Required)**
- Business name
- Category
- Location
- Bio
- Skills

**Track 2: Advanced Features (Optional)**
- Phone (for notifications)
- Experience level (for AI coaching personalization)
- Messaging preferences (for AI agent)

Store Track 2 in JSONB `preferences` column for flexibility.

---

**Which approach do you want?** I can implement any of these!

