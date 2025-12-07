from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import List, Optional
import openai
import os
from app.core.config import settings

router = APIRouter()

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    useWebSearch: Optional[bool] = False

class ChatResponse(BaseModel):
    response: str
    success: bool

@router.post("/enhanced", response_model=ChatResponse)
async def enhanced_chat(request: ChatRequest):
    """
    Enhanced chat endpoint for Accorria AI agent
    """
    try:
        print(f"DEBUG: Chat request received: {request}")
        print(f"DEBUG: Messages: {request.messages}")
        print(f"DEBUG: useWebSearch: {request.useWebSearch}")
        # Get OpenAI API key
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="OpenAI API key not configured")
        
        # Set up OpenAI client
        client = openai.OpenAI(api_key=api_key)
        
        # Add system message for Accorria context
        system_message = {
            "role": "system",
            "content": """You are Accorria's AI deal agent. You help people list cars and homes for sale on the Accorria platform.

Key capabilities:
- Generate professional listings from photos/specs
- Provide pricing guidance based on market data
- Coach negotiation strategies
- Explain escrow and closing processes
- Help with listing optimization and marketing
- Use web search for current market data when needed
- Analyze images to extract vehicle/property details

RESPONSE FORMATTING GUIDELINES:
- Use clean, structured formatting without any markdown symbols like ** or *
- For numbered lists, use simple numbers like "1. Location:" not "**1. Location:**"
- Use clear headings and bullet points for organization
- Keep responses concise and scannable
- Use emojis sparingly but effectively for visual breaks
- Never use asterisks around text for emphasis

IMPORTANT: Stay focused on Accorria and car/home selling. Don't answer questions about changing the world, philosophy, or unrelated topics. Keep responses focused on helping users sell cars and homes faster with Accorria.

Tone: Professional, helpful, confident. You're an expert in real estate and automotive sales.
Keep responses concise and actionable. Always offer to help with specific next steps."""
        }
        
        # Prepare messages with system prompt
        messages = [system_message] + [msg.dict() for msg in request.messages]
        
        # Make request to OpenAI with timeout
        import asyncio
        print("DEBUG: About to call OpenAI API")
        try:
            response = await asyncio.wait_for(
                asyncio.to_thread(
                    client.chat.completions.create,
                    model="gpt-4o-mini",
                    messages=messages,
                    temperature=0.4,
                    max_tokens=1000
                ),
                timeout=10.0  # 10 second timeout
            )
            print("DEBUG: OpenAI API call successful")
        except asyncio.TimeoutError:
            print("DEBUG: OpenAI API call timed out")
            # Return a fallback response if OpenAI times out
            return ChatResponse(
                response="I'm experiencing high demand right now. Please try again in a moment, or feel free to ask me about listing your car or home on Accorria!",
                success=True
            )
        except Exception as e:
            print(f"DEBUG: OpenAI API call failed: {e}")
            # Return a fallback response for any other errors
            return ChatResponse(
                response="I'm experiencing technical difficulties. Please try again in a moment, or feel free to ask me about listing your car or home on Accorria!",
                success=True
            )
        
        # Extract response
        ai_response = response.choices[0].message.content
        
        return ChatResponse(
            response=ai_response,
            success=True
        )
        
    except Exception as e:
        print(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Chat service error: {str(e)}")
