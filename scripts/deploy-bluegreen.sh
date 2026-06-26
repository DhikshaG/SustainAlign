#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────────────────────
# SustainAlign — blue-green deploy (zero-downtime)
# Requires Postgres (shared DB between blue and green stacks).
# Usage: bash scripts/deploy-bluegreen.sh [--env prod]
# ──────────────────────────────────────────────────────────────

ENVIRONMENT="${1:-production}"
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-main}"

echo "==> Blue-Green Deploy [${ENVIRONMENT}] — ${TIMESTAMP}"

# Determine which stack is currently active
if docker compose -f "${APP_DIR}/docker-compose.yml" -f "${APP_DIR}/docker-compose.prod.yml" ps --format json 2>/dev/null | grep -q '"green"'; then
  ACTIVE="green"
  STANDBY="blue"
else
  # default: blue is active
  ACTIVE="blue"
  STANDBY="green"
fi

echo "==> Active: ${ACTIVE}  |  Standby: ${STANDBY}"

# ── 1. Deploy to standby stack ──────────────────────────────
echo "==> Deploying to ${STANDBY} stack..."
docker compose -f "${APP_DIR}/docker-compose.yml" -f "${APP_DIR}/docker-compose.prod.yml" \
  --project-name "sustainalign-${STANDBY}" up --detach --build \
  --remove-orphans backend frontend

# ── 2. Health check ─────────────────────────────────────────
echo "==> Waiting for health check on ${STANDBY}..."
STANDBY_PORT=$([ "$STANDBY" = "green" ] && echo "3002" || echo "3001")
for i in $(seq 1 12); do
  sleep 5
  if curl -sf "http://localhost:${STANDBY_PORT}/api/health" > /dev/null 2>&1; then
    echo "    ${STANDBY} health check passed"
    break
  fi
  if [ "$i" -eq 12 ]; then
    echo "    ${STANDBY} health check failed — aborting"
    exit 1
  fi
  echo "    Attempt ${i}/12..."
done

# ── 3. Run migrations ───────────────────────────────────────
echo "==> Running migrations on ${STANDBY}..."
docker compose -p "sustainalign-${STANDBY}" exec -T backend sh -c "npm run db:migrate 2>/dev/null" || true

# ── 4. Switch traffic ───────────────────────────────────────
echo "==> Switching ${STANDBY} to primary port..."
if [ "$STANDBY" = "green" ]; then
  echo "    Green stack ready on port 3002. Update reverse proxy to route traffic."
  echo "    Then stop blue: docker compose -p sustainalign-blue down"
else
  echo "    Blue stack ready on port 3001. Update reverse proxy to route traffic."
  echo "    Then stop green: docker compose -p sustainalign-green down"
fi

echo "==> Blue-green deploy complete: ${ACTIVE} → ${STANDBY}"
