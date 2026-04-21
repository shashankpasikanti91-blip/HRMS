from __future__ import annotations

from typing import List, Optional, Tuple

from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundException, ConflictException, BadRequestException
from app.core.pagination import PaginationParams
from app.models.employee import Employee, Department
from app.models.attendance import Attendance, LeaveRequest
from app.repositories.base import BaseRepository
from app.schemas.employee import (
    EmployeeCreate,
    EmployeeUpdate,
    DepartmentCreate,
    DepartmentUpdate,
    EmployeeSummaryDetail,
)
from app.services.business_id_service import BusinessIdService
from datetime import date
import uuid


class DepartmentService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = BaseRepository(Department, db)

    async def create(self, data: DepartmentCreate, company_id: str, created_by: str) -> Department:
        # Check name uniqueness within company
        existing = await self.db.execute(
            select(Department).where(
                Department.name == data.name,
                Department.company_id == company_id,
                Department.is_deleted == False,
            )
        )
        if existing.scalar_one_or_none():
            raise ConflictException(f"Department with name '{data.name}' already exists")

        # Check code uniqueness within company (if provided)
        if data.code:
            existing_code = await self.db.execute(
                select(Department).where(
                    Department.code == data.code,
                    Department.company_id == company_id,
                    Department.is_deleted == False,
                )
            )
            if existing_code.scalar_one_or_none():
                raise ConflictException(f"Department with code '{data.code}' already exists")

        bid = await BusinessIdService.generate(self.db, "department")
        dept = Department(
            id=str(uuid.uuid4()),
            business_id=bid,
            company_id=company_id,
            name=data.name,
            code=data.code,
            description=data.description,
            parent_department_id=data.parent_department_id,
            head_employee_id=data.head_employee_id,
            created_by=created_by,
        )
        self.db.add(dept)
        await self.db.flush()
        await self.db.refresh(dept)
        return dept

    async def list(self, company_id: str, params: PaginationParams) -> Tuple[List[Department], int]:
        conditions = []
        if params.q:
            q = f"%{params.q}%"
            conditions.append(
                or_(
                    Department.name.ilike(q),
                    Department.code.ilike(q),
                    Department.business_id.ilike(q),
                )
            )
        return await self.repo.list(company_id=company_id, params=params, extra_conditions=conditions)

    async def get(self, business_id: str, company_id: str) -> Department:
        return await self.repo.get_or_404(business_id, company_id)

    async def update(self, business_id: str, data: DepartmentUpdate, company_id: str, updated_by: str) -> Department:
        dept = await self.repo.get_or_404(business_id, company_id)
        update_dict = data.model_dump(exclude_unset=True)
        update_dict["updated_by"] = updated_by
        return await self.repo.update(dept, update_dict)

    async def get_employee_count(self, department_id: str) -> int:
        result = await self.db.execute(
            select(func.count()).select_from(Employee).where(
                Employee.department_id == department_id,
                Employee.is_deleted == False,
            )
        )
        return result.scalar() or 0

    async def delete(self, business_id: str, company_id: str, deleted_by: str) -> None:
        dept = await self.repo.get_or_404(business_id, company_id)
        await self.repo.soft_delete(dept, deleted_by)


