#!/bin/bash
# Layer 5: Post-sync verification - Ensure sync completed correctly

LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source manifest functions
source "${LIB_DIR}/manifest.sh"

# Verify sync results
verify_sync() {
    local local_base="$1"
    local gdrive_base="$2"
    local plan_file="$3"
    local archive_dir="$4"
    local pre_local_manifest="$5"
    local pre_gdrive_manifest="$6"

    echo ""
    echo "════════════════════════════════════════════════════════════"
    echo "  POST-SYNC VERIFICATION"
    echo "════════════════════════════════════════════════════════════"
    echo ""

    echo "[VERIFY] Starting post-sync verification..." >> "${LOG_FILE}"

    local verification_passed=true
    local errors=()

    # Generate post-sync manifests
    echo "Generating post-sync manifests..."

    local post_local_manifest="${archive_dir}/post-sync-manifests/local_manifest.json"
    local post_gdrive_manifest="${archive_dir}/post-sync-manifests/gdrive_manifest.json"

    mkdir -p "${archive_dir}/post-sync-manifests"

    generate_manifest "$local_base" "$post_local_manifest" "Local (post-sync)"
    generate_manifest "$gdrive_base" "$post_gdrive_manifest" "GDrive (post-sync)"

    # Get file counts
    local pre_local_count=$(jq '.stats.total_files' "$pre_local_manifest" 2>/dev/null || echo "0")
    local pre_gdrive_count=$(jq '.stats.total_files' "$pre_gdrive_manifest" 2>/dev/null || echo "0")
    local post_local_count=$(jq '.stats.total_files' "$post_local_manifest" 2>/dev/null || echo "0")
    local post_gdrive_count=$(jq '.stats.total_files' "$post_gdrive_manifest" 2>/dev/null || echo "0")

    local pre_total=$((pre_local_count + pre_gdrive_count))
    local post_total=$((post_local_count + post_gdrive_count))

    echo ""
    echo "File count analysis:"
    echo "  Local: $pre_local_count → $post_local_count ($(($post_local_count - $pre_local_count)))"
    echo "  GDrive: $pre_gdrive_count → $post_gdrive_count ($(($post_gdrive_count - $pre_gdrive_count)))"
    echo "  Total: $pre_total → $post_total ($(($post_total - $pre_total)))"
    echo ""

    # CRITICAL CHECK: File count should never decrease
    if [ $post_total -lt $pre_total ]; then
        echo "✗ CRITICAL: Total file count DECREASED ($pre_total → $post_total)"
        echo "[VERIFY] CRITICAL: File count decreased" >> "${LOG_FILE}"
        verification_passed=false
        errors+=("File count decreased - possible data loss")
    else
        echo "✓ File count check passed (no files lost)"
    fi

    # Verify operations from plan were executed
    local expected_ops=$(jq '.summary.total_operations' "$plan_file" 2>/dev/null || echo "0")

    if [ "$expected_ops" -gt 0 ]; then
        echo ""
        echo "Verifying planned operations were executed..."

        local verified_ops=0
        local failed_ops=0

        # Check each operation
        local op_index=0
        while [ $op_index -lt $expected_ops ]; do
            local operation=$(jq -c ".operations[$op_index]" "$plan_file")
            local destination=$(echo "$operation" | jq -r '.destination')

            if [ -f "$destination" ]; then
                verified_ops=$((verified_ops + 1))
            else
                failed_ops=$((failed_ops + 1))
                echo "  ✗ Missing: $(basename "$destination")"
                echo "[VERIFY] Missing file: $destination" >> "${LOG_FILE}"
            fi

            op_index=$((op_index + 1))
        done

        echo "  Verified: $verified_ops/$expected_ops operations"

        if [ $failed_ops -gt 0 ]; then
            verification_passed=false
            errors+=("$failed_ops operations not completed")
        else
            echo "✓ All planned operations completed"
        fi
    else
        echo "✓ No operations were planned (already in sync)"
    fi

    # Generate verification report
    local verification_report="${archive_dir}/verification-report.json"

    local report=$(jq -n \
        --arg timestamp "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
        --arg passed "$verification_passed" \
        --arg pre_local "$pre_local_count" \
        --arg pre_gdrive "$pre_gdrive_count" \
        --arg post_local "$post_local_count" \
        --arg post_gdrive "$post_gdrive_count" \
        --argjson errors "$(printf '%s\n' "${errors[@]}" | jq -R . | jq -s .)" \
        '{
            verified_at: $timestamp,
            passed: ($passed == "true"),
            file_counts: {
                pre_sync: {
                    local: ($pre_local | tonumber),
                    gdrive: ($pre_gdrive | tonumber),
                    total: (($pre_local | tonumber) + ($pre_gdrive | tonumber))
                },
                post_sync: {
                    local: ($post_local | tonumber),
                    gdrive: ($post_gdrive | tonumber),
                    total: (($post_local | tonumber) + ($post_gdrive | tonumber))
                }
            },
            errors: $errors
        }')

    echo "$report" | jq '.' > "$verification_report"

    echo ""
    echo "════════════════════════════════════════════════════════════"

    if [ "$verification_passed" = true ]; then
        echo "  ✓ VERIFICATION PASSED"
        echo "════════════════════════════════════════════════════════════"
        echo ""
        echo "[VERIFY] Verification passed" >> "${LOG_FILE}"
        return 0
    else
        echo "  ✗ VERIFICATION FAILED"
        echo "════════════════════════════════════════════════════════════"
        echo ""
        echo "Errors:"
        for error in "${errors[@]}"; do
            echo "  • $error"
        done
        echo ""
        echo "[VERIFY] Verification failed" >> "${LOG_FILE}"
        return 1
    fi
}

