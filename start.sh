#!/bin/bash
# ========================================================
# Smart Assignment Recommender (RAG System) - Quickstart
# ========================================================

set -e

echo "🚀 Starting Smart Assignment Recommender (RAG System)..."

# Check Python and Node
command -v python3 >/dev/null 2>&1 || { echo "Python 3 is required but not installed."; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "npm is required but not installed."; exit 1; }

# Setup backend venv if not present
if [ ! -d "backend_venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv backend_venv
    backend_venv/bin/pip install --upgrade pip
    backend_venv/bin/pip install -r backend/requirements.txt
fi

# Run backend in background
echo "⚡ Launching FastAPI Backend on http://localhost:8000..."
(cd backend && PYTHONPATH=. ../backend_venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload) &
BACKEND_PID=$!

# Trap exit to cleanup background processes
trap "kill $BACKEND_PID 2>/dev/null || true; exit" SIGINT SIGTERM EXIT

# Start frontend
echo "🎨 Starting Vite React Frontend on http://localhost:5173..."
cd frontend
npm run dev
