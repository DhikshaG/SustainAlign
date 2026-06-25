#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

docker run --rm \
  -v "${APP_DIR}/data/certbot/conf:/etc/letsencrypt" \
  -v "${APP_DIR}/data/certbot/www:/var/www/certbot" \
  certbot/certbot renew --quiet

docker compose -f "${APP_DIR}/docker-compose.yml" \
  -f "${APP_DIR}/docker-compose.prod.yml" \
  exec -T nginx nginx -s reload 2>/dev/null || true
