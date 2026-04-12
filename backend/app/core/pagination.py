from __future__ import annotations

import math
from typing import Any, Generic, List, Optional, TypeVar

from fastapi import Query
from pydantic import BaseModel, computed_field

T = TypeVar("T")


class PaginationParams:
    """Reusable pagination query parameters."""

    def __init__(
        self,
        page: int = Query(default=1, ge=1, description="Page number (1-based)"),
        page_size: int = Query(default=20, ge=1, le=200, description="Items per page"),
        sort_by: Optional[str] = Query(default=None, description="Field to sort by"),
        sort_order: str = Query(default="desc", pattern="^(asc|desc)$", description="Sort direction"),
        q: Optional[str] = Query(default=None, description="Search query"),
    ):
        self.page = page
        self.page_size = page_size
        self.sort_by = sort_by
        self.sort_order = sort_order
        self.q = q

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size

    @property
    def limit(self) -> int:
        return self.page_size


class PageMeta(BaseModel):
    page: int
    page_size: int
    total: int
    total_pages: int
    has_next: bool
    has_prev: bool


class Page(BaseModel, Generic[T]):
    data: List[T]
    meta: PageMeta

    @computed_field
    @property
    def items(self) -> List[T]:
        return self.data

    @computed_field
    @property
    def total(self) -> int:
        return self.meta.total

    @classmethod
    def create(
        cls,
        items: List[Any],
        total: int,
        params: PaginationParams,
    ) -> "Page[T]":
        total_pages = max(1, math.ceil(total / params.page_size))
        return cls(
            data=items,
            meta=PageMeta(
                page=params.page,
                page_size=params.page_size,
                total=total,
                total_pages=total_pages,
                has_next=params.page < total_pages,
                has_prev=params.page > 1,
            ),
        )
