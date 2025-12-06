"""
Speech-to-Text API endpoint using OpenAI Whisper
Converts audio recordings to text for voice input in listing creation
"""

from fastapi import APIRouter, File, UploadFile, HTTPException, Body
from fastapi.responses import JSONResponse
from typing import Optional, Dict, Any
import logging
import openai
from app.core.config import settings
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/transcribe")
async def transcribe_audio(
    audio: UploadFile = File(..., description="Audio file to transcribe (mp3, mp4, mpeg, mpga, m4a, wav, webm)")
):
    """
    Transcribe audio to text using OpenAI Whisper API
    
    Accepts audio files in various formats:
    - mp3, mp4, mpeg, mpga, m4a, wav, webm
    
    Returns:
    {
        "success": true,
        "text": "transcribed text",
        "language": "en"
    }
    """
    try:
        # Check if OpenAI API key is configured
        if not settings.OPENAI_API_KEY:
            raise HTTPException(
                status_code=500,
                detail="OpenAI API key is not configured. Please set OPENAI_API_KEY environment variable."
            )
        
        # Initialize OpenAI client
        client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
        
        # Read audio file
        audio_content = await audio.read()
        
        # Validate file size (Whisper API limit is 25MB)
        max_size = 25 * 1024 * 1024  # 25MB in bytes
        if len(audio_content) > max_size:
            raise HTTPException(
                status_code=400,
                detail=f"Audio file too large. Maximum size is 25MB, received {len(audio_content) / 1024 / 1024:.2f}MB"
            )
        
        # Validate file type
        allowed_extensions = ['.mp3', '.mp4', '.mpeg', '.mpga', '.m4a', '.wav', '.webm']
        file_extension = audio.filename.split('.')[-1].lower() if audio.filename else ''
        
        if file_extension not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type. Allowed formats: {', '.join(allowed_extensions)}"
            )
        
        logger.info(f"Transcribing audio file: {audio.filename}, size: {len(audio_content)} bytes")
        
        # Create a temporary file-like object for OpenAI API
        import io
        audio_file = io.BytesIO(audio_content)
        audio_file.name = audio.filename or "audio.webm"
        
        # Call Whisper API
        transcription = client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file,
            language="en",  # Optional: specify language for better accuracy
            response_format="verbose_json"  # Get detailed response with language detection
        )
        
        logger.info(f"Transcription successful: {len(transcription.text)} characters")
        
        return JSONResponse(content={
            "success": True,
            "text": transcription.text,
            "language": transcription.language if hasattr(transcription, 'language') else "en"
        })
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except openai.APIError as e:
        logger.error(f"OpenAI API error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"OpenAI API error: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Error transcribing audio: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to transcribe audio: {str(e)}"
        )


class ParseRequest(BaseModel):
    text: str
    currentFields: Optional[Dict[str, Any]] = None


@router.post("/parse")
async def parse_transcript(
    request: ParseRequest = Body(...)
):
    """
    Parse transcript text and extract structured vehicle data using GPT-4
    
    Input:
    {
        "text": "transcribed text",
        "currentFields": {
            "year": "2017",
            "make": "Nissan",
            ...
        }
    }
    
    Returns:
    {
        "year": "2017",
        "make": "Nissan",
        "model": "Altima",
        "trim": "SV",
        "titleStatus": "rebuilt",
        "mileage": "85000",
        "conditionNotes": "...",
        "aboutVehicle": "..."
    }
    """
    try:
        if not settings.OPENAI_API_KEY:
            raise HTTPException(
                status_code=500,
                detail="OpenAI API key is not configured"
            )
        
        client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
        
        # Build prompt for structured extraction
        current_info = ""
        if request.currentFields:
            current_info = f"\n\nCurrent form fields (for context only, extract from speech if mentioned):\n"
            for key, value in request.currentFields.items():
                if value:
                    current_info += f"- {key}: {value}\n"
        
        prompt = f"""Extract vehicle information from the following spoken description. Return ONLY the fields that are mentioned in the speech.

Speech transcript:
"{request.text}"
{current_info}

Extract the following fields if mentioned:
- year: 4-digit year (e.g., "2017")
- make: Vehicle manufacturer (e.g., "Nissan", "Toyota")
- model: Vehicle model (e.g., "Altima", "Camry")
- trim: Trim level (e.g., "SV", "LE", "Limited")
- titleStatus: "clean", "rebuilt", or "salvage" (if mentioned)
- mileage: Number only, no commas (e.g., "85000")
- conditionNotes: Any condition descriptions
- features: Array of vehicle features mentioned (e.g., ["backup_camera", "heated_seats", "sunroof", "awd", "bluetooth", "navigation", "leather_seats", "alloy_wheels", "tinted_windows", "touchscreen"])
- aboutVehicle: Full description text (use the original speech text)

For features, extract any mentioned vehicle features and convert them to standard feature names:
- "backup camera" or "rear camera" → "backup_camera"
- "heated seats" → "heated_seats"
- "sunroof" or "moonroof" → "sunroof"
- "AWD" or "all wheel drive" → "awd"
- "4WD" or "4x4" or "four wheel drive" → "4wd"
- "Bluetooth" → "bluetooth"
- "navigation" or "GPS" or "nav" → "navigation"
- "leather" or "leather seats" → "leather_seats"
- "alloy wheels" or "aluminum wheels" → "alloy_wheels"
- "tinted windows" → "tinted_windows"
- "touchscreen" or "touch screen" → "touchscreen"
- "CarPlay" or "Apple CarPlay" → "apple_carplay"
- "Android Auto" → "android_auto"
- "cruise control" → "cruise_control"
- "dual zone" or "dual climate" → "dual_zone_climate"
- "keyless entry" → "keyless_entry"
- "push button start" → "push_button_start"
- "LED lights" or "LED headlights" → "led_headlights"
- "fog lights" → "fog_lights"
- "roof rails" or "roof rack" → "roof_rack"

Return a JSON object with only the fields that were mentioned. If a field is not mentioned, omit it from the response.
Use null for missing values, not empty strings.
Features should be an array of strings, even if only one feature is mentioned.

Example response:
{{
  "year": "2017",
  "make": "Nissan",
  "model": "Altima",
  "trim": "SV",
  "titleStatus": "rebuilt",
  "mileage": "85000",
  "conditionNotes": "Minor scratches on bumper",
  "features": ["backup_camera", "heated_seats", "bluetooth", "alloy_wheels"],
  "aboutVehicle": "2017 Nissan Altima SV with 85,000 miles, rebuilt title due to minor accident"
}}

Return ONLY valid JSON, no other text."""

        response = client.chat.completions.create(
            model="gpt-4o-mini",  # Using mini for cost efficiency
            messages=[
                {"role": "system", "content": "You are a vehicle data extraction assistant. Extract structured data from spoken vehicle descriptions. Return only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            response_format={"type": "json_object"}
        )
        
        import json
        extracted_data = json.loads(response.choices[0].message.content)
        
        logger.info(f"Parsed transcript: extracted {len(extracted_data)} fields")
        
        return JSONResponse(content=extracted_data)
        
    except HTTPException:
        raise
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse GPT response as JSON: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to parse extraction result: {str(e)}"
        )
    except openai.APIError as e:
        logger.error(f"OpenAI API error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"OpenAI API error: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Error parsing transcript: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to parse transcript: {str(e)}"
        )

