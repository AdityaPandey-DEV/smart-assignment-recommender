.PHONY: help install test dev backend frontend build docker clean

help:
	@echo "Available commands:"
	@echo "  make install    Install backend and frontend dependencies"
	@echo "  make test       Run backend pytest suite"
	@echo "  make dev        Run local development environment (backend + frontend)"
	@echo "  make backend    Run FastAPI backend server"
	@echo "  make frontend   Run Vite frontend dev server"
	@echo "  make build      Build frontend production assets"
	@echo "  make docker     Build and launch Docker Compose containers"
	@echo "  make clean      Remove build artifacts and cache files"

install:
	python3 -m venv backend_venv
	backend_venv/bin/pip install --upgrade pip
	backend_venv/bin/pip install -r backend/requirements.txt
	cd frontend && npm install

test:
	cd backend && PYTHONPATH=. ../backend_venv/bin/pytest tests/ -v

backend:
	cd backend && PYTHONPATH=. ../backend_venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

frontend:
	cd frontend && npm run dev

build:
	cd frontend && npm run build

docker:
	docker-compose up --build

clean:
	rm -rf backend_venv frontend/dist frontend/node_modules .pytest_cache backend/__pycache__
