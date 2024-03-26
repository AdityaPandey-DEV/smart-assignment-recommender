"""
Contextual Retriever for Educational RAG.
Orchestrates semantic retrieval against the vector store using student knowledge gap signals,
Bloom's taxonomy ladders, and topic prerequisites.
"""

from typing import List, Dict, Any, Optional
import time
from .vector_store import vector_store, SearchResult
from .document_processor import DocumentChunk
from app.student_analytics.models import KnowledgeGap, StudentProfile
from app.core.config import settings

class RetrievedContext:
    def __init__(
        self,
        query: str,
        results: List[SearchResult],
        retrieval_time_ms: float,
        strategy: str = "Semantic MMR"
    ):
        self.query = query
        self.results = results
        self.retrieval_time_ms = round(retrieval_time_ms, 2)
        self.strategy = strategy

    def to_dict(self) -> Dict[str, Any]:
        return {
            "query": self.query,
            "retrieval_time_ms": self.retrieval_time_ms,
            "strategy": self.strategy,
            "chunks_retrieved": len(self.results),
            "citations": [r.to_dict() for r in self.results]
        }

    def format_for_prompt(self) -> str:
        """Formats retrieved chunks into clean markdown context for the LLM generator."""
        if not self.results:
            return "No specific curriculum chunks matched the query."
            
        formatted_blocks = []
        for i, r in enumerate(self.results, 1):
            c = r.chunk
            block = (
                f"### [Reference Source {i}]: {c.doc_title} | Topic: {c.topic_name}\n"
                f"- **Difficulty**: {c.difficulty} | **Bloom's Level**: {c.bloom_level} | **Match Score**: {r.score}\n"
                f"- **Prerequisites**: {', '.join(c.prerequisites) if c.prerequisites else 'None'}\n"
                f"```text\n{c.content}\n```"
            )
            formatted_blocks.append(block)
            
        return "\n\n".join(formatted_blocks)


class ContextualRetriever:
    """
    Retrieves curricular resources matched against student diagnostics.
    """

    @classmethod
    def retrieve_for_gap(
        cls,
        gap: KnowledgeGap,
        top_k: int = 4,
        use_mmr: bool = True
    ) -> RetrievedContext:
        """
        Retrieves context specifically designed to address a diagnosed learning gap.
        """
        start_time = time.perf_counter()
        
        # Primary semantic query targeting core principles and exercises
        query = (
            f"{gap.topic_name} fundamental concepts algorithms implementation patterns "
            f"and exercises targeted at Bloom level {gap.target_bloom_level}"
        )
        
        if use_mmr:
            results = vector_store.mmr_search(
                query=query,
                top_k=top_k,
                diversity_lambda=0.75,
                topic_id=gap.topic_id
            )
        else:
            results = vector_store.similarity_search(
                query=query,
                top_k=top_k,
                topic_id=gap.topic_id
            )

        # Fallback if topic filter returned too few results: search across whole store
        if len(results) < 2:
            broad_results = vector_store.similarity_search(query=query, top_k=top_k)
            # Merge without duplicates
            existing_ids = {r.chunk.chunk_id for r in results}
            for r in broad_results:
                if r.chunk.chunk_id not in existing_ids:
                    results.append(r)
                if len(results) >= top_k:
                    break

        elapsed_ms = (time.perf_counter() - start_time) * 1000
        return RetrievedContext(
            query=query,
            results=results,
            retrieval_time_ms=elapsed_ms,
            strategy="Contextual Gap MMR" if use_mmr else "Cosine Similarity"
        )

    @classmethod
    def retrieve_by_query(
        cls,
        query: str,
        top_k: int = 4,
        topic_id: Optional[str] = None,
        difficulty: Optional[str] = None
    ) -> RetrievedContext:
        start_time = time.perf_counter()
        results = vector_store.similarity_search(
            query=query,
            top_k=top_k,
            topic_id=topic_id,
            difficulty=difficulty
        )
        elapsed_ms = (time.perf_counter() - start_time) * 1000
        return RetrievedContext(
            query=query,
            results=results,
            retrieval_time_ms=elapsed_ms,
            strategy="Direct Semantic Search"
        )
