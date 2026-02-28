---
name: skill-creator
description: Creates Claude Code skills - modular packages that extend Claude's capabilities. Use when user says "create a skill", "make a skill", "build a skill", or "new skill for". NOT for slash commands, standalone scripts, or MCP servers.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, AskUserQuestion, Task
---

# Claude Code Skill Creator

Creates reliable, self-improving skills that work flawlessly from day one.

---

## ⛔ KNOWN FAILURE MODES (READ FIRST)

These failures have happened before. Do not repeat them.

| Failure | What Happened | Prevention |
|---------|---------------|------------|
| **Delivered sub-85 skill** | Created skill, tested scripts work, declared done. Skill rated 78/100 when asked. | Rate skill BEFORE delivery. If <85, fix first. |
| **Skipped feedback question** | Presented skill as complete, never asked user for feedback. | ALWAYS ask feedback question after delivery. Not optional. |
| **Rated after delivery** | Only self-rated when user explicitly asked "rate this skill" | Self-rating happens in Phase 6, BEFORE Phase 7 delivery. |
| **Confused functional with complete** | Scripts ran without errors, so assumed skill was done. | "It works" ≠ "It's good". Check edge cases, deduplication, idempotency. |

**If you catch yourself about to make one of these mistakes, STOP and correct course.**

---

## Critical Architecture

| Layer | When Loaded | Purpose |
|-------|-------------|---------|
| Frontmatter description | ALWAYS in context | Trigger correctly |
| skill.md body | After skill triggers | Procedural guidance |
| skill-log.md | Read BEFORE each run | Learn from past runs |
| scripts/ | When invoked | Reusable code |
| references/ | When Claude reads them | Detailed docs |

**Key Insight:** Description is your ONLY chance to trigger correctly. All trigger conditions MUST be in the description.

---

## PHASE 1: MANDATORY DISCOVERY

**DO NOT BUILD UNTIL DISCOVERY IS COMPLETE.**

### Pre-Flight Checklist

Before asking discovery questions, verify:

- [ ] User wants a **SKILL** (not a script, command, or MCP server)
- [ ] No existing skill already handles this (check `/Users/troybrave/.claude/skills/`)
- [ ] Task is complex enough to warrant a skill (>2 steps or repeated workflow)

**If user wants a script:** Politely clarify the difference. Scripts are one-off code; skills are reusable Claude capabilities with learning loops.

**If existing skill overlaps:** Consider extending it rather than creating a new one.

### Discovery Questions

Ask 3-7 questions upfront, all at once. Tailor questions to the skill type.

### Core Questions (Always Ask)

1. "What exact user phrases should trigger this skill?"
2. "Walk me through doing this task manually—what steps repeat every time?"
3. "What does a successful outcome look like? What does failure look like?"

### Conditional Questions (Ask If Relevant)

4. "What similar requests should NOT trigger this skill?" (if ambiguous domain)
5. "What information do you have to look up each time?" (if research-heavy)
6. "Does this need to integrate with other tools/skills?" (if complex workflow)
7. "Are there edge cases or exceptions I should handle?" (if variable inputs)

### Discovery Complete When You Have

- [ ] Trigger phrases (what users will say)
- [ ] Non-triggers (what should NOT activate) - if applicable
- [ ] Manual workflow steps
- [ ] Success criteria
- [ ] Failure modes
- [ ] Dependencies (other skills/tools)

**Only proceed to Phase 2 after user answers.**

---

## PHASE 2: PLANNING

### Determine Resource Types

| Question | Resource Type |
|----------|---------------|
| Will Claude rewrite this code every time? | `scripts/` |
| Is this >500 words of reference material? | `references/` |
| Is this core procedural guidance <500 lines? | skill.md body |
| Does Claude need this to decide whether to use skill? | Frontmatter description |

### Determine Skill Freedom Level

| Level | When to Use | Example |
|-------|-------------|---------|
| **High** (text guidance) | Multiple valid approaches, creative tasks | "Write a summary" |
| **Medium** (pseudocode) | Preferred pattern with acceptable variation | "Process files in X order" |
| **Low** (exact scripts) | Fragile operations, external APIs, precise sequences | "Call API with exact params" |

Default to **Low freedom** for reliability. Only increase if task genuinely benefits from flexibility.

---

## PHASE 3: IMPLEMENTATION

### Directory Structure

```
/Users/troybrave/.claude/skills/{skill-name}/
├── skill.md           # Required - main definition
├── skill-log.md       # Required - learning log
├── scripts/           # Optional - reusable code
└── references/        # Optional - detailed docs
```

Initialize with:
```bash
/Users/troybrave/.claude/skills/skill-creator/scripts/init-skill.cjs {skill-name}
```

### Frontmatter (Required)

```yaml
---
name: {skill-name}
description: {Action verb} {what}. Use when user says "{trigger 1}", "{trigger 2}", "{trigger 3}". NOT for {non-trigger if ambiguous}.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, {others as needed}
---
```

