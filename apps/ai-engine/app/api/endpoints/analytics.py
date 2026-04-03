from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from app.models.schemas import SentimentRequest, SentimentResponse, SmartSuggestionRequest, SmartSuggestionResponse

router = APIRouter()


class BiasCheckRequest(BaseModel):
    tenant_id: str
    text: str
    context_type: str = "job_description"  # job_description, review, policy


@router.post("/sentiment", response_model=SentimentResponse)
async def analyze_sentiment(request: SentimentRequest):
    """Analyze sentiment of text inputs (reviews, feedback, survey responses)."""
    results = []
    total = 0.0

    for text in request.texts:
        # Simple rule-based sentiment (replace with ML model in production)
        score = _basic_sentiment(text)
        label = "positive" if score > 0.3 else "negative" if score < -0.3 else "neutral"
        results.append({"text": text[:200], "score": round(score, 2), "label": label})
        total += score

    avg = total / len(request.texts) if request.texts else 0
    overall = "positive" if avg > 0.2 else "negative" if avg < -0.2 else "neutral"

    return SentimentResponse(results=results, overall_sentiment=overall, average_score=round(avg, 2))


@router.post("/suggestions", response_model=SmartSuggestionResponse)
async def get_suggestions(request: SmartSuggestionRequest):
    """Get AI-powered suggestions for text improvement."""
    suggestions = _generate_text_suggestions(request.input_text, request.context_type, request.max_suggestions)
    improvements = _identify_improvements(request.input_text, request.context_type)
    bias_flags = _check_bias(request.input_text)

    return SmartSuggestionResponse(suggestions=suggestions, improvements=improvements, bias_flags=bias_flags)


@router.post("/bias-check")
async def check_bias(request: BiasCheckRequest):
    """Check text for potential bias in language."""
    flags = _check_bias(request.text)
    return {
        "tenant_id": request.tenant_id,
        "context_type": request.context_type,
        "bias_flags": flags,
        "is_biased": len(flags) > 0,
        "score": max(0, 100 - len(flags) * 15),
    }


def _basic_sentiment(text: str) -> float:
    """Basic sentiment scoring using keyword matching."""
    positive = ["excellent", "great", "outstanding", "good", "amazing", "wonderful", "fantastic",
                "strong", "impressive", "exceptional", "dedicated", "proactive", "innovative"]
    negative = ["poor", "bad", "terrible", "awful", "weak", "lacking", "disappointing",
                "unsatisfactory", "inadequate", "below", "needs improvement", "fails"]

    text_lower = text.lower()
    pos_count = sum(1 for w in positive if w in text_lower)
    neg_count = sum(1 for w in negative if w in text_lower)

    total = pos_count + neg_count
    if total == 0:
        return 0.0
    return (pos_count - neg_count) / total


def _generate_text_suggestions(text: str, context: str, max_suggestions: int) -> List[str]:
    """Generate improvement suggestions for text."""
    suggestions = []
    text_lower = text.lower()

    if context == "job_description":
        if len(text.split()) < 100:
            suggestions.append("Add more detail about responsibilities and requirements")
        if "salary" not in text_lower and "compensation" not in text_lower:
            suggestions.append("Consider including salary range for better candidate attraction")
        if "benefits" not in text_lower:
            suggestions.append("Include benefits and perks information")
        if "remote" not in text_lower and "hybrid" not in text_lower:
            suggestions.append("Specify work location policy (remote/hybrid/onsite)")
        if "growth" not in text_lower and "career" not in text_lower:
            suggestions.append("Mention career growth opportunities")
    elif context == "review":
        if len(text.split()) < 50:
            suggestions.append("Provide more specific examples and feedback")
        suggestions.append("Include both strengths and areas for development")
        suggestions.append("Set measurable goals for the next review period")
    elif context == "policy":
        suggestions.append("Use clear, unambiguous language")
        suggestions.append("Include effective date and scope of applicability")
        suggestions.append("Define key terms used in the policy")

    return suggestions[:max_suggestions]


def _identify_improvements(text: str, context: str) -> List[dict]:
    """Identify specific text improvements."""
    improvements = []

    if len(text.split()) < 30:
        improvements.append({"type": "length", "severity": "high", "message": "Content is too brief"})

    # Check for passive voice overuse
    passive_indicators = ["is being", "was being", "has been", "will be", "are being"]
    passive_count = sum(1 for p in passive_indicators if p in text.lower())
    if passive_count > 2:
        improvements.append({"type": "style", "severity": "medium", "message": "Consider using more active voice"})

    return improvements


def _check_bias(text: str) -> List[str]:
    """Check for biased language in text."""
    flags = []
    text_lower = text.lower()

    # Gender-biased language
    gendered = {"he/him": "they/them", "aggressive": "assertive", "manpower": "workforce",
                "chairman": "chairperson", "mankind": "humankind", "fireman": "firefighter",
                "ninja": "expert", "rockstar": "talented professional"}
    for biased, alternative in gendered.items():
        if biased in text_lower:
            flags.append(f"Consider replacing '{biased}' with '{alternative}'")

    # Age bias
    age_biased = ["young", "energetic", "digital native", "recent graduate only"]
    for term in age_biased:
        if term in text_lower:
            flags.append(f"'{term}' may indicate age bias")

    return flags
