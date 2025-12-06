"""
Public Analysis Endpoint - No authentication required for mobile testing
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from datetime import datetime
import logging
from typing import List, Optional

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/public-analyze-images")
async def public_analyze_images(
    images: List[UploadFile] = File(...),
    make: Optional[str] = Form(None),
    model: Optional[str] = Form(None),
    year: Optional[str] = Form(None),
    mileage: Optional[str] = Form(None),
    price: Optional[str] = Form(None),
    lowestPrice: Optional[str] = Form(None),
    description: Optional[str] = Form(None)
):
    """
    Public endpoint for analyzing car images - no authentication required
    
    This endpoint is specifically for mobile testing and demo purposes
    """
    try:
        logger.info(f"Public analysis request received for {len(images)} images")
        
        # Mock successful analysis for demo purposes
        mock_analysis = {
            "success": True,
            "timestamp": datetime.now().isoformat(),
            "image_analysis": {
                "make": make or "Honda",
                "model": model or "Civic", 
                "year": year or "2019",
                "mileage": mileage or "75000",
                "color": "Silver",
                "features_detected": {
                    "car_features": {
                        "exterior": ["clean_exterior", "well_maintained", "alloy_wheels"],
                        "interior": ["leather_seats", "navigation", "heated_seats"],
                        "technology": ["backup_camera", "bluetooth", "apple_carplay"],
                        "safety": ["airbags", "abs", "blind_spot_monitoring"],
                        "modifications": []
                    },
                    "condition_assessment": {
                        "score": 0.85,
                        "overall_condition": "excellent"
                    }
                },
                "analysis_confidence": 0.92,
                "processing_time_seconds": 1.2,
                "vision_api_used": True
            },
            "market_intelligence": {
                "pricing_analysis": {
                    "price_trends": {
                        "trend": "stable",
                        "confidence": 0.8
                    }
                },
                "make_model_analysis": {
                    "demand_analysis": {
                        "demand_level": "high",
                        "market_activity": "active"
                    }
                }
            },
            "price_recommendations": {
                "price_recommendations": {
                    "quick_sale": {
                        "price": int(price) * 0.85 if price else 15000,
                        "description": "Fast sale price",
                        "estimated_days_to_sell": 7
                    },
                    "market_price": {
                        "price": int(price) if price else 18000,
                        "description": "Competitive market price",
                        "estimated_days_to_sell": 14
                    },
                    "top_dollar": {
                        "price": int(price) * 1.15 if price else 21000,
                        "description": "Premium pricing",
                        "estimated_days_to_sell": 30
                    }
                }
            },
            "confidence_score": 0.92,
            "processing_time": 1.2,
            "error_message": None
        }
        
        logger.info("Public analysis completed successfully")
        return JSONResponse(content=mock_analysis, status_code=200)
        
    except Exception as e:
        logger.error(f"Public analysis error: {e}")
        return JSONResponse(
            content={
                "success": False,
                "error_message": f"Analysis failed: {str(e)}",
                "timestamp": datetime.now().isoformat()
            },
            status_code=500
        )


@router.get("/public-test")
async def public_test():
    """
    Simple test endpoint - no authentication required
    """
    return {
        "status": "success",
        "message": "Public endpoint working!",
        "timestamp": datetime.now().isoformat()
    }
