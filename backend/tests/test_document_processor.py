"""
Tests for Document Processing and Recursive Chunking.
"""

import pytest
from app.rag.document_processor import DocumentProcessor

def test_chunking_with_markdown_headers():
    raw_markdown = """# Data Structures
## Stacks and Queues
Stacks operate under LIFO principles. They support push and pop operations in O(1) time.

## Binary Search Trees
BST maintains an invariant where left child keys are smaller than root and right keys are larger.
"""
    processor = DocumentProcessor(chunk_size=120, chunk_overlap=20)
    chunks = processor.process_text(raw_markdown, doc_id="test_ds", doc_title="Data Structures")

    assert len(chunks) >= 2
    section_titles = [c.metadata.get("section_title") for c in chunks]
    assert "Stacks and Queues" in section_titles or "Binary Search Trees" in section_titles
    assert all(c.token_count > 0 for c in chunks)

def test_inline_metadata_parsing():
    raw_text = """<!-- metadata:
topic_id: dsa_dp
topic_name: Dynamic Programming
difficulty: Advanced
bloom_level: Analyze
-->
## Dynamic Programming Overview
This section covers optimal substructure and overlapping subproblems.
"""
    processor = DocumentProcessor(chunk_size=300, chunk_overlap=50)
    chunks = processor.process_text(raw_text, doc_id="test_meta", doc_title="Test")
    
    assert len(chunks) > 0
    c = chunks[0]
    assert c.topic_id == "dsa_dp"
    assert c.difficulty == "Advanced"
    assert c.bloom_level == "Analyze"
