from fastapi import APIRouter, Body, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import models as db_models
from app.db.database import get_db
from app.domain.models import RecommendationRequest, RecommendationResponse, RoomRecommendationRequest
from app.services.ai_explanation_service import AIExplanationService
from app.services.recommendation_service import (
    RecommendationService,
    participant_row_to_domain,
    persist_recommendation_run,
    recommendation_result_to_domain,
)
from app.services.room_service import get_room_or_404


router = APIRouter(prefix="/api", tags=["recommendations"])
service = RecommendationService()
ai_service = AIExplanationService()


@router.post("/recommendations", response_model=RecommendationResponse)
def create_recommendations(request: RecommendationRequest) -> RecommendationResponse:
    recommendations = service.recommend(
        participants=request.participants,
        occasion=request.occasion,
        rain_mode=request.rainMode,
        open_now=request.openNow,
    )
    return RecommendationResponse(recommendations=recommendations)


@router.post("/rooms/{room_code}/recommendations", response_model=RecommendationResponse)
def create_room_recommendations(
    room_code: str,
    request: RoomRecommendationRequest | None = Body(default=None),
    db: Session = Depends(get_db),
) -> RecommendationResponse:
    room = get_room_or_404(db, room_code)
    participants = [participant_row_to_domain(participant) for participant in room.participants]
    if not participants:
        raise HTTPException(status_code=400, detail="Room must have at least one participant")

    recommendations = service.recommend(
        participants=participants,
        occasion=room.occasion,
        rain_mode=room.rain_mode,
        open_now=room.open_now_only,
    )
    run = persist_recommendation_run(db, room, recommendations)

    if request and request.use_ai_explanations:
        for result in run.results[:3]:
            ai_service.generate_and_persist(db, result, room.participants, room.occasion)

    return RecommendationResponse(
        recommendations=[recommendation_result_to_domain(result) for result in run.results]
    )


@router.get("/rooms/{room_code}/recommendations/latest", response_model=RecommendationResponse)
def get_latest_room_recommendations(room_code: str, db: Session = Depends(get_db)) -> RecommendationResponse:
    room = get_room_or_404(db, room_code)
    run = db.scalar(
        select(db_models.RecommendationRun)
        .where(db_models.RecommendationRun.room_id == room.id)
        .order_by(db_models.RecommendationRun.created_at.desc(), db_models.RecommendationRun.id.desc())
    )
    if run is None:
        raise HTTPException(status_code=404, detail="No recommendations have been generated")
    return RecommendationResponse(
        recommendations=[recommendation_result_to_domain(result) for result in run.results]
    )


@router.post("/recommendations/{result_id}/explain", response_model=RecommendationResponse)
def explain_recommendation_result(result_id: int, db: Session = Depends(get_db)) -> RecommendationResponse:
    result = db.get(db_models.RecommendationResult, result_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Recommendation result not found")

    if not result.ai_explanation:
        ai_service.generate_and_persist(db, result, result.run.room.participants, result.run.room.occasion)

    return RecommendationResponse(recommendations=[recommendation_result_to_domain(result)])
