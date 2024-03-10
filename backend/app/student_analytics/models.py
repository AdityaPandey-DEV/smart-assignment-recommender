"""
Pydantic Data Models for Student Analytics and Diagnostics.
Defines schemas for skill mastery, assessment submissions, and learning gap reports.
"""

from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field
from datetime import datetime, timezone

class SkillMastery(BaseModel):
    topic_id: str
    topic_name: str
    category: str = "Computer Science"
    score: float = Field(..., ge=0.0, le=1.0, description="Mastery score between 0.0 and 1.0")
    bloom_level: str = "Understand"  # Remember, Understand, Apply, Analyze, Evaluate, Create
    attempts: int = 1
    last_assessed: Optional[str] = None

class StudentProfile(BaseModel):
    id: str
    name: str
    email: str
    avatar_color: str = "#4f46e5"
    target_role: str = "Full-Stack Software Engineer"
    target_curriculum: str = "CS Core Curriculum"
    overall_gpa: float = 3.6
    skills: List[SkillMastery] = []
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class QuizQuestionResult(BaseModel):
    question_id: str
    topic_id: str
    topic_name: str
    difficulty: str  # Easy, Medium, Hard
    correct: bool
    student_answer: Optional[str] = None
    correct_answer: Optional[str] = None

class QuizSubmission(BaseModel):
    student_id: str
    quiz_title: str
    category: str
    questions: List[QuizQuestionResult]

class KnowledgeGap(BaseModel):
    topic_id: str
    topic_name: str
    current_mastery: float
    target_benchmark: float = 0.80
    delta: float
    urgency: str  # High, Medium, Low
    target_bloom_level: str
    diagnostic_reasoning: str
    suggested_focus_areas: List[str] = []

class DiagnosticReport(BaseModel):
    student_id: str
    student_name: str
    overall_readiness: float
    readiness_tier: str  # Critical Support Needed, Developing, Proficient, Advanced
    total_skills_tracked: int
    primary_gaps: List[KnowledgeGap]
    strengths: List[SkillMastery]
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
