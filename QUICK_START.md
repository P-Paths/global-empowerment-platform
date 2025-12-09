# 🚀 Quick Start - ONE Command

## Why Multiple Terminals?

When I run background commands, each one starts a new shell. That's why you see multiple terminals pop up. **Sorry about that!**

## Simple Solution - Run This Yourself

**In ONE terminal, run:**

```bash
./start_simple.sh
```

**OR manually in ONE terminal:**

```bash
# Terminal 1 - Backend
cd ~/code/GEP/backend
source venv/bin/activate
python start_server.py
```

**Then open a SECOND terminal for frontend:**

```bash
# Terminal 2 - Frontend  
cd ~/code/GEP/frontend
npm run dev
```

## That's It!

- **Backend:** http://localhost:8000
- **Frontend:** http://localhost:3000

**To stop:** Press `Ctrl+C` in each terminal.

---

**Note:** The backend might need environment variables. If it errors, check `backend/.env` or `backend/env.example` for what's needed.

