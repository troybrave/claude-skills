#!/bin/bash
# Layer 4: Safe Copy - Atomic copy operations with verification

LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source manifest functions for MD5 calculation
source "${LIB_DIR}/manifest.sh"

# Safe atomic copy with verification
safe_copy() {
    local source="$1"
    local destination="$2"

    # Verify source exists and is readable
    if [ ! -f "$source" ]; then
        echo "[COPY] ERROR: Source file doesn't exist: $source" >> "${LOG_FILE}"
        return 1
    fi

    if [ ! -r "$source" ]; then
        echo "[COPY] ERROR: Source file not readable: $source" >> "${LOG_FILE}"
        return 1
    fi

    # Create destination directory if needed
    local dest_dir=$(dirname "$destination")
    if [ ! -d "$dest_dir" ]; then
        mkdir -p "$dest_dir"
        if [ $? -ne 0 ]; then
            echo "[COPY] ERROR: Failed to create destination directory: $dest_dir" >> "${LOG_FILE}"
            return 1
        fi
    fi

    # Use temporary file for atomic operation
    local temp_dest="${destination}.tmp.$$"

    # Copy to temporary location
    if ! cp -p "$source" "$temp_dest" 2>/dev/null; then
        echo "[COPY] ERROR: Failed to copy to temp location: $temp_dest" >> "${LOG_FILE}"
        rm -f "$temp_dest" 2>/dev/null
        return 1
    fi

    # Verify copy by comparing sizes
    local source_size=$(stat -f "%z" "$source" 2>/dev/null || echo "0")
    local temp_size=$(stat -f "%z" "$temp_dest" 2>/dev/null || echo "0")

    if [ "$source_size" != "$temp_size" ]; then
        echo "[COPY] ERROR: Size mismatch - source: $source_size, temp: $temp_size" >> "${LOG_FILE}"
        rm -f "$temp_dest" 2>/dev/null
        return 1
    fi

    # Verify copy by MD5 hash
    local source_md5=$(calculate_md5 "$source")
    local temp_md5=$(calculate_md5 "$temp_dest")

    if [ "$source_md5" != "$temp_md5" ]; then
        echo "[COPY] ERROR: MD5 mismatch - source: $source_md5, temp: $temp_md5" >> "${LOG_FILE}"
        rm -f "$temp_dest" 2>/dev/null
        return 1
    fi

    # Atomic move from temp to final destination
    if ! mv "$temp_dest" "$destination" 2>/dev/null; then
        echo "[COPY] ERROR: Failed to move temp to final destination" >> "${LOG_FILE}"
        rm -f "$temp_dest" 2>/dev/null
        return 1
    fi

    # Final verification
    if [ ! -f "$destination" ]; then
        echo "[COPY] ERROR: Destination file doesn't exist after move" >> "${LOG_FILE}"
        return 1
    fi

    local dest_size=$(stat -f "%z" "$destination" 2>/dev/null || echo "0")
    if [ "$source_size" != "$dest_size" ]; then
        echo "[COPY] ERROR: Final size mismatch" >> "${LOG_FILE}"
        return 1
    fi

    # Success
    echo "[COPY] ✓ Copied: $(basename "$source") ($source_size bytes, MD5: ${source_md5:0:8}...)" >> "${LOG_FILE}"
    return 0
}

# Execute sync plan operations
execute_sync_plan() {
    local plan_file="$1"
    local archive_dir="$2"
    local dry_run="${3:-false}"

    echo "[COPY] Executing sync plan..." >> "${LOG_FILE}"

    if [ ! -f "$plan_file" ]; then
        echo "[COPY] ERROR: Plan file not found: $plan_file" >> "${LOG_FILE}"
        return 1
    fi

    # Get operation count
    local total_ops=$(jq '.summary.total_operations' "$plan_file")

    if [ "$total_ops" -eq 0 ]; then
        echo ""
        echo "✓ No operations needed - everything is in sync"
        echo ""
        echo "[COPY] No operations needed" >> "${LOG_FILE}"
        return 0
    fi

    echo ""
    echo "════════════════════════════════════════════════════════════"
    if [ "$dry_run" = "true" ]; then
        echo "  DRY RUN - Executing $total_ops operations (no actual changes)"
    else
        echo "  Executing $total_ops operations"
    fi
    echo "════════════════════════════════════════════════════════════"
    echo ""

    local success_count=0
    local failure_count=0
    local backup_count=0
    local conflict_count=0

    # Process each operation
    local op_index=0
    while [ $op_index -lt $total_ops ]; do
        local operation=$(jq -c ".operations[$op_index]" "$plan_file")

        local op_type=$(echo "$operation" | jq -r '.type')
        local source=$(echo "$operation" | jq -r '.source')
        local destination=$(echo "$operation" | jq -r '.destination')
        local reason=$(echo "$operation" | jq -r '.reason')
        local backup_required=$(echo "$operation" | jq -r '.backup_required')
        local is_conflict=$(echo "$operation" | jq -r '.conflict // false')

        # Progress indicator
        local progress=$((op_index + 1))
        echo "[$progress/$total_ops] $op_type: $(basename "$source")"

        if [ "$dry_run" = "true" ]; then
            echo "  [DRY RUN] Would copy: $source -> $destination"
            success_count=$((success_count + 1))
        else
            # Backup if required
            if [ "$backup_required" = "true" ] && [ -f "$destination" ]; then
                local location=""
                if [[ "$op_type" == *"to_local" ]]; then
                    location="local"
                    local local_base=$(jq -r '.local_base' "$plan_file")
                    backup_file "$destination" "$archive_dir" "$location" "$local_base"
                else
                    location="gdrive"
                    local gdrive_base=$(jq -r '.gdrive_base' "$plan_file")
                    backup_file "$destination" "$archive_dir" "$location" "$gdrive_base"
                fi

                if [ $? -eq 0 ]; then
                    backup_count=$((backup_count + 1))
                fi
            fi

            # Perform copy
            if safe_copy "$source" "$destination"; then
                success_count=$((success_count + 1))

                if [ "$is_conflict" = "true" ]; then
                    conflict_count=$((conflict_count + 1))
                fi
            else
                failure_count=$((failure_count + 1))
                echo "  ✗ Failed: $source -> $destination"
            fi
        fi

        op_index=$((op_index + 1))
    done

    echo ""
    echo "════════════════════════════════════════════════════════════"
    echo "  EXECUTION COMPLETE"
    echo "════════════════════════════════════════════════════════════"
    echo ""
    echo "  Successful: $success_count"
    echo "  Failed: $failure_count"
    echo "  Backups created: $backup_count"
    echo "  Conflicts preserved: $((conflict_count / 3))"  # Divide by 3 because conflicts create 3 operations
    echo ""
    echo "════════════════════════════════════════════════════════════"
    echo ""

    echo "[COPY] Execution complete: $success_count succeeded, $failure_count failed" >> "${LOG_FILE}"

    if [ $failure_count -gt 0 ]; then
        return 1
    fi

    return 0
}

# Simple progress bar
show_progress() {
    local current="$1"
    local total="$2"
    local width=50

    local percent=$((current * 100 / total))
    local filled=$((width * current / total))

    printf "\r["
    printf "%${filled}s" | tr ' ' '='
    printf "%$((width - filled))s" | tr ' ' ' '
    printf "] %3d%%" $percent
}

# Export functions
export -f safe_copy
export -f execute_sync_plan
export -f show_progress