**Description Rules:**
- 50 words max
- Start with action verb
- Include ALL trigger phrases
- Include "NOT for" if ambiguous domain
- Be specific enough to exclude non-triggers

### Body Structure

**Use imperative voice throughout.** Structure depends on workflow type:

**Sequential Workflow:**
```markdown
## Workflow

### Step 1: {Name}
{Instructions}

### Step 2: {Name}
{Instructions}
```

**Conditional Workflow:**
```markdown
## Determine Task Type

- **{Condition A}?** → See "Workflow A"
- **{Condition B}?** → See "Workflow B"
```

**Multi-Skill Workflow (Chaining):**
```markdown
## Workflow

### Step 1: {Name}
Invoke the `{other-skill}` skill to {action}.

### Step 2: {Name}
{Continue with results}
```

### Skill Chaining Guidelines

When a skill invokes other skills:

| Concern | Guidance |
|---------|----------|
| **Error handling** | If chained skill fails, document fallback behavior |
| **Data passing** | Store intermediate results in files, not memory |
| **Timeouts** | Long-running skills should checkpoint progress |
| **Dependencies** | List all skills that must exist for this to work |

**Chaining Pattern:**
```markdown
### Step N: Invoke {other-skill}

Invoke the `{other-skill}` skill.

**If successful:** Continue to Step N+1
**If fails:** {fallback action - retry, skip, or abort with message}
```

### What to Include in Body

- Procedural steps Claude doesn't already know
- File paths and exact commands
- Decision trees for branching logic
- Quality checklist
- Error handling table
- "When to read" guidance for references

### What NOT to Include

- Explanations Claude already knows
- Generic concepts (what a PDF is, what JSON means)
- Duplicate info between skill.md and references
- "When to use this skill" (belongs ONLY in description)

---

## PHASE 4: SKILL LOG

**Every skill gets a skill-log.md.** This is the self-healing mechanism.

Create from template:
```bash
cp /Users/troybrave/.claude/skills/skill-creator/skill-log-template.md \
   /Users/troybrave/.claude/skills/{skill-name}/skill-log.md
```

### Skill Log Behavior

1. **Before running skill:** Read skill-log.md to learn from past
2. **After session ends:** Ask for feedback (unless stable)
3. **If feedback given:** Update skill-log.md and skill.md if needed
4. **If "no issues":** Increment clean_runs counter
5. **If clean_runs >= 4:** Stop asking (skill is stable)

### Feedback Questions (End of Session)

```
How did [{skill-name}] work this session?
- Any issues or unexpected behavior?
- Anything it should do differently?
- Or was it flawless? (I'll stop asking after a few clean runs)
```

---

## PHASE 5: SCRIPTS (Optional)

Only create scripts when Claude would rewrite the same code every time.

### Script Template

```javascript
#!/usr/bin/env node
/**
 * {Description}
 * Usage: ./{name}.cjs [args]
 */

const fs = require('fs');
const path = require('path');

function main() {
    const args = process.argv.slice(2);

    if (args.includes('--help')) {
        console.log('Usage: ./{name}.cjs [args]');
        process.exit(0);
    }

    // Implementation

    console.log('Done.');
}

main();
```

Make executable:
```bash
chmod +x /Users/troybrave/.claude/skills/{skill-name}/scripts/*.cjs
```

---

## PHASE 6: SELF-TESTING (BLOCKING GATE)

**⛔ YOU CANNOT PROCEED TO PHASE 7 UNTIL THIS GATE PASSES.**

**This phase is NOT optional. Skipping it is a failure mode that has happened before.**

### Option A: QA Agent (Preferred)

Spawn a Task agent to evaluate:

```
Prompt: "Act as a QA tester. Review this skill at /Users/troybrave/.claude/skills/{skill-name}/.
Test these scenarios:
1. {Happy path scenario}
2. {Edge case scenario}
3. {Error scenario}

For each, trace through the skill.md and report:
- Would it trigger correctly?
- Would each step execute properly?
- Are there gaps or ambiguities?
- Rate reliability 1-10 with justification."
```

### Option B: Self-Simulation

Mentally simulate 3-5 different users with different requests:
1. Exact trigger phrase
2. Slightly different phrasing
3. Edge case input
4. Invalid input (should gracefully handle)
5. Request that should NOT trigger this skill

Trace through skill.md for each. Fix gaps before delivering.

### Validation Checklist

Run before delivery:
```bash
/Users/troybrave/.claude/skills/skill-creator/scripts/validate-skill.cjs {skill-name}
```

Or manually verify:

- [ ] Description contains ALL trigger phrases
- [ ] Description excludes non-triggers (via specificity or "NOT for")
- [ ] Body uses imperative voice throughout
- [ ] No duplicate info between skill.md and references
- [ ] All file paths are absolute
- [ ] All commands are copy-paste ready
- [ ] Error handling covers likely failures
- [ ] skill-log.md exists and is properly formatted
- [ ] Scripts (if any) are executable and tested
- [ ] QA simulation passed with no critical gaps

