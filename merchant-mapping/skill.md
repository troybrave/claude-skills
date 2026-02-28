---
name: merchant-mapping
description: "AI-powered merchant matching pipeline: links transactions to Merchant records with 5-tier matching (client rules, client merchants, Supabase rules, Supabase identity store, Perplexity+Claude AI). Use when user says \"map merchants\", \"merchant mapping\", \"match transactions\", \"categorize transactions\", \"setup COA\", \"seed client\", \"transaction matching\", \"link merchants\", \"COA mapping\". NOT for statement import (use statement-processing skill)."
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, AskUserQuestion, ToolSearch, mcp__airtable__client_getRecords, mcp__airtable__client_createRecords, mcp__airtable__client_updateRecords, mcp__airtable__client_schema, mcp__airtable__client_list, mcp__airtable__client_validateFields, mcp__supabase-endlesswinning__execute_sql
---

# Merchant Mapping Pipeline

AI-powered merchant matching: links transactions to Merchant records using a 5-tier matching hierarchy with automatic COA assignment.

**Project Root:** `/Users/troybrave/.claude/.CLI/statement-processing`

All paths below are relative to this root. Always `cd` to this directory before running Python scripts.

---

## Available Sub-Commands

| Sub-Command | Trigger Phrases | Purpose |
|-------------|----------------|---------|
| `map-merchants` | "map merchants", "match transactions", "categorize", "link merchants" | Run the full merchant mapping pipeline |
| `setup-coa` | "setup COA", "configure COA", "COA config" | Auto-discover Airtable COA schema |
| `seed-client` | "seed client", "seed COA", "seed merchants" | Seed COA + merchants from Supabase master |

When the user invokes one of these, read the corresponding command file from:
`/Users/troybrave/.claude/.CLI/statement-processing/.claude/commands/<command-name>.md`

Then follow its workflow **exactly** as documented.

---

## Quick Start

```bash
# Always work from the project root
cd /Users/troybrave/.claude/.CLI/statement-processing

# Step 1: Generate COA config from Airtable schema
# Read and follow: .claude/commands/setup-coa.md

# Step 2: (Optional) Seed COA + merchants from Supabase master
# Read and follow: .claude/commands/seed-client.md

# Step 3: Run merchant mapping (dry-run first)
# Read and follow: .claude/commands/map-merchants.md
```

---

## Environment

Secrets are managed via **Doppler** (auto-configured in repo directory). Use the venv Python and prefix with `doppler run --`:

```bash
cd /Users/troybrave/.claude/.CLI/statement-processing
doppler run -- .venv/bin/python3 merchant-mapping/populate.py --client jose-sandoval --dry-run
doppler run -- .venv/bin/python3 merchant-mapping/seed_client.py --client jose-sandoval
doppler run -- .venv/bin/python3 merchant-mapping/refine_business_coa.py --client jose-sandoval
```

**Always use `.venv/bin/python3`** — system Python does not have the required dependencies.

| Secret | Purpose |
|--------|---------|
| `AIRTABLE_PERSONAL_ACCESS_TOKEN` | Airtable API access |
| `SUPABASE_URL` | Merchant identity store |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase database access |
| `PERPLEXITY_API_KEY` | AI fallback for unknown merchants |
| `ANTHROPIC_API_KEY` | Claude Sonnet for COA assignment |

---

## 5-Tier Matching Hierarchy

```
Transaction with Merchant name + Amount + Description + Account Type
        |
        v
1. Client Merchant_Rules (Airtable)
   Pattern-based rules with amount/description conditions
   Confidence: per rule (0.7-0.95)
        |
        v
2. Client Merchants table (Airtable)
   Previously matched merchants for this client
   Confidence: 1.0
        |
        v
3. Supabase merchant_rules
   Global pattern-based rules with conditions
   Confidence: per rule (0.7-0.95)
        |
        v
4. Supabase identity store
   5,000+ merchants from Plaid sync across all clients
   Exact, alias, prefix, fuzzy matching (>=85%)
   Confidence: 0.85-1.0
        |
        v
5. Two-step AI fallback
   Step A: Perplexity identifies the business
   Step B: Claude Sonnet assigns COA from fixed lists
   Confidence: 0.5-1.0
```

---

## Post-Mapping Scripts

Run these after the main mapping pipeline:

```bash
# Audit merchant match tier distribution
doppler run -- .venv/bin/python3 merchant-mapping/audit_matching.py --client <client>

# Merchant dedup (cleanup store number variants)
doppler run -- .venv/bin/python3 merchant-mapping/cleanup_merchants.py --client <client>

# Learn from human corrections
doppler run -- .venv/bin/python3 merchant-mapping/learn.py --client <client> --dry-run

# Verify AI assignments
doppler run -- .venv/bin/python3 merchant-mapping/verify.py --client <client> --report-only

# Refine Business COA via Claude
doppler run -- .venv/bin/python3 merchant-mapping/refine_business_coa.py --client <client> --dry-run

# Suggest new merchant rules
doppler run -- .venv/bin/python3 merchant-mapping/suggest_rules.py --client <client>
```

---

## Key Airtable Fields (Transactions)

| Field | Purpose |
|-------|---------|
| `Merchant_Maped` | Link to Merchant record (always set by pipeline) |
| `Applied_Rule` | Link to Merchant_Rules record (when rule matched) |
| `Rule_Applied` | Checkbox (true = rules were evaluated) |
| `Final_Business_COA` | Formula: IF(Applied_Rule, Rule_COA, Merchant_COA) |
| `COA_Confidence` | Score 0.5-1.0 from matching tier |
| `Code Status` | "Ready for Coding" (conf >= 0.8) or "Review" (conf < 0.8) |

---

## Client Folder Convention

All client work lives in `./clients/<kebab-case-name>/`:
- `config.json` -- Airtable base ID, account mappings
- `coa-config.json` -- Auto-generated by setup-coa (REQUIRED for mapping)
- `notes.md` -- Running log

## MCP Tool Discovery

Commands use `ToolSearch` for dynamic Airtable MCP lookup. Always load tools first:
```
ToolSearch: "+airtable list tables"
```

## Key Files

| File | Purpose |
|------|---------|
| `config/client-registry.json` | Client aliases to base IDs (gitignored, per-user) |
| `merchant-mapping/populate.py` | Main merchant mapping script |
| `merchant-mapping/seed_client.py` | Seed COA + merchants from Supabase |
| `merchant-mapping/learn.py` | Learn from human corrections |
| `merchant-mapping/verify.py` | Verify AI assignments |
| `merchant-mapping/cleanup_merchants.py` | Dedup merchants |
| `merchant-mapping/refine_business_coa.py` | Refine COA via Claude |
| `merchant-mapping/rules_matcher.py` | Pattern-based rule engine |
| `merchant-mapping/config.py` | PROJECT_ROOT and shared config |
| `merchant-mapping/utils.py` | Normalization and exclusion patterns |

## Amount Sign Convention

- **NEGATIVE** = money IN (deposits, credits, refunds)
- **POSITIVE** = money OUT (withdrawals, debits, fees, purchases)
