from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.search import GlobalSearchResponse
from app.services.search_service import SearchService

router = APIRouter(prefix="/search", tags=["Search"])


@router.get("/global", response_model=GlobalSearchResponse)
async def global_search(
    q: str = Query(..., min_length=1, max_length=100, description="Search query"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Global search across employees, candidates, jobs, departments, and attendance.
    Supports business IDs (EMP-000001), names, emails, and titles.
    Returns up to 5 results per entity type with a direct `open_route` link.
    """
    svc = SearchService(db)
    results = await svc.global_search(q.strip(), current_user.company_id)
    return results
