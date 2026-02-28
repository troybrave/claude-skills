#!/bin/bash
# Layer 2: Manifest generation - Create snapshots of file systems

LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Load exclusion patterns from sync-rules.json
load_exclusions() {
    local rules_file="${LIB_DIR}/../config/sync-rules.json"
    if [ -f "$rules_file" ]; then
        EXCLUSION_PATTERNS=$(jq -r '.exclusions.patterns[]' "$rules_file" 2>/dev/null || echo "")
    else
        EXCLUSION_PATTERNS=".DS_Store
*.tmp
.git
node_modules"
    fi
}

# Check if file should be excluded
should_exclude() {
    local filepath="$1"
    local filename=$(basename "$filepath")

    # Check against each exclusion pattern
    while IFS= read -r pattern; do
        [ -z "$pattern" ] && continue

        # Handle glob patterns
        case "$filename" in
            $pattern)
                return 0  # Exclude this file
                ;;
        esac

        # Check if path contains excluded directory
        if [[ "$filepath" == *"/$pattern/"* ]] || [[ "$filepath" == *"/$pattern" ]]; then
            return 0  # Exclude this file
        fi
    done <<< "$EXCLUSION_PATTERNS"

    return 1  # Don't exclude
}

# Calculate MD5 hash of a file
calculate_md5() {
    local filepath="$1"

    if [ ! -f "$filepath" ]; then
        echo ""
        return 1
    fi

    # macOS uses md5, Linux uses md5sum
    if command -v md5 &> /dev/null; then
        md5 -q "$filepath" 2>/dev/null || echo ""
    elif command -v md5sum &> /dev/null; then
        md5sum "$filepath" 2>/dev/null | awk '{print $1}' || echo ""
    else
        echo ""
    fi
}

# Get file modification time in ISO format
get_mod_time() {
    local filepath="$1"

    if [ ! -f "$filepath" ]; then
        echo ""
        return 1
    fi

    # Get modification time in ISO 8601 format
    stat -f "%Sm" -t "%Y-%m-%dT%H:%M:%S" "$filepath" 2>/dev/null || echo ""
}

# Get file size in bytes
get_file_size() {
    local filepath="$1"

    if [ ! -f "$filepath" ]; then
        echo "0"
        return 1
    fi

    stat -f "%z" "$filepath" 2>/dev/null || echo "0"
}

# Generate manifest for a directory
generate_manifest() {
    local base_path="$1"
    local manifest_file="$2"
    local label="$3"

    echo "[MANIFEST] Generating manifest for $label: $base_path" >> "${LOG_FILE}"

    if [ ! -d "$base_path" ]; then
        echo "[ERROR] Directory does not exist: $base_path" >> "${LOG_FILE}"
        return 1
    fi

    # Load exclusions
    load_exclusions

    # Initialize manifest JSON
    local manifest_json='{"generated_at":"'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'","base_path":"'$base_path'","files":[],"stats":{"total_files":0,"total_size":0}}'

    local total_files=0
    local total_size=0
    local files_array="["

    echo "Scanning files in $label..."

    # Find all files (excluding directories)
    while IFS= read -r -d '' filepath; do
        # Get relative path
        local relpath="${filepath#$base_path/}"

        # Skip if excluded
        if should_exclude "$relpath"; then
            continue
        fi

        # Get file metadata
        local filesize=$(get_file_size "$filepath")
        local modtime=$(get_mod_time "$filepath")
        local md5hash=$(calculate_md5 "$filepath")

        # Add to files array
        if [ $total_files -gt 0 ]; then
            files_array+=","
        fi

        files_array+=$(jq -n \
            --arg path "$relpath" \
            --arg size "$filesize" \
            --arg mtime "$modtime" \
            --arg hash "$md5hash" \
            '{path: $path, size: ($size | tonumber), modified: $mtime, md5: $hash}')

        total_files=$((total_files + 1))
        total_size=$((total_size + filesize))

        # Progress indicator every 100 files
        if [ $((total_files % 100)) -eq 0 ]; then
            echo "  Scanned $total_files files..."
        fi

    done < <(find "$base_path" -type f -print0 2>/dev/null)

    files_array+="]"

    # Build final manifest
    manifest_json=$(jq -n \
        --arg gentime "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
        --arg basepath "$base_path" \
        --argjson files "$files_array" \
        --arg totalfiles "$total_files" \
        --arg totalsize "$total_size" \
        '{
            generated_at: $gentime,
            base_path: $basepath,
            files: $files,
            stats: {
                total_files: ($totalfiles | tonumber),
                total_size: ($totalsize | tonumber)
            }
        }')

    # Write manifest to file
    echo "$manifest_json" | jq '.' > "$manifest_file"

    echo "✓ Manifest generated: $total_files files, $(numfmt --to=iec-i --suffix=B $total_size 2>/dev/null || echo "${total_size} bytes")"
    echo "[MANIFEST] Generated: $total_files files, $total_size bytes" >> "${LOG_FILE}"

    return 0
}

