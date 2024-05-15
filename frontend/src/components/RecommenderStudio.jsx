import React, { useState } from 'react';
import { 
  Sparkles, 
  Layers, 
  BookOpen, 
  CheckCircle, 
  Copy, 
  Download, 
  Printer, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Code2,
  Clock,
  Award
} from 'lucide-react';
import { api } from '../services/api';

export default function RecommenderStudio({
  student,
  diagnostic,
  initialTopicId,
  onAssignmentGenerated
}) {
  const [topicId, setTopicId] = useState(initialTopicId || "dsa_dynamic_programming");
  const [bloomLevel, setBloomLevel] = useState("Apply");
  const [difficulty, setDifficulty] = useState("Adaptive");
  const [numProblems, setNumProblems] = useState(3);
  const [useMmr, setUseMmr] = useState(true);

  const [loading, setLoading] = useState(false);
  const [pipelineStep, setPipelineStep] = useState(0);
  const [currentAssignment, setCurrentAssignment] = useState(null);
  const [retrievalSummary, setRetrievalSummary] = useState(null);
  const [activeTab, setActiveTab] = useState('problems'); // problems, rubric, citations, markdown
  const [expandedHints, setExpandedHints] = useState({});
  const [copied, setCopied] = useState(false);

  const topicsList = [
    { id: "dsa_dynamic_programming", name: "Dynamic Programming & Tabulation" },
    { id: "dsa_trees_graphs", name: "Graph Algorithms & Shortest Paths" },
    { id: "ml_neural_networks", name: "Neural Networks & Backpropagation" },
    { id: "math_linear_algebra", name: "Spectral Theory & Eigenvalues" },
    { id: "db_indexing_concurrency", name: "Database Indexing & Concurrency Control" }
  ];

  const bloomLevels = [
    "Understand", "Apply", "Analyze", "Evaluate", "Create"
  ];

  const handleGenerate = async () => {
    setLoading(true);
    setPipelineStep(1);

    // Simulate pipeline step visual feedback
    const t1 = setTimeout(() => setPipelineStep(2), 300);
    const t2 = setTimeout(() => setPipelineStep(3), 600);
    const t3 = setTimeout(() => setPipelineStep(4), 900);

    try {
      const res = await api.generateAssignment({
        student_id: student.id,
        topic_id: topicId,
        target_difficulty: difficulty,
        num_problems: numProblems,
        target_bloom_level: bloomLevel
      });

      if (res && res.assignment) {
        setCurrentAssignment(res.assignment);
        setRetrievalSummary(res.retrieval_summary);
        if (onAssignmentGenerated) onAssignmentGenerated(res.assignment);
      }
    } catch (err) {
      console.error("Assignment generation failed:", err);
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      setLoading(false);
      setPipelineStep(0);
    }
  };

  const handleCopyCode = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    if (!currentAssignment) return;
    const blob = new Blob([currentAssignment.markdown_content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentAssignment.id}_${currentAssignment.topic_name.replace(/\s+/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="studio-container">
      {/* Header */}
      <div className="section-header">
        <h2 className="section-title">
          <Layers size={28} color="var(--accent-primary)" />
          RAG Assignment Recommender & Synthesis Studio
        </h2>
        <p className="section-desc">
          Retrieval-Augmented Generation pipeline dynamically retrieves syllabus passages and past exam exercises to synthesize individualized problem sets with cognitive scaffolding.
        </p>
      </div>

      {/* Controls Card */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={18} color="#f59e0b" />
          RAG Pedagogical Generation Parameters
        </h3>

        <div className="grid-3" style={{ gap: '1.25rem' }}>
          {/* Topic Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', fontWeight: 600 }}>
              Target Academic Topic
            </label>
            <select
              style={{
                width: '100%',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-medium)',
                color: 'var(--text-primary)',
                padding: '0.6rem 0.8rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.875rem'
              }}
              value={topicId}
              onChange={(e) => setTopicId(e.target.value)}
            >
              {topicsList.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Bloom's Level Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', fontWeight: 600 }}>
              Target Bloom's Taxonomy Tier
            </label>
            <select
              style={{
                width: '100%',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-medium)',
                color: 'var(--text-primary)',
                padding: '0.6rem 0.8rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.875rem'
              }}
              value={bloomLevel}
              onChange={(e) => setBloomLevel(e.target.value)}
            >
              {bloomLevels.map((b) => (
                <option key={b} value={b}>
                  Level: {b}
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty & Problem Count */}
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', fontWeight: 600 }}>
                Difficulty
              </label>
              <select
                style={{
                  width: '100%',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-medium)',
                  color: 'var(--text-primary)',
                  padding: '0.6rem 0.8rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.875rem'
                }}
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
              >
                <option value="Adaptive">Adaptive</option>
                <option value="Foundational">Foundational</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
            <div style={{ width: 90 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', fontWeight: 600 }}>
                Tiers
              </label>
              <select
                style={{
                  width: '100%',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-medium)',
                  color: 'var(--text-primary)',
                  padding: '0.6rem 0.8rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.875rem'
                }}
                value={numProblems}
                onChange={(e) => setNumProblems(Number(e.target.value))}
              >
                <option value={2}>2 Tiers</option>
                <option value={3}>3 Tiers</option>
              </select>
            </div>
          </div>
        </div>

        {/* Action Button & MMR Toggle */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.825rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={useMmr} 
              onChange={(e) => setUseMmr(e.target.checked)}
              style={{ accentColor: 'var(--accent-primary)', width: 16, height: 16 }}
            />
            <span>Enable <strong>MMR Diversification</strong> (Maximal Marginal Relevance λ=0.75)</span>
          </label>

          <button
            className="btn btn-primary"
            disabled={loading}
            onClick={handleGenerate}
            style={{ minWidth: 240 }}
          >
            {loading ? (
              <>
                <Sparkles size={16} className="spin" />
                Synthesizing RAG Assignment...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Synthesize Personalized Assignment
              </>
            )}
          </button>
        </div>
      </div>

      {/* Pipeline Visual Feedback Indicator */}
      {loading && (
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', textAlign: 'center' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--accent-secondary)' }}>
            Retrieval-Augmented Generation Pipeline Active
          </h4>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ opacity: pipelineStep >= 1 ? 1 : 0.4, transition: 'all 0.3s' }}>
              <div className="badge badge-indigo">1. Diagnostic Profiling</div>
            </div>
            <div style={{ opacity: pipelineStep >= 2 ? 1 : 0.4, transition: 'all 0.3s' }}>
              <div className="badge badge-cyan">2. 128-d Vector Embedding</div>
            </div>
            <div style={{ opacity: pipelineStep >= 3 ? 1 : 0.4, transition: 'all 0.3s' }}>
              <div className="badge badge-emerald">3. Top-K Vector Search</div>
            </div>
            <div style={{ opacity: pipelineStep >= 4 ? 1 : 0.4, transition: 'all 0.3s' }}>
              <div className="badge badge-amber">4. Scaffolded Synthesis</div>
            </div>
          </div>
        </div>
      )}

      {/* Generated Assignment Display */}
      {currentAssignment && !loading && (
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          {/* Header & Meta */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1.25rem' }}>
            <div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.4rem' }}>
                <span className="badge badge-indigo">{currentAssignment.topic_name}</span>
                <span className="badge badge-cyan">Bloom: {currentAssignment.target_bloom_level}</span>
                <span className="badge badge-emerald">{currentAssignment.difficulty}</span>
                <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Clock size={13} /> {currentAssignment.estimated_duration_mins} mins
                </span>
              </div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{currentAssignment.title}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                Personalized for <strong>{currentAssignment.student_name}</strong>
              </p>
            </div>

            {/* Actions: Export / Download / Copy */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                className="btn btn-secondary" 
                onClick={handleCopyCode}
                title="Copy Markdown"
                style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
              >
                {copied ? <CheckCircle size={15} color="#10b981" /> : <Copy size={15} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={handleDownloadMarkdown}
                title="Download .md file"
                style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
              >
                <Download size={15} />
                Export .md
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={handlePrint}
                title="Print or Save as PDF"
                style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
              >
                <Printer size={15} />
                Print PDF
              </button>
            </div>
          </div>

          {/* Diagnostic Justification Callout */}
          <div style={{ 
            background: 'rgba(99, 102, 241, 0.08)', 
            borderLeft: '4px solid var(--accent-primary)', 
            padding: '1rem', 
            borderRadius: '0 var(--radius-md) var(--radius-md) 0',
            marginBottom: '1.5rem',
            fontSize: '0.875rem',
            color: '#cbd5e1'
          }}>
            <strong>Diagnostic Rationale:</strong> {currentAssignment.diagnostic_justification}
          </div>

          {/* Tabs Navigation */}
          <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '1.5rem', paddingBottom: '0.5rem' }}>
            <button
              className={`nav-tab-btn ${activeTab === 'problems' ? 'active' : ''}`}
              onClick={() => setActiveTab('problems')}
            >
              📝 Scaffolded Problems ({currentAssignment.scaffolded_problems.length})
            </button>
            <button
              className={`nav-tab-btn ${activeTab === 'rubric' ? 'active' : ''}`}
              onClick={() => setActiveTab('rubric')}
            >
              📊 Grading Rubric ({currentAssignment.grading_rubric.length} Criteria)
            </button>
            <button
              className={`nav-tab-btn ${activeTab === 'citations' ? 'active' : ''}`}
              onClick={() => setActiveTab('citations')}
            >
              📚 Grounded Citations ({currentAssignment.citations.length} Sources)
            </button>
            <button
              className={`nav-tab-btn ${activeTab === 'markdown' ? 'active' : ''}`}
              onClick={() => setActiveTab('markdown')}
            >
              📄 Raw Markdown
            </button>
          </div>

          {/* Tab 1: Scaffolded Problems */}
          {activeTab === 'problems' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {currentAssignment.scaffolded_problems.map((prob, idx) => (
                <div 
                  key={idx}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.25rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="badge badge-indigo">Tier {prob.tier_number}</span>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{prob.title}</h4>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span className="badge badge-emerald">{prob.points} Points</span>
                      <span className="badge badge-cyan">{prob.bloom_level}</span>
                    </div>
                  </div>

                  <p style={{ whiteSpace: 'pre-line', fontSize: '0.9rem', color: '#e2e8f0', lineHeight: 1.6, marginBottom: '1rem' }}>
                    {prob.problem_statement}
                  </p>

                  {/* Starter Code Block */}
                  {prob.starter_code && (
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#070a10', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0', border: '1px solid var(--border-subtle)', borderBottom: 'none' }}>
                        <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-secondary)' }}>
                          Python Starter Code
                        </span>
                        <button
                          onClick={() => handleCopyCode(prob.starter_code)}
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}
                        >
                          <Copy size={13} /> Copy
                        </button>
                      </div>
                      <pre style={{ margin: 0, borderRadius: '0 0 var(--radius-sm) var(--radius-sm)' }}>
                        <code>{prob.starter_code}</code>
                      </pre>
                    </div>
                  )}

                  {/* Hints Accordion */}
                  {prob.hints && prob.hints.length > 0 && (
                    <div>
                      <button
                        onClick={() => setExpandedHints(prev => ({ ...prev, [idx]: !prev[idx] }))}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#fbbf24',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        {expandedHints[idx] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        {expandedHints[idx] ? 'Hide Scaffolding Hints' : `Show Scaffolding Hints (${prob.hints.length})`}
                      </button>
                      {expandedHints[idx] && (
                        <div style={{ marginTop: '0.5rem', background: 'rgba(245, 158, 11, 0.08)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(245, 158, 11, 0.2)', fontSize: '0.825rem' }}>
                          {prob.hints.map((h, hIdx) => (
                            <div key={hIdx} style={{ marginBottom: '0.25rem' }}>💡 {h}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Tab 2: Grading Rubric */}
          {activeTab === 'rubric' && (
            <div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(255, 255, 255, 0.04)', borderBottom: '1px solid var(--border-medium)' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Evaluation Criterion</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center', width: 90 }}>Points</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Mastery Standard</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Common Misconceptions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentAssignment.grading_rubric.map((r, rIdx) => (
                    <tr key={rIdx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 600, color: '#f8fafc' }}>{r.criterion}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 700, color: 'var(--accent-secondary)' }}>{r.points}</td>
                      <td style={{ padding: '0.75rem', color: '#cbd5e1' }}>{r.description}</td>
                      <td style={{ padding: '0.75rem', color: '#fb7185', fontSize: '0.8rem' }}>
                        {r.common_pitfalls?.map((p, pIdx) => (
                          <div key={pIdx}>• {p}</div>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Tab 3: Grounded Citations */}
          {activeTab === 'citations' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Every problem in this assignment is anchored to verified curriculum documents retrieved via Cosine Similarity search:
              </div>

              {currentAssignment.citations.map((c, cIdx) => (
                <div 
                  key={cIdx}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.25rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <BookOpen size={16} color="var(--accent-secondary)" />
                      <strong style={{ fontSize: '0.95rem' }}>{c.doc_title || "Curriculum Resource"}</strong>
                    </div>
                    <span className="badge badge-emerald">
                      {Math.round((c.similarity_score || 0.85) * 100)}% Cosine Match
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>Subject: <strong>{c.subject}</strong></span>
                    <span>•</span>
                    <span>Topic: <strong>{c.topic_name}</strong></span>
                    <span>•</span>
                    <span>Bloom: <strong>{c.bloom_level}</strong></span>
                  </div>

                  <div style={{ background: '#070a10', padding: '0.85rem', borderRadius: 'var(--radius-sm)', fontSize: '0.825rem', fontFamily: 'var(--font-mono)', color: '#94a3b8', lineHeight: 1.5 }}>
                    {c.content}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 4: Raw Markdown */}
          {activeTab === 'markdown' && (
            <div>
              <pre style={{ maxHeight: 500, overflowY: 'auto' }}>
                <code>{currentAssignment.markdown_content}</code>
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
