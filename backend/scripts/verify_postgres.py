import os
import subprocess
import sys

from fastapi.testclient import TestClient
from sqlalchemy import create_engine, inspect


DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg://meeteat:meeteat@localhost:5432/meeteat",
)


def assert_ok(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def main() -> int:
    os.environ["DATABASE_URL"] = DATABASE_URL

    subprocess.run(["alembic", "upgrade", "head"], check=True)

    from app.main import app

    client = TestClient(app)
    health = client.get("/health")
    assert_ok(health.status_code == 200, "health endpoint failed")
    assert_ok(health.json()["database"] == "connected", "database is not connected")

    inspector = inspect(create_engine(DATABASE_URL))
    ai_columns = {column["name"] for column in inspector.get_columns("recommendation_results")}
    for column_name in {"ai_explanation", "ai_provider", "ai_model", "ai_status", "ai_generated_at"}:
        assert_ok(column_name in ai_columns, f"missing AI column: {column_name}")

    room_response = client.post(
        "/api/rooms",
        json={"title": "Postgres Verification", "occasion": "casual", "rainMode": False, "openNow": True},
    )
    assert_ok(room_response.status_code == 200, "room creation failed")
    room_code = room_response.json()["roomCode"]

    participants = [
        {
            "name": "Alice",
            "location": "W1",
            "lat": 51.513,
            "lng": -0.136,
            "likes": ["japanese"],
            "dislikes": [],
            "dietary": [],
            "budget": 50,
            "rating": 4.0,
            "travelMode": "transit",
            "travelTime": 45,
        },
        {
            "name": "Bob",
            "location": "WC2N",
            "lat": 51.508,
            "lng": -0.128,
            "likes": ["italian"],
            "dislikes": [],
            "dietary": [],
            "budget": 50,
            "rating": 4.0,
            "travelMode": "walking",
            "travelTime": 45,
        },
    ]
    participant_ids = []
    participant_tokens = []
    for participant in participants:
        response = client.post(f"/api/rooms/{room_code}/participants", json=participant)
        assert_ok(response.status_code == 200, "participant persistence failed")
        participant_ids.append(response.json()["id"])
        participant_tokens.append(response.json()["participantToken"])

    recommendation_response = client.post(
        f"/api/rooms/{room_code}/recommendations",
        json={"use_ai_explanations": False},
    )
    assert_ok(recommendation_response.status_code == 200, "recommendation generation failed")
    recommendations = recommendation_response.json()["recommendations"]
    assert_ok(len(recommendations) > 0, "no recommendations returned")
    assert_ok(recommendations[0]["id"] is not None, "recommendation result was not persisted")

    vote_response = client.post(
        f"/api/rooms/{room_code}/votes",
        headers={"X-Participant-Token": participant_tokens[0]},
        json={
            "participantId": int(participant_ids[0]),
            "recommendationResultId": recommendations[0]["id"],
        },
    )
    assert_ok(vote_response.status_code == 200, "vote persistence failed")

    winner_response = client.get(f"/api/rooms/{room_code}/winner")
    assert_ok(winner_response.status_code == 200, "winner retrieval failed")
    assert_ok(winner_response.json()["winner"]["id"] == recommendations[0]["id"], "winner does not match vote")

    print("PostgreSQL integration verification passed.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"PostgreSQL integration verification failed: {exc}", file=sys.stderr)
        raise
