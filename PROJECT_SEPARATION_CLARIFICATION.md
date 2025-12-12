# Project Separation - Accorria vs GEP

## ✅ GOOD NEWS: Projects Are Separate

The deployment scripts are **completely separate**:

### GEP/Global Empowerment Platform:
- **Project ID:** `gem-platform-480517`
- **Service Name:** `gem-backend`
- **Deployment Script:** `deploy-gem-backend.sh`
- **Backend URL:** `https://gem-backend-1094576259070.us-central1.run.app`
- **Should Return:** "Global Empowerment Platform Backend"

### Accorria:
- **Project ID:** `accorria-beta`
- **Service Name:** `accorria-backend`
- **Deployment Script:** `deploy-accorria.sh`
- **Different Google Cloud Project - Completely Separate**

## ⚠️ THE PROBLEM

The backend at `gem-backend-1094576259070.us-central1.run.app` is currently returning "Accorria API" instead of "Global Empowerment Platform Backend".

**This means:**
- Either Accorria code was accidentally deployed to the GEP backend service
- OR the wrong deployment script was used
- OR there's shared code that needs to be separated

## 🔍 WHAT TO CHECK

1. **Check which code is in the backend directory:**
   ```bash
   cd backend
   grep -r "Accorria" app/
   ```
   If you find "Accorria" in the app/ directory, that's the problem.

2. **Check what was last deployed:**
   - Go to Google Cloud Console
   - Check Cloud Run service: `gem-backend` in project `gem-platform-480517`
   - Look at the deployment history
   - See which code was deployed

3. **Verify you're using the right script:**
   - ✅ Use `deploy-gem-backend.sh` for GEP
   - ❌ Never use `deploy-accorria.sh` for GEP

## 🛠️ HOW TO FIX

### Step 1: Verify Current Code
```bash
cd backend
grep -r "Accorria" app/main.py app/core/config.py
```

If you find "Accorria" references, they need to be changed to "Global Empowerment Platform".

### Step 2: Redeploy GEP Backend
```bash
cd backend
gcloud config set project gem-platform-480517
./deploy-gem-backend.sh
```

### Step 3: Verify It's Fixed
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

## 🚨 PREVENTION

1. **Always check which project you're deploying to:**
   ```bash
   gcloud config get-value project
   ```

2. **Use the correct deployment script:**
   - GEP → `deploy-gem-backend.sh`
   - Accorria → `deploy-accorria.sh`

3. **Verify before deploying:**
   - Check the PROJECT_ID in the script
   - Check the SERVICE_NAME in the script
   - Make sure it matches what you want to deploy

4. **Keep projects in separate directories:**
   - Consider having separate repos or at least separate backend directories
   - This prevents accidental cross-deployment

## 📝 WHAT CURSOR/AI HAS BEEN DOING

Cursor/AI has been:
- ✅ Working on GEP code in this repository
- ✅ Making changes to GEP backend code
- ❌ NOT directly deploying anything (you run the deployment scripts)
- ❌ NOT touching Accorria's codebase (it's in a different project)

**However:** If Accorria code was in this repository and got deployed using the GEP deployment script, that would explain the issue.

## 🔧 IMMEDIATE ACTION NEEDED

1. Check if Accorria code is in the backend/app directory
2. If yes, remove it or ensure it's properly separated
3. Redeploy using `deploy-gem-backend.sh`
4. Verify the health endpoint returns "Global Empowerment Platform Backend"

