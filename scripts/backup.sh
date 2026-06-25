#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────────────────────
# SustainAlign — automated backup script
# Backs up SQLite database and uploads, encrypts with age, and
# optionally pushes to S3-compatible storage (Backblaze B2, AWS S3).
#
# Usage: bash scripts/backup.sh
#   DRY_RUN=1 bash scripts/backup.sh   (dry run, no upload)
#   BACKUP_RCLONE_REMOTE=myremote:backups bash scripts/backup.sh
#
# Required env vars for S3 push:
#   BACKUP_RCLONE_REMOTE (e.g., "b2:bucket-name" or "s3:bucket")
#   RCLONE_CONFIG_*      (rclone config for the remote)
# ──────────────────────────────────────────────────────────────

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${APP_DIR}/backups"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_NAME="sustainalign_${TIMESTAMP}"
DRY_RUN="${DRY_RUN:-false}"
RCLONE_REMOTE="${BACKUP_RCLONE_REMOTE:-}"

mkdir -p "${BACKUP_DIR}"

echo "==> Backup started: ${TIMESTAMP}"

# ── 1. SQLite database dump ────────────────────────────────
DB_PATH="${APP_DIR}/backend/data/sustainalign.db"
DB_DUMP="${BACKUP_DIR}/${BACKUP_NAME}.sqlite"

if [ -f "$DB_PATH" ]; then
  echo "==> Backing up SQLite database..."
  sqlite3 "$DB_PATH" ".backup '${DB_DUMP}'"
  sqlite3 "$DB_PATH" ".dump" | gzip > "${DB_DUMP}.dump.gz"
  echo "    database: ${DB_DUMP}"
else
  echo "    no database found, skipping"
fi

# ── 2. Uploads directory ───────────────────────────────────
UPLOADS_DIR="${APP_DIR}/backend/uploads"
UPLOADS_TAR="${BACKUP_DIR}/${BACKUP_NAME}_uploads.tar.gz"

if [ -d "$UPLOADS_DIR" ] && [ "$(ls -A "$UPLOADS_DIR" 2>/dev/null)" ]; then
  echo "==> Backing up uploads..."
  tar czf "$UPLOADS_TAR" -C "$(dirname "$UPLOADS_DIR")" "$(basename "$UPLOADS_DIR")"
  echo "    uploads: ${UPLOADS_TAR}"
else
  echo "    no uploads found, skipping"
fi

# ── 3. Encrypt with age (if key available) ─────────────────
AGE_KEY="${APP_DIR}/.age-key.txt"
if [ -f "$AGE_KEY" ]; then
  echo "==> Encrypting backups..."
  AGE_RECIPIENT=$(cat "${AGE_KEY}.pub" 2>/dev/null || true)
  if [ -n "$AGE_RECIPIENT" ]; then
    for f in "${DB_DUMP}" "${DB_DUMP}.dump.gz" "${UPLOADS_TAR}"; do
      [ -f "$f" ] && age -r "$AGE_RECIPIENT" -o "${f}.age" "$f" && rm "$f"
    done
    echo "    encrypted with age"
  fi
fi

# ── 4. Push to remote storage ─────────────────────────────
if [ -n "$RCLONE_REMOTE" ] && command -v rclone >/dev/null 2>&1; then
  echo "==> Uploading to ${RCLONE_REMOTE}..."
  if [ "$DRY_RUN" = "true" ]; then
    echo "    DRY RUN: rclone sync ${BACKUP_DIR} ${RCLONE_REMOTE}/sustainalign"
  else
    rclone sync "${BACKUP_DIR}" "${RCLONE_REMOTE}/sustainalign" \
      --progress --verbose
    echo "    upload complete"
  fi
else
  echo "    rclone not configured, skipping remote upload"
fi

# ── 5. Prune old local backups (keep last 14) ──────────────
echo "==> Pruning old backups (keeping last 14)..."
ls -t "${BACKUP_DIR}"/sustainalign_*.* | tail -n +15 | xargs -r rm -f

echo "==> Backup complete: ${BACKUP_NAME}"
