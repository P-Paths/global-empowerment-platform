from jose import jwt, JWTError
from fastapi import Request, HTTPException, status, Depends
from typing import Optional, Dict, Any
import os
import logging

logger = logging.getLogger(__name__)

# Get your Supabase JWT secret from environment
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")

def get_current_user(request: Request) -> Dict[str, Any]:
    """
    Verify Supabase JWT token and return user data.
    
    This function:
    1. Extracts the Bearer token from Authorization header
    2. Decodes and verifies the JWT token using Supabase secret
    3. Returns the user payload if valid
    4. In development (no SUPABASE_JWT_SECRET), returns mock user even without header
    5. Raises 401 if token is missing or invalid in production
    """
    auth_header = request.headers.get("Authorization")
    
    # In development mode (no SUPABASE_JWT_SECRET), allow requests without auth header
    if not SUPABASE_JWT_SECRET:
        logger.warning("SUPABASE_JWT_SECRET not set, using mock authentication for development")
        # Return mock user even without auth header in development
        # Use a valid UUID format for mock user so it works with database queries
        # Use a fixed UUID so it's consistent across requests
        import uuid
        if not hasattr(get_current_user, '_mock_uuid'):
            # Use a fixed UUID for mock user (consistent across restarts)
            get_current_user._mock_uuid = "00000000-0000-0000-0000-000000000001"
        return {
            "sub": get_current_user._mock_uuid,
            "email": "test@example.com",
            "user_metadata": {"full_name": "Test User"},
            "app_metadata": {"provider": "email"}
        }
    
    # In production, require auth header
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Missing or invalid authorization header"
        )

    token = auth_header.split(" ")[1]

    try:
        # Decode and verify the JWT token
        payload = jwt.decode(
            token, 
            SUPABASE_JWT_SECRET, 
            algorithms=["HS256"]
        )
        
        logger.info(f"Authenticated user: {payload.get('email', 'unknown')}")
        return payload
        
    except JWTError as e:
        logger.error(f"JWT decode error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid or expired token"
        )
    except Exception as e:
        logger.error(f"Authentication error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Authentication failed"
        )

def get_optional_user(request: Request) -> Optional[Dict[str, Any]]:
    """
    Optional authentication - returns user if token is valid, None if not.
    Useful for endpoints that work with or without authentication.
    """
    try:
        return get_current_user(request)
    except HTTPException:
        return None

def get_current_user_id(request: Request) -> str:
    """
    Get the current user ID from the JWT token.
    Returns the user ID as a string.
    """
    user = get_current_user(request)
    return user.get("sub", user.get("user_id", "unknown"))

def require_user_role(required_role: str):
    """
    Decorator to require specific user role.
    Usage: @require_user_role("admin")
    """
    def role_checker(user: Dict[str, Any] = Depends(get_current_user)):
        user_roles = user.get("app_metadata", {}).get("roles", [])
        if required_role not in user_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Required role: {required_role}"
            )
        return user
    return role_checker
