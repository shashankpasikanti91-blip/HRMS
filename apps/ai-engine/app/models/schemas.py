from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class ChatRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class ChatMessage(BaseModel):
    role: ChatRole
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ChatRequest(BaseModel):
    tenant_id: str
    user_id: str
    session_id: Optional[str] = None
    message: str
    context: Optional[dict] = None


class ChatResponse(BaseModel):
    session_id: str
    message: str
    sources: List[dict] = []
    suggestions: List[str] = []
    confidence: float = 0.0


class ResumeScreenRequest(BaseModel):
    tenant_id: str
    job_id: str
    candidate_id: str
    resume_url: Optional[str] = None
    resume_text: Optional[str] = None
    job_description: Optional[str] = None
    requirements: List[str] = []


class ResumeScreenResponse(BaseModel):
    candidate_id: str
    overall_score: float = Field(ge=0, le=100)
    skill_match: float = Field(ge=0, le=100)
    experience_match: float = Field(ge=0, le=100)
    education_match: float = Field(ge=0, le=100)
    culture_fit_score: Optional[float] = None
    strengths: List[str] = []
    concerns: List[str] = []
    summary: str = ""
    recommended_stage: str = "review"


class AttritionPredictionRequest(BaseModel):
    tenant_id: str
    employee_ids: Optional[List[str]] = None
    department_id: Optional[str] = None


class EmployeeAttritionScore(BaseModel):
    employee_id: str
    risk_score: float = Field(ge=0, le=100)
    risk_level: str  # low, medium, high
    contributing_factors: List[dict] = []
    retention_suggestions: List[str] = []


class AttritionPredictionResponse(BaseModel):
    tenant_id: str
    total_employees: int
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int
    predictions: List[EmployeeAttritionScore]


class DocumentProcessRequest(BaseModel):
    tenant_id: str
    document_url: str
    document_type: str = "general"
    extract_entities: bool = True


class DocumentProcessResponse(BaseModel):
    document_id: str
    text_content: str = ""
    entities: dict = {}
    summary: str = ""
    embedding_stored: bool = False
    page_count: int = 0


class SentimentRequest(BaseModel):
    tenant_id: str
    texts: List[str]
    context: Optional[str] = None


class SentimentResponse(BaseModel):
    results: List[dict]
    overall_sentiment: str
    average_score: float


class SmartSuggestionRequest(BaseModel):
    tenant_id: str
    context_type: str  # job_description, review, policy
    input_text: str
    max_suggestions: int = 5


class SmartSuggestionResponse(BaseModel):
    suggestions: List[str]
    improvements: List[dict] = []
    bias_flags: List[str] = []
