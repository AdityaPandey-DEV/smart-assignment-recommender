"""
Integration tests for FastAPI endpoints.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "Smart Assignment Recommender" in data["project"]

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"

def test_get_students():
    response = client.get("/api/students")
    assert response.status_code == 200
    students = response.json()
    assert len(students) >= 3
    names = [s["name"] for s in students]
    assert "Alex Chen" in names

def test_diagnose_student_endpoint():
    response = client.get("/api/students/student_alex_chen/diagnose")
    assert response.status_code == 200
    report = response.json()
    assert report["student_id"] == "student_alex_chen"
    assert len(report["primary_gaps"]) > 0

def test_rag_stats_and_search():
    stats_resp = client.get("/api/rag/stats")
    assert stats_resp.status_code == 200
    stats = stats_resp.json()
    assert stats["total_chunks"] > 0

    search_resp = client.post("/api/rag/search", json={
        "query": "Dynamic programming optimal substructure",
        "top_k": 2
    })
    assert search_resp.status_code == 200
    search_data = search_resp.json()
    assert len(search_data["results"]) > 0

def test_generate_recommendation():
    resp = client.post("/api/recommendations/generate", json={
        "student_id": "student_alex_chen",
        "topic_id": "dsa_dynamic_programming",
        "num_problems": 3
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    asgn = data["assignment"]
    assert "Dynamic Programming" in asgn["topic_name"]
    assert len(asgn["scaffolded_problems"]) == 3
    assert len(asgn["citations"]) > 0
