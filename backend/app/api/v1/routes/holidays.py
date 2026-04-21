from __future__ import annotations

import csv
import io
from typing import List, Optional

from fastapi import APIRouter, Depends, Query, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
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


# ── Bulk Import ─────────────────────────────────────────────────────────────

HOLIDAY_TEMPLATE_HEADERS = ["name", "date", "holiday_type", "country", "state", "description", "is_paid"]
HOLIDAY_SAMPLE_ROWS = [
    ["New Year's Day", "2025-01-01", "public", "MY", "", "New Year celebration", "true"],
    ["Chinese New Year", "2025-01-29", "public", "MY", "", "Lunar New Year", "true"],
    ["Hari Raya Aidilfitri", "2025-03-31", "public", "MY", "", "", "true"],
    ["Team Building Day", "2025-06-15", "optional", "", "", "Annual team event", "false"],
]


class HolidayImportRowResult(BaseModel):
    row: int
    status: str  # "success" | "error" | "skipped" | "duplicate"
    name: Optional[str] = None
    date: Optional[str] = None
    errors: List[str] = []


class HolidayImportResponse(BaseModel):
    total: int
    created: int
    skipped: int
    errors: int
    results: List[HolidayImportRowResult]


def _parse_holiday_csv(content: bytes) -> List[dict]:
    text = content.decode("utf-8-sig").strip()
    reader = csv.DictReader(io.StringIO(text))
    return [row for row in reader]


def _clean_holiday_row(raw: dict) -> dict:
    return {k.strip().lower().replace(" ", "_"): (v.strip() if v else "") for k, v in raw.items()}


def _parse_date_str(val: str):
    if not val:
        return None
    from datetime import datetime
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%d-%m-%Y", "%d %b %Y"):
        try:
            return datetime.strptime(val, fmt).date()
        except ValueError:
            continue
    return None


@router.get("/import/template")
async def download_holiday_template(
    current_user: "User" = Depends(require_hr_or_above()),
):
    """Download a pre-filled CSV template for bulk holiday import."""
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(HOLIDAY_TEMPLATE_HEADERS)
    for row in HOLIDAY_SAMPLE_ROWS:
        writer.writerow(row)
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=holiday_import_template.csv"},
    )


@router.post("/import/validate", response_model=HolidayImportResponse)
async def validate_holiday_import(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: "User" = Depends(require_hr_or_above()),
):
    """Dry-run validation of a CSV holiday import. Does NOT write to DB."""
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")

    content = await file.read()
    try:
        rows = _parse_holiday_csv(content)
    except Exception:
        raise HTTPException(status_code=400, detail="Failed to parse CSV file.")

    if not rows:
        raise HTTPException(status_code=400, detail="CSV file is empty.")

    results: List[HolidayImportRowResult] = []
    seen_dates_names: set = set()

    for i, raw in enumerate(rows, start=2):
        row = _clean_holiday_row(raw)
        errs: List[str] = []
        name = row.get("name", "")
        date_str = row.get("date", "")

        if not name:
            errs.append("name is required")
        if not date_str:
            errs.append("date is required")
        else:
            parsed = _parse_date_str(date_str)
            if not parsed:
                errs.append(f"Invalid date format: {date_str}. Use YYYY-MM-DD")
            else:
                key = (name.lower(), str(parsed))
                if key in seen_dates_names:
                    errs.append(f"Duplicate in file: {name} on {parsed}")
                else:
                    seen_dates_names.add(key)
                    # Check DB
                    existing = await db.execute(
                        select(Holiday).where(
                            Holiday.company_id == current_user.company_id,
                            Holiday.name == name,
                            Holiday.date == parsed,
                            Holiday.is_deleted == False,
                        )
                    )
                    if existing.scalar_one_or_none():
                        errs.append(f"Holiday '{name}' on {parsed} already exists")

        htype = row.get("holiday_type", "public")
        if htype and htype not in ("public", "restricted", "optional", ""):
            errs.append(f"Invalid holiday_type: {htype}. Use: public, restricted, optional")

        results.append(HolidayImportRowResult(
            row=i,
            status="error" if errs else "success",
            name=name or None,
            date=date_str or None,
            errors=errs,
        ))

    created = sum(1 for r in results if r.status == "success")
    errors = sum(1 for r in results if r.status == "error")
    return HolidayImportResponse(total=len(results), created=created, skipped=0, errors=errors, results=results)