# Compare two manifests and return file lists
compare_manifests() {
    local local_manifest="$1"
    local gdrive_manifest="$2"
    local output_file="$3"

    echo "[MANIFEST] Comparing manifests..." >> "${LOG_FILE}"

    if [ ! -f "$local_manifest" ] || [ ! -f "$gdrive_manifest" ]; then
        echo "[ERROR] Manifest files not found" >> "${LOG_FILE}"
        return 1
    fi

    # Use jq to compare manifests
    jq -n \
        --slurpfile local "$local_manifest" \
        --slurpfile gdrive "$gdrive_manifest" \
        '
        {
            new_in_local: [
                $local[0].files[] as $lf |
                select(
                    [$gdrive[0].files[].path] | index($lf.path) | not
                ) | $lf
            ],
            new_in_gdrive: [
                $gdrive[0].files[] as $gf |
                select(
                    [$local[0].files[].path] | index($gf.path) | not
                ) | $gf
            ],
            modified_in_local: [
                $local[0].files[] as $lf |
                $gdrive[0].files[] as $gf |
                select($lf.path == $gf.path and $lf.modified > $gf.modified) |
                $lf
            ],
            modified_in_gdrive: [
                $gdrive[0].files[] as $gf |
                $local[0].files[] as $lf |
                select($lf.path == $gf.path and $gf.modified > $lf.modified) |
                $gf
            ],
            conflicts: [
                $local[0].files[] as $lf |
                $gdrive[0].files[] as $gf |
                select($lf.path == $gf.path and $lf.modified != $gf.modified and $lf.md5 != $gf.md5) |
                {local: $lf, gdrive: $gf}
            ],
            identical: [
                $local[0].files[] as $lf |
                $gdrive[0].files[] as $gf |
                select($lf.path == $gf.path and $lf.md5 == $gf.md5) |
                $lf
            ]
        }
        ' > "$output_file"

    # Log summary
    local new_local=$(jq '.new_in_local | length' "$output_file")
    local new_gdrive=$(jq '.new_in_gdrive | length' "$output_file")
    local mod_local=$(jq '.modified_in_local | length' "$output_file")
    local mod_gdrive=$(jq '.modified_in_gdrive | length' "$output_file")
    local conflicts=$(jq '.conflicts | length' "$output_file")
    local identical=$(jq '.identical | length' "$output_file")

    echo "[MANIFEST] Comparison results:"
    echo "  New in local: $new_local"
    echo "  New in GDrive: $new_gdrive"
    echo "  Modified in local: $mod_local"
    echo "  Modified in GDrive: $mod_gdrive"
    echo "  Conflicts: $conflicts"
    echo "  Identical: $identical"

    return 0
}

# Export functions
export -f generate_manifest
export -f compare_manifests
export -f calculate_md5
export -f get_mod_time
export -f get_file_size
export -f should_exclude
export -f load_exclusions
