"""
Facebook OAuth2 Integration Service
Handles multi-tenant Facebook account connections for users
"""

import asyncio
import logging
import aiohttp
import json
import secrets
import os
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from dataclasses import dataclass
from urllib.parse import urlencode, parse_qs, urlparse
import base64
import hashlib
import hmac

logger = logging.getLogger(__name__)

# Process-level store for OAuth state (fallback if Redis not available)
STATE_STORE: Dict[str, Dict[str, Any]] = {}

# Try to use Redis for state storage if available
# Use connection pool with timeout to prevent hanging
try:
    import redis
    redis_host = os.getenv("REDIS_HOST", "localhost")
    redis_port = int(os.getenv("REDIS_PORT", 6379))
    redis_password = os.getenv("REDIS_PASSWORD")
    redis_client = redis.Redis(
        host=redis_host,
        port=redis_port,
        password=redis_password,
        decode_responses=True,
        socket_connect_timeout=2,  # 2 second timeout for connection
        socket_timeout=2,  # 2 second timeout for operations
        retry_on_timeout=False,  # Don't retry on timeout
        health_check_interval=30  # Check connection health every 30 seconds
    )
    # Test connection with timeout - don't block if Redis is unavailable
    redis_client.ping()
    logger.info("Using Redis for OAuth state storage")
    USE_REDIS = True
except Exception as e:
    logger.warning(f"Redis not available, using in-memory state store: {e}")
    redis_client = None
    USE_REDIS = False

@dataclass
class FacebookOAuthConfig:
    """Facebook OAuth2 configuration"""
    app_id: str
    app_secret: str
    redirect_uri: str
    scopes: List[str] = None
    
    def __post_init__(self):
        if self.scopes is None:
            # Start with basic scopes that don't require App Review
            # Advanced permissions (pages_manage_posts, pages_read_engagement) 
            # require Facebook App Review and should be added later
            self.scopes = [
                "public_profile"
            ]

@dataclass
class FacebookUserInfo:
    """Facebook user information from OAuth2"""
    user_id: str
    name: str
    email: Optional[str] = None
    picture_url: Optional[str] = None

@dataclass
class FacebookPageInfo:
    """Facebook page information"""
    page_id: str
    name: str
    access_token: str
    category: str = ""

