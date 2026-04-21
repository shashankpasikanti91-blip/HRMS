from __future__ import annotations

from app.utils.enums import UserRole

# ── Default limits ─────────────────────────────────────────────────────────
MAX_EMPLOYEES_FREE = 10
MAX_EMPLOYEES_STARTER = 100
MAX_EMPLOYEES_PROFESSIONAL = 500
MAX_EMPLOYEES_ENTERPRISE = 10_000

# ── Roles that have cross-tenant access ────────────────────────────────────
SUPER_ADMIN_ROLES = {UserRole.SUPER_ADMIN}

# ── Roles that manage HR operations ───────────────────────────────────────
HR_ADMIN_ROLES = {UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER}

# ── Roles that can manage recruitment ────────────────────────────────────
RECRUITMENT_ROLES = {UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER}

# ── Roles that can view all employees ────────────────────────────────────
MANAGEMENT_ROLES = {
    UserRole.COMPANY_ADMIN,
    UserRole.HR_MANAGER,
    UserRole.TEAM_MANAGER,
}

# ── Search limits ─────────────────────────────────────────────────────────
GLOBAL_SEARCH_MAX_RESULTS_PER_TYPE = 5
GLOBAL_SEARCH_MAX_TOTAL_RESULTS = 30

# ── Pagination defaults ───────────────────────────────────────────────────
DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 200

# ── File limits ───────────────────────────────────────────────────────────
ALLOWED_DOCUMENT_MIME_TYPES = {
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/jpeg",
    "image/png",
    "image/webp",
}
ALLOWED_IMAGE_MIME_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}

# ── Business ID sequence padding ─────────────────────────────────────────
BUSINESS_ID_PADDING = 6  # e.g. EMP-000001
