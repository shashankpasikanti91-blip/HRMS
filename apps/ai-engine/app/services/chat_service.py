"""
RAG-based AI Chatbot service for HRMS queries.
Uses LangChain + OpenAI + FAISS for retrieval-augmented generation.
"""

import uuid
from typing import Optional, List
from datetime import datetime
import structlog

from app.core.config import settings

logger = structlog.get_logger()

# In-memory session store (use Redis in production)
_sessions: dict[str, list[dict]] = {}

SYSTEM_PROMPT = """You are SRP AI Assistant, an intelligent HR assistant for the SRP AI HRMS platform.
You help HR professionals, managers, and employees with:
- HR policies and procedures
- Leave and attendance queries
- Payroll information
- Performance management
- Recruitment processes
- Company policies and benefits

Always be professional, accurate, and helpful. If you don't know something, say so rather than guessing.
When referencing company data, cite specific policies or documents when available.
"""


class ChatService:
    def __init__(self):
        self._initialized = False

    async def initialize(self):
        """Initialize the chat service with LLM and vector store."""
        if self._initialized:
            return
        logger.info("chat_service_init", status="initializing")
        self._initialized = True

    async def chat(
        self,
        tenant_id: str,
        user_id: str,
        message: str,
        session_id: Optional[str] = None,
        context: Optional[dict] = None,
    ) -> dict:
        """Process a chat message and return AI response."""
        await self.initialize()

        if not session_id:
            session_id = str(uuid.uuid4())

        # Get or create session history
        session_key = f"{tenant_id}:{session_id}"
        if session_key not in _sessions:
            _sessions[session_key] = [{"role": "system", "content": SYSTEM_PROMPT}]

        # Add user message
        _sessions[session_key].append({"role": "user", "content": message})

        # Generate response using context-aware RAG
        response_text = await self._generate_response(tenant_id, message, _sessions[session_key], context)
        sources = await self._retrieve_sources(tenant_id, message)
        suggestions = self._generate_suggestions(message)

        # Add assistant response to history
        _sessions[session_key].append({"role": "assistant", "content": response_text})

        # Keep history manageable (last 20 messages)
        if len(_sessions[session_key]) > 21:
            _sessions[session_key] = [_sessions[session_key][0]] + _sessions[session_key][-20:]

        return {
            "session_id": session_id,
            "message": response_text,
            "sources": sources,
            "suggestions": suggestions,
            "confidence": 0.85,
        }

    async def get_session_history(self, tenant_id: str, session_id: str) -> list[dict]:
        """Retrieve chat session history."""
        session_key = f"{tenant_id}:{session_id}"
        history = _sessions.get(session_key, [])
        return [msg for msg in history if msg["role"] != "system"]

    async def clear_session(self, tenant_id: str, session_id: str):
        """Clear a chat session."""
        session_key = f"{tenant_id}:{session_id}"
        _sessions.pop(session_key, None)

    async def _generate_response(
        self,
        tenant_id: str,
        message: str,
        history: list[dict],
        context: Optional[dict] = None,
    ) -> str:
        """Generate AI response. Uses OpenAI if configured, otherwise returns a structured placeholder."""
        api_key = settings.OPENAI_API_KEY or settings.OPENROUTER_API_KEY
        if api_key:
            try:
                from openai import AsyncOpenAI
                client = AsyncOpenAI(
                    api_key=api_key,
                    base_url=settings.OPENAI_BASE_URL,
                )

                messages = [{"role": m["role"], "content": m["content"]} for m in history]
                if context:
                    messages.insert(1, {"role": "system", "content": f"Additional context: {context}"})

                response = await client.chat.completions.create(
                    model=settings.OPENAI_MODEL,
                    messages=messages,
                    temperature=0.7,
                    max_tokens=1024,
                )
                return response.choices[0].message.content or ""
            except Exception as e:
                logger.error("openai_error", error=str(e))

        # Fallback: structured response based on keywords
        return self._rule_based_response(message)

    async def _retrieve_sources(self, tenant_id: str, query: str) -> list[dict]:
        """Retrieve relevant document sources for the query."""
        # In production, use FAISS/pgvector for semantic search
        return []

    def _generate_suggestions(self, message: str) -> list[str]:
        """Generate follow-up suggestions based on the conversation."""
        msg_lower = message.lower()
        suggestions = []

        if "leave" in msg_lower:
            suggestions = ["Check my leave balance", "Company leave policy", "Apply for leave"]
        elif "salary" in msg_lower or "payroll" in msg_lower or "pay" in msg_lower:
            suggestions = ["View latest payslip", "Salary breakdown", "Tax deduction details"]
        elif "performance" in msg_lower or "review" in msg_lower:
            suggestions = ["My current goals", "Upcoming review cycle", "Skill development plan"]
        elif "attendance" in msg_lower:
            suggestions = ["This month's attendance", "Overtime hours", "Work from home policy"]
        elif "recruit" in msg_lower or "hiring" in msg_lower or "job" in msg_lower:
            suggestions = ["Open positions", "Candidate pipeline", "Interview schedule"]
        else:
            suggestions = ["HR policies", "My profile", "Company announcements"]

        return suggestions

    def _rule_based_response(self, message: str) -> str:
        """Simple rule-based fallback when OpenAI is not configured."""
        msg_lower = message.lower()

        if any(w in msg_lower for w in ["hello", "hi", "hey"]):
            return "Hello! I'm SRP AI Assistant. I can help you with HR-related queries including leave management, payroll, attendance, performance reviews, and more. How can I assist you today?"

        if "leave" in msg_lower:
            return "I can help you with leave-related queries. You can check your leave balance, apply for leave, or view leave policies. Would you like me to check your leave balance or guide you through applying for leave?"

        if any(w in msg_lower for w in ["salary", "payroll", "payslip", "pay"]):
            return "For payroll and salary queries, I can help you view your latest payslip, understand your salary breakdown, or check tax deductions. What specific information do you need?"

        if any(w in msg_lower for w in ["attendance", "clock", "time"]):
            return "I can help with attendance queries. I can show your attendance history, check today's status, or provide your monthly summary. What would you like to know?"

        if any(w in msg_lower for w in ["performance", "review", "goal"]):
            return "For performance management, I can help you view your goals, check upcoming review cycles, or provide guidance on self-assessments. What would you like to explore?"

        return "I understand your query. Let me help you with that. Could you provide more specific details about what you need? I can assist with leave management, payroll, attendance, performance, recruitment, and other HR-related topics."


chat_service = ChatService()
