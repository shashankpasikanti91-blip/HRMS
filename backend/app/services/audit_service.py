from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog
from app.services.business_id_service import BusinessIdService
import uuid


class AuditService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def log(
        self,
        entity_type: str,
        entity_id: str,
        action: str,
        actor_user_id: Optional[str] = None,
        company_id: Optional[str] = None,
        entity_business_id: Optional[str] = None,
        old_values: Optional[dict[str, Any]] = None,
        new_values: Optional[dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        description: Optional[str] = None,
    ) -> None:
        """Create an audit log entry. Does not raise on failure."""
        try:
            bid = await BusinessIdService.generate(self.db, "audit_log")
            log_entry = AuditLog(
                id=str(uuid.uuid4()),
                business_id=bid,
                company_id=company_id,
                actor_user_id=actor_user_id,
                entity_type=entity_type,
                entity_id=entity_id,
                entity_business_id=entity_business_id,
                action=action,
                old_values=old_values,
                new_values=new_values,
                ip_address=ip_address,
                user_agent=user_agent,
                description=description,
            )
            self.db.add(log_entry)
            await self.db.flush()
        except Exception:
            pass  # Never break the main transaction because of audit failure
