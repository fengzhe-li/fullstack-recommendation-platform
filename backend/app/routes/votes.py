from typing import Annotated

from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.domain.models import VoteRequest, VoteResponse, WinnerResponse
from app.services.vote_service import cast_vote, get_winner


router = APIRouter(prefix="/api/rooms/{room_code}", tags=["votes"])


@router.post("/votes", response_model=VoteResponse)
def cast_vote_endpoint(
    room_code: str,
    payload: VoteRequest,
    x_participant_token: Annotated[str | None, Header()] = None,
    db: Session = Depends(get_db),
) -> VoteResponse:
    return cast_vote(db, room_code, payload, x_participant_token)


@router.get("/winner", response_model=WinnerResponse)
def get_winner_endpoint(room_code: str, db: Session = Depends(get_db)) -> WinnerResponse:
    return get_winner(db, room_code)
