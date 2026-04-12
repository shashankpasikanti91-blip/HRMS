from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, require_hr_or_above
from app.core.exceptions import NotFoundException
from app.core.pagination import PaginationParams, Page
from app.models.attendance import Holiday
from app.models.user import User
from app.schemas.holiday import HolidayCreate, HolidayUpdate, HolidayResponse
from app.schemas.base import MessageResponse
from app.services.business_id_service import BusinessIdService
import uuid

router = APIRouter(prefix="/holidays", tags=["Holidays"])


@router.post("", response_model=HolidayResponse, status_code=201)
async def create_holiday(
    data: HolidayCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hr_or_above()),
):
    bid = await BusinessIdService.generate(db, "holiday")
    holiday = Holiday(
        id=str(uuid.uuid4()),
        business_id=bid,
        company_id=current_user.company_id,
        name=data.name,
        date=data.date,
        holiday_type=data.holiday_type,
        country=data.country,
        state=data.state,
        description=data.description,
        is_paid=data.is_paid,
        created_by=current_user.id,
    )
    db.add(holiday)
    await db.flush()
    await db.refresh(holiday)
    return HolidayResponse.model_validate(holiday)


@router.get("", response_model=Page[HolidayResponse])
async def list_holidays(
    params: PaginationParams = Depends(),
    year: Optional[int] = Query(None),
    country: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conditions = [
        Holiday.company_id == current_user.company_id,
        Holiday.is_deleted == False,
    ]
    if year:
        from sqlalchemy import extract
        conditions.append(extract("year", Holiday.date) == year)
    if country:
        conditions.append(Holiday.country == country)
    if state:
        conditions.append(Holiday.state == state)

    count_q = select(__import__("sqlalchemy").func.count()).select_from(Holiday).where(and_(*conditions))
    total = (await db.execute(count_q)).scalar() or 0

    q = (
        select(Holiday)
        .where(and_(*conditions))
        .order_by(Holiday.date.asc())
        .offset(params.offset)
        .limit(params.page_size)
    )
    result = await db.execute(q)
    holidays = list(result.scalars().all())
    return Page.create(
        [HolidayResponse.model_validate(h) for h in holidays],
        total,
        params,
    )


@router.get("/{business_id}", response_model=HolidayResponse)
async def get_holiday(
    business_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Holiday).where(
            Holiday.business_id == business_id,
            Holiday.company_id == current_user.company_id,
            Holiday.is_deleted == False,
        )
    )
    holiday = result.scalar_one_or_none()
    if not holiday:
        raise NotFoundException("Holiday not found")
    return HolidayResponse.model_validate(holiday)


@router.put("/{business_id}", response_model=HolidayResponse)
async def update_holiday(
    business_id: str,
    data: HolidayUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hr_or_above()),
):
    result = await db.execute(
        select(Holiday).where(
            Holiday.business_id == business_id,
            Holiday.company_id == current_user.company_id,
            Holiday.is_deleted == False,
        )
    )
    holiday = result.scalar_one_or_none()
    if not holiday:
        raise NotFoundException("Holiday not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, val in update_data.items():
        setattr(holiday, key, val)
    holiday.updated_by = current_user.id
    await db.flush()
    await db.refresh(holiday)
    return HolidayResponse.model_validate(holiday)


@router.delete("/{business_id}", response_model=MessageResponse)
async def delete_holiday(
    business_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hr_or_above()),
):
    result = await db.execute(
        select(Holiday).where(
            Holiday.business_id == business_id,
            Holiday.company_id == current_user.company_id,
            Holiday.is_deleted == False,
        )
    )
    holiday = result.scalar_one_or_none()
    if not holiday:
        raise NotFoundException("Holiday not found")
    holiday.is_deleted = True
    await db.flush()
    return MessageResponse(message=f"Holiday '{holiday.name}' deleted successfully")
