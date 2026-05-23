#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BACKEND_ROOT="${BACKEND_ROOT:-$PROJECT_ROOT/backend}"
VENV_PATH="${VENV_PATH:-$PROJECT_ROOT/.venv}"
cd "$BACKEND_ROOT"

export DJANGO_SETTINGS_MODULE="${DJANGO_SETTINGS_MODULE:-config.settings_production}"

exec "$VENV_PATH/bin/python" -m celery -A config worker \
  -l info \
  -Q default,cache_ops \
  --hostname "worker-ops@%h"
