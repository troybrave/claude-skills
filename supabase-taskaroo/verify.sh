#!/bin/bash
# ============================================
# Supabase Taskaroo Setup Verification
# Run this to verify your setup is working
# ============================================

echo "============================================"
echo "SUPABASE TASKAROO SETUP VERIFICATION"
echo "============================================"
echo ""

ERRORS=0

# 1. Check environment variable
echo "1. Checking SUPABASE_ACCESS_TOKEN..."
if [ -n "$SUPABASE_ACCESS_TOKEN" ]; then
    echo "   ✓ Token is set (${SUPABASE_ACCESS_TOKEN:0:10}...)"
else
    echo "   ✗ Token NOT set!"
    echo "   Fix: Run 'source ~/.zshrc' or restart your terminal"
    ERRORS=$((ERRORS+1))
fi
echo ""

# 2. Check shell profiles
echo "2. Checking shell profiles..."
if grep -q "SUPABASE_ACCESS_TOKEN" ~/.zshrc 2>/dev/null; then
    echo "   ✓ Token in ~/.zshrc"
else
    echo "   ✗ Token NOT in ~/.zshrc"
    ERRORS=$((ERRORS+1))
fi
if grep -q "SUPABASE_ACCESS_TOKEN" ~/.bash_profile 2>/dev/null; then
    echo "   ✓ Token in ~/.bash_profile (backup)"
else
    echo "   - Token not in ~/.bash_profile (optional)"
fi
echo ""

# 3. Check dependencies
echo "3. Checking dependencies..."
for cmd in curl jq npx; do
    if command -v $cmd &> /dev/null; then
        echo "   ✓ $cmd installed"
    else
        echo "   ✗ $cmd NOT installed!"
        ERRORS=$((ERRORS+1))
    fi
done
echo ""

# 4. Check MCP config
echo "4. Checking MCP configuration..."
if grep -q '"supabase"' ~/.claude.json 2>/dev/null; then
    echo "   ✓ Supabase MCP configured in ~/.claude.json"
    if grep -q '\$SUPABASE_ACCESS_TOKEN' ~/.claude.json 2>/dev/null; then
        echo "   ✓ Uses environment variable (secure)"
    else
        echo "   ! Uses hardcoded token (less secure)"
    fi
    if grep -q 'read-only' ~/.claude.json 2>/dev/null; then
        echo "   ✓ Read-only mode enabled"
    else
        echo "   ✗ Read-only mode NOT enabled!"
        ERRORS=$((ERRORS+1))
    fi
else
    echo "   ✗ Supabase MCP NOT configured!"
    echo "   Fix: Run 'claude mcp add supabase --scope user -- npx -y @supabase/mcp-server-supabase@latest --access-token \$SUPABASE_ACCESS_TOKEN --read-only'"
    ERRORS=$((ERRORS+1))
fi
echo ""

# 5. Check CLI script
echo "5. Checking CLI script..."
SCRIPT_PATH="$HOME/.claude/skills/supabase-taskaroo/query.sh"
if [ -f "$SCRIPT_PATH" ]; then
    echo "   ✓ CLI script exists"
    if [ -x "$SCRIPT_PATH" ]; then
        echo "   ✓ CLI script is executable"
    else
        echo "   ✗ CLI script NOT executable!"
        echo "   Fix: Run 'chmod +x $SCRIPT_PATH'"
        ERRORS=$((ERRORS+1))
    fi
else
    echo "   ✗ CLI script NOT found at $SCRIPT_PATH"
    ERRORS=$((ERRORS+1))
fi
echo ""

# 6. Test API connection
echo "6. Testing Supabase API connection..."
if [ -n "$SUPABASE_ACCESS_TOKEN" ]; then
    RESPONSE=$(curl -s --max-time 10 "https://api.supabase.com/v1/projects" \
        -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" 2>/dev/null)
    if echo "$RESPONSE" | grep -q "Taskaroo"; then
        echo "   ✓ API connection successful"
        PROJECT_COUNT=$(echo "$RESPONSE" | grep -o '"name"' | wc -l)
        echo "   ✓ Found $PROJECT_COUNT projects"
    else
        echo "   ✗ API connection FAILED or token invalid"
        echo "   Response: ${RESPONSE:0:100}"
        ERRORS=$((ERRORS+1))
    fi
else
    echo "   - Skipped (token not set)"
fi
echo ""

# Summary
echo "============================================"
if [ $ERRORS -eq 0 ]; then
    echo "STATUS: ALL CHECKS PASSED ✓"
    echo "Your Supabase setup is production ready!"
else
    echo "STATUS: $ERRORS ERROR(S) FOUND ✗"
    echo "Please fix the issues above."
fi
echo "============================================"

exit $ERRORS
