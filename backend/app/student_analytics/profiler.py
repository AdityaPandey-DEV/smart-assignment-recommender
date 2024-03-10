"""
Student Profiler and Diagnostic Analysis Engine.
Computes skill mastery vectors, diagnoses concept bottlenecks,
and generates targeted learning gap queries for RAG contextual retrieval.
"""

from typing import List, Dict, Tuple, Optional
from datetime import datetime, timezone
from .models import (
    StudentProfile,
    SkillMastery,
    QuizSubmission,
    KnowledgeGap,
    DiagnosticReport
)

class StudentProfiler:
    """
    Analyzes student quiz submissions and skill vectors to compute knowledge deltas
    and recommend targeted pedagogical objectives.
    """
    
    BENCHMARK_THRESHOLD = 0.80
    CRITICAL_THRESHOLD = 0.50
    
    BLOOM_TAXONOMY_LADDER = [
        "Remember",
        "Understand",
        "Apply",
        "Analyze",
        "Evaluate",
        "Create"
    ]

    @classmethod
    def diagnose_student(cls, profile: StudentProfile) -> DiagnosticReport:
        """
        Calculates knowledge gap deltas, identifies strengths vs weaknesses,
        and generates a prioritized diagnostic report.
        """
        gaps: List[KnowledgeGap] = []
        strengths: List[SkillMastery] = []
        total_score = 0.0
        
        for skill in profile.skills:
            total_score += skill.score
            delta = round(cls.BENCHMARK_THRESHOLD - skill.score, 3)
            
            if skill.score < cls.BENCHMARK_THRESHOLD:
                # Determine urgency
                if skill.score < cls.CRITICAL_THRESHOLD:
                    urgency = "High"
                    target_bloom = "Understand"
                    reasoning = (
                        f"Student exhibits fundamental misunderstanding in {skill.topic_name} "
                        f"(Score: {int(skill.score * 100)}%). Recommend starting with foundational "
                        f"definitions and worked examples before problem synthesis."
                    )
                else:
                    urgency = "Medium"
                    target_bloom = "Apply"
                    reasoning = (
                        f"Student possesses basic conceptual recall in {skill.topic_name} "
                        f"(Score: {int(skill.score * 100)}%), but lacks applied problem-solving "
                        f"and edge-case analysis."
                    )
                
                focus_areas = cls._generate_focus_areas(skill.topic_id, skill.score)
                
                gaps.append(KnowledgeGap(
                    topic_id=skill.topic_id,
                    topic_name=skill.topic_name,
                    current_mastery=skill.score,
                    target_benchmark=cls.BENCHMARK_THRESHOLD,
                    delta=delta,
                    urgency=urgency,
                    target_bloom_level=target_bloom,
                    diagnostic_reasoning=reasoning,
                    suggested_focus_areas=focus_areas
                ))
            else:
                strengths.append(skill)
                
        # Sort gaps by delta descending (highest gap first)
        gaps.sort(key=lambda g: g.delta, reverse=True)
        strengths.sort(key=lambda s: s.score, reverse=True)
        
        avg_score = round(total_score / max(len(profile.skills), 1), 3)
        if avg_score >= 0.85:
            tier = "Advanced"
        elif avg_score >= 0.70:
            tier = "Proficient"
        elif avg_score >= 0.50:
            tier = "Developing"
        else:
            tier = "Critical Support Needed"
            
        return DiagnosticReport(
            student_id=profile.id,
            student_name=profile.name,
            overall_readiness=avg_score,
            readiness_tier=tier,
            total_skills_tracked=len(profile.skills),
            primary_gaps=gaps,
            strengths=strengths,
            timestamp=datetime.now(timezone.utc).isoformat()
        )

    @classmethod
    def update_profile_from_quiz(cls, profile: StudentProfile, quiz: QuizSubmission) -> StudentProfile:
        """
        Updates student skill scores based on dynamic quiz submission results
        using an exponential moving average (EMA) to model continuous learning.
        """
        results_by_topic: Dict[str, List[bool]] = {}
        for q in quiz.questions:
            results_by_topic.setdefault(q.topic_id, []).append(q.correct)
            
        updated_skills: List[SkillMastery] = []
        existing_skills_map = {s.topic_id: s for s in profile.skills}
        
        for topic_id, outcomes in results_by_topic.items():
            quiz_accuracy = sum(outcomes) / len(outcomes)
            topic_name = next((q.topic_name for q in quiz.questions if q.topic_id == topic_id), topic_id)
            
            if topic_id in existing_skills_map:
                current = existing_skills_map[topic_id]
                # EMA update with alpha = 0.35
                new_score = round(0.65 * current.score + 0.35 * quiz_accuracy, 3)
                new_attempts = current.attempts + 1
                new_bloom = cls._determine_bloom_level(new_score)
                updated_skills.append(SkillMastery(
                    topic_id=topic_id,
                    topic_name=topic_name,
                    category=current.category,
                    score=new_score,
                    bloom_level=new_bloom,
                    attempts=new_attempts,
                    last_assessed=datetime.now(timezone.utc).isoformat()
                ))
            else:
                updated_skills.append(SkillMastery(
                    topic_id=topic_id,
                    topic_name=topic_name,
                    category=quiz.category,
                    score=round(quiz_accuracy, 3),
                    bloom_level=cls._determine_bloom_level(quiz_accuracy),
                    attempts=1,
                    last_assessed=datetime.now(timezone.utc).isoformat()
                ))
                
        # Preserve skills not touched in this quiz
        touched_ids = set(results_by_topic.keys())
        for s in profile.skills:
            if s.topic_id not in touched_ids:
                updated_skills.append(s)
                
        profile.skills = updated_skills
        return profile

    @classmethod
    def generate_rag_search_queries(cls, gap: KnowledgeGap) -> List[str]:
        """
        Transforms a diagnostic learning gap into targeted semantic search queries
        designed to retrieve precise curricular definitions and problem templates.
        """
        queries = [
            f"{gap.topic_name} core principles algorithmic formulation and worked examples",
            f"{gap.topic_name} practice problem exercises with step-by-step solution rubric",
            f"common student mistakes misconceptions and debugging patterns in {gap.topic_name}"
        ]
        return queries

    @classmethod
    def _determine_bloom_level(cls, score: float) -> str:
        if score < 0.40:
            return "Remember"
        elif score < 0.60:
            return "Understand"
        elif score < 0.75:
            return "Apply"
        elif score < 0.88:
            return "Analyze"
        elif score < 0.95:
            return "Evaluate"
        return "Create"

    @classmethod
    def _generate_focus_areas(cls, topic_id: str, score: float) -> List[str]:
        presets = {
            "dsa_dynamic_programming": [
                "Identifying optimal substructure & overlapping subproblems",
                "State transition equation design",
                "Bottom-up tabulation vs Top-down memoization space trade-offs"
            ],
            "dsa_trees_graphs": [
                "Cycle detection with Disjoint-Set (Union-Find)",
                "Dijkstra vs A* shortest path heuristics",
                "Tree traversals (In-order, Pre-order, Post-order recursion stacks)"
            ],
            "ml_neural_networks": [
                "Backpropagation & chain rule gradient derivation",
                "Vanishing/exploding gradients and residual connections",
                "Regularization: Dropout, Batch Normalization, and Weight Decay"
            ],
            "math_linear_algebra": [
                "Eigenvalues & Eigenvectors geometric interpretation",
                "Singular Value Decomposition (SVD) matrix factorization",
                "Orthogonal projections & least squares regression"
            ],
            "db_indexing_concurrency": [
                "B-Tree vs LSM-Tree read/write amplification",
                "ACID transactions & multi-version concurrency control (MVCC)",
                "Query execution plan optimization and composite index scans"
            ]
        }
        return presets.get(topic_id, [
            "Foundational definition review",
            "Guided step-by-step problem deconstruction",
            "Independent application exercise with automated verification"
        ])
