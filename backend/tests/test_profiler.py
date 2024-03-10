"""
Tests for Student Diagnostics and Gap Analysis.
"""

import pytest
from app.student_analytics.models import StudentProfile, SkillMastery, QuizSubmission, QuizQuestionResult
from app.student_analytics.profiler import StudentProfiler

def test_student_gap_diagnosis():
    profile = StudentProfile(
        id="s1",
        name="Test Student",
        email="test@example.com",
        skills=[
            SkillMastery(topic_id="dp", topic_name="Dynamic Programming", score=0.40),
            SkillMastery(topic_id="graphs", topic_name="Graph Theory", score=0.85)
        ]
    )

    report = StudentProfiler.diagnose_student(profile)
    assert report.student_id == "s1"
    assert len(report.primary_gaps) == 1
    assert report.primary_gaps[0].topic_id == "dp"
    assert report.primary_gaps[0].urgency == "High"
    assert len(report.strengths) == 1
    assert report.strengths[0].topic_id == "graphs"

def test_profile_update_from_quiz():
    profile = StudentProfile(
        id="s2",
        name="Adaptive Learner",
        email="adaptive@example.com",
        skills=[
            SkillMastery(topic_id="dp", topic_name="Dynamic Programming", score=0.40, attempts=1)
        ]
    )

    quiz = QuizSubmission(
        student_id="s2",
        quiz_title="DP Quick Check",
        category="Computer Science",
        questions=[
            QuizQuestionResult(question_id="q1", topic_id="dp", topic_name="Dynamic Programming", difficulty="Easy", correct=True),
            QuizQuestionResult(question_id="q2", topic_id="dp", topic_name="Dynamic Programming", difficulty="Medium", correct=True)
        ]
    )

    updated = StudentProfiler.update_profile_from_quiz(profile, quiz)
    dp_skill = next(s for s in updated.skills if s.topic_id == "dp")
    # Accuracy was 1.0; EMA should increase score above 0.40
    assert dp_skill.score > 0.40
    assert dp_skill.attempts == 2
