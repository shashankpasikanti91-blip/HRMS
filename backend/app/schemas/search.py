from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel

from app.schemas.base import BaseSchema


class SearchResultItem(BaseSchema):
    entity_type: str
    id: str
    business_id: str
    title: str
    subtitle: Optional[str] = None
    status: Optional[str] = None
    open_route: str
    extra: Optional[dict] = None


class GlobalSearchResponse(BaseSchema):
    query: str
    total: int
    results: List[SearchResultItem]
