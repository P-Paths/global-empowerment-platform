# GEP Setup Notes

## Project Information
- **GitHub Repository:** [P-Paths/Global_Empowerment_Platform](https://github.com/P-Paths/Global_Empowerment_Platform)
- **Google Cloud Project:** gem-platform-480517
- **Supabase Project:** pbjwtmfbhaibnxganxdh

## Supabase Configuration
- **URL:** https://pbjwtmfbhaibnxganxdh.supabase.co
- **Database Password:** `GlobalEMP2024$` (URL-encode `$` as `%24` in connection string)
- **Database URL Format:** `postgresql://postgres:GlobalEMP2024%24@db.pbjwtmfbhaibnxganxdh.supabase.co:5432/postgres`

## Quick Setup Steps

### 1. Backend Environment
```bash
cd backend
cp env.example .env
# Edit .env and add:
# - Your Supabase project URL
# - Supabase keys (anon key, service role key, JWT secret)
# - Database URL with password: postgresql://postgres:GlobalEMP2024$@[HOST]:5432/postgres
```

### 2. Frontend Environment
```bash
cd frontend
cp env.example .env.local
# Edit .env.local and add:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### 3. Database Migration
Run the SQL migration in Supabase SQL Editor:
- File: `backend/database_migrations/002_gep_foundation.sql`

### 4. Install Dependencies
```bash
# Backend
cd backend
source .venv/bin/activate
pip install -r requirements.txt

# Frontend (already done)
cd frontend
npm install
```

### 5. Start Development Server
```bash
# From root directory
npm run dev
```

## Access Points
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Community Feed: http://localhost:3000/community
- Growth Coach: http://localhost:3000/growth

