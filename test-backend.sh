#!/bin/bash
# Quick test script to check if backend is running

echo "Testing backend connection..."
echo ""

# Test if backend is accessible
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ Backend is running and accessible at http://localhost:8000"
    curl -s http://localhost:8000/health | python3 -m json.tool 2>/dev/null || curl -s http://localhost:8000/health
else
    echo "❌ Backend is NOT accessible at http://localhost:8000"
    echo "   Make sure the backend is running:"
    echo "   cd backend && source venv/bin/activate && python start_server.py"
fi

echo ""
echo "Testing CORS headers..."
if curl -s -H "Origin: http://localhost:3000" -H "Access-Control-Request-Method: GET" -X OPTIONS http://localhost:8000/health -I 2>&1 | grep -i "access-control-allow-origin" > /dev/null; then
    echo "✅ CORS headers are present"
    curl -s -H "Origin: http://localhost:3000" -H "Access-Control-Request-Method: GET" -X OPTIONS http://localhost:8000/health -I | grep -i "access-control"
else
    echo "❌ CORS headers are missing"
fi
