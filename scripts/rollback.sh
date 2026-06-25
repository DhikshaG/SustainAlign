#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────────────────────
# SustainAlign — rollback to previous release
# Usage:
#   bash scripts/rollback.sh              # rollback to previous release
#   bash scripts/rollback.sh --list       # list available releases
#   bash scripts/rollback.sh <timestamp>  # rollback to specific release
# ──────────────────────────────────────────────────────────────

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RELEASES_DIR="${APP_DIR}/releases"

if [[ ! -d "$RELEASES_DIR" ]]; then
  echo "No releases directory found at ${RELEASES_DIR}"
  exit 1
fi

RELEASES=($(ls -dt "${RELEASES_DIR}"/*/ 2>/dev/null || true))

if [[ ${#RELEASES[@]} -eq 0 ]]; then
  echo "No releases found"
  exit 1
fi

if [[ "$1" == "--list" ]]; then
  echo "Available releases:"
  for r in "${RELEASES[@]}"; do
    NAME=$(basename "$r")
    if [ "$(readlink -f "${APP_DIR}/current")" = "$(readlink -f "$r")" ]; then
      echo "  * $NAME (current)"
    else
      echo "    $NAME"
    fi
  done
  exit 0
fi

TARGET_RELEASE=""
if [[ -n "$1" ]]; then
  TARGET_RELEASE="${RELEASES_DIR}/$1"
  if [[ ! -d "$TARGET_RELEASE" ]]; then
    echo "Release '$1' not found. Use --list to see available releases."
    exit 1
  fi
else
  if [[ ${#RELEASES[@]} -lt 2 ]]; then
    echo "No previous release to rollback to"
    exit 1
  fi
  TARGET_RELEASE="${RELEASES[1]}"
fi

echo "==> Rolling back to $(basename "$TARGET_RELEASE")"
ln -sfn "$TARGET_RELEASE" "${APP_DIR}/current"

cd "${APP_DIR}/current"

echo "==> Restarting containers..."
if [ -f docker-compose.prod.yml ]; then
  docker compose -f docker-compose.yml -f docker-compose.prod.yml up --detach --remove-orphans
else
  docker compose up --detach --remove-orphans
fi

echo "==> Waiting for health check..."
for i in $(seq 1 12); do
  sleep 5
  if curl -sf http://localhost:3001/api/health > /dev/null 2>&1; then
    echo " Rollback complete — $(basename "$TARGET_RELEASE")"
    exit 0
  fi
  echo "  Attempt ${i}/12..."
done

echo "  Rollback health check failed"
exit 1
