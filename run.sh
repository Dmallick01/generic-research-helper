#!/usr/bin/env bash
# Research Helper — One-Command Setup & Run

set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT/backend"

echo ""
echo "  ╔═══════════════════════════════════════╗"
echo "  ║   Research Helper — RAG Backend       ║"
echo "  ╚═══════════════════════════════════════╝"
echo ""

if [ ! -d ".venv" ]; then
  echo "  Creating virtual environment..."
  python3 -m venv .venv
fi

source .venv/bin/activate
pip install -q -r requirements.txt

if [ ! -f ".env" ]; then
  cp .env.example .env
  echo "  Created backend/.env — add your ANTHROPIC_API_KEY"
fi

echo "  Starting Research Helper backend on http://localhost:8000"
echo "  Open vault-ui/index.html for the pipeline UI"
echo "  API docs: http://localhost:8000/docs"
echo ""

uvicorn main:app --reload --host 0.0.0.0 --port 8000
