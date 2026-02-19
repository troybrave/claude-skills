#!/bin/bash
# HEALTH CHECK - Validates all sync configurations before any operation
# Run this before any sync to catch issues early
# Exit codes: 0 = healthy, 1 = warnings, 2 = critical failures

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_DIR="${SCRIPT_DIR}/config"
VENTURES_CONFIG="${CONFIG_DIR}/ventures.json"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

WARNINGS=0
ERRORS=0

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  DAILY SYNC HEALTH CHECK"
echo "  $(date '+%B %d, %Y @ %I:%M %p')"
echo "════════════════════════════════════════════════════════════"
echo ""

# Check 1: Config file exists
echo "Checking configuration..."
if [ ! -f "$VENTURES_CONFIG" ]; then
    echo -e "${RED}✗ CRITICAL: ventures.json not found at $VENTURES_CONFIG${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✓ ventures.json exists${NC}"

    # Validate JSON syntax
    if ! jq empty "$VENTURES_CONFIG" 2>/dev/null; then
        echo -e "${RED}✗ CRITICAL: ventures.json has invalid JSON syntax${NC}"
        ERRORS=$((ERRORS + 1))
    else
        echo -e "${GREEN}✓ ventures.json has valid JSON${NC}"
    fi
fi

# Check 2: Google Drive desktop sync is installed and running
echo ""
echo "Checking Google Drive Desktop..."

GDRIVE_ENDLESS="/Users/troybrave/Library/CloudStorage/GoogleDrive-troy@endlesswinning.com"
GDRIVE_FORTIS="/Users/troybrave/Library/CloudStorage/GoogleDrive-troy@fortisentities.com"

if [ -d "$GDRIVE_ENDLESS" ]; then
    echo -e "${GREEN}✓ Google Drive (troy@endlesswinning.com) is mounted${NC}"

    # Check if it's accessible (not stale)
    if ls "$GDRIVE_ENDLESS/My Drive" >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Google Drive (troy@endlesswinning.com) is accessible${NC}"
    else
        echo -e "${RED}✗ CRITICAL: Google Drive is mounted but not accessible (sync may be paused)${NC}"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${RED}✗ CRITICAL: Google Drive (troy@endlesswinning.com) is NOT mounted${NC}"
    echo "  → Open Google Drive app and sign in"
    ERRORS=$((ERRORS + 1))
fi

if [ -d "$GDRIVE_FORTIS" ]; then
    echo -e "${GREEN}✓ Google Drive (troy@fortisentities.com) is mounted${NC}"
else
    echo -e "${YELLOW}⚠ Google Drive (troy@fortisentities.com) is not mounted (optional)${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

# Check 3: Validate gdrive-cli config directory (not a broken symlink)
echo ""
echo "Checking gdrive-cli config..."

GDRIVE_CLI_CONFIG="$HOME/.config/gdrive-cli"

if [ -L "$GDRIVE_CLI_CONFIG" ]; then
    # It's a symlink - check if it's valid
    if [ -d "$GDRIVE_CLI_CONFIG" ]; then
        echo -e "${YELLOW}⚠ ~/.config/gdrive-cli is a symlink (may cause issues)${NC}"
        echo "  → Consider: rm ~/.config/gdrive-cli && mkdir ~/.config/gdrive-cli"
        WARNINGS=$((WARNINGS + 1))
    else
        echo -e "${RED}✗ CRITICAL: ~/.config/gdrive-cli is a BROKEN symlink${NC}"
        echo "  → Fix: rm ~/.config/gdrive-cli && mkdir -p ~/.config/gdrive-cli"
        ERRORS=$((ERRORS + 1))
    fi
elif [ -d "$GDRIVE_CLI_CONFIG" ]; then
    echo -e "${GREEN}✓ ~/.config/gdrive-cli is a valid directory${NC}"
elif [ ! -e "$GDRIVE_CLI_CONFIG" ]; then
    echo -e "${YELLOW}⚠ ~/.config/gdrive-cli does not exist (API CLI not configured)${NC}"
    echo "  → This is OK if using desktop sync only"
    WARNINGS=$((WARNINGS + 1))
fi

# Check 4: Validate all venture paths
echo ""
echo "Checking venture paths..."

if [ -f "$VENTURES_CONFIG" ] && jq empty "$VENTURES_CONFIG" 2>/dev/null; then
    VENTURE_COUNT=$(jq '.ventures | length' "$VENTURES_CONFIG")

    for i in $(seq 0 $((VENTURE_COUNT - 1))); do
        NAME=$(jq -r ".ventures[$i].name" "$VENTURES_CONFIG")
        LOCAL=$(jq -r ".ventures[$i].local" "$VENTURES_CONFIG")
        GDRIVE=$(jq -r ".ventures[$i].gdrive" "$VENTURES_CONFIG")

        echo ""
        echo "  [$NAME]"

        # Check local path
        if [ -d "$LOCAL" ]; then
            echo -e "    ${GREEN}✓ Local path exists${NC}"
        else
            echo -e "    ${RED}✗ Local path MISSING: $LOCAL${NC}"
            ERRORS=$((ERRORS + 1))
        fi

        # Check gdrive path
        if [ -d "$GDRIVE" ]; then
            echo -e "    ${GREEN}✓ GDrive path exists${NC}"
        else
            echo -e "    ${RED}✗ GDrive path MISSING: $GDRIVE${NC}"
            ERRORS=$((ERRORS + 1))
        fi
    done
fi

# Check 5: Required tools
echo ""
echo "Checking required tools..."

for tool in jq rsync md5sum; do
    if command -v $tool >/dev/null 2>&1; then
        echo -e "${GREEN}✓ $tool is installed${NC}"
    else
        if [ "$tool" = "md5sum" ] && command -v md5 >/dev/null 2>&1; then
            echo -e "${GREEN}✓ md5 is installed (macOS alternative to md5sum)${NC}"
        else
            echo -e "${RED}✗ $tool is NOT installed${NC}"
            ERRORS=$((ERRORS + 1))
        fi
    fi
done

# Summary
echo ""
echo "════════════════════════════════════════════════════════════"

if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}  ✗ HEALTH CHECK FAILED${NC}"
    echo ""
    echo "  Critical errors: $ERRORS"
    echo "  Warnings: $WARNINGS"
    echo ""
    echo "  Fix the critical errors above before running sync."
    echo "════════════════════════════════════════════════════════════"
    exit 2
elif [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}  ⚠ HEALTH CHECK PASSED WITH WARNINGS${NC}"
    echo ""
    echo "  Warnings: $WARNINGS"
    echo ""
    echo "  Sync will work, but consider fixing the warnings."
    echo "════════════════════════════════════════════════════════════"
    exit 1
else
    echo -e "${GREEN}  ✓ HEALTH CHECK PASSED${NC}"
    echo ""
    echo "  All systems healthy. Safe to sync."
    echo "════════════════════════════════════════════════════════════"
    exit 0
fi
