# Skill Log: prompt-engineer

> This log tracks learnings, failures, and improvements. Claude reads this BEFORE each run to learn from past sessions and avoid repeating mistakes.

---

## Status

| Metric | Value |
|--------|-------|
| **Created** | 2025-12-12 |
| **Last Updated** | 2025-12-19 |
| **Clean Runs** | 0 |
| **Stability** | Learning |
| **Version** | 2.0 |

**Stability Levels:**
- `Learning` (0-1 clean runs) - Actively collecting feedback
- `Improving` (2-3 clean runs) - Getting stable
- `Stable` (4+ clean runs) - No longer asking for feedback

---

## User Preferences

<!-- Patterns and styles the user prefers. Update as preferences are discovered. -->

| Preference | Details | Discovered |
|------------|---------|------------|
| *None yet* | *Preferences will be logged after first uses* | - |

---

## Known Issues & Fixes

<!-- Add entries as issues are discovered and fixed -->

*No issues recorded yet. Issues will be logged as they occur and solutions applied.*

### Issue Template (for future entries)
```markdown
### {Date} - {Brief Issue Title}

**Problem:** {What went wrong}
**Root Cause:** {Why it happened}
**Fix Applied:** {What was changed in skill.md}
**Prevention:** {How to avoid in future}
```

---

## Task-Type Learnings

Track what works for specific task types.

| Task Type | Patterns That Work | Patterns That Don't | Notes |
|-----------|-------------------|---------------------|-------|
| Analysis | *To be discovered* | - | - |
| Generation | *To be discovered* | - | - |
| Extraction | *To be discovered* | - | - |
| Reasoning | *To be discovered* | - | - |
| Transformation | *To be discovered* | - | - |
| Multi-step | *To be discovered* | - | - |

---

## Successful Prompt Patterns

<!-- Save prompts that worked perfectly for reuse -->

*No patterns saved yet. Patterns will be saved when user confirms a prompt worked "perfectly."*

### Pattern Template (for future entries)
```markdown
### {Task Type} - {Brief Description}

**Use Case:** {When to use this pattern}

**Prompt:**
```
{The successful prompt}
```

**Why It Works:** {Key elements that made it successful}
```

---

## Run History

<!-- Automatically updated after each feedback session -->

| Date | Task Type | Target LLM | Outcome | Feedback Summary |
|------|-----------|------------|---------|------------------|
| *2025-12-12* | *Skill created* | *-* | *-* | *Initial creation* |

---

## Learnings

<!-- General observations about prompt engineering from using this skill -->

*No learnings recorded yet.*

### Learning Template (for future entries)
```markdown
### {Date} - {Brief Learning Title}

**Observation:** {What was noticed}
**Implication:** {What this means for future prompts}
**Applied To Skill:** {Yes/No - if yes, what changed}
```

---

## Version Notes

### v2.0 - 2025-12-19
**Major upgrade: Systems Architecture Approach**

Compared user-provided production prompt (scored 92/100) against skill output (scored 68/100). Identified key gaps and incorporated learnings:

**New Features:**
- **Core Philosophy section**: "Systems Over Outputs" - the fundamental mindset shift
- **Complexity Tier Classification**: 4 tiers with clear triggers for when to escalate
- **Systems Architecture Approach (Tier 3-4)**: 10-component framework for production prompts
  1. Role & Stakes
  2. Objective with Success Criteria
  3. Context & Constraints (hard vs soft)
  4. Architecture Specification
  5. Data Models & Types (with validation rules)
  6. Data Flow Requirements (with error handling, observability, idempotency)
  7. Phased Implementation (with "done means" criteria)
  8. Output Format Requirements
  9. Critical Requirements (guardrails)
  10. Self-Critique Mechanism
- **Prompt Scoring Rubric**: 1-100 scale with specific characteristics per tier
- **Extended requirements gathering**: Autonomy level, verification needs, operational context
- **New task type**: System-Building
- **Enhanced Quality Checklist**: Basic + Advanced tiers
- **New diagnostic symptoms**: Incomplete system, Unverifiable, Fragile
- **Quick Reference templates**: Basic (Tier 1-2) and Production (Tier 3-4)

**Key Learnings Applied:**
- Build systems, not outputs
- Specify verification mechanisms upfront
- Define data models explicitly with TypeScript-style interfaces
- Phase work with verifiable "done means" criteria
- Add fail-safe logic specification (auto-correct OR fail with message)
- Include operational constraints (auth, rate limits, ethics)
- Build self-critique into prompt

### v1.0 - 2025-12-12
- Initial skill creation
- Core workflow: Gather → Classify → Apply patterns → Construct → Explain → Deliver
- Model-specific patterns for Claude (Opus 4.5, Opus 4, Sonnet 4, Haiku) and ChatGPT (GPT-4, GPT-4o)
- Advanced techniques: Chain-of-thought, few-shot, self-consistency, decomposition
- Task-specific templates: Analysis, Generation, Extraction, Reasoning, Multi-step
- Iteration & refinement guidance with diagnostic table
- Self-healing skill-log integration
- Reference file: before-after-examples.md with 5 detailed transformations

---

## Self-Healing Notes

When updating this skill-log:

1. **After each use:** Ask for feedback, update Run History
2. **When issue found:** Add to Known Issues, apply fix to skill.md, increment version
3. **When pattern works:** Save to Successful Prompt Patterns
4. **When preference discovered:** Add to User Preferences table
5. **When task type succeeds:** Update Task-Type Learnings table

The goal is 4+ clean runs → skill becomes stable → stop asking for feedback for that task type.