@router.post("/import", response_model=HolidayImportResponse, status_code=201)
async def bulk_import_holidays(
    file: UploadFile = File(...),
    skip_errors: bool = Query(False, description="Skip invalid rows and import valid ones"),
    db: AsyncSession = Depends(get_db),
    current_user: "User" = Depends(require_hr_or_above()),
):
    """Bulk import holidays from a CSV file."""
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")

    content = await file.read()
    try:
        rows = _parse_holiday_csv(content)
    except Exception:
        raise HTTPException(status_code=400, detail="Failed to parse CSV file.")

    if not rows:
        raise HTTPException(status_code=400, detail="CSV file is empty.")

    results: List[HolidayImportRowResult] = []
    seen_dates_names: set = set()
    created_count = 0
    error_count = 0
    skipped_count = 0

    for i, raw in enumerate(rows, start=2):
        row = _clean_holiday_row(raw)
        errs: List[str] = []
        name = row.get("name", "")
        date_str = row.get("date", "")
        parsed_date = None

        if not name:
            errs.append("name is required")
        if not date_str:
            errs.append("date is required")
        else:
            parsed_date = _parse_date_str(date_str)
            if not parsed_date:
                errs.append(f"Invalid date format: {date_str}")
            else:
                key = (name.lower(), str(parsed_date))
                if key in seen_dates_names:
                    errs.append(f"Duplicate in file: {name} on {parsed_date}")
                else:
                    seen_dates_names.add(key)
                    existing = await db.execute(
                        select(Holiday).where(
                            Holiday.company_id == current_user.company_id,
                            Holiday.name == name,
                            Holiday.date == parsed_date,
                            Holiday.is_deleted == False,
                        )
                    )
                    if existing.scalar_one_or_none():
                        errs.append(f"Holiday '{name}' on {parsed_date} already exists — skipped")

        if errs:
            if skip_errors:
                results.append(HolidayImportRowResult(row=i, status="skipped", name=name or None, date=date_str or None, errors=errs))
                skipped_count += 1
                continue
            else:
                results.append(HolidayImportRowResult(row=i, status="error", name=name or None, date=date_str or None, errors=errs))
                error_count += 1
                continue

        htype = row.get("holiday_type", "public").strip() or "public"
        if htype not in ("public", "restricted", "optional"):
            htype = "public"

        is_paid_raw = row.get("is_paid", "true").lower()
        is_paid = is_paid_raw not in ("false", "0", "no", "n")

        try:
            bid = await BusinessIdService.generate(db, "holiday")
            holiday = Holiday(
                id=str(uuid.uuid4()),
                business_id=bid,
                company_id=current_user.company_id,
                name=name,
                date=parsed_date,
                holiday_type=htype,
                country=row.get("country") or None,
                state=row.get("state") or None,
                description=row.get("description") or None,
                is_paid=is_paid,
                created_by=current_user.id,
            )
            db.add(holiday)
            await db.flush()
            results.append(HolidayImportRowResult(row=i, status="success", name=name, date=str(parsed_date), errors=[]))
            created_count += 1
        except Exception as e:
            results.append(HolidayImportRowResult(row=i, status="error", name=name or None, date=date_str or None, errors=[str(e)]))
            error_count += 1

    return HolidayImportResponse(
        total=len(results),
        created=created_count,
        skipped=skipped_count,
        errors=error_count,
        results=results,
    )
