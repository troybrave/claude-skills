# Supabase Taskaroo Skill

Query and explore the Taskaroo Supabase database (READ-ONLY).

## Quick Start

```bash
# Verify setup is working
~/.claude/skills/supabase-taskaroo/verify.sh

# List tables
~/.claude/skills/supabase-taskaroo/query.sh tables

# Get full schema
~/.claude/skills/supabase-taskaroo/query.sh schema
```

## Available Projects

| Project | Ref | Purpose |
|---------|-----|---------|
| Taskaroo (original) | `jriquvajwzarvrvlgpem` | Has current schema |
| taskaroo-dev | `zlqqgqbspsiuavfqyabe` | Development (empty) |
| taskaroo-staging | `gqxmjqxqgoskagdrjurx` | Staging (empty) |
| taskaroo-prod | `dbwgzxpkpmbsdoalyuht` | Production (empty) |

## CLI Commands

| Command | Description |
|---------|-------------|
| `./query.sh` | Show help |
| `./query.sh projects` | List all Supabase projects |
| `./query.sh tables` | List all table names |
| `./query.sh schema` | Get full TypeScript schema |
| `./query.sh table [ref] [name]` | Get specific table schema |
| `./verify.sh` | Verify setup is working |

## Key Tables (Taskaroo Schema)

| Table | Purpose |
|-------|---------|
| `jobs` | Main job records (status, customer_id, quote_id, service_id) |
| `leads` | Leads (references job_id - separate from jobs) |
| `org_customers` | Customers/contacts |
| `quotes` | Quotes |
| `quote_items` | Quote line items |
| `products` | Products/materials/labor |
| `product_packages` | Bundled packages |
| `events` | Calendar/scheduling |
| `orgs` | Organizations (vendors) |
| `services` | Service types |
| `properties` | Customer properties/addresses |

## Job Statuses

The Taskaroo job lifecycle:
- **New** - Unquoted lead
- **Pending** - Quoted, waiting for response
- **Accepted** - Quote accepted
- **Scheduled** - On the calendar
- **Completed** - Work done
- **Canceled** - Canceled at any point

## Setup Details

**Environment Variable:**
- Set in `~/.zshrc` and `~/.bash_profile`
- `export SUPABASE_ACCESS_TOKEN="..."`

**MCP Server:**
- Configured in `~/.claude.json` (user-level, all projects)
- Uses `$SUPABASE_ACCESS_TOKEN` (not hardcoded)
- Read-only mode enabled

## Troubleshooting

If something isn't working:
```bash
# Run the verification script
~/.claude/skills/supabase-taskaroo/verify.sh

# Re-source your shell profile
source ~/.zshrc

# Check MCP status
claude mcp list
```
