"""
Accorria - Main FastAPI Application

Entry point for the Accorria backend API.
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
    car_listing_generator as car_listing_generator_router,
    car_analysis as car_analysis_router,
    market_intelligence as market_intelligence_router,
    enhanced_analysis as enhanced_analysis_router,
    synthesis as synthesis_router,
    flip_car as flip_car_router,
    listings,
    platform_posting as platform_posting_router,
    messages as messages_router,
    replies as replies_router,
    deals as deals_router,
    chat as chat_router,
    inventory as inventory_router,
    search_history as search_history_router,
    facebook_oauth as facebook_oauth_router,
    user_facebook_posting as user_facebook_posting_router,
    user_ebay_posting as user_ebay_posting_router,
    speech_to_text as speech_to_text_router
)
# Import test_apis_router separately since it's optional
try:
    from app.api.v1 import test_apis_router
except ImportError:
    test_apis_router = None
from app.api.v1.market_search import router as market_search_router
from app.api.v1.market_search_real_scrape import router as market_search_real_scrape_router
from app.api.v1.market_search_scrapingbee import router as market_search_scrapingbee_router
from app.api.v1.market_search_scraping import router as market_search_scraping_router
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
    print("🚀 Starting Accorria...")
    
    # Start rate limit cleanup task
    cleanup_task = asyncio.create_task(cleanup_rate_limits())
    
    yield
    
    # Shutdown
    print("🛑 Shutting down Accorria...")
    cleanup_task.cancel()
    try:
        await cleanup_task
    except asyncio.CancelledError:
        pass

app = FastAPI(
    title="Global Empowerment Platform API",
    description="Multi-platform goods selling platform API",
    version="1.0.0",
    lifespan=lifespan
)

# Add rate limiting exception handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS middleware - MUST be first to handle preflight requests
# Ensure localhost:3000 is always included and all accorria.com domains
cors_origins = list(set(settings.ALLOWED_ORIGINS + [
    "http://localhost:3000", 
    "http://127.0.0.1:3000",
    "https://www.accorria.com",
    "https://accorria.com",
    "https://accorria.vercel.app"
]))
logger.info(f"CORS origins configured: {cors_origins}")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["X-Total-Count", "X-Rate-Limit-Remaining"]
)

# Security middleware stack (after CORS)
app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.ALLOWED_HOSTS)
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

# Enhanced security headers middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Add comprehensive security headers to all responses"""
    response = await call_next(request)
    
    # Add all security headers from configuration
    try:
        from app.core.security import SECURITY_HEADERS as headers
        for header, value in headers.items():
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

