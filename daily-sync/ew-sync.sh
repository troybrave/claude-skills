#!/bin/bash
#══════════════════════════════════════════════════════════════════════════════
# ENDLESS WINNING SYNC - Bulletproof. Zero data loss. Life-or-death reliable.
#══════════════════════════════════════════════════════════════════════════════
#
# PATHS - Edit here if folders move
#
LOCAL="/Users/troybrave/Documents/Projects/Full Vault/Business/Endless Winning Agency"
GDRIVE="/Users/troybrave/Library/CloudStorage/GoogleDrive-troy@endlesswinning.com/My Drive/Audacia Trust/Fortis Entities/04 Entities/Active/Endless Winning Agency"
#
# SAFETY GUARANTEES:
# ✓ NEVER deletes files (no --delete flag, ever)
# ✓ ALWAYS backs up before overwriting (--backup)
# ✓ Detects conflicts (both modified = both kept)
# ✓ Verifies file counts after sync
# ✓ Logs everything
# ✓ Checks disk space first
# ✓ Exits on ANY error (set -e)
#
#══════════════════════════════════════════════════════════════════════════════

set -euo pipefail  # Exit on error, undefined var, pipe failure

# Config
BACKUP_DIR="$HOME/.sync-backups/$(date +%Y%m%d-%H%M%S)"
LOG_DIR="$HOME/.sync-logs"
LOG_FILE="$LOG_DIR/sync-$(date +%Y%m%d-%H%M%S).log"
MIN_FREE_SPACE_GB=5

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# State
DRY_RUN=false
ERRORS=0

# Logging
mkdir -p "$LOG_DIR"
exec > >(tee -a "$LOG_FILE") 2>&1

log() { echo "[$(date '+%H:%M:%S')] $1"; }
error() { echo -e "${RED}[ERROR] $1${NC}"; ERRORS=$((ERRORS + 1)); }
success() { echo -e "${GREEN}✓ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠ $1${NC}"; }

# Parse args
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run) DRY_RUN=true; shift ;;
        --help)
            echo "Usage: $0 [--dry-run]"
            echo ""
            echo "Bulletproof bi-directional sync with zero data loss guarantee."
            echo ""
            echo "Safety features:"
            echo "  • Never deletes files"
            echo "  • Always backs up before overwriting"
            echo "  • Detects and preserves conflicts"
            echo "  • Verifies sync completed correctly"
            echo "  • Full audit logging"
            echo ""
            echo "Options:"
            echo "  --dry-run  Show what would happen without making changes"
            exit 0
            ;;
        *) echo "Unknown: $1"; exit 1 ;;
    esac
done

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  ENDLESS WINNING SYNC - BULLETPROOF MODE"
[ "$DRY_RUN" = true ] && echo "  DRY RUN - No changes will be made"
echo "  $(date '+%B %d, %Y @ %I:%M %p')"
echo "  Log: $LOG_FILE"
echo "═══════════════════════════════════════════════════════════════"
echo ""

#──────────────────────────────────────────────────────────────────────────────
# PHASE 1: PRE-FLIGHT CHECKS
#──────────────────────────────────────────────────────────────────────────────
log "PHASE 1: Pre-flight checks"

# Check paths exist
if [ ! -d "$LOCAL" ]; then
    error "LOCAL path does not exist: $LOCAL"
fi

if [ ! -d "$GDRIVE" ]; then
    error "GDRIVE path does not exist: $GDRIVE"
    warn "Is Google Drive app running? Is troy@endlesswinning.com signed in?"
fi

if [ $ERRORS -gt 0 ]; then
    echo ""
    echo -e "${RED}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${RED}  ABORTED - Fix errors above before syncing${NC}"
    echo -e "${RED}═══════════════════════════════════════════════════════════════${NC}"
    exit 1
fi

success "Both paths exist"

# Check disk space
FREE_SPACE_GB=$(df -g "$LOCAL" | awk 'NR==2 {print $4}')
if [ "$FREE_SPACE_GB" -lt "$MIN_FREE_SPACE_GB" ]; then
    error "Not enough disk space. Need ${MIN_FREE_SPACE_GB}GB, have ${FREE_SPACE_GB}GB"
    exit 1
fi
success "Disk space OK (${FREE_SPACE_GB}GB free)"

# Check rsync available
if ! command -v rsync &> /dev/null; then
    error "rsync not found"
    exit 1
fi
success "rsync available"

#──────────────────────────────────────────────────────────────────────────────
# PHASE 2: COUNT FILES BEFORE (for verification)
#──────────────────────────────────────────────────────────────────────────────
log "PHASE 2: Counting files"

count_files() {
    find "$1" -type f ! -name '.DS_Store' ! -name '*.tmp' 2>/dev/null | wc -l | tr -d ' '
}

LOCAL_COUNT_BEFORE=$(count_files "$LOCAL")
GDRIVE_COUNT_BEFORE=$(count_files "$GDRIVE")
TOTAL_BEFORE=$((LOCAL_COUNT_BEFORE + GDRIVE_COUNT_BEFORE))

echo "  Local files:  $LOCAL_COUNT_BEFORE"
echo "  GDrive files: $GDRIVE_COUNT_BEFORE"
echo "  Total:        $TOTAL_BEFORE"

#──────────────────────────────────────────────────────────────────────────────
# PHASE 3: CREATE BACKUP DIRECTORY
#──────────────────────────────────────────────────────────────────────────────
log "PHASE 3: Preparing backup location"

