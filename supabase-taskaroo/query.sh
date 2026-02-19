#!/bin/bash
# ============================================
# Taskaroo Supabase Query Tool
# ============================================
# READ-ONLY ACCESS ONLY
# This script ONLY performs GET requests
# NO write, update, or delete operations
# ============================================

set -e

# Default to original Taskaroo project (has schema)
PROJECT_REF="${2:-jriquvajwzarvrvlgpem}"

# Check for token
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
    echo "Error: SUPABASE_ACCESS_TOKEN not set"
    echo "Run: export SUPABASE_ACCESS_TOKEN='your_token'"
    exit 1
fi

# All requests are explicitly GET only
readonly CURL_OPTS="-s --request GET"

case "$1" in
    projects|list)
        echo "[READ-ONLY] Listing all Supabase projects..."
        curl $CURL_OPTS "https://api.supabase.com/v1/projects" \
            -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" | jq '.[] | {name, ref: .ref, status}'
        ;;

    schema|types)
        echo "[READ-ONLY] Getting TypeScript schema for project: $PROJECT_REF"
        curl $CURL_OPTS "https://api.supabase.com/v1/projects/$PROJECT_REF/types/typescript" \
            -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" | jq -r '.types'
        ;;

    tables)
        echo "[READ-ONLY] Listing tables for project: $PROJECT_REF"
        curl $CURL_OPTS "https://api.supabase.com/v1/projects/$PROJECT_REF/types/typescript" \
            -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" | jq -r '.types' | \
            grep -E "^\s{6}\w+: \{$" | sed 's/[:{]//g' | tr -d ' ' | sort | uniq
        ;;

    table)
        if [ -z "$3" ]; then
            echo "Usage: ./query.sh table [project_ref] [table_name]"
            exit 1
        fi
        TABLE_NAME="$3"
        echo "[READ-ONLY] Getting schema for table: $TABLE_NAME in project: $PROJECT_REF"
        curl $CURL_OPTS "https://api.supabase.com/v1/projects/$PROJECT_REF/types/typescript" \
            -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" | jq -r '.types' | \
            awk "/^      $TABLE_NAME: \{/,/^      \}/"
        ;;

    *)
        echo "============================================"
        echo "Taskaroo Supabase Query Tool"
        echo "============================================"
        echo "READ-ONLY ACCESS ONLY"
        echo "This script ONLY performs GET requests"
        echo "NO write, update, or delete operations"
        echo "============================================"
        echo ""
        echo "Usage: ./query.sh [command] [project_ref]"
        echo ""
        echo "Commands:"
        echo "  projects, list    - List all Supabase projects"
        echo "  schema, types     - Get full TypeScript schema"
        echo "  tables            - List all table names"
        echo "  table [ref] [name]- Get specific table schema"
        echo ""
        echo "Project Refs:"
        echo "  jriquvajwzarvrvlgpem - Taskaroo (original, has schema)"
        echo "  zlqqgqbspsiuavfqyabe - taskaroo-dev"
        echo "  gqxmjqxqgoskagdrjurx - taskaroo-staging"
        echo "  dbwgzxpkpmbsdoalyuht - taskaroo-prod"
        echo ""
        echo "Examples:"
        echo "  ./query.sh projects"
        echo "  ./query.sh tables"
        echo "  ./query.sh schema jriquvajwzarvrvlgpem"
        echo "  ./query.sh table jriquvajwzarvrvlgpem jobs"
        ;;
esac
