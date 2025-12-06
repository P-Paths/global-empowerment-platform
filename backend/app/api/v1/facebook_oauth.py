"""
Facebook OAuth2 API endpoints
Handles user Facebook account connections for multi-tenant posting
"""

from fastapi import APIRouter, HTTPException, Depends, status, Query, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from app.core.database import get_db
from app.core.config import settings
from app.services.facebook_oauth import FacebookOAuthService, get_facebook_oauth_config, FacebookUserInfo, FacebookPageInfo
from app.models.user_platform_connection import UserPlatformConnection
from app.utils.auth import get_current_user_id
import json
import base64
from cryptography.fernet import Fernet
import os

logger = logging.getLogger(__name__)
router = APIRouter()
security = HTTPBearer()

# Encryption for storing tokens securely
def get_encryption_key() -> bytes:
    """Get or generate encryption key for tokens"""
    key = os.getenv("TOKEN_ENCRYPTION_KEY")
    if not key:
        # Generate a new key if none exists (for development)
        key = Fernet.generate_key().decode()
        logger.warning("TOKEN_ENCRYPTION_KEY not set. Generated temporary key for development.")
    else:
        key = key.encode()
    return key

def encrypt_token(token: str) -> str:
    """Encrypt a token for storage"""
    f = Fernet(get_encryption_key())
    return f.encrypt(token.encode()).decode()

def decrypt_token(encrypted_token: str) -> str:
    """Decrypt a stored token"""
    f = Fernet(get_encryption_key())
    return f.decrypt(encrypted_token.encode()).decode()

# Pydantic models
class FacebookConnectionResponse(BaseModel):
    success: bool
    message: str
    connection_id: Optional[str] = None
    user_info: Optional[Dict[str, Any]] = None
    pages: Optional[List[Dict[str, Any]]] = None

class FacebookConnectionStatus(BaseModel):
    connected: bool
    platform: str
    user_info: Optional[Dict[str, Any]] = None
    pages: Optional[List[Dict[str, Any]]] = None
    last_used: Optional[datetime] = None

class FacebookDisconnectRequest(BaseModel):
    platform: str = "facebook"

@router.get("/facebook/connect")
async def initiate_facebook_connection(
    current_user_id: str = Depends(get_current_user_id)
):
    """
    Initiate Facebook OAuth2 connection for the current user
    Returns the authorization URL for the user to visit
    """
    import asyncio
    try:
        logger.info(f"Facebook connect - Initiating connection for user_id: {current_user_id} (type: {type(current_user_id).__name__})")
        
        # Wrap the entire operation in a timeout to prevent hanging
        async def generate_auth_url():
            config = get_facebook_oauth_config()
            
            async with FacebookOAuthService(config) as oauth_service:
                # For now, use only basic scopes that don't require App Review
                # Once App Review is approved, you can add:
                # additional_scopes=["pages_manage_posts", "pages_read_engagement"]
                auth_url = oauth_service.generate_authorization_url(
                    user_id=current_user_id
                    # additional_scopes=["pages_manage_posts", "pages_read_engagement"]
                )
                return auth_url
        
        # Set a 5-second timeout for the entire operation
        auth_url = await asyncio.wait_for(generate_auth_url(), timeout=5.0)
        
        logger.info(f"Facebook connect - Generated auth URL for user_id: {current_user_id}")
        
        return {
            "success": True,
            "authorization_url": auth_url,
            "message": "Visit the authorization URL to connect your Facebook account"
        }
        
    except asyncio.TimeoutError:
        logger.error(f"Facebook connect timed out for user_id: {current_user_id}")
        raise HTTPException(
            status_code=504,
            detail="Facebook connection initiation timed out. Please try again."
        )
    except ValueError as e:
        # Configuration error
        logger.error(f"Facebook OAuth configuration error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Facebook OAuth not configured: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Error initiating Facebook connection: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to initiate Facebook connection: {str(e)}"
        )

