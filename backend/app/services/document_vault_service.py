"""Document Vault Service — secure, multi-country HR document management."""
from __future__ import annotations

import hashlib
from datetime import date, datetime, timezone
from typing import Optional

from fastapi import UploadFile
from sqlalchemy import select, func, and_, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import NotFoundException, InsufficientPermissionsException
from app.core.pagination import PaginationParams
from app.integrations.storage_service import StorageService
from app.models.document_vault import (
    DocumentTypeTemplate, EmployeeDocument, DocumentAccessLog,
    OnboardingChecklist, OnboardingChecklistItem,
    ExitChecklist, ExitChecklistItem,
    EmployeeBankAccount,
)
from app.models.employee import Employee
from app.models.user import User
from app.schemas.document_vault import (
    DocumentTypeTemplateCreate, DocumentTypeTemplateUpdate,
    EmployeeDocumentUpdate, DocumentReviewAction,
    ExitChecklistCreate, ExitChecklistUpdate,
    BankAccountCreate, BankAccountUpdate,
    OnboardingItemUpdate,
)
from app.services.business_id_service import BusinessIdService
from app.utils.enums import (
    DocVaultStatus, OnboardingStatus, ExitStatus,
    BankAccountType, DocVaultCategory,
)

# ── Allowed MIME types for document uploads ───────────────────────────────
ALLOWED_MIMES = {
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}
MAX_FILE_MB = 20
ADMIN_ROLES = {"super_admin", "company_admin", "hr_manager"}

# ── Country-specific mandatory documents (used to seed checklists) ────────
COUNTRY_DOC_TEMPLATES: dict[str, list[dict]] = {
    "IN": [
        {"code": "in_aadhaar", "name": "Aadhaar Card", "category": "identity", "is_mandatory": True},
        {"code": "in_pan", "name": "PAN Card", "category": "identity", "is_mandatory": True},
        {"code": "in_passport", "name": "Passport", "category": "identity", "is_mandatory": False, "is_expirable": True},
        {"code": "in_voter_id", "name": "Voter ID", "category": "identity", "is_mandatory": False},
        {"code": "in_driving_license", "name": "Driving License", "category": "identity", "is_mandatory": False, "is_expirable": True},
        {"code": "resume", "name": "Resume / CV", "category": "employment", "is_mandatory": True},
        {"code": "offer_letter_signed", "name": "Signed Offer Letter", "category": "employment", "is_mandatory": True},
        {"code": "appointment_letter", "name": "Appointment Letter", "category": "employment", "is_mandatory": True},
        {"code": "relieving_letter", "name": "Previous Relieving Letter", "category": "employment", "is_mandatory": False},
        {"code": "experience_letters", "name": "Experience Letters", "category": "employment", "is_mandatory": False},
        {"code": "prev_payslips", "name": "Previous 3 Month Payslips", "category": "employment", "is_mandatory": False},
        {"code": "bgv_form", "name": "Background Verification Form", "category": "employment", "is_mandatory": True},
        {"code": "nda", "name": "NDA / Policy Acknowledgement", "category": "compliance", "is_mandatory": True},
        {"code": "edu_ssc", "name": "SSC / 10th Certificate", "category": "education", "is_mandatory": True},
        {"code": "edu_hsc", "name": "HSC / 12th Certificate", "category": "education", "is_mandatory": True},
        {"code": "edu_degree", "name": "Degree Certificate", "category": "education", "is_mandatory": True},
        {"code": "edu_pg", "name": "Postgraduate Certificate", "category": "education", "is_mandatory": False},
        {"code": "bank_passbook", "name": "Bank Passbook / Cancelled Cheque", "category": "payroll_banking", "is_mandatory": True},
        {"code": "pf_uan", "name": "UAN / PF Details", "category": "payroll_banking", "is_mandatory": False},
        {"code": "tax_declaration", "name": "Tax Declaration Form", "category": "tax", "is_mandatory": True},
        {"code": "emergency_contact", "name": "Emergency Contact Form", "category": "onboarding", "is_mandatory": True},
        {"code": "photo", "name": "Passport Size Photo", "category": "onboarding", "is_mandatory": True},
        {"code": "address_proof", "name": "Address Proof", "category": "identity", "is_mandatory": True},
    ],
    "MY": [
        {"code": "my_ic", "name": "IC / MyKad", "category": "identity", "is_mandatory": True},
        {"code": "my_passport", "name": "Passport", "category": "identity", "is_mandatory": False, "is_expirable": True},
        {"code": "my_work_permit", "name": "Work Permit / Employment Pass", "category": "compliance", "is_mandatory": False, "is_expirable": True},
        {"code": "resume", "name": "Resume / CV", "category": "employment", "is_mandatory": True},
        {"code": "offer_letter_signed", "name": "Signed Offer Letter", "category": "employment", "is_mandatory": True},
        {"code": "edu_degree", "name": "Academic Certificates", "category": "education", "is_mandatory": True},
        {"code": "bank_details", "name": "Bank Account Details", "category": "payroll_banking", "is_mandatory": True},
        {"code": "my_epf", "name": "EPF Details", "category": "payroll_banking", "is_mandatory": True},
        {"code": "my_socso", "name": "SOCSO Details", "category": "compliance", "is_mandatory": True},
        {"code": "tax_file", "name": "Tax File Reference", "category": "tax", "is_mandatory": True},
    ],
    "SG": [
        {"code": "sg_nric", "name": "NRIC / FIN", "category": "identity", "is_mandatory": True},
        {"code": "sg_passport", "name": "Passport", "category": "identity", "is_mandatory": False, "is_expirable": True},
        {"code": "sg_work_pass", "name": "Work Pass / S Pass / EP", "category": "compliance", "is_mandatory": False, "is_expirable": True},
        {"code": "resume", "name": "Resume / CV", "category": "employment", "is_mandatory": True},
        {"code": "offer_letter_signed", "name": "Signed Offer Letter", "category": "employment", "is_mandatory": True},
        {"code": "bank_details", "name": "Bank Account Details", "category": "payroll_banking", "is_mandatory": True},
        {"code": "sg_cpf", "name": "CPF Details", "category": "payroll_banking", "is_mandatory": True},
        {"code": "edu_degree", "name": "Academic Certificates", "category": "education", "is_mandatory": True},
    ],
}

