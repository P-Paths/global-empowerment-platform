# 🚀 Quick Start Guide

## About the PowerShell Error

**The PowerShell error you saw is NOT a problem!** It's just the PowerShell extension in VS Code/Cursor that stopped. It doesn't affect your actual servers or code. You can:
- Click "Yes" to restart it (optional)
- Or just ignore it - it won't affect your app

---

## Start Everything (One Command)

### Option 1: Bash Script (Linux/WSL/Mac)
```bash
chmod +x start_all.sh
./start_all.sh
```

### Option 2: PowerShell Script (Windows)
```powershell
.\start_all.ps1
```

### Option 3: Manual Start

**Terminal 1 - Backend:**
```bash
cd backend
python3 start_server.py
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

---

## Access Your App

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

---

## Stop Servers

Press `Ctrl+C` in each terminal, or if using the script, it will stop both.

---

## Troubleshooting

### Backend won't start?
- Check if port 8000 is already in use
- Make sure you're in the `backend` directory
- Check Python version: `python3 --version` (should be 3.8+)

### Frontend won't start?
- Check if port 3000 is already in use
- Make sure you're in the `frontend` directory
- Install dependencies: `npm install`

### Port already in use?
```bash
# Find what's using the port
lsof -i :8000  # Backend
lsof -i :3000  # Frontend

# Kill the process
kill -9 <PID>
```

