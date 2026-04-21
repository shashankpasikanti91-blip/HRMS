"""Add document vault tables: document_type_templates, employee_documents,
document_access_logs, onboarding_checklists, onboarding_checklist_items,
exit_checklists, exit_checklist_items, employee_bank_accounts.

Revision ID: c1d2e3f4a5b6
Revises: f7a8b9c0d1e2
Create Date: 2026-05-15
"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision: str = "c1d2e3f4a5b6"
down_revision: Union[str, None] = "f7a8b9c0d1e2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _table_exists(table_name: str) -> bool:
    bind = op.get_bind()
    insp = inspect(bind)
    return table_name in insp.get_table_names()


def upgrade() -> None:
    # ── document_type_templates ─────────────────────────────────────────
    if not _table_exists("document_type_templates"):
        op.create_table(
            "document_type_templates",
            sa.Column("id", sa.String(36), nullable=False),
            sa.Column("business_id", sa.String(50), nullable=False),
            sa.Column("company_id", sa.String(36), nullable=True),
            sa.Column("name", sa.String(200), nullable=False),
            sa.Column("code", sa.String(100), nullable=False),
            sa.Column("category", sa.String(50), nullable=False, server_default="other"),
            sa.Column("country_code", sa.String(10), nullable=True),
            sa.Column("description", sa.Text(), nullable=True),
            sa.Column("is_mandatory", sa.Boolean(), nullable=False, server_default=sa.text("false")),
            sa.Column("is_expirable", sa.Boolean(), nullable=False, server_default=sa.text("false")),
            sa.Column("expiry_reminder_days", sa.Integer(), nullable=False, server_default="30"),
            sa.Column("allowed_mime_types", sa.Text(), nullable=True),
            sa.Column("max_file_size_mb", sa.Integer(), nullable=False, server_default="10"),
            sa.Column("access_level", sa.String(30), nullable=False, server_default="private"),
            sa.Column("sort_order", sa.Integer(), nullable=False, server_default="100"),
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
            sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default=sa.text("false")),
            sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("metadata_", sa.JSON(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("created_by", sa.String(36), nullable=True),
            sa.Column("updated_by", sa.String(36), nullable=True),
            sa.ForeignKeyConstraint(["company_id"], ["companies.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_doc_type_templates_business_id", "document_type_templates", ["business_id"], unique=True)
        op.create_index("ix_doc_type_templates_company_id", "document_type_templates", ["company_id"])
        op.create_index("ix_doc_type_templates_code", "document_type_templates", ["code"])
        op.create_index("ix_doc_type_templates_category", "document_type_templates", ["category"])
        op.create_index("ix_doc_type_templates_country", "document_type_templates", ["country_code"])

    # ── employee_documents ──────────────────────────────────────────────
    if not _table_exists("employee_documents"):
        op.create_table(
            "employee_documents",
            sa.Column("id", sa.String(36), nullable=False),
            sa.Column("business_id", sa.String(50), nullable=False),
            sa.Column("company_id", sa.String(36), nullable=False),
            sa.Column("employee_id", sa.String(36), nullable=False),
            sa.Column("template_id", sa.String(36), nullable=True),
            sa.Column("document_code", sa.String(100), nullable=True),
            sa.Column("document_name", sa.String(300), nullable=False),
            sa.Column("category", sa.String(50), nullable=False, server_default="other"),
            sa.Column("status", sa.String(40), nullable=False, server_default="uploaded"),
            sa.Column("access_level", sa.String(30), nullable=False, server_default="private"),
            sa.Column("file_name", sa.String(500), nullable=False),
            sa.Column("file_url", sa.String(1000), nullable=False),
            sa.Column("mime_type", sa.String(100), nullable=True),
            sa.Column("file_size", sa.BigInteger(), nullable=True),
            sa.Column("file_hash", sa.String(64), nullable=True),
            sa.Column("version", sa.Integer(), nullable=False, server_default="1"),
            sa.Column("uploaded_by_id", sa.String(36), nullable=True),
            sa.Column("reviewed_by_id", sa.String(36), nullable=True),
            sa.Column("notes", sa.Text(), nullable=True),
            sa.Column("rejection_reason", sa.Text(), nullable=True),
            sa.Column("expiry_date", sa.Date(), nullable=True),
            sa.Column("is_confidential", sa.Boolean(), nullable=False, server_default=sa.text("true")),
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
            sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default=sa.text("false")),
            sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("metadata_", sa.JSON(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("created_by", sa.String(36), nullable=True),
            sa.Column("updated_by", sa.String(36), nullable=True),
            sa.ForeignKeyConstraint(["company_id"], ["companies.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["employee_id"], ["employees.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["template_id"], ["document_type_templates.id"], ondelete="SET NULL"),
            sa.ForeignKeyConstraint(["uploaded_by_id"], ["users.id"], ondelete="SET NULL"),
            sa.ForeignKeyConstraint(["reviewed_by_id"], ["users.id"], ondelete="SET NULL"),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_employee_documents_business_id", "employee_documents", ["business_id"], unique=True)
        op.create_index("ix_employee_documents_company_id", "employee_documents", ["company_id"])
        op.create_index("ix_employee_documents_employee_id", "employee_documents", ["employee_id"])
        op.create_index("ix_employee_documents_template_id", "employee_documents", ["template_id"])
        op.create_index("ix_employee_documents_status", "employee_documents", ["status"])
        op.create_index("ix_employee_documents_category", "employee_documents", ["category"])
        op.create_index("ix_employee_documents_expiry", "employee_documents", ["expiry_date"])

    # ── document_access_logs ────────────────────────────────────────────
    if not _table_exists("document_access_logs"):
        op.create_table(
            "document_access_logs",
            sa.Column("id", sa.String(36), nullable=False),
            sa.Column("business_id", sa.String(50), nullable=False),
            sa.Column("company_id", sa.String(36), nullable=False),
            sa.Column("document_id", sa.String(36), nullable=False),
            sa.Column("actor_user_id", sa.String(36), nullable=True),
            sa.Column("action", sa.String(30), nullable=False),
            sa.Column("ip_address", sa.String(45), nullable=True),
            sa.Column("user_agent", sa.String(500), nullable=True),
            sa.Column("detail", sa.Text(), nullable=True),
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
            sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default=sa.text("false")),
            sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("metadata_", sa.JSON(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("created_by", sa.String(36), nullable=True),
            sa.Column("updated_by", sa.String(36), nullable=True),
            sa.ForeignKeyConstraint(["company_id"], ["companies.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["document_id"], ["employee_documents.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["actor_user_id"], ["users.id"], ondelete="SET NULL"),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_doc_access_logs_business_id", "document_access_logs", ["business_id"], unique=True)
        op.create_index("ix_doc_access_logs_company_id", "document_access_logs", ["company_id"])
        op.create_index("ix_doc_access_logs_document_id", "document_access_logs", ["document_id"])
        op.create_index("ix_doc_access_logs_action", "document_access_logs", ["action"])
        op.create_index("ix_doc_access_logs_actor_user_id", "document_access_logs", ["actor_user_id"])

    # ── onboarding_checklists ───────────────────────────────────────────
    if not _table_exists("onboarding_checklists"):
        op.create_table(
            "onboarding_checklists",
            sa.Column("id", sa.String(36), nullable=False),
            sa.Column("business_id", sa.String(50), nullable=False),
            sa.Column("company_id", sa.String(36), nullable=False),
            sa.Column("employee_id", sa.String(36), nullable=False),
            sa.Column("status", sa.String(40), nullable=False, server_default="not_started"),
            sa.Column("completion_pct", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("assigned_hr_id", sa.String(36), nullable=True),
            sa.Column("notes", sa.Text(), nullable=True),
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
            sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default=sa.text("false")),
            sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("metadata_", sa.JSON(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("created_by", sa.String(36), nullable=True),
            sa.Column("updated_by", sa.String(36), nullable=True),
            sa.ForeignKeyConstraint(["company_id"], ["companies.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["employee_id"], ["employees.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["assigned_hr_id"], ["users.id"], ondelete="SET NULL"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("employee_id"),
        )
        op.create_index("ix_onboarding_checklists_business_id", "onboarding_checklists", ["business_id"], unique=True)
        op.create_index("ix_onboarding_checklists_company_id", "onboarding_checklists", ["company_id"])
        op.create_index("ix_onboarding_checklists_employee_id", "onboarding_checklists", ["employee_id"])
        op.create_index("ix_onboarding_checklists_status", "onboarding_checklists", ["status"])

    # ── onboarding_checklist_items ──────────────────────────────────────
    if not _table_exists("onboarding_checklist_items"):
        op.create_table(
            "onboarding_checklist_items",
            sa.Column("id", sa.String(36), nullable=False),
            sa.Column("business_id", sa.String(50), nullable=False),
            sa.Column("checklist_id", sa.String(36), nullable=False),
            sa.Column("task_key", sa.String(100), nullable=False),
            sa.Column("task_label", sa.String(300), nullable=False),
            sa.Column("is_required", sa.Boolean(), nullable=False, server_default=sa.text("true")),
            sa.Column("status", sa.String(40), nullable=False, server_default="not_started"),
            sa.Column("completed_by_id", sa.String(36), nullable=True),
            sa.Column("completed_at", sa.Date(), nullable=True),
            sa.Column("notes", sa.Text(), nullable=True),
            sa.Column("sort_order", sa.Integer(), nullable=False, server_default="100"),
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
            sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default=sa.text("false")),
            sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("metadata_", sa.JSON(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("created_by", sa.String(36), nullable=True),
            sa.Column("updated_by", sa.String(36), nullable=True),
            sa.ForeignKeyConstraint(["checklist_id"], ["onboarding_checklists.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["completed_by_id"], ["users.id"], ondelete="SET NULL"),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_onboarding_items_business_id", "onboarding_checklist_items", ["business_id"], unique=True)
        op.create_index("ix_onboarding_items_checklist_id", "onboarding_checklist_items", ["checklist_id"])

    # ── exit_checklists ─────────────────────────────────────────────────
    if not _table_exists("exit_checklists"):
        op.create_table(
            "exit_checklists",
            sa.Column("id", sa.String(36), nullable=False),
            sa.Column("business_id", sa.String(50), nullable=False),
            sa.Column("company_id", sa.String(36), nullable=False),
            sa.Column("employee_id", sa.String(36), nullable=False),
            sa.Column("status", sa.String(40), nullable=False, server_default="initiated"),
            sa.Column("last_working_day", sa.Date(), nullable=True),
            sa.Column("resignation_date", sa.Date(), nullable=True),
            sa.Column("manager_approved", sa.Boolean(), nullable=False, server_default=sa.text("false")),
            sa.Column("hr_clearance", sa.Boolean(), nullable=False, server_default=sa.text("false")),
            sa.Column("payroll_cleared", sa.Boolean(), nullable=False, server_default=sa.text("false")),
            sa.Column("assets_returned", sa.Boolean(), nullable=False, server_default=sa.text("false")),
            sa.Column("completion_pct", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("assigned_hr_id", sa.String(36), nullable=True),
            sa.Column("notes", sa.Text(), nullable=True),
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
            sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default=sa.text("false")),
            sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("metadata_", sa.JSON(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("created_by", sa.String(36), nullable=True),
            sa.Column("updated_by", sa.String(36), nullable=True),
            sa.ForeignKeyConstraint(["company_id"], ["companies.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["employee_id"], ["employees.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["assigned_hr_id"], ["users.id"], ondelete="SET NULL"),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_exit_checklists_business_id", "exit_checklists", ["business_id"], unique=True)
        op.create_index("ix_exit_checklists_company_id", "exit_checklists", ["company_id"])
        op.create_index("ix_exit_checklists_employee_id", "exit_checklists", ["employee_id"])
        op.create_index("ix_exit_checklists_status", "exit_checklists", ["status"])

    # ── exit_checklist_items ────────────────────────────────────────────
    if not _table_exists("exit_checklist_items"):
        op.create_table(
            "exit_checklist_items",
            sa.Column("id", sa.String(36), nullable=False),
            sa.Column("business_id", sa.String(50), nullable=False),
            sa.Column("checklist_id", sa.String(36), nullable=False),
            sa.Column("task_key", sa.String(100), nullable=False),
            sa.Column("task_label", sa.String(300), nullable=False),
            sa.Column("is_required", sa.Boolean(), nullable=False, server_default=sa.text("true")),
            sa.Column("status", sa.String(40), nullable=False, server_default="not_started"),
            sa.Column("completed_by_id", sa.String(36), nullable=True),
            sa.Column("completed_at", sa.Date(), nullable=True),
            sa.Column("notes", sa.Text(), nullable=True),
            sa.Column("sort_order", sa.Integer(), nullable=False, server_default="100"),
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
            sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default=sa.text("false")),
            sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("metadata_", sa.JSON(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("created_by", sa.String(36), nullable=True),
            sa.Column("updated_by", sa.String(36), nullable=True),
            sa.ForeignKeyConstraint(["checklist_id"], ["exit_checklists.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["completed_by_id"], ["users.id"], ondelete="SET NULL"),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_exit_items_business_id", "exit_checklist_items", ["business_id"], unique=True)
        op.create_index("ix_exit_items_checklist_id", "exit_checklist_items", ["checklist_id"])

    # ── employee_bank_accounts ──────────────────────────────────────────
    if not _table_exists("employee_bank_accounts"):
        op.create_table(
            "employee_bank_accounts",
            sa.Column("id", sa.String(36), nullable=False),
            sa.Column("business_id", sa.String(50), nullable=False),
            sa.Column("company_id", sa.String(36), nullable=False),
            sa.Column("employee_id", sa.String(36), nullable=False),
            sa.Column("bank_name", sa.String(200), nullable=False),
            sa.Column("account_holder_name", sa.String(200), nullable=False),
            sa.Column("account_number", sa.String(50), nullable=False),
            sa.Column("account_type", sa.String(30), nullable=False, server_default="savings"),
            sa.Column("ifsc_code", sa.String(20), nullable=True),
            sa.Column("branch_name", sa.String(200), nullable=True),
            sa.Column("swift_code", sa.String(20), nullable=True),
            sa.Column("routing_number", sa.String(30), nullable=True),
            sa.Column("iban", sa.String(50), nullable=True),
            sa.Column("currency", sa.String(10), nullable=False, server_default="INR"),
            sa.Column("country_code", sa.String(10), nullable=False, server_default="IN"),
            sa.Column("is_primary", sa.Boolean(), nullable=False, server_default=sa.text("false")),
            sa.Column("is_verified", sa.Boolean(), nullable=False, server_default=sa.text("false")),
            sa.Column("verified_by_id", sa.String(36), nullable=True),
            sa.Column("upi_id", sa.String(100), nullable=True),
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
            sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default=sa.text("false")),
            sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("metadata_", sa.JSON(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("created_by", sa.String(36), nullable=True),
            sa.Column("updated_by", sa.String(36), nullable=True),
            sa.ForeignKeyConstraint(["company_id"], ["companies.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["employee_id"], ["employees.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["verified_by_id"], ["users.id"], ondelete="SET NULL"),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_employee_bank_accts_business_id", "employee_bank_accounts", ["business_id"], unique=True)
        op.create_index("ix_employee_bank_accts_company_id", "employee_bank_accounts", ["company_id"])
        op.create_index("ix_employee_bank_accts_employee_id", "employee_bank_accounts", ["employee_id"])


def downgrade() -> None:
    op.drop_table("employee_bank_accounts")
    op.drop_table("exit_checklist_items")
    op.drop_table("exit_checklists")
    op.drop_table("onboarding_checklist_items")
    op.drop_table("onboarding_checklists")
    op.drop_table("document_access_logs")
    op.drop_table("employee_documents")
    op.drop_table("document_type_templates")
