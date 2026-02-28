---
name: shortcut-story
description: Manages Shortcut stories via MCP with proper categorization. Use when user says "create shortcut story", "update shortcut story", "delete shortcut story", "get shortcut story", or "find shortcut story". NOT for epics, iterations, or project management.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, AskUserQuestion, mcp__shortcut__create_story, mcp__shortcut__get_story, mcp__shortcut__update_story, mcp__shortcut__delete_story, mcp__shortcut__search_stories, mcp__shortcut__list_stories, mcp__shortcut__list_epics, mcp__shortcut__list_workflows
---

# Shortcut Story Management

Manages Shortcut stories (create, read, update, delete) with consistent quality, proper workflow assignment, and epic association.

**Why this matters:** Stories without proper workflow assignment, state, epic association, and type create chaos in sprint planning and make work untraceable.

---

## Before Each Run

Read the skill-log at `/Users/troybrave/.claude/skills/shortcut-story/skill-log.md` to check for known issues and user preferences.

---

## Default Configuration

| Setting | Value | ID |
|---------|-------|-----|
| **Default Workflow** | Taskaroo-dev | 500001336 |
| **Default State** | Under refined | 500001344 |
| **Story Types** | feature, bug, chore | - |
| **Default Mode** | Backlog | - |

### Story Modes

**Backlog Mode (Default):** Stories in Unrefined, Under refined, or Refined states
- **Problem-focused titles** - Describe the problem, not the solution
- Use verbs like: "Address", "Investigate", "Determine", "Evaluate", "Research"
- **Priority is REQUIRED** - Must be set on every backlog story
- Description focuses on the problem and context, not implementation details

**Active Iteration Mode:** Stories in Ready for Dev or beyond
- **Solution-focused titles** - Describe what to implement
- Use verbs like: "Add", "Fix", "Implement", "Update", "Remove"
- Clear requirements and acceptance criteria
- Ready for a developer to pick up

**Assume Backlog Mode unless user explicitly says "active iteration" or "ready for dev".**

### Priority Custom Field (Required for Backlog)

| Priority | Value ID |
|----------|----------|
| Highest | `62eaee7e-b8d1-4f12-a9e6-6e6b17a7b0f7` |
| High | `62eaee7e-16c0-4952-a6cb-9f019357600c` |
| Medium | `62eaee7e-2141-4109-8a68-0d1bbdd85159` |
| Low | `62eaee7e-4fa6-44cc-9fae-d276e691aed0` |
| Lowest | `62eaee7e-fa83-48dd-95f8-373d6ae349c6` |

Field ID: `62eaee7e-438f-489b-9bd2-09312a19bcfd`

### Teams Reference

| Team | Group ID | Title Prefix |
|------|----------|--------------|
| Frontend | `62eaee7e-3e7d-465b-bb41-3f3a4f9abd24` | "FE - " |
| Backend | `68261e99-9464-46d6-b328-ff9cbd9cc378` | (none) |

**Prefix Rule:** Stories assigned to Frontend team must have "FE - " prefix in title.

### Taskaroo-dev Workflow States

| State | ID | Description |
|-------|-----|-------------|
| Unrefined | 500001343 | Cards with no details |
| **Under refined** | 500001344 | Some detail, no dev evaluation (DEFAULT) |
| Refined | 500001345 | Has dev detail, needs sr. dev evaluation |
| Ready for Dev | 500001337 | Ready to be assigned |
| In Development | 500001339 | Dev has picked up, linked to branch |
| Ready for PR | 500001340 | Open PR needs review |
| Ready for QA | 500001341 | Ready for testing |
| Ready for Staging/Demo | 500001348 | QA'd, ready for staging |
| Push to Production | 500001349 | Moving to production |
| Completed | 500001342 | Launched to production |

---

## Active Epics Reference

Use this list for epic matching. Only call `mcp__shortcut__list_epics` when:
1. No confident match (>80% similarity) found below
2. MCP returns epic validation error
3. Cache is older than 7 days (track via `epic_cache_last_refreshed_iso`)

