import math
from typing import Iterable, List

from app.domain.models import (
    Occasion,
    Participant,
    RecommendationResult,
    Restaurant,
    ScoringBreakdown,
    TravelMode,
    TravelTimeResult,
)


def get_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    radius_km = 6371
    d_lat = ((lat2 - lat1) * math.pi) / 180
    d_lon = ((lon2 - lon1) * math.pi) / 180
    a = (
        math.sin(d_lat / 2) * math.sin(d_lat / 2)
        + math.cos((lat1 * math.pi) / 180)
        * math.cos((lat2 * math.pi) / 180)
        * math.sin(d_lon / 2)
        * math.sin(d_lon / 2)
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return radius_km * c


def estimate_travel_time(distance_km: float, mode: TravelMode, rain_mode: bool) -> int:
    minutes = 0.0

    if mode == "walking":
        minutes = (distance_km / 5) * 60
        if rain_mode:
            minutes *= 1.4
    elif mode == "cycling":
        minutes = (distance_km / 15) * 60 + 2
        if rain_mode:
            minutes *= 1.25
    elif mode == "transit":
        minutes = (distance_km / 25) * 60 + 6
        if rain_mode:
            minutes += 3
    elif mode == "bus":
        minutes = (distance_km / 12) * 60 + 5
        if rain_mode:
            minutes += 6
    elif mode == "driving":
        minutes = (distance_km / 18) * 60 + 4
        if rain_mode:
            minutes += 5
    else:
        minutes = distance_km * 10

    if distance_km > 0.1 and minutes < 3:
        minutes = 3

    return round(minutes)


def find_recommendations(
    participants: Iterable[Participant],
    restaurants: Iterable[Restaurant],
    occasion: Occasion,
    rain_mode: bool,
    open_now: bool = True,
) -> List[RecommendationResult]:
    participant_list = [_normalise_participant(participant) for participant in participants]
    if len(participant_list) == 0:
        return []

    results: List[RecommendationResult] = []

    for restaurant in restaurants:
        if open_now and restaurant.isOpenNow is False:
            continue

        filtered_out = False
        travels: List[TravelTimeResult] = []

        for participant in participant_list:
            distance = get_haversine_distance(
                participant.lat,
                participant.lng,
                restaurant.lat,
                restaurant.lng,
            )
            estimated_time = estimate_travel_time(distance, participant.travelMode, rain_mode)
            travels.append(
                TravelTimeResult(
                    participantName=participant.name,
                    min=estimated_time,
                    mode=participant.travelMode,
                )
            )

            if estimated_time > participant.travelTime:
                filtered_out = True

        for participant in participant_list:
            if restaurant.averagePrice > participant.budget:
                filtered_out = True

            if restaurant.rating < participant.rating:
                filtered_out = True

            if restaurant.cuisineKey in participant.dislikes:
                filtered_out = True

            for requirement in participant.dietary:
                if requirement in ("vegetarian", "vegan"):
                    continue
                if requirement not in restaurant.dietsSupported:
                    filtered_out = True

        if filtered_out:
            continue

        travel_minutes = [travel.min for travel in travels]
        avg_travel_time = sum(travel_minutes) / len(travel_minutes)
        variance = sum((item - avg_travel_time) ** 2 for item in travel_minutes) / len(
            travel_minutes
        )
        std_dev = math.sqrt(variance)

        geo_score = max(5, math.ceil(30 - avg_travel_time * 0.4 - std_dev * 0.8))
        if geo_score > 30:
            geo_score = 30

        cuisine_score = 10
        matches_count = 0
        for participant in participant_list:
            if restaurant.cuisineKey in participant.likes:
                matches_count += 1
        if len(participant_list) > 0:
            ratio = matches_count / len(participant_list)
            cuisine_score = math.floor(10 + ratio * 15)

        has_vegetarian_guest = any(
            diet in ("vegetarian", "vegan")
            for participant in participant_list
            for diet in participant.dietary
        )
        if has_vegetarian_guest and "vegetarian" in restaurant.dietsSupported:
            cuisine_score = min(25, cuisine_score + 3)

        rating_scaled = ((restaurant.rating - 3.5) / 1.5) * 10
        reviews_scaled = min(5, (restaurant.reviews / 12000) * 5)
        quality_score = math.ceil(rating_scaled + reviews_scaled)
        occasion_score = restaurant.occasions.get(occasion, 7)
        total = geo_score + cuisine_score + quality_score + occasion_score

        reason = _build_reason(
            participant_list,
            restaurant,
            occasion,
            travels,
            travel_minutes,
            avg_travel_time,
            has_vegetarian_guest,
        )

        results.append(
            RecommendationResult(
                restaurant=restaurant,
                scores=ScoringBreakdown(
                    geo=geo_score,
                    cuisine=cuisine_score,
                    quality=quality_score,
                    occasion=occasion_score,
                    total=total,
                ),
                travels=travels,
                reason=reason,
                reasonZh=reason,
                reasonEn=reason,
                archetype="best",
                votes=0,
                score=round(total / 80, 4),
            )
        )

    results.sort(key=lambda item: item.scores.total, reverse=True)

    if len(results) > 0:
        results[0].archetype = "best"
    if len(results) > 1:
        results[1].archetype = "close"
    if len(results) > 2:
        results[2].archetype = "taste"

    return results[:3]


def _normalise_participant(participant: Participant) -> Participant:
    if participant.preferences and not participant.likes:
        participant.likes = [preference.lower() for preference in participant.preferences]
    else:
        participant.likes = [like.lower() for like in participant.likes]
    participant.dislikes = [dislike.lower() for dislike in participant.dislikes]
    participant.dietary = [diet.lower() for diet in participant.dietary]
    return participant


def _build_reason(
    participants: List[Participant],
    restaurant: Restaurant,
    occasion: Occasion,
    travels: List[TravelTimeResult],
    travel_minutes: List[int],
    avg_travel_time: float,
    has_vegetarian_guest: bool,
) -> str:
    liked_names = [
        participant.name
        for participant in participants
        if restaurant.cuisineKey in participant.likes
    ]
    shortest_travel = min(travel_minutes)
    longest_travel = max(travel_minutes)
    short_travel_name = next(
        (travel.participantName for travel in travels if travel.min == shortest_travel), ""
    )
    long_travel_name = next(
        (travel.participantName for travel in travels if travel.min == longest_travel), ""
    )

    if liked_names:
        reason = (
            f"Perfecty satisfies the {restaurant.cuisine} cravings preferred by "
            f"{', '.join(liked_names)}."
        )
    else:
        reason = "Culinary styles blend seamlessly, offering safe food selections for all companions."

    reason += (
        " The venue offers an optimized location, with a swift commute averaging "
        f"just {round(avg_travel_time)} minutes."
    )

    if longest_travel - shortest_travel < 8:
        reason += (
            " Commute durations match within a highly balanced "
            f"{round(longest_travel - shortest_travel)} mins, ensuring outstanding geographic equality."
        )
    else:
        reason += (
            f" Specifically, {short_travel_name} can reach here in just {shortest_travel} "
            f"mins, while {long_travel_name} takes {longest_travel} mins."
        )

    if has_vegetarian_guest and "vegetarian" in restaurant.dietsSupported:
        reason += " Highly rated for vegetarian dishes, matching specific guest criteria."

    if occasion == "casual":
        reason += " With great price-to-value or cozy social seating, this is set for your casual hangout."
    elif occasion == "date":
        reason += " Charming vibes paired with delicious culinary curation makes it a splendid dating sanctuary."
    elif occasion in ("celebration", "birthday"):
        reason += " Excellent rating with dynamic space arrangements, superb for high-energy celebratory get-togethers."
    else:
        reason += " Clean modern layout and elegant menus, forming an outstanding setting for professional or conversational gatherings."

    return reason
