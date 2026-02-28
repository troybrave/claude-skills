---
name: task-creator
description: Create tasks in Airtable Operations Base. Use when user says "create task", "add task", "new task", "task for", "add to task board", "add to airtable". NOT for Notion tasks. NOT for next-step files (use next-step).
allowed-tools: Read, Bash, Glob, Grep, AskUserQuestion
---

# Task Creator (Airtable)

Creates tasks in the Airtable Operations Base. Single source of truth for task management.

---

## Connection Details

| Resource | Value |
|----------|-------|
| CLI Path | `/Users/troybrave/.claude/.CLI/airtable-cli/` |
| Base | Operations Base (`appL9udbiP7hTsX3x`) |
| Table | Tasks (`tblwjhahyQuEWovv7`) |
| Token Source | Doppler (`claude-code` project, `prd` config, key: `AIRTABLE_API_KEY`) |
| Local Token | `/Users/troybrave/.claude/.CLI/airtable-cli/.env` (AIRTABLE_PAT) |

---

## Before Creating a Task

### 1. Verify Auth

Run a quick test to confirm the token works:

```bash
cd /Users/troybrave/.claude/.CLI/airtable-cli && node cli.js query appL9udbiP7hTsX3x Tasks 1
```

If it fails with 401/unauthorized:

```bash
# Pull fresh token from Doppler
NEW_TOKEN=$(doppler secrets get AIRTABLE_API_KEY --project claude-code --config prd --plain)
# Update .env
echo "AIRTABLE_PAT=$NEW_TOKEN" > /Users/troybrave/.claude/.CLI/airtable-cli/.env
```

Then retry.

### 2. Gather Required Info

Ask the user for anything not provided (or infer from context):

| Field | Required | How to Get |
|-------|----------|------------|
| Task Name | Yes | User provides or infer from context |
| Company | Yes | Match against company lookup below |
| Client | If applicable | Search Clients table |
| Production Week | Yes | Search Production Week table by week number |
| Task Lead | Yes | Default: Troy Bravenboer |
| Priority | No | Default: Medium |
| Status | No | Default: Not Started |
| Type | No | Default: AdHoc |
| Description | No | User provides or infer from context |
| Time | No | Estimate if possible |

---

## Company Lookup (Cached IDs)

| Company | Record ID |
|---------|-----------|
| Brave Life | `recQhKyf23YdZQiEw` |
| Power Bookkeeping | `recRT50tkMHDQeZYk` |
| Brave Freight | `recSGy7rSF7i7VzaW` |
| Mailbox Dino | `recbC62knLxjoPhif` |
| Troy Brave | `reccbeGC14vciXAuF` |
| Endless Winning | `rect11vwlcUyupnO5` |
| Wood Tax Advisory | `recyTDEpwDoUBTfVw` |

If company not in cache, query:
```bash
cd /Users/troybrave/.claude/.CLI/airtable-cli && node cli.js query appL9udbiP7hTsX3x Companies 20
```

---

## Task Lead Lookup

| Person | Collaborator Object |
|--------|--------------------|
| Troy Bravenboer (default) | `{"id":"usrkShXYnkzTxcK1I","email":"troy@endlesswinning.com","name":"Troy Bravenboer"}` |

---

## Field Values

### Priority (singleSelect)
`Urgent` | `High` | `Medium` | `Low` | `On Hold`

### Status (singleSelect)
`Not Started` | `Assigned` | `Scheduled` | `Incomplete` | `In Review` | `Reviewed` | `With Client` | `Blocked` | `Completed` | `Completed NFP` | `Meeting Task` | `Under Refined` | `Archived`

### Type (singleSelect)
`Tax Return` | `Bookkeeping` | `AdHoc` | `Dev` | `IFTA Filing`

---

## Dynamic Lookups

### Find a Client

```bash
cd /Users/troybrave/.claude/.CLI/airtable-cli && node cli.js query appL9udbiP7hTsX3x Clients 5 --filter="SEARCH('ClientName', {Name})"
```

### Find a Production Week

```bash
cd /Users/troybrave/.claude/.CLI/airtable-cli && node cli.js query appL9udbiP7hTsX3x "Production Week" 5 --filter="SEARCH('2608', {Week#})"
```

### Find Current Week

```bash
cd /Users/troybrave/.claude/.CLI/airtable-cli && node cli.js query appL9udbiP7hTsX3x "Production Week" 1 --filter="{Current Week}=1"
```

---

## Create the Task

```bash
cd /Users/troybrave/.claude/.CLI/airtable-cli && node cli.js create appL9udbiP7hTsX3x Tasks '{
  "Task Name": "TASK_NAME_HERE",
  "Priority": "Medium",
  "Production Week": ["WEEK_RECORD_ID"],
  "Status": "Not Started",
  "Company": ["COMPANY_RECORD_ID"],
  "Client": ["CLIENT_RECORD_ID"],
  "Type": "AdHoc",
  "Task Lead": [{"id":"usrkShXYnkzTxcK1I","email":"troy@endlesswinning.com","name":"Troy Bravenboer"}],
  "Description": "DESCRIPTION_HERE"
}'
```

**Rules:**
- Linked fields (Company, Client, Production Week) must be arrays of record IDs: `["recXXX"]`
- Task Lead must be array of collaborator objects: `[{"id":"...","email":"...","name":"..."}]`
- Omit fields you don't have values for (don't send null)
- All JSON must be valid — escape quotes in descriptions

---

## After Creating

Confirm to the user with:
- Task name
- Week assigned
- Company/client
- Record ID (for reference)

---

## Error Handling

| Error | Fix |
|-------|-----|
| 401 Unauthorized | Pull fresh token from Doppler (see auth section above) |
| 422 Invalid field | Check field name spelling matches schema exactly |
| Client not found | Query Clients table with broader search |
| Week not found | Query Production Week with no filter, browse results |
| "INVALID_REQUEST_UNKNOWN_FIELD" | Field name is case-sensitive — match schema exactly |

---

## Integration Notes

- This skill replaces `notion-task-creator` references
- The `end-of-day` skill should be updated to use this instead of Notion for task creation
- The `next-step` skill references `notion-task-creator` — now points here
