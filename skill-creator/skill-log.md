# Skill Log: skill-creator

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

### 2025-12-12 - Delivered skills without rating or feedback

**Problem:** Delivered 4 skills (3 prompt-engineering + end-of-day) rated 78-85 without self-rating beforehand or asking for feedback.

**Root Cause:** Phase 6 validated structure, not quality. "It works" ≠ "It's good."

**Fix:** v1.1-1.2 added 85+ blocking gate, failure modes table at top of skill.md, mandatory feedback question.

**Status:** ✅ FIXED

---

## Learnings

### 2025-12-12 - Initial Architecture

**Observation:** Skills need both immediate reliability AND long-term learning capability.

**Implication:** Every skill needs:
1. Mandatory discovery phase (3-7 questions)
2. Self-testing before delivery
3. Feedback loop at end of session
4. skill-log.md for persistent learning

**Action Taken:** Built these into the skill-creator workflow.

---

## Run History

| Date | Outcome | Feedback | Action Taken |
|------|---------|----------|--------------|
| 2025-12-12 | Clean | "everything looks good for now" | None - first clean run |
| 2025-12-12 | **FAIL** | Skills rated 78, 82, 85 - all below 85+ standard | Fixed Phase 6 with 85+ blocking gate (v1.1) |
| 2025-12-12 | **FAIL** | end-of-day skill 78/100, no feedback asked | Added failure modes table, strengthened gates (v1.2) |

---

## Version Notes

### v1.2 - 2025-12-12
- Added "⛔ KNOWN FAILURE MODES" section at top of skill.md
- Made Phase 6 a "BLOCKING GATE" with explicit stop language
- Made feedback question "MANDATORY - NOT OPTIONAL"
- Added failure mode callouts throughout
- Updated rating dimensions to include deduplication/idempotency

### v1.1 - 2025-12-12
- Added MANDATORY self-rating with 85+ minimum threshold before delivery
- Made rating a blocking gate - cannot proceed to Phase 7 until 85+ achieved
- Added weighted scoring rubric (7 dimensions)
- Added "If below 85: iterate until ceiling reached" guidance

### v1.0 - 2025-12-12
- Initial skill creation
- 7-phase workflow (Discovery → Planning → Implementation → Skill Log → Scripts → Self-Testing → Delivery)
- Mandatory discovery with 3-7 questions
- Self-healing feedback loop
- Auto-quiet after 4 clean runs
- init-skill.cjs and validate-skill.cjs scripts
- skill-examples.md reference
