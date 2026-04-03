"""
HR Processing Agent — autonomous agent for complex HR workflows.
Uses LangChain agents with tool-calling to handle multi-step HR tasks.
"""

import structlog
from typing import Optional

from app.core.config import settings

logger = structlog.get_logger()


class HRAgent:
    """LangChain-based agent for autonomous HR task execution."""

    AVAILABLE_TASKS = [
        "onboarding_checklist",
        "offboarding_checklist",
        "policy_compliance_check",
        "compensation_benchmark",
        "interview_question_generator",
        "job_description_writer",
        "performance_review_draft",
    ]

    def __init__(self):
        self._agent = None

    async def initialize(self):
        """Initialize the LangChain agent with tools."""
        if self._agent is not None:
            return

        if not settings.OPENAI_API_KEY:
            logger.info("hr_agent_init", status="no_api_key, using rule-based mode")
            return

        try:
            from langchain_openai import ChatOpenAI
            self._llm = ChatOpenAI(
                model=settings.OPENAI_MODEL,
                api_key=settings.OPENAI_API_KEY,
                temperature=0.3,
            )
            logger.info("hr_agent_init", status="ready")
        except ImportError:
            logger.warning("hr_agent_init", status="langchain not available")

    async def execute_task(self, task_type: str, context: dict) -> dict:
        """Execute an HR automation task."""
        await self.initialize()

        if task_type not in self.AVAILABLE_TASKS:
            return {"error": f"Unknown task: {task_type}", "available": self.AVAILABLE_TASKS}

        handler = getattr(self, f"_task_{task_type}", None)
        if handler:
            return await handler(context)

        return {"error": f"Task handler not implemented: {task_type}"}

    async def _task_onboarding_checklist(self, context: dict) -> dict:
        """Generate a personalized onboarding checklist."""
        department = context.get("department", "General")
        role = context.get("role", "Employee")
        start_date = context.get("start_date", "TBD")

        checklist = {
            "pre_day_one": [
                {"task": "Send welcome email with start date, time, and location", "owner": "HR"},
                {"task": "Prepare workstation and equipment", "owner": "IT"},
                {"task": f"Set up {department} team access and permissions", "owner": "IT"},
                {"task": "Prepare onboarding documents package", "owner": "HR"},
                {"task": "Assign buddy/mentor from the team", "owner": "Manager"},
            ],
            "day_one": [
                {"task": "Welcome meeting and office tour", "owner": "HR"},
                {"task": "Complete I-9 and tax forms", "owner": "HR"},
                {"task": "IT setup: email, Slack, VPN, tools access", "owner": "IT"},
                {"task": "Team introduction meeting", "owner": "Manager"},
                {"task": "Review company handbook and policies", "owner": "HR"},
            ],
            "first_week": [
                {"task": f"Department-specific training for {role}", "owner": "Manager"},
                {"task": "Set up 1:1 recurring meetings", "owner": "Manager"},
                {"task": "Benefits enrollment walkthrough", "owner": "HR"},
                {"task": "Security and compliance training", "owner": "HR"},
                {"task": "Initial project assignment and goals", "owner": "Manager"},
            ],
            "first_month": [
                {"task": "30-day check-in meeting", "owner": "Manager"},
                {"task": "Feedback collection from new hire", "owner": "HR"},
                {"task": "Performance expectations review", "owner": "Manager"},
                {"task": "Professional development plan discussion", "owner": "Manager"},
            ],
        }

        return {
            "task_type": "onboarding_checklist",
            "employee_role": role,
            "department": department,
            "start_date": start_date,
            "checklist": checklist,
            "total_tasks": sum(len(v) for v in checklist.values()),
        }

    async def _task_offboarding_checklist(self, context: dict) -> dict:
        """Generate an offboarding checklist."""
        return {
            "task_type": "offboarding_checklist",
            "checklist": {
                "immediate": [
                    {"task": "Conduct exit interview", "owner": "HR"},
                    {"task": "Collect resignation letter/documentation", "owner": "HR"},
                    {"task": "Notify payroll of final date", "owner": "HR"},
                ],
                "last_week": [
                    {"task": "Knowledge transfer sessions", "owner": "Manager"},
                    {"task": "Return company equipment", "owner": "IT"},
                    {"task": "Revoke system access and credentials", "owner": "IT"},
                    {"task": "Process final paycheck and benefits", "owner": "Payroll"},
                    {"task": "Farewell announcement", "owner": "Manager"},
                ],
                "post_departure": [
                    {"task": "Send experience letter", "owner": "HR"},
                    {"task": "Process full and final settlement", "owner": "Payroll"},
                    {"task": "Archive employee records", "owner": "HR"},
                ],
            },
        }

    async def _task_job_description_writer(self, context: dict) -> dict:
        """Generate a job description draft."""
        title = context.get("title", "Software Engineer")
        department = context.get("department", "Engineering")
        level = context.get("level", "Mid")
        skills = context.get("skills", [])

        return {
            "task_type": "job_description_writer",
            "draft": {
                "title": title,
                "department": department,
                "level": level,
                "summary": f"We are looking for a {level}-level {title} to join our {department} team.",
                "responsibilities": [
                    f"Design and implement solutions for the {department} team",
                    "Collaborate with cross-functional teams on projects",
                    "Participate in code reviews and technical discussions",
                    "Mentor junior team members",
                    "Contribute to architecture and design decisions",
                ],
                "requirements": [
                    f"Experience with {', '.join(skills[:3]) if skills else 'relevant technologies'}",
                    f"{'3-5' if level == 'Mid' else '5-8' if level == 'Senior' else '1-3'} years of experience",
                    "Strong problem-solving and communication skills",
                    "Bachelor's degree in related field or equivalent experience",
                ],
                "nice_to_have": [
                    f"Experience with {', '.join(skills[3:]) if len(skills) > 3 else 'related technologies'}",
                    "Open source contributions",
                    "Relevant certifications",
                ],
            },
        }

    async def _task_interview_question_generator(self, context: dict) -> dict:
        """Generate interview questions based on role and skills."""
        role = context.get("role", "Software Engineer")
        skills = context.get("skills", [])
        level = context.get("level", "Mid")

        questions = {
            "technical": [
                f"Describe your experience with {skills[0] if skills else 'your primary technology stack'}.",
                "Walk me through a complex technical problem you solved recently.",
                "How do you approach debugging a production issue?",
                "Describe your experience with system design and architecture.",
            ],
            "behavioral": [
                "Tell me about a time you disagreed with a team decision. How did you handle it?",
                "Describe a project where you had to learn a new technology quickly.",
                "How do you prioritize tasks when you have multiple deadlines?",
                "Tell me about a time you received constructive feedback and how you acted on it.",
            ],
            "situational": [
                f"As a {level} {role}, how would you handle a critical production outage?",
                "If you noticed a colleague struggling with their workload, what would you do?",
                "How would you approach mentoring a new team member?",
            ],
        }

        return {"task_type": "interview_question_generator", "role": role, "level": level, "questions": questions}

    async def _task_performance_review_draft(self, context: dict) -> dict:
        """Generate a performance review draft template."""
        name = context.get("employee_name", "Employee")
        period = context.get("review_period", "Q4 2024")
        goals_met = context.get("goals_met", 0)
        goals_total = context.get("goals_total", 0)

        return {
            "task_type": "performance_review_draft",
            "template": {
                "employee": name,
                "period": period,
                "goal_completion": f"{goals_met}/{goals_total}" if goals_total else "N/A",
                "sections": {
                    "achievements": "[List key accomplishments during the review period]",
                    "strengths": "[Highlight employee's key strengths observed]",
                    "areas_for_improvement": "[Constructive feedback on areas to develop]",
                    "goals_next_period": "[Suggested goals for next review period]",
                    "overall_rating": "[Rating on scale: Exceptional / Exceeds Expectations / Meets Expectations / Needs Improvement]",
                    "manager_comments": "[Additional comments and development recommendations]",
                },
            },
        }

    async def _task_policy_compliance_check(self, context: dict) -> dict:
        """Check content against common HR policy compliance rules."""
        text = context.get("text", "")
        policy_type = context.get("policy_type", "general")

        issues = []
        text_lower = text.lower()

        # Check for discriminatory language
        discriminatory = ["race", "religion", "gender", "age", "disability", "sexual orientation"]
        for term in discriminatory:
            if term in text_lower and "non-discrimination" not in text_lower:
                issues.append({"severity": "high", "issue": f"Contains reference to '{term}' — ensure non-discriminatory context"})

        # Check for mandatory clauses
        if policy_type == "employment":
            required = ["at-will", "equal opportunity", "non-discrimination"]
            for clause in required:
                if clause not in text_lower:
                    issues.append({"severity": "medium", "issue": f"Missing '{clause}' clause"})

        return {
            "task_type": "policy_compliance_check",
            "issues_found": len(issues),
            "issues": issues,
            "compliant": len(issues) == 0,
        }

    async def _task_compensation_benchmark(self, context: dict) -> dict:
        """Provide compensation benchmark guidance."""
        role = context.get("role", "Software Engineer")
        level = context.get("level", "Mid")
        location = context.get("location", "US")

        return {
            "task_type": "compensation_benchmark",
            "note": "These are illustrative ranges. Use actual market data for decisions.",
            "role": role,
            "level": level,
            "location": location,
            "guidance": [
                "Review salary surveys (Radford, Mercer, Glassdoor)",
                "Consider total compensation (base + equity + bonus)",
                "Factor in cost of living for the location",
                "Benchmark against industry peers of similar size",
                "Review internal pay equity before finalizing",
            ],
        }


# Singleton
hr_agent = HRAgent()
