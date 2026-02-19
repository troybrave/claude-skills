# Skill Log: production-week

> This log tracks learnings, failures, and improvements. Claude reads this BEFORE each run.

---

## Status

| Metric | Value |
|--------|-------|
| **Created** | 2026-01-01 |
| **Last Updated** | 2026-01-01 |
| **Clean Runs** | 0 |
| **Stability** | Learning |

**Stability Levels:**
- `Learning` (0-1 clean runs) - Actively collecting feedback
- `Improving` (2-3 clean runs) - Getting stable
- `Stable` (4+ clean runs) - No longer asking for feedback

---

## Known Issues & Fixes

<!-- Add entries as issues are discovered and fixed -->

### Issue Template
```
### {Date} - {Brief Issue Title}

**Problem:** {What went wrong}

**Root Cause:** {Why it happened}

**Fix Applied:** {What was changed}

**Files Modified:** {skill.md, scripts/x.cjs, etc.}
```

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

<!-- Automatically updated after each feedback session -->

| Date | Outcome | Feedback | Action Taken |
|------|---------|----------|--------------|
| 2026-01-01 | Issue | "deduplication is important" | Added Step 2 + check-existing.cjs script |

---

## Version Notes

### Versioning Rules

| Change Type | Version Bump | Example |
|-------------|--------------|---------|
| Bug fix, typo, minor tweak | v1.0 → v1.1 | Fixed path typo |
| New feature, new step | v1.x → v2.0 | Added email notification step |
| Breaking change, major rewrite | Note in description | "v3 - Complete redesign" |

### v1.1 - 2026-01-01
- Added deduplication workflow (Step 2: Check for Existing Records)
- Added `check-existing.cjs` script to query existing Week# values
- Updated Quality Checklist to emphasize deduplication check
- User feedback: "deduplication is important"

### v1.0 - 2026-01-01
- Initial skill creation
- Core generation algorithm with Final Date determining year
- `generate-weeks.cjs` script for standalone week generation
- Boundary verification built into script output
