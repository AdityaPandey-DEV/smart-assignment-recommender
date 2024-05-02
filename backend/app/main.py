"""
Main FastAPI Application Entrypoint for Smart Assignment Recommender (RAG System).
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.api.routes_students import router as students_router, _ensure_sample_students_loaded
from app.api.routes_rag import router as rag_router, index_default_curriculum
from app.api.routes_recommendations import router as recommendations_router
from app.api.routes_analytics import router as analytics_router
from app.firebase.firebase_service import firebase_service

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize knowledge base vectors and student profiles
    print(f"🚀 Starting {settings.PROJECT_NAME} v{settings.VERSION}...")
    index_default_curriculum()
    _ensure_sample_students_loaded()
    print("✅ Initialization complete. Ready to serve requests.")
    yield
    # Shutdown
    print("🛑 Shutting down backend.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=settings.DESCRIPTION,
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(students_router, prefix=settings.API_V1_STR)
app.include_router(rag_router, prefix=settings.API_V1_STR)
app.include_router(recommendations_router, prefix=settings.API_V1_STR)
app.include_router(analytics_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "operational",
        "docs_url": "/docs",
        "health": "/health",
        "api_v1": settings.API_V1_STR
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "firebase": firebase_service.get_status(),
        "vector_store_indexed": len(firebase_service.list_students()) > 0
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
