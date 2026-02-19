# Skill Log: shortcut-story

> This log tracks learnings, failures, and improvements. Claude reads this BEFORE each run to learn from past sessions and avoid repeating mistakes.

---

## Status

| Metric | Value |
|--------|-------|
| **Created** | 2025-12-26 |
| **Last Updated** | 2025-12-26 |
| **Clean Runs** | 0 |
| **Stability** | Learning |
| **Version** | 1.3 |

**Stability Levels:**
- `Learning` (0-1 clean runs) - Actively collecting feedback
- `Improving` (2-3 clean runs) - Getting stable
- `Stable` (4+ clean runs) - No longer asking for feedback

---

## User Preferences

| Preference | Details | Discovered |
|------------|---------|------------|
| *None yet* | *Preferences will be logged after first uses* | - |

---

## Known Issues & Fixes

### 2025-12-26 - MCP Label IDs Not Supported

**Problem:** Attempting to use `label_ids` parameter on create/update returns "disallowed-key" error
**Root Cause:** Shortcut MCP does not support label_ids parameter
**Fix Applied:** Documented in skill.md under "MCP Limitations" - never include label_ids
**Prevention:** Check MCP Limitations section before using any parameter

---

## Task-Type Learnings

Track what works for specific task types.

| Task Type | Patterns That Work | Patterns That Don't | Notes |
|-----------|-------------------|---------------------|-------|
| Create | *To be discovered* | label_ids parameter | - |
| Read | *To be discovered* | - | - |
| Update | *To be discovered* | - | - |
| Delete | *To be discovered* | - | - |

---

## Successful Patterns

*No patterns saved yet. Patterns will be saved when user confirms a workflow worked "perfectly."*

---

## Run History

| Date | Operation | Story ID | Outcome | Notes |
|------|-----------|----------|---------|-------|
| 2025-12-26 | Skill created | - | Success | Built from production prompt (100/100 score) |

---

## Learnings

### 2025-12-26 - Bulk Operations & MCP Limitations

**Observation:** When updating 94 Frontend stories for prefix compliance, `search_stories` max page_size of 25 was insufficient. Used `list_stories` + jq filtering instead.
**Implication:** For bulk operations, always use `list_stories` then filter client-side
**Applied To Skill:** Yes - Added BULK OPERATIONS Workflow (v1.3)

**Observation:** Found typos in story titles during bulk updates ("previw", "recipeint", "Recents jobs")
**Implication:** Could add optional title quality check before create/update
**Applied To Skill:** Pending - future enhancement

**Observation:** Team prefix rule (FE -) wasn't being enforced retroactively. 37 stories needed manual updates.
**Implication:** Skill should flag/warn when Frontend stories lack the prefix
**Applied To Skill:** Yes - Added Bulk Validation: Team Prefix Audit (v1.3)

### 2025-12-26 - Initial Build

**Observation:** Built from a production-grade prompt that was iteratively refined to 100/100 score
**Key Features:**
- Hard Gates for Update/Delete prevent accidental modifications
- Duplicate detection before create
- Epic cache policy to reduce API calls
- Explicit deletion confirmation with `DELETE {story_id}` phrase
- Workflow validation checks story's actual workflow, not assumed Taskaroo-dev

---

## Epic Cache Metadata

Track when the Active Epics Reference was last refreshed.

| Field | Value |
|-------|-------|
| `epic_cache_last_refreshed_iso` | 2025-12-26T00:00:00Z |

**Refresh Policy:** Call `mcp__shortcut__list_epics` only when:
1. No confident match (>80% similarity) found in cached list
2. MCP returns epic validation error
3. Cache is older than 7 days

---

## Version Notes

### v1.3 - 2025-12-26
**Bulk Operations Support**
- Added `mcp__shortcut__list_stories` to allowed tools
- Documented MCP search limit (25 results max) in MCP Limitations
- Added BULK OPERATIONS Workflow for handling >25 stories
- Added jq filter examples for client-side filtering
- Added "Bulk Validation: Team Prefix Audit" for enforcing prefix compliance
- Trigger words: "bulk", "all", "batch", or when >25 stories needed

### v1.2 - 2025-12-26
**Team Prefix for Frontend Stories**
- Added "FE - " prefix requirement for Frontend team stories
- Added Teams Reference with group IDs (Frontend, Backend)
- Auto-infer team from context: "dashboard", "UI", "component", "page" → Frontend
- Auto-infer team from epic prefix: "FE |" or "FE -" → Frontend
- Stories now include `group_id` for team assignment
- Updated examples to show team prefix and assignment

### v1.1 - 2025-12-26
**Backlog Mode by Default**
- Added Story Modes: Backlog (default) vs Active Iteration
- Problem-focused titles for backlog ("Address X", "Investigate Y")
- Priority custom field now REQUIRED for all backlog stories
- Updated description template: Overview + Context (no implementation Requirements)
- Added Priority field IDs for custom field integration
- Updated examples to reflect backlog mode behavior

### v1.0 - 2025-12-26
- Initial skill creation from production prompt
- Full CRUD operations (Create, Read, Update, Delete)
- Default workflow: Taskaroo-dev (500001336)
- Default state: Under refined (500001344)
- 50+ active epics embedded for fast matching
- Hard Gates for Update/Delete operations
- Duplicate detection with 0.90 similarity threshold
- Explicit deletion confirmation required
- Comprehensive error handling table
- Quality checklist for every operation
