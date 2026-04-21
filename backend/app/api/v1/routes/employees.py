from __future__ import annotations

import csv
import io
import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, Query, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, require_hr_or_above
from app.core.pagination import PaginationParams, Page
from app.models.employee import Employee, Department
from app.models.user import User
from app.schemas.employee import (
    DepartmentCreate,
    DepartmentUpdate,
    DepartmentResponse,
    DepartmentSummary,
    EmployeeCreate,
    EmployeeUpdate,
    EmployeeResponse,
    EmployeeSummary,
    EmployeeSummaryDetail,
)
from app.services.employee_service import DepartmentService, EmployeeService
from app.schemas.base import MessageResponse

dept_router = APIRouter(prefix="/departments", tags=["Departments"])
emp_router = APIRouter(prefix="/employees", tags=["Employees"])


async def _enrich_employee_summaries(employees, db: AsyncSession):
    """Add department_name to a list of Employee ORM objects."""
    dept_ids = {e.department_id for e in employees if e.department_id}
    dept_map = {}
    if dept_ids:
        result = await db.execute(
            select(Department.id, Department.name).where(Department.id.in_(dept_ids))
        )
        dept_map = {row[0]: row[1] for row in result.all()}

    summaries = []
    for e in employees:
        s = EmployeeSummary.model_validate(e)
        if e.department_id and e.department_id in dept_map:
            s.department_name = dept_map[e.department_id]
        summaries.append(s)
    return summaries


# ── Departments ─────────────────────────────────────────────────────────────

@dept_router.post("", response_model=DepartmentResponse, status_code=201)
async def create_department(
    data: DepartmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hr_or_above()),
):
    svc = DepartmentService(db)
    dept = await svc.create(data, current_user.company_id, current_user.id)
    count = await svc.get_employee_count(dept.id)
    result = DepartmentResponse.model_validate(dept)
    result.employee_count = count
    return result


@dept_router.get("", response_model=Page[DepartmentSummary])
async def list_departments(
    params: PaginationParams = Depends(),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = DepartmentService(db)
    depts, total = await svc.list(current_user.company_id, params)
    summaries = []
    for d in depts:
        s = DepartmentSummary.model_validate(d)
        s.employee_count = await svc.get_employee_count(d.id)
        summaries.append(s)
    return Page.create(summaries, total, params)


@dept_router.get("/{business_id}", response_model=DepartmentResponse)
async def get_department(
    business_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = DepartmentService(db)
    dept = await svc.get(business_id, current_user.company_id)
    count = await svc.get_employee_count(dept.id)
    result = DepartmentResponse.model_validate(dept)
    result.employee_count = count
    return result


@dept_router.put("/{business_id}", response_model=DepartmentResponse)
async def update_department(
    business_id: str,
    data: DepartmentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hr_or_above()),
):
    svc = DepartmentService(db)
    dept = await svc.update(business_id, data, current_user.company_id, current_user.id)
    return DepartmentResponse.model_validate(dept)


@dept_router.delete("/{business_id}", response_model=MessageResponse)
async def delete_department(
    business_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hr_or_above()),
):
    svc = DepartmentService(db)
    await svc.delete(business_id, current_user.company_id, current_user.id)
    return MessageResponse(message=f"Department {business_id} deleted successfully")


# ── Employees ───────────────────────────────────────────────────────────────

@emp_router.post("", response_model=EmployeeResponse, status_code=201)
async def create_employee(
    data: EmployeeCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hr_or_above()),
):
    svc = EmployeeService(db)
    emp = await svc.create(data, current_user.company_id, current_user.id)
    return _format_employee(emp, db, current_user.company_id)


