from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()


class User(Base):
    """User model for internal users (no PII)"""
    
    __tablename__ = "users"
    
    user_id = Column(Integer, primary_key=True, autoincrement=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    user_type = Column(String(50))  # buyer, seller, agent, etc.
    is_active = Column(Boolean, default=True)
    
    def to_dict(self):
        """Convert model to dictionary"""
        return {
            "user_id": self.user_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "user_type": self.user_type,
            "is_active": self.is_active
        } 