class EmployeeService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = BaseRepository(Employee, db)

    async def create(self, data: EmployeeCreate, company_id: str, created_by: str) -> Employee:
        # Normalize optional string fields — empty strings must become None to avoid
        # FK constraint violations or spurious uniqueness failures.
        work_email = data.work_email or None
        phone = data.phone.strip() if data.phone and data.phone.strip() else None
        employee_code = data.employee_code.strip() if data.employee_code and data.employee_code.strip() else None
        department_id_raw = data.department_id.strip() if data.department_id and data.department_id.strip() else None
        manager_id = data.manager_id.strip() if data.manager_id and data.manager_id.strip() else None
        designation = data.designation.strip() if data.designation and data.designation.strip() else None
        location = data.location.strip() if data.location and data.location.strip() else None

        if not work_email:
            raise BadRequestException("work_email is required")

        # Check work email uniqueness within company (active records only)
        existing = await self.db.execute(
            select(Employee).where(
                Employee.work_email == work_email,
                Employee.company_id == company_id,
                Employee.is_deleted == False,
            )
        )
        if existing.scalar_one_or_none():
            raise ConflictException(f"An active employee with email '{work_email}' already exists")

        # Check employee_code uniqueness if manually provided
        if employee_code:
            existing_code = await self.db.execute(
                select(Employee).where(
                    Employee.employee_code == employee_code,
                    Employee.company_id == company_id,
                    Employee.is_deleted == False,
                )
            )
            if existing_code.scalar_one_or_none():
                raise ConflictException(f"Employee with ID '{employee_code}' already exists")

        # Phone uniqueness: only warn if phone is non-trivial and already active
        # (phone is informational – do not hard-block on duplicates in the same company)

        bid = await BusinessIdService.generate(self.db, "employee")

        # Resolve department: accepts internal UUID or DEPT-* business_id
        department_id: Optional[str] = None
        if department_id_raw:
            if department_id_raw.startswith("DEPT-"):
                dept_result = await self.db.execute(
                    select(Department).where(
                        Department.business_id == department_id_raw,
                        Department.company_id == company_id,
                        Department.is_deleted == False,
                    )
                )
                dept = dept_result.scalar_one_or_none()
                if not dept:
                    raise BadRequestException(f"Department '{department_id_raw}' was not found")
                department_id = dept.id
            else:
                # Treat as internal UUID — validate it belongs to this company
                dept_result = await self.db.execute(
                    select(Department).where(
                        Department.id == department_id_raw,
                        Department.company_id == company_id,
                        Department.is_deleted == False,
                    )
                )
                dept = dept_result.scalar_one_or_none()
                if dept:
                    department_id = dept.id
                # Silently ignore invalid UUIDs rather than failing the whole request

        # Auto-generate employee_code if not provided, using company's configured format
        emp_code = employee_code
        if not emp_code:
            emp_code = await self._generate_employee_code(company_id, department_id)

        emp = Employee(
            id=str(uuid.uuid4()),
            business_id=bid,
            company_id=company_id,
            user_id=data.user_id,
            employee_code=emp_code,
            full_name=data.full_name,
            first_name=data.first_name,
            last_name=data.last_name,
            work_email=work_email,
            personal_email=str(data.personal_email) if data.personal_email else None,
            phone=phone,
            emergency_contact_name=data.emergency_contact_name or None,
            emergency_contact_phone=data.emergency_contact_phone or None,
            gender=data.gender.value if data.gender else None,
            date_of_birth=data.date_of_birth,
            joining_date=data.joining_date,
            employment_type=data.employment_type.value if data.employment_type else None,
            work_mode=data.work_mode.value if data.work_mode else None,
            department_id=department_id,
            designation=designation,
            manager_id=manager_id,
            location=location,
            notes=data.notes or None,
            created_by=created_by,
        )
        self.db.add(emp)
        await self.db.flush()
        await self.db.refresh(emp)
        return emp

    async def list(
        self,
        company_id: str,
        params: PaginationParams,
        department_id: Optional[str] = None,
        employment_status: Optional[str] = None,
    ) -> Tuple[List[Employee], int]:
        conditions = []
        if params.q:
            q = f"%{params.q}%"
            conditions.append(
                or_(
                    Employee.full_name.ilike(q),
                    Employee.work_email.ilike(q),
                    Employee.employee_code.ilike(q),
                    Employee.designation.ilike(q),
                    Employee.business_id.ilike(q),
                    Employee.phone.ilike(q),
                )
            )
        filters = {}
        if department_id:
            filters["department_id"] = department_id
        if employment_status:
            filters["employment_status"] = employment_status

        return await self.repo.list(
            company_id=company_id,
            params=params,
            filters=filters,
            extra_conditions=conditions,
        )

    async def _generate_employee_code(self, company_id: str, department_id: Optional[str] = None) -> str:
        """Generate a unique employee code using the company's configured format.

        Format config is stored in OrganizationSettings.custom_config['employee_id']:
            prefix          – string prefix, e.g. "EMP" or "IN" (default "EMP")
            include_year    – bool, include current year (default False)
            include_dept    – bool, include department code prefix (default False)
            separator       – separator char, e.g. "-" (default "-")
            padding         – zero-pad width for sequence number (default 4)
        """
        from app.models.organization import OrganizationSettings
        import datetime

        config: dict = {}
        settings_result = await self.db.execute(
            select(OrganizationSettings).where(
                OrganizationSettings.company_id == company_id,
                OrganizationSettings.is_deleted == False,
            )
        )
        settings = settings_result.scalar_one_or_none()
        if settings and settings.custom_config:
            config = settings.custom_config.get("employee_id", {})

        prefix = str(config.get("prefix", "EMP")).upper().strip() or "EMP"
        include_year = bool(config.get("include_year", False))
        include_dept = bool(config.get("include_dept", False))
        separator = str(config.get("separator", "-"))
        padding = int(config.get("padding", 4))

        # Build sequence prefix
        parts: list[str] = [prefix]
        if include_year:
            parts.append(str(datetime.date.today().year))
        if include_dept and department_id:
            dept_result = await self.db.execute(
                select(Department).where(Department.id == department_id)
            )
            dept = dept_result.scalar_one_or_none()
            if dept and dept.code:
                parts.append(dept.code.upper())

        # Count existing employees for this company to get next sequence
        count_result = await self.db.execute(
            select(func.count()).select_from(Employee).where(
                Employee.company_id == company_id
            )
        )
        next_num = (count_result.scalar() or 0) + 1
        parts.append(str(next_num).zfill(padding))

        return separator.join(parts)

    async def get(self, business_id: str, company_id: str) -> Employee:
        return await self.repo.get_or_404(business_id, company_id)

    async def get_summary(self, business_id: str, company_id: str) -> dict:
        emp = await self.repo.get_or_404(business_id, company_id)

        # Department
        dept_name = None
        if emp.department_id:
            dept_result = await self.db.execute(
                select(Department).where(Department.id == emp.department_id)
            )
            dept = dept_result.scalar_one_or_none()
            if dept:
                dept_name = dept.name

        # Manager
        manager_name = None
        if emp.manager_id:
            mgr_result = await self.db.execute(
                select(Employee).where(Employee.id == emp.manager_id)
            )
            mgr = mgr_result.scalar_one_or_none()
            if mgr:
                manager_name = mgr.full_name

        # Today's attendance
        today = date.today()
        att_result = await self.db.execute(
            select(Attendance).where(
                Attendance.employee_id == emp.id,
                Attendance.attendance_date == today,
            )
        )
        att = att_result.scalar_one_or_none()

        # Pending leaves
        leave_count_result = await self.db.execute(
            select(func.count()).select_from(LeaveRequest).where(
                LeaveRequest.employee_id == emp.id,
                LeaveRequest.status == "pending",
                LeaveRequest.is_deleted == False,
            )
        )
        pending_leaves = leave_count_result.scalar() or 0

        return {
            **emp.__dict__,
            "department_name": dept_name,
            "manager_name": manager_name,
            "today_attendance_status": att.status if att else None,
            "pending_leaves": pending_leaves,
        }

    async def update(self, business_id: str, data: EmployeeUpdate, company_id: str, updated_by: str) -> Employee:
        emp = await self.repo.get_or_404(business_id, company_id)
        update_dict = data.model_dump(exclude_unset=True)

        # Normalize empty strings to None for all string FK/optional fields
        string_optional_fields = (
            "phone", "designation", "location", "department_id", "manager_id",
            "emergency_contact_name", "emergency_contact_phone", "notes",
            "profile_photo_url",
        )
        for field in string_optional_fields:
            if field in update_dict:
                val = update_dict[field]
                if isinstance(val, str):
                    update_dict[field] = val.strip() or None

        # Resolve department_id: accept internal UUID or DEPT-* business_id
        if "department_id" in update_dict and update_dict["department_id"]:
            dept_id_raw = update_dict["department_id"]
            if dept_id_raw.startswith("DEPT-"):
                dept_result = await self.db.execute(
                    select(Department).where(
                        Department.business_id == dept_id_raw,
                        Department.company_id == company_id,
                        Department.is_deleted == False,
                    )
                )
                dept = dept_result.scalar_one_or_none()
                if dept:
                    update_dict["department_id"] = dept.id
                else:
                    del update_dict["department_id"]
            else:
                # Internal UUID — validate it belongs to this company
                dept_result = await self.db.execute(
                    select(Department).where(
                        Department.id == dept_id_raw,
                        Department.company_id == company_id,
                        Department.is_deleted == False,
                    )
                )
                if not dept_result.scalar_one_or_none():
                    update_dict["department_id"] = None

        # Convert enums to values
        for key in ("gender", "employment_type", "work_mode", "employment_status"):
            if key in update_dict and update_dict[key] and hasattr(update_dict[key], "value"):
                update_dict[key] = update_dict[key].value
        if "personal_email" in update_dict and update_dict["personal_email"]:
            update_dict["personal_email"] = str(update_dict["personal_email"])

        update_dict["updated_by"] = updated_by
        return await self.repo.update(emp, update_dict)

    async def delete(self, business_id: str, company_id: str, deleted_by: str) -> Employee:
        emp = await self.repo.get_or_404(business_id, company_id)
        return await self.repo.soft_delete(emp, deleted_by=deleted_by)
