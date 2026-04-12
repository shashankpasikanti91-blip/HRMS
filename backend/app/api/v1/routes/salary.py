"""API routes for salary structures, components, and employee salary management."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, require_hr_or_above
from app.models.user import User
from app.schemas.salary import (
    SalaryStructureCreate, SalaryStructureUpdate, SalaryStructureResponse,
    SalaryComponentCreate, SalaryComponentUpdate, SalaryComponentResponse,
    EmployeeSalaryCreate, EmployeeSalaryUpdate, EmployeeSalaryResponse,
)
from app.schemas.base import MessageResponse
from app.services.salary_service import (
    SalaryStructureService, SalaryComponentService, EmployeeSalaryService,
)

router = APIRouter(tags=["Salary"])


# ── Salary Structures ────────────────────────────────────────────────────

@router.post("/salary-structures", response_model=SalaryStructureResponse, status_code=201)
async def create_salary_structure(
    data: SalaryStructureCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hr_or_above()),
):
    if not current_user.company_id:
        raise HTTPException(400, "No company associated")
    structure = await SalaryStructureService.create(
        db, current_user.company_id, data.model_dump(exclude_unset=True)
    )
    await db.commit()
    return SalaryStructureResponse(
        business_id=structure.business_id, name=structure.name,
        code=structure.code, description=structure.description,
        currency=structure.currency, is_default=structure.is_default,
        payroll_cycle=structure.payroll_cycle, is_active=structure.is_active,
    )


@router.get("/salary-structures")
async def list_salary_structures(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.company_id:
        raise HTTPException(400, "No company associated")
    structures = await SalaryStructureService.list(db, current_user.company_id)

    items = []
    for s in structures:
        components = await SalaryComponentService.list_by_structure(db, current_user.company_id, s.id)
        items.append(SalaryStructureResponse(
            business_id=s.business_id, name=s.name, code=s.code,
            description=s.description, currency=s.currency,
            is_default=s.is_default, payroll_cycle=s.payroll_cycle,
            is_active=s.is_active,
            components=[
                SalaryComponentResponse(
                    business_id=c.business_id, salary_structure_id=c.salary_structure_id,
                    name=c.name, code=c.code, component_type=c.component_type,
                    calculation_type=c.calculation_type, amount=c.amount,
                    percentage=c.percentage, formula=c.formula,
                    is_taxable=c.is_taxable, is_mandatory=c.is_mandatory,
                    priority=c.priority, max_amount=c.max_amount,
                    min_amount=c.min_amount, description=c.description,
                    is_active=c.is_active,
                )
                for c in components
            ],
        ))

    return {"items": items, "total": len(items)}


@router.get("/salary-structures/{business_id}", response_model=SalaryStructureResponse)
async def get_salary_structure(
    business_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.company_id:
        raise HTTPException(400, "No company associated")
    s = await SalaryStructureService.get(db, current_user.company_id, business_id)
    if not s:
        raise HTTPException(404, "Salary structure not found")
    components = await SalaryComponentService.list_by_structure(db, current_user.company_id, s.id)
    return SalaryStructureResponse(
        business_id=s.business_id, name=s.name, code=s.code,
        description=s.description, currency=s.currency,
        is_default=s.is_default, payroll_cycle=s.payroll_cycle,
        is_active=s.is_active,
        components=[
            SalaryComponentResponse(
                business_id=c.business_id, salary_structure_id=c.salary_structure_id,
                name=c.name, code=c.code, component_type=c.component_type,
                calculation_type=c.calculation_type, amount=c.amount,
                percentage=c.percentage, formula=c.formula,
                is_taxable=c.is_taxable, is_mandatory=c.is_mandatory,
                priority=c.priority, max_amount=c.max_amount,
                min_amount=c.min_amount, description=c.description,
                is_active=c.is_active,
            )
            for c in components
        ],
    )


@router.put("/salary-structures/{business_id}", response_model=SalaryStructureResponse)
async def update_salary_structure(
    business_id: str,
    data: SalaryStructureUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hr_or_above()),
):
    if not current_user.company_id:
        raise HTTPException(400, "No company associated")
    s = await SalaryStructureService.update(
        db, current_user.company_id, business_id, data.model_dump(exclude_unset=True)
    )
    if not s:
        raise HTTPException(404, "Salary structure not found")
    await db.commit()
    return SalaryStructureResponse(
        business_id=s.business_id, name=s.name, code=s.code,
        description=s.description, currency=s.currency,
        is_default=s.is_default, payroll_cycle=s.payroll_cycle,
        is_active=s.is_active,
    )


@router.delete("/salary-structures/{business_id}", response_model=MessageResponse)
async def delete_salary_structure(
    business_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hr_or_above()),
):
    if not current_user.company_id:
        raise HTTPException(400, "No company associated")
    deleted = await SalaryStructureService.delete(db, current_user.company_id, business_id)
    if not deleted:
        raise HTTPException(404, "Salary structure not found")
    await db.commit()
    return MessageResponse(message="Salary structure deleted successfully")


# ── Salary Components ─────────────────────────────────────────────────────

@router.post("/salary-components", response_model=SalaryComponentResponse, status_code=201)
async def create_salary_component(
    data: SalaryComponentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hr_or_above()),
):
    if not current_user.company_id:
        raise HTTPException(400, "No company associated")
    comp = await SalaryComponentService.create(
        db, current_user.company_id, data.model_dump(exclude_unset=True)
    )
    await db.commit()
    return SalaryComponentResponse(
        business_id=comp.business_id, salary_structure_id=comp.salary_structure_id,
        name=comp.name, code=comp.code, component_type=comp.component_type,
        calculation_type=comp.calculation_type, amount=comp.amount,
        percentage=comp.percentage, formula=comp.formula,
        is_taxable=comp.is_taxable, is_mandatory=comp.is_mandatory,
        priority=comp.priority, max_amount=comp.max_amount,
        min_amount=comp.min_amount, description=comp.description,
        is_active=comp.is_active,
    )


@router.put("/salary-components/{business_id}", response_model=SalaryComponentResponse)
async def update_salary_component(
    business_id: str,
    data: SalaryComponentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hr_or_above()),
):
    if not current_user.company_id:
        raise HTTPException(400, "No company associated")
    comp = await SalaryComponentService.update(
        db, current_user.company_id, business_id, data.model_dump(exclude_unset=True)
    )
    if not comp:
        raise HTTPException(404, "Salary component not found")
    await db.commit()
    return SalaryComponentResponse(
        business_id=comp.business_id, salary_structure_id=comp.salary_structure_id,
        name=comp.name, code=comp.code, component_type=comp.component_type,
        calculation_type=comp.calculation_type, amount=comp.amount,
        percentage=comp.percentage, formula=comp.formula,
        is_taxable=comp.is_taxable, is_mandatory=comp.is_mandatory,
        priority=comp.priority, max_amount=comp.max_amount,
        min_amount=comp.min_amount, description=comp.description,
        is_active=comp.is_active,
    )


@router.delete("/salary-components/{business_id}", response_model=MessageResponse)
async def delete_salary_component(
    business_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hr_or_above()),
):
    if not current_user.company_id:
        raise HTTPException(400, "No company associated")
    deleted = await SalaryComponentService.delete(db, current_user.company_id, business_id)
    if not deleted:
        raise HTTPException(404, "Salary component not found")
    await db.commit()
    return MessageResponse(message="Salary component deleted successfully")


# ── Employee Salary ───────────────────────────────────────────────────────

@router.post("/employee-salary", response_model=EmployeeSalaryResponse, status_code=201)
async def upsert_employee_salary(
    data: EmployeeSalaryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hr_or_above()),
):
    if not current_user.company_id:
        raise HTTPException(400, "No company associated")
    salary = await EmployeeSalaryService.upsert(
        db, current_user.company_id, data.model_dump(exclude_unset=True)
    )
    await db.commit()
    return EmployeeSalaryResponse(
        business_id=salary.business_id, employee_id=salary.employee_id,
        salary_structure_id=salary.salary_structure_id, ctc=salary.ctc,
        basic_salary=salary.basic_salary, gross_salary=salary.gross_salary,
        net_salary=salary.net_salary, currency=salary.currency,
        component_overrides=salary.component_overrides,
        effective_from=salary.effective_from, is_active=salary.is_active,
    )


@router.get("/employee-salary/{employee_business_id}", response_model=EmployeeSalaryResponse)
async def get_employee_salary(
    employee_business_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hr_or_above()),
):
    if not current_user.company_id:
        raise HTTPException(400, "No company associated")

    from app.models.employee import Employee
    from sqlalchemy import select
    result = await db.execute(
        select(Employee).where(
            Employee.business_id == employee_business_id,
            Employee.company_id == current_user.company_id,
            Employee.is_deleted == False,
        )
    )
    employee = result.scalar_one_or_none()
    if not employee:
        raise HTTPException(404, "Employee not found")

    salary = await EmployeeSalaryService.get_by_employee(db, current_user.company_id, employee.id)
    if not salary:
        raise HTTPException(404, "No salary record found for this employee")

    return EmployeeSalaryResponse(
        business_id=salary.business_id, employee_id=salary.employee_id,
        salary_structure_id=salary.salary_structure_id, ctc=salary.ctc,
        basic_salary=salary.basic_salary, gross_salary=salary.gross_salary,
        net_salary=salary.net_salary, currency=salary.currency,
        component_overrides=salary.component_overrides,
        effective_from=salary.effective_from, is_active=salary.is_active,
    )


@router.get("/employee-salary/{employee_business_id}/breakdown")
async def get_employee_salary_breakdown(
    employee_business_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hr_or_above()),
):
    """Calculate full salary breakdown based on structure and components."""
    if not current_user.company_id:
        raise HTTPException(400, "No company associated")

    from app.models.employee import Employee
    from sqlalchemy import select
    result = await db.execute(
        select(Employee).where(
            Employee.business_id == employee_business_id,
            Employee.company_id == current_user.company_id,
            Employee.is_deleted == False,
        )
    )
    employee = result.scalar_one_or_none()
    if not employee:
        raise HTTPException(404, "Employee not found")

    salary = await EmployeeSalaryService.get_by_employee(db, current_user.company_id, employee.id)
    if not salary:
        raise HTTPException(404, "No salary record found for this employee")

    breakdown = await EmployeeSalaryService.calculate_components(db, salary)
    return {
        "employee_business_id": employee_business_id,
        "employee_name": employee.full_name,
        "ctc": salary.ctc,
        "basic_salary": salary.basic_salary,
        **breakdown,
    }
