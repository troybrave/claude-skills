#!/bin/bash
# BULLETPROOF DAILY SYNC - Main orchestration script
# Zero data loss guarantee - copy-only operations

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source all library functions (with error handling)
for lib in preflight manifest sync-plan backup copy verify rollback; do
    if [ -f "${SCRIPT_DIR}/lib/${lib}.sh" ]; then
        source "${SCRIPT_DIR}/lib/${lib}.sh" || {
            echo "ERROR: Failed to load ${lib}.sh"
            exit 1
        }
    else
        echo "ERROR: Library not found: ${lib}.sh"
        exit 1
    fi
done

# Configuration
CONFIG_DIR="${SCRIPT_DIR}/config"
VENTURES_CONFIG="${CONFIG_DIR}/ventures.json"
RULES_CONFIG="${CONFIG_DIR}/sync-rules.json"
LOG_DIR="${SCRIPT_DIR}/logs"

# Parse command line arguments
DRY_RUN=false
SPECIFIC_VENTURE=""
ROLLBACK_TIMESTAMP=""
SHOW_HISTORY=false
VERIFY_ONLY=false
VERBOSE=false
AUTO_MODE=false
SKIP_HEALTH_CHECK=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --venture)
            SPECIFIC_VENTURE="$2"
            shift 2
            ;;
        --rollback)
            ROLLBACK_TIMESTAMP="$2"
            shift 2
            ;;
        --history)
            SHOW_HISTORY=true
            shift
            ;;
        --verify-only)
            VERIFY_ONLY=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --auto)
            AUTO_MODE=true
            shift
            ;;
        --skip-health-check)
            SKIP_HEALTH_CHECK=true
            shift
            ;;
        --health-check)
            # Run health check only and exit
            "${SCRIPT_DIR}/health-check.sh"
            exit $?
            ;;
        --help)
            cat << EOF

BULLETPROOF DAILY SYNC - Zero Data Loss Guarantee

Usage: $0 [OPTIONS]

OPTIONS:
    --dry-run           Show what would be synced without making changes
    --venture NAME      Sync only specific venture
    --rollback TIME     Rollback to archive (format: YYYYMMDD-HHMMSS)
    --history           Show sync history and available archives
    --verify-only       Verify current state without syncing
    --verbose           Show detailed output
    --auto              Automatic mode (for cron jobs)
    --health-check      Run health check only (validate all paths)
    --skip-health-check Skip health check (emergency use only)
    --help              Show this help message

EXAMPLES:
    # Normal sync (all ventures)
    $0

    # Dry run to preview changes
    $0 --dry-run

    # Sync specific venture
    $0 --venture Taskaroo

    # Rollback to previous state
    $0 --rollback 20251114-172211

    # View sync history
    $0 --history

SAFETY GUARANTEES:
    ✓ Never deletes files
    ✓ Always creates backups before overwriting
    ✓ Preserves conflicts (never auto-resolves)
    ✓ 30-day rollback capability
    ✓ Atomic operations only

EOF
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Handle special modes
if [ "$SHOW_HISTORY" = true ]; then
    ARCHIVE_BASE=$(jq -r '.archive_path' "$VENTURES_CONFIG" 2>/dev/null || echo "/Users/troybrave/.claude/.sync-archive")
    list_archives "$ARCHIVE_BASE"
    exit 0
fi

if [ -n "$ROLLBACK_TIMESTAMP" ]; then
    ARCHIVE_BASE=$(jq -r '.archive_path' "$VENTURES_CONFIG" 2>/dev/null || echo "/Users/troybrave/.claude/.sync-archive")
    perform_rollback "$ROLLBACK_TIMESTAMP" "$ARCHIVE_BASE"
    exit $?
fi

# Run health check before any sync operation (unless skipped)
if [ "$SKIP_HEALTH_CHECK" = false ]; then
    echo ""
    echo "Running pre-sync health check..."
    echo ""

    if ! "${SCRIPT_DIR}/health-check.sh"; then
        HEALTH_EXIT=$?
        if [ $HEALTH_EXIT -eq 2 ]; then
            echo ""
            echo "CRITICAL: Health check failed with errors."
            echo "Fix the issues above before syncing."
            echo ""
            echo "To skip health check (emergency only): $0 --skip-health-check"
            exit 1
        fi
        # Exit code 1 = warnings only, continue
        echo ""
        echo "Proceeding with sync despite warnings..."
        echo ""
    fi
fi

# Initialize logging
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
LOG_FILE="${LOG_DIR}/sync-${TIMESTAMP}.log"
mkdir -p "$LOG_DIR"

exec 1> >(tee -a "${LOG_FILE}")
exec 2>&1

# Display header
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  BULLETPROOF DAILY SYNC"
if [ "$DRY_RUN" = true ]; then
    echo "  DRY RUN MODE - No changes will be made"
fi
echo "  $(date '+%B %d, %Y @ %I:%M %p')"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Log session start
echo "[SYNC] Session started: $TIMESTAMP" >> "${LOG_FILE}"
echo "[SYNC] Dry run: $DRY_RUN" >> "${LOG_FILE}"

# Verify configuration files exist
if [ ! -f "$VENTURES_CONFIG" ]; then
    echo "ERROR: Ventures configuration not found: $VENTURES_CONFIG"
    exit 1
fi

# Load ventures
ARCHIVE_BASE=$(jq -r '.archive_path' "$VENTURES_CONFIG")
RETENTION_DAYS=$(jq -r '.archive_retention_days' "$VENTURES_CONFIG")

