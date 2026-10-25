#!/usr/bin/env bash
# ==============================================================================
# ResumeIQ Development Startup Script
# Starts FastAPI backend (port 8000) and Vite frontend (port 5173/5174/etc.)
# Handles graceful shutdown on Ctrl+C (SIGINT/SIGTERM).
# ==============================================================================

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

echo "=========================================================="
echo " Starting ResumeIQ Full-Stack Development Environment     "
echo "=========================================================="

# 1. Check Python virtual environment
if [ ! -d "$BACKEND_DIR/.venv" ]; then
  echo "Error: Backend virtual environment not found at $BACKEND_DIR/.venv"
  echo "Please set up the venv first: python3 -m venv backend/.venv && backend/.venv/bin/pip install -r backend/requirements.txt"
  exit 1
fi

# 2. Check Node modules
if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
  echo "Error: Frontend node_modules not found at $FRONTEND_DIR/node_modules"
  echo "Please install dependencies first: cd frontend && npm install"
  exit 1
fi

# Function to clean up child processes on exit
cleanup() {
  echo ""
  echo "Shutting down ResumeIQ services..."
  if [ -n "$BACKEND_PID" ]; then
    kill "$BACKEND_PID" 2>/dev/null || true
  fi
  if [ -n "$FRONTEND_PID" ]; then
    kill "$FRONTEND_PID" 2>/dev/null || true
  fi
  wait 2>/dev/null || true
  echo "All services stopped."
}

trap cleanup EXIT INT TERM

# Start FastAPI backend
echo "Starting FastAPI backend on http://127.0.0.1:8000 ..."
cd "$BACKEND_DIR"
"$BACKEND_DIR/.venv/bin/uvicorn" app.main:app --host 127.0.0.1 --port 8000 --reload &
BACKEND_PID=$!

# Wait briefly for backend to initialize
sleep 2

# Start Vite frontend
echo "Starting Vite frontend..."
cd "$FRONTEND_DIR"
npm run dev -- --host 0.0.0.0 &
FRONTEND_PID=$!

echo ""
echo "=========================================================="
echo " ResumeIQ is running!"
echo " - Backend API:  http://127.0.0.1:8000"
echo " - API Docs:     http://127.0.0.1:8000/docs"
echo " - Health Check: http://127.0.0.1:8000/api/v1/health"
echo " - Frontend App: http://localhost:5173 (or assigned Vite port)"
echo " Press Ctrl+C at any time to shut down both services."
echo "=========================================================="

# Wait for both child processes
wait
