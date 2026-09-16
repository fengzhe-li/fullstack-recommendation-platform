"""add participant token hash

Revision ID: 0003_add_participant_token_hash
Revises: 0002_add_ai_explanations
Create Date: 2026-08-16 00:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op


revision: str = "0003_add_participant_token_hash"
down_revision: str | None = "0002_add_ai_explanations"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    with op.batch_alter_table("participants") as batch_op:
        batch_op.add_column(sa.Column("token_hash", sa.String(length=64), nullable=True))
    op.execute("UPDATE participants SET token_hash = 'legacy-token-required' WHERE token_hash IS NULL")
    with op.batch_alter_table("participants") as batch_op:
        batch_op.alter_column("token_hash", nullable=False)


def downgrade() -> None:
    with op.batch_alter_table("participants") as batch_op:
        batch_op.drop_column("token_hash")
