import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db import models  # noqa: F401
from app.db import models as db_models
from app.db.database import Base, get_db
from app.main import app


@pytest.fixture()
def client():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def sample_result():
    return db_models.RecommendationResult(
        id=1,
        run_id=1,
        restaurant_id="koya-soho",
        restaurant_snapshot={
            "id": "koya-soho",
            "name": "Koya Soho",
            "cuisine": "Japanese",
            "cuisineKey": "japanese",
            "address": "London",
            "lat": 51.513,
            "lng": -0.136,
            "rating": 4.6,
            "reviews": 2000,
            "price": "££",
            "averagePrice": 25,
            "priceRange": "£20-£30",
            "dietsSupported": ["vegetarian"],
            "mapsUrl": "https://maps.example",
            "bookUrl": "https://book.example",
            "emoji": "🍜",
            "occasions": {
                "casual": 9,
                "birthday": 7,
                "date": 8,
                "business": 6,
                "celebration": 7,
            },
            "isOpenNow": True,
        },
        rank=1,
        geo_score=25,
        cuisine_score=22,
        quality_score=14,
        occasion_score=9,
        total_score=70,
        travel_breakdown=[{"participantName": "Alice", "min": 15, "mode": "transit"}],
        fallback_reason="Strong deterministic fit.",
        archetype="best",
    )
