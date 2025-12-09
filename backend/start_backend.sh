#!/bin/bash
# Activate the Python virtual environment and start the FastAPI backend
cd "$(dirname "$0")"
if [ -d "../.venv" ]; then
  source ../.venv/bin/activate
elif [ -d ".venv" ]; then
  source .venv/bin/activate
else
  echo "No .venv found. Please create a virtual environment in the project root or backend directory."
  exit 1
fi
uvicorn app.main:app --reload 

