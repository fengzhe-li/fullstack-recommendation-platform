from typing import Annotated

from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.domain.models import ParticipantCreate, ParticipantIdentity, ParticipantUpdate
from app.services.room_service import add_participant, delete_participant, update_participant


router = APIRouter(prefix="/api", tags=["participants"])


@router.post("/rooms/{room_code}/participants", response_model=ParticipantIdentity)
def add_participant_endpoint(
    room_code: str,
    payload: ParticipantCreate,
    db: Session = Depends(get_db),
) -> ParticipantIdentity:
    return add_participant(db, room_code, payload)


@router.patch("/participants/{participant_id}", response_model=ParticipantIdentity)
def update_participant_endpoint(
    participant_id: int,
    payload: ParticipantUpdate,
    x_participant_token: Annotated[str | None, Header()] = None,
    db: Session = Depends(get_db),
) -> ParticipantIdentity:
    return update_participant(db, participant_id, payload, x_participant_token)


@router.delete("/participants/{participant_id}")
def delete_participant_endpoint(
    participant_id: int,
    x_participant_token: Annotated[str | None, Header()] = None,
    db: Session = Depends(get_db),
) -> dict[str, bool]:
    return delete_participant(db, participant_id, x_participant_token)
