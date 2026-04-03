from fastapi import APIRouter
from app.models.schemas import DocumentProcessRequest, DocumentProcessResponse
from app.services.document_service import document_service

router = APIRouter()


@router.post("/process", response_model=DocumentProcessResponse)
async def process_document(request: DocumentProcessRequest):
    """Process a document: extract text, entities, and generate summary."""
    # In production, would download from document_url first
    # For now, accept text content or URL reference
    result = await document_service.process_document(
        tenant_id=request.tenant_id,
        document_text=request.document_url,  # Simplified: using URL field as text input
        document_type=request.document_type,
        extract_entities=request.extract_entities,
    )
    return DocumentProcessResponse(**result)
