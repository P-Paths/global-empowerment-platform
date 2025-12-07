#!/usr/bin/env python3
"""
Simple startup script for Accorria backend
"""

import os
import uvicorn
from app.main import app

if __name__ == "__main__":
    # Get port from environment or default to 8000 (Cloud Run standard)
    port = int(os.getenv("PORT", 8000))
    
    print(f"🚀 Starting Accorria backend on port {port}")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
        reload=False,
        log_level="info"
    )
