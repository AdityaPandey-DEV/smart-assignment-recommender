import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import StudentDashboard from './components/StudentDashboard';
import RecommenderStudio from './components/RecommenderStudio';
import KnowledgeBaseExplorer from './components/KnowledgeBaseExplorer';
import SystemDiagnostics from './components/SystemDiagnostics';
import { api } from './services/api';
import { AlertCircle, RefreshCw, Terminal, Layers } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('students'); // students, generator, knowledge, telemetry
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [diagnostic, setDiagnostic] = useState(null);
  const [targetTopicForGen, setTargetTopicForGen] = useState(null);
  const [systemOverview, setSystemOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedStudent?.id) {
      loadStudentDiagnostic(selectedStudent.id);
    }
  }, [selectedStudent]);

  const loadInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const studentList = await api.getStudents();
      if (Array.isArray(studentList) && studentList.length > 0) {
        setStudents(studentList);
        setSelectedStudent(studentList[0]);
        const diag = await api.diagnoseStudent(studentList[0].id);
        setDiagnostic(diag);
      } else {
        setStudents([]);
      }

      const overview = await api.getOverview();
      setSystemOverview(overview);
    } catch (err) {
      console.error("Failed to connect to backend:", err);
      setError(err.message || "Failed to connect to FastAPI backend server");
    } finally {
      setLoading(false);
    }
  };

  const loadStudentDiagnostic = async (studentId) => {
    try {
      const diag = await api.diagnoseStudent(studentId);
      setDiagnostic(diag);
    } catch (err) {
      console.error("Failed to diagnose student:", err);
    }
  };

  const handleSelectTopicForGeneration = (topicId) => {
    setTargetTopicForGen(topicId);
    setActiveTab('generator');
  };

  const handleRefreshStudent = async () => {
    if (selectedStudent?.id) {
      try {
        const refreshed = await api.getStudent(selectedStudent.id);
        setSelectedStudent(refreshed);
        loadStudentDiagnostic(refreshed.id);
        const overview = await api.getOverview();
        setSystemOverview(overview);
      } catch (err) {
        console.error("Failed to refresh student:", err);
      }
    }
  };

  return (
    <div className="app-root">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        students={students}
        selectedStudent={selectedStudent}
        setSelectedStudent={setSelectedStudent}
        systemStatus={systemOverview}
      />

      <main className="app-container">
        {/* Backend Offline / Connection Alert */}
        {error && (
          <div 
            className="glass-panel" 
            style={{ 
              padding: '1.25rem 1.5rem', 
              marginBottom: '1.5rem', 
              borderLeft: '4px solid var(--accent-rose)',
              background: 'rgba(244, 63, 94, 0.08)' 
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <AlertCircle size={22} color="var(--accent-rose)" />
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>
                    FastAPI Backend Disconnected
                  </h4>
                  <p style={{ fontSize: '0.825rem', color: '#fda4af', marginTop: '0.15rem' }}>
                    {error}. Ensure the Python backend server is running on <code>http://localhost:8000</code>.
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <code style={{ fontSize: '0.75rem', background: '#070a10', padding: '0.35rem 0.65rem', borderRadius: 4, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Terminal size={12} /> ./start.sh
                </code>
                <button 
                  className="btn btn-secondary" 
                  onClick={loadInitialData}
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                >
                  <RefreshCw size={13} />
                  Retry Connection
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '5rem 1rem' }}>
            <div className="spin" style={{ display: 'inline-block', marginBottom: '1rem' }}>
              <Layers size={36} color="var(--accent-primary)" />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Connecting to RAG Knowledge Engine...</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Fetching student skill vectors and curriculum document embeddings from FastAPI backend.
            </p>
          </div>
        ) : (
          <>
            {activeTab === 'students' && (
              <StudentDashboard
                student={selectedStudent}
                diagnostic={diagnostic}
                onSelectTopicForGeneration={handleSelectTopicForGeneration}
                onRefreshStudent={handleRefreshStudent}
              />
            )}

            {activeTab === 'generator' && (
              <RecommenderStudio
                student={selectedStudent}
                diagnostic={diagnostic}
                initialTopicId={targetTopicForGen}
                onAssignmentGenerated={() => {
                  api.getOverview().then(setSystemOverview).catch(() => {});
                }}
              />
            )}

            {activeTab === 'knowledge' && (
              <KnowledgeBaseExplorer />
            )}

            {activeTab === 'telemetry' && (
              <SystemDiagnostics overview={systemOverview} />
            )}
          </>
        )}
      </main>
    </div>
  );
}
