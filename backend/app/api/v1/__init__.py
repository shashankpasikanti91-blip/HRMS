from __future__ import annotations

from fastapi import APIRouter

from app.api.v1.routes.auth import router as auth_router
from app.api.v1.routes.companies import router as companies_router
from app.api.v1.routes.users import router as users_router
from app.api.v1.routes.employees import dept_router, emp_router
from app.api.v1.routes.attendance import att_router, leave_router
from app.api.v1.routes.recruitment import (
    job_router,
    candidate_router,
    application_router,
    interview_router,
    offer_router,
    ai_recruitment_router,
)
from app.api.v1.routes.payroll import router as payroll_router
from app.api.v1.routes.performance import router as performance_router
from app.api.v1.routes.documents import doc_router, notif_router
from app.api.v1.routes.analytics import router as analytics_router
from app.api.v1.routes.search import router as search_router
from app.api.v1.routes.holidays import router as holiday_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth_router)
api_router.include_router(companies_router)
api_router.include_router(users_router)
api_router.include_router(dept_router)
api_router.include_router(emp_router)
api_router.include_router(att_router)
api_router.include_router(leave_router)
api_router.include_router(job_router)
api_router.include_router(candidate_router)
api_router.include_router(application_router)
api_router.include_router(interview_router)
api_router.include_router(offer_router)
api_router.include_router(ai_recruitment_router)
api_router.include_router(payroll_router)
api_router.include_router(performance_router)
api_router.include_router(doc_router)
api_router.include_router(notif_router)
api_router.include_router(analytics_router)
api_router.include_router(search_router)
api_router.include_router(holiday_router)
