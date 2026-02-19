# Skill Log: research

> This log tracks learnings, failures, and improvements. Claude reads this BEFORE each run.

---

## Status

| Metric | Value |
|--------|-------|
| **Created** | 2026-02-18 |
| **Last Updated** | 2026-02-18 |
| **Clean Runs** | 0 |
| **Stability** | Learning |

**Stability Levels:**
- `Learning` (0-1 clean runs) - Actively collecting feedback
- `Improving` (2-3 clean runs) - Getting stable
- `Stable` (4+ clean runs) - No longer asking for feedback

---

## Known Issues & Fixes

*None yet — first deployment.*

---

## Learnings

### 2026-02-18 - Prompt Engineering History

**Observation:** The skill prompt went through extensive review cycles (v1.0 → v1.1 → v1.2 → v2.0 → v2.1 → v2.2) with the prompt-review skill, scoring 79 → 96 → 98 → 100. Key improvements: cut 40% bloat from v1.2, added context window protection, output management, deterministic defaults, confidence definitions, degraded mode, No-Fake-Winners rule.

**Implication:** The prompt is production-hardened. Monitor for real-world failure modes that theoretical review couldn't catch (context compression mid-research, WebFetch reliability on modern SPAs, output length in practice).

**Action Taken:** Skill created from v2.2 prompt.

---

## Run History

| Date | Outcome | Feedback | Action Taken |
|------|---------|----------|--------------|
| 2026-02-18 | New | Skill created | Initial deployment |

---

## Version Notes

### v1.0 - 2026-02-18
- Initial skill creation from production prompt v2.2
- 5-phase research system: Objective Lock-In → Priority Discovery → Deep Investigation → Comparative Analysis → Recommendation
- Key features: weighted scoring, citation gates, source quality hierarchy, bias detection, context window protection, No-Fake-Winners rule, degraded mode handling
- Triggers: "research", "deep research", "investigate", "evaluate options for", "compare tools for"