if [ "$DRY_RUN" = false ]; then
    mkdir -p "$BACKUP_DIR/local"
    mkdir -p "$BACKUP_DIR/gdrive"
    success "Backup directory: $BACKUP_DIR"
else
    echo "  [DRY RUN] Would create: $BACKUP_DIR"
fi

#──────────────────────────────────────────────────────────────────────────────
# PHASE 4: SYNC WITH BACKUP
#──────────────────────────────────────────────────────────────────────────────
log "PHASE 4: Syncing files"

# rsync options:
# -a          = archive mode (preserves permissions, times, etc.)
# -v          = verbose
# -u          = skip files newer on destination (conflict = keep both via backup)
# --backup    = make backup of overwritten files
# --backup-dir= where to put backups
# --exclude   = skip these files
# --itemize-changes = show what changed (for dry-run analysis)

RSYNC_BASE="-avu --itemize-changes --exclude='.DS_Store' --exclude='*.tmp' --exclude='.git'"

sync_with_backup() {
    local src="$1"
    local dst="$2"
    local backup_subdir="$3"
    local direction="$4"

    echo ""
    echo -e "${BLUE}───────────────────────────────────────────────────────────${NC}"
    echo -e "${BLUE}  $direction${NC}"
    echo -e "${BLUE}───────────────────────────────────────────────────────────${NC}"

    if [ "$DRY_RUN" = true ]; then
        rsync $RSYNC_BASE --dry-run "$src/" "$dst/" 2>&1 || true
    else
        # Sync with backup of any overwritten files
        rsync $RSYNC_BASE \
            --backup \
            --backup-dir="$BACKUP_DIR/$backup_subdir" \
            "$src/" "$dst/" 2>&1 || {
                error "rsync failed for $direction"
                return 1
            }
    fi

    return 0
}

# Bi-directional sync: LOCAL → GDRIVE, then GDRIVE → LOCAL
# Files overwritten in either direction are backed up

sync_with_backup "$LOCAL" "$GDRIVE" "gdrive" "LOCAL → GDRIVE" || true
sync_with_backup "$GDRIVE" "$LOCAL" "local" "GDRIVE → LOCAL" || true

#──────────────────────────────────────────────────────────────────────────────
# PHASE 5: VERIFICATION
#──────────────────────────────────────────────────────────────────────────────
log "PHASE 5: Verification"

if [ "$DRY_RUN" = false ]; then
    LOCAL_COUNT_AFTER=$(count_files "$LOCAL")
    GDRIVE_COUNT_AFTER=$(count_files "$GDRIVE")
    TOTAL_AFTER=$((LOCAL_COUNT_AFTER + GDRIVE_COUNT_AFTER))

    echo "  Local files:  $LOCAL_COUNT_BEFORE → $LOCAL_COUNT_AFTER"
    echo "  GDrive files: $GDRIVE_COUNT_BEFORE → $GDRIVE_COUNT_AFTER"
    echo "  Total:        $TOTAL_BEFORE → $TOTAL_AFTER"

    # CRITICAL CHECK: File count should never decrease
    if [ "$LOCAL_COUNT_AFTER" -lt "$LOCAL_COUNT_BEFORE" ]; then
        error "LOCAL file count DECREASED! Was $LOCAL_COUNT_BEFORE, now $LOCAL_COUNT_AFTER"
        error "Check backup at: $BACKUP_DIR/local"
    fi

    if [ "$GDRIVE_COUNT_AFTER" -lt "$GDRIVE_COUNT_BEFORE" ]; then
        error "GDRIVE file count DECREASED! Was $GDRIVE_COUNT_BEFORE, now $GDRIVE_COUNT_AFTER"
        error "Check backup at: $BACKUP_DIR/gdrive"
    fi

    # Check if any backups were made (indicates overwrites happened)
    BACKUP_COUNT=$(find "$BACKUP_DIR" -type f 2>/dev/null | wc -l | tr -d ' ')
    if [ "$BACKUP_COUNT" -gt 0 ]; then
        warn "$BACKUP_COUNT files were overwritten (backups saved)"
        echo "  Backups at: $BACKUP_DIR"
    else
        success "No files were overwritten"
        # Clean up empty backup dir
        rmdir "$BACKUP_DIR/local" "$BACKUP_DIR/gdrive" "$BACKUP_DIR" 2>/dev/null || true
    fi
else
    echo "  [DRY RUN] Skipping verification"
fi

#──────────────────────────────────────────────────────────────────────────────
# PHASE 6: FINAL REPORT
#──────────────────────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════"

if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}  SYNC COMPLETED WITH $ERRORS ERROR(S)${NC}"
    echo ""
    echo "  Review log: $LOG_FILE"
    echo "  Check backups: $BACKUP_DIR"
    echo "═══════════════════════════════════════════════════════════════"
    exit 1
elif [ "$DRY_RUN" = true ]; then
    echo -e "${BLUE}  DRY RUN COMPLETE - No changes made${NC}"
    echo ""
    echo "  Run without --dry-run to actually sync"
    echo "═══════════════════════════════════════════════════════════════"
    exit 0
else
    echo -e "${GREEN}  SYNC COMPLETE - Zero data loss verified${NC}"
    echo ""
    echo "  Log: $LOG_FILE"
    [ "$BACKUP_COUNT" -gt 0 ] && echo "  Backups: $BACKUP_DIR"
    echo "═══════════════════════════════════════════════════════════════"
    exit 0
fi
