"""Add holidays table and visa fields to employees

Revision ID: add_holidays_visa
Revises:
Create Date: 2026-04-12
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision = "add_holidays_visa"
down_revision = "a1b2c3d4e5f6"
branch_labels = None
depends_on = None


def _column_exists(table_name: str, column_name: str) -> bool:
    """Check if a column already exists."""
    bind = op.get_bind()
    insp = inspect(bind)
    columns = [c["name"] for c in insp.get_columns(table_name)]
    return column_name in columns


def _table_exists(table_name: str) -> bool:
    """Check if a table already exists."""
    bind = op.get_bind()
    insp = inspect(bind)
    return table_name in insp.get_table_names()


def upgrade() -> None:
    # Create holidays table
    if not _table_exists("holidays"):
        op.create_table(
            "holidays",
            sa.Column("id", sa.String(36), primary_key=True),
            sa.Column("business_id", sa.String(50), unique=True, nullable=False),
            sa.Column("company_id", sa.String(36), sa.ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True),
            sa.Column("name", sa.String(255), nullable=False),
            sa.Column("date", sa.Date, nullable=False, index=True),
            sa.Column("holiday_type", sa.String(50), nullable=False, server_default="public"),
            sa.Column("country", sa.String(100), nullable=True, index=True),
            sa.Column("state", sa.String(100), nullable=True, index=True),
            sa.Column("description", sa.Text, nullable=True),
            sa.Column("is_paid", sa.Boolean, nullable=False, server_default="true"),
            sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
            sa.Column("is_deleted", sa.Boolean, nullable=False, server_default="false"),
            sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("created_by", sa.String(36), nullable=True),
            sa.Column("updated_by", sa.String(36), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.UniqueConstraint("company_id", "date", "name", name="uq_holiday_company_date_name"),
        )

    # Add visa fields to employees
    visa_columns = {
        "visa_status": sa.Column("visa_status", sa.String(50), nullable=True),
        "visa_type": sa.Column("visa_type", sa.String(100), nullable=True),
        "visa_expiry_date": sa.Column("visa_expiry_date", sa.Date, nullable=True, index=True),
        "passport_number": sa.Column("passport_number", sa.String(50), nullable=True),
        "passport_expiry_date": sa.Column("passport_expiry_date", sa.Date, nullable=True),
        "nationality": sa.Column("nationality", sa.String(100), nullable=True),
    }
    for col_name, col_def in visa_columns.items():
        if not _column_exists("employees", col_name):
            op.add_column("employees", col_def)


def downgrade() -> None:
    for col in ["visa_status", "visa_type", "visa_expiry_date", "passport_number", "passport_expiry_date", "nationality"]:
        if _column_exists("employees", col):
            op.drop_column("employees", col)
    if _table_exists("holidays"):
        op.drop_table("holidays")