| Epic | ID | State |
|------|-----|-------|
| links rewrite | 2421 | in progress |
| Invoicing | 4671 | in progress |
| Taskaroo home page | 7250 | in progress |
| FE - Messaging/Calls | 7915 | to do |
| FE \| Dashboard | 8179 | to do |
| Email/Phone change flow | 9011 | in progress |
| Log aggregation, including handling audit logs | 11782 | in progress |
| Tech debt - API | 9035 | in progress |
| API - Background check | 9277 | to do |
| Disabled / Delete Affected Items | 9437 | to do |
| API - Admin Endpoints to manage Settings, Messages and Categories | 10151 | to do |
| API - Security Review | 10279 | in progress |
| Implement Websockets / realtime messaging | 11279 | to do |
| FE \| Reporting | 11681 | to do |
| Orgs billing transaction history | 11764 | to do |
| Verification | 11768 | to do |
| Org Referrals | 11771 | to do |
| Product manager | 11776 | to do |
| API - Track Notification interactions | 10170 | to do |
| PDF/Docusign tool | 11876 | to do |
| BE \| Beta Bucket | 11917 | in progress |
| BE - Post-Beta Bucket | 12005 | in progress |
| Permission Enforcement (security) | 12032 | to do |
| Customer events: accept, reject, etc. | 12044 | to do |
| BE \| Reporting | 12269 | in progress |
| [Customer] User notification settings | 12290 | in progress |
| Get Customer Portal user Jobs | 12295 | to do |
| FE \| Activity logs | 12452 | to do |
| Customer Portal - Jobs | 12472 | to do |
| Vendor Portal - Contacts tab | 12473 | to do |
| Vendor dispute management | 12474 | to do |
| Roopay treasury + Issuing | 12539 | in progress |
| FE \| Beta Bucket | 12687 | in progress |
| Quote Change Requested | 12988 | to do |
| BE \| Org Business Profile | 11779 | to do |
| Get Assigned jobs for user | 13002 | to do |
| Stripe transfers Platform -> Connected accounts | 13134 | in progress |
| BE: Cancelled Invoices | 13137 | to do |
| Stripe Processing fees, Ts&Cs | 13150 | to do |
| BE - Late Added Feature Bucket | 13539 | in progress |
| Non-Access Role | 14792 | to do |
| Vendors charges for outstanding balances & bills | 14800 | in progress |
| UI Clean up | 14842 | in progress |
| Better Twilio integration | 14904 | to do |
| Clean up duplicate db columns and duplicate data mapping | 14908 | to do |
| Mobile Check deposits | 14946 | to do |
| Organization Intake Form → Auto-Create Job Flow | 14947 | to do |
| GHL Integration 1.0 | 14948 | to do |
| Api swagger docs | 15020 | to do |
| Vendor SMS messages | 15021 | in progress |

---

## MCP Limitations

- **Labels:** The MCP does not support `label_ids` on create/update (returns "disallowed-key" error). Labels must be added manually in Shortcut UI if needed.
- **Search page limit:** `search_stories` has a max `page_size` of 25 results. For bulk operations or comprehensive searches, use `list_stories` instead and filter client-side.

---

## Determine Operation

- **"create" or "add" or "new"** → See CREATE Workflow
- **"get" or "find" or "show" or "read"** → See READ Workflow
- **"update" or "change" or "move" or "edit"** → See UPDATE Workflow
- **"delete" or "remove"** → See DELETE Workflow
- **"bulk" or "all" or "batch" or >25 stories** → See BULK OPERATIONS Workflow

---

## CREATE Workflow

### Step 1: Parse User Request

Extract from user input:
- Problem/issue to address (what needs solving)
- Story type hint (feature/bug/chore)
- Epic hint (if mentioned)
- Priority hint (if mentioned)
- Team hint (frontend, backend, etc.)
- Additional context

### Step 2: Generate Clean Title (Backlog Mode)

Transform the user's description into a **problem-focused** title:
- Remove filler words ("I want to", "We need to", "Please")
- Use problem-focused verbs: "Address", "Investigate", "Determine", "Evaluate", "Research"
- **Do NOT prescribe a solution** - describe what needs to be figured out
- Max 80 characters

