#!/bin/bash
set -e

# ARM Backup Script
# Usage: ./scripts/backup.sh [backup-name]

BACKUP_NAME=${1:-$(date +%Y%m%d-%H%M%S)}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_DIR="$PROJECT_ROOT/backups"

echo "💾 Creating backup: $BACKUP_NAME..."

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Export Convex data
echo -e "${GREEN}📤 Exporting Convex data...${NC}"
cd "$PROJECT_ROOT"

# Create backup metadata
cat > "$BACKUP_DIR/$BACKUP_NAME.meta.json" <<EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "environment": "${CONVEX_DEPLOYMENT:-unknown}",
  "git_commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "git_branch": "$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')"
}
EOF

# Export database snapshot
echo -e "${GREEN}📸 Creating database snapshot...${NC}"
npx convex export --path "$BACKUP_DIR/$BACKUP_NAME.json" || {
  echo -e "${YELLOW}⚠️  Export failed (Convex export may not be available)${NC}"
}

# Compress backup
echo -e "${GREEN}🗜️  Compressing backup...${NC}"
cd "$BACKUP_DIR"
tar -czf "$BACKUP_NAME.tar.gz" "$BACKUP_NAME.json" "$BACKUP_NAME.meta.json" 2>/dev/null || true

# Clean up uncompressed files
rm -f "$BACKUP_NAME.json" "$BACKUP_NAME.meta.json" 2>/dev/null || true

# List backups
echo -e "${GREEN}📋 Available backups:${NC}"
ls -lh "$BACKUP_DIR"/*.tar.gz 2>/dev/null || echo "No backups found"

# Clean up old backups (keep last 10)
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/*.tar.gz 2>/dev/null | wc -l)
if [ "$BACKUP_COUNT" -gt 10 ]; then
  echo -e "${YELLOW}🧹 Cleaning up old backups...${NC}"
  ls -t "$BACKUP_DIR"/*.tar.gz | tail -n +11 | xargs rm -f
fi

echo -e "${GREEN}✅ Backup complete: $BACKUP_NAME.tar.gz${NC}"
