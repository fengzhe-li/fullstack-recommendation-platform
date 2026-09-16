"""add ai explanation fields

Revision ID: 0002_add_ai_explanations
Revises: 0001_create_phase2_tables
Create Date: 2026-08-16 00:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op


revision: str = "0002_add_ai_explanations"
down_revision: str | None = "0001_create_phase2_tables"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("recommendation_results", sa.Column("ai_explanation", sa.String(), nullable=True))
    op.add_column("recommendation_results", sa.Column("ai_provider", sa.String(length=40), nullable=True))
    op.add_column("recommendation_results", sa.Column("ai_model", sa.String(length=80), nullable=True))
    op.add_column("recommendation_results", sa.Column("ai_status", sa.String(length=40), nullable=True))
    op.add_column("recommendation_results", sa.Column("ai_generated_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column("recommendation_results", "ai_generated_at")
    op.drop_column("recommendation_results", "ai_status")
    op.drop_column("recommendation_results", "ai_model")
    op.drop_column("recommendation_results", "ai_provider")
    op.drop_column("recommendation_results", "ai_explanation")
