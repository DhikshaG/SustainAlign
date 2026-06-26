#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────────────────────
# SustainAlign — rollback to previous release
# Supports both SQLite and Postgres deployments.
#
# Usage:
#   bash scripts/rollback.sh [--soft]   # roll back to previous release
#
#   --soft : skip database restore (code only)
# ──────────────────────────────────────────────────────────────

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
SOFT_ROLLBACK=false

if [[ "${1:-}" == "--soft" ]]; then
  SOFT_ROLLBACK=true
fi

RELEASES_DIR="${APP_DIR}/releases"

if [[ ! -d "$RELEASES_DIR" ]] || [[ -z "$(ls -A "$RELEASES_DIR")" ]]; then
  echo "No releases found at ${RELEASES_DIR}"
  exit 1
fi

CURRENT=$(readlink -f "${APP_DIR}/current" 2>/dev/null || echo "")
PREVIOUS=$(ls -dt "${RELEASES_DIR}"/*/ | head -2 | tail -1 || echo "")

if [[ -z "$PREVIOUS" ]] || [[ "$PREVIOUS" == "$CURRENT" ]]; then
  echo "No previous release to rollback to"
  exit 1
fi

CURRENT_NAME=$(basename "${CURRENT}")
PREVIOUS_NAME=$(basename "${PREVIOUS}")

echo "==> Rolling back from ${CURRENT_NAME} to ${PREVIOUS_NAME}"

if [[ "$SOFT_ROLLBACK" != "true" ]]; then
  DB_DIALECT="${DB_DIALECT:-sqlite}"
  SHARED_DIR="${APP_DIR}/shared"
  BACKUP_DIR="${APP_DIR}/backups"

  if [[ -d "$BACKUP_DIR" ]]; then
    if [[ "$DB_DIALECT" == "pg" ]]; then
      LATEST=$(ls -t "${BACKUP_DIR}"/*.pgdump 2>/dev/null | head -1 || echo "")
      if [[ -n "$LATEST" ]]; then
        echo "==> Restoring Postgres database from latest backup..."
        PG_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/sustainalign}"
        pg_restore --clean --if-exists --no-owner --no-acl -d "${PG_URL}" "$LATEST"
        echo "    database restored from: $(basename "$LATEST")"
      fi
    else
      LATEST=$(ls -t "${BACKUP_DIR}"/*.db 2>/dev/null | head -1 || echo "")
      if [[ -n "$LATEST" ]]; then
        echo "==> Restoring SQLite database from latest backup..."
        cp "$LATEST" "${SHARED_DIR}/data/sustainalign.db"
        echo "    database restored from: $(basename "$LATEST")"
      fi
    fi
  fi
fi

echo "==> Switching symlink..."
ln -sfn "${PREVIOUS}" "${APP_DIR}/current"

echo "==> Restarting containers..."
cd "${APP_DIR}/current"
if [ -f docker-compose.prod.yml ]; then
  docker compose -f docker-compose.yml -f docker-compose.prod.yml up --detach --remove-orphans
else
  docker compose up --detach --remove-orphans
fi

echo "==> Waiting for health check..."
for i in $(seq 1 12); do
  sleep 5
  if curl -sf http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "    Rollback to ${PREVIOUS_NAME} complete"
    exit 0
  fi
  echo "    Attempt ${i}/12..."
done

echo "    Health check failed after 60s — manual intervention required"
exit 1