**Team Prefix Rule:**
- If story is for Frontend team → prefix with "FE - " (if not already present)
- Check if title already starts with "FE -", "FE |", or "FE:" before adding
- Infer team from context: "dashboard", "UI", "component", "page" → Frontend
- If epic starts with "FE" → Frontend team

**Good backlog titles:**
- "FE - Address demo vs actual data display on vendor dashboard"
- "Investigate slow API response times on job list" (backend, no prefix)
- "FE - Determine approach for user notification preferences UI"

**Bad backlog titles (too solution-focused):**
- "Add toggle between demo and actual data" ← prescribes solution
- "Fix API by adding caching" ← prescribes solution

### Step 3: Determine Priority

**Priority is REQUIRED for backlog stories.**

If not specified, ask: "What priority should this be? (Highest / High / Medium / Low / Lowest)"

If user indicates urgency ("urgent", "ASAP", "critical"), default to **Highest**.

### Step 4: Determine Story Type

If not specified, infer from keywords:
- "fix", "broken", "error", "bug" → `bug`
- "refactor", "cleanup", "update dependencies" → `chore`
- Default → `feature`

If uncertain, ask user: "Is this a feature, bug, or chore?"

### Step 5: Match Epic

1. If epic_hint provided, fuzzy match against Active Epics Reference
2. If confident match (>80% similarity), use it
3. If uncertain, ask user: "Which epic should this belong to?" with top 3 matches
4. If no hint, analyze title keywords and suggest best-fit epic, ask to confirm

**Never create a story without an epic association.**

### Step 6: Check for Duplicates (Idempotency)

Before creating:
1. Build `dedupe_query` using exact-phrase search: `"${clean_title}"`
2. Call `mcp__shortcut__search_stories` with query
3. Filter results to same `epic_id`
4. If exact title match exists → return existing story + URL (do not create duplicate)
5. If top similarity ≥ 0.90 → ask user: "I found a very similar story: #{id} '{title}'. Use existing (Y) or create new (N)?"
6. Otherwise proceed with creation

### Step 7: Build Description (Backlog Mode)

Use this problem-focused template:

```markdown
## Overview
{1-3 sentence description of the PROBLEM to solve, not the solution}

## Context
- {Why this matters}
- {Who is affected}
- {Current behavior or gap}

## Notes
- Story type: {feature/bug/chore}
- Priority: {priority level}
- {Any additional context}
```

**Do NOT include "Requirements" with specific implementation steps** - that comes during refinement.

### Step 8: Create Story

Call `mcp__shortcut__create_story` with:
- `name`: {clean title with team prefix if applicable}
- `description`: {formatted description}
- `story_type`: {type}
- `workflow_state_id`: 500001344 (Under refined)
- `epic_id`: {matched epic ID}
- `group_id`: {team ID if determined, e.g., `62eaee7e-3e7d-465b-bb41-3f3a4f9abd24` for Frontend}

Then update with priority custom field (MCP may require separate call or include in create if supported).

**Do NOT include `label_ids` - MCP doesn't support it.**

### Step 9: Confirm Creation

Display:
- Story ID and title
- Type, State, Epic, Priority, Team
- URL (prefer `app_url` from response, fallback: `https://app.shortcut.com/bit9/story/{story_id}`)

---

## READ Workflow

### Step 1: Parse Request

Determine if user provided:
- Explicit story ID (numeric)
- Search terms (keywords)

### Step 2: Retrieve Story

**If story ID provided:**
Call `mcp__shortcut__get_story` with the ID

**If search terms provided:**
Call `mcp__shortcut__search_stories` with query

### Step 3: Display Results

Show:
- Story ID, Title
- Type, State, Epic
- Description summary (first 200 chars)
- URL

If multiple results from search, present as table:
```
| ID | Title | State | Epic |
|-----|-------|-------|------|
```

---

## UPDATE Workflow

### Hard Gate: Story Selection

**If the user did NOT provide an explicit numeric story ID:**
1. Run `mcp__shortcut__search_stories`
2. If 0 results → ask for different search terms
3. If 1 result → use it
4. If >1 result → STOP and require user to choose from top 5 list:
   ```
   | ID | Title | State | Epic |
   |-----|-------|-------|------|
   ```

