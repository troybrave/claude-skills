---
name: video-copywriter
description: Transform lesson briefs into production-ready video scripts. Use when user says "write video script", "script my video", "video copywriter", "/video-copywriter". Outputs teleprompter script, editor cut sheet, full annotated script, and quality report.
allowed-tools: Read, Write, Edit, Glob, Grep, AskUserQuestion
---

# Video Copywriter

Transforms lesson briefs into production-ready video scripts using proven retention frameworks and creator voice DNA. Every script aims for zero rambling, maximum retention, and production-ready output.

---

## KNOWN FAILURE MODES (READ FIRST)

| Failure | What Would Happen | Prevention |
|---------|-------------------|------------|
| **Skipped brief validation** | Wrote script for vague/bloated brief | PHASE 0 validates ALL required elements before proceeding |
| **Multiple objectives bloat** | Script tried to teach too much, rambled | Extract ONE big idea, demote others to examples ONLY |
| **Word budget violation** | Sections ran long, viewer drop-off | STRICT word limits per section, flag >20% overages |
| **Open loops never closed** | Viewer frustration, broken promises | Track ALL loops, require closure before CTA |
| **Hook too long** | Lost viewers in first 15 seconds | HARD GATE: Hook ≤ 75 words (YouTube: ≤ 60) |
| **Promise delivered late** | Viewers left before payoff | HARD GATE: Deliver title promise by 2:00 (YouTube: 1:00) |
| **Over-optimization** | Added unnecessary metaphors, softened blunt clarity | Anti-Over-Optimization Rule enforced |
| **Voice drift** | Inconsistent tone throughout | Dynamic voice application (Hormozi/Ali by moment type) |
| **No examples** | Abstract teaching, no retention | GATE: Every teaching section ≥ 1 concrete example |
| **Specificity < 6** | Vague, forgettable content | Score each section, auto-rewrite if < 6 |

---

## DECISION PRECEDENCE RULES (NON-NEGOTIABLE)

When inputs conflict, resolve in this EXACT order:

1. **Lesson brief overrides all** - If brief says 5 minutes, don't write 10
2. **Platform rules override voice preferences** - YouTube first-30-seconds rule trumps stylistic choices
3. **Retention architecture overrides stylistic flourishes** - Re-hook placement > clever wordplay
4. **Word budgets override rhetorical elegance** - Cut the beautiful sentence if it's over budget
5. **Clarity overrides cleverness** - Simple > Smart
6. **Hook promise overrides personal anecdotes** - Deliver what you promised before sharing stories

**If any rule is violated, rewrite until compliant, even if perceived quality temporarily drops.**

---

## ANTI-OVER-OPTIMIZATION RULE

**DO NOT:**
- Add extra metaphors beyond what's needed
- Increase emotional language past required energy level
- Smooth sharp statements into softer versions
- Balance opposing viewpoints unless brief requires it
- Add qualifiers to confident statements
- "Polish" blunt clarity into vague pleasantness

**If something is blunt but clear, LEAVE IT.**

---

## Execution Mode (NON-NEGOTIABLE)

This skill operates in ONE of two modes. Determine at session start:

| Mode | When to Use | Behavior |
|------|-------------|----------|
| **STRICT** | User provides complete brief, wants hands-off execution | No questions mid-run. Infer missing elements. Flag uncertainties in Quality Report only. |
| **INTERACTIVE** | User wants to collaborate, brief may be incomplete | Ask clarifying questions. Wait for answers. Pause at decision points. |

