from __future__ import annotations

import re
from datetime import date
from typing import Optional

from slugify import slugify  # type: ignore


def slugify_name(name: str) -> str:
    return slugify(name, separator="-", max_length=80)


def calculate_working_days(start: date, end: date) -> int:
    """Return the number of working days (Mon–Fri) between two dates inclusive."""
    if start > end:
        return 0
    total = 0
    current = start
    while current <= end:
        if current.weekday() < 5:  # Mon=0 … Fri=4
            total += 1
        from datetime import timedelta
        current += timedelta(days=1)
    return total


def safe_divide(numerator: float, denominator: float, default: float = 0.0) -> float:
    if denominator == 0:
        return default
    return numerator / denominator
