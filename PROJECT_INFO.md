# Global Empowerment Platform - Project Information

## Project Links
- **GitHub Repository:** [P-Paths/Global_Empowerment_Platform](https://github.com/P-Paths/Global_Empowerment_Platform)
- **Google Cloud Console:** [gem-platform-480517](https://console.cloud.google.com/welcome?organizationId=7692558618&project=gem-platform-480517)
- **Supabase Dashboard:** https://supabase.com/dashboard/project/pbjwtmfbhaibnxganxdh

## Supabase Configuration
- **Project Reference:** pbjwtmfbhaibnxganxdh
- **URL:** https://pbjwtmfbhaibnxganxdh.supabase.co
- **Database Host:** db.pbjwtmfbhaibnxganxdh.supabase.co
- **Database Password:** `GlobalEMP2024$` (URL-encode `$` as `%24` in connection strings)

## API Keys Configured
- ✅ OpenAI API Key (configured)
- ✅ Gemini API Key (configured)
- ⏳ NanoBanana API Key (optional)
- ⏳ Cloudinary (for image/video)
- ⏳ Social Platform APIs (Facebook, Instagram, YouTube, TikTok)

## Next Steps
1. **Create actual .env file:**
   ```bash
   cd backend
   cp env.example .env
   # The Supabase credentials are already in env.example, but you may need to:
   # - Generate SECRET_KEY
   # - Generate TOKEN_ENCRYPTION_KEY
   ```

2. **Database Migration:**
   - The migration SQL is at: `backend/database_migrations/002_gep_foundation.sql`
   - Run it in Supabase SQL Editor (looks like you may have already started with RLS policies!)

3. **Frontend Environment:**
   ```bash
   cd frontend
   cp env.example .env.local
   # Add the Supabase URL and ANON_KEY from backend/env.example
   ```

4. **Generate Security Keys:**
   ```bash
   # Generate SECRET_KEY (any random string)
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   
   # Generate TOKEN_ENCRYPTION_KEY (Fernet key)
   python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
   ```

