# Global Empowerment Platform

Multi-platform goods selling platform enabling members to post and sell products across Facebook, Instagram, YouTube, and TikTok.

## Tech Stack
- Backend: FastAPI (Python)
- Frontend: Next.js 15 (React 19, TypeScript)
- Database: PostgreSQL (Supabase)
- Authentication: Supabase Auth

## Getting Started

### Backend Setup
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp env.example .env
# Edit .env with your configuration
```

### Frontend Setup
```bash
cd frontend
npm install
cp env.example .env.local
# Edit .env.local with your configuration
npm run dev
```

## Development
```bash
# From root directory
npm run dev  # Runs both backend and frontend concurrently
```
