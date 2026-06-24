#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────────────────────
# SustainAlign — one-command production deploy script
# Usage: bash scripts/deploy.sh [--no-backup] [--skip-migrate]
#
# Prerequisites:
#   - Docker + docker compose installed on the target VM
#   - backend/.env exists with production secrets
#   - Git is set up and authenticated
# ──────────────────────────────────────────────────────────────

DEPLOY_BRANCH="${DEPLOY_BRANCH:-main}"
APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_DIR="${APP_DIR}/backups"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"

echo "==> SustainAlign Deploy — ${TIMESTAMP}"
echo "==> App directory: ${APP_DIR}"
echo "==> Branch: ${DEPLOY_BRANCH}"

# ── 1. Pull latest code ──────────────────────────────────────
echo "==> Pulling latest code from ${DEPLOY_BRANCH}..."
cd "${APP_DIR}"
git fetch origin "${DEPLOY_BRANCH}"
git reset --hard "origin/${DEPLOY_BRANCH}"

# ── 2. Backup database (unless --no-backup) ──────────────────
if [[ "${1:-}" != "--no-backup" ]]; then
  echo "==> Backing up SQLite database..."
  mkdir -p "${BACKUP_DIR}"
  if [ -f backend/data/sustainalign.db ]; then
    cp backend/data/sustainalign.db "${BACKUP_DIR}/sustainalign_${TIMESTAMP}.db"
    # Keep last 7 backups, remove older
    ls -t "${BACKUP_DIR}"/sustainalign_*.db | tail -n +8 | xargs -r rm
    echo "    → backup saved: ${BACKUP_DIR}/sustainalign_${TIMESTAMP}.db"
  else
    echo "    → no database found, skipping backup"
  fi
fi

# ── 3. Build and restart containers ──────────────────────────
echo "==> Rebuilding and restarting containers..."
if [ -f docker-compose.prod.yml ]; then
  docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
else
  docker compose up --build -d
fi

# ── 4. Run database migrations ───────────────────────────────
if [[ "${*}" != *"--skip-migrate"* ]]; then
  echo "==> Running database migrations..."
  docker compose exec -T backend node src/db/migrate.js 2>/dev/null || \
    docker compose exec -T backend npm run db:migrate || \
    echo "    ⚠️  migrate command not found — check your backend setup"
fi

# ── 5. Clean up old images ───────────────────────────────────
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
