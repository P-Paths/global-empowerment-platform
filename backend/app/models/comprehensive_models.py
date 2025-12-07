"""
Comprehensive SQLAlchemy models for Accorria multi-agent system
"""
from sqlalchemy import Column, String, Float, Integer, DateTime, Text, JSON, Boolean, Numeric, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

Base = declarative_base()


class User(Base):
    """User model for internal users (no PII)"""
    
    __tablename__ = "users"
    
    user_id = Column(Integer, primary_key=True, autoincrement=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    user_type = Column(String(50))  # buyer, seller, agent, etc.
    is_active = Column(Boolean, default=True)
    
    # Relationships
    sessions = relationship("Session", back_populates="user")
    cars = relationship("Car", back_populates="seller")
    messages_sent = relationship("Message", foreign_keys="Message.sender_id", back_populates="sender")
    messages_received = relationship("Message", foreign_keys="Message.receiver_id", back_populates="receiver")
    
    def to_dict(self):
        return {
            "user_id": self.user_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "user_type": self.user_type,
            "is_active": self.is_active
        }


class Session(Base):
    """Session tracking for analytics"""
    
    __tablename__ = "sessions"
    
    session_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(Integer, ForeignKey("users.user_id"))
    login_time = Column(DateTime)
    logout_time = Column(DateTime)
    user_agent = Column(Text)
    location_city = Column(String(100))
    location_region = Column(String(100))
    location_country = Column(String(100))
    platform = Column(String(50))  # web, mobile, etc.
    ip_masked = Column(String(100))
    
    # Relationships
    user = relationship("User", back_populates="sessions")
    events = relationship("Event", back_populates="session")
    
    def to_dict(self):
        return {
            "session_id": self.session_id,
            "user_id": self.user_id,
            "login_time": self.login_time.isoformat() if self.login_time else None,
            "logout_time": self.logout_time.isoformat() if self.logout_time else None,
            "user_agent": self.user_agent,
            "location_city": self.location_city,
            "location_region": self.location_region,
            "location_country": self.location_country,
            "platform": self.platform,
            "ip_masked": self.ip_masked
        }


class Marketplace(Base):
    """Marketplace platforms"""
    
    __tablename__ = "marketplaces"
    
    marketplace_id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100))
    platform_type = Column(String(50))  # FB, Craigslist, OfferUp, etc.
    group_id = Column(String(100))
    location_city = Column(String(100))
    location_region = Column(String(100))
    
    # Relationships
    cars = relationship("Car", back_populates="marketplace")
    
    def to_dict(self):
        return {
            "marketplace_id": self.marketplace_id,
            "name": self.name,
            "platform_type": self.platform_type,
            "group_id": self.group_id,
            "location_city": self.location_city,
            "location_region": self.location_region
        }


class Car(Base):
    """Car/Item listings"""
    
    __tablename__ = "cars"
    
    car_id = Column(Integer, primary_key=True, autoincrement=True)
    marketplace_id = Column(Integer, ForeignKey("marketplaces.marketplace_id"))
    seller_id = Column(Integer, ForeignKey("users.user_id"))
    year = Column(Integer)
    make = Column(String(100))
    model = Column(String(100))
    trim = Column(String(100))
    vin = Column(String(100))
    color = Column(String(50))
    price = Column(Numeric)
    mileage = Column(Integer)
    posted_at = Column(DateTime)
    status = Column(String(50))  # active, sold, removed, etc.
    description = Column(Text)
    images = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    marketplace = relationship("Marketplace", back_populates="cars")
    seller = relationship("User", back_populates="cars")
    events = relationship("Event", back_populates="car")
    messages = relationship("Message", back_populates="car")
    
    def to_dict(self):
        return {
            "car_id": self.car_id,
            "marketplace_id": self.marketplace_id,
            "seller_id": self.seller_id,
            "year": self.year,
            "make": self.make,
            "model": self.model,
            "trim": self.trim,
            "vin": self.vin,
            "color": self.color,
            "price": float(self.price) if self.price else None,
            "mileage": self.mileage,
            "posted_at": self.posted_at.isoformat() if self.posted_at else None,
            "status": self.status,
            "description": self.description,
            "images": self.images,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }


class Event(Base):
    """Event tracking for analytics"""
    
    __tablename__ = "events"
    
    event_id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String, ForeignKey("sessions.session_id"))
    user_id = Column(Integer, ForeignKey("users.user_id"))
    car_id = Column(Integer, ForeignKey("cars.car_id"))
    event_type = Column(String(100))  # click, view, search, etc.
    event_detail = Column(Text)  # button name, filter, etc.
    timestamp = Column(DateTime, default=datetime.utcnow)
    platform = Column(String(50))
    page = Column(String(100))
    element = Column(String(100))
    referrer = Column(String(200))
    
    # Relationships
    session = relationship("Session", back_populates="events")
    user = relationship("User")
    car = relationship("Car", back_populates="events")
    
    def to_dict(self):
        return {
            "event_id": self.event_id,
            "session_id": self.session_id,
            "user_id": self.user_id,
            "car_id": self.car_id,
            "event_type": self.event_type,
            "event_detail": self.event_detail,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "platform": self.platform,
            "page": self.page,
            "element": self.element,
            "referrer": self.referrer
        }


