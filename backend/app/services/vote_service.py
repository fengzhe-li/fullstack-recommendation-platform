from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import models as db_models
from app.domain.models import RecommendationResponse, VoteCount, VoteRequest, VoteResponse, WinnerResponse
from app.services.room_service import get_room_or_404, verify_participant_token
from app.services.recommendation_service import recommendation_result_to_domain


def cast_vote(db: Session, room_code: str, payload: VoteRequest, participant_token: str | None) -> VoteResponse:
    room = get_room_or_404(db, room_code)
    participant = db.get(db_models.Participant, payload.participantId)
    result = db.get(db_models.RecommendationResult, payload.recommendationResultId)

    if participant is None or participant.room_id != room.id:
        raise HTTPException(status_code=400, detail="Invalid participant for room")
    if result is None or result.run.room_id != room.id:
        raise HTTPException(status_code=400, detail="Invalid recommendation result for room")
    verify_participant_token(participant, participant_token)

    existing = db.scalar(
        select(db_models.Vote).where(
            db_models.Vote.participant_id == participant.id,
            db_models.Vote.run_id == result.run_id,
        )
    )
    if existing:
        existing.recommendation_result_id = result.id
        vote = existing
    else:
        vote = db_models.Vote(
            room_id=room.id,
            run_id=result.run_id,
            participant_id=participant.id,
            recommendation_result_id=result.id,
        )
        db.add(vote)

    db.commit()
    db.refresh(vote)
    winner = get_winner(db, room_code)
    return VoteResponse(voteId=vote.id, voteCounts=winner.voteCounts, winner=winner.winner)


def get_winner(db: Session, room_code: str) -> WinnerResponse:
    room = get_room_or_404(db, room_code)
    run = db.scalar(
        select(db_models.RecommendationRun)
        .where(db_models.RecommendationRun.room_id == room.id)
        .order_by(db_models.RecommendationRun.created_at.desc(), db_models.RecommendationRun.id.desc())
    )
    if run is None:
        return WinnerResponse(voteCounts=[], winner=None)

    counts = {result.id: 0 for result in run.results}
    for vote in run.votes:
        counts[vote.recommendation_result_id] = counts.get(vote.recommendation_result_id, 0) + 1

    vote_counts = [
        VoteCount(recommendationResultId=result.id, count=counts[result.id])
        for result in run.results
    ]
    if not run.results:
        return WinnerResponse(voteCounts=vote_counts, winner=None)

    winning_result = sorted(
        run.results,
        key=lambda result: (-counts[result.id], result.rank),
    )[0]
    return WinnerResponse(
        voteCounts=vote_counts,
        winner=recommendation_result_to_domain(winning_result),
    )