**Detection Rules:**
- If user says "just run it", "do your thing", "hands off" → STRICT mode
- If user provides incomplete brief → INTERACTIVE mode (ask what's missing)
- If user doesn't specify → Default to INTERACTIVE mode
- If user answers a question with "you decide" or "your call" → Switch to STRICT for remainder

**Mode Lock:** Once determined, do NOT switch modes mid-session unless user explicitly requests it.

---

## Pre-Flight

**Before every run:**
1. Read `/Users/troybrave/.claude/skills/video-copywriter/skill-log.md` (if exists) to learn from past runs
2. Read `/Users/troybrave/.claude/skills/video-copywriter/references/Copywriter-Video-Structure-Reference.md` to load frameworks

---

## File IO Contract (NON-NEGOTIABLE)

### Path Handling

| Path Type | Treatment |
|-----------|-----------|
| Starts with `/` | Absolute path - use as-is |
| Starts with `./` | Relative to current working directory |
| Starts with `~/` | Expand to user home directory |
| No prefix | Treat as relative to current working directory |

### Read Rules

**Lesson Brief:**
- If path is missing/unreadable → **HARD FAIL** with single error message and STOP
- Do not attempt to search for the file
- Do not suggest alternative paths

**Reference File (Copywriter-Video-Structure-Reference.md):**
- If missing/unreadable:
  - Continue using built-in frameworks already embedded in skill.md
  - Add `REFERENCE FILE MISSING` banner in Quality Report
  - Do NOT hallucinate "Section X says..." quotes
  - Do NOT invent framework content

### Write Rules

**Output Directory:**
```
<lesson-brief-directory>/__generated__/video-copywriter/
```
- Create directory if it doesn't exist
- If directory creation fails → HARD FAIL with error message

**Output Filenames:**
```
<brief-basename>-Teleprompter.md
<brief-basename>-Editor-Cut-Sheet.md
<brief-basename>-Full-Script.md
<brief-basename>-Quality-Report.md
```

Example: If brief is `M1-L1-What-AI-Actually-Is.md`, outputs are:
```
M1-L1-What-AI-Actually-Is-Teleprompter.md
M1-L1-What-AI-Actually-Is-Editor-Cut-Sheet.md
M1-L1-What-AI-Actually-Is-Full-Script.md
M1-L1-What-AI-Actually-Is-Quality-Report.md
```

**Overwrite Behavior:**
- If `overwrite=true` → overwrite existing files silently
- If `overwrite=false` (default) → append version suffix:
  - `-v2`, `-v3`, etc.
  - Find highest existing version and increment

### Traceability Header

Every output file MUST include this header at the top:

```markdown
---
source_brief: <absolute path to lesson brief>
generated_at: <ISO 8601 timestamp>
mode: <strict|interactive>
platform: <youtube|course>
voice_style: <hormozi|ali-abdaal|balanced>
duration_target: <X-Y minutes>
skill_version: 2.0
---
```

---

## Workflow

### PHASE 0: Brief Validation (BLOCKING)

**Check brief has ALL required elements:**

| Element | Required | If Missing |
|---------|----------|------------|
| Learning objectives | YES (at least 1) | ASK user to provide |
| Target audience/student profile | YES | ASK user to provide |
| Key talking points | YES (at least 2) | ASK user to provide |
| Duration target | YES | ASK user to provide |
| Emotional journey (start → end state) | RECOMMENDED | Infer with disclaimer |

**Validation Actions:**
- If missing required elements → Ask user to provide (preferred)
- If user can't provide → Infer with explicit disclaimer in Quality Report
- Validate duration is achievable for content volume
- If duration impossible → Flag as CONTENT GAP

**Proceed only when brief passes validation.**

### PHASE 1: Input Gathering

Use AskUserQuestion for any inputs not in the brief:

```
1. Lesson brief file path (REQUIRED)
   - Path to lesson brief markdown

2. Creator voice style (default: balanced)
   - hormozi (direct, punchy, no-fluff)
   - ali-abdaal (warm, patient, conversational)
   - balanced (dynamic per moment)

3. Platform (default: course)
   - youtube (stricter retention rules)
   - course (standard retention)

4. Hook style (optional)
   - controversy
   - story
   - question
   - stat

5. Title/Thumbnail text (optional)
   - To verify script delivers on promise

6. Target duration override (optional)
   - Overrides duration in brief

7. Previous lesson CTA (optional)
   - For continuity/callbacks
```

### PHASE 2: Analysis

After reading the brief:

1. **Parse lesson brief** - Extract all elements
2. **Detect audience temperature** - skeptic / neutral / enthusiast
3. **Identify content type** - teaching / myth-busting / how-to / story
4. **Extract ONE big idea** - Discard secondary themes (log in Kill Your Darlings)
5. **Map emotional journey** - From brief or inferred
6. **Calculate word budgets** - Based on duration

**Word Budget Calculation:**
```
Speaking rate: 130 words/minute
Total words = Duration (minutes) × 130

Allocate:
- Hook: 50-75 words (STRICT)
- Setup: 100-150 words
- Teaching points: 150-200 words each
- Transitions: 15-25 words (STRICT)
- CTA: 75-100 words
```

### PHASE 3: Strategic Planning

1. **Select hook formula** based on content type:

| Content Type | Best Hook Formula |
|--------------|-------------------|
| Teaching new concept | Curiosity Gap |
| Myth-busting | Controversy |
| How-to/Tutorial | Result Promise |
| Story-based | Story Hook |
| Problem-solving | Problem Agitation |

2. **Plan retention architecture** - Re-hooks at calculated drop points
3. **Map energy arc** - Hook(9) → Setup(6) → Teaching(5→7) → Demo(8) → CTA(9)
4. **Identify open loop opportunities** - Max 3 simultaneous
5. **Plan WIIFM callbacks** - Every 60-90 seconds
6. **Select transitions** from approved bank

### PHASE 4: Script Generation

Write each section with:

1. **Hook (0:00-0:15)**
   - Word limit: 50-75 (YouTube: ≤60)
   - Energy: HIGH (9/10)
   - Voice: Hormozi (punchy, direct)
   - Include: Curiosity gap, emotional trigger, relevance signal

2. **Setup (0:15-0:45)**
   - Word limit: 100-150
   - Energy: MEDIUM (6/10)
   - Voice: Hormozi (agitate problem)
   - Include: Why this matters to YOU

3. **RE-HOOK #1 (0:30-0:45)**
   - Pattern interrupt + open loop

4. **Teaching Sections**
   - Word limit: 150-200 each
   - Energy: RISING (5→7)
   - Voice: Ali Abdaal (warm, patient)
   - Include: ≥1 concrete example per section
   - Include: WIIFM callback every 60-90 seconds

5. **RE-HOOKS throughout**
   - At 2:00, 3:30, 5:00, 6:30 marks
   - Different types: payoff+new loop, unexpected angle, energy spike, callback

6. **Resolution (near end)**
   - Close ALL open loops
   - Energy: MEDIUM-HIGH (7/10)

7. **CTA (final 30-60 seconds)**
   - Word limit: 75-100
   - Energy: HIGH (9/10)
   - Voice: Hormozi (direct command)
   - Include: Clear next step, urgency

**During Generation:**
- Track open loops (opened at → closes at)
- Score specificity (1-10) per section
- Flag ramble triggers
- Apply voice DNA dynamically

### PHASE 5: Quality Gates (BLOCKING)

**ALL gates must pass before output:**

| Gate | Condition | Platform Adjustment |
|------|-----------|---------------------|
| Hook length | ≤ 75 words | YouTube: ≤ 60 words |
| Promise delivery | By ≤ 2:00 | YouTube: By ≤ 1:00 |
| Open loops | ≤ 3 simultaneous | Same |
| Loop closure | All closed before CTA | Same |
| Examples | ≥ 1 per teaching section | Same |
| Word budget | No section >20% over | YouTube: >10% over |
| Specificity | All sections ≥ 6 | Same |

**Gate Failure Protocol:**
```
IF gate fails:
  1. Identify specific failure
  2. Rewrite offending section (ONE attempt)
  3. Re-check gate
  4. IF still failing:
     - Output files WITH FAILURE NOTICE at top
     - Quality Report explains what failed and why
     - User can override or request manual fix
```

### Deterministic Gate Repair Order (NON-NEGOTIABLE)

When multiple gates fail, repair in this EXACT order and re-check after each repair:

| Priority | Gate | Repair Action |
|----------|------|---------------|
| 1 | Hook length | Trim to word limit, preserve core promise |
| 2 | Promise delivery timing | Move payoff earlier, cut preamble |
| 3 | Section word budgets | Cut lowest-value sentences first |
| 4 | Open loop max | Close earliest loop or remove weakest |
| 5 | Loop closure | Add closure before CTA |
| 6 | Concrete examples | Add one specific example per section |
| 7 | Specificity ≥ 6 | Replace abstractions with concrete details |

### Repair Rules

- **Minimum edit principle:** Only modify the minimum text needed to pass the current gate
- **Freeze unaffected sections:** Do not rewrite sections that aren't causing the gate failure
- **Cascade check:** After each repair, verify previously-passed gates still pass
- **Revert on cascade failure:** If a repair causes a previously-passed gate to fail, revert that repair and choose a simpler edit
- **One attempt per gate:** If a gate still fails after one repair attempt, mark as FAILED and continue to next gate

### PHASE 6: Viewer Advocate Critique (Internal)

Before finalizing, answer these questions:

1. **"Where would I get bored?"** → Add energy or cut
2. **"Where would I skip ahead?"** → Tighten or add hook
3. **"What feels obvious or predictable?"** → Add unexpected angle
4. **"What promise feels under-delivered?"** → Strengthen payoff

**Constraints:**
- Maximum 1 edit per critique finding
- Edits must not violate word budgets
- After edits, script is FROZEN

### PHASE 7: Cold Viewer Simulation

1. Rewrite hook as if viewer:
   - Clicked accidentally
   - Has zero context
   - Is about to click away

2. Compare original vs cold-viewer hook

3. Decision rule:
   - If cold hook is stronger → replace original
   - If original is stronger → keep original
   - "Stronger" = more immediate value/curiosity in fewer words

### PHASE 8: Multi-Format Output

Generate 4 files:

---

## Output Format

### 1. Teleprompter Script (`{lesson-id}-Teleprompter.md`)

Clean, large text, pause markers only:

```markdown
# {Lesson Title} - Teleprompter

---

{Hook - word for word, no notes}

[PAUSE]

{Setup - word for word}

[BREATHE]

{Teaching Section 1}

[PAUSE]

...

{CTA}

---
```

**Rules:**
- NO production notes
- NO b-roll markers
- ONLY `[PAUSE]` and `[BREATHE]` markers
- Just what to say

### 2. Editor Cut Sheet (`{lesson-id}-Cut-Sheet.md`)

```markdown
# {Lesson Title} - Editor Cut Sheet

## Timeline Overview

| Timestamp | Section | Duration | Energy | Notes |
|-----------|---------|----------|--------|-------|
| 0:00-0:15 | Hook | 15s | HIGH | Jump cut on "..." |
| ... | ... | ... | ... | ... |

---

## B-Roll List

| Timestamp | Description | Duration | Source Notes |
|-----------|-------------|----------|--------------|
| 0:23 | Screen recording of X | 5s | Record fresh |
| ... | ... | ... | ... |

---

## Transition Notes

| At | Type | Description |
|----|------|-------------|
| 0:45 | Jump cut | Quick energy boost |
| 2:00 | B-roll overlay | While explaining X |
| ... | ... | ... |

---

## Energy Markers

```
     Hook    Setup   Teach    Demo    CTA
      ▮▮▮▮▮▮▮▮▮  ▮▮▮▮▮▮  ▮▮▮▮▮▮▮  ▮▮▮▮▮▮▮▮  ▮▮▮▮▮▮▮▮▮
      9/10      6/10    5→7/10   8/10     9/10
```

---

## Cut Guidance

- Cut all pauses > 0.5s
- Remove filler words
- Jump cut mid-sentence at [timestamps] for energy
- Maintain eye contact with camera (crop if needed)
```

### 3. Full Annotated Script (`{lesson-id}-Full-Script.md`)

```markdown
# {Lesson Title} - Full Annotated Script

**Total Duration:** X minutes
**Word Count:** X words
**Platform:** YouTube/Course

---

## HOOK (0:00-0:15) [X words]
**Energy: HIGH (9/10) | Voice: Hormozi**

{Word-for-word script}

[PATTERN INTERRUPT: Quick zoom on "X"]
[B-ROLL: Screen showing Y]

**Rationale:** Opens with curiosity gap, creates information gap about...

---

## SETUP (0:15-0:45) [X words]
**Energy: MEDIUM (6/10) | Voice: Hormozi**

{Word-for-word script}

[CUT TO: Tighter frame]
[B-ROLL: Example of problem]

**Rationale:** Agitates problem, establishes WIIFM...

---

## RE-HOOK #1 (0:30)
**Type: Pattern Interrupt + Open Loop**

{Script}

[OPEN LOOP: "Why X doesn't work" → closes at 5:30]

---

## TEACHING SECTION 1: {Title} (0:45-2:00) [X words]
**Energy: RISING (5→6/10) | Voice: Ali Abdaal**
**Specificity Score: 7/10**

{Word-for-word script}

[B-ROLL: Demo of concept]
[EXAMPLE: {Concrete example}]
[WIIFM CALLBACK: "This means you can now..."]

**Rationale:** First teaching point, builds foundation...

---

... (continue for all sections) ...

---

## CTA (X:XX-end) [X words]
**Energy: HIGH (9/10) | Voice: Hormozi**

{Word-for-word script}

[ALL LOOPS CLOSED: ✓]

**Rationale:** Direct action, clear next step...

---

## OPEN LOOP TRACKING

| Timestamp | Loop Opened | Closes At | Status |
|-----------|-------------|-----------|--------|
| 0:30 | "Why X doesn't work" | 5:30 | ✓ Closed |
| 2:00 | "The one thing that changes everything" | 6:00 | ✓ Closed |
| ... | ... | ... | ... |

**Max Simultaneous:** 2 (GATE PASSED)

---
```

### 4. Quality Report (`{lesson-id}-Quality-Report.md`)

```markdown
# {Lesson Title} - Quality Report

**Generated:** {date}
**Platform:** {youtube/course}
**Voice Style:** {hormozi/ali-abdaal/balanced}

---

## Gate Status

| Gate | Condition | Result | Status |
|------|-----------|--------|--------|
| Hook length | ≤ 75 words | X words | ✓ PASS |
| Promise delivery | By ≤ 2:00 | Delivered at X:XX | ✓ PASS |
| Open loops | ≤ 3 simultaneous | Max 2 | ✓ PASS |
| Loop closure | All closed before CTA | 3/3 closed | ✓ PASS |
| Examples | ≥ 1 per teaching section | 4/4 sections | ✓ PASS |
| Word budget | No section >20% over | Max 15% over | ✓ PASS |
| Specificity | All sections ≥ 6 | Min score: 6 | ✓ PASS |

**OVERALL:** ✓ ALL GATES PASSED

---

## Word Count Analysis

| Section | Budget | Actual | Variance | Status |
|---------|--------|--------|----------|--------|
| Hook | 50-75 | X | +X% | ✓ |
| Setup | 100-150 | X | +X% | ✓ |
| Teaching 1 | 150-200 | X | +X% | ✓ |
| ... | ... | ... | ... | ... |
| CTA | 75-100 | X | +X% | ✓ |
| **TOTAL** | **X** | **X** | **+X%** | **✓** |

---

## Specificity Scores

| Section | Score | Notes |
|---------|-------|-------|
| Hook | 8/10 | Specific number, concrete outcome |
| Setup | 7/10 | Clear problem statement |
| Teaching 1 | 6/10 | Example included, could be more vivid |
| ... | ... | ... |

**Minimum Score:** 6/10 (GATE PASSED)

---

## Estimated Retention Curve

```
Retention %
100│▮▮▮▮▮
 90│    ▮▮▮▮
 80│        ▮▮▮▮▮▮▮▮▮▮▮
 70│                   ▮▮▮▮▮▮▮▮▮▮
 60│                             ▮▮▮▮▮
   └──────────────────────────────────────
     Hook  Setup  Teach  Demo  Resolve CTA
```

**Key Drop Points Addressed:**
- 0:30 - RE-HOOK #1 (pattern interrupt)
- 2:00 - RE-HOOK #2 (payoff + new loop)
- 3:30 - RE-HOOK #3 (unexpected angle)
- 5:00 - RE-HOOK #4 (energy spike)

---

## Kill Your Darlings Log

| Section | Content Cut | Words | Reason |
|---------|-------------|-------|--------|
| {Section} | "{Cut content...}" | X | {Why it was cut} |
| ... | ... | ... | ... |

---

## Pattern Intelligence

**Ramble Triggers Hit:** X
- {Section}: {Trigger type} (fixed)
- ...

**Voice Drift Detected:** X
- {Section}: {Drift description} (corrected)
- ...

**Specificity Gaps:** X
- {Section}: Initially scored X (improved to Y)
- ...

**Recommendations for Future Briefs:**
- {Actionable improvement}
- ...

---

## Viewer Advocate Critique Results

| Question | Finding | Edit Made |
|----------|---------|-----------|
| "Where would I get bored?" | {Finding or "None"} | {Edit or "N/A"} |
| "Where would I skip ahead?" | {Finding or "None"} | {Edit or "N/A"} |
| "What feels obvious?" | {Finding or "None"} | {Edit or "N/A"} |
| "What promise under-delivered?" | {Finding or "None"} | {Edit or "N/A"} |

---

## Cold Viewer Simulation

**Original Hook:**
"{Original hook text}"

**Cold Viewer Hook:**
"{Cold viewer rewrite}"

**Decision:** {Kept original / Replaced with cold hook}
**Reason:** {Why}

---
```

---

## Ramble Detection Triggers

Flag and fix if detected:

- [ ] Section >20% over word budget
- [ ] >2 consecutive sentences without concrete example
- [ ] Any paragraph without "you" or "your"
- [ ] Passive voice clusters (3+ passive constructions)
- [ ] Qualifier stacking ("kind of", "sort of", "maybe", "I think")
- [ ] Filler phrases ("to be honest", "at the end of the day", "basically")
- [ ] Redundant restatements (same point in different words)

**Output Format for Ramble Warnings:**
```
[RAMBLE WARNING: This section is X words over budget.
Cut candidate: "..." (X words)
Reason: {Why this doesn't add value}]
```

---

## Voice DNA Application

Apply different voices for different moments:

| Script Moment | Voice | Why |
|---------------|-------|-----|
| Hook | Hormozi | Punchy, direct, grabs attention |
| Problem setup | Hormozi | Agitate the problem, no fluff |
| Teaching/explaining | Ali Abdaal | Warm, patient, "here's how I think about it" |
| Personal story | Ali Abdaal | Vulnerable, conversational |
| Key insight | Hormozi | Declarative, quotable, memorable |
| Demo walkthrough | Ali Abdaal | Calm, clear, step-by-step |
| Transitions | Hormozi | Fast, forward momentum |
| CTA | Hormozi | Direct command, urgency |

---

## Retention Architecture (8-10 minute video)

```
0:00-0:10  → HOOK (highest energy, promise)
0:10-0:30  → Setup (why this matters to YOU)
0:30-0:45  → RE-HOOK #1 (pattern interrupt, open loop)
2:00       → RE-HOOK #2 (payoff something, open new loop)
3:30       → RE-HOOK #3 (unexpected angle, "but here's the thing...")
5:00       → RE-HOOK #4 (mid-point energy spike, demo or story)
6:30       → RE-HOOK #5 (callback to hook promise)
8:00       → Resolution (close all loops)
8:30-end   → CTA (energy spike, clear next step)
```

**Platform-Specific Adjustments:**

| Timing | YouTube | Course |
|--------|---------|--------|
| First re-hook | 15-20 seconds | 30-45 seconds |
| Promise delivery | By 1:00 | By 2:00 |
| Hook word limit | 60 words | 75 words |
| Section word budget | No section >10% over | No section >20% over |

---

## Transition Bank

**APPROVED (use these):**

High-Energy (Hormozi):
- "Here's where it gets interesting."
- "But that's not even the best part."
- "Now watch what happens when..."
- "This is the part most people miss."
- "Let me show you what I mean."

Teaching (Ali):
- "So here's how I think about this..."
- "Let me break this down simply."
- "The way I explain this to beginners is..."
- "Think of it like this..."
- "Here's a quick example."

**BANNED (never use):**
- "Now let's talk about..."
- "Moving on to..."
- "Next, we'll cover..."
- "Another thing is..."
- "Additionally..."
- "Furthermore..."
- "In conclusion..."

---

## WIIFM Callbacks

Insert every 60-90 seconds:

- "Here's why this matters for you..."
- "This means you can now..."
- "So when you're [doing their task], you'll..."
- "The result? You'll never have to..."
- "This saves you [time/money/frustration] because..."

---

## Failure Mode Handling

### If Lesson Brief is Vague or Bloated

```
Action:
├── Infer ONE big idea from available content
├── Explicitly discard secondary themes
├── Report discarded themes in Quality Report (Kill Your Darlings Log)
└── Flag as "INFERRED - USER REVIEW RECOMMENDED"
```

### If Lesson Brief Has Multiple Objectives

```
Action:
├── Choose primary objective (first listed, or most specific)
├── Convert others into examples or demos ONLY
├── Flag consolidation in Quality Report
└── List demoted objectives for user awareness
```

### If Target Duration is Impossible for Content

```
Action:
├── Calculate minimum viable duration for content
├── If brief duration < minimum:
│   ├── Compress teaching points (combine similar)
│   ├── Preserve hook + payoff integrity (non-negotiable)
│   └── Warn user of compression tradeoffs
├── If brief duration > content warrants:
│   ├── Flag as "CONTENT GAP"
│   └── Suggest additional content areas (don't invent)
```

### If Specificity Score < 6 After First Pass

```
Action:
├── Auto-rewrite section once with more concrete examples
├── If still < 6:
│   ├── Flag as "CONTENT GAP - NEEDS USER INPUT"
│   └── Do NOT invent specific examples (hallucination risk)
```

---

## Skill Log Integration

After every session, update `/Users/troybrave/.claude/skills/video-copywriter/skill-log.md`:

```markdown
### {date} - {Lesson Title}

**Platform:** {youtube/course}
**Voice Style:** {style}
**Duration:** {minutes}

**Gates Passed:** {X/7}
**Specificity Min:** {score}/10

**What worked:**
- {Specific thing that worked well}

**What to improve:**
- {Lesson learned or "Clean run"}

**User feedback:**
- {Verbatim feedback if given}

**Pattern Intelligence:**
- {Any recurring issues noted}
```

---

## Error Handling

| Error | Response |
|-------|----------|
| Brief missing required elements | "The lesson brief is missing [element]. Can you provide [specific question]?" |
| Multiple competing objectives | "I found X objectives in this brief. Which ONE is the primary focus? I'll convert the others into supporting examples." |
| Duration impossible for content | "The X-minute target won't fit this content adequately. Minimum viable is Y minutes. Should I: (a) compress with tradeoffs noted, or (b) adjust duration target?" |
| No examples in brief | "The teaching points are abstract. Can you provide 1-2 concrete examples for [point]? Otherwise I'll flag this as a content gap." |
| Vague audience definition | "Who specifically is watching this? Role, experience level, and what they're hoping to achieve?" |
| Request for over-optimization | "I've written this to be clear and direct. Adding more [metaphors/softening/qualifiers] would reduce clarity. The current version is intentionally blunt. Proceed?" |

---

## Reference Files

**MUST READ before generating:**
- `/Users/troybrave/.claude/skills/video-copywriter/references/Copywriter-Video-Structure-Reference.md`

**Use sections:**
- Section 1: HIVES Framework
- Section 4: MrBeast 1-Second Rule
- Section 10: Hormozi Voice DNA
- Section 11: Ali Abdaal Voice DNA
- Section 14: 15 Hook Formulas
- Section 15: Pattern Interrupts
- Section 17: Conversational Techniques

---

## Success Criteria

A 100/100 script has:

1. **Zero rambling** - Every section within word budget or flagged with cut suggestions
2. **Retention optimized** - Re-hooks at all calculated drop points
3. **Voice authenticity** - Sounds natural, not robotic or formulaic
4. **Production ready** - Editor can work directly from cut sheet
5. **Measurable quality** - Specificity scores, loop tracking, energy mapping
6. **Anti-ramble protection** - Clear cut suggestions for overages
7. **Platform optimized** - Different strategies for YouTube vs course
8. **Promise fulfilled** - Title/hook promise delivered by minute 2 (or 1 for YouTube)
9. **One clear takeaway** - Viewer knows exactly what they learned
10. **Actionable CTA** - Clear, compelling next step
11. **Deterministic** - Same inputs produce consistent quality outputs
12. **Failure-aware** - Graceful handling of messy briefs with clear reporting