@router.get("/facebook/callback")
async def facebook_oauth_callback(
    request: Request,
    code: str = Query(..., description="Authorization code from Facebook"),
    state: str = Query(..., description="State parameter for CSRF protection"),
    db: AsyncSession = Depends(get_db)
):
    """
    Handle Facebook OAuth2 callback
    Exchange code for tokens and store user connection
    """
    try:
        # Try to get authenticated user_id for verification (optional, but recommended)
        authenticated_user_id = None
        try:
            if request:
                authenticated_user_id = get_current_user_id(request)
                logger.info(f"Facebook callback - Authenticated user_id from JWT: {authenticated_user_id}")
        except Exception as e:
            logger.warning(f"Facebook callback - Could not get authenticated user_id: {e}")
        
        config = get_facebook_oauth_config()
        
        async with FacebookOAuthService(config) as oauth_service:
            # Exchange code for token
            result = await oauth_service.exchange_code_for_token(code, state)
            
            if not result["success"]:
                raise HTTPException(
                    status_code=400,
                    detail=f"OAuth2 exchange failed: {result['error']}"
                )
            
            user_id = result["user_id"]
            
            # Verify that the user_id from state matches the authenticated user_id (if available)
            if authenticated_user_id:
                import uuid as uuid_lib
                auth_uuid = authenticated_user_id
                state_uuid = user_id
                
                # Convert both to UUID strings for comparison
                if isinstance(auth_uuid, str):
                    try:
                        auth_uuid = str(uuid_lib.UUID(auth_uuid))
                    except ValueError:
                        pass
                else:
                    auth_uuid = str(auth_uuid)
                    
                if isinstance(state_uuid, str):
                    try:
                        state_uuid = str(uuid_lib.UUID(state_uuid))
                    except ValueError:
                        pass
                else:
                    state_uuid = str(state_uuid)
                
                if auth_uuid != state_uuid:
                    logger.error(f"Facebook callback - User ID mismatch! JWT user_id: {auth_uuid}, State user_id: {state_uuid}")
                    raise HTTPException(
                        status_code=403,
                        detail="User ID mismatch. The connection request does not match your authenticated session."
                    )
                else:
                    logger.info(f"Facebook callback - User ID verified: {auth_uuid} == {state_uuid}")
            access_token = result["access_token"]
            expires_at = result["expires_at"]
            user_info = result["user_info"]
            pages = result["pages"]
            
            logger.info(f"Facebook callback - Received user_id from state: {user_id} (type: {type(user_id).__name__})")
            
            # Convert user_id to UUID if it's a string
            import uuid as uuid_lib
            if isinstance(user_id, str):
                try:
                    user_id = uuid_lib.UUID(user_id)
                    logger.info(f"Facebook callback - Converted user_id to UUID: {user_id}")
                except ValueError:
                    logger.error(f"Invalid user_id format: {user_id}")
                    raise HTTPException(
                        status_code=400,
                        detail=f"Invalid user ID format"
                    )
            else:
                logger.info(f"Facebook callback - user_id already UUID: {user_id}")
            
            # Store connection in database
            # Check if connection already exists
            existing_connection = await db.execute(
                select(UserPlatformConnection)
                .where(
                    UserPlatformConnection.user_id == user_id,
                    UserPlatformConnection.platform == "facebook"
                )
            )
            existing = existing_connection.scalar_one_or_none()
            
            # Prepare platform data
            platform_data = {
                "user_info": {
                    "name": user_info.name,
                    "email": user_info.email,
                    "picture_url": user_info.picture_url
                },
                "pages": [
                    {
                        "page_id": page.page_id,
                        "name": page.name,
                        "access_token": encrypt_token(page.access_token),
                        "category": page.category
                    }
                    for page in pages
                ]
            }
            
            if existing:
                # Update existing connection
                existing.access_token = encrypt_token(access_token)
                existing.token_expires_at = expires_at
                existing.scopes = result["scopes"]
                existing.platform_data = platform_data
                existing.is_active = True
                existing.last_used_at = datetime.utcnow()
                existing.updated_at = datetime.utcnow()
                connection_id = str(existing.id)
            else:
                # Create new connection
                new_connection = UserPlatformConnection.create_facebook_connection(
                    user_id=user_id,
                    platform_user_id=user_info.user_id,
                    platform_username=user_info.name,
                    access_token=encrypt_token(access_token),
                    token_expires_at=expires_at,
                    scopes=result["scopes"],
                    user_info=platform_data["user_info"],
                    pages=platform_data["pages"]
                )
                db.add(new_connection)
                # Flush to get the ID assigned
                await db.flush()
                connection_id = str(new_connection.id)
            
            await db.commit()
            
            # Verify the connection was saved by querying it back
            verify_result = await db.execute(
                select(UserPlatformConnection)
                .where(
                    UserPlatformConnection.user_id == user_id,
                    UserPlatformConnection.platform == "facebook"
                )
            )
            verified_connection = verify_result.scalar_one_or_none()
            
            if verified_connection:
                logger.info(f"Facebook callback - Verified connection saved: user_id={user_id}, connection_id={verified_connection.id}, is_active={verified_connection.is_active}")
            else:
                logger.error(f"Facebook callback - WARNING: Connection not found after commit! user_id={user_id}")
            
            # Ensure connection_id is not None
            if not connection_id:
                logger.error("Connection ID is None after commit")
                raise HTTPException(
                    status_code=500,
                    detail="Failed to create connection: ID not assigned"
                )
            
            response_data = FacebookConnectionResponse(
                success=True,
                message="Facebook account connected successfully",
                connection_id=connection_id,
                user_info={
                    "name": user_info.name,
                    "email": user_info.email,
                    "picture_url": user_info.picture_url
                },
                pages=[
                    {
                        "page_id": page.page_id,
                        "name": page.name,
                        "category": page.category
                    }
                    for page in pages
                ]
            )
            
            logger.info(f"Facebook connection successful for user {user_id}, connection_id: {connection_id}")
            return response_data
            
    except HTTPException:
        # Re-raise HTTPExceptions as-is
        raise
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Error in Facebook OAuth callback: {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"OAuth callback failed: {error_msg}"
        )