**Never proceed with Update when >1 plausible match exists.**

### Step 1: Get Story ID

From user (explicit) or via Hard Gate search above.

### Step 2: Read Current Story

Call `mcp__shortcut__get_story` to get current values.

### Step 3: Parse Update Request

Determine what fields to change:
- Title/name
- Description
- State
- Epic
- Type

### Step 4: Validate Changes

**State validation:**
1. Check story's actual workflow (may differ from Taskaroo-dev)
2. If different workflow, warn: "This story is in {workflow_name}, not Taskaroo-dev."
3. Validate state ID exists in that workflow
4. Ask for confirmation if workflow differs

**Epic validation:**
Validate epic ID exists in Active Epics Reference or via list_epics call.

**Type validation:**
Must be one of: feature, bug, chore

### Step 5: Apply Update

Call `mcp__shortcut__update_story` with story_id and changed fields only.

### Step 6: Confirm Update

Show before/after for changed fields:
```
Updated story #12345: "Title here"
- State: Under refined → Refined
- Epic: Old Epic → New Epic
```

---

## DELETE Workflow

### Hard Gate: Story Selection

**If the user did NOT provide an explicit numeric story ID:**
1. Run `mcp__shortcut__search_stories`
2. If 0 results → ask for different search terms
3. If 1 result → use it
4. If >1 result → STOP and require user to choose from top 5 list:
   ```
   | ID | Title | State | Epic |
   |-----|-------|-------|------|
   ```

**Never proceed with Delete when >1 plausible match exists.**

### Step 1: Get Story ID

From user (explicit) or via Hard Gate search above.

### Step 2: Read Story

Call `mcp__shortcut__get_story` to display details before deletion.

### Step 3: Require Confirmation

Prompt: "To confirm deletion, reply with: `DELETE {story_id}`"

**Only proceed if user replies with exact phrase `DELETE {story_id}`.**
Any other response = abort deletion.

### Step 4: Delete Story

If confirmed, call `mcp__shortcut__delete_story` with story_id.

### Step 5: Confirm Deletion

"Story #{id} deleted."

---

## BULK OPERATIONS Workflow

Use this when:
- User says "all stories", "bulk update", "batch", or asks about more than 25 stories
- Need to audit/enforce rules across many stories (e.g., prefix compliance)
- `search_stories` won't return enough results (max 25)

### Step 1: Get All Stories

Call `mcp__shortcut__list_stories` to retrieve all stories.

**Optional filters** (pass to MCP if supported):
- `project_id`: Filter by project
- `epic_id`: Filter by epic
- `workflow_state_id`: Filter by state
- `owner_id`: Filter by owner

### Step 2: Filter Client-Side

After retrieving stories, filter in-memory by:
- `group_id`: Team assignment (e.g., Frontend = `62eaee7e-3e7d-465b-bb41-3f3a4f9abd24`)
- `completed`: Exclude completed stories with `completed == false`
- `name`: Pattern matching (e.g., missing "FE - " prefix)
- `archived`: Exclude archived with `archived == false`

**Example jq filter for Frontend stories missing prefix:**
```bash
jq '.[] | select(.group_id == "62eaee7e-3e7d-465b-bb41-3f3a4f9abd24") | select(.completed == false) | select(.name | test("^FE[ -|:]") | not)'
```

### Step 3: Present Findings

Show user a summary:
```
Found X stories matching criteria:
- Y need prefix updates
- Z have potential issues

| ID | Title | Issue |
|----|-------|-------|
```

### Step 4: Confirm Bulk Action

For updates, require explicit confirmation:
- "Update all X stories? (Y/N)"
- For destructive operations, show each story before proceeding

### Step 5: Execute Updates

Process stories in batches:
1. Update each story via `mcp__shortcut__update_story`
2. Track successes and failures
3. Report final summary:
   ```
   Updated X of Y stories successfully.
   Failed: [list any failures with reasons]
   ```

### Bulk Validation: Team Prefix Audit

When auditing Frontend team stories for prefix compliance:

