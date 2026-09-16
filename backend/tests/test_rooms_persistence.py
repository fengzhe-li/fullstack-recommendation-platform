def participant_payload(name="Alice", **overrides):
    payload = {
        "name": name,
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
    payload.update(overrides)
    return payload


def create_room(client):
    response = client.post(
        "/api/rooms",
        json={
            "title": "Dinner",
            "occasion": "casual",
            "rainMode": False,
            "openNow": True,
        },
    )
    assert response.status_code == 200
    return response.json()


def add_participant(client, room_code, name="Alice", **overrides):
    response = client.post(
        f"/api/rooms/{room_code}/participants",
        json=participant_payload(name, **overrides),
    )
    assert response.status_code == 200
    return response.json()


def test_room_can_be_created_and_loaded_with_participants(client):
    room = create_room(client)
    participant = add_participant(client, room["roomCode"])

    response = client.get(f"/api/rooms/{room['roomCode']}")

    assert response.status_code == 200
    payload = response.json()
    assert payload["roomCode"] == room["roomCode"]
    assert payload["participants"][0]["id"] == participant["id"]
    assert payload["participants"][0]["name"] == "Alice"
    assert "participantToken" in participant
    assert "participantToken" not in payload["participants"][0]


def test_participant_can_be_updated_and_deleted(client):
    room = create_room(client)
    participant = add_participant(client, room["roomCode"])

    update_response = client.patch(
        f"/api/participants/{participant['id']}",
        headers={"X-Participant-Token": participant["participantToken"]},
        json={"budget": 25, "likes": ["italian"]},
    )
    assert update_response.status_code == 200
    assert update_response.json()["budget"] == 25
    assert update_response.json()["likes"] == ["italian"]

    delete_response = client.delete(
        f"/api/participants/{participant['id']}",
        headers={"X-Participant-Token": update_response.json()["participantToken"]},
    )
    assert delete_response.status_code == 200

    room_response = client.get(f"/api/rooms/{room['roomCode']}")
    assert room_response.json()["participants"] == []


def test_participant_update_and_delete_require_valid_token(client):
    room = create_room(client)
    participant = add_participant(client, room["roomCode"])

    missing_token = client.patch(f"/api/participants/{participant['id']}", json={"budget": 25})
    assert missing_token.status_code == 403

    bad_token = client.delete(
        f"/api/participants/{participant['id']}",
        headers={"X-Participant-Token": "wrong-token"},
    )
    assert bad_token.status_code == 403


def test_room_recommendation_run_is_persisted_and_returned_as_latest(client):
    room = create_room(client)
    add_participant(client, room["roomCode"], "Alice", likes=["japanese"], budget=40)
    add_participant(client, room["roomCode"], "Bob", likes=["italian"], budget=45, lat=51.508, lng=-0.128)

    run_response = client.post(f"/api/rooms/{room['roomCode']}/recommendations")
    assert run_response.status_code == 200
    recommendations = run_response.json()["recommendations"]

    assert len(recommendations) > 0
    assert recommendations[0]["id"] is not None
    assert recommendations[0]["rank"] == 1

    latest_response = client.get(f"/api/rooms/{room['roomCode']}/recommendations/latest")
    assert latest_response.status_code == 200
    assert latest_response.json()["recommendations"][0]["id"] == recommendations[0]["id"]


def test_vote_is_persisted_and_duplicate_vote_updates_choice(client):
    room = create_room(client)
    participant = add_participant(client, room["roomCode"], "Alice", likes=["japanese"], budget=50)
    add_participant(client, room["roomCode"], "Bob", likes=["italian"], budget=50, lat=51.508, lng=-0.128)
    recommendations = client.post(f"/api/rooms/{room['roomCode']}/recommendations").json()["recommendations"]

    first_vote = client.post(
        f"/api/rooms/{room['roomCode']}/votes",
        headers={"X-Participant-Token": participant["participantToken"]},
        json={
            "participantId": int(participant["id"]),
            "recommendationResultId": recommendations[0]["id"],
        },
    )
    assert first_vote.status_code == 200
    assert first_vote.json()["winner"]["id"] == recommendations[0]["id"]

    second_vote = client.post(
        f"/api/rooms/{room['roomCode']}/votes",
        headers={"X-Participant-Token": participant["participantToken"]},
        json={
            "participantId": int(participant["id"]),
            "recommendationResultId": recommendations[1]["id"],
        },
    )
    assert second_vote.status_code == 200
    assert second_vote.json()["voteId"] == first_vote.json()["voteId"]

    counts = {
        item["recommendationResultId"]: item["count"]
        for item in client.get(f"/api/rooms/{room['roomCode']}/winner").json()["voteCounts"]
    }
    assert counts[recommendations[0]["id"]] == 0
    assert counts[recommendations[1]["id"]] == 1


def test_vote_rejects_participant_from_another_room(client):
    room = create_room(client)
    other_room = create_room(client)
    add_participant(client, room["roomCode"], "Alice", likes=["japanese"], budget=50)
    add_participant(client, room["roomCode"], "Bob", likes=["italian"], budget=50, lat=51.508, lng=-0.128)
    other_participant = add_participant(client, other_room["roomCode"], "Mallory")
    recommendations = client.post(f"/api/rooms/{room['roomCode']}/recommendations").json()["recommendations"]

    response = client.post(
        f"/api/rooms/{room['roomCode']}/votes",
        headers={"X-Participant-Token": other_participant["participantToken"]},
        json={
            "participantId": int(other_participant["id"]),
            "recommendationResultId": recommendations[0]["id"],
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid participant for room"


def test_vote_requires_valid_participant_token(client):
    room = create_room(client)
    participant = add_participant(client, room["roomCode"], "Alice", likes=["japanese"], budget=50)
    add_participant(client, room["roomCode"], "Bob", likes=["italian"], budget=50, lat=51.508, lng=-0.128)
    recommendations = client.post(f"/api/rooms/{room['roomCode']}/recommendations").json()["recommendations"]

    missing_token = client.post(
        f"/api/rooms/{room['roomCode']}/votes",
        json={
            "participantId": int(participant["id"]),
            "recommendationResultId": recommendations[0]["id"],
        },
    )
    assert missing_token.status_code == 403

    bad_token = client.post(
        f"/api/rooms/{room['roomCode']}/votes",
        headers={"X-Participant-Token": "wrong-token"},
        json={
            "participantId": int(participant["id"]),
            "recommendationResultId": recommendations[0]["id"],
        },
    )
    assert bad_token.status_code == 403


def test_invalid_room_recommendation_request_requires_participant(client):
    room = create_room(client)

    response = client.post(f"/api/rooms/{room['roomCode']}/recommendations")

    assert response.status_code == 400


def test_ai_enabled_recommendations_fallback_when_api_key_missing(client, monkeypatch):
    from app.routes import recommendations as recommendation_routes

    monkeypatch.setattr(recommendation_routes.ai_service, "api_key", "")
    room = create_room(client)
    add_participant(client, room["roomCode"], "Alice", likes=["japanese"], budget=50)
    add_participant(client, room["roomCode"], "Bob", likes=["italian"], budget=50, lat=51.508, lng=-0.128)

    response = client.post(
        f"/api/rooms/{room['roomCode']}/recommendations",
        json={"use_ai_explanations": True},
    )

    assert response.status_code == 200
    recommendations = response.json()["recommendations"]
    assert len(recommendations) > 0
    assert recommendations[0]["aiExplanation"] is None
    assert recommendations[0]["aiStatus"] == "missing_api_key"
    assert recommendations[0]["reason"]


def test_ai_enabled_recommendations_store_mocked_explanations_without_changing_ranking(client, monkeypatch):
    from app.routes import recommendations as recommendation_routes

    room = create_room(client)
    add_participant(client, room["roomCode"], "Alice", likes=["japanese"], budget=50)
    add_participant(client, room["roomCode"], "Bob", likes=["italian"], budget=50, lat=51.508, lng=-0.128)

    deterministic = client.post(f"/api/rooms/{room['roomCode']}/recommendations").json()["recommendations"]
    deterministic_order = [item["restaurant"]["id"] for item in deterministic]

    def fake_generate_and_persist(db, result, participants, occasion):
        result.ai_explanation = f"Stored explanation for rank {result.rank}"
        result.ai_provider = "Z.AI"
        result.ai_model = "glm-5.1"
        result.ai_status = "generated"
        db.add(result)
        db.commit()
        db.refresh(result)

    monkeypatch.setattr(
        recommendation_routes.ai_service,
        "generate_and_persist",
        fake_generate_and_persist,
    )

    ai_response = client.post(
        f"/api/rooms/{room['roomCode']}/recommendations",
        json={"use_ai_explanations": True},
    )

    assert ai_response.status_code == 200
    ai_recommendations = ai_response.json()["recommendations"]
    assert [item["restaurant"]["id"] for item in ai_recommendations] == deterministic_order
    assert ai_recommendations[0]["aiExplanation"] == "Stored explanation for rank 1"
    assert ai_recommendations[0]["aiProvider"] == "Z.AI"

    explain_response = client.post(f"/api/recommendations/{ai_recommendations[0]['id']}/explain")
    assert explain_response.status_code == 200
    assert explain_response.json()["recommendations"][0]["aiExplanation"] == "Stored explanation for rank 1"
