from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
import structlog

logger = structlog.get_logger()


class AIEngineException(HTTPException):
    def __init__(self, status_code: int = 500, detail: str = "AI Engine error"):
        super().__init__(status_code=status_code, detail=detail)


class ModelNotFoundError(AIEngineException):
    def __init__(self, model_name: str):
        super().__init__(status_code=404, detail=f"Model not found: {model_name}")


class InsufficientDataError(AIEngineException):
    def __init__(self, detail: str = "Insufficient data for analysis"):
        super().__init__(status_code=422, detail=detail)


async def ai_exception_handler(request: Request, exc: AIEngineException):
    logger.error("ai_engine_error", status_code=exc.status_code, detail=exc.detail, path=request.url.path)
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "error": exc.detail, "path": request.url.path},
    )
