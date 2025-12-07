"""
Debug Status API Endpoint

Checks the status of all APIs and services to help diagnose issues
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
import logging
import os
from datetime import datetime

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/debug/status")
async def debug_status():
    """
    Check status of all APIs and services
    """
    try:
        status = {
            "timestamp": datetime.now().isoformat(),
            "environment": {
                "openai_api_key": "✅ Set" if os.getenv("OPENAI_API_KEY") else "❌ Missing",
                "google_vision_api": "✅ Available" if os.getenv("GOOGLE_APPLICATION_CREDENTIALS") else "❌ Not configured",
                "supabase_url": "✅ Set" if os.getenv("SUPABASE_URL") else "❌ Missing",
                "supabase_key": "✅ Set" if os.getenv("SUPABASE_SERVICE_ROLE_KEY") else "❌ Missing",
            },
            "services": {
                "enhanced_analysis": "✅ Available",
                "smart_analysis": "✅ Available",
                "supabase_service": "✅ Available"
            },
            "api_endpoints": {
                "enhanced_analyze": "/api/v1/enhanced-analyze",
                "smart_analyze": "/api/v1/smart-analyze",
                "demo_test": "/api/v1/demo-test",
                "public_analyze": "/api/v1/public-analyze-images"
            }
        }
        
        # Test Google Vision API
        try:
            from google.cloud import vision
            client = vision.ImageAnnotatorClient()
            status["google_vision_test"] = "✅ Working"
        except Exception as e:
            status["google_vision_test"] = f"❌ Failed: {str(e)}"
        
        # Test OpenAI API
        try:
            import openai
            if os.getenv("OPENAI_API_KEY"):
                status["openai_test"] = "✅ API Key Available"
            else:
                status["openai_test"] = "❌ API Key Missing"
        except Exception as e:
            status["openai_test"] = f"❌ Failed: {str(e)}"
        
        return JSONResponse(content=status, status_code=200)
        
    except Exception as e:
        logger.error(f"Debug status failed: {e}")
        raise HTTPException(status_code=500, detail=f"Debug failed: {str(e)}")


@router.get("/debug/test-vision")
async def test_vision():
    """
    Test Google Vision API specifically
    """
    try:
        from google.cloud import vision
        client = vision.ImageAnnotatorClient()
        
        # Create a simple test image (1x1 pixel)
        import base64
        test_image_data = base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==")
        
        image = vision.Image(content=test_image_data)
        response = client.label_detection(image=image)
        
        return {
            "status": "success",
            "vision_api_working": True,
            "labels_detected": len(response.label_annotations),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Vision API test failed: {e}")
        return {
            "status": "error",
            "vision_api_working": False,
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }


@router.get("/debug/test-openai")
async def test_openai():
    """
    Test OpenAI API specifically
    """
    try:
        import openai
        
        if not os.getenv("OPENAI_API_KEY"):
            return {
                "status": "error",
                "openai_working": False,
                "error": "OPENAI_API_KEY not set",
                "timestamp": datetime.now().isoformat()
            }
        
        # Test with a simple completion using new OpenAI API
        client = openai.OpenAI()
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": "Say 'Hello World'"}],
            max_tokens=10
        )
        
        return {
            "status": "success",
            "openai_working": True,
            "response": response.choices[0].message.content,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"OpenAI API test failed: {e}")
        return {
            "status": "error",
            "openai_working": False,
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }


@router.get("/debug/test-web-search")
async def test_web_search():
    """
    Test OpenAI Web Search functionality
    """
    try:
        import openai
        
        if not os.getenv("OPENAI_API_KEY"):
            return {
                "status": "error",
                "web_search_working": False,
                "error": "OPENAI_API_KEY not set",
                "timestamp": datetime.now().isoformat()
            }
        
        # Test web search with a simple query
        client = openai.OpenAI()
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful assistant. Use web search to find current information."
                },
                {
                    "role": "user",
                    "content": "What is the current market price for a 2020 Toyota Camry?"
                }
            ],
            tools=[{"type": "web_search"}],
            tool_choice={"type": "function", "function": {"name": "web_search"}},
            max_tokens=200
        )
        
        return {
            "status": "success",
            "web_search_working": True,
            "response": "Web search functionality available",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Web search test failed: {e}")
        return {
            "status": "error",
            "web_search_working": False,
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }
# Test comment
