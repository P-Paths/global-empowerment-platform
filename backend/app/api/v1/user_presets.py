"""
User Presets API
Handles saving and retrieving user-specific saved phrases and common descriptions
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import re

from app.core.supabase_config import get_supabase

router = APIRouter()


class PresetCreate(BaseModel):
    preset_type: str  # 'description_phrase', 'title_status', 'common_damage', etc.
    preset_value: str  # The actual phrase/value


class PresetResponse(BaseModel):
    id: str
    preset_type: str
    preset_value: str
    usage_count: int
    last_used_at: Optional[datetime]
    created_at: datetime


@router.get("/presets", response_model=List[PresetResponse])
async def get_user_presets(
    preset_type: Optional[str] = None,
    limit: int = 20,
    request: Request = None
):
    """Get user's saved presets, optionally filtered by type"""
    try:
        # Get user ID from request (you'll need to implement auth middleware)
        user_id = getattr(request.state, 'user_id', None) if request else None
        if not user_id:
            # For now, return empty list if no user
            return []
        
        supabase = get_supabase()
        
        query = supabase.table("user_presets").select("*").eq("user_id", user_id)
        
        if preset_type:
            query = query.eq("preset_type", preset_type)
        
        query = query.order("usage_count", desc=True).limit(limit)
        
        result = query.execute()
        
        return result.data if result.data else []
        
    except Exception as e:
        print(f"[USER-PRESETS] Error getting presets: {e}")
        return []


@router.post("/presets", response_model=PresetResponse)
async def create_or_update_preset(
    preset: PresetCreate,
    request: Request = None
):
    """Create a new preset or increment usage if it exists"""
    try:
        user_id = getattr(request.state, 'user_id', None) if request else None
        if not user_id:
            raise HTTPException(status_code=401, detail="User not authenticated")
        
        supabase = get_supabase()
        
        # Check if preset already exists
        existing = supabase.table("user_presets").select("*").eq(
            "user_id", user_id
        ).eq("preset_type", preset.preset_type).eq(
            "preset_value", preset.preset_value
        ).execute()
        
        if existing.data and len(existing.data) > 0:
            # Update existing preset (increment usage)
            updated = supabase.table("user_presets").update({
                "usage_count": existing.data[0]["usage_count"] + 1,
                "last_used_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }).eq("id", existing.data[0]["id"]).execute()
            
            return updated.data[0] if updated.data else existing.data[0]
        else:
            # Create new preset
            new_preset = supabase.table("user_presets").insert({
                "user_id": user_id,
                "preset_type": preset.preset_type,
                "preset_value": preset.preset_value,
                "usage_count": 1,
                "last_used_at": datetime.utcnow().isoformat()
            }).execute()
            
            return new_preset.data[0] if new_preset.data else None
            
    except Exception as e:
        print(f"[USER-PRESETS] Error creating preset: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save preset: {str(e)}")


@router.post("/presets/extract-and-save")
async def extract_and_save_presets(
    about_vehicle: str,
    title_status: Optional[str] = None,
    request: Request = None
):
    """Extract common phrases from about_vehicle and save them as presets"""
    try:
        user_id = getattr(request.state, 'user_id', None) if request else None
        if not user_id:
            # Silently fail if no user (for demo users)
            return {"saved": 0, "message": "No user authenticated"}
        
        if not about_vehicle:
            return {"saved": 0, "message": "No text to extract"}
        
        supabase = get_supabase()
        saved_count = 0
        
        # Common damage/repair phrases to extract
        damage_patterns = [
            r'front\s+bumper\s+(cover|replace|replaced|damage)',
            r'rear\s+bumper\s+(cover|replace|replaced|damage)',
            r'fender\s+(replace|replaced|damage)',
            r'hood\s+(replace|replaced|damage)',
            r'door\s+(replace|replaced|damage)',
            r'windshield\s+(replace|replaced|crack)',
            r'headlight\s+(replace|replaced|damage)',
            r'taillight\s+(replace|replaced|damage)',
            r'quarter\s+panel\s+(replace|replaced|damage)',
            r'frame\s+(damage|repair)',
        ]
        
        # Extract phrases
        extracted_phrases = []
        about_lower = about_vehicle.lower()
        
        for pattern in damage_patterns:
            matches = re.findall(pattern, about_lower, re.IGNORECASE)
            for match in matches:
                if isinstance(match, tuple):
                    phrase = ' '.join(match)
                else:
                    phrase = match
                if phrase and phrase not in extracted_phrases:
                    extracted_phrases.append(phrase)
        
        # Also save title status if provided
        if title_status and title_status.lower() != 'clean':
            extracted_phrases.append(title_status.lower())
        
        # Save each extracted phrase
        for phrase in extracted_phrases:
            try:
                # Check if exists
                existing = supabase.table("user_presets").select("*").eq(
                    "user_id", user_id
                ).eq("preset_type", "description_phrase").eq(
                    "preset_value", phrase
                ).execute()
                
                if existing.data and len(existing.data) > 0:
                    # Increment usage
                    supabase.table("user_presets").update({
                        "usage_count": existing.data[0]["usage_count"] + 1,
                        "last_used_at": datetime.utcnow().isoformat(),
                        "updated_at": datetime.utcnow().isoformat()
                    }).eq("id", existing.data[0]["id"]).execute()
                else:
                    # Create new
                    supabase.table("user_presets").insert({
                        "user_id": user_id,
                        "preset_type": "description_phrase",
                        "preset_value": phrase,
                        "usage_count": 1,
                        "last_used_at": datetime.utcnow().isoformat()
                    }).execute()
                
                saved_count += 1
            except Exception as e:
                print(f"[USER-PRESETS] Error saving phrase '{phrase}': {e}")
                continue
        
        return {
            "saved": saved_count,
            "phrases": extracted_phrases,
            "message": f"Saved {saved_count} phrases"
        }
        
    except Exception as e:
        print(f"[USER-PRESETS] Error extracting presets: {e}")
        return {"saved": 0, "error": str(e)}


@router.delete("/presets/{preset_id}")
async def delete_preset(
    preset_id: str,
    request: Request = None
):
    """Delete a user preset"""
    try:
        user_id = getattr(request.state, 'user_id', None) if request else None
        if not user_id:
            raise HTTPException(status_code=401, detail="User not authenticated")
        
        supabase = get_supabase()
        
        # Verify preset belongs to user
        preset = supabase.table("user_presets").select("*").eq(
            "id", preset_id
        ).eq("user_id", user_id).execute()
        
        if not preset.data or len(preset.data) == 0:
            raise HTTPException(status_code=404, detail="Preset not found")
        
        # Delete
        supabase.table("user_presets").delete().eq("id", preset_id).execute()
        
        return {"message": "Preset deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[USER-PRESETS] Error deleting preset: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete preset: {str(e)}")

