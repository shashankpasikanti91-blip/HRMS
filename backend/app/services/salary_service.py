"""Service for salary structures, components, and employee salary management."""
from __future__ import annotations

from typing import Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.salary import SalaryStructure, SalaryComponent, EmployeeSalary, TaxRule
from app.services.business_id_service import generate_business_id


class SalaryStructureService:

    @staticmethod
    async def create(db: AsyncSession, company_id: str, data: dict) -> SalaryStructure:
        structure = SalaryStructure(
            id=__import__("uuid").uuid4().__str__(),
            business_id=await generate_business_id(db, "SALSTR"),
            company_id=company_id,
            **data,
        )
        db.add(structure)
        await db.flush()
        return structure

    @staticmethod
    async def list(db: AsyncSession, company_id: str) -> list[SalaryStructure]:
        result = await db.execute(
            select(SalaryStructure).where(
                SalaryStructure.company_id == company_id,
                SalaryStructure.is_deleted == False,
            ).order_by(SalaryStructure.name)
        )
        return list(result.scalars().all())

    @staticmethod
    async def get(db: AsyncSession, company_id: str, business_id: str) -> Optional[SalaryStructure]:
        result = await db.execute(
            select(SalaryStructure).where(
                SalaryStructure.business_id == business_id,
                SalaryStructure.company_id == company_id,
                SalaryStructure.is_deleted == False,
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_id(db: AsyncSession, structure_id: str) -> Optional[SalaryStructure]:
        result = await db.execute(
            select(SalaryStructure).where(
                SalaryStructure.id == structure_id,
                SalaryStructure.is_deleted == False,
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def update(db: AsyncSession, company_id: str, business_id: str, data: dict) -> Optional[SalaryStructure]:
        s = await SalaryStructureService.get(db, company_id, business_id)
        if not s:
            return None
        for key, value in data.items():
            if value is not None and hasattr(s, key):
                setattr(s, key, value)
        await db.flush()
        return s

    @staticmethod
    async def delete(db: AsyncSession, company_id: str, business_id: str) -> bool:
        s = await SalaryStructureService.get(db, company_id, business_id)
        if not s:
            return False
        s.is_deleted = True
        await db.flush()
        return True


class SalaryComponentService:

    @staticmethod
    async def create(db: AsyncSession, company_id: str, data: dict) -> SalaryComponent:
        comp = SalaryComponent(
            id=__import__("uuid").uuid4().__str__(),
            business_id=await generate_business_id(db, "SALCMP"),
            company_id=company_id,
            **data,
        )
        db.add(comp)
        await db.flush()
        return comp

    @staticmethod
    async def list_by_structure(db: AsyncSession, company_id: str, structure_id: str) -> list[SalaryComponent]:
        result = await db.execute(
            select(SalaryComponent).where(
                SalaryComponent.salary_structure_id == structure_id,
                SalaryComponent.company_id == company_id,
                SalaryComponent.is_deleted == False,
            ).order_by(SalaryComponent.priority, SalaryComponent.name)
        )
        return list(result.scalars().all())

    @staticmethod
    async def get(db: AsyncSession, company_id: str, business_id: str) -> Optional[SalaryComponent]:
        result = await db.execute(
            select(SalaryComponent).where(
                SalaryComponent.business_id == business_id,
                SalaryComponent.company_id == company_id,
                SalaryComponent.is_deleted == False,
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def update(db: AsyncSession, company_id: str, business_id: str, data: dict) -> Optional[SalaryComponent]:
        comp = await SalaryComponentService.get(db, company_id, business_id)
        if not comp:
            return None
        for key, value in data.items():
            if value is not None and hasattr(comp, key):
                setattr(comp, key, value)
        await db.flush()
        return comp

    @staticmethod
    async def delete(db: AsyncSession, company_id: str, business_id: str) -> bool:
        comp = await SalaryComponentService.get(db, company_id, business_id)
        if not comp:
            return False
        comp.is_deleted = True
        await db.flush()
        return True


class EmployeeSalaryService:

    @staticmethod
    async def upsert(db: AsyncSession, company_id: str, data: dict) -> EmployeeSalary:
        employee_id = data.pop("employee_id")
        result = await db.execute(
            select(EmployeeSalary).where(
                EmployeeSalary.employee_id == employee_id,
                EmployeeSalary.company_id == company_id,
                EmployeeSalary.is_deleted == False,
            )
        )
        salary = result.scalar_one_or_none()
        if salary:
            for key, value in data.items():
                if value is not None and hasattr(salary, key):
                    setattr(salary, key, value)
        else:
            salary = EmployeeSalary(
                id=__import__("uuid").uuid4().__str__(),
                business_id=await generate_business_id(db, "EMPSAL"),
                company_id=company_id,
                employee_id=employee_id,
                **data,
            )
            db.add(salary)
        await db.flush()
        return salary

    @staticmethod
    async def get_by_employee(db: AsyncSession, company_id: str, employee_id: str) -> Optional[EmployeeSalary]:
        result = await db.execute(
            select(EmployeeSalary).where(
                EmployeeSalary.employee_id == employee_id,
                EmployeeSalary.company_id == company_id,
                EmployeeSalary.is_deleted == False,
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def calculate_components(
        db: AsyncSession, employee_salary: EmployeeSalary
    ) -> dict:
        """Calculate all salary components based on the salary structure."""
        structure = await SalaryStructureService.get_by_id(db, employee_salary.salary_structure_id)
        if not structure:
            return {"earnings": [], "deductions": [], "employer_contributions": []}

        components = await SalaryComponentService.list_by_structure(
            db, employee_salary.company_id, structure.id
        )

        basic = employee_salary.basic_salary
        gross = employee_salary.gross_salary or employee_salary.ctc
        ctc = employee_salary.ctc
        overrides = employee_salary.component_overrides or {}

        earnings = []
        deductions = []
        employer_contributions = []

        for comp in components:
            amount = 0.0
            # Check for employee-level override
            if comp.code in overrides:
                amount = float(overrides[comp.code])
            elif comp.calculation_type == "fixed":
                amount = comp.amount or 0.0
            elif comp.calculation_type == "percentage_of_basic":
                amount = basic * (comp.percentage or 0.0) / 100.0
            elif comp.calculation_type == "percentage_of_gross":
                amount = gross * (comp.percentage or 0.0) / 100.0
            elif comp.calculation_type == "percentage_of_ctc":
                amount = ctc * (comp.percentage or 0.0) / 100.0

            # Enforce min/max
            if comp.min_amount and amount < comp.min_amount:
                amount = comp.min_amount
            if comp.max_amount and amount > comp.max_amount:
                amount = comp.max_amount

            entry = {
                "name": comp.name,
                "code": comp.code,
                "type": comp.component_type,
                "amount": round(amount, 2),
                "is_taxable": comp.is_taxable,
            }

            if comp.component_type == "earning":
                earnings.append(entry)
            elif comp.component_type in ("deduction", "tax"):
                deductions.append(entry)
            elif comp.component_type == "employer_contribution":
                employer_contributions.append(entry)

        return {
            "earnings": earnings,
            "deductions": deductions,
            "employer_contributions": employer_contributions,
            "total_earnings": sum(e["amount"] for e in earnings),
            "total_deductions": sum(d["amount"] for d in deductions),
            "total_employer_contributions": sum(e["amount"] for e in employer_contributions),
            "gross_salary": sum(e["amount"] for e in earnings),
            "net_salary": sum(e["amount"] for e in earnings) - sum(d["amount"] for d in deductions),
        }
