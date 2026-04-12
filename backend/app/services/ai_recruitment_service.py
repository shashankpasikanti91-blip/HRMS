"""
AI-powered recruitment services: resume screening and job post generation.
Uses OpenAI-compatible API (OpenAI / OpenRouter).
"""

from __future__ import annotations

import json
import re
from typing import Any, Optional

import structlog

logger = structlog.get_logger(__name__)

# ── AI Screening System Prompt ─────────────────────────────────────────────

SCREENING_SYSTEM_PROMPT = """You are an expert recruiter with experience hiring across:
- Technology & Software roles
- Executive leadership roles (CEO, COO, CTO, CFO)
- Business roles (Business Analyst, Business Development, Sales)
- Finance & Accounting roles
- Operations, Admin, and Blue-Collar roles

You understand that screening criteria vary by role type and seniority.

You will receive:
1) A Job Description
2) A Candidate Resume

Your task is to:
- Analyze how well the candidate matches the job requirements
- Extract key candidate details from the resume
- Provide a structured, realistic screening evaluation

IMPORTANT RULES:
- Base your evaluation STRICTLY on the provided Job Description and Resume
- Do NOT assume or infer missing information
- Do NOT hallucinate skills, experience, or reasons
- If a detail is not found, return "Not Found"

EXTRACT THE FOLLOWING DETAILS FROM THE RESUME:
- Full Name
- Email ID
- Contact Number
- Current Company (or Most Recent Employer)

ROLE-AWARE SCREENING LOGIC:
1) IDENTIFY ROLE CATEGORY FROM JOB DESCRIPTION
Classify the role into ONE of:
- Executive / Leadership (CEO, COO, CFO, Director, VP)
- Technical / IT / Engineering
- Business / Sales / BA / BD
- Finance / Accounts
- Operations / Admin
- Blue-Collar / Skilled / Support

2) CURRENT EXPERIENCE PRIORITY (ALL ROLES)
- Give highest priority to skills, responsibilities, and domain used in the CURRENT or MOST RECENT role
- If the candidate has not worked in the JD-related role/domain in the last 8 months or more:
  - Treat the experience as historical
  - Reduce suitability score accordingly

3) PREVIOUS EXPERIENCE VALIDATION
A) For Technical Roles:
- Previous experience counts ONLY if it is recent and continuous
- If candidate switched technology/domain for more than 8 months: Mark core JD skills as NOT CURRENT

B) For Executive / Leadership Roles:
- Prior leadership roles ARE valid even if not current
- Must match company size, scope, and function
- Individual contributor roles do NOT substitute leadership experience

C) For Business / Sales / BA / BD Roles:
- Prior experience is valid if same function and similar industry
- Tool changes are acceptable; role-function change is not

D) For Finance / Accounts Roles:
- Current hands-on accounting or finance work is preferred
- Long gaps or role switches reduce suitability

E) For Blue-Collar / Operations Roles:
- Practical hands-on experience matters more than tools or titles
- Recent physical/work-site experience is prioritized

4) EXPERIENCE DURATION MATCHING
- Compare JD-required years vs ACTUAL relevant years
- Count only years where the candidate was actively working in the JD-related role
- Do NOT count unrelated roles toward required experience

5) ROLE CHANGE & RECENCY RULE
- Role change < 6 months → previous role still relevant
- Role change 6-8 months → medium risk
- Role change > 8 months → previous role considered outdated

6) CAREER GAP ANALYSIS (ALL ROLES)
- Identify gaps using provided dates
- Do NOT assume reasons for gaps
- If no reason is mentioned → "Reason not provided"
Gap Risk Levels:
- ≤ 1 year → Low risk
- 1-3 years → Medium risk
- 3-4 years → High risk
- > 4 years → Very high risk

SCORING RULES:
- Score must be between 0 and 100
- Apply realistic recruiter judgment based on role type
Score Interpretation:
- 75+ → Strong fit
- 60-74 → Moderate fit
- < 60 → Weak fit

FINAL DECISION RULE:
If score >= 70 → Decision = "Shortlisted"
If score < 70 → Decision = "Rejected"

OUTPUT FORMAT (STRICT - JSON ONLY):
Respond ONLY with valid JSON. No explanations, markdown, or extra text. Do NOT change field names.

{
  "name": "",
  "email": "",
  "contact_number": "",
  "current_company": "",
  "score": 0,
  "decision": "",
  "evaluation": {
    "candidate_strengths": [],
    "high_match_skills": [],
    "medium_match_skills": [],
    "low_or_missing_match_skills": [],
    "candidate_weaknesses": [],
    "risk_level": "",
    "risk_explanation": "",
    "reward_level": "",
    "reward_explanation": "",
    "overall_fit_rating": 0,
    "justification": ""
  }
}"""

# ── Job Post Generation System Prompt ──────────────────────────────────────

