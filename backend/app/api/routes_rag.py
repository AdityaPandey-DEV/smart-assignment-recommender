"""
RAG Curriculum Knowledge Base & Vector Store Endpoints.
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from pathlib import Path
import os
from app.rag.document_processor import DocumentProcessor, DocumentChunk
from app.rag.vector_store import vector_store
from app.core.config import settings

router = APIRouter(prefix="/rag", tags=["RAG Knowledge Base"])
processor = DocumentProcessor(chunk_size=settings.CHUNK_SIZE, chunk_overlap=settings.CHUNK_OVERLAP)

class SearchRequest(BaseModel):
    query: str
    top_k: int = 4
    topic_id: Optional[str] = None
    difficulty: Optional[str] = None
    bloom_level: Optional[str] = None
    use_mmr: bool = False

def index_default_curriculum():
    """Reads all markdown files in curriculum directory and indexes into vector store."""
    if len(vector_store.chunks) > 0:
        return
        
    curriculum_dir = settings.CURRICULUM_DIR
    if not curriculum_dir.exists():
        return

    all_chunks: List[DocumentChunk] = []
    for file_path in curriculum_dir.glob("*.md"):
        try:
            chunks = processor.process_file(file_path)
            all_chunks.extend(chunks)
        except Exception as e:
            print(f"[RAG Indexer] Error processing {file_path.name}: {e}")

    added = vector_store.add_documents(all_chunks)
    print(f"[RAG Indexer] Successfully indexed {added} curriculum chunks into vector store.")

@router.get("/documents", response_model=List[Dict[str, Any]])
def list_indexed_chunks(topic_id: Optional[str] = None, limit: int = 50):
    """Lists indexed curriculum chunks with their pedagogical metadata."""
    index_default_curriculum()
    chunks = vector_store.chunks
    if topic_id:
        chunks = [c for c in chunks if c.topic_id == topic_id]
    return [c.model_dump() for c in chunks[:limit]]

@router.post("/search", response_model=Dict[str, Any])
def search_knowledge_base(req: SearchRequest):
    """
    Performs vector similarity search or MMR search against indexed documents.
    """
    index_default_curriculum()
    if req.use_mmr:
        results = vector_store.mmr_search(
            query=req.query,
            top_k=req.top_k,
            topic_id=req.topic_id
        )
    else:
        results = vector_store.similarity_search(
            query=req.query,
            top_k=req.top_k,
            topic_id=req.topic_id,
            difficulty=req.difficulty,
            bloom_level=req.bloom_level
        )

    return {
        "query": req.query,
        "results_count": len(results),
        "results": [r.to_dict() for r in results]
    }

@router.get("/stats", response_model=Dict[str, Any])
def get_vector_store_stats():
    """Returns observability statistics on indexed documents, tokens, and topics."""
    index_default_curriculum()
    return vector_store.get_stats()

@router.post("/upload", response_model=Dict[str, Any])
async def upload_document(
    file: UploadFile = File(...),
    subject: str = Form("Computer Science"),
    default_difficulty: str = Form("Intermediate")
):
    """
    Uploads a new syllabus or academic document (.txt, .md),
    chunks it, extracts metadata, and updates the vector store dynamically.
    """
    contents = await file.read()
    text = contents.decode("utf-8", errors="ignore")
    
    doc_id = Path(file.filename).stem
    chunks = processor.process_text(
        raw_text=text,
        doc_id=doc_id,
        doc_title=file.filename.replace("_", " ").title(),
        subject=subject,
        default_difficulty=default_difficulty
    )
    
    count = vector_store.add_documents(chunks)
    return {
        "message": f"Successfully processed and indexed document '{file.filename}'.",
        "chunks_indexed": count,
        "doc_id": doc_id,
        "stats": vector_store.get_stats()
    }
