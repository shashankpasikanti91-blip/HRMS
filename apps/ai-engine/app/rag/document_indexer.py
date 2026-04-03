"""
Document indexing pipeline for RAG.
Processes HR documents (policies, handbooks, contracts) into searchable chunks.
"""

import re
import structlog
from typing import Optional

from app.core.config import settings
from app.rag.vector_store import vector_store

logger = structlog.get_logger()


class DocumentIndexer:
    """Indexes HR documents into the vector store for RAG retrieval."""

    def __init__(self):
        self._embedder = None

    async def _get_embedder(self):
        """Lazy-load the embedding model."""
        if self._embedder is not None:
            return self._embedder

        if settings.OPENAI_API_KEY:
            try:
                from openai import AsyncOpenAI
                self._embedder = {"type": "openai", "client": AsyncOpenAI(api_key=settings.OPENAI_API_KEY)}
                return self._embedder
            except Exception:
                pass

        try:
            from sentence_transformers import SentenceTransformer
            model = SentenceTransformer("all-MiniLM-L6-v2")
            self._embedder = {"type": "local", "model": model}
            return self._embedder
        except ImportError:
            logger.warning("no_embedder", message="No embedding model available")
            self._embedder = {"type": "none"}
            return self._embedder

    async def index_document(
        self,
        tenant_id: str,
        document_id: str,
        content: str,
        metadata: Optional[dict] = None,
        chunk_size: int = 500,
        chunk_overlap: int = 50,
    ) -> int:
        """Split document into chunks and index them into the vector store."""
        chunks = self._chunk_text(content, chunk_size, chunk_overlap)
        if not chunks:
            return 0

        documents = []
        for i, chunk in enumerate(chunks):
            doc = {
                "tenant_id": tenant_id,
                "document_id": document_id,
                "chunk_index": i,
                "content": chunk,
                **(metadata or {}),
            }
            documents.append(doc)

        embeddings = await self._embed_texts([d["content"] for d in documents])
        added = await vector_store.add_documents(documents, embeddings)

        logger.info("document_indexed", document_id=document_id, chunks=len(chunks), added=added)
        return added

    async def _embed_texts(self, texts: list[str]) -> list[list[float]]:
        """Generate embeddings for a list of texts."""
        embedder = await self._get_embedder()

        if embedder["type"] == "openai":
            try:
                client = embedder["client"]
                response = await client.embeddings.create(
                    model=settings.OPENAI_EMBEDDING_MODEL,
                    input=texts,
                )
                return [item.embedding for item in response.data]
            except Exception as e:
                logger.error("openai_embedding_error", error=str(e))

        if embedder["type"] == "local":
            model = embedder["model"]
            vectors = model.encode(texts)
            return [v.tolist() for v in vectors]

        # Fallback: zero vectors
        return [[0.0] * settings.EMBEDDING_DIMENSION for _ in texts]

    def _chunk_text(self, text: str, chunk_size: int, overlap: int) -> list[str]:
        """Split text into overlapping chunks by sentence boundaries."""
        text = re.sub(r"\s+", " ", text).strip()
        if not text:
            return []

        sentences = re.split(r"(?<=[.!?])\s+", text)
        chunks = []
        current_chunk = []
        current_length = 0

        for sentence in sentences:
            sentence_len = len(sentence.split())
            if current_length + sentence_len > chunk_size and current_chunk:
                chunks.append(" ".join(current_chunk))
                # Keep overlap
                overlap_words = []
                overlap_len = 0
                for s in reversed(current_chunk):
                    s_len = len(s.split())
                    if overlap_len + s_len > overlap:
                        break
                    overlap_words.insert(0, s)
                    overlap_len += s_len
                current_chunk = overlap_words
                current_length = overlap_len

            current_chunk.append(sentence)
            current_length += sentence_len

        if current_chunk:
            chunks.append(" ".join(current_chunk))

        return chunks

    async def search(self, tenant_id: str, query: str, top_k: int = 5) -> list[dict]:
        """Search indexed documents for a query."""
        embeddings = await self._embed_texts([query])
        results = await vector_store.search(embeddings[0], top_k=top_k * 2)

        # Filter by tenant
        tenant_results = [r for r in results if r.get("tenant_id") == tenant_id]
        return tenant_results[:top_k]


# Singleton
document_indexer = DocumentIndexer()
