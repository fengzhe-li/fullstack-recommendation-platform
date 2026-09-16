from datetime import datetime
from typing import Dict, List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


TravelMode = Literal["transit", "walking", "bus", "cycling", "driving"]
Occasion = Literal["casual", "birthday", "date", "business", "celebration"]
Archetype = Literal["best", "close", "taste"]


class Participant(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str = ""
    name: str
    location: str = ""
    lat: float = 51.513
    lng: float = -0.136
    likes: List[str] = Field(default_factory=list)
    preferences: Optional[List[str]] = None
    dislikes: List[str] = Field(default_factory=list)
    dietary: List[str] = Field(default_factory=list)
    budget: int = 25
    rating: float = 4.0
    travelMode: TravelMode = "transit"
    travelTime: int = 30


class Restaurant(BaseModel):
    id: str
    name: str
    cuisine: str
    cuisineKey: str
    address: str
    lat: float
    lng: float
    rating: float
    reviews: int
    price: Literal["£", "££", "£££", "££££"]
    averagePrice: int
    priceRange: str
    dietsSupported: List[str]
    mapsUrl: str
    bookUrl: str
    emoji: str
    occasions: Dict[Occasion, int]
    isOpenNow: Optional[bool] = None


class TravelTimeResult(BaseModel):
    participantName: str
    min: int
    mode: TravelMode


class ScoringBreakdown(BaseModel):
    geo: int
    cuisine: int
    quality: int
    occasion: int
    total: int


class RecommendationResult(BaseModel):
    id: Optional[int] = None
    rank: Optional[int] = None
    restaurant: Restaurant
    scores: ScoringBreakdown
    travels: List[TravelTimeResult]
    reason: str
    reasonEn: Optional[str] = None
    reasonZh: Optional[str] = None
    archetype: Archetype
    votes: int = 0
    score: float
    aiExplanation: Optional[str] = None
    aiProvider: Optional[str] = None
    aiModel: Optional[str] = None
    aiStatus: Optional[str] = None
    aiGeneratedAt: Optional[datetime] = None


class RecommendationRequest(BaseModel):
    participants: List[Participant] = Field(..., min_length=1)
    occasion: Occasion = "casual"
    rainMode: bool = False
    openNow: bool = True


class RecommendationResponse(BaseModel):
    recommendations: List[RecommendationResult]


class RoomRecommendationRequest(BaseModel):
    use_ai_explanations: bool = False


class RoomCreate(BaseModel):
    title: str = "London Dinner"
    occasion: Occasion = "casual"
    rainMode: bool = False
    openNow: bool = True


class RoomUpdate(BaseModel):
    title: Optional[str] = None
    occasion: Optional[Occasion] = None
    rainMode: Optional[bool] = None
    openNow: Optional[bool] = None


class ParticipantCreate(BaseModel):
    id: str = ""
    name: str
    location: str = ""
    lat: float = 51.513
    lng: float = -0.136
    likes: List[str] = Field(default_factory=list)
    dislikes: List[str] = Field(default_factory=list)
    dietary: List[str] = Field(default_factory=list)
    budget: int = Field(default=25, ge=1, le=500)
    rating: float = Field(default=4.0, ge=0, le=5)
    travelMode: TravelMode = "transit"
    travelTime: int = Field(default=30, ge=1, le=240)


class ParticipantUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    likes: Optional[List[str]] = None
    dislikes: Optional[List[str]] = None
    dietary: Optional[List[str]] = None
    budget: Optional[int] = Field(default=None, ge=1, le=500)
    rating: Optional[float] = Field(default=None, ge=0, le=5)
    travelMode: Optional[TravelMode] = None
    travelTime: Optional[int] = Field(default=None, ge=1, le=240)


class ParticipantRead(Participant):
    id: str


class ParticipantIdentity(ParticipantRead):
    participantToken: str


class RoomRead(BaseModel):
    id: int
    roomCode: str
    title: str
    occasion: Occasion
    rainMode: bool
    openNow: bool
    createdAt: datetime
    updatedAt: datetime


class VoteCount(BaseModel):
    recommendationResultId: int
    count: int


class WinnerResponse(BaseModel):
    voteCounts: List[VoteCount]
    winner: Optional[RecommendationResult] = None


class RoomState(RoomRead):
    participants: List[ParticipantRead]
    latestRecommendations: Optional[RecommendationResponse] = None
    voteCounts: List[VoteCount] = Field(default_factory=list)
    winner: Optional[RecommendationResult] = None


class VoteRequest(BaseModel):
    participantId: int
    recommendationResultId: int


class VoteResponse(WinnerResponse):
    voteId: int
