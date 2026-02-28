#!/bin/bash
# Layer 2: Sync Plan - Create execution plan from manifest comparison

LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Create sync plan from manifest comparison
create_sync_plan() {
    local comparison_file="$1"
    local local_base="$2"
    local gdrive_base="$3"
    local plan_file="$4"

    echo "[SYNC-PLAN] Creating sync plan..." >> "${LOG_FILE}"

    if [ ! -f "$comparison_file" ]; then
        echo "[ERROR] Comparison file not found: $comparison_file" >> "${LOG_FILE}"
        return 1
    fi

    # Initialize plan
    local plan_json='{
        "created_at": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'",
        "local_base": "'$local_base'",
        "gdrive_base": "'$gdrive_base'",
        "operations": [],
        "summary": {
            "total_operations": 0,
            "copy_to_local": 0,
            "copy_to_gdrive": 0,
            "conflicts": 0,
            "would_delete": 0
        }
    }'

    local operations="[]"
    local total_ops=0
    local copy_to_local=0
    local copy_to_gdrive=0
    local conflicts=0

    # Process new files in GDrive -> copy to local
    local new_gdrive=$(jq -c '.new_in_gdrive[]' "$comparison_file" 2>/dev/null)
    if [ -n "$new_gdrive" ]; then
        while IFS= read -r file; do
            local filepath=$(echo "$file" | jq -r '.path')
            operations=$(echo "$operations" | jq \
                --arg src "$gdrive_base/$filepath" \
                --arg dst "$local_base/$filepath" \
                --arg type "copy_to_local" \
                --arg reason "new_file" \
                '. += [{
                    type: $type,
                    source: $src,
                    destination: $dst,
                    reason: $reason,
                    backup_required: false
                }]')
            total_ops=$((total_ops + 1))
            copy_to_local=$((copy_to_local + 1))
        done <<< "$new_gdrive"
    fi

    # Process new files in Local -> copy to GDrive
    local new_local=$(jq -c '.new_in_local[]' "$comparison_file" 2>/dev/null)
    if [ -n "$new_local" ]; then
        while IFS= read -r file; do
            local filepath=$(echo "$file" | jq -r '.path')
            operations=$(echo "$operations" | jq \
                --arg src "$local_base/$filepath" \
                --arg dst "$gdrive_base/$filepath" \
                --arg type "copy_to_gdrive" \
                --arg reason "new_file" \
                '. += [{
                    type: $type,
                    source: $src,
                    destination: $dst,
                    reason: $reason,
                    backup_required: false
                }]')
            total_ops=$((total_ops + 1))
            copy_to_gdrive=$((copy_to_gdrive + 1))
        done <<< "$new_local"
    fi

    # Process modified files in GDrive (newer) -> copy to local
    local mod_gdrive=$(jq -c '.modified_in_gdrive[]' "$comparison_file" 2>/dev/null)
    if [ -n "$mod_gdrive" ]; then
        while IFS= read -r file; do
            local filepath=$(echo "$file" | jq -r '.path')
            operations=$(echo "$operations" | jq \
                --arg src "$gdrive_base/$filepath" \
                --arg dst "$local_base/$filepath" \
                --arg type "copy_to_local" \
                --arg reason "newer_in_gdrive" \
                '. += [{
                    type: $type,
                    source: $src,
                    destination: $dst,
                    reason: $reason,
                    backup_required: true
                }]')
            total_ops=$((total_ops + 1))
            copy_to_local=$((copy_to_local + 1))
        done <<< "$mod_gdrive"
    fi

    # Process modified files in Local (newer) -> copy to GDrive
    local mod_local=$(jq -c '.modified_in_local[]' "$comparison_file" 2>/dev/null)
    if [ -n "$mod_local" ]; then
        while IFS= read -r file; do
            local filepath=$(echo "$file" | jq -r '.path')
            operations=$(echo "$operations" | jq \
                --arg src "$local_base/$filepath" \
                --arg dst "$gdrive_base/$filepath" \
                --arg type "copy_to_gdrive" \
                --arg reason "newer_in_local" \
                '. += [{
                    type: $type,
                    source: $src,
                    destination: $dst,
                    reason: $reason,
                    backup_required: true
                }]')
            total_ops=$((total_ops + 1))
            copy_to_gdrive=$((copy_to_gdrive + 1))
        done <<< "$mod_local"
    fi

    # Process conflicts -> preserve both versions
    local conflict_files=$(jq -c '.conflicts[]' "$comparison_file" 2>/dev/null)
    if [ -n "$conflict_files" ]; then
        while IFS= read -r conflict; do
            local filepath=$(echo "$conflict" | jq -r '.local.path')
            local filename=$(basename "$filepath")
            local dirname=$(dirname "$filepath")
            local extension="${filename##*.}"
            local basename="${filename%.*}"

            # If no extension, handle differently
            if [ "$extension" = "$filename" ]; then
                basename="$filename"
                extension=""
            fi

            # Create conflict filenames
            local conflict_local="${basename}_CONFLICT_local${extension:+.$extension}"
            local conflict_gdrive="${basename}_CONFLICT_gdrive${extension:+.$extension}"

            # Add operations to rename both versions
            operations=$(echo "$operations" | jq \
                --arg src "$local_base/$filepath" \
                --arg dst "$local_base/$dirname/$conflict_local" \
                --arg type "conflict_preserve_local" \
                --arg reason "conflict_detected" \
                '. += [{
                    type: $type,
                    source: $src,
                    destination: $dst,
                    reason: $reason,
                    backup_required: false,
                    conflict: true
                }]')

            operations=$(echo "$operations" | jq \
                --arg src "$gdrive_base/$filepath" \
                --arg dst "$local_base/$dirname/$conflict_gdrive" \
                --arg type "conflict_preserve_gdrive" \
                --arg reason "conflict_detected" \
                '. += [{
                    type: $type,
                    source: $src,
                    destination: $dst,
                    reason: $reason,
                    backup_required: false,
                    conflict: true
                }]')

            # Also copy conflict markers to GDrive
            operations=$(echo "$operations" | jq \
                --arg src "$local_base/$dirname/$conflict_local" \
                --arg dst "$gdrive_base/$dirname/$conflict_local" \
                --arg type "conflict_sync_to_gdrive" \
                --arg reason "conflict_sync" \
                '. += [{
                    type: $type,
                    source: $src,
                    destination: $dst,
                    reason: $reason,
                    backup_required: false,
                    conflict: true
                }]')

            total_ops=$((total_ops + 3))
            conflicts=$((conflicts + 1))
        done <<< "$conflict_files"
    fi

    # Build final plan
    plan_json=$(jq -n \
        --arg created "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
        --arg local_base "$local_base" \
        --arg gdrive_base "$gdrive_base" \
        --argjson ops "$operations" \
        --arg total "$total_ops" \
        --arg to_local "$copy_to_local" \
        --arg to_gdrive "$copy_to_gdrive" \
        --arg conflicts "$conflicts" \
        '{
            created_at: $created,
            local_base: $local_base,
            gdrive_base: $gdrive_base,
            operations: $ops,
            summary: {
                total_operations: ($total | tonumber),
                copy_to_local: ($to_local | tonumber),
                copy_to_gdrive: ($to_gdrive | tonumber),
                conflicts: ($conflicts | tonumber),
                would_delete: 0
            }
        }')

    # Write plan to file
    echo "$plan_json" | jq '.' > "$plan_file"

    echo ""
    echo "════════════════════════════════════════════════════════════"
    echo "  SYNC PLAN SUMMARY"
    echo "════════════════════════════════════════════════════════════"
    echo ""
    echo "  Total operations: $total_ops"
    echo "  Copy to Local: $copy_to_local"
    echo "  Copy to GDrive: $copy_to_gdrive"
    echo "  Conflicts: $conflicts"
    echo "  Would delete: 0 (deletion disabled)"
    echo ""
    echo "════════════════════════════════════════════════════════════"
    echo ""

    echo "[SYNC-PLAN] Plan created: $total_ops operations" >> "${LOG_FILE}"

    return 0
}

# Validate sync plan for safety
validate_sync_plan() {
    local plan_file="$1"

    echo "[SYNC-PLAN] Validating sync plan..." >> "${LOG_FILE}"

    if [ ! -f "$plan_file" ]; then
        echo "[ERROR] Plan file not found: $plan_file" >> "${LOG_FILE}"
        return 1
    fi

    # Check if plan would delete files
    local would_delete=$(jq '.summary.would_delete' "$plan_file")

    if [ "$would_delete" -gt 0 ]; then
        echo "[ERROR] CRITICAL: Sync plan would delete $would_delete files - ABORTING" >> "${LOG_FILE}"
        echo "ERROR: Sync plan would delete files - this should NEVER happen"
        return 1
    fi

    # All validations passed
    echo "[SYNC-PLAN] Validation passed - plan is safe" >> "${LOG_FILE}"
    return 0
}

# Export functions
export -f create_sync_plan
export -f validate_sync_plan
