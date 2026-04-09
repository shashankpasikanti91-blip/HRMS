"""add_google_oauth_fields

Adds google_id, provider, and product_access columns to the users table
to support Google OAuth (NextAuth integration) and multi-product SaaS access.

Revision ID: a1b2c3d4e5f6
Revises: 6090ee7cf78b
Create Date: 2026-04-09 00:00:00.000000

"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "6090ee7cf78b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # google_id — unique Google sub identifier
    op.add_column(
        "users",
        sa.Column("google_id", sa.String(255), nullable=True),
    )
    op.create_index("ix_users_google_id", "users", ["google_id"], unique=False)

    # provider — 'local' | 'google'
    op.add_column(
        "users",
        sa.Column(
            "provider",
            sa.String(30),
            nullable=False,
            server_default="local",
        ),
    )

    # product_access — JSON array e.g. ["recruit"]
    op.add_column(
        "users",
        sa.Column(
            "product_access",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=True,
        ),
    )


def downgrade() -> None:
    op.drop_column("users", "product_access")
    op.drop_column("users", "provider")
    op.drop_index("ix_users_google_id", table_name="users")
    op.drop_column("users", "google_id")
