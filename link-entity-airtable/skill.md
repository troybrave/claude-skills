---
name: link-entity-airtable
description: Links a Power Bookkeeping entity to Airtable and triggers sync. Use when user says "link entity to airtable", "connect airtable base", "set up airtable sync", "update airtable base id". NOT for creating new users (use provision-user). NOT for Airtable automation setup.
allowed-tools: Read, Bash, AskUserQuestion, mcp__supabase-power-bookkeeping__execute_sql, mcp__supabase-power-bookkeeping__get_project_url, mcp__supabase-power-bookkeeping__get_publishable_keys
---

# Link Entity to Airtable

Links a Power Bookkeeping entity to an Airtable base and triggers the sync worker.

---

## ⚠️ CRITICAL LIMITATIONS (READ FIRST)

| Limitation | Impact | Workaround |
|------------|--------|------------|
| **Worker only does COA linking** | Transactions won't appear in Airtable | Matt must enable Airtable automations for each new client |
| **Airtable automations are manual** | Sync returns "synced: 0" even when successful | This is expected - automations create records, not the worker |
| **No way to verify automation status** | Cannot confirm if client's automation is enabled | Contact Matt to verify/enable |

**This skill completes the Supabase side. Airtable record creation requires separate automation setup by Matt.**

---

## Prerequisites

Before running this skill:
1. User has been provisioned via `provision-user` skill (or Stripe onboarding)
2. Airtable base has been created and duplicated from template
3. You have the Airtable Base ID (format: `appXXXXXXXXXXXXXX`)

---

## Workflow

### Step 1: Gather Information

If not provided, ask for:

| Field | Required | Format | Example |
|-------|----------|--------|---------|
| Entity identifier | Yes | Name or UUID | "Blackhawk Logistics" or UUID |
| Airtable Base ID | Yes | `app` + 14 chars | `app2lotuCcMzY8lt1` |

### Step 2: Validate Airtable Base ID Format

```javascript
// Valid format: app + exactly 14 alphanumeric characters
const isValid = /^app[a-zA-Z0-9]{14}$/.test(baseId);
```

**If invalid:** STOP - ask user to verify the Base ID from Airtable URL.

### Step 3: Find Entity in Supabase

```sql
-- Search by name (case-insensitive)
SELECT
  e.id,
  e.name,
  e.airtable_base_id,
  t.name as tenant_name,
  u.email as owner_email
FROM entities e
JOIN tenants t ON t.id = e.tenant_id
JOIN tenant_users tu ON tu.tenant_id = t.id AND tu.role = 'owner'
JOIN users u ON u.id = tu.user_id
WHERE e.name ILIKE '%{SEARCH_TERM}%'
LIMIT 5;
```

**If no results:** Try searching by UUID directly:
```sql
SELECT id, name, airtable_base_id FROM entities WHERE id = '{UUID}';
```

**If still no results:** STOP - entity doesn't exist. May need `provision-user` first.

**If multiple results:** Show all matches and ask user to confirm which one.

### Step 4: Check Current State

Examine the entity's `airtable_base_id`:

| Current State | Action |
|---------------|--------|
| `NULL` | Proceed with linking |
| Same as provided | Already linked - skip to Step 6 |
| Different value | WARN user - ask if they want to overwrite |

### Step 5: Update Entity with Airtable Base ID

```sql
UPDATE entities
SET
  airtable_base_id = '{AIRTABLE_BASE_ID}',
  updated_at = NOW()
WHERE id = '{ENTITY_ID}'
RETURNING id, name, airtable_base_id;
```

**Verify:** Returned `airtable_base_id` matches what was provided.

### Step 6: Check Transaction Status

```sql
SELECT
  COUNT(*) as total_transactions,
  COUNT(CASE WHEN sync_status = 'pending' THEN 1 END) as pending,
  COUNT(CASE WHEN sync_status = 'synced' THEN 1 END) as synced,
  COUNT(airtable_record_id) as has_airtable_id
FROM transactions
WHERE entity_id = '{ENTITY_ID}';
```

**Interpret Results:**

| Scenario | Meaning |
|----------|---------|
| `total = 0` | No transactions yet - Plaid hasn't synced or no accounts connected |
| `pending > 0, has_airtable_id = 0` | Normal for new setup - awaiting Airtable automation |
| `synced > 0, has_airtable_id = 0` | COA linking done, but no Airtable records - automation not enabled |
| `has_airtable_id > 0` | Some records successfully synced to Airtable |

