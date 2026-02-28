#!/bin/bash
# Layer 6: Rollback - Restore from archive

LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Perform rollback from archive
perform_rollback() {
    local archive_timestamp="$1"
    local archive_base="${2:-/Users/troybrave/.claude/.sync-archive}"

    local archive_dir="$archive_base/$archive_timestamp"

    echo ""
    echo "════════════════════════════════════════════════════════════"
    echo "  ROLLBACK OPERATION"
    echo "════════════════════════════════════════════════════════════"
    echo ""

    # Verify archive exists
    if [ ! -d "$archive_dir" ]; then
        echo -e "${RED}✗ Archive not found: $archive_timestamp${NC}"
        echo ""
        echo "Available archives:"
        list_archives "$archive_base"
        return 1
    fi

    # Verify metadata exists
    if [ ! -f "$archive_dir/metadata.json" ]; then
        echo -e "${RED}✗ Archive metadata not found${NC}"
        return 1
    fi

    # Load metadata
    local venture_name=$(jq -r '.venture_name' "$archive_dir/metadata.json")
    local sync_time=$(jq -r '.sync_timestamp' "$archive_dir/metadata.json")
    local local_base=$(jq -r '.local_base' "$archive_dir/metadata.json")
    local gdrive_base=$(jq -r '.gdrive_base' "$archive_dir/metadata.json")

    echo "Archive information:"
    echo "  Timestamp: $archive_timestamp"
    echo "  Venture: $venture_name"
    echo "  Sync time: $sync_time"
    echo "  Local base: $local_base"
    echo "  GDrive base: $gdrive_base"
    echo ""

    # Warning prompt
    echo -e "${YELLOW}⚠️  WARNING: This will restore files from the backup.${NC}"
    echo -e "${YELLOW}   Files modified after the sync will be replaced.${NC}"
    echo ""
    read -p "Continue with rollback? (yes/no): " confirm

    if [ "$confirm" != "yes" ]; then
        echo "Rollback cancelled"
        return 0
    fi

    echo ""
    echo "Starting rollback..."
    echo ""

    local restored_count=0
    local error_count=0

    # Restore local backups
    if [ -d "$archive_dir/local-backups" ]; then
        echo "Restoring local files..."

        while IFS= read -r -d '' backup_file; do
            local relpath="${backup_file#$archive_dir/local-backups/}"
            local restore_dest="$local_base/$relpath"

            # Create directory if needed
            local restore_dir=$(dirname "$restore_dest")
            mkdir -p "$restore_dir"

            # Restore file
            if cp -p "$backup_file" "$restore_dest" 2>/dev/null; then
                echo "  ✓ Restored: $relpath"
                restored_count=$((restored_count + 1))
            else
                echo -e "  ${RED}✗ Failed to restore: $relpath${NC}"
                error_count=$((error_count + 1))
            fi

        done < <(find "$archive_dir/local-backups" -type f -print0 2>/dev/null)
    fi

    # Restore GDrive backups
    if [ -d "$archive_dir/gdrive-backups" ]; then
        echo ""
        echo "Restoring GDrive files..."

        while IFS= read -r -d '' backup_file; do
            local relpath="${backup_file#$archive_dir/gdrive-backups/}"
            local restore_dest="$gdrive_base/$relpath"

            # Create directory if needed
            local restore_dir=$(dirname "$restore_dest")
            mkdir -p "$restore_dir"

            # Restore file
            if cp -p "$backup_file" "$restore_dest" 2>/dev/null; then
                echo "  ✓ Restored: $relpath"
                restored_count=$((restored_count + 1))
            else
                echo -e "  ${RED}✗ Failed to restore: $relpath${NC}"
                error_count=$((error_count + 1))
            fi

        done < <(find "$archive_dir/gdrive-backups" -type f -print0 2>/dev/null)
    fi

    # Remove files that were added during the sync
    echo ""
    echo "Analyzing files added during sync..."

    if [ -f "$archive_dir/sync-plan.json" ]; then
        local new_files_local=$(jq -r '.operations[] | select(.type == "copy_to_local" and .reason == "new_file") | .destination' "$archive_dir/sync-plan.json" 2>/dev/null)
        local new_files_gdrive=$(jq -r '.operations[] | select(.type == "copy_to_gdrive" and .reason == "new_file") | .destination' "$archive_dir/sync-plan.json" 2>/dev/null)

        # Ask user if they want to remove new files added during sync
        if [ -n "$new_files_local" ] || [ -n "$new_files_gdrive" ]; then
            echo ""
            echo -e "${YELLOW}The sync added new files. Do you want to remove them?${NC}"
            read -p "Remove new files added during sync? (yes/no): " remove_new

            if [ "$remove_new" = "yes" ]; then
                # Remove new files in local
                if [ -n "$new_files_local" ]; then
                    while IFS= read -r filepath; do
                        if [ -f "$filepath" ]; then
                            rm "$filepath" 2>/dev/null && echo "  ✓ Removed: $(basename "$filepath")"
                        fi
                    done <<< "$new_files_local"
                fi

                # Remove new files in GDrive
                if [ -n "$new_files_gdrive" ]; then
                    while IFS= read -r filepath; do
                        if [ -f "$filepath" ]; then
                            rm "$filepath" 2>/dev/null && echo "  ✓ Removed: $(basename "$filepath")"
                        fi
                    done <<< "$new_files_gdrive"
                fi
            fi
        fi
    fi

    # Generate rollback report
    local rollback_report="$archive_dir/rollback-report-$(date +%Y%m%d-%H%M%S).txt"

    {
        echo "═══════════════════════════════════════════════════════════════"
        echo "  ROLLBACK REPORT"
        echo "  $(date '+%B %d, %Y @ %I:%M %p')"
        echo "═══════════════════════════════════════════════════════════════"
        echo ""
        echo "Archive: $archive_timestamp"
        echo "Venture: $venture_name"
        echo ""
        echo "Files restored: $restored_count"
        echo "Errors: $error_count"
        echo ""
        echo "═══════════════════════════════════════════════════════════════"
    } > "$rollback_report"

    echo ""
    echo "════════════════════════════════════════════════════════════"
    echo "  ROLLBACK COMPLETE"
    echo "════════════════════════════════════════════════════════════"
    echo ""
    echo "  Files restored: $restored_count"
    echo "  Errors: $error_count"
    echo ""
    echo "  Report: $rollback_report"
    echo ""
    echo "════════════════════════════════════════════════════════════"
    echo ""

    if [ $error_count -eq 0 ]; then
        echo -e "${GREEN}✓ Rollback completed successfully${NC}"
        echo ""
        return 0
    else
        echo -e "${YELLOW}⚠️  Rollback completed with $error_count errors${NC}"
        echo ""
        return 1
    fi
}

