from __future__ import annotations

from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, require_super_admin, require_company_admin_or_above
from app.core.pagination import PaginationParams, Page
from app.models.user import User
from app.schemas.company import CompanyResponse, CompanyUpdate, CompanySummary
from app.schemas.base import MessageResponse
from app.services.company_service import CompanyService

router = APIRouter(prefix="/companies", tags=["Companies"])


@router.get("/me", response_model=CompanyResponse)
async def get_my_company(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the current user's company profile."""
    service = CompanyService(db)
    company = await service.get_my_company(current_user.company_id)
    return CompanyResponse.model_validate(company)


@router.put("/me", response_model=CompanyResponse)
async def update_my_company(
    data: CompanyUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_company_admin_or_above()),
):
    """Update company profile (Company Admin or above)."""
    service = CompanyService(db)
    company = await service.update_company(current_user.company_id, data, current_user.id)
    return CompanyResponse.model_validate(company)


@router.post("/me/logo", response_model=CompanyResponse)
async def upload_company_logo(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_company_admin_or_above()),
):
    """Upload a company logo image (PNG/JPG). Returns updated company profile."""
    from app.integrations.storage_service import StorageService
    url = await StorageService.upload(file, folder="logos", company_id=str(current_user.company_id))
    service = CompanyService(db)
    company = await service.update_company(current_user.company_id, CompanyUpdate(logo_url=url), current_user.id)
    return CompanyResponse.model_validate(company)


# ── Super Admin Routes ──────────────────────────────────────────────────────

admin_router = APIRouter(prefix="/admin/companies", tags=["Super Admin – Companies"])


@admin_router.get("", response_model=Page[CompanySummary])
async def list_all_companies(
    params: PaginationParams = Depends(),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_super_admin()),
):
    """List all companies (Super Admin only)."""
    service = CompanyService(db)
    companies, total = await service.list_all_companies(params)
    return Page.create([CompanySummary.model_validate(c) for c in companies], total, params)


@admin_router.get("/{business_id}", response_model=CompanyResponse)
async def get_company_by_id(
    business_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_super_admin()),
):
    """Get a specific company by business_id (Super Admin only)."""
    service = CompanyService(db)
    company = await service.get_company_by_business_id(business_id)
    return CompanyResponse.model_validate(company)