class FacebookOAuthService:
    """
    Facebook OAuth2 service for multi-tenant user connections
    Each user connects their own Facebook account to Accorria
    """
    
    def __init__(self, config: FacebookOAuthConfig):
        self.config = config
        self.api_base_url = "https://graph.facebook.com/v18.0"
        self.oauth_base_url = "https://www.facebook.com/v18.0/dialog/oauth"
        self.session: Optional[aiohttp.ClientSession] = None
        
        # State is kept in module-level STATE_STORE
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    def generate_authorization_url(self, user_id: str, additional_scopes: List[str] = None) -> str:
        """
        Generate Facebook OAuth2 authorization URL for a user
        
        Args:
            user_id: Accorria user ID
            additional_scopes: Additional scopes beyond the default ones
            
        Returns:
            Authorization URL for user to visit
        """
        # Generate state for CSRF protection
        state = secrets.token_urlsafe(32)
        
        # Store state with user info (use Redis if available, otherwise in-memory)
        state_data = {
            "user_id": user_id,
            "timestamp": datetime.utcnow().isoformat(),
            "scopes": additional_scopes or []
        }
        
        if USE_REDIS and redis_client:
            # Store in Redis with 10-minute expiration
            # Wrap in try-except to fallback to in-memory if Redis fails
            try:
                redis_client.setex(
                    f"oauth_state:{state}",
                    600,  # 10 minutes
                    json.dumps(state_data)
                )
                logger.info(f"Stored OAuth state in Redis: {state[:20]}...")
            except Exception as redis_error:
                logger.warning(f"Redis storage failed, falling back to in-memory: {redis_error}")
                # Fallback to in-memory storage
                STATE_STORE[state] = {
                    "user_id": user_id,
                    "timestamp": datetime.utcnow(),
                    "scopes": additional_scopes or []
                }
                logger.info(f"Stored OAuth state in memory (Redis fallback): {state[:20]}...")
        else:
            # Fallback to in-memory storage
            STATE_STORE[state] = {
                "user_id": user_id,
                "timestamp": datetime.utcnow(),
                "scopes": additional_scopes or []
            }
            logger.info(f"Stored OAuth state in memory: {state[:20]}...")
        
        # Combine scopes
        all_scopes = self.config.scopes.copy()
        if additional_scopes:
            all_scopes.extend(additional_scopes)
        
        # Build authorization URL
        params = {
            "client_id": self.config.app_id,
            "redirect_uri": self.config.redirect_uri,
            "scope": ",".join(all_scopes),
            "response_type": "code",
            "state": state,
            "auth_type": "rerequest",  # Force re-request permissions and allow account switching
            "display": "popup"  # Use popup display mode
        }
        
        return f"{self.oauth_base_url}?{urlencode(params)}"
    
    async def exchange_code_for_token(self, code: str, state: str) -> Dict[str, Any]:
        """
        Exchange authorization code for access token
        
        Args:
            code: Authorization code from Facebook
            state: State parameter for CSRF protection
            
        Returns:
            Token exchange result with user info and pages
        """
        try:
            # Verify state (check Redis first, then fallback to in-memory)
            logger.info(f"Verifying state parameter. State received: {state[:20]}...")
            
            state_data = None
            if USE_REDIS and redis_client:
                # Try to get from Redis with error handling
                try:
                    redis_key = f"oauth_state:{state}"
                    stored_data = redis_client.get(redis_key)
                    if stored_data:
                        state_data = json.loads(stored_data)
                        # Convert timestamp back to datetime if needed
                        if isinstance(state_data.get("timestamp"), str):
                            state_data["timestamp"] = datetime.fromisoformat(state_data["timestamp"])
                        # Delete from Redis after use
                        redis_client.delete(redis_key)
                        logger.info(f"State found in Redis: {state[:20]}...")
                except Exception as redis_error:
                    logger.warning(f"Redis retrieval failed, checking in-memory store: {redis_error}")
                    # Fall through to in-memory check
            
            # Fallback to in-memory storage
            if not state_data:
                if state not in STATE_STORE:
                    logger.error(f"State {state[:20]}... not found in store. Available states: {list(STATE_STORE.keys())[:3] if STATE_STORE else 'none'}")
                    raise ValueError(f"Invalid state parameter: State not found in store. This may happen if the backend restarted. Please try connecting again.")
                state_data = STATE_STORE[state]
                # Clean up from in-memory store
                try:
                    del STATE_STORE[state]
                except KeyError:
                    pass
                logger.info(f"State found in memory: {state[:20]}...")
            
            user_id = state_data["user_id"]
            logger.info(f"State verified. User ID: {user_id}")
            
            # Exchange code for token
            token_url = f"{self.api_base_url}/oauth/access_token"
            token_params = {
                "client_id": self.config.app_id,
                "client_secret": self.config.app_secret,
                "redirect_uri": self.config.redirect_uri,
                "code": code
            }
            
            if not self.session:
                raise RuntimeError("Session not initialized")
            
            async with self.session.get(token_url, params=token_params) as response:
                if response.status != 200:
                    error_text = await response.text()
                    raise Exception(f"Token exchange failed: {response.status} - {error_text}")
                
                token_data = await response.json()
                access_token = token_data.get("access_token")
                
                if not access_token:
                    raise Exception("No access token received")
            
            # Get user information
            user_info = await self._get_user_info(access_token)
            
            # Get user's pages (for posting)
            pages = await self._get_user_pages(access_token)
            
            # Get token expiration
            expires_in = token_data.get("expires_in", 0)
            expires_at = datetime.utcnow() + timedelta(seconds=expires_in) if expires_in > 0 else None
            
            return {
                "success": True,
                "user_id": user_id,
                "access_token": access_token,
                "expires_at": expires_at,
                "user_info": user_info,
                "pages": pages,
                "scopes": token_data.get("granted_scopes", "").split(",")
            }
            
        except Exception as e:
            logger.error(f"Error exchanging code for token: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def _get_user_info(self, access_token: str) -> FacebookUserInfo:
        """Get user information from Facebook"""
        try:
            url = f"{self.api_base_url}/me"
            params = {
                "access_token": access_token,
                "fields": "id,name,email,picture"
            }
            
            if not self.session:
                raise RuntimeError("Session not initialized")
            
            async with self.session.get(url, params=params) as response:
                if response.status != 200:
                    raise Exception(f"Failed to get user info: {response.status}")
                
                data = await response.json()
                
                return FacebookUserInfo(
                    user_id=data["id"],
                    name=data["name"],
                    email=data.get("email"),
                    picture_url=data.get("picture", {}).get("data", {}).get("url")
                )
                
        except Exception as e:
            logger.error(f"Error getting user info: {str(e)}")
            raise
    
    async def _get_user_pages(self, access_token: str) -> List[FacebookPageInfo]:
        """Get user's Facebook pages for posting"""
        try:
            url = f"{self.api_base_url}/me/accounts"
            params = {
                "access_token": access_token,
                "fields": "id,name,access_token,category"
            }
            
            if not self.session:
                raise RuntimeError("Session not initialized")
            
            async with self.session.get(url, params=params) as response:
                if response.status != 200:
                    logger.warning(f"Failed to get pages: {response.status}")
                    return []
                
                data = await response.json()
                pages = []
                
                for page_data in data.get("data", []):
                    pages.append(FacebookPageInfo(
                        page_id=page_data["id"],
                        name=page_data["name"],
                        access_token=page_data["access_token"],
                        category=page_data.get("category", "")
                    ))
                
                return pages
                
        except Exception as e:
            logger.error(f"Error getting user pages: {str(e)}")
            return []
    
    async def refresh_access_token(self, refresh_token: str) -> Dict[str, Any]:
        """
        Refresh an expired access token
        
        Args:
            refresh_token: Refresh token from initial OAuth2 flow
            
        Returns:
            New access token information
        """
        try:
            url = f"{self.api_base_url}/oauth/access_token"
            params = {
                "grant_type": "fb_exchange_token",
                "client_id": self.config.app_id,
                "client_secret": self.config.app_secret,
                "fb_exchange_token": refresh_token
            }
            
            if not self.session:
                raise RuntimeError("Session not initialized")
            
            async with self.session.get(url, params=params) as response:
                if response.status != 200:
                    error_text = await response.text()
                    raise Exception(f"Token refresh failed: {response.status} - {error_text}")
                
                data = await response.json()
                access_token = data.get("access_token")
                
                if not access_token:
                    raise Exception("No access token received")
                
                expires_in = data.get("expires_in", 0)
                expires_at = datetime.utcnow() + timedelta(seconds=expires_in) if expires_in > 0 else None
                
                return {
                    "success": True,
                    "access_token": access_token,
                    "expires_at": expires_at
                }
                
        except Exception as e:
            logger.error(f"Error refreshing token: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def validate_token(self, access_token: str) -> Dict[str, Any]:
        """
        Validate an access token
        
        Args:
            access_token: Facebook access token to validate
            
        Returns:
            Token validation result
        """
        try:
            url = f"{self.api_base_url}/me"
            params = {
                "access_token": access_token,
                "fields": "id"
            }
            
            if not self.session:
                raise RuntimeError("Session not initialized")
            
            async with self.session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    return {
                        "valid": True,
                        "user_id": data.get("id")
                    }
                else:
                    return {
                        "valid": False,
                        "error": f"Token validation failed: {response.status}"
                    }
                    
        except Exception as e:
            logger.error(f"Error validating token: {str(e)}")
            return {
                "valid": False,
                "error": str(e)
            }

def get_facebook_oauth_config() -> FacebookOAuthConfig:
    """
    Get Facebook OAuth2 configuration from environment variables
    
    Returns:
        FacebookOAuthConfig object
    """
    import os
    from dotenv import load_dotenv
    from pathlib import Path
    
    # Load .env file if it exists (pydantic-settings may not load all vars)
    # Find .env file relative to this file or backend directory
    backend_dir = Path(__file__).parent.parent.parent
    env_file = backend_dir / ".env"
    if env_file.exists():
        load_dotenv(env_file, override=False)  # Don't override existing env vars
    
    app_id = os.getenv("FACEBOOK_APP_ID")
    app_secret = os.getenv("FACEBOOK_APP_SECRET")
    redirect_uri = os.getenv("FACEBOOK_REDIRECT_URI", "http://localhost:3000/auth/facebook/callback")
    
    if not app_id or not app_secret:
        raise ValueError("Facebook OAuth2 credentials not configured. Set FACEBOOK_APP_ID and FACEBOOK_APP_SECRET")
    
    return FacebookOAuthConfig(
        app_id=app_id,
        app_secret=app_secret,
        redirect_uri=redirect_uri
    )
