# Skill Log: provision-user

> This log tracks learnings, failures, and improvements. Claude reads this BEFORE each run.

---

## Status

| Metric | Value |
|--------|-------|
| **Created** | 2025-12-25 |
| **Last Updated** | 2025-12-25 |
| **Clean Runs** | 1 |
| **Stability** | Learning |

**Stability Levels:**
- `Learning` (0-1 clean runs) - Actively collecting feedback
- `Improving` (2-3 clean runs) - Getting stable
- `Stable` (4+ clean runs) - No longer asking for feedback

---

## Known Issues & Fixes

### 2025-12-25 - MCP Read-Only Mode Blocks Provisioning

**Problem:** Supabase MCP was configured with `--read-only` flag, preventing INSERT operations.

**Root Cause:** MCP was set up for safety by default with read-only access.

**Fix Applied:** Removed `--read-only` flag from MCP config. Requires Claude restart to take effect.

**Files Modified:** MCP user config (via `claude mcp` commands)

---

## Learnings

### 2025-12-25 - 406 Error = Missing User Profile

**Observation:** Users created in Supabase Auth (auth.users) but missing from public.users table get a 406 error on login. This is because the app calls `.single()` on the users query.

**Implication:** The skill MUST verify auth user exists before provisioning, and MUST check if already provisioned to avoid duplicates.

**Action Taken:** Added Step 2 (verify auth user) and Step 3 (check not already provisioned) to skill workflow.

### 2025-12-25 - 6-Table Chain Required for Login

**Observation:** Power Bookkeeping requires 6 linked records for a user to log in successfully: auth.users → public.users → tenant_users → tenants → subscriptions → entities.

**Implication:** All 5 tables (beyond auth.users) must be created in a single transaction to avoid partial states.

**Action Taken:** Skill uses PostgreSQL DO block to create all records atomically.

### 2025-12-25 - Manual Subscription Status

**Observation:** Stripe-paying users have `status: 'active'` in subscriptions. Manual users need `status: 'manual'` to bypass Stripe validation while still having full access.

**Implication:** The `manual` status is key to making offline-payment users work.

**Action Taken:** Documented in skill and SQL uses `status: 'manual'`.

---

## Run History

| Date | Outcome | Feedback | Action Taken |
|------|---------|----------|--------------|
| 2025-12-25 | Clean | First successful run after MCP fix | Provisioned Black Hawk Logistics user successfully |

---

## Version Notes

### Versioning Rules

| Change Type | Version Bump | Example |
|-------------|--------------|---------|
| Bug fix, typo, minor tweak | v1.0 → v1.1 | Fixed path typo |
| New feature, new step | v1.x → v2.0 | Added email notification step |
| Breaking change, major rewrite | Note in description | "v3 - Complete redesign" |

### v1.0 - 2025-12-25
- Initial skill creation
- Full 6-table data model documented
- Atomic provisioning SQL with DO block
- Verification queries before and after
- Error handling table
- Plans reference with pricing and limits
- Real example from Black Hawk Logistics provisioning
