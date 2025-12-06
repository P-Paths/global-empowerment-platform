"""
User Platform Connection Model
Stores OAuth2 tokens and connection data for each user's platform accounts
"""

from sqlalchemy import Column, String, DateTime, Text, Boolean, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.core.database import Base

class UserPlatformConnection(Base):
    """User platform connection model for storing OAuth2 tokens"""
    
    __tablename__ = "user_platform_connections"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    platform = Column(String(50), nullable=False)  # 'facebook', 'craigslist', 'offerup', etc.
    platform_user_id = Column(String(255))  # User's ID on the platform
    platform_username = Column(String(255))  # User's username/display name on platform
    access_token = Column(Text)  # Encrypted OAuth2 access token
    refresh_token = Column(Text)  # Encrypted OAuth2 refresh token (if available)
    token_expires_at = Column(DateTime)  # When the token expires
    scopes = Column(ARRAY(String))  # OAuth2 scopes granted
    platform_data = Column(JSON)  # Additional platform-specific data
    is_active = Column(Boolean, default=True)  # Whether the connection is active
    last_used_at = Column(DateTime)  # When the connection was last used
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("Profile", back_populates="platform_connections")
    
    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "platform": self.platform,
            "platform_user_id": self.platform_user_id,
            "platform_username": self.platform_username,
            "token_expires_at": self.token_expires_at.isoformat() if self.token_expires_at else None,
            "scopes": self.scopes,
            "platform_data": self.platform_data,
            "is_active": self.is_active,
            "last_used_at": self.last_used_at.isoformat() if self.last_used_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
    
    def to_dict_safe(self):
        """Convert to dictionary without sensitive data (access tokens)"""
        data = self.to_dict()
        # Remove sensitive fields
        data.pop("access_token", None)
        data.pop("refresh_token", None)
        
        # Clean platform_data of sensitive information
        if self.platform_data and isinstance(self.platform_data, dict):
            safe_platform_data = self.platform_data.copy()
            if "pages" in safe_platform_data:
                safe_pages = []
                for page in safe_platform_data["pages"]:
                    safe_page = page.copy()
                    safe_page.pop("access_token", None)
                    safe_pages.append(safe_page)
                safe_platform_data["pages"] = safe_pages
            data["platform_data"] = safe_platform_data
        
        return data
    
    @classmethod
    def create_facebook_connection(
        cls,
        user_id,  # Can be UUID or string
        platform_user_id: str,
        platform_username: str,
        access_token: str,
        token_expires_at: datetime = None,
        scopes: list = None,
        user_info: dict = None,
        pages: list = None
    ):
        """Create a new Facebook platform connection"""
        import uuid as uuid_lib
        
        # Convert user_id to UUID if it's a string
        if isinstance(user_id, str):
            try:
                user_id = uuid_lib.UUID(user_id)
            except ValueError:
                raise ValueError(f"Invalid user_id format: {user_id}")
        
        platform_data = {}
        
        if user_info:
            platform_data["user_info"] = user_info
        
        if pages:
            platform_data["pages"] = pages
        
        return cls(
            user_id=user_id,
            platform="facebook",
            platform_user_id=platform_user_id,
            platform_username=platform_username,
            access_token=access_token,
            token_expires_at=token_expires_at,
            scopes=scopes or [],
            platform_data=platform_data,
            is_active=True,
            last_used_at=datetime.utcnow()
        )
    
    def is_token_expired(self) -> bool:
        """Check if the access token is expired"""
        if not self.token_expires_at:
            return False
        return datetime.utcnow() > self.token_expires_at
    
    def update_last_used(self):
        """Update the last_used_at timestamp"""
        self.last_used_at = datetime.utcnow()
    
    def deactivate(self):
        """Deactivate the connection"""
        self.is_active = False
    
    def activate(self):
        """Activate the connection"""
        self.is_active = True