@router.get("/facebook/status")
async def get_facebook_connection_status(
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Get the current user's Facebook connection status
    """
    try:
        # Convert user_id to UUID if it's a string
        import uuid as uuid_lib
        if isinstance(current_user_id, str):
            try:
                current_user_id = uuid_lib.UUID(current_user_id)
            except ValueError:
                logger.error(f"Invalid user_id format: {current_user_id}")
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid user ID format"
                )
        
        # Query user's Facebook connection
        result = await db.execute(
            select(UserPlatformConnection)
            .where(
                UserPlatformConnection.user_id == current_user_id,
                UserPlatformConnection.platform == "facebook",
                UserPlatformConnection.is_active == True
            )
        )
        connection = result.scalar_one_or_none()
        
        if not connection:
            return FacebookConnectionStatus(
                connected=False,
                platform="facebook"
            )
        
        # Decrypt and return connection info
        user_info = connection.platform_data.get("user_info", {}) if connection.platform_data else {}
        pages = connection.platform_data.get("pages", []) if connection.platform_data else []
        
        # Remove access tokens from response for security
        safe_pages = [
            {
                "page_id": page["page_id"],
                "name": page["name"],
                "category": page["category"]
            }
            for page in pages
        ]
        
        return FacebookConnectionStatus(
            connected=True,
            platform="facebook",
            user_info=user_info,
            pages=safe_pages,
            last_used=connection.last_used_at
        )
        
    except Exception as e:
        logger.error(f"Error getting Facebook connection status: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get connection status: {str(e)}"
        )

@router.post("/facebook/disconnect")
async def disconnect_facebook(
    request: FacebookDisconnectRequest,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Disconnect user's Facebook account
    """
    try:
        # Convert user_id to UUID if it's a string
        import uuid as uuid_lib
        if isinstance(current_user_id, str):
            try:
                current_user_id = uuid_lib.UUID(current_user_id)
            except ValueError:
                logger.error(f"Invalid user_id format: {current_user_id}")
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid user ID format"
                )
        
        # Deactivate Facebook connection
        await db.execute(
            update(UserPlatformConnection)
            .where(
                UserPlatformConnection.user_id == current_user_id,
                UserPlatformConnection.platform == "facebook"
            )
            .values(is_active=False, updated_at=datetime.utcnow())
        )
        await db.commit()
        
        return {
            "success": True,
            "message": "Facebook account disconnected successfully"
        }
        
    except Exception as e:
        logger.error(f"Error disconnecting Facebook: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to disconnect Facebook: {str(e)}"
        )

@router.get("/facebook/pages")
async def get_user_facebook_pages(
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Get user's Facebook pages for posting
    """
    try:
        # Get user's Facebook connection and pages
        # Note: This is simplified. In production, use proper SQLAlchemy queries
        connection = None  # Placeholder for database query
        
        if not connection:
            raise HTTPException(
                status_code=404,
                detail="Facebook account not connected"
            )
        
        pages = connection.platform_data.get("pages", [])
        
        # Return pages without access tokens
        safe_pages = [
            {
                "page_id": page["page_id"],
                "name": page["name"],
                "category": page["category"]
            }
            for page in pages
        ]
        
        return {
            "success": True,
            "pages": safe_pages
        }
        
    except Exception as e:
        logger.error(f"Error getting Facebook pages: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get Facebook pages: {str(e)}"
        )

@router.post("/facebook/refresh-token")
async def refresh_facebook_token(
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Refresh user's Facebook access token
    """
    try:
        # Get user's current connection
        connection = None  # Placeholder for database query
        
        if not connection:
            raise HTTPException(
                status_code=404,
                detail="Facebook account not connected"
            )
        
        # Check if token needs refresh
        if connection.token_expires_at and connection.token_expires_at > datetime.utcnow():
            return {
                "success": True,
                "message": "Token is still valid",
                "expires_at": connection.token_expires_at
            }
        
        # Refresh token using Facebook API
        config = get_facebook_oauth_config()
        async with FacebookOAuthService(config) as oauth_service:
            # Note: This would need the refresh token, which Facebook doesn't provide
            # In practice, you'd need to re-authenticate the user
            raise HTTPException(
                status_code=400,
                detail="Token refresh not supported. Please reconnect your Facebook account."
            )
        
    except Exception as e:
        logger.error(f"Error refreshing Facebook token: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to refresh token: {str(e)}"
        )