# Get ventures to process
if [ -n "$SPECIFIC_VENTURE" ]; then
    VENTURES=$(jq -c ".ventures[] | select(.name == \"$SPECIFIC_VENTURE\")" "$VENTURES_CONFIG")
    if [ -z "$VENTURES" ]; then
        echo "ERROR: Venture not found: $SPECIFIC_VENTURE"
        exit 1
    fi
else
    VENTURES=$(jq -c '.ventures[]' "$VENTURES_CONFIG")
fi

# Main sync function for a single venture
sync_venture() {
    local venture_json="$1"

    local venture_name=$(echo "$venture_json" | jq -r '.name')
    local local_base=$(echo "$venture_json" | jq -r '.local')
    local gdrive_base=$(echo "$venture_json" | jq -r '.gdrive')

    echo ""
    echo "═══════════════════════════════════════════════════════════════"
    echo "  SYNCING: $venture_name"
    echo "═══════════════════════════════════════════════════════════════"
    echo ""

    START_TIME=$(date +%s)

    # LAYER 1: Pre-flight checks
    if ! run_preflight_checks "$local_base" "$gdrive_base" "$venture_name"; then
        echo "Pre-flight checks failed - skipping $venture_name"
        return 1
    fi

    # Create archive directory for this sync
    ARCHIVE_DIR=$(create_sync_archive "$TIMESTAMP" "$ARCHIVE_BASE")

    # LAYER 2: Generate manifests
    LOCAL_MANIFEST="${ARCHIVE_DIR}/pre-sync-manifests/local_manifest.json"
    GDRIVE_MANIFEST="${ARCHIVE_DIR}/pre-sync-manifests/gdrive_manifest.json"

    mkdir -p "${ARCHIVE_DIR}/pre-sync-manifests"

    generate_manifest "$local_base" "$LOCAL_MANIFEST" "Local"
    generate_manifest "$gdrive_base" "$GDRIVE_MANIFEST" "GDrive"

    # LAYER 2: Compare manifests
    COMPARISON_FILE="${ARCHIVE_DIR}/manifest-comparison.json"
    compare_manifests "$LOCAL_MANIFEST" "$GDRIVE_MANIFEST" "$COMPARISON_FILE"

    # LAYER 2: Create sync plan
    PLAN_FILE="${ARCHIVE_DIR}/sync-plan.json"
    create_sync_plan "$COMPARISON_FILE" "$local_base" "$gdrive_base" "$PLAN_FILE"

    # LAYER 2: Validate sync plan
    if ! validate_sync_plan "$PLAN_FILE"; then
        echo "Sync plan validation failed - ABORTING"
        return 1
    fi

    # LAYER 3: Save metadata and plan to archive
    save_sync_plan "$ARCHIVE_DIR" "$PLAN_FILE"
    save_manifests "$ARCHIVE_DIR" "$LOCAL_MANIFEST" "$GDRIVE_MANIFEST"
    save_comparison "$ARCHIVE_DIR" "$COMPARISON_FILE"
    create_archive_metadata "$ARCHIVE_DIR" "$venture_name" "$local_base" "$gdrive_base"

    # Check if verify-only mode
    if [ "$VERIFY_ONLY" = true ]; then
        echo "Verify-only mode - skipping execution"
        return 0
    fi

    # LAYER 4: Execute sync plan
    if ! execute_sync_plan "$PLAN_FILE" "$ARCHIVE_DIR" "$DRY_RUN"; then
        echo "Sync execution had errors"
        # Continue to verification even if there were errors
    fi

    # Skip verification for dry-run
    if [ "$DRY_RUN" = true ]; then
        echo ""
        echo "Dry run complete - no changes were made"
        return 0
    fi

    # LAYER 5: Post-sync verification
    if ! verify_sync "$local_base" "$gdrive_base" "$PLAN_FILE" "$ARCHIVE_DIR" "$LOCAL_MANIFEST" "$GDRIVE_MANIFEST"; then
        echo ""
        echo "⚠️  Post-sync verification failed!"
        echo ""
        echo "You can rollback using:"
        echo "  $0 --rollback $TIMESTAMP"
        echo ""
        return 1
    fi

    # Generate human-readable report
    END_TIME=$(date +%s)
    generate_sync_report "$ARCHIVE_DIR" "$venture_name" "$START_TIME" "$END_TIME"

    return 0
}

# Process all ventures
TOTAL_VENTURES=0
SUCCESSFUL_SYNCS=0
FAILED_SYNCS=0

while IFS= read -r venture; do
    TOTAL_VENTURES=$((TOTAL_VENTURES + 1))

    if sync_venture "$venture"; then
        SUCCESSFUL_SYNCS=$((SUCCESSFUL_SYNCS + 1))
    else
        FAILED_SYNCS=$((FAILED_SYNCS + 1))
    fi
done <<< "$VENTURES"

# Cleanup old archives (only in auto mode)
if [ "$AUTO_MODE" = true ]; then
    cleanup_old_archives "$ARCHIVE_BASE" "$RETENTION_DAYS"
fi

# Final summary
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  SYNC SESSION COMPLETE"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "  Total ventures: $TOTAL_VENTURES"
echo "  Successful: $SUCCESSFUL_SYNCS"
echo "  Failed: $FAILED_SYNCS"
echo ""
echo "  Log file: $LOG_FILE"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Exit with appropriate code
if [ $FAILED_SYNCS -gt 0 ]; then
    exit 1
else
    exit 0
fi
