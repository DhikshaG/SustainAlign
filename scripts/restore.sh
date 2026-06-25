#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────────────────────
# SustainAlign — restore from backup
# Usage:
#   bash scripts/restore.sh                    # interactive (pick from list)
#   bash scripts/restore.sh <backup_timestamp>  # restore specific backup
#   bash scripts/restore.sh --list              # list available backups only
# ──────────────────────────────────────────────────────────────

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${APP_DIR}/backups"

if [[ ! -d "$BACKUP_DIR" ]]; then
  echo "No backups directory found at ${BACKUP_DIR}"
  exit 1
fi

list_backups() {
  echo "Available backups:"
  for f in "$BACKUP_DIR"/sustainalign_*.sqlite; do
    [ -f "$f" ] || continue
    NAME=$(basename "$f" .sqlite)
    SIZE=$(du -h "$f" | cut -f1)
    DATE=$(echo "$NAME" | sed 's/sustainalign_//' | sed 's/\(....\)\(..\)\(..\)_\(..\)\(..\)\(..\)/\1-\2-\3 \4:\5:\6/')
    echo "  $NAME  (${SIZE}, ${DATE})"
  done
}

if [[ "${1:-}" == "--list" ]]; then
  list_backups
  exit 0
fi

TARGET=""
if [[ -n "${1:-}" ]]; then
  TARGET="${BACKUP_DIR}/sustainalign_${1}.sqlite"
  if [[ ! -f "$TARGET" ]] && [[ -f "${BACKUP_DIR}/${1}" ]]; then
    TARGET="${BACKUP_DIR}/${1}"
  fi
  if [[ ! -f "$TARGET" ]]; then
    echo "Backup not found. Use --list to see available backups."
    exit 1
  fi
else
  echo "==> Restore from backup"
  echo ""
  list_backups
  echo ""
  read -r -p "Enter backup timestamp to restore: " INPUT
  TARGET="${BACKUP_DIR}/sustainalign_${INPUT}.sqlite"
  if [[ ! -f "$TARGET" ]]; then
    echo "Backup not found"
    exit 1
  fi
fi

echo "==> Restoring from: $(basename "$TARGET")"

# Decrypt if age-encrypted
AGE_KEY="${APP_DIR}/.age-key.txt"
if [[ "$TARGET" == *.age ]]; then
  if [[ ! -f "$AGE_KEY" ]]; then
    echo "Age key not found at ${AGE_KEY}"
    exit 1
  fi
  DECRYPTED="${TARGET%.age}"
  age --decrypt -i "$AGE_KEY" -o "$DECRYPTED" "$TARGET"
  TARGET="$DECRYPTED"
fi

# Restore database
DB_PATH="${APP_DIR}/backend/data/sustainalign.db"
echo "==> Stopping backend..."
docker compose -f "${APP_DIR}/docker-compose.yml" stop backend 2>/dev/null || true

echo "==> Restoring database..."
cp "$TARGET" "$DB_PATH"

echo "==> Starting backend..."
docker compose -f "${APP_DIR}/docker-compose.yml" start backend 2>/dev/null || true

echo "==> Waiting for health check..."
for i in $(seq 1 12); do
  sleep 5
  if curl -sf http://localhost:3001/api/health > /dev/null 2>&1; then
    echo " Restore complete"
    exit 0
  fi
  echo "  Attempt ${i}/12..."
done

echo "  Health check failed — manual intervention required"
exit 1
