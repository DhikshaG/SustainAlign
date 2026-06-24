#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────────────────────
# SustainAlign — one-command production deploy script
# Usage:
#   Local:  bash scripts/deploy.sh [--skip-migrate] [--no-backup]
#   Remote: bash scripts/deploy.sh --remote /path/to/app [--skip-migrate]
#
# Environment variables:
#   DEPLOY_BRANCH  Branch to deploy (default: main)
#   APP_DIR        Application directory (overrides --remote path)
# ──────────────────────────────────────────────────────────────

DEPLOY_BRANCH="${DEPLOY_BRANCH:-main}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
SKIP_MIGRATE=false
SKIP_BACKUP=false
APP_DIR=""

# ── Parse arguments ───────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-migrate) SKIP_MIGRATE=true; shift ;;
    --no-backup)    SKIP_BACKUP=true;  shift ;;
    --remote)       APP_DIR="$2";      shift 2 ;;
    *)              echo "Unknown arg: $1"; exit 1 ;;
  esac
done

# If APP_DIR not set, derive from script location (local run)
if [[ -z "$APP_DIR" ]]; then
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  APP_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
fi

BACKUP_DIR="${APP_DIR}/backups"

echo "==> SustainAlign Deploy — ${TIMESTAMP}"
echo "==> App directory: ${APP_DIR}"
echo "==> Branch: ${DEPLOY_BRANCH}"

# ── 1. Pull latest code ──────────────────────────────────────
echo "==> Pulling latest code from ${DEPLOY_BRANCH}..."
cd "${APP_DIR}"
git fetch origin "${DEPLOY_BRANCH}"
git reset --hard "origin/${DEPLOY_BRANCH}"

# ── 2. Backup SQLite database ─────────────────────────────────
if [[ "$SKIP_BACKUP" != "true" ]]; then
  echo "==> Backing up SQLite database..."
  mkdir -p "${BACKUP_DIR}"
  if [ -f "${APP_DIR}/backend/data/sustainalign.db" ]; then
    cp "${APP_DIR}/backend/data/sustainalign.db" "${BACKUP_DIR}/sustainalign_${TIMESTAMP}.db"
    ls -t "${BACKUP_DIR}"/sustainalign_*.db | tail -n +8 | xargs -r rm
    echo "    → backup saved: ${BACKUP_DIR}/sustainalign_${TIMESTAMP}.db"
  else
    echo "    → no database found, skipping backup"
  fi
fi

# ── 3. Build and restart containers ──────────────────────────
echo "==> Rebuilding and restarting containers..."
cd "${APP_DIR}"
if [ -f docker-compose.prod.yml ]; then
  docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
else
  docker compose up --build -d
fi

# ── 4. Run database migrations ───────────────────────────────
if [[ "$SKIP_MIGRATE" != "true" ]]; then
  echo "==> Running database migrations..."
  docker compose exec -T backend sh -c "npm run db:migrate 2>/dev/null" || \
    echo "    ⚠️  Migration command not found — check your backend setup"
fi

# ── 5. Clean up old Docker images ────────────────────────────
echo "==> Cleaning up unused Docker resources..."
docker system prune -f --filter "until=72h" 2>/dev/null || true

# ── 6. Health check ──────────────────────────────────────────
echo "==> Waiting for health check..."
for i in $(seq 1 12); do
  sleep 5
  if curl -sf http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "    ✅ Health check passed"
    exit 0
  fi
  echo "    Attempt ${i}/12..."
done

echo "    ❌ Health check failed after 60s"
exit 1
