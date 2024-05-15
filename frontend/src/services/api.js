/**
 * Production API Client for FastAPI RAG Backend.
 * Directly communicates with live backend endpoints:
 * - /api/students
 * - /api/rag
 * - /api/recommendations
 * - /api/analytics
 */

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const isFormData = options.body instanceof FormData;
  
  const headers = isFormData ? {} : { 'Content-Type': 'application/json' };
  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (!response.ok) {
    let errorDetail = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const errJson = await response.json();
      if (errJson.detail) errorDetail = errJson.detail;
    } catch (_) {}
    throw new Error(errorDetail);
  }

  return await response.json();
}

export const api = {
  // Students
  getStudents() {
    return request('/students');
  },

  getStudent(id) {
    return request(`/students/${id}`);
  },

  diagnoseStudent(id) {
    return request(`/students/${id}/diagnose`);
  },

  submitQuiz(studentId, quizData) {
    return request(`/students/${studentId}/submit-quiz`, {
      method: 'POST',
      body: JSON.stringify(quizData)
    });
  },

  // RAG Knowledge Base
  getRagStats() {
    return request('/rag/stats');
  },

  getRagDocuments(topicId = null, limit = 50) {
    const query = topicId ? `?topic_id=${encodeURIComponent(topicId)}&limit=${limit}` : `?limit=${limit}`;
    return request(`/rag/documents${query}`);
  },

  searchRag(query, topK = 4, filters = {}) {
    return request('/rag/search', {
      method: 'POST',
      body: JSON.stringify({ query, top_k: topK, ...filters })
    });
  },

  uploadDocument(formData) {
    return request('/rag/upload', {
      method: 'POST',
      body: formData
    });
  },

  // Recommendations
  generateAssignment(payload) {
    return request('/recommendations/generate', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  getAssignmentHistory(studentId = null) {
    const query = studentId ? `?student_id=${encodeURIComponent(studentId)}` : '';
    return request(`/recommendations/history${query}`);
  },

  getAssignment(assignmentId) {
    return request(`/recommendations/${assignmentId}`);
  },

  // Analytics & Telemetry
  getOverview() {
    return request('/analytics/overview');
  },

  runBenchmark() {
    return request('/analytics/benchmark');
  },

  async checkHealth() {
    try {
      const res = await fetch('http://localhost:8000/health');
      if (res.ok) return await res.json();
    } catch (_) {}
    return null;
  }
};