### Step 7: Trigger Sync Worker (Optional)

**Only run if user confirms** - the worker primarily does COA keyword linking:

```bash
# Get project URL and anon key first
```

Use MCP tools:
1. `mcp__supabase-power-bookkeeping__get_project_url` with project_id `lrwvooucggciazmzxqlb`
2. `mcp__supabase-power-bookkeeping__get_publishable_keys` with project_id `lrwvooucggciazmzxqlb`

Then call:
```bash
curl -X POST "{PROJECT_URL}/functions/v1/trigger-airtable-sync" \
  -H "Authorization: Bearer {ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"entity_id": "{ENTITY_ID}"}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Sync completed",
  "result": {
    "entity_id": "...",
    "synced": 0,  // This is NORMAL - worker only does COA linking
    "coa_linked": 15
  }
}
```

**`synced: 0` is expected** - actual record creation happens via Airtable automations.

### Step 8: Report Results

```
✅ Entity Linked to Airtable

| Field | Value |
|-------|-------|
| Entity | {name} |
| Entity ID | {id} |
| Airtable Base ID | {airtable_base_id} |
| Owner | {owner_email} |

📊 Transaction Status:
- Total: {total}
- Pending sync: {pending}
- Has Airtable ID: {has_airtable_id}

⚠️ IMPORTANT: Airtable automations must be enabled by Matt for records to appear.
Contact Matt to enable the automation for this client's base.
```

---

## Supabase Config

- **Project ID:** `lrwvooucggciazmzxqlb`
- **Project Name:** Endless Winning
- **MCP:** `mcp__supabase-power-bookkeeping__execute_sql`
- **Edge Function:** `trigger-airtable-sync`
- **Worker URL:** `https://plaid-sync-worker-485874813100.us-central1.run.app`

---

## Error Handling

| Error | Cause | Fix |
|-------|-------|-----|
| Entity not found | Wrong name/ID or not provisioned | Search with different terms or run `provision-user` first |
| Invalid Base ID format | Typo or wrong ID copied | Get correct ID from Airtable URL: `airtable.com/{BASE_ID}/...` |
| airtable_base_id already set | Entity previously linked | Confirm with user before overwriting |
| 401 on Edge Function | Wrong/expired anon key | Re-fetch with `get_publishable_keys` |
| Worker returns error | Various | Check worker logs in Google Cloud |
| synced: 0 in response | Normal behavior | This is expected - Airtable automations create records |

---

## Known Issues & Open Items

### Cannot Be Fixed By This Skill

1. **Airtable automations require manual setup**
   - Status: Open
   - Owner: Matt
   - Each new client needs their automation enabled in Airtable

2. **Worker only does COA linking**
   - Status: By design
   - The `plaid-sync-worker` links transactions to Chart of Accounts keywords
   - Actual Airtable record creation is Airtable automation's job

3. **No visibility into automation status**
   - Status: Open
   - Cannot programmatically check if a client's Airtable automation is enabled

4. **System-wide sync gap**
   - Status: Known issue
   - Most entities show `synced: 0` - Airtable automations may not be running for existing clients

### Potential Future Improvements

- [ ] Add Airtable MCP to verify base exists and is accessible
- [ ] Create automation template that can be duplicated per-client
- [ ] Add worker endpoint to actually create Airtable records (bypass automation)
- [ ] Dashboard to show sync status across all entities

---

## Complete Example

**Input:**
- Entity: "Black Hawk Logistics"
- Airtable Base ID: `app2lotuCcMzY8lt1`

**Steps Executed:**
1. Found entity: `c353a09e-f757-4f9a-b6f8-fd257e663bab`
2. Previous `airtable_base_id`: NULL
3. Updated to: `app2lotuCcMzY8lt1`
4. Transaction count: 609 total, 609 pending
5. Triggered sync: `synced: 0, coa_linked: 15`

**Output:**
```
✅ Entity Linked to Airtable

| Field | Value |
|-------|-------|
| Entity | Black Hawk Logistics |
| Entity ID | c353a09e-f757-4f9a-b6f8-fd257e663bab |
| Airtable Base ID | app2lotuCcMzY8lt1 |
| Owner | jrichardson@blackhawklogisticsgroup.com |

📊 Transaction Status:
- Total: 609
- Pending sync: 609
- Has Airtable ID: 0

⚠️ IMPORTANT: Airtable automations must be enabled by Matt for records to appear.
```
