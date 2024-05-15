import React, { useState } from 'react';
import { 
  BarChart3, 
  Cpu, 
  Zap, 
  Server, 
  Database, 
  CheckCircle2, 
  RefreshCw,
  GitBranch,
  ShieldCheck,
  TrendingUp
} from 'lucide-react';
import { api } from '../services/api';

export default function SystemDiagnostics({ overview }) {
  const [benchmarks, setBenchmarks] = useState(null);
  const [benchmarking, setBenchmarking] = useState(false);

  const runBenchmark = async () => {
    setBenchmarking(true);
    try {
      const data = await api.runBenchmark();
      setBenchmarks(data);
    } catch (err) {
      console.error("Benchmark failed:", err);
    } finally {
      setBenchmarking(false);
    }
  };

  return (
    <div className="telemetry-container">
      {/* Header */}
      <div className="section-header">
        <h2 className="section-title">
          <BarChart3 size={28} color="var(--accent-teal)" />
          System Telemetry & Performance Benchmarks
        </h2>
        <p className="section-desc">
          Low-latency Retrieval-Augmented Generation telemetry, cosine similarity distribution metrics, and Firebase synchronization state.
        </p>
      </div>

      {/* Top Telemetry Stats */}
      <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
        <div className="glass-panel stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
            <Server size={24} />
          </div>
          <div>
            <div className="stat-val" style={{ color: '#34d399' }}>
              {overview?.total_students || 3} Students
            </div>
            <div className="stat-label">Active Diagnostic Personas</div>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
            <Database size={24} />
          </div>
          <div>
            <div className="stat-val" style={{ color: '#818cf8' }}>
              {overview?.curriculum_chunks_indexed || 18} Chunks
            </div>
            <div className="stat-label">Indexed Vector Entities</div>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <div className="stat-val" style={{ color: '#fbbf24' }}>
              {overview?.firebase_status?.mode === 'live' ? 'Live Firestore' : 'Mock Firebase'}
            </div>
            <div className="stat-label">Storage Backend Status</div>
          </div>
        </div>
      </div>

      {/* Live Benchmark Execution Card */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Zap size={20} color="#f59e0b" />
              Live Vector Search Latency Benchmark
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Executes continuous batch queries through the 128-d dense embedding vectorizer and MMR retrieval engine.
            </p>
          </div>
          <button 
            className="btn btn-emerald" 
            disabled={benchmarking}
            onClick={runBenchmark}
          >
            {benchmarking ? (
              <>
                <RefreshCw size={15} className="spin" />
                Benchmarking Core...
              </>
            ) : (
              <>
                <TrendingUp size={15} />
                Run Benchmark
              </>
            )}
          </button>
        </div>

        {benchmarks ? (
          <div className="grid-3" style={{ gap: '1rem' }}>
            <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>Embedding Vectorization</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-secondary)', marginTop: '0.25rem' }}>
                {benchmarks.embedding_latency_ms.avg} ms
              </div>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                Min: {benchmarks.embedding_latency_ms.min}ms | Max: {benchmarks.embedding_latency_ms.max}ms
              </div>
            </div>

            <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>Top-K Cosine Similarity</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-teal)', marginTop: '0.25rem' }}>
                {benchmarks.similarity_search_latency_ms.avg} ms
              </div>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                Min: {benchmarks.similarity_search_latency_ms.min}ms | Max: {benchmarks.similarity_search_latency_ms.max}ms
              </div>
            </div>

            <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>MMR Diversification</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#818cf8', marginTop: '0.25rem' }}>
                {benchmarks.mmr_retrieval_latency_ms.avg} ms
              </div>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                Throughput: ~{benchmarks.throughput_queries_per_sec} QPS
              </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '1.5rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Click <strong>"Run Benchmark"</strong> to trigger real-time latency tests across the RAG math pipeline.
          </div>
        )}
      </div>

      {/* RAG Architecture Diagram Card */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <GitBranch size={20} color="var(--accent-primary)" />
          End-to-End RAG System Architecture
        </h3>

        <div style={{ 
          background: '#070a10', 
          padding: '1.25rem', 
          borderRadius: 'var(--radius-md)', 
          fontFamily: 'var(--font-mono)', 
          fontSize: '0.825rem', 
          color: '#94a3b8', 
          lineHeight: 1.6,
          overflowX: 'auto'
        }}>
{`+-----------------------------------------------------------------------------------+
|                           ACADEMIC RAG ARCHITECTURE                               |
+-----------------------------------------------------------------------------------+

[Textbooks / Syllabi] ----> [Recursive Chunker] ----> [128-d L2 Dense Embeddings]
                                                             |
                                                             v
[Student Assessment]  ----> [Student Profiler]  ----> [Vector Store: Cosine + MMR]
(Quiz Signals / EMA)       (Knowledge Gaps Delta)             |
                                                             v
                                                    [Top-K Ranked Chunks]
                                                             |
                                                             v
                                              [Pedagogical Synthesis Prompt]
                                                             |
                                                             v
                                            +----------------------------------+
                                            | Individualized Assignment Output |
                                            | • Scaffolded Problem Tiers (1-3) |
                                            | • Grading Rubric & Misconceptions|
                                            | • Source Citations & Match %     |
                                            +----------------------------------+`}
        </div>
      </div>
    </div>
  );
}
