import random
import secrets
import hashlib
import hmac
import string

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import models as db_models
from app.domain.models import (
    ParticipantCreate,
    ParticipantIdentity,
    ParticipantRead,
    ParticipantUpdate,
    RecommendationResponse,
    RoomCreate,
    RoomRead,
    RoomState,
    RoomUpdate,
    VoteCount,
)


def create_room(db: Session, payload: RoomCreate) -> RoomRead:
    room = db_models.Room(
        room_code=_generate_room_code(db),
        title=payload.title,
        occasion=payload.occasion,
        rain_mode=payload.rainMode,
        open_now_only=payload.openNow,
    )
    db.add(room)
    db.commit()
    db.refresh(room)
    return room_to_read(room)


def get_room_or_404(db: Session, room_code: str) -> db_models.Room:
    room = db.scalar(select(db_models.Room).where(db_models.Room.room_code == room_code.upper()))
    if room is None:
        raise HTTPException(status_code=404, detail="Room not found")
    return room


def get_room_state(db: Session, room_code: str) -> RoomState:
    room = get_room_or_404(db, room_code)
    latest = _latest_recommendation_response(db, room.id)
    vote_counts = _vote_counts(db, latest) if latest else []
    winner = _winner_from_response(latest, vote_counts) if latest else None
    return RoomState(
        **room_to_read(room).model_dump(),
        participants=[participant_to_read(participant) for participant in room.participants],
        latestRecommendations=latest,
        voteCounts=vote_counts,
        winner=winner,
    )


def update_room(db: Session, room_code: str, payload: RoomUpdate) -> RoomRead:
    room = get_room_or_404(db, room_code)
    updates = payload.model_dump(exclude_unset=True)
    mapping = {
        "rainMode": "rain_mode",
        "openNow": "open_now_only",
    }
    for key, value in updates.items():
        setattr(room, mapping.get(key, key), value)

    db.commit()
    db.refresh(room)
    return room_to_read(room)


def add_participant(db: Session, room_code: str, payload: ParticipantCreate) -> ParticipantIdentity:
    room = get_room_or_404(db, room_code)
    participant_token = secrets.token_urlsafe(32)
    participant = db_models.Participant(
        room_id=room.id,
        display_name=payload.name,
        location=payload.location,
        latitude=payload.lat,
        longitude=payload.lng,
        likes=payload.likes,
        dislikes=payload.dislikes,
        dietary=payload.dietary,
        token_hash=_hash_participant_token(participant_token),
        budget=payload.budget,
        minimum_rating=payload.rating,
        travel_mode=payload.travelMode,
        maximum_travel_time=payload.travelTime,
    )
    db.add(participant)
    db.commit()
    db.refresh(participant)
    return participant_to_identity(participant, participant_token)


def update_participant(db: Session, participant_id: int, payload: ParticipantUpdate, participant_token: str) -> ParticipantIdentity:
    participant = db.get(db_models.Participant, participant_id)
    if participant is None:
        raise HTTPException(status_code=404, detail="Participant not found")
    verify_participant_token(participant, participant_token)

    updates = payload.model_dump(exclude_unset=True)
    mapping = {
        "name": "display_name",
        "lat": "latitude",
        "lng": "longitude",
        "rating": "minimum_rating",
        "travelMode": "travel_mode",
        "travelTime": "maximum_travel_time",
    }
    for key, value in updates.items():
        setattr(participant, mapping.get(key, key), value)

    db.commit()
    db.refresh(participant)
    return participant_to_identity(participant, participant_token)


def delete_participant(db: Session, participant_id: int, participant_token: str) -> dict[str, bool]:
    participant = db.get(db_models.Participant, participant_id)
    if participant is None:
        raise HTTPException(status_code=404, detail="Participant not found")
    verify_participant_token(participant, participant_token)
    db.delete(participant)
    db.commit()
    return {"deleted": True}


def room_to_read(room: db_models.Room) -> RoomRead:
    return RoomRead(
        id=room.id,
        roomCode=room.room_code,
        title=room.title,
        occasion=room.occasion,  # type: ignore[arg-type]
        rainMode=room.rain_mode,
        openNow=room.open_now_only,
        createdAt=room.created_at,
        updatedAt=room.updated_at,
    )


def participant_to_read(participant: db_models.Participant) -> ParticipantRead:
    return ParticipantRead(
        id=str(participant.id),
        name=participant.display_name,
        location=participant.location,
        lat=participant.latitude,
        lng=participant.longitude,
        likes=participant.likes or [],
        dislikes=participant.dislikes or [],
        dietary=participant.dietary or [],
        budget=participant.budget,
        rating=participant.minimum_rating,
        travelMode=participant.travel_mode,  # type: ignore[arg-type]
        travelTime=participant.maximum_travel_time,
    )


def participant_to_identity(participant: db_models.Participant, participant_token: str) -> ParticipantIdentity:
    return ParticipantIdentity(
        **participant_to_read(participant).model_dump(),
        participantToken=participant_token,
    )


def verify_participant_token(participant: db_models.Participant, participant_token: str | None) -> None:
    if not participant_token:
        raise HTTPException(status_code=403, detail="Participant token required")
    if not hmac.compare_digest(participant.token_hash, _hash_participant_token(participant_token)):
        raise HTTPException(status_code=403, detail="Invalid participant token")


def _hash_participant_token(participant_token: str) -> str:
    return hashlib.sha256(participant_token.encode("utf-8")).hexdigest()


def _generate_room_code(db: Session) -> str:
    alphabet = string.ascii_uppercase + string.digits
    while True:
        code = "".join(random.choice(alphabet) for _ in range(6))
        exists = db.scalar(select(db_models.Room.id).where(db_models.Room.room_code == code))
        if not exists:
            return code


def _latest_recommendation_response(db: Session, room_id: int) -> RecommendationResponse | None:
    from app.services.recommendation_service import recommendation_result_to_domain

    run = db.scalar(
        select(db_models.RecommendationRun)
        .where(db_models.RecommendationRun.room_id == room_id)
        .order_by(db_models.RecommendationRun.created_at.desc(), db_models.RecommendationRun.id.desc())
    )
    if run is None:
        return None
    return RecommendationResponse(
        recommendations=[recommendation_result_to_domain(result) for result in run.results]
    )


def _vote_counts(db: Session, latest: RecommendationResponse) -> list[VoteCount]:
    result_ids = [recommendation.id for recommendation in latest.recommendations if recommendation.id]
    if not result_ids:
        return []
    counts = {result_id: 0 for result_id in result_ids}
    rows = db.scalars(
        select(db_models.Vote).where(db_models.Vote.recommendation_result_id.in_(result_ids))
    ).all()
    for row in rows:
        counts[row.recommendation_result_id] += 1
    return [
        VoteCount(recommendationResultId=result_id, count=count)
        for result_id, count in counts.items()
    ]


def _winner_from_response(latest: RecommendationResponse, vote_counts: list[VoteCount]):
    counts = {item.recommendationResultId: item.count for item in vote_counts}
    if not latest.recommendations:
        return None
    return sorted(
        latest.recommendations,
        key=lambda item: (-(counts.get(item.id or -1, 0)), item.rank or 999),
    )[0]