### MANDATORY: Self-Rating Before Delivery

**⛔ HARD GATE: DO NOT DELIVER A SKILL RATED BELOW 85/100.**

**You MUST complete this rating BEFORE presenting the skill to the user. Not after they ask.**

Rate the skill on these dimensions:

| Dimension | Weight | Score (1-10) |
|-----------|--------|--------------|
| Description clarity & triggers | 15% | |
| Workflow completeness | 20% | |
| Edge case handling | 20% | |
| Error handling | 15% | |
| Quality checklist | 10% | |
| Deduplication/idempotency | 10% | |
| Integration completeness | 10% | |

**Calculate:** Sum of (Weight × Score) = Total /100

**Minimum threshold: 85/100**

**If below 85:**
1. STOP - do not present to user yet
2. Identify the gaps (lowest scoring dimensions)
3. Fix them - add examples, deepen coverage, improve error handling
4. Re-rate
5. Repeat until 85+ achieved
6. ONLY THEN proceed to Phase 7

**FAILURE MODE TO AVOID:** Presenting a skill as "complete" and then rating it 78/100 when asked. The rating must happen BEFORE delivery, not after.

**Include rating in delivery message:**
```
🎯 Quality Rating: {X}/100
   - {Strongest dimension}: {score}
   - {Area for future improvement}: {score}
```

---

## PHASE 7: DELIVERY & ITERATION

### Delivery Format (ALL FIELDS REQUIRED)

```
✅ Skill "{skill-name}" created

📁 Location: /Users/troybrave/.claude/skills/{skill-name}/

📄 Files:
- skill.md (main definition)
- skill-log.md (learning log)
- {other files if any}

🎯 Triggers on: "{trigger 1}", "{trigger 2}", "{trigger 3}"

🎯 Quality Rating: {X}/100
   - {Strongest dimension}: {score}
   - {Area for future improvement}: {score}

🧪 QA Status: {Passed/Notes}

💡 To use: Just say "{example trigger phrase}"
```

**⛔ If Quality Rating is missing from delivery, the skill was delivered incorrectly.**

### End of Session Feedback (MANDATORY - NOT OPTIONAL)

**⛔ YOU MUST ASK FOR FEEDBACK. This is not optional. Skipping this is a documented failure mode.**

**Immediately after delivering a skill, ask:**

```
How did the {skill-name} skill creation go?

1. Any issues or unexpected behavior in the skill?
2. Anything it should do differently?
3. Or does it look good to ship?

(I'll update the skill-log with your feedback)
```

**This question is REQUIRED. Do not skip it. Do not assume the user will provide feedback unprompted.**

**If user provides feedback:** Update skill-log.md immediately.
**If user says "looks good":** Note as clean run in skill-log.md.

### Iteration Loop

After user tests the skill:

1. Collect feedback at end of session
2. Identify gap type:
   - **Trigger issue** → Update description
   - **Execution issue** → Update body/scripts
   - **Missing info** → Add to references
   - **Edge case** → Add error handling
3. Update skill-log.md with learning
4. Update skill.md if needed
5. Re-validate
6. Increment version note in skill-log.md

---

## REFERENCES

**For a complete before/after example:** Read `references/complete-example.md`

This shows the full conversation that created this skill - from user request through discovery, building, QA, and iteration.

**For patterns from existing skills:** Read `references/skill-examples.md`

This contains patterns from:
- transcript-processor (complex multi-step workflow)
- session-files (multiple modes, templates)
- obsidian-optimizer (transformation with quality checks)

---

## COMPLEXITY DECISION

### When to Split into Multiple Skills

| Indicator | Threshold | Action |
|-----------|-----------|--------|
| Workflow steps | >7 distinct steps | Consider splitting |
| Conditional branches | >5 if/else paths | Split by mode |
| External dependencies | >3 APIs/tools | One skill per integration |
| skill.md length | >400 lines | Split or move to references |

### When to Keep as Single Skill

- All steps share the same trigger context
- Steps must run in strict sequence
- No clear separation of concerns
- Splitting would require complex data passing

---

## ERROR HANDLING

| Error | Response |
|-------|----------|
| User can't articulate triggers | Suggest based on task description, confirm |
| Skill domain overlaps another | Add explicit "NOT for" in description |
| Too complex for single skill | Break into multiple skills that chain |
| Script fails during test | Fix before delivery, document in skill-log |
| User reports issue after delivery | Update skill-log, fix skill.md, re-validate |

---

## QUICK REFERENCE

### Init New Skill
```bash
/Users/troybrave/.claude/skills/skill-creator/scripts/init-skill.cjs {name}
```

### Validate Skill
```bash
/Users/troybrave/.claude/skills/skill-creator/scripts/validate-skill.cjs {name}
```

### Skill Location
```
/Users/troybrave/.claude/skills/
```

### Skill Log Location
```
/Users/troybrave/.claude/skills/{skill-name}/skill-log.md
```