1. Call `mcp__shortcut__list_stories`
2. Filter: `group_id == "62eaee7e-3e7d-465b-bb41-3f3a4f9abd24"` AND `completed == false`
3. Check each title: does it start with "FE -", "FE |", or "FE:"?
4. Report non-compliant stories
5. Offer to fix: "Add 'FE - ' prefix to X stories?"

---

## Error Handling

| Error | Detection | Response |
|-------|-----------|----------|
| Epic not found | Fuzzy match returns no results | List top 5 active epics, ask user to choose |
| Invalid story type | Type not in [feature, bug, chore] | "Story type must be 'feature', 'bug', or 'chore'. Which one?" |
| Story not found | get_story returns error | "Story #{id} not found. Check the ID and try again." |
| Invalid state | State ID not in workflow | List valid states for the story's workflow |
| MCP error | API returns error object | Parse error message, provide actionable guidance |
| No epic hint | User didn't specify epic | Analyze title, suggest best match, ask to confirm |
| Transient error | 429, 5xx, timeout | Retry up to 2 times with exponential backoff |
| Validation error | 4xx: disallowed-key, invalid | Do NOT retry. Report error immediately. |
| Duplicate detected | Exact title match in same epic | Return existing story + URL, do not create |

---

## Quality Checklist

Before completing any operation:

- [ ] Title is problem-focused (backlog) or solution-focused (active), under 80 chars
- [ ] Story type is explicitly set (not defaulted silently)
- [ ] Epic is associated (matched or user-confirmed)
- [ ] Workflow state is set (default: Under refined)
- [ ] **Priority is set** (required for backlog stories)
- [ ] Description has Overview and Context sections (for CREATE - no implementation details)
- [ ] User received confirmation with story URL
- [ ] No duplicate was created

---

## URL Contract

1. **Prefer `app_url`** if returned in API response
2. **Fallback construction:** `https://app.shortcut.com/bit9/story/{story_id}`
3. Never construct URL if `app_url` is available

---

## Example Interactions

### Create - Simple (Backlog Mode)

**User:** "Create a shortcut story for adding a toggle between demo and real data on the dashboard"

**Action:**
1. Reframe as problem-focused: "FE - Address demo vs actual data display on vendor dashboard"
2. Infer team: Frontend (dashboard = FE, epic starts with "FE")
3. Add "FE - " prefix
4. Infer type: feature (no bug/chore keywords)
5. Match epic: "FE | Dashboard" (ID: 8179) - high confidence
6. Ask for priority (not provided)
7. Check duplicates - none found
8. Create with team assignment

**Response:**
```
What priority should this be? (Highest / High / Medium / Low / Lowest)
```

**User:** "High"

**Output:**
```
Created story #12345: "FE - Address demo vs actual data display on vendor dashboard"
- Type: feature
- State: Under refined
- Epic: FE | Dashboard
- Priority: High
- Team: Frontend
- URL: https://app.shortcut.com/bit9/story/12345
```

### Create - Needs Clarification

**User:** "Create a story for the API thing we discussed"

**Response:**
```
I need a bit more detail to create this story:

1. What problem needs to be addressed? (for the title)
2. Is this a feature, bug, or chore?
3. What priority? (Highest / High / Medium / Low / Lowest)
4. Which epic should this belong to?
   - Tech debt - API (in progress)
   - API - Security Review (in progress)
   - BE | Beta Bucket (in progress)
   - Other?
```

### Update - With Search

**User:** "Update the dashboard toggle story to Refined"

**Action:**
1. Search for "dashboard toggle"
2. If 1 result → validate Refined state (ID: 500001345) → update
3. If >1 results → show table, require selection

**Output:**
```
Updated story #12345: "Add toggle between demo data and actual data on dashboard"
- State: Under refined → Refined
```

### Delete - With Confirmation

**User:** "Delete story 12345"

**Action:**
1. Get story details
2. Display story info
3. Prompt for confirmation

**Output:**
```
Story #12345: "Add toggle between demo data and actual data on dashboard"
- Type: feature
- State: Refined
- Epic: FE | Dashboard

To confirm deletion, reply with: DELETE 12345
```

**User:** "DELETE 12345"

**Output:**
```
Story #12345 deleted.
```