# Quick verification without full manifest generation
quick_verify() {
    local plan_file="$1"

    echo "[VERIFY] Quick verification of plan..." >> "${LOG_FILE}"

    # Just check that no deletions would occur
    local would_delete=$(jq '.summary.would_delete' "$plan_file" 2>/dev/null || echo "0")

    if [ "$would_delete" -gt 0 ]; then
        echo "✗ Plan would delete $would_delete files - UNSAFE"
        return 1
    fi

    echo "✓ Quick verification passed"
    return 0
}

# Generate human-readable sync report
generate_sync_report() {
    local archive_dir="$1"
    local venture_name="$2"
    local start_time="$3"
    local end_time="$4"

    local report_file="${archive_dir}/sync-report.txt"

    local plan_file="${archive_dir}/sync-plan.json"
    local verification_file="${archive_dir}/verification-report.json"

    # Calculate duration
    local duration=$((end_time - start_time))
    local minutes=$((duration / 60))
    local seconds=$((duration % 60))

    # Extract data
    local total_ops=$(jq '.summary.total_operations' "$plan_file" 2>/dev/null || echo "0")
    local copy_to_local=$(jq '.summary.copy_to_local' "$plan_file" 2>/dev/null || echo "0")
    local copy_to_gdrive=$(jq '.summary.copy_to_gdrive' "$plan_file" 2>/dev/null || echo "0")
    local conflicts=$(jq '.summary.conflicts' "$plan_file" 2>/dev/null || echo "0")

    local pre_total=$(jq '.file_counts.pre_sync.total' "$verification_file" 2>/dev/null || echo "0")
    local post_total=$(jq '.file_counts.post_sync.total' "$verification_file" 2>/dev/null || echo "0")
    local diff=$((post_total - pre_total))

    local passed=$(jq '.passed' "$verification_file" 2>/dev/null || echo "false")

    # Generate report
    {
        echo "═══════════════════════════════════════════════════════════════"
        echo "  SYNC REPORT: $venture_name"
        echo "  $(date '+%B %d, %Y @ %I:%M %p')"
        echo "═══════════════════════════════════════════════════════════════"
        echo ""

        if [ "$passed" = "true" ]; then
            echo "✅ Sync completed successfully"
        else
            echo "❌ Sync completed with errors"
        fi

        echo ""
        echo "📊 SUMMARY:"
        echo "  • Total operations: $total_ops"
        echo "  • Files copied to Local: $copy_to_local"
        echo "  • Files copied to GDrive: $copy_to_gdrive"
        echo "  • Conflicts detected: $conflicts"
        echo "  • Total files: $pre_total → $post_total (+$diff)"
        echo ""
        echo "⏱️  Duration: ${minutes}m ${seconds}s"
        echo "💾 Archive: $archive_dir"
        echo "🔄 Rollback available for 30 days"
        echo ""
        echo "═══════════════════════════════════════════════════════════════"
    } > "$report_file"

    # Also output to console
    cat "$report_file"

    echo "[VERIFY] Sync report generated: $report_file" >> "${LOG_FILE}"
}

# Export functions
export -f verify_sync
export -f quick_verify
export -f generate_sync_report