# ── Default onboarding tasks ──────────────────────────────────────────────
DEFAULT_ONBOARDING_TASKS = [
    {"key": "id_proof", "label": "ID proof uploaded and verified", "sort_order": 10},
    {"key": "resume", "label": "Resume / CV uploaded", "sort_order": 20},
    {"key": "education_verified", "label": "Education documents verified", "sort_order": 30},
    {"key": "bank_account", "label": "Bank account details added", "sort_order": 40},
    {"key": "offer_letter_signed", "label": "Signed offer letter uploaded", "sort_order": 50},
    {"key": "bgv_initiated", "label": "Background verification initiated", "sort_order": 60},
    {"key": "nda_signed", "label": "NDA / policy acknowledgement signed", "sort_order": 70},
    {"key": "payroll_profile", "label": "Payroll profile created", "sort_order": 80},
    {"key": "emergency_contact", "label": "Emergency contact form submitted", "sort_order": 90},
    {"key": "attendance_activated", "label": "Attendance profile activated", "sort_order": 100},
    {"key": "email_created", "label": "Work email created (optional)", "sort_order": 110},
    {"key": "system_access", "label": "System access / accounts set up", "sort_order": 120},
]

DEFAULT_EXIT_TASKS = [
    {"key": "resignation_letter", "label": "Resignation letter received", "sort_order": 10},
    {"key": "manager_approval", "label": "Manager acceptance/approval", "sort_order": 20},
    {"key": "handover_checklist", "label": "Handover checklist completed", "sort_order": 30},
    {"key": "asset_return", "label": "Assets returned (laptop, access card, etc.)", "sort_order": 40},
    {"key": "clearance_hr", "label": "HR clearance completed", "sort_order": 50},
    {"key": "clearance_it", "label": "IT / access revoke completed", "sort_order": 60},
    {"key": "clearance_finance", "label": "Finance / accounts clearance", "sort_order": 70},
    {"key": "final_settlement", "label": "Final settlement processed", "sort_order": 80},
    {"key": "relieving_letter", "label": "Relieving letter issued", "sort_order": 90},
    {"key": "experience_letter", "label": "Experience letter issued", "sort_order": 100},
    {"key": "exit_interview", "label": "Exit interview conducted", "sort_order": 110},
    {"key": "nda_reminder", "label": "NDA/confidentiality reminder acknowledged", "sort_order": 120},
]


