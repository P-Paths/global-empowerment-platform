"""
Inventory Management API - CSV Import and Management
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
import csv
import io
import json
from datetime import datetime
import uuid

from ...core.database import get_sync_db as get_db
from ...models.inventory import InventoryItem
from ...services.car_listing_generator import CarListingGenerator

router = APIRouter()

@router.post("/inventory/import-csv")
async def import_inventory_csv(
    file: UploadFile = File(...),
    dealer_id: str = Form(...),
    db: Session = Depends(get_db)
):
    """
    Import dealer inventory from CSV file
    Expected CSV format:
    VIN,Year,Make,Model,Mileage,Price,Title_Status,Description,Photo_URLs
    """
    try:
        # Read CSV content
        content = await file.read()
        csv_content = content.decode('utf-8')
        
        # Parse CSV
        csv_reader = csv.DictReader(io.StringIO(csv_content))
        imported_items = []
        errors = []
        
        for row_num, row in enumerate(csv_reader, start=2):  # Start at 2 for header
            try:
                # Validate required fields
                required_fields = ['VIN', 'Year', 'Make', 'Model', 'Mileage', 'Price']
                missing_fields = [field for field in required_fields if not row.get(field)]
                
                if missing_fields:
                    errors.append(f"Row {row_num}: Missing required fields: {', '.join(missing_fields)}")
                    continue
                
                # Create inventory item
                inventory_item = InventoryItem(
                    id=str(uuid.uuid4()),
                    dealer_id=dealer_id,
                    vin=row['VIN'].strip(),
                    year=int(row['Year']),
                    make=row['Make'].strip().title(),
                    model=row['Model'].strip().title(),
                    mileage=int(row['Mileage'].replace(',', '').replace(' miles', '')),
                    price=float(row['Price'].replace('$', '').replace(',', '')),
                    title_status=row.get('Title_Status', 'Clean').strip(),
                    description=row.get('Description', '').strip(),
                    photo_urls=row.get('Photo_URLs', '').split(',') if row.get('Photo_URLs') else [],
                    status='active',
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                
                # Save to database
                db.add(inventory_item)
                imported_items.append(inventory_item)
                
            except Exception as e:
                errors.append(f"Row {row_num}: Error processing - {str(e)}")
                continue
        
        # Commit all items
        db.commit()
        
        return {
            "success": True,
            "imported_count": len(imported_items),
            "error_count": len(errors),
            "errors": errors,
            "message": f"Successfully imported {len(imported_items)} vehicles"
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error importing CSV: {str(e)}")

@router.get("/inventory/{dealer_id}")
async def get_dealer_inventory(
    dealer_id: str,
    status: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """
    Get dealer inventory with optional filtering
    """
    try:
        query = db.query(InventoryItem).filter(InventoryItem.dealer_id == dealer_id)
        
        if status:
            query = query.filter(InventoryItem.status == status)
        
        total_count = query.count()
        items = query.offset(offset).limit(limit).all()
        
        return {
            "success": True,
            "items": [
                {
                    "id": item.id,
                    "vin": item.vin,
                    "year": item.year,
                    "make": item.make,
                    "model": item.model,
                    "mileage": item.mileage,
                    "price": item.price,
                    "title_status": item.title_status,
                    "description": item.description,
                    "photo_urls": item.photo_urls,
                    "status": item.status,
                    "created_at": item.created_at.isoformat(),
                    "updated_at": item.updated_at.isoformat()
                }
                for item in items
            ],
            "total_count": total_count,
            "limit": limit,
            "offset": offset
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching inventory: {str(e)}")

@router.post("/inventory/{item_id}/generate-listing")
async def generate_listing_for_item(
    item_id: str,
    db: Session = Depends(get_db)
):
    """
    Generate AI listing for a specific inventory item
    """
    try:
        # Get inventory item
        item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
        if not item:
            raise HTTPException(status_code=404, detail="Inventory item not found")
        
        # Prepare car details
        car_details = {
            "vin": item.vin,
            "year": item.year,
            "make": item.make,
            "model": item.model,
            "mileage": item.mileage,
            "price": item.price,
            "title_status": item.title_status,
            "description": item.description
        }
        
        # Generate listing using AI
        listing_generator = CarListingGenerator()
        
        # For now, we'll generate without images (can add image processing later)
        listing_result = await listing_generator.generate_car_listing(
            images=[],  # TODO: Add image processing
            car_details=car_details,
            location="United States"
        )
        
        # Update inventory item with generated listing
        item.ai_generated_listing = json.dumps(listing_result)
        item.listing_generated_at = datetime.utcnow()
        db.commit()
        
        return {
            "success": True,
            "item_id": item_id,
            "listing": listing_result,
            "message": "AI listing generated successfully"
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error generating listing: {str(e)}")

@router.post("/inventory/bulk-generate-listings")
async def bulk_generate_listings(
    dealer_id: str,
    item_ids: Optional[List[str]] = None,
    db: Session = Depends(get_db)
):
    """
    Generate AI listings for multiple inventory items
    """
    try:
        # Get inventory items
        query = db.query(InventoryItem).filter(InventoryItem.dealer_id == dealer_id)
        
        if item_ids:
            query = query.filter(InventoryItem.id.in_(item_ids))
        
        items = query.filter(InventoryItem.status == 'active').all()
        
        if not items:
            return {
                "success": False,
                "message": "No active inventory items found"
            }
        
        # Generate listings for each item
        listing_generator = CarListingGenerator()
        results = []
        
        for item in items:
            try:
                car_details = {
                    "vin": item.vin,
                    "year": item.year,
                    "make": item.make,
                    "model": item.model,
                    "mileage": item.mileage,
                    "price": item.price,
                    "title_status": item.title_status,
                    "description": item.description
                }
                
                listing_result = await listing_generator.generate_car_listing(
                    images=[],
                    car_details=car_details,
                    location="United States"
                )
                
                # Update item
                item.ai_generated_listing = json.dumps(listing_result)
                item.listing_generated_at = datetime.utcnow()
                
                results.append({
                    "item_id": item.id,
                    "vin": item.vin,
                    "make": item.make,
                    "model": item.model,
                    "success": True
                })
                
            except Exception as e:
                results.append({
                    "item_id": item.id,
                    "vin": item.vin,
                    "make": item.make,
                    "model": item.model,
                    "success": False,
                    "error": str(e)
                })
        
        db.commit()
        
        successful = len([r for r in results if r.get('success')])
        failed = len(results) - successful
        
        return {
            "success": True,
            "total_items": len(items),
            "successful": successful,
            "failed": failed,
            "results": results,
            "message": f"Generated listings for {successful} out of {len(items)} items"
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error bulk generating listings: {str(e)}")

@router.get("/inventory/{item_id}")
async def get_inventory_item(
    item_id: str,
    db: Session = Depends(get_db)
):
    """
    Get specific inventory item with generated listing
    """
    try:
        item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
        if not item:
            raise HTTPException(status_code=404, detail="Inventory item not found")
        
        result = {
            "id": item.id,
            "dealer_id": item.dealer_id,
            "vin": item.vin,
            "year": item.year,
            "make": item.make,
            "model": item.model,
            "mileage": item.mileage,
            "price": item.price,
            "title_status": item.title_status,
            "description": item.description,
            "photo_urls": item.photo_urls,
            "status": item.status,
            "created_at": item.created_at.isoformat(),
            "updated_at": item.updated_at.isoformat()
        }
        
        # Add AI generated listing if available
        if item.ai_generated_listing:
            result["ai_generated_listing"] = json.loads(item.ai_generated_listing)
            result["listing_generated_at"] = item.listing_generated_at.isoformat()
        
        return {
            "success": True,
            "item": result
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching inventory item: {str(e)}")
