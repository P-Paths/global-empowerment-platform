"""
Global Empowerment Platform (GEP) - Main FastAPI Application

Entry point for the GEP backend API.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import logging
import asyncio
import time
from datetime import datetime

from app.core.config import settings
from app.core.database import async_engine, Base
from app.api.v1 import (
    auth as auth_router,
    user as user_router,
    analytics,
    messages as messages_router,
    facebook_oauth as facebook_oauth_router,
    user_facebook_posting as user_facebook_posting_router,
)
# Import test_apis_router separately since it's optional
try:
    from app.api.v1 import test_apis_router
except ImportError:
    test_apis_router = None
from app.middleware import rate_limit_middleware, cleanup_rate_limits
from app.core.security import (
    SecurityConfig, 
    AuthenticationManager, 
    AuthorizationManager,
    RateLimitManager,
    SecurityAudit,
    InputValidation,
    SECURITY_HEADERS
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Rate limiting
limiter = Limiter(key_func=get_remote_address)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    print("🚀 Starting Global Empowerment Platform (GEP)...")
    
    # Start rate limit cleanup task
    cleanup_task = asyncio.create_task(cleanup_rate_limits())
    
    yield
    
    # Shutdown
    print("🛑 Shutting down Global Empowerment Platform (GEP)...")
    cleanup_task.cancel()
    try:
        await cleanup_task
    except asyncio.CancelledError:
        pass

app = FastAPI(
    title="Global Empowerment Platform (GEP) API",
    description="Social growth engine for entrepreneurs - AI coaching, community, and funding readiness",
    version="1.0.0",
    lifespan=lifespan
)

# Add rate limiting exception handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS middleware - MUST be first to handle preflight requests
# Ensure localhost:3000 is always included and all GEP domains
# Note: FastAPI CORS doesn't support wildcards, so we need to allow all Vercel preview domains
cors_origins = list(set(settings.ALLOWED_ORIGINS + [
    "http://localhost:3000", 
    "http://127.0.0.1:3000",
    "https://www.globalempowerment.com",
    "https://globalempowerment.com",
    "https://gep.vercel.app",
    "https://global-empowerment-platform.vercel.app"
]))

# Add all Vercel preview domains (they follow pattern: global-empowerment-platform-*.vercel.app)
# Since FastAPI doesn't support wildcards, we'll handle this in the middleware
logger.info(f"CORS origins configured: {cors_origins}")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"https://global-empowerment-platform-.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["X-Total-Count", "X-Rate-Limit-Remaining"]
)

# Security middleware stack (after CORS)
# TrustedHostMiddleware - Only apply in non-Cloud-Run environments
# For Cloud Run, we skip TrustedHostMiddleware because:
# 1. CORS middleware (which runs first) already validates origins
# 2. Cloud Run hostnames are controlled by Google and are secure
# 3. TrustedHostMiddleware blocks OPTIONS preflight requests unnecessarily
# 
# In production (Cloud Run), CORS provides sufficient origin validation
# For local dev, we still validate localhost
import os
is_cloud_run = os.getenv("K_SERVICE") is not None or os.getenv("GAE_ENV") is not None
if not is_cloud_run:
    # Only apply TrustedHostMiddleware in non-Cloud-Run environments
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.ALLOWED_HOSTS)
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Rate limiting middleware (temporarily disabled for debugging)
# app.middleware("http")(rate_limit_middleware)

# Health check endpoint - optimized for speed
@app.get("/health")
async def health_check():
    """Health check endpoint - fast response without blocking operations"""
    # Return immediately without any blocking operations
    # This ensures the health check always responds quickly (< 1 second)
    return {
        "status": "healthy",
        "service": "Global Empowerment Platform Backend",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }

# Enhanced security headers middleware with CORS safety net
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Add comprehensive security headers to all responses"""
    import re
    
    # Handle OPTIONS preflight requests explicitly
    if request.method == "OPTIONS":
        origin = request.headers.get("origin")
        # Check if origin is allowed (either in list or matches Vercel pattern)
        is_allowed = False
        if origin:
            if origin in cors_origins:
                is_allowed = True
            elif re.match(r"https://global-empowerment-platform-.*\.vercel\.app", origin):
                is_allowed = True
        
        if is_allowed:
            response = Response(status_code=200)
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
            response.headers["Access-Control-Allow-Headers"] = "*"
            return response
        else:
            # Return 200 even if origin not in list (let CORS middleware handle it)
            response = Response(status_code=200)
            return response
    
    try:
        response = await call_next(request)
    except Exception as e:
        # If an exception occurs, create a response with CORS headers
        logger.error(f"Exception in middleware: {e}")
        response = JSONResponse(
            status_code=500,
            content={"error": "Internal server error", "message": "Something went wrong"}
        )
    
    # Ensure CORS headers are always present for allowed origins
    origin = request.headers.get("origin")
    if origin:
        is_allowed = origin in cors_origins or re.match(r"https://global-empowerment-platform-.*\.vercel\.app", origin)
        if is_allowed:
            if "Access-Control-Allow-Origin" not in response.headers:
                response.headers["Access-Control-Allow-Origin"] = origin
            if "Access-Control-Allow-Credentials" not in response.headers:
                response.headers["Access-Control-Allow-Credentials"] = "true"
    
    # Add all security headers from configuration
    try:
        from app.core.security import SECURITY_HEADERS as headers
        for header, value in headers.items():
            if header not in response.headers:  # Don't override existing headers
                response.headers[header] = value
    except Exception as e:
        logger.warning(f"Could not add security headers: {e}")
    
    return response

