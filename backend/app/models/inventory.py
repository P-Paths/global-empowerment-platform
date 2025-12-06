"""
Inventory Model - Dealer Inventory Management
"""

from sqlalchemy import Column, String, Integer, Float, DateTime, Text, JSON
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class InventoryItem(Base):
    __tablename__ = "inventory_items"
    
    id = Column(String, primary_key=True)
    dealer_id = Column(String, nullable=False, index=True)
    vin = Column(String, nullable=False, unique=True, index=True)
    year = Column(Integer, nullable=False)
    make = Column(String, nullable=False)
    model = Column(String, nullable=False)
    mileage = Column(Integer, nullable=False)
    price = Column(Float, nullable=False)
    title_status = Column(String, default="Clean")
    description = Column(Text)
    photo_urls = Column(JSON, default=list)
    status = Column(String, default="active")  # active, sold, removed
    ai_generated_listing = Column(JSON)  # Store AI generated listing data
    listing_generated_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<InventoryItem(id='{self.id}', vin='{self.vin}', make='{self.make}', model='{self.model}')>"
