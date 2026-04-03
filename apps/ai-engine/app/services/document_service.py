"""
Document intelligence service: text extraction, entity recognition, summarization, embeddings.
"""

import uuid
import re
from typing import Optional
import structlog

logger = structlog.get_logger()


class DocumentService:
    def __init__(self):
        pass

    async def process_document(
        self,
        tenant_id: str,
        document_text: str,
        document_type: str = "general",
        extract_entities: bool = True,
    ) -> dict:
        """Process a document for text extraction, entity recognition, and summarization."""
        doc_id = str(uuid.uuid4())

        entities = {}
        if extract_entities:
            entities = self._extract_entities(document_text, document_type)

        summary = self._generate_summary(document_text)

        return {
            "document_id": doc_id,
            "text_content": document_text[:5000],  # Truncate for response
            "entities": entities,
            "summary": summary,
            "embedding_stored": False,  # Would be True after storing in vector DB
            "page_count": max(1, len(document_text) // 3000),
            "word_count": len(document_text.split()),
            "document_type": document_type,
        }

    def _extract_entities(self, text: str, doc_type: str) -> dict:
        """Extract named entities from document text."""
        entities = {
            "emails": list(set(re.findall(r'[\w.+-]+@[\w-]+\.[\w.-]+', text))),
            "phones": list(set(re.findall(r'[\+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{7,15}', text))),
            "dates": list(set(re.findall(r'\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b', text))),
            "urls": list(set(re.findall(r'https?://\S+', text))),
        }

        if doc_type == "resume":
            entities["skills"] = self._extract_skills_from_text(text)
            entities["education"] = self._extract_education(text)
            entities["experience_years"] = self._extract_experience_years(text)
        elif doc_type == "contract":
            entities["amounts"] = list(set(re.findall(r'[\$€£]\s?[\d,]+(?:\.\d{2})?', text)))
            entities["durations"] = list(set(re.findall(r'\d+\s*(?:year|month|week|day)s?', text.lower())))
        elif doc_type == "policy":
            entities["sections"] = self._extract_sections(text)

        return entities

    def _extract_skills_from_text(self, text: str) -> list:
        """Extract technical skills from text."""
        known_skills = [
            "python", "javascript", "typescript", "java", "react", "angular", "vue",
            "node.js", "sql", "postgresql", "mongodb", "docker", "kubernetes", "aws",
            "azure", "gcp", "machine learning", "deep learning", "nlp", "rest api",
            "graphql", "git", "ci/cd", "agile", "scrum", "project management",
        ]
        text_lower = text.lower()
        return [skill for skill in known_skills if skill in text_lower]

    def _extract_education(self, text: str) -> list:
        """Extract education qualifications."""
        patterns = [
            r"(?:bachelor|master|phd|doctorate|diploma|associate)(?:'s)?\s+(?:of|in)\s+\w+(?:\s+\w+){0,3}",
            r"(?:B\.?S\.?|M\.?S\.?|B\.?A\.?|M\.?A\.?|MBA|BTech|MTech|BE|ME)\s*(?:in\s+)?\w*",
        ]
        found = []
        for pattern in patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            found.extend(matches)
        return list(set(found))[:5]

    def _extract_experience_years(self, text: str) -> Optional[int]:
        """Extract total years of experience."""
        matches = re.findall(r'(\d+)\+?\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|exp)', text.lower())
        if matches:
            return max(int(m) for m in matches)
        return None

    def _extract_sections(self, text: str) -> list:
        """Extract document section headers."""
        sections = re.findall(r'^(?:\d+\.?\s+)?([A-Z][A-Za-z\s]{3,50})$', text, re.MULTILINE)
        return sections[:20]

    def _generate_summary(self, text: str, max_sentences: int = 5) -> str:
        """Generate an extractive summary using sentence scoring."""
        sentences = re.split(r'[.!?]+', text)
        sentences = [s.strip() for s in sentences if len(s.strip()) > 20]

        if not sentences:
            return text[:500] if text else ""

        # Score sentences by position and word frequency
        words = text.lower().split()
        word_freq = {}
        for w in words:
            if len(w) > 3:
                word_freq[w] = word_freq.get(w, 0) + 1

        scored = []
        for i, sent in enumerate(sentences):
            score = sum(word_freq.get(w.lower(), 0) for w in sent.split() if len(w) > 3)
            # Boost first and last sentences
            if i == 0:
                score *= 1.5
            elif i == len(sentences) - 1:
                score *= 1.2
            scored.append((score, sent))

        scored.sort(key=lambda x: x[0], reverse=True)
        top = scored[:max_sentences]
        # Preserve original order
        top.sort(key=lambda x: sentences.index(x[1]))

        return ". ".join(t[1] for t in top) + "."


document_service = DocumentService()
