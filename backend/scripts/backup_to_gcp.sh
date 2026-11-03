#!/bin/bash
# ==============================================================================
# Cross-Cloud Automated Database Backup: AWS EC2 -> GCP VM
# Target: Prolt_Operations (PostgreSQL)
# Destination: yash_probus_io@8.231.105.144:/mnt/backups/iex_db_backups
# ==============================================================================

set -e

DATE=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_DIR="/mnt/storage/iex_db_backups"
BACKUP_FILENAME="prolt_operations_${DATE}.sql.gz"
BACKUP_FILE="${BACKUP_DIR}/${BACKUP_FILENAME}"
DB_URL="postgresql://postgres:iex_sec_k9P2mX_2026@127.0.0.1:5432/Prolt_Operations"

# GCP VM Destination
GCP_USER="yash_probus_io"
GCP_IP="8.231.105.144"
GCP_DEST_DIR="/mnt/backups/iex_db_backups"
SSH_KEY="${HOME}/.ssh/gcp_backup_key"

# Retention settings
LOCAL_RETENTION_DAYS=7   # Keep 7 days on AWS (conserves disk space)
GCP_RETENTION_DAYS=30    # Keep 30 days on GCP for disaster recovery

mkdir -p "$BACKUP_DIR"

echo "=========================================================="
echo "Starting Database Backup to GCP: $DATE"
echo "=========================================================="

# 1. Dump database and compress with gzip
echo "[1/4] Dumping database Prolt_Operations..."
if command -v docker &> /dev/null && docker ps | grep -q "iex-postgres"; then
  docker exec iex-postgres pg_dump -U postgres --no-owner --no-privileges Prolt_Operations | gzip > "$BACKUP_FILE"
else
  pg_dump --dbname="$DB_URL" --no-owner --no-privileges | gzip > "$BACKUP_FILE"
fi

FILESIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "Backup created successfully: $BACKUP_FILE ($FILESIZE)"

# 2. Ensure destination directory exists on GCP VM
echo "[2/4] Ensuring destination directory on GCP VM..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "${GCP_USER}@${GCP_IP}" "mkdir -p $GCP_DEST_DIR"

# 3. Transfer to GCP VM
echo "[3/4] Transferring backup to GCP VM (${GCP_USER}@${GCP_IP}:${GCP_DEST_DIR})..."
rsync -avz --progress -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" \
  "$BACKUP_FILE" \
  "${GCP_USER}@${GCP_IP}:${GCP_DEST_DIR}/"

echo "File transfer to GCP verified."

# 4. Clean up older backups
echo "[4/4] Applying retention cleanup..."
# Clean AWS local
find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +"$LOCAL_RETENTION_DAYS" -delete
echo "Cleaned AWS backups older than $LOCAL_RETENTION_DAYS days."

# Clean GCP remote
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "${GCP_USER}@${GCP_IP}" \
  "find $GCP_DEST_DIR -type f -name '*.sql.gz' -mtime +$GCP_RETENTION_DAYS -delete"
echo "Cleaned GCP backups older than $GCP_RETENTION_DAYS days."

echo "=========================================================="
echo "Backup & cross-cloud sync completed at $(date +"%Y-%m-%d %H:%M:%S")"
echo "=========================================================="
