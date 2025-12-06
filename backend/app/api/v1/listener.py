from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.orm import Session
from app.services.listen_agent import ListenerAgent
from app.core.database import get_sync_db as get_db

router = APIRouter()

@router.post("/listener/upload")
async def upload_listener(
    images: list[UploadFile] = File(..., description="Up to 15 images"),
    vin: str = Form(None),
    make: str = Form(None),
    model: str = Form(None),
    year: int = Form(None),
    user_id: int = Form(...),
    db: Session = Depends(get_db)
):
    if len(images) > 15:
        raise HTTPException(status_code=400, detail="Maximum 15 images allowed.")
    image_bytes = [await img.read() for img in images]
    agent = ListenerAgent(db)
    car_data = await agent.process_images_and_details(
        images=image_bytes, vin=vin, make=make, model=model, year=year, user_id=user_id
    )
    # For now, just return the processed data (saving comes later)
    return {"status": "success", "car": car_data} 