"""
Tests for Vector Store, Embeddings, and Cosine Similarity.
"""

import pytest
import numpy as np
from app.rag.document_processor import DocumentChunk
from app.rag.vector_store import VectorStore
from app.rag.embeddings import embedding_service

def test_embedding_generation():
    text = "Dynamic programming optimizes overlapping subproblems using memoization."
    emb = embedding_service.get_embedding(text)
    assert len(emb) == 128
    # Ensure unit norm
    norm = np.linalg.norm(emb)
    assert abs(norm - 1.0) < 1e-4

def test_cosine_similarity():
    v1 = embedding_service.get_embedding("Dynamic programming memoization algorithms")
    v2 = embedding_service.get_embedding("Recursion dynamic programming caching subproblems")
    v3 = embedding_service.get_embedding("Agricultural crop harvesting soil irrigation")

    sim_related = embedding_service.cosine_similarity(v1, v2)
    sim_unrelated = embedding_service.cosine_similarity(v1, v3)

    assert sim_related > sim_unrelated

def test_vector_store_indexing_and_search():
    store = VectorStore()
    chunk1 = DocumentChunk(
        chunk_id="c1",
        doc_id="d1",
        doc_title="Algorithms",
        subject="Computer Science",
        topic_id="dp",
        topic_name="Dynamic Programming",
        difficulty="Intermediate",
        bloom_level="Apply",
        content="Dynamic programming breaks down problems into overlapping subproblems with memoization.",
        token_count=15,
        char_length=90
    )
    chunk2 = DocumentChunk(
        chunk_id="c2",
        doc_id="d2",
        doc_title="Linear Algebra",
        subject="Mathematics",
        topic_id="la",
        topic_name="Eigenvalues",
        difficulty="Advanced",
        bloom_level="Analyze",
        content="Spectral decomposition calculates eigenvalues and eigenvectors of a symmetric matrix.",
        token_count=14,
        char_length=85
    )

    store.add_documents([chunk1, chunk2])
    assert len(store.chunks) == 2

    results = store.similarity_search("How to use memoization in subproblems?", top_k=1)
    assert len(results) == 1
    assert results[0].chunk.topic_id == "dp"