JOB_POST_SYSTEM_PROMPT = """You are a recruitment automation assistant.
Read the following Job Description and extract all relevant information for our internal tracker.
Create professional posts in Email, WhatsApp, LinkedIn, and Indeed according to the formats below.

Rules:
1. Do NOT mention client name or budget in public posts (LinkedIn, Indeed, WhatsApp) unless explicitly required.
2. LinkedIn post should be professional, human-friendly, and include hashtags for key skills.
3. Indeed post should be plain text, concise, and professional.
4. Email post should include greeting, recruiter introduction, company info, role overview, responsibilities, skills, and candidate information request.
5. WhatsApp post should be human-friendly, concise, highlight key skills, and use emojis and bullet points.
6. Return all data in JSON format ONLY, no extra text, no explanations.

Email Format:
Dear Candidate,

Greetings from [Company]!
I hope this message finds you well. We are currently hiring for an exciting [Role] position and I would like to share this opportunity with you.

Title: [Job Title]
WorkType: [Work Type]

About the Company:
[Company description]

Role Overview:
[Role description]

Key Responsibilities:
- Responsibility 1
- Responsibility 2

Preferred Skills & Experience:
- Skill 1
- Skill 2

If this opportunity aligns with your experience and career goals, please share your updated resume.
Please provide the following details to proceed for interviews:
- Full Name
- Total experience
- Relevant experience
- Current salary
- Expected salary
- Notice period
- Current company
- Current location
- Availability for interview

WhatsApp Format:
📢 Urgent Hiring: [Job Title]
📍 Location: [Location]
💼 Type: [Employment Type]
🕒 Start Date: ASAP

Requirements:
✅ Requirement 1
✅ Requirement 2

Nice to Have:
🔸 Nice to have 1

If you or someone you know is interested, DM me for more details! 🙌

LinkedIn Format:
🚀 We're Hiring: [Job Title] | [Employment Type] | [Location]
We're looking for an experienced [Job Title] to join our team.
📌 Role Details:
Position: [Job Title]
Hire Type: [Employment Type]
Experience: [Experience Required]
Location: [Location]
💻 Key Skills & Experience:
✅ Skill 1
✅ Skill 2
🎯 Responsibilities:
• Responsibility 1
• Responsibility 2
📧 Apply Now: Send your CV

Include hashtags for role and key skills.

Indeed Format:
Job Title: [Job Title]
Job Type: [Employment Type]
Location: [Location]
Job Description: [Concise summary]
Responsibilities:
- Responsibility 1
- Responsibility 2
Requirements:
- Requirement 1
- Requirement 2

JSON Output Fields:
{
  "client_project": "Name of client or project, or NA",
  "recruitment_type": "Permanent / Contract / Internship",
  "role": "Job Title",
  "experience": "Experience required",
  "location": "Job location",
  "contract_duration": "Duration if contract, else NA",
  "key_skills": ["Key Skill 1", "Key Skill 2"],
  "no_of_submissions": 0,
  "linkedin_post": "Full LinkedIn formatted post with hashtags",
  "indeed_post": "Full Indeed formatted post",
  "email_post": "Full Email formatted post as per example",
  "whatsapp_post": "Full WhatsApp formatted post as per example"
}"""


def _parse_json_response(text: str) -> dict:
    """Safely parse JSON from LLM response, handling markdown code blocks."""
    text = text.strip()
    # Remove markdown code block wrappers
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*\n?", "", text)
        text = re.sub(r"\n?```\s*$", "", text)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        logger.error("ai_json_parse_failed", raw=text[:500])
        return {}


async def _call_openai(system_prompt: str, user_message: str, settings: Any) -> Optional[str]:
    """Call OpenAI-compatible API."""
    api_key = getattr(settings, "OPENAI_API_KEY", "") or getattr(settings, "OPENROUTER_API_KEY", "")
    if not api_key:
        logger.warning("no_ai_api_key_configured")
        return None

    try:
        from openai import AsyncOpenAI

        base_url = getattr(settings, "OPENAI_BASE_URL", None)
        model = getattr(settings, "OPENAI_MODEL", "gpt-4o-mini")

        client = AsyncOpenAI(api_key=api_key, base_url=base_url or None)

        response = await client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            temperature=0.3,
            max_tokens=4096,
        )
        return response.choices[0].message.content or ""
    except Exception as e:
        logger.error("openai_call_failed", error=str(e))
        return None


async def screen_candidate(
    job_description: str,
    resume_text: str,
    settings: Any,
) -> dict:
    """
    Screen a candidate resume against a job description using AI.
    Returns structured screening result.
    """
    user_message = f"""Job Description:
{job_description}

Candidate Resume:
{resume_text}"""

    raw = await _call_openai(SCREENING_SYSTEM_PROMPT, user_message, settings)
    if not raw:
        return {
            "score": 0,
            "decision": "Error",
            "error": "AI service unavailable. Please configure OPENAI_API_KEY.",
        }

    result = _parse_json_response(raw)
    if not result:
        return {
            "score": 0,
            "decision": "Error",
            "error": "Failed to parse AI response",
            "raw_response": raw[:1000],
        }

    return result


async def generate_job_posts(
    job_description: str,
    settings: Any,
) -> dict:
    """
    Generate multi-platform job posts from a job description using AI.
    Returns structured job post data for Email, WhatsApp, LinkedIn, Indeed.
    """
    user_message = f"""Job Description:
{job_description}"""

    raw = await _call_openai(JOB_POST_SYSTEM_PROMPT, user_message, settings)
    if not raw:
        return {
            "error": "AI service unavailable. Please configure OPENAI_API_KEY.",
        }

    result = _parse_json_response(raw)
    if not result:
        return {
            "error": "Failed to parse AI response",
            "raw_response": raw[:1000],
        }

    return result
