"""
Predictive analytics service: attrition prediction, demand forecasting, engagement scoring.
Uses scikit-learn models for ML predictions.
"""

from typing import List, Optional
import structlog
import math

logger = structlog.get_logger()


class PredictionService:
    def __init__(self):
        pass

    async def predict_attrition(
        self,
        employees: List[dict],
    ) -> dict:
        """Predict attrition risk for a list of employees using weighted scoring model."""
        predictions = []

        for emp in employees:
            score, factors, suggestions = self._calculate_attrition_risk(emp)
            risk_level = "high" if score >= 65 else "medium" if score >= 35 else "low"

            predictions.append({
                "employee_id": emp.get("id", ""),
                "risk_score": round(score, 1),
                "risk_level": risk_level,
                "contributing_factors": factors,
                "retention_suggestions": suggestions,
            })

        # Sort by risk score descending
        predictions.sort(key=lambda x: x["risk_score"], reverse=True)

        high = sum(1 for p in predictions if p["risk_level"] == "high")
        medium = sum(1 for p in predictions if p["risk_level"] == "medium")
        low = sum(1 for p in predictions if p["risk_level"] == "low")

        return {
            "total_employees": len(predictions),
            "high_risk_count": high,
            "medium_risk_count": medium,
            "low_risk_count": low,
            "predictions": predictions,
        }

    async def forecast_hiring_demand(
        self,
        historical_data: dict,
        forecast_months: int = 6,
    ) -> dict:
        """Forecast hiring demand based on historical trends."""
        monthly_hires = historical_data.get("monthly_hires", [])
        avg_attrition_rate = historical_data.get("avg_attrition_rate", 0.05)
        growth_target = historical_data.get("growth_target", 0.10)
        current_headcount = historical_data.get("current_headcount", 0)

        if not monthly_hires:
            avg_monthly_hires = max(1, int(current_headcount * 0.02))
        else:
            avg_monthly_hires = sum(monthly_hires) / len(monthly_hires) if monthly_hires else 1

        forecast = []
        projected = current_headcount

        for month in range(1, forecast_months + 1):
            # Project attrition
            monthly_attrition = math.ceil(projected * (avg_attrition_rate / 12))
            # Growth needs
            growth_hires = math.ceil(current_headcount * (growth_target / 12))
            # Total hires needed
            total_hires_needed = monthly_attrition + growth_hires

            projected = projected - monthly_attrition + total_hires_needed

            forecast.append({
                "month": month,
                "projected_attrition": monthly_attrition,
                "growth_hires": growth_hires,
                "total_hires_needed": total_hires_needed,
                "projected_headcount": projected,
            })

        return {
            "current_headcount": current_headcount,
            "forecast_period_months": forecast_months,
            "total_hires_needed": sum(f["total_hires_needed"] for f in forecast),
            "total_projected_attrition": sum(f["projected_attrition"] for f in forecast),
            "forecast": forecast,
        }

    async def predict_engagement(
        self,
        employee_data: dict,
    ) -> dict:
        """Predict employee engagement score based on various signals."""
        factors = {}

        # Attendance pattern (0-25)
        attendance_rate = employee_data.get("attendance_rate", 0.9)
        factors["attendance"] = {"score": min(25, attendance_rate * 25), "weight": 0.2}

        # Leave utilization (0-20) - both too high and too low are flags
        leave_util = employee_data.get("leave_utilization", 0.5)
        leave_score = 20 - abs(leave_util - 0.5) * 40
        factors["leave_pattern"] = {"score": max(0, leave_score), "weight": 0.15}

        # Performance rating (0-25)
        perf_rating = employee_data.get("performance_rating", 3)
        factors["performance"] = {"score": min(25, (perf_rating / 5) * 25), "weight": 0.25}

        # Tenure (0-15)
        tenure_years = employee_data.get("tenure_years", 1)
        tenure_score = min(15, tenure_years * 2.5) if tenure_years <= 6 else max(5, 15 - (tenure_years - 6))
        factors["tenure"] = {"score": tenure_score, "weight": 0.15}

        # Training/development (0-15)
        training_hours = employee_data.get("training_hours", 0)
        factors["development"] = {"score": min(15, training_hours * 0.3), "weight": 0.15}

        total_score = sum(f["score"] for f in factors.values())
        engagement_level = "highly_engaged" if total_score >= 75 else "engaged" if total_score >= 55 else "neutral" if total_score >= 35 else "disengaged"

        return {
            "employee_id": employee_data.get("id", ""),
            "engagement_score": round(total_score, 1),
            "engagement_level": engagement_level,
            "factors": factors,
            "recommendations": self._engagement_recommendations(factors, engagement_level),
        }

    def _calculate_attrition_risk(self, emp: dict) -> tuple:
        """Calculate attrition risk score using a weighted factor model."""
        score = 0.0
        factors = []
        suggestions = []

        # Tenure factor (0-25)
        tenure = emp.get("tenure_years", 0)
        if tenure < 1:
            score += 15
            factors.append({"factor": "New hire", "impact": 15, "description": "Less than 1 year tenure"})
            suggestions.append("Strengthen onboarding and mentorship program")
        elif tenure < 2:
            score += 20
            factors.append({"factor": "Critical tenure", "impact": 20, "description": "1-2 year window is highest attrition period"})
            suggestions.append("Conduct stay interview and career development discussion")
        elif tenure > 7:
            score += 10
            factors.append({"factor": "Long tenure", "impact": 10, "description": "May experience stagnation"})
            suggestions.append("Explore lateral moves or new challenges")

        # Compensation factor (0-20)
        comp_ratio = emp.get("compa_ratio", 1.0)  # salary / market midpoint
        if comp_ratio < 0.85:
            score += 20
            factors.append({"factor": "Below market pay", "impact": 20, "description": f"Compa-ratio: {comp_ratio:.2f}"})
            suggestions.append("Review compensation against market benchmarks")
        elif comp_ratio < 0.95:
            score += 10
            factors.append({"factor": "Slightly below market", "impact": 10, "description": f"Compa-ratio: {comp_ratio:.2f}"})

        # Performance factor (0-20)
        perf_rating = emp.get("performance_rating", 3)
        if perf_rating <= 2:
            score += 15
            factors.append({"factor": "Low performance", "impact": 15, "description": f"Rating: {perf_rating}/5"})
            suggestions.append("Create performance improvement plan with support")
        elif perf_rating >= 4:
            score += 10
            factors.append({"factor": "High performer", "impact": 10, "description": "May seek external opportunities"})
            suggestions.append("Discuss growth path and retention incentives")

        # Manager relationship (0-15)
        manager_changes = emp.get("manager_changes_last_year", 0)
        if manager_changes >= 2:
            score += 15
            factors.append({"factor": "Manager instability", "impact": 15, "description": f"{manager_changes} manager changes"})
            suggestions.append("Ensure stability and proper transition support")

        # Skip level feedback (0-10)
        no_promotion_years = emp.get("years_since_last_promotion", 0)
        if no_promotion_years >= 3:
            score += 15
            factors.append({"factor": "Stagnant growth", "impact": 15, "description": f"No promotion in {no_promotion_years} years"})
            suggestions.append("Create clear promotion path with milestones")

        return min(score, 100), factors, suggestions

    def _engagement_recommendations(self, factors: dict, level: str) -> List[str]:
        """Generate engagement improvement recommendations."""
        recs = []
        if level in ("disengaged", "neutral"):
            if factors.get("attendance", {}).get("score", 0) < 15:
                recs.append("Address attendance patterns with supportive check-in")
            if factors.get("performance", {}).get("score", 0) < 15:
                recs.append("Provide targeted coaching and clear performance goals")
            if factors.get("development", {}).get("score", 0) < 8:
                recs.append("Increase access to training and development opportunities")
            recs.append("Schedule regular 1-on-1s with direct manager")
        elif level == "engaged":
            recs.append("Maintain current engagement through recognition")
            recs.append("Explore stretch assignments to keep growth momentum")
        else:
            recs.append("Leverage as culture champion and mentor for others")
        return recs


prediction_service = PredictionService()
