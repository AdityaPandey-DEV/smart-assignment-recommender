import React from 'react';
import { Sparkles, Cpu, BookOpen, BarChart3, Database, UserCheck, Layers } from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  students,
  selectedStudent,
  setSelectedStudent,
  systemStatus
}) {
  return (
    <header className="navbar">
      <div className="navbar-content">
        {/* Brand */}
        <div className="brand-section" onClick={() => setActiveTab('students')}>
          <div className="brand-icon">
            <Sparkles size={24} color="#ffffff" />
          </div>
          <div>
            <h1 className="brand-title">Smart Assignment Recommender</h1>
            <div className="brand-subtitle">RAG Adaptive Learning Platform</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="nav-links">
          <button
            className={`nav-tab-btn ${activeTab === 'students' ? 'active' : ''}`}
            onClick={() => setActiveTab('students')}
          >
            <UserCheck size={16} />
            Student Hub
          </button>
          <button
            className={`nav-tab-btn ${activeTab === 'generator' ? 'active' : ''}`}
            onClick={() => setActiveTab('generator')}
          >
            <Layers size={16} />
            RAG Studio
          </button>
          <button
            className={`nav-tab-btn ${activeTab === 'knowledge' ? 'active' : ''}`}
            onClick={() => setActiveTab('knowledge')}
          >
            <BookOpen size={16} />
            Knowledge Base
          </button>
          <button
            className={`nav-tab-btn ${activeTab === 'telemetry' ? 'active' : ''}`}
            onClick={() => setActiveTab('telemetry')}
          >
            <BarChart3 size={16} />
            Telemetry & Benchmark
          </button>
        </nav>

        {/* Right Actions: Persona Selector & Status Pill */}
        <div className="nav-actions">
          {/* Persona Switcher */}
          <div className="persona-selector">
            <span style={{ color: 'var(--text-muted)' }}>Persona:</span>
            <select
              className="persona-select"
              value={selectedStudent?.id || ''}
              onChange={(e) => {
                const found = students.find((s) => s.id === e.target.value);
                if (found) setSelectedStudent(found);
              }}
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.target_role.split(' ')[0]})
                </option>
              ))}
            </select>
          </div>

          {/* System Status Pill */}
          <div className="status-pill online" title="Backend operational with in-memory & Firestore vectors">
            <span className="status-dot"></span>
            <span>RAG Core Active</span>
          </div>
        </div>
      </div>
    </header>
  );
}
