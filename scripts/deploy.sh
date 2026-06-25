#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────────────────────
# SustainAlign — one-command production deploy script
# Usage:
#   Local:  bash scripts/deploy.sh [--env prod] [--skip-migrate] [--no-backup]
#   Remote: bash scripts/deploy.sh --remote /path/to/app --env staging
#
# Environment variables:
#   DEPLOY_BRANCH  Branch to deploy (default: main)
#   APP_DIR        Application directory (overrides --remote path)
# ──────────────────────────────────────────────────────────────

DEPLOY_BRANCH="${DEPLOY_BRANCH:-main}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
SKIP_MIGRATE=false
SKIP_BACKUP=false
SKIP_BUILD=false
APP_DIR=""
ENVIRONMENT="production"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-migrate) SKIP_MIGRATE=true; shift ;;
    --no-backup)    SKIP_BACKUP=true;  shift ;;
    --skip-build)   SKIP_BUILD=true;   shift ;;
    --env)          ENVIRONMENT="$2";  shift 2 ;;
    --remote)       APP_DIR="$2";      shift 2 ;;
    --rollback)     echo "Use scripts/rollback.sh for rollback"; exit 0 ;;
    *)              echo "Unknown arg: $1"; exit 1 ;;
  esac
done

if [[ -z "$APP_DIR" ]]; then
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  APP_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
fi

BACKUP_DIR="${APP_DIR}/backups"
RELEASE_DIR="${APP_DIR}/releases/${TIMESTAMP}"
SHARED_DIR="${APP_DIR}/shared"

echo "==> SustainAlign Deploy [${ENVIRONMENT}] — ${TIMESTAMP}"
echo "==> App directory: ${APP_DIR}"
echo "==> Branch: ${DEPLOY_BRANCH}"

# ── 0. Pre-flight checks ────────────────────────────────────
command -v docker >/dev/null 2>&1 || { echo "Docker is required"; exit 1; }
command -v git >/dev/null 2>&1    || { echo "Git is required"; exit 1; }

# ── 1. Pull latest code into release dir ─────────────────────
echo "==> Fetching latest code..."
mkdir -p "${RELEASE_DIR}"
git archive --format=tar --remote="$(git config --get remote.origin.url)" \
  "${DEPLOY_BRANCH}" 2>/dev/null | tar xf - -C "${RELEASE_DIR}" || {
  # Fallback: clone shallow
  git clone --depth 1 --branch "${DEPLOY_BRANCH}" \
    "$(git config --get remote.origin.url)" "${RELEASE_DIR}"
}

ln -sfn "${RELEASE_DIR}" "${APP_DIR}/current"

cd "${APP_DIR}/current"

# ── 2. Backup SQLite database ─────────────────────────────────
if [[ "$SKIP_BACKUP" != "true" ]]; then
  echo "==> Backing up SQLite database..."
  mkdir -p "${BACKUP_DIR}"
  DB_PATH="${SHARED_DIR}/data/sustainalign.db"
  if [ -f "$DB_PATH" ]; then
    cp "$DB_PATH" "${BACKUP_DIR}/sustainalign_${TIMESTAMP}.db"
    ls -t "${BACKUP_DIR}"/sustainalign_*.db | tail -n +8 | xargs -r rm
    echo "    backup saved: ${BACKUP_DIR}/sustainalign_${TIMESTAMP}.db"
  else
    echo "    no database found, skipping backup"
  fi
fi

# ── 3. Build images ──────────────────────────────────────────
if [[ "$SKIP_BUILD" != "true" ]]; then
  echo "==> Building Docker images..."
  if [ -f docker-compose.prod.yml ]; then
    docker compose -f docker-compose.yml -f docker-compose.prod.yml build
  else
    docker compose build
  fi
fi

# ── 4. Restart containers ────────────────────────────────────
echo "==> Restarting containers..."
if [ -f docker-compose.prod.yml ]; then
  docker compose -f docker-compose.yml -f docker-compose.prod.yml up --detach --remove-orphans
else
  docker compose up --detach --remove-orphans
fi

# ── 5. Run database migrations ───────────────────────────────
if [[ "$SKIP_MIGRATE" != "true" ]]; then
  echo "==> Running database migrations..."
  docker compose exec -T backend sh -c "npm run db:migrate 2>/dev/null" || \
    echo "    Warning: Migration command not found"
fi

# ── 6. Clean up old Docker images ────────────────────────────
echo "==> Cleaning up unused Docker resources..."
docker system prune -f --filter "until=72h" 2>/dev/null || true

# ── 7. Clean up old releases (keep last 3) ───────────────────
echo "==> Pruning old releases..."
ls -dt "${APP_DIR}"/releases/*/ | tail -n +4 | xargs -r rm -rf

# ── 8. Health check ──────────────────────────────────────────
echo "==> Waiting for health check..."
for i in $(seq 1 12); do
  sleep 5
  if curl -sf http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "    Health check passed"
    exit 0
  fi
  echo "    Attempt ${i}/12..."
done

echo "    Health check failed after 60s"
exit 1
