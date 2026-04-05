from __future__ import annotations

import asyncio
from typing import Any, Optional

import httpx

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class N8NClient:
    """
    Async client for triggering n8n webhook workflows.
    Non-blocking: failures are logged but do not raise.
    """

    BASE_URL: str = settings.N8N_BASE_URL
    TIMEOUT: int = settings.N8N_TIMEOUT_SECONDS

    @classmethod
    def _headers(cls) -> dict[str, str]:
        headers: dict[str, str] = {"Content-Type": "application/json"}
        if settings.N8N_API_KEY:
            headers["X-N8N-API-KEY"] = settings.N8N_API_KEY
        if settings.N8N_WEBHOOK_SECRET:
            headers["X-Webhook-Secret"] = settings.N8N_WEBHOOK_SECRET
        return headers

    @classmethod
    async def _post(cls, webhook_path: str, payload: dict[str, Any]) -> Optional[dict]:
        if not settings.N8N_ENABLED:
            logger.debug("n8n disabled, skipping webhook", path=webhook_path)
            return None

        url = f"{cls.BASE_URL}{webhook_path}"
        try:
            async with httpx.AsyncClient(timeout=cls.TIMEOUT) as client:
                response = await client.post(url, json=payload, headers=cls._headers())
                response.raise_for_status()
                return response.json()
        except httpx.TimeoutException:
            logger.warning("n8n webhook timeout", url=url)
        except httpx.HTTPStatusError as e:
            logger.error("n8n webhook HTTP error", url=url, status=e.response.status_code)
        except Exception as e:
            logger.error("n8n webhook unexpected error", url=url, error=str(e))
        return None

    @classmethod
    async def trigger_candidate_screening(
        cls,
        application_business_id: str,
        candidate: dict[str, Any],
        job: dict[str, Any],
        resume_url: Optional[str] = None,
    ) -> Optional[dict]:
        """
        Trigger AI screening workflow.
        Expected n8n response:
          { ai_score, ai_summary, matched_skills, missing_skills, recommendation }
        """
        payload = {
            "application_business_id": application_business_id,
            "candidate": candidate,
            "job": job,
            "resume_url": resume_url,
        }
        return await cls._post(settings.N8N_CANDIDATE_SCREENING_WEBHOOK, payload)

    @classmethod
    async def trigger_onboarding(
        cls,
        employee_business_id: str,
        employee: dict[str, Any],
        company: dict[str, Any],
    ) -> Optional[dict]:
        payload = {
            "employee_business_id": employee_business_id,
            "employee": employee,
            "company": company,
        }
        return await cls._post(settings.N8N_ONBOARDING_WEBHOOK, payload)

    @classmethod
    async def trigger_attendance_alert(
        cls,
        company_id: str,
        employee_business_id: str,
        alert_type: str,
        details: dict[str, Any],
    ) -> Optional[dict]:
        payload = {
            "company_id": company_id,
            "employee_business_id": employee_business_id,
            "alert_type": alert_type,
            "details": details,
        }
        return await cls._post(settings.N8N_ATTENDANCE_ALERT_WEBHOOK, payload)

    @classmethod
    async def trigger_hr_assistant(
        cls,
        event_type: str,
        payload: dict[str, Any],
    ) -> Optional[dict]:
        return await cls._post(settings.N8N_HR_ASSISTANT_WEBHOOK, {"event": event_type, **payload})


n8n = N8NClient()
