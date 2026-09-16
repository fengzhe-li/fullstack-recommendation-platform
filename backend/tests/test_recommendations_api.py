def test_valid_recommendation_request_returns_ranked_results(client):
    response = client.post(
        "/api/recommendations",
        json={
            "participants": [
                {
                    "id": "p1",
                    "name": "Alice",
                    "location": "W1",
                    "lat": 51.513,
                    "lng": -0.136,
                    "likes": ["japanese"],
                    "dislikes": [],
                    "dietary": [],
                    "budget": 40,
                    "rating": 4.0,
                    "travelMode": "transit",
                    "travelTime": 45,
                }
            ],
            "occasion": "casual",
            "rainMode": False,
            "openNow": True,
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert len(payload["recommendations"]) > 0
    assert payload["recommendations"][0]["scores"]["total"] >= payload["recommendations"][-1]["scores"]["total"]
    assert 0 <= payload["recommendations"][0]["score"] <= 1


def test_invalid_recommendation_request_is_rejected(client):
    response = client.post("/api/recommendations", json={"participants": []})

    assert response.status_code == 422