# Include routers - Full version
app.include_router(auth_router.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(user_router.router, prefix="/api/v1", tags=["User"])
app.include_router(analytics.router, prefix="/api/v1", tags=["Analytics"])
app.include_router(car_listing_generator_router.router, prefix="/api/v1", tags=["Car Listing Generator"])
app.include_router(car_analysis_router.router, prefix="/api/v1", tags=["Car Analysis"])
app.include_router(market_intelligence_router.router, prefix="/api/v1", tags=["Market Intelligence"])
app.include_router(enhanced_analysis_router.router, prefix="/api/v1", tags=["Enhanced Analysis"])

# Add helpful error messages for common wrong paths (for backward compatibility)
@app.post("/analyze-car")
async def redirect_analyze_car():
    """Old /analyze-car endpoint - moved to /api/v1/enhanced-analyze"""
    raise HTTPException(
        status_code=404, 
        detail="Endpoint moved. Use /api/v1/enhanced-analyze instead"
    )

@app.post("/enhanced-analyze")
async def redirect_enhanced_analyze():
    """Old /enhanced-analyze endpoint - moved to /api/v1/enhanced-analyze"""
    raise HTTPException(
        status_code=404, 
        detail="Endpoint moved. Use /api/v1/enhanced-analyze instead"
    )

@app.post("/enhanced-analyze-with-rag")
async def redirect_enhanced_analyze_with_rag():
    """Old /enhanced-analyze-with-rag endpoint - moved to /api/v1/enhanced-analyze-with-rag"""
    raise HTTPException(
        status_code=404, 
        detail="Endpoint moved. Use /api/v1/enhanced-analyze-with-rag instead"
    )

@app.post("/api/v1/enhanced_analysis/real-analyze")
async def redirect_enhanced_analysis_real_analyze():
    """Wrong path - use /api/v1/real-analyze instead"""
    raise HTTPException(
        status_code=404, 
        detail="Wrong path. Use /api/v1/real-analyze instead"
    )

@app.post("/api/v1/enhanced_analysis/enhanced-analyze-with-rag")
async def redirect_enhanced_analysis_with_rag():
    """Wrong path - use /api/v1/enhanced-analyze-with-rag instead"""
    raise HTTPException(
        status_code=404, 
        detail="Wrong path. Use /api/v1/enhanced-analyze-with-rag instead"
    )
app.include_router(synthesis_router.router, prefix="/api/v1", tags=["Synthesis"])
app.include_router(flip_car_router.router, prefix="/api/v1", tags=["Flip Car"])
app.include_router(listings.router, prefix="/api/v1/listings", tags=["Listings"])
app.include_router(platform_posting_router.router, prefix="/api/v1", tags=["Platform Posting"])
app.include_router(messages_router.router, prefix="/api/v1/messages", tags=["Messages"])
app.include_router(replies_router.router, prefix="/api/v1", tags=["AI Replies"])
app.include_router(deals_router.router, prefix="/api/v1", tags=["Deals"])
app.include_router(chat_router.router, prefix="/api/v1/chat", tags=["Chat"])
app.include_router(inventory_router.router, prefix="/api/v1", tags=["Inventory"])
app.include_router(search_history_router.router, prefix="/api/v1/search-history", tags=["Search History"])
app.include_router(market_search_router, prefix="/api/v1/market-search", tags=["Market Search"])
app.include_router(market_search_real_scrape_router, prefix="/api/v1/market-search", tags=["Market Search"])
app.include_router(market_search_scrapingbee_router, prefix="/api/v1/market-search", tags=["Market Search"])
app.include_router(market_search_scraping_router, prefix="/api/v1/market-search", tags=["Market Search"])

# Facebook OAuth2 and User-Specific Posting
app.include_router(facebook_oauth_router.router, prefix="/api/v1/auth", tags=["Facebook OAuth2"])
app.include_router(user_facebook_posting_router.router, prefix="/api/v1/facebook", tags=["User Facebook Posting"])

# eBay User-Specific Posting
app.include_router(user_ebay_posting_router.router, prefix="/api/v1/ebay", tags=["User eBay Posting"])

# User Presets
from app.api.v1 import user_presets
app.include_router(user_presets.router, prefix="/api/v1", tags=["User Presets"])

# Speech-to-Text
app.include_router(speech_to_text_router.router, prefix="/api/v1/speech-to-text", tags=["Speech-to-Text"])

# Knowledge Graph (Phase 0)
from app.api.v1 import knowledge_graph as knowledge_graph_router
app.include_router(knowledge_graph_router.router, prefix="/api/v1", tags=["Knowledge Graph"])

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

# Chat endpoint
@app.post("/chat/enhanced")
async def enhanced_chat(request: Request):
    """
    Enhanced chat endpoint for Accorria AI agent
    """
    try:
        body = await request.json()
        messages = body.get("messages", [])
        
        # Simple response for testing
        return {
            "response": "Hello! I'm Accorria's AI agent. I'm here to help you list cars and homes for sale. How can I assist you today?",
            "success": True
        }
        
    except Exception as e:
        print(f"Chat error: {str(e)}")
        return {"error": f"Chat service error: {str(e)}", "success": False}

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Accorria API",
        "version": "1.0.0",
        "status": "healthy"
    }

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "message": "Something went wrong"}
    )


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