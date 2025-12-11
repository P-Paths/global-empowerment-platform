#!/usr/bin/env python3
"""
Simple startup script for GEM Platform backend
"""

import os
import sys
import uvicorn

# Add better error handling
try:
    from app.main import app, cors_origins
    print(f"✅ CORS origins configured: {cors_origins}")
except Exception as e:
    print(f"❌ Error importing app: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

if __name__ == "__main__":
    # Get port from environment or default to 8000 (Cloud Run standard)
    port = int(os.getenv("PORT", 8000))
    
    print(f"🚀 Starting GEM Platform backend on port {port}")
    print(f"📍 Backend will be accessible at:")
    print(f"   - http://localhost:{port}")
    print(f"   - http://127.0.0.1:{port}")
    print(f"")
    
    try:
        uvicorn.run(
            app,
            host="0.0.0.0",  # Listen on all interfaces
            port=port,
            reload=False,
            log_level="info"
        )
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
