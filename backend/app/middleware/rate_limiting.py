"""
Rate Limiting Middleware for Aquaria API

Provides rate limiting functionality to prevent API abuse and ensure fair usage.
"""

from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
import time
import asyncio
from typing import Dict, Tuple
import logging

logger = logging.getLogger(__name__)

class RateLimiter:
    def __init__(self):
        self.requests: Dict[str, list] = {}
        self.max_requests_per_minute = 100
        self.max_requests_per_hour = 1000
        self.cleanup_interval = 3600  # 1 hour
    
    def _get_client_id(self, request: Request) -> str:
        """Get client identifier for rate limiting"""
        # Use user ID if authenticated, otherwise use IP
        user_id = getattr(request.state, 'user_id', None)
        if user_id:
            return f"user:{user_id}"
        else:
            return f"ip:{request.client.host}"
    
    def _cleanup_old_requests(self):
        """Clean up old request records"""
        current_time = time.time()
        for client_id in list(self.requests.keys()):
            # Remove requests older than 1 hour
            self.requests[client_id] = [
                req_time for req_time in self.requests[client_id]
                if current_time - req_time < 3600
            ]
            # Remove empty client records
            if not self.requests[client_id]:
                del self.requests[client_id]
    
    def is_rate_limited(self, client_id: str) -> Tuple[bool, Dict[str, int]]:
        """Check if client is rate limited"""
        current_time = time.time()
        
        # Initialize client record if not exists
        if client_id not in self.requests:
            self.requests[client_id] = []
        
        # Add current request
        self.requests[client_id].append(current_time)
        
        # Get requests in different time windows
        requests_last_minute = [
            req_time for req_time in self.requests[client_id]
            if current_time - req_time < 60
        ]
        
        requests_last_hour = [
            req_time for req_time in self.requests[client_id]
            if current_time - req_time < 3600
        ]
        
        # Check rate limits
        minute_limit_exceeded = len(requests_last_minute) > self.max_requests_per_minute
        hour_limit_exceeded = len(requests_last_hour) > self.max_requests_per_hour
        
        is_limited = minute_limit_exceeded or hour_limit_exceeded
        
        # Calculate remaining requests
        remaining_minute = max(0, self.max_requests_per_minute - len(requests_last_minute))
        remaining_hour = max(0, self.max_requests_per_hour - len(requests_last_hour))
        
        return is_limited, {
            "remaining_minute": remaining_minute,
            "remaining_hour": remaining_hour,
            "reset_minute": int(current_time + 60),
            "reset_hour": int(current_time + 3600)
        }

# Global rate limiter instance
rate_limiter = RateLimiter()

async def rate_limit_middleware(request: Request, call_next):
    """Rate limiting middleware"""
    try:
        # Skip rate limiting for health checks and public endpoints
        if request.url.path in ["/", "/health", "/api/v1/auth/login", "/api/v1/auth/register", "/api/v1/enhanced-analyze", "/api/v1/simple-analyze", "/api/v1/real-analyze", "/api/v1/mock-analyze"]:
            return await call_next(request)
        
        # Get client identifier
        client_id = rate_limiter._get_client_id(request)
        
        # Check rate limits
        is_limited, limits = rate_limiter.is_rate_limited(client_id)
        
        if is_limited:
            logger.warning(f"Rate limit exceeded for {client_id}")
            return JSONResponse(
                status_code=429,
                content={
                    "error": "Rate limit exceeded",
                    "message": "Too many requests. Please try again later.",
                    "limits": limits
                },
                headers={
                    "X-RateLimit-Remaining-Minute": str(limits["remaining_minute"]),
                    "X-RateLimit-Remaining-Hour": str(limits["remaining_hour"]),
                    "X-RateLimit-Reset-Minute": str(limits["reset_minute"]),
                    "X-RateLimit-Reset-Hour": str(limits["reset_hour"])
                }
            )
        
        # Add rate limit headers to response
        response = await call_next(request)
        response.headers["X-RateLimit-Remaining-Minute"] = str(limits["remaining_minute"])
        response.headers["X-RateLimit-Remaining-Hour"] = str(limits["remaining_hour"])
        response.headers["X-RateLimit-Reset-Minute"] = str(limits["reset_minute"])
        response.headers["X-RateLimit-Reset-Hour"] = str(limits["reset_hour"])
        
        return response
        
    except Exception as e:
        logger.error(f"Rate limiting middleware error: {e}")
        return await call_next(request)

# Periodic cleanup task
async def cleanup_rate_limits():
    """Periodic cleanup of old rate limit records"""
    while True:
        try:
            await asyncio.sleep(rate_limiter.cleanup_interval)
            rate_limiter._cleanup_old_requests()
        except Exception as e:
            logger.error(f"Rate limit cleanup error: {e}") 