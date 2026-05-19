#!/bin/bash
# start.sh — dev startup script for AllCanLearn

set -e

cd "$(dirname "${BASH_SOURCE[0]}")"

# Activate venv if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Check .env exists
if [ ! -f ".env" ]; then
    echo "No .env found — copying from .env.example"
    cp .env.example .env
    echo "Edit .env and add your GROQ_API_KEY, then re-run."
    exit 1
fi

# Create storage dirs
mkdir -p tts_output

echo "Starting AllCanLearn on http://localhost:8000"
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
