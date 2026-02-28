# Complete Example: Creating the skill-creator Skill

This is a real example from the conversation that created this very skill.

---

## User Request

> "I want you to create a skill that is a skill-creating skill."

User also provided a detailed prompt with architecture guidance about 3 layers (description, body, resources).

---

## Discovery Phase

### Questions Asked (All at Once)

1. "What exact user phrases should trigger this skill?"
2. "What similar requests should NOT trigger this skill?"
3. "Walk me through doing this task manually—what steps do you repeat every time?"

### User Answers

**Triggers:**
- "create a skill"
- "make a skill"
- "build a skill"
- "new skill for"
- No other variations needed - user is specific

**Non-triggers:**
- Slash commands (different from skills)
- Standalone scripts (one-off code)
- MCP servers

**Manual workflow:**
- User doesn't create skills manually - always uses AI
- AI should ask questions before building
- Skills should be reliable from day one, no QA battles

---

## Follow-Up Discovery (Round 2)

### Questions Asked

1. "What makes a good skill vs bad skill?"
2. "What information do you typically provide when requesting?"
3. "How do you test skills after creation?"

### User Answers

**Good vs bad:**
- User doesn't know - that's Claude's expertise
- Must be reliable, work flawlessly
- Should have self-healing capability

**Testing:**
- User tries to use it immediately
- Skill should evaluate itself and gather feedback
- After several clean runs, stop asking for feedback

---

## Follow-Up Discovery (Round 3)

### Questions Asked

1. "For mandatory discovery - what's the right balance of questions?"
2. "For self-healing feedback - what should it look like?"

### User Answers

**Discovery balance:**
- 3-7 questions
- Can ask all at once
- Important to get it right

**Feedback loop:**
- Ask at END of session (context is fresh)
- "What could be better? What didn't work?"
- After 3-5 clean runs with no issues, stop asking
- Each skill should have a learning log

---

## Final Architecture Confirmed

| Component | Purpose |
|-----------|---------|
| Mandatory Discovery | 3-7 questions upfront |
| skill.md | Main definition |
| skill-log.md | Learning log - read BEFORE running |
| Feedback Loop | Ask at end of session |
| Auto-Quiet | Stop asking after 4 clean runs |

---

## Resulting Skill Structure

```
skill-creator/
├── skill.md              # 428 lines
├── skill-log.md          # Learning log
├── skill-log-template.md # Template for new skills
├── scripts/
│   ├── init-skill.cjs    # Scaffolds new skills
│   └── validate-skill.cjs # Pre-delivery validation
├── references/
│   ├── skill-examples.md # Patterns from existing skills
│   └── complete-example.md # This file
└── assets/               # Empty for now
```

---

## Resulting Description

```yaml
description: Creates Claude Code skills - modular packages that extend Claude's capabilities. Use when user says "create a skill", "make a skill", "build a skill", or "new skill for". NOT for slash commands, standalone scripts, or MCP servers.
```

**Why it works:**
- 37 words (under 50 limit)
- Starts with action verb "Creates"
- Lists all 4 trigger phrases
- Explicitly excludes non-triggers with "NOT for"

---

## Key Decisions Made During Creation

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Discovery questions | 3-7 upfront, all at once | User's preference - get it right |
| Feedback timing | End of session | Context is fresh |
| Auto-quiet threshold | 4 clean runs | Balance between learning and annoyance |
| Default freedom level | Low (prescriptive) | Reliability over flexibility |
| Self-testing | QA Agent preferred | More thorough than self-simulation |

---

## QA Results

QA Agent rated initial version **8.2/10** with these gaps:
1. Missing skill chaining error handling → Fixed
2. No pre-flight checklist → Fixed
3. No complexity decision criteria → Fixed

After fixes, validation passed **100%**.

---

## Iteration Example

After initial delivery, self-review found:
- Rating: 92/100
- Missing: Complete before/after example
- Missing: Explicit end-of-session feedback enforcement

Both addressed in subsequent updates.

---

## Lessons Learned

1. **Discovery is iterative** - Started with 3 questions, needed 2 more rounds
2. **User knows what they want, not how** - User knew "reliable" and "self-healing" but Claude defined the mechanism
3. **QA catches real gaps** - The QA agent found issues human review missed
4. **The skill can document its own creation** - This file proves it

---

## Template: How to Use This Example

When creating a new skill:

1. **Start with user request** - What did they actually say?
2. **Ask discovery questions** - All at once, 3-7 questions
3. **Document answers** - Triggers, non-triggers, workflow, success criteria
4. **Confirm architecture** - Table summary before building
5. **Build incrementally** - skill.md → skill-log.md → scripts → references
6. **QA test** - Spawn agent or self-simulate
7. **Fix gaps** - Address QA findings before delivery
8. **Deliver with summary** - Location, triggers, QA status
9. **Ask for feedback** - End of session, update skill-log