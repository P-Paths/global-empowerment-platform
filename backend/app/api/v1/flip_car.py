"""
Flip Car API - Main endpoint for car flipping pipeline

This endpoint processes car images and returns listing ingredients
for the car flipping workflow.
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from typing import Optional, Dict, Any
import json
import logging
from datetime import datetime

from app.agents import OrchestratorAgent, VisualAgent

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/flip-car")
async def flip_car(
    image: Optional[UploadFile] = File(None),
    car_info: Optional[str] = Form(None),
    image_url: Optional[str] = Form(None),
    image_path: Optional[str] = Form(None)
):
    """
    Main endpoint for car flipping pipeline
    
    Accepts:
    - image: Uploaded car image file
    - car_info: JSON string with car details (make, model, year, etc.)
    - image_url: Optional URL to car image
    
    Returns:
    - Structured JSON with listing ingredients
    """
    try:
        # Parse car info
        car_data = {}
        if car_info:
            try:
                car_data = json.loads(car_info)
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Invalid car_info JSON")
        
        # Prepare input data for agents
        input_data = {
            "car_info": car_data,
            "processing_timestamp": datetime.now().isoformat()
        }
        
        # Handle image upload
        if image:
            # Save uploaded image (for MVP, we'll use a mock path)
            # TODO: Implement actual file saving
            input_data["image_path"] = f"/tmp/uploaded_{image.filename}"
            logger.info(f"Processing uploaded image: {image.filename}")
        
        # Handle image URL
        if image_url:
            input_data["image_url"] = image_url
            logger.info(f"Processing image URL: {image_url}")
        
        # Handle image path
        if image_path:
            input_data["image_path"] = image_path
            logger.info(f"Processing image path: {image_path}")
        
        # Initialize orchestrator agent
        orchestrator = OrchestratorAgent()
        
        # Process through agents
        result = await orchestrator.process(input_data)
        
        if not result.success:
            raise HTTPException(status_code=500, detail=f"Agent processing failed: {result.error_message}")
        
        # Format response
        response_data = {
            "status": "success",
            "agent": "OrchestratorAgent",
            "confidence": result.confidence,
            "data": result.data,
            "timestamp": result.timestamp.isoformat()
        }
        
        return JSONResponse(content=response_data, status_code=200)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Flip car error: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/flip-car-simple")
async def flip_car_simple(
    image_path: str = Form(...),
    car_make: Optional[str] = Form(None),
    car_model: Optional[str] = Form(None),
    car_year: Optional[int] = Form(None)
):
    """
    Simplified flip car endpoint for testing
    
    Accepts:
    - image_path: Path to car image
    - car_make: Car make (optional)
    - car_model: Car model (optional) 
    - car_year: Car year (optional)
    
    Returns:
    - Features detected from image
    """
    try:
        # Prepare car info
        car_info = {}
        if car_make:
            car_info["make"] = car_make
        if car_model:
            car_info["model"] = car_model
        if car_year:
            car_info["year"] = car_year
        
        # Initialize visual agent
        visual_agent = VisualAgent()
        
        # Process image
        input_data = {
            "image_path": image_path,
            "car_info": car_info
        }
        
        result = await visual_agent.process(input_data)
        
        if not result.success:
            raise HTTPException(status_code=500, detail=f"Visual analysis failed: {result.error_message}")
        
        # Format response
        response_data = {
            "agent": "VisualAgent",
            "status": "success",
            "confidence": result.confidence,
            "data": result.data
        }
        
        return JSONResponse(content=response_data, status_code=200)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Flip car simple error: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/flip-car-test")
async def flip_car_test():
    """
    Test endpoint for flip car functionality
    
    Returns mock data for testing with Supabase integration
    """
    try:
        # Import Supabase service
        from app.services.supabase_service import supabase_service
        
        # Mock input data
        input_data = {
            "image_path": "/mock/path/to/car.jpg",
            "car_info": {
                "make": "Honda",
                "model": "Civic",
                "year": 2019
            }
        }
        
        # Initialize visual agent
        visual_agent = VisualAgent()
        
        # Process mock data
        result = await visual_agent.process(input_data)
        
        # Save to Supabase for testing
        car_analysis_data = {
            "agent": "VisualAgent",
            "status": "success",
            "confidence": result.confidence,
            "data": result.data,
            "test_mode": True,
            "timestamp": datetime.now().isoformat(),
            "car_info": input_data["car_info"]
        }
        
        # Save to Supabase
        supabase_result = await supabase_service.save_car_analysis(car_analysis_data)
        
        # Format response
        response_data = {
            "agent": "VisualAgent",
            "status": "success",
            "confidence": result.confidence,
            "data": result.data,
            "test_mode": True,
            "supabase": supabase_result,
            "message": "✅ Car analysis saved to Supabase for testing"
        }
        
        return JSONResponse(content=response_data, status_code=200)
        
    except Exception as e:
        logger.error(f"Flip car test error: {e}")
        raise HTTPException(status_code=500, detail=f"Test error: {str(e)}") 