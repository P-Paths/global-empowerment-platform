"""
Simple in-memory cache for market intelligence queries.

Reduces duplicate API calls by caching results based on normalized query keys.
Uses Redis if available, otherwise falls back to in-memory cache.
"""

import time
import json
import os
from typing import Any, Dict, Tuple, Optional

# Try to use Redis if available, otherwise use in-memory cache
_USE_REDIS = False
_redis_client = None

try:
    import redis
    redis_host = os.getenv("REDIS_HOST", "localhost")
    redis_port = int(os.getenv("REDIS_PORT", 6379))
    redis_password = os.getenv("REDIS_PASSWORD")
    
    _redis_client = redis.Redis(
        host=redis_host,
        port=redis_port,
        password=redis_password,
        decode_responses=True,
        socket_connect_timeout=2  # Fast timeout for connection check
    )
    # Test connection
    _redis_client.ping()
    _USE_REDIS = True
    print("[CACHE] ✅ Using Redis for caching")
except Exception as e:
    _USE_REDIS = False
    _redis_client = None
    print(f"[CACHE] ⚠️  Redis not available, using in-memory cache: {e}")

# In-memory cache: key -> (timestamp, value) (fallback)
_CACHE: Dict[str, Tuple[float, Any]] = {}


def cache_get(key: str, ttl_sec: int = 900) -> Optional[Any]:
    """
    Get cached value if it exists and hasn't expired.
    
    Args:
        key: Cache key
        ttl_sec: Time-to-live in seconds (default: 15 minutes)
        
    Returns:
        Cached value or None if not found/expired
    """
    if _USE_REDIS and _redis_client:
        try:
            cached = _redis_client.get(key)
            if cached:
                return json.loads(cached)
            return None
        except Exception as e:
            print(f"[CACHE] ⚠️  Redis get failed, falling back to memory: {e}")
            # Fall through to in-memory cache
    
    # In-memory cache fallback
    item = _CACHE.get(key)
    if not item:
        return None
    
    timestamp, value = item
    if time.time() - timestamp > ttl_sec:
        # Expired - remove it
        _CACHE.pop(key, None)
        return None
    
    return value


def cache_set(key: str, value: Any, ttl_sec: int = 900) -> None:
    """
    Set a cached value.
    
    Args:
        key: Cache key
        value: Value to cache
        ttl_sec: Time-to-live in seconds (default: 15 minutes)
    """
    if _USE_REDIS and _redis_client:
        try:
            _redis_client.setex(key, ttl_sec, json.dumps(value))
            return
        except Exception as e:
            print(f"[CACHE] ⚠️  Redis set failed, falling back to memory: {e}")
            # Fall through to in-memory cache
    
    # In-memory cache fallback
    _CACHE[key] = (time.time(), value)


def cache_clear(key: Optional[str] = None) -> None:
    """
    Clear cache entry or all cache.
    
    Args:
        key: Specific key to clear, or None to clear all
    """
    if _USE_REDIS and _redis_client:
        try:
            if key:
                _redis_client.delete(key)
            else:
                _redis_client.flushdb()
            return
        except Exception as e:
            print(f"[CACHE] ⚠️  Redis clear failed, falling back to memory: {e}")
            # Fall through to in-memory cache
    
    # In-memory cache fallback
    if key:
        _CACHE.pop(key, None)
    else:
        _CACHE.clear()


def cache_size() -> int:
    """Get current cache size."""
    if _USE_REDIS and _redis_client:
        try:
            return _redis_client.dbsize()
        except Exception as e:
            print(f"[CACHE] ⚠️  Redis size check failed, falling back to memory: {e}")
            # Fall through to in-memory cache
    
    # In-memory cache fallback
    return len(_CACHE)


def _normalize_key(payload: Dict[str, Any]) -> str:
    """
    Create a stable cache key from a payload dict.
    
    Args:
        payload: Dictionary with make, model, year, mileage, location, etc.
        
    Returns:
        Normalized cache key string
    """
    # Sort keys for consistent hashing
    # Exclude price and other fields that shouldn't affect cache hit
    normalized = {
        "make": (payload.get("make") or "").lower().strip(),
        "model": (payload.get("model") or "").lower().strip(),
        "year": payload.get("year"),
        "mileage": payload.get("mileage"),
        "location": (payload.get("location") or "").lower().strip(),
        "title_status": (payload.get("title_status") or payload.get("titleStatus") or "clean").lower().strip(),
        "analysis_type": payload.get("analysis_type", "comprehensive"),
    }
    
    # Create hash-like key
    key_str = json.dumps(normalized, sort_keys=True, separators=(',', ':'))
    return f"mi:{hash(key_str)}"

