from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
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


class Event(Base):
    """Event logging model for user actions"""
    
    __tablename__ = "events"
    
    event_id = Column(Integer, primary_key=True, autoincrement=True)
    event_type = Column(String(100))
    event_detail = Column(Text)
    user_id = Column(Integer, nullable=True)
    session_id = Column(String(255), nullable=True)
    car_id = Column(Integer, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    platform = Column(String(50))
    page = Column(String(255))
    element = Column(String(255))
    referrer = Column(Text, nullable=True) 