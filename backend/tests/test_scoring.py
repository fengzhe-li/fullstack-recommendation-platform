from app.domain.models import Participant, Restaurant
from app.domain.scoring import find_recommendations, get_haversine_distance


def restaurant(**overrides):
    base = {
        "id": "test-spot",
        "name": "Test Spot",
        "cuisine": "Japanese",
        "cuisineKey": "japanese",
        "address": "London",
        "lat": 51.513,
        "lng": -0.136,
        "rating": 4.5,
        "reviews": 2000,
        "price": "££",
        "averagePrice": 20,
        "priceRange": "£15-£25",
        "dietsSupported": ["vegetarian", "halal", "gluten-free"],
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
    }
    base.update(overrides)
    return Restaurant(**base)


def participant(**overrides):
    base = {
        "id": "p1",
        "name": "Alice",
        "location": "W1",
        "lat": 51.513,
        "lng": -0.136,
        "likes": ["japanese"],
        "dislikes": [],
        "dietary": [],
        "budget": 30,
        "rating": 4.0,
        "travelMode": "walking",
        "travelTime": 30,
    }
    base.update(overrides)
    return Participant(**base)


def test_distance_calculation_returns_reasonable_london_distance():
    distance = get_haversine_distance(51.513, -0.136, 51.5262, -0.0782)

    assert 4.0 < distance < 4.5


def test_budget_filter_excludes_restaurant_above_budget():
    results = find_recommendations(
        [participant(budget=15)],
        [restaurant(averagePrice=30)],
        "casual",
        False,
        True,
    )

    assert results == []


def test_hard_dietary_filter_excludes_unsupported_requirement():
    results = find_recommendations(
        [participant(dietary=["halal"])],
        [restaurant(dietsSupported=["vegetarian"])],
        "casual",
        False,
        True,
    )

    assert results == []


def test_ranking_orders_highest_total_first():
    cheap_japanese = restaurant(id="japanese", averagePrice=20, cuisineKey="japanese")
    neutral_british = restaurant(
        id="british",
        cuisine="British",
        cuisineKey="british",
        averagePrice=20,
        rating=4.0,
        reviews=500,
    )

    results = find_recommendations(
        [participant(likes=["japanese"])],
        [neutral_british, cheap_japanese],
        "casual",
        False,
        True,
    )

    assert [result.restaurant.id for result in results] == ["japanese", "british"]