# Security audit middleware (temporarily disabled for debugging)
# @app.middleware("http")
# async def security_audit_middleware(request: Request, call_next):
#     """Audit all API access for security monitoring"""
#     start_time = time.time()
#     
#     # Get user ID from request state (set by auth middleware)
#     user_id = getattr(request.state, 'user_id', 'anonymous')
#     
#     # Process request
#     response = await call_next(request)
#     
#     # Calculate processing time
#     process_time = time.time() - start_time
#     
#     # Log API access for security audit (temporarily disabled for debugging)
#     # SecurityAudit.log_api_access(
#     #     user_id=user_id,
#     #     endpoint=request.url.path,
#     #     method=request.method,
#     #     status_code=response.status_code
#     # )
#     
#     # Add processing time header
#     response.headers["X-Process-Time"] = str(process_time)
#     
#     return response

# Input validation middleware (temporarily disabled for debugging)
# @app.middleware("http")
# async def input_validation_middleware(request: Request, call_next):
#     """Validate and sanitize input data"""
#     # For POST/PUT requests, validate input
#     if request.method in ["POST", "PUT"]:
#         try:
#             # Get request body
#             body = await request.body()
#             if body:
#                 # Skip UTF-8 validation for multipart/form-data (image uploads)
#                 content_type = request.headers.get("content-type", "")
#                 if "multipart/form-data" not in content_type:
#                     # Only validate text-based requests
#                     body_str = body.decode('utf-8')
#                     if len(body_str) > 1000000:  # 1MB limit
#                         return Response(
#                             content="Request body too large",
#                             status_code=413
#                         )
#         except Exception as e:
#             logger.warning(f"Input validation error: {e}")
#     
#     response = await call_next(request)
#     return response

# Include routers - GEP Platform MVP
app.include_router(auth_router.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(user_router.router, prefix="/api/v1", tags=["User"])
app.include_router(analytics.router, prefix="/api/v1", tags=["Analytics"])
app.include_router(messages_router.router, prefix="/api/v1/messages", tags=["Messages"])

# Facebook OAuth2 and User-Specific Posting
app.include_router(facebook_oauth_router.router, prefix="/api/v1/auth", tags=["Facebook OAuth2"])
app.include_router(user_facebook_posting_router.router, prefix="/api/v1/facebook", tags=["User Facebook Posting"])

# User Presets
from app.api.v1 import user_presets
app.include_router(user_presets.router, prefix="/api/v1", tags=["User Presets"])

# GEP Community Features
from app.api.v1 import community_feed, member_directory, growth_coach
app.include_router(community_feed.router, prefix="/api/v1/community", tags=["Community Feed"])
app.include_router(member_directory.router, prefix="/api/v1", tags=["Member Directory"])
app.include_router(growth_coach.router, prefix="/api/v1/growth", tags=["AI Growth Coach"])

# GEM Platform MVP Routes
from app.api.v1 import profiles, posts, comments, followers, messages_dm, tasks, score, clone, pitchdeck
app.include_router(profiles.router, prefix="/api/v1", tags=["Profiles"])
app.include_router(posts.router, prefix="/api/v1", tags=["Posts"])
app.include_router(comments.router, prefix="/api/v1", tags=["Comments"])
app.include_router(followers.router, prefix="/api/v1", tags=["Followers"])
app.include_router(messages_dm.router, prefix="/api/v1", tags=["Direct Messages"])
app.include_router(tasks.router, prefix="/api/v1", tags=["Tasks"])
app.include_router(score.router, prefix="/api/v1", tags=["Funding Score"])
app.include_router(clone.router, prefix="/api/v1", tags=["Persona Clone"])
app.include_router(pitchdeck.router, prefix="/api/v1", tags=["Pitch Deck"])

# Learning System (Personalized AI Assistant)
from app.api.v1 import learning
app.include_router(learning.router, prefix="/api/v1", tags=["Learning"])

# API Testing
if test_apis_router:
    app.include_router(test_apis_router, prefix="/api/v1", tags=["API Testing"])

# Test endpoint
@app.get("/test")
async def test_endpoint():
    return {"message": "Test endpoint working!"}

# Test market search endpoint without auth
@app.post("/test-market-search")
async def test_market_search(request: dict):
    return {
        "success": True,
        "message": "Test market search working!",
        "received": request
    }

# Chat endpoint - GEP AI Assistant
@app.post("/chat/enhanced")
async def enhanced_chat(request: Request):
    """
    Enhanced chat endpoint for GEP AI agent
    """
    try:
        body = await request.json()
        messages = body.get("messages", [])
        
        # Simple response for GEP
        return {
            "response": "Hello! I'm GEP's AI assistant. I'm here to help you grow your digital influence, build your brand, and prepare for funding. How can I assist you today?",
            "success": True
        }
        
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        return {"error": f"Chat service error: {str(e)}", "success": False}

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Global Empowerment Platform (GEP) API",
        "version": "1.0.0",
        "status": "healthy"
    }

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """HTTP exception handler with CORS headers"""
    logger.error(f"HTTP exception: {exc.status_code} - {exc.detail}")
    response = JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail}
    )
    # Add CORS headers
    origin = request.headers.get("origin")
    if origin and origin in cors_origins:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
    return response

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler with CORS headers"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    response = JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "message": "Something went wrong"}
    )
    # Add CORS headers
    origin = request.headers.get("origin")
    if origin and origin in cors_origins:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
    return response


if __name__ == "__main__":
    import uvicorn
    import os
    
    # Use PORT environment variable or default to 8000 (Cloud Run standard)
    port = int(os.getenv("PORT", 8000))
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        reload=False  # Disable reload in production
    ) 