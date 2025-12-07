from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from app.ai_brain import create_ai_brain
import os

router = APIRouter()

# Initialize AI Brain
ai_brain = create_ai_brain(
    openai_key=os.getenv("OPENAI_API_KEY", "your-openai-api-key"),
    google_key=os.getenv("GOOGLE_API_KEY", "your-google-api-key")
)

class ReplyRequest(BaseModel):
    message: str = Field(..., min_length=1)
    listing_context: Optional[Dict[str, Any]] = None
    task_type: str = "customer_service"

class ReplyResponse(BaseModel):
    reply: str
    brain_used: str
    confidence: Optional[float]
    suggested_delay_minutes: int = 5

@router.post("/generate", response_model=ReplyResponse)
async def generate_reply(request: ReplyRequest):
    """Generate an AI reply to a buyer message"""
    try:
        response = await ai_brain.think(
            prompt=f"Generate a helpful reply to this buyer message: {request.message}",
            task_type=request.task_type,
            context=request.listing_context
        )
        
        return ReplyResponse(
            reply=response.content,
            brain_used=response.brain_type.value,
            confidence=response.confidence,
            suggested_delay_minutes=5
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Reply generation error: {str(e)}")

@router.post("/analyze")
async def analyze_message(message: str, listing_context: Optional[Dict[str, Any]] = None):
    """Analyze a buyer message for intent and sentiment"""
    try:
        analysis_prompt = f"""
        Analyze this buyer message for:
        1. Intent (inquiry, negotiation, complaint, etc.)
        2. Sentiment (positive, negative, neutral)
        3. Urgency level
        4. Key concerns or questions
        5. Suggested response approach
        
        Message: {message}
        """
        
        response = await ai_brain.think(
            prompt=analysis_prompt,
            task_type="analytical",
            context=listing_context
        )
        
        return {
            "analysis": response.content,
            "brain_used": response.brain_type.value,
            "confidence": response.confidence
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Message analysis error: {str(e)}")

@router.get("/ai/status")
async def get_ai_status():
    """Check the status of AI brains"""
    status = ai_brain.get_brain_status()
    return {
        "left_brain_available": status["left_brain_available"],
        "right_brain_available": status["right_brain_available"],
        "message": "Check if your API keys are configured correctly"
    } 