def _mask_account(account_number: str) -> str:
    """Show only last 4 digits."""
    if len(account_number) <= 4:
        return "****"
    return "*" * (len(account_number) - 4) + account_number[-4:]


def _compute_hash(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


def _check_access(doc: EmployeeDocument, current_user: User) -> None:
    """Raise if current_user cannot access this document."""
    if current_user.role in ADMIN_ROLES:
        return
    if doc.access_level == "private":
        raise InsufficientPermissionsException("This document is restricted to HR/Admin.")
    if doc.access_level == "self":
        # Must be the document's employee; compare via employee FK
        # The caller must verify employee ownership
        return
    # manager/public — allowed


class DocumentVaultService:
    def __init__(self, db: AsyncSession):
        self.db = db

    # ── Document Type Templates ────────────────────────────────────────────

    async def seed_country_templates(self, company_id: str) -> list[DocumentTypeTemplate]:
        """Seed company with the global (non-company-specific) template set."""
        # Get company country — for now seed all common ones
        templates = []
        for country, docs in COUNTRY_DOC_TEMPLATES.items():
            for doc in docs:
                existing = await self.db.execute(
                    select(DocumentTypeTemplate).where(
                        DocumentTypeTemplate.company_id == company_id,
                        DocumentTypeTemplate.code == doc["code"],
                    )
                )
                if existing.scalar_one_or_none():
                    continue
                tmpl = DocumentTypeTemplate(
                    business_id=await BusinessIdService.generate(self.db, "doc_type_template"),
                    company_id=company_id,
                    code=doc["code"],
                    name=doc["name"],
                    category=doc.get("category", "other"),
                    country_code=country,
                    is_mandatory=doc.get("is_mandatory", False),
                    is_expirable=doc.get("is_expirable", False),
                )
                self.db.add(tmpl)
                templates.append(tmpl)
        await self.db.commit()
        return templates

    async def list_templates(
        self,
        company_id: str,
        country_code: Optional[str] = None,
        category: Optional[str] = None,
    ) -> list[DocumentTypeTemplate]:
        q = select(DocumentTypeTemplate).where(
            DocumentTypeTemplate.company_id == company_id,
            DocumentTypeTemplate.is_deleted == False,
        )
        if country_code:
            q = q.where(DocumentTypeTemplate.country_code == country_code)
        if category:
            q = q.where(DocumentTypeTemplate.category == category)
        q = q.order_by(DocumentTypeTemplate.sort_order)
        result = await self.db.execute(q)
        return list(result.scalars().all())

    async def create_template(self, company_id: str, data: DocumentTypeTemplateCreate) -> DocumentTypeTemplate:
        tmpl = DocumentTypeTemplate(
            business_id=await BusinessIdService.generate(self.db, "doc_type_template"),
            company_id=company_id,
            **data.model_dump(),
        )
        self.db.add(tmpl)
        await self.db.commit()
        await self.db.refresh(tmpl)
        return tmpl

    async def update_template(self, business_id: str, company_id: str, data: DocumentTypeTemplateUpdate) -> DocumentTypeTemplate:
        tmpl = await self._get_template(business_id, company_id)
        for k, v in data.model_dump(exclude_none=True).items():
            setattr(tmpl, k, v)
        await self.db.commit()
        await self.db.refresh(tmpl)
        return tmpl

    async def _get_template(self, business_id: str, company_id: str) -> DocumentTypeTemplate:
        result = await self.db.execute(
            select(DocumentTypeTemplate).where(
                DocumentTypeTemplate.business_id == business_id,
                DocumentTypeTemplate.company_id == company_id,
                DocumentTypeTemplate.is_deleted == False,
            )
        )
        tmpl = result.scalar_one_or_none()
        if not tmpl:
            raise NotFoundException("Document template not found")
        return tmpl

    # ── Employee Documents ─────────────────────────────────────────────────

    async def upload_document(
        self,
        file: UploadFile,
        employee_id: str,
        company_id: str,
        current_user: User,
        document_code: Optional[str] = None,
        document_name: Optional[str] = None,
        category: str = "other",
        access_level: str = "private",
        expiry_date: Optional[date] = None,
        notes: Optional[str] = None,
    ) -> EmployeeDocument:
        # Validate MIME
        if file.content_type and file.content_type not in ALLOWED_MIMES:
            from app.core.exceptions import AppException
            raise AppException(400, f"File type '{file.content_type}' is not allowed. Use PDF, JPEG, PNG, or Word.")

        content = await file.read()
        await file.seek(0)

        # Check file size
        size_mb = len(content) / (1024 * 1024)
        if size_mb > MAX_FILE_MB:
            from app.core.exceptions import AppException
            raise AppException(400, f"File size {size_mb:.1f} MB exceeds limit of {MAX_FILE_MB} MB")

        file_hash = _compute_hash(content)

        storage = StorageService()
        file_url = await storage.upload(file, folder="documents/vault", company_id=company_id)

        # Get template for code
        template_id = None
        if document_code:
            tmpl_res = await self.db.execute(
                select(DocumentTypeTemplate).where(
                    DocumentTypeTemplate.company_id == company_id,
                    DocumentTypeTemplate.code == document_code,
                )
            )
            tmpl = tmpl_res.scalar_one_or_none()
            if tmpl:
                template_id = tmpl.id
                category = tmpl.category
                access_level = tmpl.access_level
                if not document_name:
                    document_name = tmpl.name

        doc = EmployeeDocument(
            business_id=await BusinessIdService.generate(self.db, "emp_document"),
            company_id=company_id,
            employee_id=employee_id,
            template_id=template_id,
            document_code=document_code,
            document_name=document_name or (file.filename or "Document"),
            category=category,
            status=DocVaultStatus.UPLOADED.value,
            access_level=access_level,
            file_name=file.filename or "document",
            file_url=file_url,
            mime_type=file.content_type,
            file_size=len(content),
            file_hash=file_hash,
            expiry_date=expiry_date,
            notes=notes,
            uploaded_by_id=current_user.id,
            created_by=current_user.id,
            updated_by=current_user.id,
        )
        self.db.add(doc)

        # Record access log
        self.db.add(DocumentAccessLog(
            business_id=await BusinessIdService.generate(self.db, "doc_access_log"),
            company_id=company_id,
            document_id=doc.id,
            actor_user_id=current_user.id,
            action="upload",
        ))

        await self.db.commit()
        await self.db.refresh(doc)
        return doc

    async def list_employee_documents(
        self,
        employee_id: str,
        company_id: str,
        current_user: User,
        params: PaginationParams,
        category: Optional[str] = None,
        status: Optional[str] = None,
    ) -> tuple[list[EmployeeDocument], int]:
        q = select(EmployeeDocument).where(
            EmployeeDocument.employee_id == employee_id,
            EmployeeDocument.company_id == company_id,
            EmployeeDocument.is_deleted == False,
        ).options(selectinload(EmployeeDocument.template))

        # Access control
        if current_user.role not in ADMIN_ROLES and current_user.role != "team_manager":
            # Employee can only see own self/public docs
            q = q.where(EmployeeDocument.access_level.in_(["self", "public"]))

        if category:
            q = q.where(EmployeeDocument.category == category)
        if status:
            q = q.where(EmployeeDocument.status == status)

        count_q = select(func.count()).select_from(q.subquery())
        total = (await self.db.execute(count_q)).scalar_one()

        q = q.order_by(EmployeeDocument.created_at.desc()).offset(params.offset).limit(params.limit)
        result = await self.db.execute(q)
        return list(result.scalars().all()), total

    async def get_document(self, business_id: str, company_id: str, current_user: User) -> EmployeeDocument:
        result = await self.db.execute(
            select(EmployeeDocument)
            .where(
                EmployeeDocument.business_id == business_id,
                EmployeeDocument.company_id == company_id,
                EmployeeDocument.is_deleted == False,
            )
            .options(selectinload(EmployeeDocument.template))
        )
        doc = result.scalar_one_or_none()
        if not doc:
            raise NotFoundException("Document not found")

        _check_access(doc, current_user)

        # Log view
        self.db.add(DocumentAccessLog(
            business_id=await BusinessIdService.generate(self.db, "doc_access_log"),
            company_id=company_id,
            document_id=doc.id,
            actor_user_id=current_user.id,
            action="view",
        ))
        await self.db.commit()
        return doc

    async def review_document(
        self,
        business_id: str,
        company_id: str,
        current_user: User,
        action: DocumentReviewAction,
    ) -> EmployeeDocument:
        if current_user.role not in ADMIN_ROLES:
            raise InsufficientPermissionsException("Only HR/Admin can review documents")

        doc = await self.get_document(business_id, company_id, current_user)
        action_map = {
            "approve": DocVaultStatus.APPROVED.value,
            "reject": DocVaultStatus.REJECTED.value,
            "request_resubmission": DocVaultStatus.NEED_RESUBMISSION.value,
        }
        new_status = action_map.get(action.action)
        if not new_status:
            from app.core.exceptions import AppException
            raise AppException(400, f"Unknown review action: {action.action}")

        doc.status = new_status
        doc.reviewed_by_id = current_user.id
        if action.notes:
            doc.notes = action.notes
        if action.rejection_reason:
            doc.rejection_reason = action.rejection_reason
        doc.updated_by = current_user.id

        self.db.add(DocumentAccessLog(
            business_id=await BusinessIdService.generate(self.db, "doc_access_log"),
            company_id=company_id,
            document_id=doc.id,
            actor_user_id=current_user.id,
            action=action.action,
            detail=action.rejection_reason or action.notes,
        ))
        await self.db.commit()
        await self.db.refresh(doc)
        return doc

    async def delete_document(self, business_id: str, company_id: str, current_user: User) -> None:
        if current_user.role not in ADMIN_ROLES:
            raise InsufficientPermissionsException("Only HR/Admin can delete documents")

        doc = await self.get_document(business_id, company_id, current_user)
        doc.is_deleted = True
        doc.deleted_at = datetime.now(tz=timezone.utc)
        doc.updated_by = current_user.id

        self.db.add(DocumentAccessLog(
            business_id=await BusinessIdService.generate(self.db, "doc_access_log"),
            company_id=company_id,
            document_id=doc.id,
            actor_user_id=current_user.id,
            action="delete",
        ))
        await self.db.commit()

    # ── Onboarding Checklist ───────────────────────────────────────────────

    async def get_or_create_onboarding(self, employee_id: str, company_id: str, hr_id: Optional[str] = None) -> OnboardingChecklist:
        existing = await self.db.execute(
            select(OnboardingChecklist)
            .where(OnboardingChecklist.employee_id == employee_id, OnboardingChecklist.is_deleted == False)
            .options(selectinload(OnboardingChecklist.items))
        )
        checklist = existing.scalar_one_or_none()
        if checklist:
            return checklist

        checklist = OnboardingChecklist(
            business_id=await BusinessIdService.generate(self.db, "onboarding_checklist"),
            company_id=company_id,
            employee_id=employee_id,
            assigned_hr_id=hr_id,
        )
        self.db.add(checklist)
        await self.db.flush()  # get checklist.id

        for task in DEFAULT_ONBOARDING_TASKS:
            item = OnboardingChecklistItem(
                business_id=await BusinessIdService.generate(self.db, "onboarding_item"),
                checklist_id=checklist.id,
                task_key=task["key"],
                task_label=task["label"],
                sort_order=task["sort_order"],
            )
            self.db.add(item)

        await self.db.commit()
        await self.db.refresh(checklist)
        # Reload with items
        result = await self.db.execute(
            select(OnboardingChecklist)
            .where(OnboardingChecklist.id == checklist.id)
            .options(selectinload(OnboardingChecklist.items))
        )
        return result.scalar_one()

    async def update_onboarding_item(
        self,
        checklist_business_id: str,
        item_business_id: str,
        current_user: User,
        data: OnboardingItemUpdate,
    ) -> OnboardingChecklist:
        checklist_res = await self.db.execute(
            select(OnboardingChecklist)
            .where(OnboardingChecklist.business_id == checklist_business_id, OnboardingChecklist.is_deleted == False)
            .options(selectinload(OnboardingChecklist.items))
        )
        checklist = checklist_res.scalar_one_or_none()
        if not checklist:
            raise NotFoundException("Onboarding checklist not found")

        item_res = await self.db.execute(
            select(OnboardingChecklistItem).where(OnboardingChecklistItem.business_id == item_business_id)
        )
        item = item_res.scalar_one_or_none()
        if not item or item.checklist_id != checklist.id:
            raise NotFoundException("Checklist item not found")

        item.status = data.status
        if data.notes:
            item.notes = data.notes
        if data.status == "completed":
            item.completed_by_id = current_user.id
            item.completed_at = date.today()

        # Recalculate completion
        await self.db.flush()
        all_items = checklist.items
        completed = sum(1 for i in all_items if i.status == "completed")
        total = len(all_items)
        checklist.completion_pct = int((completed / total) * 100) if total else 0
        if checklist.completion_pct == 100:
            checklist.status = OnboardingStatus.COMPLETED.value
        elif completed > 0:
            checklist.status = OnboardingStatus.IN_PROGRESS.value

        await self.db.commit()
        result = await self.db.execute(
            select(OnboardingChecklist)
            .where(OnboardingChecklist.id == checklist.id)
            .options(selectinload(OnboardingChecklist.items))
        )
        return result.scalar_one()

    # ── Exit Checklist ─────────────────────────────────────────────────────

    async def create_exit_checklist(
        self,
        company_id: str,
        current_user: User,
        data: ExitChecklistCreate,
    ) -> ExitChecklist:
        if current_user.role not in ADMIN_ROLES:
            raise InsufficientPermissionsException("Only HR/Admin can initiate exit process")

        existing = await self.db.execute(
            select(ExitChecklist).where(
                ExitChecklist.employee_id == data.employee_id,
                ExitChecklist.company_id == company_id,
                ExitChecklist.is_deleted == False,
            )
        )
        if existing.scalar_one_or_none():
            from app.core.exceptions import AppException
            raise AppException(400, "Exit process already initiated for this employee")

        checklist = ExitChecklist(
            business_id=await BusinessIdService.generate(self.db, "exit_checklist"),
            company_id=company_id,
            employee_id=data.employee_id,
            status=ExitStatus.INITIATED.value,
            last_working_day=data.last_working_day,
            resignation_date=data.resignation_date,
            assigned_hr_id=current_user.id,
            notes=data.notes,
        )
        self.db.add(checklist)
        await self.db.flush()

        for task in DEFAULT_EXIT_TASKS:
            item = ExitChecklistItem(
                business_id=await BusinessIdService.generate(self.db, "exit_item"),
                checklist_id=checklist.id,
                task_key=task["key"],
                task_label=task["label"],
                sort_order=task["sort_order"],
            )
            self.db.add(item)

        await self.db.commit()
        result = await self.db.execute(
            select(ExitChecklist)
            .where(ExitChecklist.id == checklist.id)
            .options(selectinload(ExitChecklist.items))
        )
        return result.scalar_one()

    async def get_exit_checklist(self, employee_id: str, company_id: str) -> Optional[ExitChecklist]:
        result = await self.db.execute(
            select(ExitChecklist)
            .where(ExitChecklist.employee_id == employee_id, ExitChecklist.company_id == company_id, ExitChecklist.is_deleted == False)
            .options(selectinload(ExitChecklist.items))
        )
        return result.scalar_one_or_none()

    async def update_exit_checklist(
        self,
        business_id: str,
        company_id: str,
        current_user: User,
        data: ExitChecklistUpdate,
    ) -> ExitChecklist:
        if current_user.role not in ADMIN_ROLES:
            raise InsufficientPermissionsException("Only HR/Admin can update exit process")

        result = await self.db.execute(
            select(ExitChecklist)
            .where(ExitChecklist.business_id == business_id, ExitChecklist.company_id == company_id, ExitChecklist.is_deleted == False)
            .options(selectinload(ExitChecklist.items))
        )
        checklist = result.scalar_one_or_none()
        if not checklist:
            raise NotFoundException("Exit checklist not found")

        for k, v in data.model_dump(exclude_none=True).items():
            setattr(checklist, k, v)

        # Recalculate overall % from items
        items = checklist.items
        if items:
            done = sum(1 for i in items if i.status == "completed")
            checklist.completion_pct = int((done / len(items)) * 100)
        if checklist.completion_pct == 100:
            checklist.status = ExitStatus.COMPLETED.value

        await self.db.commit()
        await self.db.refresh(checklist)
        return checklist

    # ── Bank Accounts ──────────────────────────────────────────────────────

    async def create_bank_account(
        self,
        company_id: str,
        current_user: User,
        data: BankAccountCreate,
    ) -> EmployeeBankAccount:
        if current_user.role not in ADMIN_ROLES and current_user.role != "payroll_admin":
            raise InsufficientPermissionsException("Only HR/Payroll Admin can manage bank accounts")

        # If setting as primary, unset others
        if data.is_primary:
            await self.db.execute(
                update(EmployeeBankAccount)
                .where(
                    EmployeeBankAccount.employee_id == data.employee_id,
                    EmployeeBankAccount.company_id == company_id,
                    EmployeeBankAccount.is_deleted == False,
                )
                .values(is_primary=False)
            )

        acct = EmployeeBankAccount(
            business_id=await BusinessIdService.generate(self.db, "bank_account"),
            company_id=company_id,
            created_by=current_user.id,
            updated_by=current_user.id,
            **data.model_dump(),
        )
        self.db.add(acct)
        await self.db.commit()
        await self.db.refresh(acct)
        return acct

    async def list_bank_accounts(
        self,
        employee_id: str,
        company_id: str,
        current_user: User,
    ) -> list[EmployeeBankAccount]:
        if current_user.role not in ADMIN_ROLES and current_user.role != "payroll_admin":
            raise InsufficientPermissionsException("Only HR/Payroll Admin can view bank details")

        result = await self.db.execute(
            select(EmployeeBankAccount).where(
                EmployeeBankAccount.employee_id == employee_id,
                EmployeeBankAccount.company_id == company_id,
                EmployeeBankAccount.is_deleted == False,
            ).order_by(EmployeeBankAccount.is_primary.desc())
        )
        return list(result.scalars().all())

    async def update_bank_account(
        self,
        business_id: str,
        company_id: str,
        current_user: User,
        data: BankAccountUpdate,
    ) -> EmployeeBankAccount:
        if current_user.role not in ADMIN_ROLES and current_user.role != "payroll_admin":
            raise InsufficientPermissionsException("Only HR/Payroll Admin can update bank accounts")

        result = await self.db.execute(
            select(EmployeeBankAccount).where(
                EmployeeBankAccount.business_id == business_id,
                EmployeeBankAccount.company_id == company_id,
                EmployeeBankAccount.is_deleted == False,
            )
        )
        acct = result.scalar_one_or_none()
        if not acct:
            raise NotFoundException("Bank account not found")

        for k, v in data.model_dump(exclude_none=True).items():
            setattr(acct, k, v)
        acct.updated_by = current_user.id
        await self.db.commit()
        await self.db.refresh(acct)
        return acct

    async def verify_bank_account(self, business_id: str, company_id: str, current_user: User) -> EmployeeBankAccount:
        if current_user.role not in ADMIN_ROLES and current_user.role != "payroll_admin":
            raise InsufficientPermissionsException("Only HR/Payroll Admin can verify bank accounts")

        result = await self.db.execute(
            select(EmployeeBankAccount).where(
                EmployeeBankAccount.business_id == business_id,
                EmployeeBankAccount.company_id == company_id,
                EmployeeBankAccount.is_deleted == False,
            )
        )
        acct = result.scalar_one_or_none()
        if not acct:
            raise NotFoundException("Bank account not found")

        acct.is_verified = True
        acct.verified_by_id = current_user.id
        acct.updated_by = current_user.id
        await self.db.commit()
        await self.db.refresh(acct)
        return acct

    async def delete_bank_account(self, business_id: str, company_id: str, current_user: User) -> None:
        if current_user.role not in ADMIN_ROLES and current_user.role != "payroll_admin":
            raise InsufficientPermissionsException("Only HR/Payroll Admin can delete bank accounts")
        result = await self.db.execute(
            select(EmployeeBankAccount).where(
                EmployeeBankAccount.business_id == business_id,
                EmployeeBankAccount.company_id == company_id,
                EmployeeBankAccount.is_deleted == False,
            )
        )
        acct = result.scalar_one_or_none()
        if not acct:
            raise NotFoundException("Bank account not found")
        acct.is_deleted = True
        acct.deleted_at = datetime.now(tz=timezone.utc)
        await self.db.commit()

    # ── Dashboard / Summary ───────────────────────────────────────────────

    async def get_vault_summary(
        self,
        company_id: str,
        params: PaginationParams,
    ) -> tuple[list[dict], int]:
        """Admin dashboard: document readiness summary per employee."""
        emp_result = await self.db.execute(
            select(Employee).where(
                Employee.company_id == company_id,
                Employee.is_deleted == False,
                Employee.employment_status == "active",
            ).offset(params.offset).limit(params.limit)
        )
        employees = list(emp_result.scalars().all())

        count_result = await self.db.execute(
            select(func.count()).select_from(
                select(Employee).where(
                    Employee.company_id == company_id,
                    Employee.is_deleted == False,
                ).subquery()
            )
        )
        total = count_result.scalar_one()

        summaries = []
        for emp in employees:
            doc_result = await self.db.execute(
                select(EmployeeDocument).where(
                    EmployeeDocument.employee_id == emp.id,
                    EmployeeDocument.company_id == company_id,
                    EmployeeDocument.is_deleted == False,
                )
            )
            docs = list(doc_result.scalars().all())

            # Mandatory template count for company
            tmpl_count_res = await self.db.execute(
                select(func.count()).where(
                    DocumentTypeTemplate.company_id == company_id,
                    DocumentTypeTemplate.is_mandatory == True,
                    DocumentTypeTemplate.is_deleted == False,
                )
            )
            required = tmpl_count_res.scalar_one() or 0

            onboard_res = await self.db.execute(
                select(OnboardingChecklist).where(
                    OnboardingChecklist.employee_id == emp.id,
                    OnboardingChecklist.is_deleted == False,
                )
            )
            onboard = onboard_res.scalar_one_or_none()

            summaries.append({
                "employee_id": emp.business_id,
                "employee_name": emp.full_name or f"{emp.first_name} {emp.last_name}".strip(),
                "employee_code": emp.employee_code,
                "total_required": required,
                "uploaded": sum(1 for d in docs if d.status not in ["missing", "not_requested"]),
                "approved": sum(1 for d in docs if d.status == "approved"),
                "missing": sum(1 for d in docs if d.status in ["missing", "requested"]),
                "pending_review": sum(1 for d in docs if d.status in ["uploaded", "under_review"]),
                "expired": sum(1 for d in docs if d.expiry_date and d.expiry_date < date.today()),
                "onboarding_status": onboard.status if onboard else None,
                "onboarding_pct": onboard.completion_pct if onboard else 0,
            })

        return summaries, total
