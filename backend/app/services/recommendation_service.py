from typing import List

from app.data.restaurants import LONDON_RESTAURANTS
from app.db import models as db_models
from app.domain.models import Participant, RecommendationResult, Restaurant
from app.domain.scoring import find_recommendations


class RecommendationService:
    def __init__(self) -> None:
        self._restaurants = [Restaurant(**restaurant) for restaurant in LONDON_RESTAURANTS]

    def recommend(
        self,
        participants: List[Participant],
        occasion: str,
        rain_mode: bool,
        open_now: bool,
    ) -> List[RecommendationResult]:
        results = find_recommendations(
            participants,
            self._restaurants,
            occasion,  # type: ignore[arg-type]
            rain_mode,
            open_now,
        )

        if len(results) == 0 and len(participants) > 0:
            return find_recommendations(
                participants[:1],
                self._restaurants,
                occasion,  # type: ignore[arg-type]
                rain_mode,
                open_now,
            )

        return results


def participant_row_to_domain(participant: db_models.Participant) -> Participant:
    return Participant(
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


def persist_recommendation_run(
    db,
    room: db_models.Room,
    recommendations: List[RecommendationResult],
) -> db_models.RecommendationRun:
    run = db_models.RecommendationRun(room_id=room.id)
    db.add(run)
    db.flush()

    for index, recommendation in enumerate(recommendations, start=1):
        result = db_models.RecommendationResult(
            run_id=run.id,
            restaurant_id=recommendation.restaurant.id,
            restaurant_snapshot=recommendation.restaurant.model_dump(),
            rank=index,
            geo_score=recommendation.scores.geo,
            cuisine_score=recommendation.scores.cuisine,
            quality_score=recommendation.scores.quality,
            occasion_score=recommendation.scores.occasion,
            total_score=recommendation.scores.total,
            travel_breakdown=[travel.model_dump() for travel in recommendation.travels],
            fallback_reason=recommendation.reason,
            archetype=recommendation.archetype,
        )
        db.add(result)

    db.commit()
    db.refresh(run)
    return run


def recommendation_result_to_domain(result: db_models.RecommendationResult) -> RecommendationResult:
    restaurant = Restaurant(**result.restaurant_snapshot)
    return RecommendationResult(
        id=result.id,
        rank=result.rank,
        restaurant=restaurant,
        scores={
            "geo": result.geo_score,
            "cuisine": result.cuisine_score,
            "quality": result.quality_score,
            "occasion": result.occasion_score,
            "total": result.total_score,
        },
        travels=result.travel_breakdown,
        reason=result.fallback_reason,
        reasonEn=result.fallback_reason,
        reasonZh=result.fallback_reason,
        archetype=result.archetype,  # type: ignore[arg-type]
        votes=len(result.votes),
        score=round(result.total_score / 80, 4),
        aiExplanation=result.ai_explanation,
        aiProvider=result.ai_provider,
        aiModel=result.ai_model,
        aiStatus=result.ai_status,
        aiGeneratedAt=result.ai_generated_at,
    )
