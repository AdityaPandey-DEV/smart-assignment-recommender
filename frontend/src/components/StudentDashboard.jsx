import React, { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Target, 
  ArrowRight, 
  Zap, 
  GraduationCap, 
  Award, 
  PlayCircle,
  HelpCircle,
  RefreshCw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';

export default function StudentDashboard({
  student,
  diagnostic,
  onSelectTopicForGeneration,
  onRefreshStudent
}) {
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!student) return null;

  const gaps = diagnostic?.primary_gaps || [];
  const strengths = diagnostic?.strengths || [];

  const handleSimulateQuiz = async () => {
    setIsSubmitting(true);
    const isCorrect = selectedAnswer === 1; // Option 1 is correct
    
    try {
      const result = await api.submitQuiz(student.id, {
        student_id: student.id,
        quiz_title: "Adaptive Diagnostic Quick Check",
        category: "Computer Science",
        questions: [
          {
            question_id: "q_dp_memo_1",
            topic_id: gaps[0]?.topic_id || "dsa_dynamic_programming",
            topic_name: gaps[0]?.topic_name || "Dynamic Programming",
            difficulty: "Medium",
            correct: isCorrect,
            student_answer: isCorrect ? "Bottom-up tabulation with O(N) space" : "Exponential naive recursion"
          }
        ]
      });

      if (isCorrect) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }

      setQuizSubmitted(true);
      setTimeout(() => {
        setShowQuizModal(false);
        setQuizSubmitted(false);
        setSelectedAnswer(null);
        if (onRefreshStudent) onRefreshStudent();
      }, 1800);
    } catch (err) {
      console.error("Quiz submission error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="dashboard-container">
      {/* Header Banner */}
      <div className="section-header">
        <h2 className="section-title">
          <GraduationCap size={28} color="var(--accent-primary)" />
          Student Diagnostic & Skill Matrix Hub
        </h2>
        <p className="section-desc">
          Continuous assessment engine tracking student knowledge vectors against curriculum benchmarks to uncover critical learning bottlenecks.
        </p>
      </div>

      {/* Top Cards Grid */}
      <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
        {/* Student Profile Card */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div 
              style={{ 
                width: 52, 
                height: 52, 
                borderRadius: '50%', 
                backgroundColor: student.avatar_color || '#6366f1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                fontWeight: 700,
                color: '#fff',
                boxShadow: '0 4px 14px rgba(0,0,0,0.3)'
              }}
            >
              {student.name.charAt(0)}
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{student.name}</h3>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>{student.email}</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Target Career Role:</span>
              <span style={{ fontWeight: 600 }}>{student.target_role}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Curriculum Track:</span>
              <span style={{ fontWeight: 600 }}>{student.target_curriculum}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Academic Standing:</span>
              <span style={{ fontWeight: 700, color: '#38bdf8' }}>{student.overall_gpa} GPA</span>
            </div>
          </div>
        </div>

        {/* Readiness Tier Card */}
        <div className="glass-panel stat-card">
          <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
            <Award size={26} />
          </div>
          <div>
            <div className="stat-val" style={{ color: '#818cf8' }}>
              {Math.round((diagnostic?.overall_readiness || 0.65) * 100)}%
            </div>
            <div className="stat-label">Overall Curriculum Readiness</div>
            <div style={{ marginTop: '0.25rem' }}>
              <span className={`badge ${diagnostic?.readiness_tier === 'Advanced' ? 'badge-emerald' : 'badge-indigo'}`}>
                {diagnostic?.readiness_tier || 'Developing'} Tier
              </span>
            </div>
          </div>
        </div>

        {/* Action Quick Launch */}
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Zap size={18} color="#f59e0b" />
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Interactive Diagnostic Actions</h4>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Test the EMA learning curve by simulating a quiz response or trigger an instant RAG recommendation.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
            <button 
              className="btn btn-secondary" 
              style={{ flex: 1, fontSize: '0.8rem', padding: '0.5rem' }}
              onClick={() => setShowQuizModal(true)}
            >
              <PlayCircle size={15} />
              Simulate Quiz
            </button>
            <button 
              className="btn btn-primary" 
              style={{ flex: 1, fontSize: '0.8rem', padding: '0.5rem' }}
              onClick={() => onSelectTopicForGeneration(gaps[0]?.topic_id)}
            >
              <ArrowRight size={15} />
              Generate RAG
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Layout: Skills Matrix vs Knowledge Gaps */}
      <div className="grid-2">
        {/* Left: Skill Mastery Vectors */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Target size={18} color="var(--accent-secondary)" />
              Skill Mastery Vector ({student.skills?.length || 0} Topics)
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Benchmark: 80%</span>
          </div>

          <div className="skills-list">
            {student.skills?.map((skill) => {
              const pct = Math.round(skill.score * 100);
              let barColor = 'linear-gradient(90deg, #10b981, #059669)';
              let badgeClass = 'badge-emerald';

              if (skill.score < 0.50) {
                barColor = 'linear-gradient(90deg, #f43f5e, #e11d48)';
                badgeClass = 'badge-rose';
              } else if (skill.score < 0.70) {
                barColor = 'linear-gradient(90deg, #f59e0b, #d97706)';
                badgeClass = 'badge-amber';
              } else if (skill.score < 0.80) {
                barColor = 'linear-gradient(90deg, #6366f1, #4f46e5)';
                badgeClass = 'badge-indigo';
              }

              return (
                <div key={skill.topic_id} className="skill-row">
                  <div className="skill-header">
                    <div>
                      <span style={{ fontWeight: 600 }}>{skill.topic_name}</span>
                      <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        ({skill.category})
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className={`badge ${badgeClass}`}>{skill.bloom_level}</span>
                      <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{pct}%</span>
                    </div>
                  </div>
                  <div className="skill-bar-track">
                    <div 
                      className="skill-bar-fill" 
                      style={{ 
                        width: `${pct}%`, 
                        background: barColor 
                      }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Detected Knowledge Gaps & Remediation */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={18} color="#f43f5e" />
              Diagnosed Concept Bottlenecks ({gaps.length})
            </h3>
            <span className="badge badge-rose">Prioritized</span>
          </div>

          {gaps.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
              <CheckCircle2 size={36} color="#10b981" style={{ margin: '0 auto 0.75rem auto' }} />
              <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>All Curricular Benchmarks Satisfied!</p>
              <p style={{ fontSize: '0.85rem' }}>Student exhibits no critical knowledge deficits.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {gaps.map((gap, i) => (
                <div 
                  key={gap.topic_id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>PRIORITY #{i + 1}</span>
                      <h4 style={{ fontSize: '0.975rem', fontWeight: 700, color: '#f8fafc' }}>{gap.topic_name}</h4>
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <span className={`badge ${gap.urgency === 'High' ? 'badge-rose' : 'badge-amber'}`}>
                        {gap.urgency} Urgency
                      </span>
                      <span className="badge badge-indigo">
                        Target: {gap.target_bloom_level}
                      </span>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
                    {gap.diagnostic_reasoning}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--accent-rose)' }}>
                      <strong>Knowledge Delta:</strong> -{Math.round(gap.delta * 100)}% to reach 80% benchmark
                    </div>
                    <button 
                      className="btn btn-primary"
                      style={{ fontSize: '0.775rem', padding: '0.35rem 0.75rem' }}
                      onClick={() => onSelectTopicForGeneration(gap.topic_id)}
                    >
                      <Zap size={13} />
                      Generate Assignment
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quiz Simulation Modal */}
      {showQuizModal && (
        <div className="modal-overlay" onClick={() => setShowQuizModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <HelpCircle size={20} color="var(--accent-primary)" />
                Simulate Diagnostic Quiz Assessment
              </h3>
              <button 
                onClick={() => setShowQuizModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Test how the student's mastery score dynamically recalibrates using Exponential Moving Average (EMA) upon receiving new assessment telemetry.
            </p>

            <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--accent-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
                Diagnostic Question (Topic: {gaps[0]?.topic_name || "Dynamic Programming"})
              </div>
              <p style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: '0.35rem' }}>
                In the Coin Change minimum coins problem, why does bottom-up tabulation avoid recursion stack overhead?
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <button
                className="btn btn-secondary"
                style={{ 
                  textAlign: 'left', 
                  justifyContent: 'flex-start',
                  borderColor: selectedAnswer === 0 ? 'var(--accent-rose)' : 'var(--border-subtle)'
                }}
                onClick={() => setSelectedAnswer(0)}
              >
                <span>A) It computes all possible subsets recursively using O(2^N) backtracking.</span>
              </button>
              <button
                className="btn btn-secondary"
                style={{ 
                  textAlign: 'left', 
                  justifyContent: 'flex-start',
                  borderColor: selectedAnswer === 1 ? 'var(--accent-teal)' : 'var(--border-subtle)'
                }}
                onClick={() => setSelectedAnswer(1)}
              >
                <span>B) It fills an array iteratively in topological order, re-using prior subproblem solutions. (Correct)</span>
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn btn-secondary" onClick={() => setShowQuizModal(false)}>
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                disabled={selectedAnswer === null || isSubmitting}
                onClick={handleSimulateQuiz}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={14} className="spin" />
                    Updating Vector...
                  </>
                ) : (
                  'Submit Answer & Update Profile'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
