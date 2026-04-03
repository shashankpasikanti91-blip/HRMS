"""
AI-powered resume screening and candidate scoring service.
"""

import re
from typing import List, Optional
import structlog

logger = structlog.get_logger()

# Common skill sets per category
SKILL_CATEGORIES = {
    "programming": ["python", "javascript", "typescript", "java", "c++", "c#", "go", "rust", "ruby", "php", "swift", "kotlin"],
    "web": ["react", "angular", "vue", "nextjs", "nodejs", "express", "django", "flask", "fastapi", "spring"],
    "data": ["sql", "postgresql", "mongodb", "redis", "elasticsearch", "kafka", "spark", "hadoop"],
    "cloud": ["aws", "azure", "gcp", "docker", "kubernetes", "terraform", "ci/cd", "jenkins"],
    "ml": ["machine learning", "deep learning", "nlp", "computer vision", "tensorflow", "pytorch", "scikit-learn"],
    "soft_skills": ["leadership", "communication", "teamwork", "problem solving", "project management", "agile", "scrum"],
}


class ResumeScreeningService:
    def __init__(self):
        pass

    async def screen_resume(
        self,
        resume_text: str,
        job_description: str,
        requirements: List[str],
    ) -> dict:
        """Screen a resume against a job description and requirements."""
        if not resume_text:
            return self._empty_response()

        resume_lower = resume_text.lower()
        jd_lower = job_description.lower() if job_description else ""

        # Extract skills from resume and JD
        resume_skills = self._extract_skills(resume_lower)
        jd_skills = self._extract_skills(jd_lower)
        required_skills = [r.lower().strip() for r in requirements] if requirements else []

        # Calculate scores
        skill_match = self._calculate_skill_match(resume_skills, jd_skills, required_skills)
        experience_match = self._calculate_experience_score(resume_lower, jd_lower)
        education_match = self._calculate_education_score(resume_lower, jd_lower)

        # Overall weighted score
        overall_score = (skill_match * 0.45) + (experience_match * 0.35) + (education_match * 0.20)

        # Strengths and concerns
        strengths = self._identify_strengths(resume_skills, jd_skills, required_skills, resume_lower)
        concerns = self._identify_concerns(resume_skills, jd_skills, required_skills, resume_lower)

        # Recommended stage
        if overall_score >= 75:
            recommended_stage = "shortlisted"
        elif overall_score >= 50:
            recommended_stage = "review"
        else:
            recommended_stage = "rejected"

        # Summary
        summary = self._generate_summary(overall_score, skill_match, experience_match, strengths, concerns)

        return {
            "overall_score": round(overall_score, 1),
            "skill_match": round(skill_match, 1),
            "experience_match": round(experience_match, 1),
            "education_match": round(education_match, 1),
            "strengths": strengths,
            "concerns": concerns,
            "summary": summary,
            "recommended_stage": recommended_stage,
            "skills_found": list(resume_skills),
            "skills_required": required_skills,
            "skills_matched": list(resume_skills & (jd_skills | set(required_skills))),
            "skills_missing": list((jd_skills | set(required_skills)) - resume_skills),
        }

    async def batch_screen(
        self,
        resumes: List[dict],
        job_description: str,
        requirements: List[str],
    ) -> List[dict]:
        """Screen multiple resumes and rank them."""
        results = []
        for resume_data in resumes:
            result = await self.screen_resume(
                resume_text=resume_data.get("text", ""),
                job_description=job_description,
                requirements=requirements,
            )
            result["candidate_id"] = resume_data.get("candidate_id", "")
            results.append(result)

        # Sort by overall score descending
        results.sort(key=lambda x: x["overall_score"], reverse=True)
        return results

    def _extract_skills(self, text: str) -> set:
        """Extract skills from text using keyword matching."""
        found = set()
        for category, skills in SKILL_CATEGORIES.items():
            for skill in skills:
                if skill in text:
                    found.add(skill)
        return found

    def _calculate_skill_match(self, resume_skills: set, jd_skills: set, requirements: List[str]) -> float:
        """Calculate skill match percentage."""
        all_required = jd_skills | set(requirements)
        if not all_required:
            return 50.0  # neutral if no requirements specified
        matched = resume_skills & all_required
        return min(100, (len(matched) / max(len(all_required), 1)) * 100)

    def _calculate_experience_score(self, resume: str, jd: str) -> float:
        """Calculate experience score based on years and relevance."""
        # Extract years of experience from resume
        year_patterns = re.findall(r'(\d+)\+?\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|exp)?', resume)
        max_years = max([int(y) for y in year_patterns], default=0)

        # Extract required years from JD
        jd_years = re.findall(r'(\d+)\+?\s*(?:years?|yrs?)', jd)
        required_years = max([int(y) for y in jd_years], default=0)

        if required_years == 0:
            return min(100, 50 + max_years * 5)

        if max_years >= required_years:
            return min(100, 70 + (max_years - required_years) * 5)
        else:
            return max(0, 70 - (required_years - max_years) * 15)

    def _calculate_education_score(self, resume: str, jd: str) -> float:
        """Calculate education match score."""
        education_levels = {
            "phd": 100, "doctorate": 100,
            "master": 85, "mba": 85, "ms ": 85, "m.s.": 85, "mtech": 85,
            "bachelor": 70, "b.tech": 70, "bsc": 70, "b.s.": 70, "beng": 70,
            "diploma": 50, "associate": 50, "certification": 45,
        }

        resume_level = 30  # default
        for keyword, score in education_levels.items():
            if keyword in resume:
                resume_level = max(resume_level, score)

        return resume_level

    def _identify_strengths(self, resume_skills: set, jd_skills: set, requirements: List[str], resume: str) -> List[str]:
        """Identify candidate strengths."""
        strengths = []
        matched = resume_skills & (jd_skills | set(requirements))
        if len(matched) >= 3:
            strengths.append(f"Strong skill match ({len(matched)} key skills found)")
        if any(w in resume for w in ["led", "managed", "directed", "architected"]):
            strengths.append("Demonstrates leadership experience")
        if any(w in resume for w in ["award", "recognition", "patent", "publication"]):
            strengths.append("Notable achievements or recognition")
        if len(resume_skills) > 10:
            strengths.append("Broad technical skill set")
        return strengths[:5]

    def _identify_concerns(self, resume_skills: set, jd_skills: set, requirements: List[str], resume: str) -> List[str]:
        """Identify potential concerns."""
        concerns = []
        missing = (jd_skills | set(requirements)) - resume_skills
        if len(missing) > 3:
            concerns.append(f"Missing {len(missing)} required skills")
        if len(resume.split()) < 100:
            concerns.append("Resume appears too brief")
        return concerns[:5]

    def _generate_summary(self, overall: float, skill: float, exp: float, strengths: list, concerns: list) -> str:
        """Generate a natural language summary."""
        if overall >= 80:
            quality = "excellent"
        elif overall >= 60:
            quality = "good"
        elif overall >= 40:
            quality = "moderate"
        else:
            quality = "below expectations"

        summary = f"Overall assessment: {quality} match (score: {overall:.0f}/100). "
        summary += f"Skill alignment: {skill:.0f}%, experience relevance: {exp:.0f}%. "

        if strengths:
            summary += f"Key strengths include: {strengths[0].lower()}. "
        if concerns:
            summary += f"Areas of concern: {concerns[0].lower()}."

        return summary

    def _empty_response(self) -> dict:
        return {
            "overall_score": 0,
            "skill_match": 0,
            "experience_match": 0,
            "education_match": 0,
            "strengths": [],
            "concerns": ["No resume text provided"],
            "summary": "Unable to screen: no resume content available.",
            "recommended_stage": "review",
        }


resume_service = ResumeScreeningService()
