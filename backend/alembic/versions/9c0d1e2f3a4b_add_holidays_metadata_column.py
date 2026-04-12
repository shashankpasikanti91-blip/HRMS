"""add_holidays_metadata_column

Revision ID: 9c0d1e2f3a4b
Revises: f7a8b9c0d1e2
Create Date: 2026-04-12

"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision: str = "9c0d1e2f3a4b"
down_revision: Union[str, None] = "f7a8b9c0d1e2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _column_exists(table_name: str, column_name: str) -> bool:
    bind = op.get_bind()
    insp = inspect(bind)
    columns = [c["name"] for c in insp.get_columns(table_name)]
    return column_name in columns


def upgrade() -> None:
    if not _column_exists("holidays", "metadata"):
        op.add_column("holidays", sa.Column("metadata", sa.JSON(), nullable=True))


def downgrade() -> None:
    if _column_exists("holidays", "metadata"):
        op.drop_column("holidays", "metadata")
