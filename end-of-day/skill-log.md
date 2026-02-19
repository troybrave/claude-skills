# Skill Log: end-of-day

> This log tracks learnings, failures, and improvements. Claude reads this BEFORE each run.

---

## Status

| Metric | Value |
|--------|-------|
| **Created** | 2025-12-12 |
| **Last Updated** | 2025-12-12 |
| **Clean Runs** | 0 |
| **Stability** | Learning |

**Stability Levels:**
- `Learning` (0-1 clean runs) - Actively collecting feedback
- `Improving` (2-3 clean runs) - Getting stable
- `Stable` (4+ clean runs) - No longer asking for feedback

---

## Known Issues & Fixes

### 2025-12-12 - Wrong Cycle ID used for Notion tasks

**Problem:** All 10 EOD tasks created with empty Cycle relation. Tasks didn't appear on user's Bosses page because Cycle wasn't set correctly.

**Root Cause:** Searched Notion globally for "2550" and used the first result without verifying it came from the correct Cycles database. The ID found (`1fe50f64-6387-8064-92dc-c9baf7c7a882`) was from a DIFFERENT database, not the Master Cycles database (`579faf32-07a5-4848-88ac-bb7bc7900c26`).

**What SHOULD have happened:** The zoom-transcript-sync `create-meeting-tasks.cjs` already does this correctly - it queries the specific Cycles database for `Sprint Status = Current`. I should have used this same pattern.

**Fix Applied:**
1. Updated all 10 tasks with correct Cycle ID (`1dc50f64-6387-80c0-a6d4-d9782d0c0e14`)
2. Updated config.json with correct cycle ID
3. Updated skill.md with correct cycle ID
4. Added explicit Cycles database ID to skill.md

**Files Modified:** skill.md, config.json

**Prevention:** When looking up Notion relations, ALWAYS query the specific related database, never use global search. Reference `create-meeting-tasks.cjs` lines 209-241 for the correct pattern.

**Status:** ✅ FIXED

---

## Learnings

<!-- Add entries as patterns emerge -->

### Learning Template
```
### {Date} - {Brief Learning Title}

**Observation:** {What was noticed}

**Implication:** {What this means for the skill}

**Action Taken:** {How skill was updated, or "None - noted for future"}
```

---

## Run History

| Date | Outcome | Feedback | Action Taken |
|------|---------|----------|--------------|
| 2025-12-12 | **FAIL** | Tasks had empty Cycle column, didn't appear on Bosses page | Updated skill-log with failure, added Cycles DB ID to skill.md |

---

## Version Notes

### Versioning Rules

| Change Type | Version Bump | Example |
|-------------|--------------|---------|
| Bug fix, typo, minor tweak | v1.0 → v1.1 | Fixed path typo |
| New feature, new step | v1.x → v2.0 | Added email notification step |
| Breaking change, major rewrite | Note in description | "v3 - Complete redesign" |

### v1.1 - 2025-12-12
- Fixed Cycle ID lookup - now reads from config.json instead of hardcoded value
- Added Master Cycles DB ID (`579faf32-07a5-4848-88ac-bb7bc7900c26`) for reference
- Added "CRITICAL: Cycle ID Lookup" section with correct runtime method
- Cycle ID changes weekly with sprint rotation - must be dynamic, not static

### v1.0 - 2025-12-12
- Initial skill creation
- Parses session files for completed/pending tasks
- Creates Notion tasks with proper weights, priorities, and company relations
- Detects company from project name, file path, or content keywords
- Estimates task weight based on complexity signals
- Sends formatted EOD summary email to personal inbox
- Includes calendar events context
- Supports dry-run mode for preview
- Helper scripts: parse-sessions.cjs, send-summary-email.cjs
