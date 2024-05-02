"""
Assignment Recommendation and Synthesis Endpoints.
Connects student diagnostics with RAG contextual retrieval and generation.
"""

from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from app.student_analytics.models import StudentProfile, KnowledgeGap
from app.student_analytics.profiler import StudentProfiler
from app.rag.retriever import ContextualRetriever
from app.rag.generator import AssignmentGenerator, GeneratedAssignment
from app.firebase.firebase_service import firebase_service
from .routes_rag import index_default_curriculum
from .routes_students import _ensure_sample_students_loaded

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])

class GenerateRequest(BaseModel):
    student_id: str
    topic_id: Optional[str] = None
    target_difficulty: str = "Adaptive"
    num_problems: int = 3
    target_bloom_level: Optional[str] = None

@router.post("/generate", response_model=Dict[str, Any])
def generate_personalized_assignment(req: GenerateRequest):
    """
    Core RAG Recommender Endpoint.
    1. Fetches student skill vector.
    2. Runs diagnostic gap analysis.
    3. Retrieves contextual curriculum chunks via MMR vector search.
    4. Generates personalized scaffolded problem set and grading rubric.
    5. Saves assignment to Firebase.
    """
    _ensure_sample_students_loaded()
    index_default_curriculum()

    student_data = firebase_service.get_student(req.student_id)
    if not student_data:
        raise HTTPException(status_code=404, detail=f"Student '{req.student_id}' not found.")
    
    student = StudentProfile(**student_data)
    diagnostic = StudentProfiler.diagnose_student(student)

    # Select target gap: either user-specified or student's #1 critical gap
    target_gap: Optional[KnowledgeGap] = None
    if req.topic_id:
        target_gap = next((g for g in diagnostic.primary_gaps if g.topic_id == req.topic_id), None)
        if not target_gap:
            # If not in gaps, student might have high score; create custom gap representation
            matching_skill = next((s for s in student.skills if s.topic_id == req.topic_id), None)
            topic_name = matching_skill.topic_name if matching_skill else req.topic_id.replace("_", " ").title()
            curr_score = matching_skill.score if matching_skill else 0.50
            target_gap = KnowledgeGap(
                topic_id=req.topic_id,
                topic_name=topic_name,
                current_mastery=curr_score,
                delta=round(0.80 - curr_score, 3),
                urgency="Medium",
                target_bloom_level=req.target_bloom_level or (matching_skill.bloom_level if matching_skill else "Apply"),
                diagnostic_reasoning=f"Custom practice session requested for {topic_name}."
            )
    else:
        if diagnostic.primary_gaps:
            target_gap = diagnostic.primary_gaps[0]
        else:
            # Student has mastered all benchmarks! Create challenge gap
            target_gap = KnowledgeGap(
                topic_id="dsa_dynamic_programming",
                topic_name="Dynamic Programming & Optimization",
                current_mastery=0.90,
                delta=0.0,
                urgency="Low",
                target_bloom_level="Evaluate",
                diagnostic_reasoning="Student has achieved high benchmark proficiency. Recommending advanced synthesis challenges."
            )

    if req.target_bloom_level:
        target_gap.target_bloom_level = req.target_bloom_level

    # 1. Contextual Retrieval
    retrieved_context = ContextualRetriever.retrieve_for_gap(
        gap=target_gap,
        top_k=4,
        use_mmr=True
    )

    # 2. Assignment Generation
    assignment = AssignmentGenerator.generate_assignment(
        student=student,
        gap=target_gap,
        context=retrieved_context,
        target_difficulty=req.target_difficulty,
        num_problems=req.num_problems
    )

    # 3. Store in Firebase
    firebase_service.save_assignment(assignment.model_dump())

    return {
        "status": "success",
        "assignment": assignment.model_dump(),
        "retrieval_summary": retrieved_context.to_dict()
    }

@router.get("/history", response_model=List[Dict[str, Any]])
def get_assignment_history(student_id: Optional[str] = None):
    """Retrieves past generated assignments from Firebase."""
    return firebase_service.list_assignments(student_id=student_id)

@router.get("/{assignment_id}", response_model=Dict[str, Any])
def get_assignment(assignment_id: str):
    """Retrieves specific generated assignment by ID."""
    all_asgns = firebase_service.list_assignments()
    match = next((a for a in all_asgns if a.get("id") == assignment_id), None)
    if not match:
        raise HTTPException(status_code=404, detail=f"Assignment '{assignment_id}' not found.")
    return match
