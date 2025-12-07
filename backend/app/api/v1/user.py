from fastapi import APIRouter, Request, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime

from ...core.database import get_db
from ...models import Event

router = APIRouter(prefix="/user", tags=["user"])

@router.post("/log_action", status_code=status.HTTP_201_CREATED)
async def log_action(request: Request, db: AsyncSession = Depends(get_db)):
    data = await request.json()
    event_type = data.get("action")
    event_detail = data.get("detail", "")
    user_id = data.get("user_id")  # Optional, for future use
    session_id = data.get("session_id")  # Optional, for future use
    timestamp = data.get("timestamp", datetime.utcnow().isoformat())
    platform = data.get("platform", "web")
    page = data.get("page", "dashboard")
    element = data.get("element", "clear_button")
    referrer = data.get("referrer", "")

    event = Event(
        event_type=event_type,
        event_detail=event_detail,
        user_id=user_id,
        session_id=session_id,
        car_id=None,
        timestamp=timestamp,
        platform=platform,
        page=page,
        element=element,
        referrer=referrer,
    )
    db.add(event)
    await db.commit()
    await db.refresh(event)
    return JSONResponse(status_code=201, content={"message": "Action logged", "event_id": event.event_id}) 