# Show rollback preview (dry-run)
preview_rollback() {
    local archive_timestamp="$1"
    local archive_base="${2:-/Users/troybrave/.claude/.sync-archive}"

    local archive_dir="$archive_base/$archive_timestamp"

    echo ""
    echo "════════════════════════════════════════════════════════════"
    echo "  ROLLBACK PREVIEW"
    echo "════════════════════════════════════════════════════════════"
    echo ""

    if [ ! -d "$archive_dir" ]; then
        echo "Archive not found: $archive_timestamp"
        return 1
    fi

    # Load metadata
    if [ -f "$archive_dir/metadata.json" ]; then
        local venture_name=$(jq -r '.venture_name' "$archive_dir/metadata.json")
        local sync_time=$(jq -r '.sync_timestamp' "$archive_dir/metadata.json")

        echo "Archive: $archive_timestamp"
        echo "Venture: $venture_name"
        echo "Sync time: $sync_time"
        echo ""
    fi

    # Count files that would be restored
    local local_backup_count=0
    local gdrive_backup_count=0

    if [ -d "$archive_dir/local-backups" ]; then
        local_backup_count=$(find "$archive_dir/local-backups" -type f 2>/dev/null | wc -l | tr -d ' ')
    fi

    if [ -d "$archive_dir/gdrive-backups" ]; then
        gdrive_backup_count=$(find "$archive_dir/gdrive-backups" -type f 2>/dev/null | wc -l | tr -d ' ')
    fi

    echo "Files that would be restored:"
    echo "  Local: $local_backup_count"
    echo "  GDrive: $gdrive_backup_count"
    echo "  Total: $((local_backup_count + gdrive_backup_count))"
    echo ""

    # Show sync plan summary
    if [ -f "$archive_dir/sync-plan.json" ]; then
        echo "Original sync operations:"
        local total_ops=$(jq '.summary.total_operations' "$archive_dir/sync-plan.json")
        local to_local=$(jq '.summary.copy_to_local' "$archive_dir/sync-plan.json")
        local to_gdrive=$(jq '.summary.copy_to_gdrive' "$archive_dir/sync-plan.json")
        local conflicts=$(jq '.summary.conflicts' "$archive_dir/sync-plan.json")

        echo "  Total operations: $total_ops"
        echo "  Copied to Local: $to_local"
        echo "  Copied to GDrive: $to_gdrive"
        echo "  Conflicts: $conflicts"
        echo ""
    fi

    echo "════════════════════════════════════════════════════════════"
    echo ""
}

# Export functions
export -f perform_rollback
export -f preview_rollback
