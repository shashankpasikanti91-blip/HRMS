from fastapi import APIRouter
from typing import List, Optional
from pydantic import BaseModel
from app.models.schemas import AttritionPredictionResponse
from app.services.prediction_service import prediction_service

router = APIRouter()


class AttritionRequest(BaseModel):
    tenant_id: str
    employees: List[dict]


class HiringForecastRequest(BaseModel):
    tenant_id: str
    current_headcount: int
    avg_attrition_rate: float = 0.05
    growth_target: float = 0.10
    monthly_hires: List[int] = []
    forecast_months: int = 6


class EngagementRequest(BaseModel):
    tenant_id: str
    employee: dict


@router.post("/attrition")
async def predict_attrition(request: AttritionRequest):
    """Predict attrition risk for employees."""
    result = await prediction_service.predict_attrition(employees=request.employees)
    return {"tenant_id": request.tenant_id, **result}


@router.post("/hiring-demand")
async def forecast_hiring_demand(request: HiringForecastRequest):
    """Forecast hiring demand based on historical data."""
    result = await prediction_service.forecast_hiring_demand(
        historical_data={
            "current_headcount": request.current_headcount,
            "avg_attrition_rate": request.avg_attrition_rate,
            "growth_target": request.growth_target,
            "monthly_hires": request.monthly_hires,
        },
        forecast_months=request.forecast_months,
    )
    return {"tenant_id": request.tenant_id, **result}


@router.post("/engagement")
async def predict_engagement(request: EngagementRequest):
    """Predict employee engagement level."""
    result = await prediction_service.predict_engagement(employee_data=request.employee)
    return {"tenant_id": request.tenant_id, **result}
