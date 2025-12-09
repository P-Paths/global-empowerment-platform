#!/bin/bash
# Simple startup - ONE terminal, both servers
# Run this in ONE terminal window

echo "🚀 Starting GEM Platform..."
echo ""

# Backend
echo "📦 Starting Backend..."
cd ~/code/GEP/backend
source venv/bin/activate
python start_server.py &
BACKEND_PID=$!

# Wait a moment
sleep 2

# Frontend  
echo "📦 Starting Frontend..."
cd ~/code/GEP/frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Both servers starting!"
echo "Backend:  http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both"

# Wait for both (or Ctrl+C)
wait

