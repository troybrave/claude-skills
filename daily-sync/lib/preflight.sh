#!/bin/bash
# Layer 1: Pre-flight checks - Verify system is ready for sync

LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Global variables
PREFLIGHT_PASSED=true
PREFLIGHT_ERRORS=()

log_preflight() {
    echo "[PREFLIGHT] $1" >> "${LOG_FILE}"
    if [ "${VERBOSE}" = "true" ]; then
        echo "$1"
    fi
}

log_error() {
    echo -e "${RED}✗ $1${NC}"
    echo "[ERROR] $1" >> "${LOG_FILE}"
    PREFLIGHT_ERRORS+=("$1")
    PREFLIGHT_PASSED=false
}

log_success() {
    echo -e "${GREEN}✓ $1${NC}"
    log_preflight "✓ $1"
}

log_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
    log_preflight "⚠ $1"
}

# Check if directory exists and is accessible
check_directory() {
    local dir="$1"
    local label="$2"

    if [ ! -d "$dir" ]; then
        log_error "$label does not exist: $dir"
        return 1
    fi

    if [ ! -r "$dir" ]; then
        log_error "$label is not readable: $dir"
        return 1
    fi

    if [ ! -w "$dir" ]; then
        log_error "$label is not writable: $dir"
        return 1
    fi

    log_success "$label is accessible: $dir"
    return 0
}

# Check disk space
check_disk_space() {
    local path="$1"
    local min_percent="${2:-20}"

    # Get available space percentage
    local available=$(df -H "$path" | awk 'NR==2 {print $5}' | sed 's/%//')
    local used_percent=$available
    local free_percent=$((100 - used_percent))

    if [ $free_percent -lt $min_percent ]; then
        log_error "Insufficient disk space: ${free_percent}% free (need ${min_percent}% minimum)"
        return 1
    fi

    log_success "Disk space OK: ${free_percent}% free"
    return 0
}

# Check if Google Drive Desktop is syncing
check_gdrive_sync_status() {
    local gdrive_path="$1"

    # Check for .tmp files or sync indicators
    local syncing_files=$(find "$gdrive_path" -name "*.tmp" -o -name ".~lock*" 2>/dev/null | wc -l)

    if [ $syncing_files -gt 0 ]; then
        log_warning "Google Drive may be syncing ($syncing_files temp files found)"
        log_warning "Waiting 10 seconds for sync to complete..."
        sleep 10

        # Check again
        syncing_files=$(find "$gdrive_path" -name "*.tmp" -o -name ".~lock*" 2>/dev/null | wc -l)
        if [ $syncing_files -gt 0 ]; then
            log_error "Google Drive still syncing - aborting to prevent conflicts"
            return 1
        fi
    fi

    log_success "Google Drive sync status: idle"
    return 0
}

# Validate folder structure
check_folder_structure() {
    local base_path="$1"
    local label="$2"

    # Check if at least one of the standard folders exists
    local has_structure=false
    for folder in "Strategy" "Execution" "Reference"; do
        if [ -d "$base_path/$folder" ]; then
            has_structure=true
            break
        fi
    done

    if [ "$has_structure" = false ]; then
        log_warning "$label: No standard folder structure found (Strategy/Execution/Reference)"
        log_warning "This may be intentional for this venture"
    else
        log_success "$label: Folder structure validated"
    fi

    return 0
}

# Check if required tools are available
check_required_tools() {
    local tools=("md5" "jq" "find" "rsync")

    for tool in "${tools[@]}"; do
        if ! command -v $tool &> /dev/null; then
            log_error "Required tool not found: $tool"
            return 1
        fi
    done

    log_success "All required tools available"
    return 0
}

# Main preflight check function
run_preflight_checks() {
    local local_path="$1"
    local gdrive_path="$2"
    local venture_name="$3"

    echo ""
    echo "════════════════════════════════════════════════════════════"
    echo "  PRE-FLIGHT CHECKS: $venture_name"
    echo "════════════════════════════════════════════════════════════"
    echo ""

    PREFLIGHT_PASSED=true
    PREFLIGHT_ERRORS=()

    # Check required tools
    check_required_tools

    # Check local directory
    check_directory "$local_path" "Local directory"

    # Check Google Drive directory
    check_directory "$gdrive_path" "Google Drive directory"

    # Check disk space on both locations
    check_disk_space "$local_path" 20
    check_disk_space "$gdrive_path" 20

    # Check Google Drive sync status
    check_gdrive_sync_status "$gdrive_path"

    # Validate folder structures
    check_folder_structure "$local_path" "Local"
    check_folder_structure "$gdrive_path" "Google Drive"

    echo ""
    if [ "$PREFLIGHT_PASSED" = true ]; then
        echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
        echo -e "${GREEN}  ✓ PRE-FLIGHT PASSED - Safe to proceed${NC}"
        echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
        echo ""
        return 0
    else
        echo -e "${RED}════════════════════════════════════════════════════════════${NC}"
        echo -e "${RED}  ✗ PRE-FLIGHT FAILED - Aborting sync${NC}"
        echo -e "${RED}════════════════════════════════════════════════════════════${NC}"
        echo ""
        echo "Errors encountered:"
        for error in "${PREFLIGHT_ERRORS[@]}"; do
            echo -e "${RED}  • $error${NC}"
        done
        echo ""
        return 1
    fi
}

# Export functions for use in other scripts
export -f run_preflight_checks
export -f check_directory
export -f check_disk_space
export -f check_gdrive_sync_status
export -f check_folder_structure
export -f log_preflight
export -f log_error
export -f log_success
export -f log_warning