class Message(Base):
    """Messages/Chats"""
    
    __tablename__ = "messages"
    
    message_id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String, ForeignKey("sessions.session_id"))
    sender_id = Column(Integer, ForeignKey("users.user_id"))
    receiver_id = Column(Integer, ForeignKey("users.user_id"))
    car_id = Column(Integer, ForeignKey("cars.car_id"))
    message_type = Column(String(50))  # text, image, emoji, etc.
    content = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)
    sentiment = Column(String(20))
    keywords = Column(Text)
    
    # Relationships
    sender = relationship("User", foreign_keys=[sender_id], back_populates="messages_sent")
    receiver = relationship("User", foreign_keys=[receiver_id], back_populates="messages_received")
    car = relationship("Car", back_populates="messages")
    
    def to_dict(self):
        return {
            "message_id": self.message_id,
            "session_id": self.session_id,
            "sender_id": self.sender_id,
            "receiver_id": self.receiver_id,
            "car_id": self.car_id,
            "message_type": self.message_type,
            "content": self.content,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "sentiment": self.sentiment,
            "keywords": self.keywords
        }


class DealAnalysis(Base):
    """Deal analysis for multi-agent system"""
    
    __tablename__ = "deal_analysis"
    
    analysis_id = Column(Integer, primary_key=True, autoincrement=True)
    car_id = Column(Integer, ForeignKey("cars.car_id"))
    scout_score = Column(Float)  # 0.00 to 1.00
    valuation_score = Column(Float)
    inspection_score = Column(Float)
    negotiator_score = Column(Float)
    orchestrator_score = Column(Float)
    overall_score = Column(Float)
    profit_potential = Column(Numeric)
    risk_level = Column(String(20))  # low, medium, high
    recommended_action = Column(String(100))
    analysis_notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            "analysis_id": self.analysis_id,
            "car_id": self.car_id,
            "scout_score": self.scout_score,
            "valuation_score": self.valuation_score,
            "inspection_score": self.inspection_score,
            "negotiator_score": self.negotiator_score,
            "orchestrator_score": self.orchestrator_score,
            "overall_score": self.overall_score,
            "profit_potential": float(self.profit_potential) if self.profit_potential else None,
            "risk_level": self.risk_level,
            "recommended_action": self.recommended_action,
            "analysis_notes": self.analysis_notes,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class AgentPerformance(Base):
    """Agent performance tracking"""
    
    __tablename__ = "agent_performance"
    
    performance_id = Column(Integer, primary_key=True, autoincrement=True)
    agent_id = Column(Integer, ForeignKey("users.user_id"))
    agent_type = Column(String(50))  # scout, valuation, inspection, etc.
    success_rate = Column(Float)  # 0.0000 to 1.0000
    total_actions = Column(Integer)
    successful_actions = Column(Integer)
    average_response_time = Column(Integer)  # milliseconds
    last_updated = Column(DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            "performance_id": self.performance_id,
            "agent_id": self.agent_id,
            "agent_type": self.agent_type,
            "success_rate": self.success_rate,
            "total_actions": self.total_actions,
            "successful_actions": self.successful_actions,
            "average_response_time": self.average_response_time,
            "last_updated": self.last_updated.isoformat() if self.last_updated else None
        }


# Additional models for completeness
class Search(Base):
    """Search tracking"""
    __tablename__ = "searches"
    
    search_id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String, ForeignKey("sessions.session_id"))
    user_id = Column(Integer, ForeignKey("users.user_id"))
    search_term = Column(String(200))
    filters_applied = Column(JSON)
    sort_order = Column(String(50))
    results_count = Column(Integer)
    timestamp = Column(DateTime, default=datetime.utcnow)


class Recommendation(Base):
    """Recommendations"""
    __tablename__ = "recommendations"
    
    recommendation_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    agent_id = Column(Integer, ForeignKey("users.user_id"))
    car_id = Column(Integer, ForeignKey("cars.car_id"))
    recommendation = Column(Text)
    made_at = Column(DateTime, default=datetime.utcnow)
    accepted = Column(Boolean)
    feedback = Column(Text)


class AgentLog(Base):
    """Agent logs"""
    __tablename__ = "agent_logs"
    
    agent_log_id = Column(Integer, primary_key=True, autoincrement=True)
    agent_id = Column(Integer, ForeignKey("users.user_id"))
    session_id = Column(String, ForeignKey("sessions.session_id"))
    action = Column(String(100))
    script_used = Column(Text)
    result = Column(String(100))
    timestamp = Column(DateTime, default=datetime.utcnow)


class Conversion(Base):
    """Conversions"""
    __tablename__ = "conversions"
    
    conversion_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    car_id = Column(Integer, ForeignKey("cars.car_id"))
    session_id = Column(String, ForeignKey("sessions.session_id"))
    conversion_type = Column(String(100))  # purchase, bid, etc.
    amount = Column(Numeric)
    timestamp = Column(DateTime, default=datetime.utcnow) 