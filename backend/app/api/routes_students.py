"""
Student Analytics and Profile API Endpoints.
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any, Optional
import os
import json
from pathlib import Path
from app.student_analytics.models import StudentProfile, DiagnosticReport, QuizSubmission
from app.student_analytics.profiler import StudentProfiler
from app.firebase.firebase_service import firebase_service
from app.core.config import settings

router = APIRouter(prefix="/students", tags=["Students"])

def _ensure_sample_students_loaded():
    """Populates store with default sample student personas if empty."""
    stored = firebase_service.list_students()
    if not stored and settings.SAMPLE_STUDENTS_DIR.exists():
        for f in settings.SAMPLE_STUDENTS_DIR.glob("*.json"):
            try:
                with open(f, "r", encoding="utf-8") as file:
                    data = json.load(file)
                    firebase_service.save_student(data)
            except Exception as e:
                print(f"Error loading student {f}: {e}")

@router.get("", response_model=List[Dict[str, Any]])
def get_all_students():
    """Returns all tracked student profiles."""
    _ensure_sample_students_loaded()
    return firebase_service.list_students()

@router.get("/{student_id}", response_model=Dict[str, Any])
def get_student(student_id: str):
    """Retrieves specific student profile by ID."""
    _ensure_sample_students_loaded()
    student = firebase_service.get_student(student_id)
    if not student:
        raise HTTPException(status_code=404, detail=f"Student '{student_id}' not found.")
    return student

@router.post("", response_model=Dict[str, Any])
def create_or_update_student(profile: StudentProfile):
    """Registers or updates a student profile."""
    data = profile.model_dump()
    firebase_service.save_student(data)
    return data

@router.get("/{student_id}/diagnose", response_model=DiagnosticReport)
def diagnose_student(student_id: str):
    """
    Executes student diagnostic analysis.
    Identifies skill deficits, knowledge deltas, and recommended Bloom levels.
    """
    _ensure_sample_students_loaded()
    raw = firebase_service.get_student(student_id)
    if not raw:
        raise HTTPException(status_code=404, detail=f"Student '{student_id}' not found.")
    
    profile = StudentProfile(**raw)
    return StudentProfiler.diagnose_student(profile)

@router.post("/{student_id}/submit-quiz", response_model=Dict[str, Any])
def submit_quiz_results(student_id: str, quiz: QuizSubmission):
    """
    Updates student skill mastery vector based on assessment outcomes.
    """
    _ensure_sample_students_loaded()
    raw = firebase_service.get_student(student_id)
    if not raw:
        raise HTTPException(status_code=404, detail=f"Student '{student_id}' not found.")
    
    profile = StudentProfile(**raw)
    updated = StudentProfiler.update_profile_from_quiz(profile, quiz)
    firebase_service.save_student(updated.model_dump())
    
    # Return updated diagnostic
    diagnostic = StudentProfiler.diagnose_student(updated)
    return {
        "message": "Quiz recorded successfully. Skill vector updated.",
        "student": updated.model_dump(),
        "diagnostic": diagnostic.model_dump()
    }
