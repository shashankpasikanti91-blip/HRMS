"""Document Vault API routes — enterprise HR document management."""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.pagination import PaginationParams, Page
from app.models.user import User
from app.schemas.document_vault import (
    DocumentTypeTemplateCreate, DocumentTypeTemplateUpdate, DocumentTypeTemplateResponse,
    EmployeeDocumentResponse, DocumentReviewAction,
    OnboardingChecklistResponse, OnboardingItemUpdate,
    ExitChecklistCreate, ExitChecklistUpdate, ExitChecklistResponse,
    BankAccountCreate, BankAccountUpdate, BankAccountResponse,
    DocumentVaultSummary,
)
from app.services.document_vault_service import DocumentVaultService, _mask_account

vault_router = APIRouter(prefix="/vault", tags=["Document Vault"])


# ─────────────────────────────────────────────────────────────────────────────
# Document Type Templates
# ─────────────────────────────────────────────────────────────────────────────

@vault_router.post(
    "/templates/seed",
    status_code=201,
    summary="Seed country document templates for company",
)
async def seed_templates(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Seed all supported country document templates for the current company."""
    svc = DocumentVaultService(db)
    templates = await svc.seed_country_templates(current_user.company_id)
    return {"seeded": len(templates), "message": f"Seeded {len(templates)} document templates"}


@vault_router.get("/templates", response_model=list[DocumentTypeTemplateResponse])
async def list_templates(
    country_code: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = DocumentVaultService(db)
    templates = await svc.list_templates(current_user.company_id, country_code, category)
    return [DocumentTypeTemplateResponse.model_validate(t) for t in templates]


@vault_router.post("/templates", response_model=DocumentTypeTemplateResponse, status_code=201)
async def create_template(
    data: DocumentTypeTemplateCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = DocumentVaultService(db)
    tmpl = await svc.create_template(current_user.company_id, data)
    return DocumentTypeTemplateResponse.model_validate(tmpl)


@vault_router.patch("/templates/{business_id}", response_model=DocumentTypeTemplateResponse)
async def update_template(
    business_id: str,
    data: DocumentTypeTemplateUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = DocumentVaultService(db)
    tmpl = await svc.update_template(business_id, current_user.company_id, data)
    return DocumentTypeTemplateResponse.model_validate(tmpl)


# ─────────────────────────────────────────────────────────────────────────────
# Employee Documents
# ─────────────────────────────────────────────────────────────────────────────

@vault_router.post("/employee-documents", response_model=EmployeeDocumentResponse, status_code=201)
async def upload_employee_document(
    file: UploadFile = File(...),
    employee_id: str = Form(...),
    document_code: Optional[str] = Form(None),
    document_name: Optional[str] = Form(None),
    category: str = Form("other"),
    access_level: str = Form("private"),
    expiry_date: Optional[str] = Form(None),
    notes: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload an employee document to the vault."""
    from datetime import date
    parsed_expiry = None
    if expiry_date:
        try:
            parsed_expiry = date.fromisoformat(expiry_date)
        except ValueError:
            pass

    svc = DocumentVaultService(db)
    doc = await svc.upload_document(
        file=file,
        employee_id=employee_id,
        company_id=current_user.company_id,
        current_user=current_user,
        document_code=document_code,
        document_name=document_name,
        category=category,
        access_level=access_level,
        expiry_date=parsed_expiry,
        notes=notes,
    )
    return EmployeeDocumentResponse.model_validate(doc)


@vault_router.get("/employee-documents", response_model=Page[EmployeeDocumentResponse])
async def list_employee_documents(
    employee_id: str = Query(...),
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    params: PaginationParams = Depends(),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = DocumentVaultService(db)
    docs, total = await svc.list_employee_documents(
        employee_id=employee_id,
        company_id=current_user.company_id,
        current_user=current_user,
        params=params,
        category=category,
        status=status,
    )
    return Page(
        items=[EmployeeDocumentResponse.model_validate(d) for d in docs],
        total=total,
        page=params.page,
        size=params.limit,
        pages=(total + params.limit - 1) // params.limit if params.limit > 0 else 1,
    )


@vault_router.get("/employee-documents/{business_id}", response_model=EmployeeDocumentResponse)
async def get_employee_document(
    business_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = DocumentVaultService(db)
    doc = await svc.get_document(business_id, current_user.company_id, current_user)
    return EmployeeDocumentResponse.model_validate(doc)


@vault_router.post("/employee-documents/{business_id}/review", response_model=EmployeeDocumentResponse)
async def review_employee_document(
    business_id: str,
    action: DocumentReviewAction,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Approve, reject, or request resubmission of a document."""
    svc = DocumentVaultService(db)
    doc = await svc.review_document(business_id, current_user.company_id, current_user, action)
    return EmployeeDocumentResponse.model_validate(doc)


@vault_router.delete("/employee-documents/{business_id}", status_code=204)
async def delete_employee_document(
    business_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = DocumentVaultService(db)
    await svc.delete_document(business_id, current_user.company_id, current_user)


# ─────────────────────────────────────────────────────────────────────────────
# Onboarding Checklists
# ─────────────────────────────────────────────────────────────────────────────

@vault_router.get("/onboarding/{employee_id}", response_model=OnboardingChecklistResponse)
async def get_onboarding_checklist(
    employee_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get (or create) the onboarding checklist for an employee."""
    svc = DocumentVaultService(db)
    checklist = await svc.get_or_create_onboarding(
        employee_id=employee_id,
        company_id=current_user.company_id,
        hr_id=current_user.id if current_user.role in {"hr_manager", "company_admin", "super_admin"} else None,
    )
    return OnboardingChecklistResponse.model_validate(checklist)


@vault_router.patch("/onboarding/{checklist_id}/items/{item_id}", response_model=OnboardingChecklistResponse)
async def update_onboarding_item(
    checklist_id: str,
    item_id: str,
    data: OnboardingItemUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark an onboarding task as complete or pending."""
    svc = DocumentVaultService(db)
    checklist = await svc.update_onboarding_item(checklist_id, item_id, current_user, data)
    return OnboardingChecklistResponse.model_validate(checklist)


# ─────────────────────────────────────────────────────────────────────────────
# Exit Checklists
# ─────────────────────────────────────────────────────────────────────────────

@vault_router.post("/exit-checklists", response_model=ExitChecklistResponse, status_code=201)
async def create_exit_checklist(
    data: ExitChecklistCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Initiate the exit process for an employee."""
    svc = DocumentVaultService(db)
    checklist = await svc.create_exit_checklist(current_user.company_id, current_user, data)
    return ExitChecklistResponse.model_validate(checklist)


@vault_router.get("/exit-checklists/{employee_id}", response_model=ExitChecklistResponse)
async def get_exit_checklist(
    employee_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = DocumentVaultService(db)
    checklist = await svc.get_exit_checklist(employee_id, current_user.company_id)
    if not checklist:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="No exit process found for this employee")
    return ExitChecklistResponse.model_validate(checklist)


@vault_router.patch("/exit-checklists/{business_id}", response_model=ExitChecklistResponse)
async def update_exit_checklist(
    business_id: str,
    data: ExitChecklistUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = DocumentVaultService(db)
    checklist = await svc.update_exit_checklist(business_id, current_user.company_id, current_user, data)
    return ExitChecklistResponse.model_validate(checklist)


# ─────────────────────────────────────────────────────────────────────────────
# Bank Accounts
# ─────────────────────────────────────────────────────────────────────────────

@vault_router.get("/bank-accounts", response_model=list[BankAccountResponse])
async def list_bank_accounts(
    employee_id: str = Query(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = DocumentVaultService(db)
    accounts = await svc.list_bank_accounts(employee_id, current_user.company_id, current_user)
    result = []
    for acct in accounts:
        r = BankAccountResponse.model_validate(acct)
        r.account_number_masked = _mask_account(acct.account_number)
        result.append(r)
    return result


@vault_router.post("/bank-accounts", response_model=BankAccountResponse, status_code=201)
async def create_bank_account(
    data: BankAccountCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = DocumentVaultService(db)
    acct = await svc.create_bank_account(current_user.company_id, current_user, data)
    r = BankAccountResponse.model_validate(acct)
    r.account_number_masked = _mask_account(acct.account_number)
    return r


@vault_router.patch("/bank-accounts/{business_id}", response_model=BankAccountResponse)
async def update_bank_account(
    business_id: str,
    data: BankAccountUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = DocumentVaultService(db)
    acct = await svc.update_bank_account(business_id, current_user.company_id, current_user, data)
    r = BankAccountResponse.model_validate(acct)
    r.account_number_masked = _mask_account(acct.account_number)
    return r


@vault_router.post("/bank-accounts/{business_id}/verify", response_model=BankAccountResponse)
async def verify_bank_account(
    business_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark a bank account as verified by HR/Payroll."""
    svc = DocumentVaultService(db)
    acct = await svc.verify_bank_account(business_id, current_user.company_id, current_user)
    r = BankAccountResponse.model_validate(acct)
    r.account_number_masked = _mask_account(acct.account_number)
    return r


@vault_router.delete("/bank-accounts/{business_id}", status_code=204)
async def delete_bank_account(
    business_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = DocumentVaultService(db)
    await svc.delete_bank_account(business_id, current_user.company_id, current_user)


# ─────────────────────────────────────────────────────────────────────────────
# Vault Summary Dashboard
# ─────────────────────────────────────────────────────────────────────────────

@vault_router.get("/summary", response_model=Page[DocumentVaultSummary])
async def get_vault_summary(
    params: PaginationParams = Depends(),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Admin dashboard: document vault readiness per employee."""
    from app.core.exceptions import InsufficientPermissionsException
    if current_user.role not in {"super_admin", "company_admin", "hr_manager"}:
        raise InsufficientPermissionsException("Access restricted to HR/Admin")

    svc = DocumentVaultService(db)
    summaries, total = await svc.get_vault_summary(current_user.company_id, params)
    return Page(
        items=[DocumentVaultSummary(**s) for s in summaries],
        total=total,
        page=params.page,
        size=params.limit,
        pages=(total + params.limit - 1) // params.limit if params.limit > 0 else 1,
    )
