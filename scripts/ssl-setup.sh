#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────────────────────
# SustainAlign — Initial Let's Encrypt SSL setup
# Run on the server AFTER DNS points to this machine.
# Usage: bash scripts/ssl-setup.sh <domain> [email]
# ──────────────────────────────────────────────────────────────

DOMAIN="${1:?Usage: $0 <domain> [email]}"
EMAIL="${2:-admin@${DOMAIN}}"
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "==> Setting up SSL for ${DOMAIN}"
echo "==> Email: ${EMAIL}"

# ── 1. Start nginx with certbot challenge dir ──────────────
echo "==> Starting nginx for HTTP challenge..."
mkdir -p "${APP_DIR}/data/certbot/www"
mkdir -p "${APP_DIR}/data/certbot/conf"

# ── 2. Obtain certificate via HTTP-01 challenge ────────────
echo "==> Requesting certificate from Let's Encrypt..."
docker run --rm \
  -v "${APP_DIR}/data/certbot/conf:/etc/letsencrypt" \
  -v "${APP_DIR}/data/certbot/www:/var/www/certbot" \
  -p 80:80 \
  certbot/certbot certonly \
    --webroot \
    --webroot-path /var/www/certbot \
    --non-interactive \
    --agree-tos \
    --email "${EMAIL}" \
    --domains "${DOMAIN}"

echo "==> Certificate obtained for ${DOMAIN}"
ls -la "${APP_DIR}/data/certbot/conf/live/${DOMAIN}/"

# ── 3. Create auto-renew script ────────────────────────────
echo "==> Creating auto-renew cron job..."
RENEW_SCRIPT="${APP_DIR}/scripts/ssl-renew.sh"
cat > "$RENEW_SCRIPT" << 'RENEW'
#!/usr/bin/env bash
set -euo pipefail
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
docker run --rm \
  -v "${APP_DIR}/data/certbot/conf:/etc/letsencrypt" \
  -v "${APP_DIR}/data/certbot/www:/var/www/certbot" \
  certbot/certbot renew --quiet
docker compose -f "${APP_DIR}/docker-compose.yml" -f "${APP_DIR}/docker-compose.prod.yml" exec -T nginx nginx -s reload 2>/dev/null || true
RENEW
chmod +x "$RENEW_SCRIPT"

# Add cron job (daily at 3am)
CRON_JOB="0 3 * * * ${RENEW_SCRIPT} >> /var/log/ssl-renew.log 2>&1"
(crontab -l 2>/dev/null | grep -v ssl-renew; echo "$CRON_JOB") | crontab -

echo "==> SSL setup complete"
echo "    Certificate: ${APP_DIR}/data/certbot/conf/live/${DOMAIN}/"
echo "    Auto-renew: daily at 3am via cron"
