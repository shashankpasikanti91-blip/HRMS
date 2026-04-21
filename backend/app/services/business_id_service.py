from __future__ import annotations

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.utils.constants import BUSINESS_ID_PADDING
from app.utils.enums import BUSINESS_ID_PREFIXES


class BusinessIdService:
    """
    Central service to generate human-readable, sequential business IDs.

    Format: PREFIX-NNNNNN  e.g. EMP-000001
    IDs are company-scoped where applicable, globally unique across the table.
    """

    _ENTITY_TABLE_MAP: dict[str, str] = {
        "company": "companies",
        "user": "users",
        "employee": "employees",
        "department": "departments",
        "holiday": "holidays",
        "attendance": "attendance",
        "leave_request": "leave_requests",
        "payroll_run": "payroll_runs",
        "payroll_item": "payroll_items",
        "job_posting": "job_postings",
        "candidate": "candidates",
        "application": "applications",
        "interview": "interviews",
        "offer": "offers",
        "performance_review": "performance_reviews",
        "document": "documents",
        "notification": "notifications",
        "audit_log": "audit_logs",
        "branch": "branches",
        "designation": "designations",
        "shift": "shifts",
        "org_settings": "organization_settings",
        "leave_policy": "leave_policies",
        "leave_type": "leave_policy_types",
        "leave_balance": "leave_balances",
        "attendance_policy": "attendance_policies",
        "salary_structure": "salary_structures",
        "salary_component": "salary_components",
        "employee_salary": "employee_salaries",
        # Document vault
        "doc_type_template": "document_type_templates",
        "emp_document": "employee_documents",
        "doc_request": "document_type_templates",
        "onboarding_checklist": "onboarding_checklists",
        "onboarding_item": "onboarding_checklist_items",
        "exit_checklist": "exit_checklists",
        "exit_item": "exit_checklist_items",
        "bank_account": "employee_bank_accounts",
        "doc_access_log": "document_access_logs",
    }

    @classmethod
    async def generate(
        cls,
        db: AsyncSession,
        entity_type: str,
        company_id: str | None = None,
    ) -> str:
        """
        Generate the next sequential business_id for the given entity type.
        Uses a row-level count to determine the next sequence number.
        Thread-safe because PostgreSQL SERIAL/COUNT is consistent within a transaction
        and we rely on the UNIQUE constraint as the final guard.
        """
        prefix = BUSINESS_ID_PREFIXES.get(entity_type)
        if not prefix:
            raise ValueError(f"Unknown entity type for business ID: {entity_type}")

        table_name = cls._ENTITY_TABLE_MAP.get(entity_type, "")
        if not table_name:
            raise ValueError(f"No table mapping for entity type: {entity_type}")

        # Count existing rows (including deleted) to maintain continuity.
        # `table_name` is chosen from a fixed internal allow-list above.
        count_result = await db.execute(
            __import__("sqlalchemy").text(f"SELECT COUNT(*) FROM {table_name}")
        )
        count = count_result.scalar() or 0
        sequence = count + 1
        padded = str(sequence).zfill(BUSINESS_ID_PADDING)
        return f"{prefix}-{padded}"

    @classmethod
    def format_id(cls, prefix: str, sequence: int) -> str:
        """Format a known prefix + sequence number into a business ID."""
        padded = str(sequence).zfill(BUSINESS_ID_PADDING)
        return f"{prefix}-{padded}"

    @classmethod
    async def exists(cls, db: AsyncSession, entity_type: str, business_id: str) -> bool:
        """Check if a business_id already exists in the given entity table."""
        table_name = cls._ENTITY_TABLE_MAP.get(entity_type, "")
        if not table_name:
            return False
        result = await db.execute(
            __import__("sqlalchemy").text(
                f"SELECT 1 FROM {table_name} WHERE business_id = :bid LIMIT 1"
            ),
            {"bid": business_id},
        )
        return result.scalar() is not None

    @classmethod
    async def safe_generate(
        cls,
        db: AsyncSession,
        entity_type: str,
        max_retries: int = 5,
    ) -> str:
        """Generate a unique business_id with collision retry."""
        for _ in range(max_retries):
            bid = await cls.generate(db, entity_type)
            if not await cls.exists(db, entity_type, bid):
                return bid
        raise RuntimeError(f"Could not generate unique business_id for {entity_type} after {max_retries} retries")


# Build reverse map: prefix → entity_type  (e.g. "SALSTR" → "salary_structure")
_PREFIX_TO_ENTITY: dict[str, str] = {v: k for k, v in BUSINESS_ID_PREFIXES.items()}


async def generate_business_id(db: AsyncSession, prefix: str) -> str:
    """Standalone helper that accepts a prefix (e.g. 'SALSTR') and generates the next ID."""
    entity_type = _PREFIX_TO_ENTITY.get(prefix)
    if entity_type is None:
        raise ValueError(f"Unknown business ID prefix: {prefix}")
    return await BusinessIdService.generate(db, entity_type)
