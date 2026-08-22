#!/usr/bin/env bash
# ===========================================================================
# LicenseLand — PostgreSQL backup script
# Cron-friendly: dumps the public schema to a timestamped file, keeps the
# last N backups (default 14), and optionally uploads to S3-compatible storage.
#
# Usage:
#   ./scripts/backup-db.sh
#
# Cron example (daily at 02:00):
#   0 2 * * * /opt/licenseland/scripts/backup-db.sh >> /var/log/licenseland-backup.log 2>&1
#
# Required env vars (read from .env or shell):
#   POSTGRES_HOST, POSTGRES_PORT, POSTGRES_DB, POSTGRES_USER, PGPASSWORD
# Optional:
#   BACKUP_DIR (default: ./backups)
#   BACKUP_KEEP (default: 14)
#   COMPRESS (default: 1, set to 0 to disable gzip)
# ===========================================================================
set -euo pipefail

# ---------- Resolve project root (script lives in <root>/scripts) ----------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# ---------- Load .env if present ----------
if [[ -f "$PROJECT_ROOT/.env" ]]; then
  # shellcheck disable=SC1090
  set -a
  source "$PROJECT_ROOT/.env"
  set +a
fi

POSTGRES_HOST="${POSTGRES_HOST:-postgres}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_DB="${POSTGRES_DB:-licenseland}"
POSTGRES_USER="${POSTGRES_USER:-licenseland}"

BACKUP_DIR="${BACKUP_DIR:-$PROJECT_ROOT/backups}"
BACKUP_KEEP="${BACKUP_KEEP:-14}"
COMPRESS="${COMPRESS:-1}"

mkdir -p "$BACKUP_DIR"

TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
BASENAME="${POSTGRES_DB}-${TIMESTAMP}"
SQL_FILE="$BACKUP_DIR/${BASENAME}.sql"
FINAL_FILE="$SQL_FILE"

if [[ "$COMPRESS" == "1" ]]; then
  FINAL_FILE="${SQL_FILE}.gz"
fi

echo "[$(date -Iseconds)] Starting backup → $FINAL_FILE"

# ---------- Run pg_dump ----------
# Note: PGPASSWORD must be exported (it usually comes from .env).
if [[ -z "${PGPASSWORD:-}" ]]; then
  echo "[$(date -Iseconds)] WARN: PGPASSWORD is empty — pg_dump may fail to authenticate."
fi

pg_dump \
  --host="$POSTGRES_HOST" \
  --port="$POSTGRES_PORT" \
  --username="$POSTGRES_USER" \
  --dbname="$POSTGRES_DB" \
  --no-owner \
  --no-privileges \
  --format=plain \
  --file="$SQL_FILE"

if [[ "$COMPRESS" == "1" ]]; then
  gzip -9 -c "$SQL_FILE" > "$FINAL_FILE"
  rm -f "$SQL_FILE"
fi

# ---------- Report size ----------
SIZE=$(du -h "$FINAL_FILE" | cut -f1)
echo "[$(date -Iseconds)] Backup complete: $FINAL_FILE ($SIZE)"

# ---------- Rotate old backups ----------
DELETED=0
# shellcheck disable=SC2012
MAPFILE -t OLD_FILES < <(ls -1t "$BACKUP_DIR"/${POSTGRES_DB}-*.sql* 2>/dev/null | tail -n +"$((BACKUP_KEEP + 1))" || true)
for f in "${OLD_FILES[@]}"; do
  rm -f "$f"
  DELETED=$((DELETED + 1))
done
if [[ $DELETED -gt 0 ]]; then
  echo "[$(date -Iseconds)] Rotated $DELETED old backup(s) (kept last $BACKUP_KEEP)."
fi

# ---------- Optional S3 upload ----------
if [[ -n "${S3_BACKUP_BUCKET:-}" && -n "${AWS_ACCESS_KEY_ID:-}" && -n "${AWS_SECRET_ACCESS_KEY:-}" ]]; then
  if command -v aws >/dev/null 2>&1; then
    S3_KEY="${POSTGRES_DB}/${BASENAME}.sql$( [[ "$COMPRESS" == "1" ]] && echo ".gz" )"
    echo "[$(date -Iseconds)] Uploading to s3://${S3_BACKUP_BUCKET}/${S3_KEY}"
    if aws s3 cp "$FINAL_FILE" "s3://${S3_BACKUP_BUCKET}/${S3_KEY}" \
        --endpoint-url="${S3_ENDPOINT:-}" \
        --no-progress; then
      echo "[$(date -Iseconds)] S3 upload complete."
    else
      echo "[$(date -Iseconds)] ERROR: S3 upload failed." >&2
      exit 1
    fi
  else
    echo "[$(date -Iseconds)] WARN: aws CLI not installed — skipping S3 upload." >&2
  fi
fi

echo "[$(date -Iseconds)] Done."
