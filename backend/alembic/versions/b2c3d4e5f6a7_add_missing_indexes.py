"""add missing indexes for performance

Revision ID: b2c3d4e5f6a7
Revises: f7a8b9c0d1e2
Create Date: 2025-01-20

"""
from alembic import op

# revision identifiers
revision = "b2c3d4e5f6a7"
down_revision = "f7a8b9c0d1e2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Employee FK indexes
    op.create_index("ix_employees_manager_id", "employees", ["company_id", "manager_id"])
    op.create_index("ix_employees_branch_id", "employees", ["company_id", "branch_id"])
    op.create_index("ix_employees_designation_id", "employees", ["company_id", "designation_id"])

    # Attendance composite index for daily queries
    op.create_index("ix_attendance_daily", "attendance", ["company_id", "attendance_date", "employee_id"])
    op.create_index("ix_attendance_approved", "attendance", ["company_id", "is_approved"])

    # Leave request indexes
    op.create_index("ix_leave_requests_approved_by", "leave_requests", ["approved_by"])
    op.create_index("ix_leave_requests_emp_status", "leave_requests", ["employee_id", "status"])

    # Payroll indexes
    op.create_index("ix_payroll_items_payment_status", "payroll_items", ["payment_status"])
    op.create_index("ix_payroll_items_run_emp", "payroll_items", ["payroll_run_id", "employee_id"])
    op.create_index("ix_payroll_runs_period", "payroll_runs", ["company_id", "period_month", "period_year"])

    # Notifications composite
    op.create_index("ix_notifications_user_read", "notifications", ["user_id", "is_read"])

    # Audit logs composite for entity trail
    op.create_index("ix_audit_logs_entity_timeline", "audit_logs", ["entity_type", "entity_id", "created_at"])

    # Leave balances composite
    op.create_index("ix_leave_balances_tracking", "leave_balances", ["employee_id", "leave_type_id", "year"])

    # Performance reviews
    op.create_index("ix_performance_reviews_reviewer", "performance_reviews", ["reviewer_id"])
    op.create_index("ix_performance_reviews_emp_year", "performance_reviews", ["employee_id", "review_year"])

    # Recruitment indexes
    op.create_index("ix_applications_job_stage", "applications", ["job_posting_id", "current_stage"])
    op.create_index("ix_candidates_company_email", "candidates", ["company_id", "email"])


def downgrade() -> None:
    op.drop_index("ix_candidates_company_email", "candidates")
    op.drop_index("ix_applications_job_stage", "applications")
    op.drop_index("ix_performance_reviews_emp_year", "performance_reviews")
    op.drop_index("ix_performance_reviews_reviewer", "performance_reviews")
    op.drop_index("ix_leave_balances_tracking", "leave_balances")
    op.drop_index("ix_audit_logs_entity_timeline", "audit_logs")
    op.drop_index("ix_notifications_user_read", "notifications")
    op.drop_index("ix_payroll_runs_period", "payroll_runs")
    op.drop_index("ix_payroll_items_run_emp", "payroll_items")
    op.drop_index("ix_payroll_items_payment_status", "payroll_items")
    op.drop_index("ix_leave_requests_emp_status", "leave_requests")
    op.drop_index("ix_leave_requests_approved_by", "leave_requests")
    op.drop_index("ix_attendance_approved", "attendance")
    op.drop_index("ix_attendance_daily", "attendance")
    op.drop_index("ix_employees_designation_id", "employees")
    op.drop_index("ix_employees_branch_id", "employees")
    op.drop_index("ix_employees_manager_id", "employees")
