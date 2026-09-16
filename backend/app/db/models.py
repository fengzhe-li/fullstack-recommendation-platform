from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class Room(Base):
    __tablename__ = "rooms"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    room_code: Mapped[str] = mapped_column(String(12), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(120), default="London Dinner")
    occasion: Mapped[str] = mapped_column(String(32), default="casual")
    rain_mode: Mapped[bool] = mapped_column(Boolean, default=False)
    open_now_only: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    participants: Mapped[list["Participant"]] = relationship(
        back_populates="room",
        cascade="all, delete-orphan",
    )
    recommendation_runs: Mapped[list["RecommendationRun"]] = relationship(
        back_populates="room",
        cascade="all, delete-orphan",
    )
    votes: Mapped[list["Vote"]] = relationship(back_populates="room", cascade="all, delete-orphan")


class Participant(Base):
    __tablename__ = "participants"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    room_id: Mapped[int] = mapped_column(ForeignKey("rooms.id", ondelete="CASCADE"), index=True)
    display_name: Mapped[str] = mapped_column(String(80))
    location: Mapped[str] = mapped_column(String(120), default="")
    latitude: Mapped[float] = mapped_column(Float, default=51.513)
    longitude: Mapped[float] = mapped_column(Float, default=-0.136)
    likes: Mapped[list[str]] = mapped_column(JSON, default=list)
    dislikes: Mapped[list[str]] = mapped_column(JSON, default=list)
    dietary: Mapped[list[str]] = mapped_column(JSON, default=list)
    token_hash: Mapped[str] = mapped_column(String(64))
    budget: Mapped[int] = mapped_column(Integer, default=25)
    minimum_rating: Mapped[float] = mapped_column(Float, default=4.0)
    travel_mode: Mapped[str] = mapped_column(String(32), default="transit")
    maximum_travel_time: Mapped[int] = mapped_column(Integer, default=30)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    room: Mapped[Room] = relationship(back_populates="participants")
    votes: Mapped[list["Vote"]] = relationship(back_populates="participant")


class RecommendationRun(Base):
    __tablename__ = "recommendation_runs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    room_id: Mapped[int] = mapped_column(ForeignKey("rooms.id", ondelete="CASCADE"), index=True)
    algorithm_version: Mapped[str] = mapped_column(String(40), default="phase1-scoring-v1")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    room: Mapped[Room] = relationship(back_populates="recommendation_runs")
    results: Mapped[list["RecommendationResult"]] = relationship(
        back_populates="run",
        cascade="all, delete-orphan",
        order_by="RecommendationResult.rank",
    )
    votes: Mapped[list["Vote"]] = relationship(back_populates="run", cascade="all, delete-orphan")


class RecommendationResult(Base):
    __tablename__ = "recommendation_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    run_id: Mapped[int] = mapped_column(
        ForeignKey("recommendation_runs.id", ondelete="CASCADE"),
        index=True,
    )
    restaurant_id: Mapped[str] = mapped_column(String(120), index=True)
    restaurant_snapshot: Mapped[dict] = mapped_column(JSON)
    rank: Mapped[int] = mapped_column(Integer)
    geo_score: Mapped[int] = mapped_column(Integer)
    cuisine_score: Mapped[int] = mapped_column(Integer)
    quality_score: Mapped[int] = mapped_column(Integer)
    occasion_score: Mapped[int] = mapped_column(Integer)
    total_score: Mapped[int] = mapped_column(Integer)
    travel_breakdown: Mapped[list[dict]] = mapped_column(JSON)
    fallback_reason: Mapped[str] = mapped_column(String)
    archetype: Mapped[str] = mapped_column(String(32), default="best")
    ai_explanation: Mapped[str | None] = mapped_column(String, nullable=True)
    ai_provider: Mapped[str | None] = mapped_column(String(40), nullable=True)
    ai_model: Mapped[str | None] = mapped_column(String(80), nullable=True)
    ai_status: Mapped[str | None] = mapped_column(String(40), nullable=True)
    ai_generated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    run: Mapped[RecommendationRun] = relationship(back_populates="results")
    votes: Mapped[list["Vote"]] = relationship(back_populates="recommendation_result")


class Vote(Base):
    __tablename__ = "votes"
    __table_args__ = (UniqueConstraint("participant_id", "run_id", name="uq_vote_participant_run"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    room_id: Mapped[int] = mapped_column(ForeignKey("rooms.id", ondelete="CASCADE"), index=True)
    run_id: Mapped[int] = mapped_column(ForeignKey("recommendation_runs.id", ondelete="CASCADE"), index=True)
    participant_id: Mapped[int] = mapped_column(ForeignKey("participants.id", ondelete="CASCADE"), index=True)
    recommendation_result_id: Mapped[int] = mapped_column(
        ForeignKey("recommendation_results.id", ondelete="CASCADE"),
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    room: Mapped[Room] = relationship(back_populates="votes")
    run: Mapped[RecommendationRun] = relationship(back_populates="votes")
    participant: Mapped[Participant] = relationship(back_populates="votes")
    recommendation_result: Mapped[RecommendationResult] = relationship(back_populates="votes")
