"""merge_lop_and_document_vault

Revision ID: f77d9ea871f5
Revises: b287a51b8b41, c1d2e3f4a5b6
Create Date: 2026-04-21 03:55:55.207465

"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f77d9ea871f5'
down_revision: Union[str, None] = ('b287a51b8b41', 'c1d2e3f4a5b6')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
