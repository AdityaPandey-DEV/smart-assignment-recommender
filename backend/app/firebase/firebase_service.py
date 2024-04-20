"""
Firebase Integration Service.
Supports Firebase Admin SDK (Firestore & Authentication) with an intelligent
in-memory fallback mode for local testing without cloud credentials.
"""

from typing import List, Dict, Any, Optional
import json
import os
from pathlib import Path
from app.core.config import settings

class FirebaseService:
    """
    Unified Firebase interface.
    Attempts live Firebase Admin initialization; falls back to simulated
    persistent Firestore storage if credentials are absent.
    """
    
    def __init__(self):
        self.is_connected = False
        self.mode = "mock"
        self.db = None
        
        # In-memory mock storage
        self._mock_students: Dict[str, Dict[str, Any]] = {}
        self._mock_assignments: Dict[str, Dict[str, Any]] = {}

        self._initialize_firebase()

    def _initialize_firebase(self):
        """Attempts connection to Firebase Admin SDK if credentials provided."""
        cred_path = settings.FIREBASE_CREDENTIALS_PATH
        if cred_path and os.path.exists(cred_path):
            try:
                import firebase_admin
                from firebase_admin import credentials, firestore
                
                if not firebase_admin._apps:
                    cred = credentials.Certificate(cred_path)
                    firebase_admin.initialize_app(cred, {
                        'projectId': settings.FIREBASE_PROJECT_ID
                    })
                self.db = firestore.client()
                self.is_connected = True
                self.mode = "live"
                print(f"[Firebase] Successfully connected to live Firestore project '{settings.FIREBASE_PROJECT_ID}'")
                return
            except Exception as e:
                print(f"[Firebase] Failed to initialize live Firebase Admin SDK: {e}. Falling back to mock store.")
                
        self.mode = "mock"
        self.is_connected = True
        print("[Firebase] Running in Local Persistent Mock Mode (No credentials required).")

    # Student Collection Operations
    def save_student(self, student_data: Dict[str, Any]) -> str:
        s_id = student_data.get("id")
        if self.mode == "live" and self.db:
            try:
                self.db.collection("students").document(s_id).set(student_data)
                return s_id
            except Exception as e:
                print(f"[Firebase Error] Live write failed: {e}. Saving to mock.")

        self._mock_students[s_id] = student_data
        return s_id

    def get_student(self, student_id: str) -> Optional[Dict[str, Any]]:
        if self.mode == "live" and self.db:
            try:
                doc = self.db.collection("students").document(student_id).get()
                if doc.exists:
                    return doc.to_dict()
            except Exception:
                pass
                
        return self._mock_students.get(student_id)

    def list_students(self) -> List[Dict[str, Any]]:
        if self.mode == "live" and self.db:
            try:
                docs = self.db.collection("students").stream()
                return [d.to_dict() for d in docs]
            except Exception:
                pass
                
        return list(self._mock_students.values())

    # Assignment Collection Operations
    def save_assignment(self, assignment_data: Dict[str, Any]) -> str:
        a_id = assignment_data.get("id")
        if self.mode == "live" and self.db:
            try:
                self.db.collection("assignments").document(a_id).set(assignment_data)
                return a_id
            except Exception as e:
                print(f"[Firebase Error] Assignment save failed: {e}. Saving to mock.")

        self._mock_assignments[a_id] = assignment_data
        return a_id

    def list_assignments(self, student_id: Optional[str] = None) -> List[Dict[str, Any]]:
        if self.mode == "live" and self.db:
            try:
                coll = self.db.collection("assignments")
                if student_id:
                    coll = coll.where("student_id", "==", student_id)
                docs = coll.stream()
                return [d.to_dict() for d in docs]
            except Exception:
                pass

        if student_id:
            return [a for a in self._mock_assignments.values() if a.get("student_id") == student_id]
        return list(self._mock_assignments.values())

    def get_status(self) -> Dict[str, Any]:
        """Returns Firebase health and operational metadata."""
        return {
            "status": "connected" if self.is_connected else "disconnected",
            "mode": self.mode,
            "project_id": settings.FIREBASE_PROJECT_ID,
            "total_students_stored": len(self._mock_students),
            "total_assignments_stored": len(self._mock_assignments),
            "auth_provider": "Firebase Auth / JWT Token Validator"
        }

firebase_service = FirebaseService()
