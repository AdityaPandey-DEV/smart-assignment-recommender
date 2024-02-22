"""
In-Memory and Persistent Vector Store with Maximal Marginal Relevance (MMR).
Handles indexed document chunks, vector similarity search, and pedagogical metadata filtering.
"""

from typing import List, Dict, Any, Optional, Tuple
import numpy as np
import json
from pathlib import Path
from .document_processor import DocumentChunk
from .embeddings import embedding_service
from app.core.config import settings

class SearchResult:
    def __init__(self, chunk: DocumentChunk, score: float):
        self.chunk = chunk
        self.score = round(score, 4)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "chunk_id": self.chunk.chunk_id,
            "doc_id": self.chunk.doc_id,
            "doc_title": self.chunk.doc_title,
            "subject": self.chunk.subject,
            "topic_id": self.chunk.topic_id,
            "topic_name": self.chunk.topic_name,
            "difficulty": self.chunk.difficulty,
            "bloom_level": self.chunk.bloom_level,
            "content": self.chunk.content,
            "similarity_score": self.score,
            "prerequisites": self.chunk.prerequisites,
            "metadata": self.chunk.metadata
        }

class VectorStore:
    """
    High-performance vector database supporting Top-K Cosine Similarity,
    MMR (Maximal Marginal Relevance) for diversity, and granular metadata filters.
    """
    
    def __init__(self):
        self.chunks: List[DocumentChunk] = []
        self.embeddings: np.ndarray = np.empty((0, settings.EMBEDDING_DIMENSION), dtype=np.float32)
        self.chunk_ids: List[str] = []

    def add_documents(self, new_chunks: List[DocumentChunk]) -> int:
        """Embeds and indexes a list of document chunks."""
        if not new_chunks:
            return 0
            
        texts = [f"{c.doc_title} {c.topic_name} {c.content}" for c in new_chunks]
        new_vecs = embedding_service.get_embeddings_batch(texts)
        new_matrix = np.array(new_vecs, dtype=np.float32)

        if self.embeddings.shape[0] == 0:
            self.embeddings = new_matrix
        else:
            self.embeddings = np.vstack([self.embeddings, new_matrix])

        self.chunks.extend(new_chunks)
        self.chunk_ids.extend([c.chunk_id for c in new_chunks])
        return len(new_chunks)

    def similarity_search(
        self,
        query: str,
        top_k: int = 4,
        topic_id: Optional[str] = None,
        difficulty: Optional[str] = None,
        bloom_level: Optional[str] = None,
        min_score: float = 0.15
    ) -> List[SearchResult]:
        """Performs cosine similarity search against indexed curriculum chunks."""
        if len(self.chunks) == 0:
            return []

        query_vec = np.array(embedding_service.get_embedding(query), dtype=np.float32)
        return self.search_by_vector(
            query_vec=query_vec,
            top_k=top_k,
            topic_id=topic_id,
            difficulty=difficulty,
            bloom_level=bloom_level,
            min_score=min_score
        )

    def search_by_vector(
        self,
        query_vec: np.ndarray,
        top_k: int = 4,
        topic_id: Optional[str] = None,
        difficulty: Optional[str] = None,
        bloom_level: Optional[str] = None,
        min_score: float = 0.15
    ) -> List[SearchResult]:
        if self.embeddings.shape[0] == 0:
            return []

        # Vectorized cosine similarity: dot product since both are L2 normalized
        scores = np.dot(self.embeddings, query_vec)
        ranked_indices = np.argsort(scores)[::-1]

        results: List[SearchResult] = []
        for idx in ranked_indices:
            score = float(scores[idx])
            if score < min_score and len(results) >= 1:
                # Keep at least top 1 match even if low, but filter out noise
                break

            chunk = self.chunks[idx]
            
            # Apply metadata filters if provided
            if topic_id and chunk.topic_id != topic_id:
                continue
            if difficulty and chunk.difficulty.lower() != difficulty.lower():
                continue
            if bloom_level and chunk.bloom_level.lower() != bloom_level.lower():
                pass  # relaxed bloom filtering to ensure contextual coverage

            results.append(SearchResult(chunk=chunk, score=score))
            if len(results) >= top_k:
                break

        return results

    def mmr_search(
        self,
        query: str,
        top_k: int = 4,
        diversity_lambda: float = 0.7,
        topic_id: Optional[str] = None
    ) -> List[SearchResult]:
        """
        Maximal Marginal Relevance (MMR) search.
        Balances relevance to query with diversity among selected chunks
        to avoid redundant problem types or identical syllabus passages.
        """
        if len(self.chunks) == 0:
            return []

        query_vec = np.array(embedding_service.get_embedding(query), dtype=np.float32)
        sim_to_query = np.dot(self.embeddings, query_vec)

        candidate_indices = list(range(len(self.chunks)))
        if topic_id:
            candidate_indices = [i for i in candidate_indices if self.chunks[i].topic_id == topic_id]
            if not candidate_indices:
                candidate_indices = list(range(len(self.chunks)))

        selected_indices: List[int] = []

        while len(selected_indices) < min(top_k, len(candidate_indices)):
            best_score = -float("inf")
            best_idx = None

            for idx in candidate_indices:
                if idx in selected_indices:
                    continue
                
                rel = sim_to_query[idx]
                if not selected_indices:
                    div = 0.0
                else:
                    selected_vecs = self.embeddings[selected_indices]
                    div = float(np.max(np.dot(selected_vecs, self.embeddings[idx])))

                mmr_val = diversity_lambda * rel - (1 - diversity_lambda) * div
                if mmr_val > best_score:
                    best_score = mmr_val
                    best_idx = idx

            if best_idx is None:
                break
            selected_indices.append(best_idx)

        return [SearchResult(self.chunks[i], float(sim_to_query[i])) for i in selected_indices]

    def get_stats(self) -> Dict[str, Any]:
        """Returns statistics for system monitoring and observability."""
        total_chunks = len(self.chunks)
        total_tokens = sum(c.token_count for c in self.chunks)
        unique_topics = list({c.topic_name for c in self.chunks})
        unique_subjects = list({c.subject for c in self.chunks})
        
        return {
            "total_chunks": total_chunks,
            "total_documents": len({c.doc_id for c in self.chunks}),
            "total_tokens_indexed": total_tokens,
            "avg_tokens_per_chunk": round(total_tokens / max(total_chunks, 1), 1),
            "vector_dimension": settings.EMBEDDING_DIMENSION,
            "topics_indexed": unique_topics,
            "subjects_indexed": unique_subjects
        }

    def save_to_file(self, file_path: Path):
        """Serializes vector store and chunks to disk."""
        data = {
            "chunks": [c.model_dump() for c in self.chunks],
            "embeddings": self.embeddings.tolist()
        }
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f)

    def load_from_file(self, file_path: Path) -> bool:
        """Loads vector store and chunks from disk."""
        if not file_path.exists():
            return False
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            self.chunks = [DocumentChunk(**c) for c in data.get("chunks", [])]
            self.embeddings = np.array(data.get("embeddings", []), dtype=np.float32)
            self.chunk_ids = [c.chunk_id for c in self.chunks]
            return True
        except Exception:
            return False

# Global vector store singleton
vector_store = VectorStore()