@emp_router.get("", response_model=Page[EmployeeSummary])
async def list_employees(
    params: PaginationParams = Depends(),
    department_id: Optional[str] = Query(None),
    employment_status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = EmployeeService(db)
    employees, total = await svc.list(
        current_user.company_id,
        params,
        department_id=department_id,
        employment_status=employment_status,
    )
    summaries = await _enrich_employee_summaries(employees, db)
    return Page.create(summaries, total, params)


@emp_router.get("/me", response_model=EmployeeResponse)
async def get_my_employee_profile(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the current user's own employee profile."""
    result = await db.execute(
        select(Employee).where(
            Employee.user_id == current_user.id,
            Employee.company_id == current_user.company_id,
            Employee.is_deleted == False,
        )
    )
    emp = result.scalar_one_or_none()
    if not emp:
        from app.core.exceptions import NotFoundException
        raise NotFoundException("Employee profile not found for current user")
    return EmployeeResponse.model_validate(emp)


@emp_router.get("/search", response_model=Page[EmployeeSummary])
async def search_employees(
    q: str = Query(..., min_length=1),
    params: PaginationParams = Depends(),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Full-text search across employees."""
    params.q = q
    svc = EmployeeService(db)
    employees, total = await svc.list(current_user.company_id, params)
    summaries = await _enrich_employee_summaries(employees, db)
    return Page.create(summaries, total, params)


@emp_router.get("/{business_id}", response_model=EmployeeResponse)
async def get_employee(
    business_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = EmployeeService(db)
    emp = await svc.get(business_id, current_user.company_id)
    return EmployeeResponse.model_validate(emp)


@emp_router.get("/{business_id}/summary", response_model=EmployeeSummaryDetail)
async def get_employee_summary(
    business_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get detailed employee summary including attendance, leaves, and manager."""
    svc = EmployeeService(db)
    data = await svc.get_summary(business_id, current_user.company_id)
    return EmployeeSummaryDetail.model_validate(data)


@emp_router.put("/{business_id}", response_model=EmployeeResponse)
async def update_employee(
    business_id: str,
    data: EmployeeUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hr_or_above()),
):
    svc = EmployeeService(db)
    emp = await svc.update(business_id, data, current_user.company_id, current_user.id)
    return EmployeeResponse.model_validate(emp)


@emp_router.delete("/{business_id}", response_model=MessageResponse)
async def delete_employee(
    business_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hr_or_above()),
):
    svc = EmployeeService(db)
    await svc.delete(business_id, current_user.company_id, current_user.id)
    return MessageResponse(message=f"Employee {business_id} deleted successfully")


@emp_router.post("/{business_id}/photo", response_model=EmployeeResponse)
async def upload_employee_photo(
    business_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload a profile photo for an employee."""
    from app.integrations.storage_service import StorageService
    svc = EmployeeService(db)
    emp = await svc.get(business_id, current_user.company_id)
    url = await StorageService.upload(file, folder="photos", company_id=current_user.company_id)
    emp.profile_photo_url = url
    await db.flush()
    await db.refresh(emp)
    return EmployeeResponse.model_validate(emp)


class EmployeeExitRequest(BaseModel):
    resignation_date: Optional[str] = None   # ISO date string
    last_working_day: Optional[str] = None   # ISO date string
    exit_reason: Optional[str] = None        # resignation | termination | end_of_contract | other
    notes: Optional[str] = None


@emp_router.post("/{business_id}/start-exit", response_model=EmployeeResponse)
async def start_employee_exit(
    business_id: str,
    data: EmployeeExitRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hr_or_above()),
):
    """Start the exit/resignation workflow for an employee.
    Moves the employee to notice_period status and records exit details."""
    svc = EmployeeService(db)
    emp = await svc.get(business_id, current_user.company_id)

    # Build exit note to append to employee notes
    exit_parts = [f"[EXIT INITIATED {__import__('datetime').date.today()}]"]
    if data.exit_reason:
        exit_parts.append(f"Reason: {data.exit_reason}")
    if data.resignation_date:
        exit_parts.append(f"Resignation date: {data.resignation_date}")
    if data.last_working_day:
        exit_parts.append(f"Last working day: {data.last_working_day}")
    if data.notes:
        exit_parts.append(f"Notes: {data.notes}")
    exit_note = " | ".join(exit_parts)

    existing_notes = emp.notes or ""
    emp.notes = f"{existing_notes}\n{exit_note}".strip()
    emp.employment_status = "notice_period"

    await db.flush()
    await db.refresh(emp)
    return EmployeeResponse.model_validate(emp)


@emp_router.post("/{business_id}/confirm-probation", response_model=EmployeeResponse)
async def confirm_probation(
    business_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hr_or_above()),
):
    """Confirm a probationary employee – moves them to active status."""
    svc = EmployeeService(db)
    emp = await svc.get(business_id, current_user.company_id)
    if emp.employment_status != "probation":
        raise HTTPException(status_code=400, detail="Employee is not currently in probation")
    emp.employment_status = "active"
    note = f"\n[PROBATION CONFIRMED {__import__('datetime').date.today()} by {current_user.email}]"
    emp.notes = (emp.notes or "") + note
    await db.flush()
    await db.refresh(emp)
    return EmployeeResponse.model_validate(emp)


def _format_employee(emp, db, company_id):
    return EmployeeResponse.model_validate(emp)


# ── Bulk Import ─────────────────────────────────────────────────────────────

IMPORT_TEMPLATE_HEADERS = [
    "full_name", "work_email", "phone", "designation", "department_name",
    "employment_type", "joining_date", "gender", "date_of_birth",
    "employee_code", "location", "work_mode",
]

SAMPLE_ROWS = [
    ["John Smith", "john@company.com", "+91 98765 43210", "Software Engineer", "Engineering",
     "full_time", "2024-01-15", "male", "1990-05-20", "", "Mumbai", "onsite"],
    ["Jane Doe", "jane@company.com", "+91 87654 32109", "HR Manager", "Human Resources",
     "full_time", "2023-06-01", "female", "1988-11-10", "", "Bangalore", "hybrid"],
]


class EmployeeImportRowResult(BaseModel):
    row: int
    status: str  # "success" | "error" | "skipped"
    employee_code: Optional[str] = None
    full_name: Optional[str] = None
    work_email: Optional[str] = None
    errors: List[str] = []


class EmployeeImportResponse(BaseModel):
    total: int
    created: int
    skipped: int
    errors: int
    results: List[EmployeeImportRowResult]


def _parse_csv_bytes(content: bytes) -> List[Dict[str, str]]:
    text = content.decode("utf-8-sig").strip()
    reader = csv.DictReader(io.StringIO(text))
    return [row for row in reader]


def _clean_row(raw: Dict[str, str], all_keys: List[str]) -> Dict[str, str]:
    """Normalise header names: lowercase + strip."""
    return {k.strip().lower().replace(" ", "_"): (v.strip() if v else "") for k, v in raw.items()}


@emp_router.get("/import/template")
async def download_import_template(
    current_user: "User" = Depends(require_hr_or_above()),
):
    """Return a pre-filled CSV template for employee bulk import."""
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(IMPORT_TEMPLATE_HEADERS)
    for row in SAMPLE_ROWS:
        writer.writerow(row)
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=employee_import_template.csv"},
    )


@emp_router.post("/import/validate", response_model=EmployeeImportResponse)
async def validate_employee_import(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: "User" = Depends(require_hr_or_above()),
):
    """Dry-run validation of a CSV employee import. Does NOT write to DB."""
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported. Please upload a .csv file.")

    content = await file.read()
    try:
        rows = _parse_csv_bytes(content)
    except Exception:
        raise HTTPException(status_code=400, detail="Failed to parse CSV. Ensure the file is UTF-8 encoded.")

    if not rows:
        raise HTTPException(status_code=400, detail="CSV file appears to be empty.")

    results: List[EmployeeImportRowResult] = []
    seen_emails: set = set()

    for i, raw in enumerate(rows, start=2):
        row = _clean_row(raw, list(raw.keys()))
        errs: List[str] = []

        full_name = row.get("full_name", "")
        work_email = row.get("work_email", "")

        if not full_name:
            errs.append("full_name is required")
        if not work_email:
            errs.append("work_email is required")
        elif "@" not in work_email or "." not in work_email.split("@")[-1]:
            errs.append(f"Invalid email: {work_email}")
        elif work_email in seen_emails:
            errs.append(f"Duplicate email in this file: {work_email}")
        else:
            seen_emails.add(work_email)
            # Check DB uniqueness
            existing = await db.execute(
                select(Employee).where(
                    Employee.work_email == work_email,
                    Employee.company_id == current_user.company_id,
                    Employee.is_deleted == False,
                )
            )
            if existing.scalar_one_or_none():
                errs.append(f"Employee with email {work_email} already exists")

        emp_type = row.get("employment_type", "full_time")
        if emp_type and emp_type not in ("full_time", "part_time", "contract", "intern", ""):
            errs.append(f"Invalid employment_type: {emp_type}. Use: full_time, part_time, contract, intern")

        results.append(EmployeeImportRowResult(
            row=i,
            status="error" if errs else "success",
            full_name=full_name or None,
            work_email=work_email or None,
            errors=errs,
        ))

    created = sum(1 for r in results if r.status == "success")
    errors = sum(1 for r in results if r.status == "error")

    return EmployeeImportResponse(
        total=len(results),
        created=created,
        skipped=0,
        errors=errors,
        results=results,
    )


@emp_router.post("/import", response_model=EmployeeImportResponse, status_code=201)
async def bulk_import_employees(
    file: UploadFile = File(...),
    skip_errors: bool = Query(False, description="Skip rows with errors and import valid ones"),
    db: AsyncSession = Depends(get_db),
    current_user: "User" = Depends(require_hr_or_above()),
):
    """Bulk import employees from a CSV file."""
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported. Please upload a .csv file.")

    content = await file.read()
    try:
        rows = _parse_csv_bytes(content)
    except Exception:
        raise HTTPException(status_code=400, detail="Failed to parse CSV. Ensure the file is UTF-8 encoded.")

    if not rows:
        raise HTTPException(status_code=400, detail="CSV file appears to be empty.")

    svc = EmployeeService(db)
    results: List[EmployeeImportRowResult] = []
    seen_emails: set = set()
    # Pre-load department map (name → id)
    dept_result = await db.execute(
        select(Department).where(
            Department.company_id == current_user.company_id,
            Department.is_deleted == False,
        )
    )
    dept_map = {d.name.strip().lower(): d.id for d in dept_result.scalars().all()}

    created_count = 0
    error_count = 0
    skipped_count = 0

    for i, raw in enumerate(rows, start=2):
        row = _clean_row(raw, list(raw.keys()))
        errs: List[str] = []

        full_name = row.get("full_name", "")
        work_email = row.get("work_email", "")

        if not full_name:
            errs.append("full_name is required")
        if not work_email:
            errs.append("work_email is required")
        elif "@" not in work_email or "." not in work_email.split("@")[-1]:
            errs.append(f"Invalid email: {work_email}")
        elif work_email in seen_emails:
            errs.append(f"Duplicate email in this file: {work_email}")
        else:
            seen_emails.add(work_email)
            existing = await db.execute(
                select(Employee).where(
                    Employee.work_email == work_email,
                    Employee.company_id == current_user.company_id,
                    Employee.is_deleted == False,
                )
            )
            if existing.scalar_one_or_none():
                errs.append(f"Employee with email {work_email} already exists — skipped")

        if errs:
            if skip_errors:
                results.append(EmployeeImportRowResult(row=i, status="skipped", full_name=full_name or None, work_email=work_email or None, errors=errs))
                skipped_count += 1
                continue
            else:
                results.append(EmployeeImportRowResult(row=i, status="error", full_name=full_name or None, work_email=work_email or None, errors=errs))
                error_count += 1
                continue

        # Resolve department
        dept_name = row.get("department_name", "").lower()
        dept_id = dept_map.get(dept_name)

        # Parse dates
        def _parse_date(val: str) -> Optional[Any]:
            if not val:
                return None
            for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%d-%m-%Y"):
                try:
                    from datetime import datetime
                    return datetime.strptime(val, fmt).date()
                except ValueError:
                    continue
            return None

        emp_type = row.get("employment_type", "full_time") or "full_time"
        if emp_type not in ("full_time", "part_time", "contract", "intern"):
            emp_type = "full_time"

        try:
            from app.schemas.employee import EmploymentType, WorkMode
            create_data = EmployeeCreate(
                full_name=full_name,
                work_email=work_email,
                phone=row.get("phone") or None,
                designation=row.get("designation") or None,
                department_id=dept_id,
                employment_type=EmploymentType(emp_type),
                joining_date=_parse_date(row.get("joining_date", "")),
                date_of_birth=_parse_date(row.get("date_of_birth", "")),
                gender=row.get("gender") or None,
                employee_code=row.get("employee_code") or None,
                location=row.get("location") or None,
                work_mode=WorkMode(row.get("work_mode", "onsite")) if row.get("work_mode") in ("onsite", "hybrid", "remote") else WorkMode.ONSITE,
            )
            emp = await svc.create(create_data, current_user.company_id, current_user.id)
            results.append(EmployeeImportRowResult(
                row=i, status="success",
                employee_code=emp.employee_code,
                full_name=emp.full_name,
                work_email=emp.work_email,
                errors=[],
            ))
            created_count += 1
        except Exception as e:
            results.append(EmployeeImportRowResult(
                row=i, status="error",
                full_name=full_name or None,
                work_email=work_email or None,
                errors=[str(e)],
            ))
            error_count += 1

    return EmployeeImportResponse(
        total=len(results),
        created=created_count,
        skipped=skipped_count,
        errors=error_count,
        results=results,
    )
