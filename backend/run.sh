#!/usr/bin/env bash
set -euo pipefail

# Determine absolute path to backend directory (script's directory)
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"

# Optional: activate repo-root venv if present
if [ -d "${SCRIPT_DIR}/../.venv" ]; then
  # shellcheck disable=SC1091
  source "${SCRIPT_DIR}/../.venv/bin/activate"
fi

# Start FastAPI using the backend directory as the app dir
exec uvicorn app.main:app --app-dir "${SCRIPT_DIR}" --host 0.0.0.0 --port 8000 --reload