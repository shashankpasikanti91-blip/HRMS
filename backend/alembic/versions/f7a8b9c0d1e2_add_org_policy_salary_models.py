"""Add organization, policy, salary, shift, client, and telegram models.
Also add new columns to companies and employees tables.

Revision ID: f7a8b9c0d1e2
Revises: e9e088a493b5
Create Date: 2026-05-02

"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision: str = "f7a8b9c0d1e2"
down_revision: Union[str, None] = "e9e088a493b5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _column_exists(table_name: str, column_name: str) -> bool:
    bind = op.get_bind()
    insp = inspect(bind)
    columns = [c["name"] for c in insp.get_columns(table_name)]
    return column_name in columns


def _table_exists(table_name: str) -> bool:
    bind = op.get_bind()
    insp = inspect(bind)
    return table_name in insp.get_table_names()


# ── Base columns present in every table via BaseModel ────────────────────
_base_columns = [
    sa.Column("id", sa.String(36), primary_key=True),
    sa.Column("business_id", sa.String(50), unique=True, index=True, nullable=False),
    sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
    sa.Column("metadata", sa.JSON(), nullable=True),
    sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    sa.Column("created_by", sa.String(36), nullable=True),
    sa.Column("updated_by", sa.String(36), nullable=True),
]


def _base():
    """Return a fresh copy of base columns for each table."""
    return [c.copy() for c in _base_columns]


def upgrade() -> None:
    # ── 1. ALTER companies ───────────────────────────────────────────────
    if not _column_exists("companies", "currency"):
        op.add_column("companies", sa.Column("currency", sa.String(10), nullable=False, server_default="INR"))
    if not _column_exists("companies", "industry"):
        op.add_column("companies", sa.Column("industry", sa.String(100), nullable=True))
    if not _column_exists("companies", "company_size"):
        op.add_column("companies", sa.Column("company_size", sa.String(30), nullable=True))

    # ── 2. CREATE branches (before altering employees with FK) ───────────
    if not _table_exists("branches"):
        op.create_table(
            "branches",
            *_base(),
            sa.Column("company_id", sa.String(36), sa.ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True),
            sa.Column("name", sa.String(255), nullable=False),
            sa.Column("code", sa.String(50), nullable=True, index=True),
            sa.Column("branch_type", sa.String(30), nullable=False, server_default="branch"),
            sa.Column("address", sa.Text(), nullable=True),
            sa.Column("city", sa.String(100), nullable=True),
            sa.Column("state", sa.String(100), nullable=True),
            sa.Column("country", sa.String(100), nullable=True),
            sa.Column("timezone", sa.String(50), nullable=True),
            sa.Column("phone", sa.String(30), nullable=True),
            sa.Column("email", sa.String(255), nullable=True),
            sa.Column("manager_id", sa.String(36), sa.ForeignKey("employees.id", ondelete="SET NULL"), nullable=True),
            sa.Column("employee_count", sa.Integer(), nullable=False, server_default="0"),
            sa.UniqueConstraint("company_id", "code", name="uq_branch_code_company"),
        )

    # ── 3. CREATE designations ───────────────────────────────────────────
    if not _table_exists("designations"):
        op.create_table(
            "designations",
            *_base(),
            sa.Column("company_id", sa.String(36), sa.ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True),
            sa.Column("name", sa.String(255), nullable=False),
            sa.Column("code", sa.String(50), nullable=True, index=True),
            sa.Column("level", sa.Integer(), nullable=True),
            sa.Column("description", sa.Text(), nullable=True),
            sa.UniqueConstraint("company_id", "name", name="uq_designation_name_company"),
        )

    # ── 4. ALTER employees – address, bank, branch_id, designation_id ────
    _emp_cols = {
        "address_line_1": sa.Column("address_line_1", sa.String(500), nullable=True),
        "address_line_2": sa.Column("address_line_2", sa.String(500), nullable=True),
        "city": sa.Column("city", sa.String(100), nullable=True),
        "state": sa.Column("state", sa.String(100), nullable=True),
        "country": sa.Column("country", sa.String(100), nullable=True),
        "postal_code": sa.Column("postal_code", sa.String(20), nullable=True),
        "bank_name": sa.Column("bank_name", sa.String(255), nullable=True),
        "bank_account_number": sa.Column("bank_account_number", sa.String(50), nullable=True),
        "bank_ifsc_code": sa.Column("bank_ifsc_code", sa.String(20), nullable=True),
        "bank_branch": sa.Column("bank_branch", sa.String(255), nullable=True),
        "branch_id": sa.Column("branch_id", sa.String(36), sa.ForeignKey("branches.id", ondelete="SET NULL"), nullable=True),
        "designation_id": sa.Column("designation_id", sa.String(36), sa.ForeignKey("designations.id", ondelete="SET NULL"), nullable=True),
    }
    for col_name, col in _emp_cols.items():
        if not _column_exists("employees", col_name):
            op.add_column("employees", col)

    # ── 5. CREATE organization_settings ──────────────────────────────────
    if not _table_exists("organization_settings"):
        op.create_table(
            "organization_settings",
            *_base(),
            sa.Column("company_id", sa.String(36), sa.ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, unique=True, index=True),
            sa.Column("working_days", sa.JSON(), nullable=True),
            sa.Column("weekend_days", sa.JSON(), nullable=True),
            sa.Column("work_start_time", sa.String(10), nullable=True, server_default="09:00"),
            sa.Column("work_end_time", sa.String(10), nullable=True, server_default="18:00"),
            sa.Column("daily_work_hours", sa.Float(), nullable=False, server_default="8.0"),
            sa.Column("weekly_work_hours", sa.Float(), nullable=False, server_default="40.0"),
            sa.Column("late_threshold_minutes", sa.Integer(), nullable=False, server_default="15"),
            sa.Column("overtime_threshold_hours", sa.Float(), nullable=False, server_default="8.0"),
            sa.Column("overtime_multiplier", sa.Float(), nullable=False, server_default="1.5"),
            sa.Column("payroll_cycle", sa.String(30), nullable=False, server_default="monthly"),
            sa.Column("payroll_process_day", sa.Integer(), nullable=False, server_default="28"),
            sa.Column("default_currency", sa.String(10), nullable=False, server_default="INR"),
            sa.Column("probation_period_days", sa.Integer(), nullable=False, server_default="90"),
            sa.Column("notice_period_days", sa.Integer(), nullable=False, server_default="30"),
            sa.Column("date_format", sa.String(20), nullable=False, server_default="DD/MM/YYYY"),
            sa.Column("time_format", sa.String(10), nullable=False, server_default="24h"),
            sa.Column("password_min_length", sa.Integer(), nullable=False, server_default="8"),
            sa.Column("password_require_uppercase", sa.Boolean(), nullable=False, server_default=sa.text("true")),
            sa.Column("password_require_number", sa.Boolean(), nullable=False, server_default=sa.text("true")),
            sa.Column("password_require_special", sa.Boolean(), nullable=False, server_default=sa.text("true")),
            sa.Column("password_expiry_days", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("enable_overtime", sa.Boolean(), nullable=False, server_default=sa.text("true")),
            sa.Column("enable_shifts", sa.Boolean(), nullable=False, server_default=sa.text("false")),
            sa.Column("enable_geo_tracking", sa.Boolean(), nullable=False, server_default=sa.text("false")),
            sa.Column("enable_client_billing", sa.Boolean(), nullable=False, server_default=sa.text("false")),
            sa.Column("enable_telegram_bot", sa.Boolean(), nullable=False, server_default=sa.text("false")),
            sa.Column("custom_config", sa.JSON(), nullable=True),
        )

    # ── 6. CREATE country_configs ────────────────────────────────────────
    if not _table_exists("country_configs"):
        op.create_table(
            "country_configs",
            *_base(),
            sa.Column("country_code", sa.String(10), nullable=False, unique=True, index=True),
            sa.Column("country_name", sa.String(255), nullable=False),
            sa.Column("currency_code", sa.String(10), nullable=False, server_default="USD"),
            sa.Column("currency_symbol", sa.String(10), nullable=False, server_default="$"),
            sa.Column("date_format", sa.String(20), nullable=False, server_default="DD/MM/YYYY"),
            sa.Column("timezone", sa.String(50), nullable=False, server_default="UTC"),
            sa.Column("default_weekend_days", sa.JSON(), nullable=True),
            sa.Column("default_work_hours", sa.Float(), nullable=False, server_default="8.0"),
            sa.Column("minimum_wage", sa.Float(), nullable=True),
            sa.Column("tax_framework", sa.JSON(), nullable=True),
            sa.Column("statutory_rules", sa.JSON(), nullable=True),
        )

    # ── 7. CREATE state_configs ──────────────────────────────────────────
    if not _table_exists("state_configs"):
        op.create_table(
            "state_configs",
            *_base(),
            sa.Column("country_code", sa.String(10), nullable=False, index=True),
            sa.Column("state_code", sa.String(20), nullable=False, index=True),
            sa.Column("state_name", sa.String(255), nullable=False),
            sa.Column("tax_overrides", sa.JSON(), nullable=True),
            sa.Column("statutory_overrides", sa.JSON(), nullable=True),
            sa.Column("minimum_wage_override", sa.Float(), nullable=True),
            sa.Column("additional_holidays", sa.JSON(), nullable=True),
            sa.UniqueConstraint("country_code", "state_code", name="uq_state_country"),
        )

    # ── 8. CREATE leave_policies ─────────────────────────────────────────
    if not _table_exists("leave_policies"):
        op.create_table(
            "leave_policies",
            *_base(),
            sa.Column("company_id", sa.String(36), sa.ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True),
            sa.Column("name", sa.String(255), nullable=False),
            sa.Column("description", sa.Text(), nullable=True),
            sa.Column("is_default", sa.Boolean(), nullable=False, server_default=sa.text("false")),
            sa.UniqueConstraint("company_id", "name", name="uq_leave_policy_name"),
        )

    # ── 9. CREATE leave_types ────────────────────────────────────────────
    if not _table_exists("leave_types"):
        op.create_table(
            "leave_types",
            *_base(),
            sa.Column("company_id", sa.String(36), sa.ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True),
            sa.Column("leave_policy_id", sa.String(36), sa.ForeignKey("leave_policies.id", ondelete="CASCADE"), nullable=False, index=True),
            sa.Column("name", sa.String(100), nullable=False),
            sa.Column("code", sa.String(20), nullable=False),
            sa.Column("annual_quota", sa.Float(), nullable=False, server_default="0"),
            sa.Column("max_consecutive_days", sa.Integer(), nullable=True),
            sa.Column("min_days_per_request", sa.Float(), nullable=False, server_default="0.5"),
            sa.Column("is_paid", sa.Boolean(), nullable=False, server_default=sa.text("true")),
            sa.Column("is_carry_forward", sa.Boolean(), nullable=False, server_default=sa.text("false")),
            sa.Column("max_carry_forward", sa.Float(), nullable=True),
            sa.Column("accrual_frequency", sa.String(30), nullable=False, server_default="monthly"),
            sa.Column("requires_approval", sa.Boolean(), nullable=False, server_default=sa.text("true")),
            sa.Column("requires_attachment", sa.Boolean(), nullable=False, server_default=sa.text("false")),
            sa.Column("min_attachment_days", sa.Integer(), nullable=True),
            sa.Column("applicable_gender", sa.String(30), nullable=True),
            sa.Column("probation_eligible", sa.Boolean(), nullable=False, server_default=sa.text("false")),
            sa.Column("encashable", sa.Boolean(), nullable=False, server_default=sa.text("false")),
            sa.Column("color", sa.String(20), nullable=True),
            sa.UniqueConstraint("leave_policy_id", "code", name="uq_leave_type_code_policy"),
        )

    # ── 10. CREATE leave_balances ────────────────────────────────────────
    if not _table_exists("leave_balances"):
        op.create_table(
            "leave_balances",
            *_base(),
            sa.Column("company_id", sa.String(36), sa.ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True),
            sa.Column("employee_id", sa.String(36), sa.ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True),
            sa.Column("leave_type_id", sa.String(36), sa.ForeignKey("leave_types.id", ondelete="CASCADE"), nullable=False, index=True),
            sa.Column("year", sa.Integer(), nullable=False, index=True),
            sa.Column("allocated", sa.Float(), nullable=False, server_default="0"),
            sa.Column("used", sa.Float(), nullable=False, server_default="0"),
            sa.Column("pending", sa.Float(), nullable=False, server_default="0"),
            sa.Column("carried_forward", sa.Float(), nullable=False, server_default="0"),
            sa.UniqueConstraint("employee_id", "leave_type_id", "year", name="uq_leave_balance_emp_type_year"),
        )

    # ── 11. CREATE attendance_policies ───────────────────────────────────
    if not _table_exists("attendance_policies"):
        op.create_table(
            "attendance_policies",
            *_base(),
            sa.Column("company_id", sa.String(36), sa.ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, unique=True, index=True),
            sa.Column("name", sa.String(255), nullable=False),
            sa.Column("check_in_required", sa.Boolean(), nullable=False, server_default=sa.text("true")),
            sa.Column("auto_checkout", sa.Boolean(), nullable=False, server_default=sa.text("false")),
            sa.Column("auto_checkout_time", sa.String(10), nullable=True),
            sa.Column("allow_manual_entry", sa.Boolean(), nullable=False, server_default=sa.text("true")),
            sa.Column("require_approval_for_corrections", sa.Boolean(), nullable=False, server_default=sa.text("true")),
            sa.Column("track_breaks", sa.Boolean(), nullable=False, server_default=sa.text("false")),
            sa.Column("max_break_minutes", sa.Integer(), nullable=True),
            sa.Column("grace_period_minutes", sa.Integer(), nullable=False, server_default="15"),
            sa.Column("half_day_hours", sa.Float(), nullable=False, server_default="4.0"),
            sa.Column("min_hours_for_full_day", sa.Float(), nullable=False, server_default="7.0"),
            sa.Column("enable_geo_fencing", sa.Boolean(), nullable=False, server_default=sa.text("false")),
            sa.Column("geo_fence_radius_meters", sa.Integer(), nullable=True),
            sa.Column("allowed_check_in_methods", sa.JSON(), nullable=True),
            sa.Column("rules_config", sa.JSON(), nullable=True),
        )

    # ── 12. CREATE salary_structures ─────────────────────────────────────
    if not _table_exists("salary_structures"):
        op.create_table(
            "salary_structures",
            *_base(),
            sa.Column("company_id", sa.String(36), sa.ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True),
            sa.Column("name", sa.String(255), nullable=False),
            sa.Column("code", sa.String(50), nullable=True, index=True),
            sa.Column("description", sa.Text(), nullable=True),
            sa.Column("currency", sa.String(10), nullable=False, server_default="INR"),
            sa.Column("is_default", sa.Boolean(), nullable=False, server_default=sa.text("false")),
            sa.Column("payroll_cycle", sa.String(30), nullable=False, server_default="monthly"),
            sa.UniqueConstraint("company_id", "name", name="uq_salary_structure_name"),
        )

    # ── 13. CREATE salary_components ─────────────────────────────────────
    if not _table_exists("salary_components"):
        op.create_table(
            "salary_components",
            *_base(),
            sa.Column("company_id", sa.String(36), sa.ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True),
            sa.Column("salary_structure_id", sa.String(36), sa.ForeignKey("salary_structures.id", ondelete="CASCADE"), nullable=False, index=True),
            sa.Column("name", sa.String(255), nullable=False),
            sa.Column("code", sa.String(50), nullable=False),
            sa.Column("component_type", sa.String(30), nullable=False),
            sa.Column("calculation_type", sa.String(30), nullable=False, server_default="fixed"),
            sa.Column("amount", sa.Float(), nullable=True),
            sa.Column("percentage", sa.Float(), nullable=True),
            sa.Column("formula", sa.String(500), nullable=True),
            sa.Column("is_taxable", sa.Boolean(), nullable=False, server_default=sa.text("true")),
            sa.Column("is_mandatory", sa.Boolean(), nullable=False, server_default=sa.text("false")),
            sa.Column("priority", sa.Integer(), nullable=False, server_default="100"),
            sa.Column("max_amount", sa.Float(), nullable=True),
            sa.Column("min_amount", sa.Float(), nullable=True),
            sa.Column("description", sa.Text(), nullable=True),
            sa.UniqueConstraint("salary_structure_id", "code", name="uq_salary_component_code_structure"),
        )

    # ── 14. CREATE employee_salaries ─────────────────────────────────────
    if not _table_exists("employee_salaries"):
        op.create_table(
            "employee_salaries",
            *_base(),
            sa.Column("company_id", sa.String(36), sa.ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True),
            sa.Column("employee_id", sa.String(36), sa.ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True),
            sa.Column("salary_structure_id", sa.String(36), sa.ForeignKey("salary_structures.id", ondelete="CASCADE"), nullable=False, index=True),
            sa.Column("ctc", sa.Float(), nullable=False, server_default="0"),
            sa.Column("basic_salary", sa.Float(), nullable=False, server_default="0"),
            sa.Column("gross_salary", sa.Float(), nullable=False, server_default="0"),
            sa.Column("net_salary", sa.Float(), nullable=False, server_default="0"),
            sa.Column("currency", sa.String(10), nullable=False, server_default="INR"),
            sa.Column("component_overrides", sa.JSON(), nullable=True),
            sa.Column("effective_from", sa.String(10), nullable=True),
            sa.UniqueConstraint("employee_id", name="uq_employee_salary"),
        )

    # ── 15. CREATE tax_rules ─────────────────────────────────────────────
    if not _table_exists("tax_rules"):
        op.create_table(
            "tax_rules",
            *_base(),
            sa.Column("country_code", sa.String(10), nullable=True, index=True),
            sa.Column("state_code", sa.String(20), nullable=True, index=True),
            sa.Column("company_id", sa.String(36), sa.ForeignKey("companies.id", ondelete="CASCADE"), nullable=True, index=True),
            sa.Column("name", sa.String(255), nullable=False),
            sa.Column("code", sa.String(50), nullable=False, index=True),
            sa.Column("description", sa.Text(), nullable=True),
            sa.Column("tax_type", sa.String(50), nullable=False),
            sa.Column("slabs", sa.JSON(), nullable=True),
            sa.Column("rate", sa.Float(), nullable=True),
            sa.Column("max_amount", sa.Float(), nullable=True),
            sa.Column("employer_rate", sa.Float(), nullable=True),
            sa.Column("employee_rate", sa.Float(), nullable=True),
            sa.Column("effective_year", sa.Integer(), nullable=True),
            sa.Column("rules_config", sa.JSON(), nullable=True),
        )

    # ── 16. CREATE shifts ────────────────────────────────────────────────
    if not _table_exists("shifts"):
        op.create_table(
            "shifts",
            *_base(),
            sa.Column("company_id", sa.String(36), sa.ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True),
            sa.Column("name", sa.String(255), nullable=False),
            sa.Column("code", sa.String(50), nullable=True, index=True),
            sa.Column("shift_type", sa.String(30), nullable=False, server_default="general"),
            sa.Column("start_time", sa.String(10), nullable=False),
            sa.Column("end_time", sa.String(10), nullable=False),
            sa.Column("break_duration_minutes", sa.Integer(), nullable=False, server_default="60"),
            sa.Column("work_hours", sa.Float(), nullable=False, server_default="8.0"),
            sa.Column("is_night_shift", sa.Boolean(), nullable=False, server_default=sa.text("false")),
            sa.Column("grace_minutes", sa.Integer(), nullable=False, server_default="15"),
            sa.Column("is_default", sa.Boolean(), nullable=False, server_default=sa.text("false")),
            sa.Column("applicable_days", sa.JSON(), nullable=True),
            sa.UniqueConstraint("company_id", "code", name="uq_shift_code_company"),
        )

    # ── 17. CREATE clients ───────────────────────────────────────────────
    if not _table_exists("clients"):
        op.create_table(
            "clients",
            *_base(),
            sa.Column("company_id", sa.String(36), sa.ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True),
            sa.Column("name", sa.String(255), nullable=False, index=True),
            sa.Column("contact_person", sa.String(255), nullable=True),
            sa.Column("email", sa.String(255), nullable=True),
            sa.Column("phone", sa.String(30), nullable=True),
            sa.Column("address", sa.Text(), nullable=True),
            sa.Column("industry", sa.String(100), nullable=True),
            sa.Column("notes", sa.Text(), nullable=True),
        )

    # ── 18. CREATE client_projects ───────────────────────────────────────
    if not _table_exists("client_projects"):
        op.create_table(
            "client_projects",
            *_base(),
            sa.Column("company_id", sa.String(36), sa.ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True),
            sa.Column("client_id", sa.String(36), sa.ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True),
            sa.Column("name", sa.String(255), nullable=False),
            sa.Column("code", sa.String(50), nullable=True, index=True),
            sa.Column("description", sa.Text(), nullable=True),
            sa.Column("start_date", sa.Date(), nullable=True),
            sa.Column("end_date", sa.Date(), nullable=True),
            sa.Column("billing_rate", sa.Float(), nullable=True),
            sa.Column("billing_currency", sa.String(10), nullable=False, server_default="INR"),
            sa.Column("status", sa.String(30), nullable=False, server_default="active"),
        )

    # ── 19. CREATE employee_assignments ──────────────────────────────────
    if not _table_exists("employee_assignments"):
        op.create_table(
            "employee_assignments",
            *_base(),
            sa.Column("company_id", sa.String(36), sa.ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True),
            sa.Column("employee_id", sa.String(36), sa.ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True),
            sa.Column("client_project_id", sa.String(36), sa.ForeignKey("client_projects.id", ondelete="CASCADE"), nullable=False, index=True),
            sa.Column("billing_rate", sa.Float(), nullable=True),
            sa.Column("start_date", sa.Date(), nullable=True),
            sa.Column("end_date", sa.Date(), nullable=True),
            sa.Column("allocation_percentage", sa.Integer(), nullable=False, server_default="100"),
            sa.Column("status", sa.String(30), nullable=False, server_default="active"),
        )

    # ── 20. CREATE telegram_links ────────────────────────────────────────
    if not _table_exists("telegram_links"):
        op.create_table(
            "telegram_links",
            *_base(),
            sa.Column("company_id", sa.String(36), sa.ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True),
            sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
            sa.Column("employee_id", sa.String(36), sa.ForeignKey("employees.id", ondelete="SET NULL"), nullable=True, index=True),
            sa.Column("telegram_chat_id", sa.String(50), nullable=False, unique=True, index=True),
            sa.Column("telegram_username", sa.String(255), nullable=True),
            sa.Column("is_verified", sa.Boolean(), nullable=False, server_default=sa.text("false")),
            sa.Column("otp_code", sa.String(10), nullable=True),
            sa.Column("otp_expires_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("linked_at", sa.DateTime(timezone=True), nullable=True),
        )

    # ── 21. CREATE telegram_command_logs ──────────────────────────────────
    if not _table_exists("telegram_command_logs"):
        op.create_table(
            "telegram_command_logs",
            *_base(),
            sa.Column("company_id", sa.String(36), sa.ForeignKey("companies.id", ondelete="SET NULL"), nullable=True, index=True),
            sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True),
            sa.Column("telegram_chat_id", sa.String(50), nullable=False, index=True),
            sa.Column("command", sa.String(255), nullable=False),
            sa.Column("command_type", sa.String(50), nullable=True),
            sa.Column("response_text", sa.Text(), nullable=True),
            sa.Column("success", sa.Boolean(), nullable=False, server_default=sa.text("true")),
            sa.Column("error_message", sa.Text(), nullable=True),
        )


def downgrade() -> None:
    # Drop tables in reverse dependency order
    op.drop_table("telegram_command_logs") if _table_exists("telegram_command_logs") else None
    op.drop_table("telegram_links") if _table_exists("telegram_links") else None
    op.drop_table("employee_assignments") if _table_exists("employee_assignments") else None
    op.drop_table("client_projects") if _table_exists("client_projects") else None
    op.drop_table("clients") if _table_exists("clients") else None
    op.drop_table("shifts") if _table_exists("shifts") else None
    op.drop_table("tax_rules") if _table_exists("tax_rules") else None
    op.drop_table("employee_salaries") if _table_exists("employee_salaries") else None
    op.drop_table("salary_components") if _table_exists("salary_components") else None
    op.drop_table("salary_structures") if _table_exists("salary_structures") else None
    op.drop_table("attendance_policies") if _table_exists("attendance_policies") else None
    op.drop_table("leave_balances") if _table_exists("leave_balances") else None
    op.drop_table("leave_types") if _table_exists("leave_types") else None
    op.drop_table("leave_policies") if _table_exists("leave_policies") else None
    op.drop_table("state_configs") if _table_exists("state_configs") else None
    op.drop_table("country_configs") if _table_exists("country_configs") else None
    op.drop_table("organization_settings") if _table_exists("organization_settings") else None

    # Drop employee FK columns before dropping reference tables
    for col in ["designation_id", "branch_id", "bank_branch", "bank_ifsc_code",
                "bank_account_number", "bank_name", "postal_code", "country",
                "state", "city", "address_line_2", "address_line_1"]:
        if _column_exists("employees", col):
            op.drop_column("employees", col)

    op.drop_table("designations") if _table_exists("designations") else None
    op.drop_table("branches") if _table_exists("branches") else None

    for col in ["company_size", "industry", "currency"]:
        if _column_exists("companies", col):
            op.drop_column("companies", col)
