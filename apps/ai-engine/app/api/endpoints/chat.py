from fastapi import APIRouter
from app.models.schemas import ChatRequest, ChatResponse
from app.services.chat_service import chat_service

router = APIRouter()


@router.post("/message", response_model=ChatResponse)
async def send_message(request: ChatRequest):
    """Send a message to the AI assistant and get a response."""
    result = await chat_service.chat(
        tenant_id=request.tenant_id,
        user_id=request.user_id,
        message=request.message,
        session_id=request.session_id,
        context=request.context,
    )
    return ChatResponse(**result)


@router.get("/history/{tenant_id}/{session_id}")
async def get_chat_history(tenant_id: str, session_id: str):
    """Get chat session history."""
    history = await chat_service.get_session_history(tenant_id, session_id)
    return {"session_id": session_id, "messages": history}


@router.delete("/session/{tenant_id}/{session_id}")
async def clear_session(tenant_id: str, session_id: str):
    """Clear a chat session."""
    await chat_service.clear_session(tenant_id, session_id)
    return {"message": "Session cleared"}
