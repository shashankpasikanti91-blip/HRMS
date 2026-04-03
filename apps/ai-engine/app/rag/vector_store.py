"""
Vector store management using FAISS and pgvector.
Supports document embedding, indexing, and semantic search for RAG pipeline.
"""

import os
import numpy as np
import structlog
from typing import Optional

from app.core.config import settings

logger = structlog.get_logger()


class VectorStore:
    """Manages FAISS index for fast similarity search of HR documents."""

    def __init__(self):
        self._index = None
        self._documents: list[dict] = []
        self._initialized = False

    async def initialize(self):
        """Initialize the vector store, loading existing index if available."""
        if self._initialized:
            return

        try:
            import faiss

            index_path = os.path.join(settings.VECTOR_STORE_PATH, "faiss.index")
            if os.path.exists(index_path):
                self._index = faiss.read_index(index_path)
                logger.info("vector_store_loaded", path=index_path, vectors=self._index.ntotal)
            else:
                self._index = faiss.IndexFlatL2(settings.EMBEDDING_DIMENSION)
                logger.info("vector_store_created", dimension=settings.EMBEDDING_DIMENSION)

            self._initialized = True
        except ImportError:
            logger.warning("faiss_not_available", message="FAISS not installed, using in-memory fallback")
            self._index = None
            self._initialized = True

    async def add_documents(self, documents: list[dict], embeddings: list[list[float]]) -> int:
        """Add documents with their embeddings to the vector store."""
        await self.initialize()

        if self._index is None:
            # Fallback: store in memory without FAISS
            for doc, emb in zip(documents, embeddings):
                self._documents.append({**doc, "_embedding": emb})
            return len(documents)

        vectors = np.array(embeddings, dtype=np.float32)
        start_id = self._index.ntotal
        self._index.add(vectors)

        for i, doc in enumerate(documents):
            self._documents.append({**doc, "_id": start_id + i})

        logger.info("documents_added", count=len(documents), total=self._index.ntotal)
        return len(documents)

    async def search(self, query_embedding: list[float], top_k: int = 5) -> list[dict]:
        """Search for similar documents using the query embedding."""
        await self.initialize()

        if self._index is None or self._index.ntotal == 0:
            return []

        query = np.array([query_embedding], dtype=np.float32)
        distances, indices = self._index.search(query, min(top_k, self._index.ntotal))

        results = []
        for dist, idx in zip(distances[0], indices[0]):
            if idx < len(self._documents) and idx >= 0:
                doc = self._documents[idx].copy()
                doc.pop("_embedding", None)
                doc["_score"] = float(1.0 / (1.0 + dist))
                results.append(doc)

        return results

    async def save(self):
        """Persist the FAISS index to disk."""
        if self._index is None:
            return

        try:
            import faiss

            os.makedirs(settings.VECTOR_STORE_PATH, exist_ok=True)
            index_path = os.path.join(settings.VECTOR_STORE_PATH, "faiss.index")
            faiss.write_index(self._index, index_path)
            logger.info("vector_store_saved", path=index_path, vectors=self._index.ntotal)
        except Exception as e:
            logger.error("vector_store_save_error", error=str(e))

    async def delete_by_tenant(self, tenant_id: str):
        """Remove all documents for a given tenant. Rebuilds the index."""
        remaining = [d for d in self._documents if d.get("tenant_id") != tenant_id]
        if len(remaining) == len(self._documents):
            return

        await self._rebuild_index(remaining)
        logger.info("tenant_documents_deleted", tenant_id=tenant_id)

    async def _rebuild_index(self, documents: list[dict]):
        """Rebuild FAISS index from scratch with given documents."""
        try:
            import faiss

            self._index = faiss.IndexFlatL2(settings.EMBEDDING_DIMENSION)

            if documents:
                embeddings = [d.pop("_embedding", [0.0] * settings.EMBEDDING_DIMENSION) for d in documents]
                vectors = np.array(embeddings, dtype=np.float32)
                self._index.add(vectors)

                # Re-add embeddings back
                for doc, emb in zip(documents, embeddings):
                    doc["_embedding"] = emb

            self._documents = documents
        except ImportError:
            self._documents = documents

    @property
    def total_documents(self) -> int:
        if self._index is not None:
            return self._index.ntotal
        return len(self._documents)


# Singleton
vector_store = VectorStore()
