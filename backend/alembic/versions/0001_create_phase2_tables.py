"""create phase 2 persistence tables

Revision ID: 0001_create_phase2_tables
Revises:
Create Date: 2026-08-16 00:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op


revision: str = "0001_create_phase2_tables"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "rooms",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("room_code", sa.String(length=12), nullable=False),
        sa.Column("title", sa.String(length=120), nullable=False),
        sa.Column("occasion", sa.String(length=32), nullable=False),
        sa.Column("rain_mode", sa.Boolean(), nullable=False),
        sa.Column("open_now_only", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_rooms_room_code"), "rooms", ["room_code"], unique=True)

    op.create_table(
        "participants",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("room_id", sa.Integer(), nullable=False),
        sa.Column("display_name", sa.String(length=80), nullable=False),
        sa.Column("location", sa.String(length=120), nullable=False),
        sa.Column("latitude", sa.Float(), nullable=False),
        sa.Column("longitude", sa.Float(), nullable=False),
        sa.Column("likes", sa.JSON(), nullable=False),
        sa.Column("dislikes", sa.JSON(), nullable=False),
        sa.Column("dietary", sa.JSON(), nullable=False),
        sa.Column("budget", sa.Integer(), nullable=False),
        sa.Column("minimum_rating", sa.Float(), nullable=False),
        sa.Column("travel_mode", sa.String(length=32), nullable=False),
        sa.Column("maximum_travel_time", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["room_id"], ["rooms.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_participants_room_id"), "participants", ["room_id"], unique=False)

    op.create_table(
        "recommendation_runs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("room_id", sa.Integer(), nullable=False),
        sa.Column("algorithm_version", sa.String(length=40), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["room_id"], ["rooms.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_recommendation_runs_room_id"), "recommendation_runs", ["room_id"], unique=False)

    op.create_table(
        "recommendation_results",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("run_id", sa.Integer(), nullable=False),
        sa.Column("restaurant_id", sa.String(length=120), nullable=False),
        sa.Column("restaurant_snapshot", sa.JSON(), nullable=False),
        sa.Column("rank", sa.Integer(), nullable=False),
        sa.Column("geo_score", sa.Integer(), nullable=False),
        sa.Column("cuisine_score", sa.Integer(), nullable=False),
        sa.Column("quality_score", sa.Integer(), nullable=False),
        sa.Column("occasion_score", sa.Integer(), nullable=False),
        sa.Column("total_score", sa.Integer(), nullable=False),
        sa.Column("travel_breakdown", sa.JSON(), nullable=False),
        sa.Column("fallback_reason", sa.String(), nullable=False),
        sa.Column("archetype", sa.String(length=32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["run_id"], ["recommendation_runs.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_recommendation_results_restaurant_id"),
        "recommendation_results",
        ["restaurant_id"],
        unique=False,
    )
    op.create_index(op.f("ix_recommendation_results_run_id"), "recommendation_results", ["run_id"], unique=False)

    op.create_table(
        "votes",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("room_id", sa.Integer(), nullable=False),
        sa.Column("run_id", sa.Integer(), nullable=False),
        sa.Column("participant_id", sa.Integer(), nullable=False),
        sa.Column("recommendation_result_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["participant_id"], ["participants.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["recommendation_result_id"], ["recommendation_results.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["room_id"], ["rooms.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["run_id"], ["recommendation_runs.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("participant_id", "run_id", name="uq_vote_participant_run"),
    )
    op.create_index(op.f("ix_votes_participant_id"), "votes", ["participant_id"], unique=False)
    op.create_index(op.f("ix_votes_recommendation_result_id"), "votes", ["recommendation_result_id"], unique=False)
    op.create_index(op.f("ix_votes_room_id"), "votes", ["room_id"], unique=False)
    op.create_index(op.f("ix_votes_run_id"), "votes", ["run_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_votes_run_id"), table_name="votes")
    op.drop_index(op.f("ix_votes_room_id"), table_name="votes")
    op.drop_index(op.f("ix_votes_recommendation_result_id"), table_name="votes")
    op.drop_index(op.f("ix_votes_participant_id"), table_name="votes")
    op.drop_table("votes")
    op.drop_index(op.f("ix_recommendation_results_run_id"), table_name="recommendation_results")
    op.drop_index(op.f("ix_recommendation_results_restaurant_id"), table_name="recommendation_results")
    op.drop_table("recommendation_results")
    op.drop_index(op.f("ix_recommendation_runs_room_id"), table_name="recommendation_runs")
    op.drop_table("recommendation_runs")
    op.drop_index(op.f("ix_participants_room_id"), table_name="participants")
    op.drop_table("participants")
    op.drop_index(op.f("ix_rooms_room_code"), table_name="rooms")
    op.drop_table("rooms")
