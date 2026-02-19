#!/bin/bash
# Layer 3: Backup - Create incremental backups before any modifications

LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Create archive directory for this sync session
create_sync_archive() {
    local timestamp="$1"
    local archive_base="${2:-/Users/troybrave/.claude/.sync-archive}"

    local archive_dir="$archive_base/$timestamp"

    # Create directory structure
    mkdir -p "$archive_dir/pre-sync-manifests"
    mkdir -p "$archive_dir/local-backups"
    mkdir -p "$archive_dir/gdrive-backups"

    echo "[BACKUP] Created archive directory: $archive_dir" >> "${LOG_FILE}"

    # Return archive directory path
    echo "$archive_dir"
}

# Backup a file before modification
backup_file() {
    local filepath="$1"
    local archive_dir="$2"
    local location="$3"  # "local" or "gdrive"
    local base_path="$4"

    if [ ! -f "$filepath" ]; then
        echo "[BACKUP] Skipping backup - file doesn't exist: $filepath" >> "${LOG_FILE}"
        return 0
    fi

    # Determine backup subdirectory
    local backup_subdir="$archive_dir/${location}-backups"

    # Get relative path from base
    local relpath="${filepath#$base_path/}"

    # Create directory structure in backup
    local backup_dest="$backup_subdir/$relpath"
    local backup_dir=$(dirname "$backup_dest")

    mkdir -p "$backup_dir"

    # Copy file to backup location
    if cp -p "$filepath" "$backup_dest" 2>/dev/null; then
        # Verify backup
        local orig_size=$(stat -f "%z" "$filepath" 2>/dev/null || echo "0")
        local backup_size=$(stat -f "%z" "$backup_dest" 2>/dev/null || echo "0")

        if [ "$orig_size" = "$backup_size" ]; then
            echo "[BACKUP] ✓ Backed up: $relpath ($orig_size bytes)" >> "${LOG_FILE}"
            return 0
        else
            echo "[BACKUP] ERROR: Backup size mismatch for $relpath" >> "${LOG_FILE}"
            return 1
        fi
    else
        echo "[BACKUP] ERROR: Failed to backup $relpath" >> "${LOG_FILE}"
        return 1
    fi
}

# Save sync plan to archive
save_sync_plan() {
    local archive_dir="$1"
    local plan_file="$2"

    if [ ! -f "$plan_file" ]; then
        echo "[BACKUP] ERROR: Plan file not found: $plan_file" >> "${LOG_FILE}"
        return 1
    fi

    cp "$plan_file" "$archive_dir/sync-plan.json"
    echo "[BACKUP] Saved sync plan to archive" >> "${LOG_FILE}"
    return 0
}

# Save manifests to archive
save_manifests() {
    local archive_dir="$1"
    local local_manifest="$2"
    local gdrive_manifest="$3"

    if [ ! -f "$local_manifest" ] || [ ! -f "$gdrive_manifest" ]; then
        echo "[BACKUP] ERROR: Manifest files not found" >> "${LOG_FILE}"
        return 1
    fi

    cp "$local_manifest" "$archive_dir/pre-sync-manifests/local_manifest.json"
    cp "$gdrive_manifest" "$archive_dir/pre-sync-manifests/gdrive_manifest.json"

    echo "[BACKUP] Saved manifests to archive" >> "${LOG_FILE}"
    return 0
}

# Save comparison results to archive
save_comparison() {
    local archive_dir="$1"
    local comparison_file="$2"

    if [ ! -f "$comparison_file" ]; then
        echo "[BACKUP] ERROR: Comparison file not found: $comparison_file" >> "${LOG_FILE}"
        return 1
    fi

    cp "$comparison_file" "$archive_dir/manifest-comparison.json"
    echo "[BACKUP] Saved comparison to archive" >> "${LOG_FILE}"
    return 0
}

# Create metadata file for the archive
create_archive_metadata() {
    local archive_dir="$1"
    local venture_name="$2"
    local local_base="$3"
    local gdrive_base="$4"

    local metadata='{
        "sync_timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'",
        "venture_name": "'$venture_name'",
        "local_base": "'$local_base'",
        "gdrive_base": "'$gdrive_base'",
        "hostname": "'$(hostname)'",
        "user": "'$(whoami)'"
    }'

    echo "$metadata" | jq '.' > "$archive_dir/metadata.json"

    echo "[BACKUP] Created archive metadata" >> "${LOG_FILE}"
    return 0
}

# Clean up old archives (keep only last N days)
cleanup_old_archives() {
    local archive_base="${1:-/Users/troybrave/.claude/.sync-archive}"
    local retention_days="${2:-30}"

    echo "[BACKUP] Cleaning up archives older than $retention_days days..." >> "${LOG_FILE}"

    # Find directories older than retention period
    local deleted=0
    while IFS= read -r archive_dir; do
        if [ -d "$archive_dir" ]; then
            rm -rf "$archive_dir"
            deleted=$((deleted + 1))
            echo "[BACKUP] Deleted old archive: $(basename "$archive_dir")" >> "${LOG_FILE}"
        fi
    done < <(find "$archive_base" -maxdepth 1 -type d -mtime +${retention_days} 2>/dev/null | grep -v "^${archive_base}$")

    if [ $deleted -gt 0 ]; then
        echo "[BACKUP] Cleaned up $deleted old archive(s)" >> "${LOG_FILE}"
    else
        echo "[BACKUP] No old archives to clean up" >> "${LOG_FILE}"
    fi

    return 0
}

# Get list of available archives for rollback
list_archives() {
    local archive_base="${1:-/Users/troybrave/.claude/.sync-archive}"

    if [ ! -d "$archive_base" ]; then
        echo "No archives found"
        return 1
    fi

    echo ""
    echo "════════════════════════════════════════════════════════════"
    echo "  AVAILABLE ARCHIVES (for rollback)"
    echo "════════════════════════════════════════════════════════════"
    echo ""

    local count=0
    while IFS= read -r archive_dir; do
        if [ -f "$archive_dir/metadata.json" ]; then
            local timestamp=$(basename "$archive_dir")
            local venture=$(jq -r '.venture_name' "$archive_dir/metadata.json" 2>/dev/null || echo "Unknown")
            local sync_time=$(jq -r '.sync_timestamp' "$archive_dir/metadata.json" 2>/dev/null || echo "Unknown")

            echo "  $timestamp"
            echo "    Venture: $venture"
            echo "    Sync time: $sync_time"
            echo ""

            count=$((count + 1))
        fi
    done < <(find "$archive_base" -maxdepth 1 -type d -name "????????-??????" 2>/dev/null | sort -r)

    if [ $count -eq 0 ]; then
        echo "  No archives found"
        echo ""
    else
        echo "  Total archives: $count"
        echo ""
    fi

    echo "════════════════════════════════════════════════════════════"
    echo ""

    return 0
}

# Export functions
export -f create_sync_archive
export -f backup_file
export -f save_sync_plan
export -f save_manifests
export -f save_comparison
export -f create_archive_metadata
export -f cleanup_old_archives
export -f list_archives
