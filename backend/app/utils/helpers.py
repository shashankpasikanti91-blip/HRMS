from __future__ import annotations

import re
import uuid
from datetime import date, datetime
from typing import Optional

from slugify import slugify  # type: ignore


def generate_uuid() -> str:
    return str(uuid.uuid4())


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


def mask_email(email: str) -> str:
    parts = email.split("@")
    if len(parts) != 2:
        return email
    local, domain = parts
    if len(local) <= 2:
        return f"{'*' * len(local)}@{domain}"
    return f"{local[0]}{'*' * (len(local) - 2)}{local[-1]}@{domain}"


def sanitize_phone(phone: Optional[str]) -> Optional[str]:
    if not phone:
        return None
    cleaned = re.sub(r"[^\d+]", "", phone)
    return cleaned if len(cleaned) >= 7 else None


def format_currency(amount: float, currency: str = "INR") -> str:
    return f"{currency} {amount:,.2f}"


def safe_divide(numerator: float, denominator: float, default: float = 0.0) -> float:
    if denominator == 0:
        return default
    return numerator / denominator


def utcnow() -> datetime:
    from datetime import timezone
    return datetime.now(tz=timezone.utc)
