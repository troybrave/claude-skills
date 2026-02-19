---
name: provision-user
description: Provisions a new Power Bookkeeping user in Supabase. Use when user says "provision user", "add user", "create user", "set up user", "manual user setup". Requires auth user to exist first. NOT for Stripe-paying self-service users.
allowed-tools: Read, Bash, AskUserQuestion, mcp__supabase-power-bookkeeping__execute_sql
---

# Power Bookkeeping Manual User Provisioning

Provisions manually-paying users who bypass Stripe onboarding. Creates all 5 required database records so the user can log in.

---

## Why This Skill Exists

Power Bookkeeping has two onboarding paths:
1. **Self-service (Stripe)**: User pays → webhook auto-creates everything
2. **Manual (this skill)**: Admin collects payment offline → manually provisions user

Without all 5 records, the app returns a **406 error** on login because it queries `public.users` with `.single()` and gets 0 rows.

---

## Prerequisites

Before running this skill:
1. Admin has **collected payment** (invoice, Zelle, check, etc.)
2. Admin has **created auth user** in Supabase Dashboard → Authentication → Users → Add User

---

## Workflow

### Step 1: Gather Information

If not provided, ask for:

| Field | Required | Notes |
|-------|----------|-------|
| Email | Yes | Must match the auth user email exactly |
| Company Name | Yes | Used for tenant and entity names |
| Plan | Yes | core, weekly_clarity, or legacy |

### Step 2: Verify Auth User Exists

```sql
SELECT id, email, created_at FROM auth.users WHERE LOWER(email) = LOWER('{email}');
```

- **No results?** STOP - tell admin to create auth user first
- **Found?** Save the `id` as `auth_user_id`

### Step 3: Check Not Already Provisioned

```sql
SELECT id FROM users WHERE auth_user_id = '{auth_user_id}';
```

- **Found?** STOP - user already provisioned, show existing setup
- **Empty?** Continue

### Step 4: Execute Provisioning

Run this SQL with substituted values:

```sql
DO $$
DECLARE
  v_auth_user_id uuid := '{AUTH_USER_ID}';
  v_email text := '{EMAIL}';
  v_company_name text := '{COMPANY_NAME}';
  v_slug text := '{SLUG}';
  v_plan_slug text := '{PLAN_SLUG}';
  v_user_id uuid;
  v_tenant_id uuid;
  v_plan_id uuid;
BEGIN
  INSERT INTO users (id, email, auth_user_id, subscription_status, created_at, updated_at)
  VALUES (gen_random_uuid(), v_email, v_auth_user_id, 'active', now(), now())
  RETURNING id INTO v_user_id;

  INSERT INTO tenants (id, name, slug, subscription_status, plan_type, created_at, updated_at)
  VALUES (gen_random_uuid(), v_company_name, v_slug, 'active', v_plan_slug, now(), now())
  RETURNING id INTO v_tenant_id;

  INSERT INTO tenant_users (tenant_id, user_id, role, status, accepted_at, created_at, updated_at)
  VALUES (v_tenant_id, v_user_id, 'owner', 'active', now(), now(), now());

  SELECT id INTO v_plan_id FROM plans WHERE slug = v_plan_slug;

  INSERT INTO subscriptions (tenant_id, plan_id, status, assigned_by, assigned_at, notes, created_at, updated_at)
  VALUES (v_tenant_id, v_plan_id, 'manual', 'admin', now(), 'Manual setup', now(), now());

  INSERT INTO entities (id, user_id, tenant_id, name, category, created_at, updated_at)
  VALUES (gen_random_uuid(), v_user_id, v_tenant_id, v_company_name, 'business', now(), now());

  RAISE NOTICE 'Done!';
END $$;
```

**Variable substitution:**
- `{AUTH_USER_ID}` - UUID from Step 2
- `{EMAIL}` - User's email
- `{COMPANY_NAME}` - Company name as provided
- `{SLUG}` - Lowercase, hyphenated company name (e.g., "Black Hawk Logistics" → "black-hawk-logistics")
- `{PLAN_SLUG}` - One of: `core`, `weekly_clarity`, `legacy`

### Step 5: Verify Success

```sql
SELECT
  u.email,
  t.name as tenant_name,
  tu.role,
  s.status as subscription_status,
  p.name as plan_name,
  p.base_entities,
  p.base_institutions,
  p.base_accounts,
  e.name as entity_name
FROM users u
JOIN tenant_users tu ON tu.user_id = u.id
JOIN tenants t ON t.id = tu.tenant_id
JOIN subscriptions s ON s.tenant_id = t.id
JOIN plans p ON p.id = s.plan_id
JOIN entities e ON e.tenant_id = t.id
WHERE u.email = '{EMAIL}';
```

### Step 6: Report Success

```
✅ User Provisioned Successfully!

| Field | Value |
|-------|-------|
| Email | {email} |
| Tenant | {company_name} |
| Role | Owner |
| Plan | {plan_name} |
| Subscription | Manual |
| Entity | {company_name} |

**Plan includes:**
- {base_entities} entity/entities
- {base_institutions} institution(s)
- {base_accounts} account(s)

**User can now log in** and connect their bank accounts via Plaid.
```

---

## Plans Reference

| Slug | Name | Price | Entities | Institutions | Accounts |
|------|------|-------|----------|--------------|----------|
| `core` | Power Bookkeeping \| Core | $249/mo | 1 | 2 | 3 |
| `weekly_clarity` | Weekly Clarity | $299/mo | 1 | 1 | 2 |
| `legacy` | Legacy Unlimited | Free | 99 | 99 | 999 |

---

## Data Model

The app requires 6 linked records for login to work:

```
auth.users (Supabase Auth - created manually by admin)
    ↓ auth_user_id
public.users (profile)
    ↓ user_id
tenant_users (junction - role=owner, status=active)
    ↓ tenant_id
tenants (organization)
    ↓ tenant_id
subscriptions (billing - status=manual for offline payments)
    ↓ tenant_id
entities (business unit - at least one required)
```

**Why 406 error happens:** App calls `.single()` on users table query. Returns HTTP 406 when 0 rows found.

---

## Error Handling

| Error | Cause | Fix |
|-------|-------|-----|
| No auth user found | Auth user not created yet | Create in Supabase Dashboard → Auth → Users → Add User |
| User already provisioned | Skill ran twice | Show existing setup, no action needed |
| Slug already exists | Duplicate company name | Append -2, -3, etc. to slug |
| Read-only transaction | MCP lacks write permission | Check MCP config has no --read-only flag |

---

## Supabase Config

- **Project ID:** `lrwvooucggciazmzxqlb`
- **Project Name:** Endless Winning
- **MCP:** `mcp__supabase-power-bookkeeping__execute_sql`

---

## Example Run

**Input:**
- Email: jrichardson@blackhawklogisticsgroup.com
- Company: Black Hawk Logistics
- Plan: Core

**Output:**
```
✅ User Provisioned Successfully!

| Field | Value |
|-------|-------|
| Email | jrichardson@blackhawklogisticsgroup.com |
| Tenant | Black Hawk Logistics |
| Role | Owner |
| Plan | Power Bookkeeping | Core |
| Subscription | Manual |
| Entity | Black Hawk Logistics |

**Plan includes:**
- 1 entity
- 2 institutions
- 3 accounts
```
