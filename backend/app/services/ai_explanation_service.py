import os
import json
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

import httpx
from sqlalchemy.orm import Session

from app.db import models as db_models


ZAI_BASE_URL = "https://api.z.ai/api/paas/v4"
ZAI_MODEL = "glm-5.1"
ZAI_PROVIDER = "Z.AI"
MAX_EXPLANATION_CHARS = 700


@dataclass(frozen=True)
class ExplanationOutcome:
    explanation: str | None
    status: str
    provider: str | None = None
    model: str | None = None
    generated_at: datetime | None = None


class AIExplanationService:
    def __init__(
        self,
        api_key: str | None = None,
        base_url: str = ZAI_BASE_URL,
        model: str = ZAI_MODEL,
        timeout_seconds: float = 8.0,
    ) -> None:
        self.api_key = api_key if api_key is not None else os.getenv("ZAI_API_KEY")
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.timeout_seconds = timeout_seconds

    def explain_result(
        self,
        result: db_models.RecommendationResult,
        participants: list[db_models.Participant],
        occasion: str,
    ) -> ExplanationOutcome:
        if result.ai_explanation:
            return ExplanationOutcome(
                explanation=result.ai_explanation,
                status=result.ai_status or "cached",
                provider=result.ai_provider,
                model=result.ai_model,
                generated_at=result.ai_generated_at,
            )

        if not self.api_key:
            return ExplanationOutcome(explanation=None, status="missing_api_key")

        payload = self._build_payload(result, participants, occasion)

        try:
            with httpx.Client(timeout=self.timeout_seconds) as client:
                response = client.post(
                    f"{self.base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                    json=payload,
                )
                response.raise_for_status()
        except httpx.TimeoutException:
            return ExplanationOutcome(explanation=None, status="timeout")
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code == 429:
                return ExplanationOutcome(explanation=None, status="rate_limited")
            return ExplanationOutcome(explanation=None, status="provider_error")
        except httpx.HTTPError:
            return ExplanationOutcome(explanation=None, status="network_error")

        explanation = self._extract_explanation(response)
        if explanation is None:
            return ExplanationOutcome(explanation=None, status="malformed_response")
        if explanation == "":
            return ExplanationOutcome(explanation=None, status="empty_response")

        return ExplanationOutcome(
            explanation=explanation,
            status="generated",
            provider=ZAI_PROVIDER,
            model=self.model,
            generated_at=datetime.now(timezone.utc),
        )

    def persist_outcome(
        self,
        db: Session,
        result: db_models.RecommendationResult,
        outcome: ExplanationOutcome,
    ) -> None:
        result.ai_status = outcome.status
        if outcome.explanation:
            result.ai_explanation = outcome.explanation
            result.ai_provider = outcome.provider or ZAI_PROVIDER
            result.ai_model = outcome.model or self.model
            result.ai_generated_at = outcome.generated_at or datetime.now(timezone.utc)
        db.add(result)
        db.commit()
        db.refresh(result)

    def generate_and_persist(
        self,
        db: Session,
        result: db_models.RecommendationResult,
        participants: list[db_models.Participant],
        occasion: str,
    ) -> ExplanationOutcome:
        outcome = self.explain_result(result, participants, occasion)
        self.persist_outcome(db, result, outcome)
        return outcome

    def _build_payload(
        self,
        result: db_models.RecommendationResult,
        participants: list[db_models.Participant],
        occasion: str,
    ) -> dict[str, Any]:
        restaurant = result.restaurant_snapshot
        context = {
            "restaurant": {
                "name": restaurant["name"],
                "cuisine": restaurant["cuisine"],
                "price": restaurant["price"],
                "averagePrice": restaurant["averagePrice"],
                "rating": restaurant["rating"],
                "dietsSupported": restaurant["dietsSupported"],
            },
            "rank": result.rank,
            "occasion": occasion,
            "scores": {
                "geo": result.geo_score,
                "cuisine": result.cuisine_score,
                "quality": result.quality_score,
                "occasion": result.occasion_score,
                "total": result.total_score,
            },
            "travelBreakdown": result.travel_breakdown,
            "fallbackReason": result.fallback_reason,
            "participants": [
                {
                    "name": participant.display_name,
                    "budget": participant.budget,
                    "likes": participant.likes or [],
                    "dislikes": participant.dislikes or [],
                    "dietary": participant.dietary or [],
                    "minimumRating": participant.minimum_rating,
                    "travelMode": participant.travel_mode,
                    "maximumTravelTime": participant.maximum_travel_time,
                }
                for participant in participants
            ],
        }
        return {
            "model": self.model,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You explain deterministic restaurant recommendations. "
                        "Use only supplied structured information. Do not invent restaurant features, "
                        "menu items, opening hours, prices, reviews, travel facts, or user preferences. "
                        "Do not change ranking. Do not say the recommendation was generated by AI. "
                        "Keep the explanation concise and useful in 2-4 sentences."
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        "Explain why this restaurant fits this group using only this JSON context:\n"
                        f"{json.dumps(context, ensure_ascii=False)}"
                    ),
                },
            ],
            "temperature": 0.2,
            "max_tokens": 180,
        }

    def _extract_explanation(self, response: httpx.Response) -> str | None:
        try:
            payload = response.json()
            content = payload["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError, ValueError):
            return None

        if not isinstance(content, str):
            return None

        explanation = " ".join(content.strip().split())
        if len(explanation) > MAX_EXPLANATION_CHARS:
            explanation = explanation[:MAX_EXPLANATION_CHARS].rsplit(" ", 1)[0].strip()
        return explanation
