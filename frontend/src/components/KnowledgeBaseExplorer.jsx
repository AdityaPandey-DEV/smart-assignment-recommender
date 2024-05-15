import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Search, 
  Database, 
  PlusCircle, 
  Tag, 
  Layers, 
  CheckCircle,
  FileText,
  Upload
} from 'lucide-react';
import { api } from '../services/api';

export default function KnowledgeBaseExplorer() {
  const [stats, setStats] = useState(null);
  const [chunks, setChunks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState('all');

  // Ingestion form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('Computer Science');
  const [newText, setNewText] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const s = await api.getRagStats();
    setStats(s);
    const docs = await api.getRagDocuments();
    setChunks(docs);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      loadData();
      return;
    }
    setIsSearching(true);
    try {
      const res = await api.searchRag(searchQuery, 6);
      if (res && res.results) {
        setChunks(res.results.map(r => ({
          ...r.chunk,
          similarity_score: r.similarity_score || r.score
        })));
      }
    } catch (err) {
      console.error("Vector search failed:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleManualIngest = async (e) => {
    e.preventDefault();
    if (!newText.trim()) return;

    try {
      const blob = new Blob([newText], { type: 'text/markdown' });
      const filename = `${newTitle.toLowerCase().replace(/\s+/g, '_') || 'custom_document'}.md`;
      const formData = new FormData();
      formData.append('file', blob, filename);
      formData.append('subject', newSubject);
      formData.append('default_difficulty', 'Intermediate');

      await api.uploadDocument(formData);
      await loadData();
      setUploadSuccess(true);
      setTimeout(() => {
        setShowAddModal(false);
        setUploadSuccess(false);
        setNewTitle('');
        setNewText('');
      }, 1200);
    } catch (err) {
      console.error("Document upload failed:", err);
    }
  };

  const filteredChunks = selectedTopic === 'all' 
    ? chunks 
    : chunks.filter(c => c.topic_id === selectedTopic);

  return (
    <div className="kb-container">
      {/* Header */}
      <div className="section-header">
        <h2 className="section-title">
          <BookOpen size={28} color="var(--accent-secondary)" />
          Curriculum Knowledge Base & Vector Store Inspector
        </h2>
        <p className="section-desc">
          Dense vector index mapping academic textbooks, lecture syllabi, and problem sets into 128-dimensional unit hyperspace for high-fidelity semantic retrieval.
        </p>
      </div>

      {/* Observability Stats Row */}
      <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
        <div className="glass-panel stat-card">
          <div className="stat-icon" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee' }}>
            <Database size={24} />
          </div>
          <div>
            <div className="stat-val" style={{ color: '#22d3ee' }}>{stats?.total_chunks || chunks.length}</div>
            <div className="stat-label">Vector Chunks Indexed</div>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
            <Layers size={24} />
          </div>
          <div>
            <div className="stat-val" style={{ color: '#818cf8' }}>128-D</div>
            <div className="stat-label">Embedding Dimension (Cosine)</div>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
            <FileText size={24} />
          </div>
          <div>
            <div className="stat-val" style={{ color: '#34d399' }}>{stats?.total_tokens_indexed || 3840}</div>
            <div className="stat-label">Total Tokens in Knowledge Base</div>
          </div>
        </div>
      </div>

      {/* Semantic Search & Controls Bar */}
      <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 260, position: 'relative' }}>
            <input
              type="text"
              placeholder="Search curriculum via dense vector similarity (e.g. 'optimal substructure', 'eigenvalues', 'B-Tree')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-medium)',
                color: 'var(--text-primary)',
                padding: '0.65rem 1rem 0.65rem 2.5rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.875rem'
              }}
            />
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: 13 }} />
          </div>

          <button type="submit" className="btn btn-primary" disabled={isSearching} style={{ fontSize: '0.85rem' }}>
            <Search size={15} />
            {isSearching ? 'Computing Embeddings...' : 'Semantic Search'}
          </button>

          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={() => setShowAddModal(true)}
            style={{ fontSize: '0.85rem' }}
          >
            <PlusCircle size={15} color="var(--accent-teal)" />
            Ingest Document
          </button>
        </form>
      </div>

      {/* Chunks Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredChunks.map((chunk, idx) => (
          <div 
            key={chunk.chunk_id || idx}
            className="glass-panel"
            style={{ padding: '1.25rem' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <span className="badge badge-cyan">{chunk.subject}</span>
                  <span className="badge badge-indigo">{chunk.topic_name}</span>
                  <span className="badge badge-emerald">Bloom: {chunk.bloom_level}</span>
                  {chunk.difficulty && <span className="badge badge-amber">{chunk.difficulty}</span>}
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>
                  {chunk.doc_title}
                </h4>
              </div>

              {chunk.similarity_score !== undefined && (
                <span className="badge badge-emerald" style={{ fontSize: '0.8rem' }}>
                  {Math.round(chunk.similarity_score * 100)}% Cosine Match
                </span>
              )}
            </div>

            <div style={{ background: '#070a10', padding: '0.85rem', borderRadius: 'var(--radius-sm)', fontSize: '0.825rem', fontFamily: 'var(--font-mono)', color: '#cbd5e1', lineHeight: 1.6, marginBottom: '0.75rem' }}>
              {chunk.content}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <div>
                Prerequisites: <strong>{chunk.prerequisites?.join(', ') || 'Foundations'}</strong>
              </div>
              <div>
                Tokens: <strong>~{chunk.token_count}</strong> | Chunk ID: <code>{chunk.chunk_id}</code>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Manual Ingest Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Upload size={20} color="var(--accent-teal)" />
                Ingest Academic Syllabus / Textbook Excerpt
              </h3>
              <button 
                onClick={() => setShowAddModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>

            {uploadSuccess ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                <CheckCircle size={40} color="#10b981" style={{ margin: '0 auto 0.75rem auto' }} />
                <h4>Document Successfully Chunked & Indexed!</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Vectors registered into live Cosine store.</p>
              </div>
            ) : (
              <form onSubmit={handleManualIngest} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 600 }}>
                    Document Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Distributed Consensus & Raft Protocol"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-medium)',
                      color: 'var(--text-primary)',
                      padding: '0.55rem 0.75rem',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 600 }}>
                    Academic Subject
                  </label>
                  <select
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-medium)',
                      color: 'var(--text-primary)',
                      padding: '0.55rem 0.75rem',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.85rem'
                    }}
                  >
                    <option value="Computer Science">Computer Science</option>
                    <option value="Machine Learning">Machine Learning</option>
                    <option value="Applied Mathematics">Applied Mathematics</option>
                    <option value="Database Systems">Database Systems</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 600 }}>
                    Curriculum Content (Markdown/Text)
                  </label>
                  <textarea
                    rows={6}
                    required
                    placeholder="Paste textbook definitions, algorithms, or problem templates here..."
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-medium)',
                      color: 'var(--text-primary)',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.85rem',
                      fontFamily: 'var(--font-mono)'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Embed & Index Chunk
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
