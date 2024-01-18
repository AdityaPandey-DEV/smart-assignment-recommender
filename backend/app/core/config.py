"""
Application Configuration and Settings.
Supports dynamic environment loading, RAG tuning parameters,
and Firebase connection configuration.
"""

from typing import List
from pydantic import BaseModel
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseModel):
    PROJECT_NAME: str = "Smart Assignment Recommender (RAG System)"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    DESCRIPTION: str = (
        "Enterprise-grade Retrieval-Augmented Generation (RAG) platform that matches "
        "student skill deficits with contextual curriculum documents to generate "
        "personalized, scaffolded assignments and grading rubrics."
    )
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*"
    ]
    
    # RAG Parameters
    CHUNK_SIZE: int = 500
    CHUNK_OVERLAP: int = 80
    TOP_K_RETRIEVAL: int = 4
    SIMILARITY_THRESHOLD: float = 0.25
    EMBEDDING_DIMENSION: int = 128
    
    # Provider Settings (local, openai, gemini, mock)
    EMBEDDING_PROVIDER: str = os.getenv("EMBEDDING_PROVIDER", "local")
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "pedagogical_engine")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    # Storage & Firebase
    DATA_DIR: Path = BASE_DIR / "data"
    CURRICULUM_DIR: Path = BASE_DIR / "data" / "curriculum"
    SAMPLE_STUDENTS_DIR: Path = BASE_DIR / "data" / "sample_students"
    VECTOR_DB_CACHE: Path = BASE_DIR / "data" / "vector_store.json"
    
    FIREBASE_PROJECT_ID: str = os.getenv("FIREBASE_PROJECT_ID", "smart-assignment-rag-demo")
    FIREBASE_CREDENTIALS_PATH: str = os.getenv("FIREBASE_CREDENTIALS_PATH", "")
    USE_FIREBASE_MOCK: bool = os.getenv("USE_FIREBASE_MOCK", "true").lower() in ("true", "1")

settings = Settings()
