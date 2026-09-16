from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.domain.models import RoomCreate, RoomRead, RoomState, RoomUpdate
from app.services.room_service import create_room, get_room_state, update_room


router = APIRouter(prefix="/api/rooms", tags=["rooms"])


@router.post("", response_model=RoomRead)
def create_room_endpoint(payload: RoomCreate, db: Session = Depends(get_db)) -> RoomRead:
    return create_room(db, payload)


@router.get("/{room_code}", response_model=RoomState)
def get_room_endpoint(room_code: str, db: Session = Depends(get_db)) -> RoomState:
    return get_room_state(db, room_code)


@router.patch("/{room_code}", response_model=RoomRead)
def update_room_endpoint(
    room_code: str,
    payload: RoomUpdate,
    db: Session = Depends(get_db),
) -> RoomRead:
    return update_room(db, room_code, payload)
