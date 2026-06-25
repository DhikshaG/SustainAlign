#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────────────────────
# SustainAlign — health check script
# Usage: bash scripts/health-check.sh [--wait 60] [--host localhost]
# ──────────────────────────────────────────────────────────────

HOST="${HEALTH_CHECK_HOST:-localhost}"
TIMEOUT="${HEALTH_CHECK_TIMEOUT:-60}"
INTERVAL=5
ELAPSED=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --wait)  TIMEOUT="$2"; shift 2 ;;
    --host)  HOST="$2";    shift 2 ;;
    *)       echo "Unknown arg: $1"; exit 1 ;;
  esac
done

check_backend() {
  curl -sf "http://${HOST}:3001/api/health" > /dev/null 2>&1
}

check_frontend() {
  curl -sf "http://${HOST}:80" > /dev/null 2>&1
}

echo "==> Health check — ${HOST}"
echo "    Timeout: ${TIMEOUT}s"

while [ $ELAPSED -lt $TIMEOUT ]; do
  BACKEND_OK=false
  FRONTEND_OK=false

  if check_backend; then
    BACKEND_OK=true
  fi

  if check_frontend; then
    FRONTEND_OK=true
  fi

  if $BACKEND_OK && $FRONTEND_OK; then
    echo "    Backend: OK"
    echo "    Frontend: OK"
    echo "    All checks passed"
    exit 0
  fi

  ELAPSED=$((ELAPSED + INTERVAL))
  sleep $INTERVAL
done

echo "    Backend: $($BACKEND_OK && echo "OK" || echo "FAIL")"
echo "    Frontend: $($FRONTEND_OK && echo "OK" || echo "FAIL")"
echo "    Health check timed out after ${TIMEOUT}s"
exit 1
