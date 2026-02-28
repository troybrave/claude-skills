# Skill Examples Reference

Real examples from existing skills demonstrating best practices.

---

## Example 1: transcript-processor (Complex Multi-Step Workflow)

### Description (Good)
```yaml
description: Downloads transcripts from Zoom/Google Drive, renames them intelligently based on content, organizes into appropriate folders, and generates Fireflies-style summaries. Use when syncing meeting recordings, organizing transcripts, or processing meetings.
```

**Why it works:**
- Specific actions (downloads, renames, organizes, generates)
- Specific triggers (syncing recordings, organizing transcripts, processing meetings)
- Clear scope (Zoom/Google Drive)

### Structure Pattern
- Mandatory workflow table (step-by-step with numbers)
- Folder structure quick reference
- Per-step details with exact commands
- Classification logic for routing decisions
- Success criteria checklist

### Key Technique: Workflow Table
```markdown
## Workflow - EXECUTE ALL STEPS

| Step | Action | Details |
|------|--------|---------|
| 1 | **Sync from Zoom** | Downloads VTT, MP4, creates transcript.md |
| 2 | **Generate Summary** | Writes summary.md |
| 3 | **Create Notion Tasks** | Tasks for Troy/Matt from action items |

**DO NOT SKIP ANY STEPS**
```

### Key Technique: Classification Routing
```markdown
## Classify Recording

| Category | Detection Signals |
|----------|-------------------|
| **Personal** | Solo recording, family, casual |
| **Ministry** | Testimony, prayer, church |
| **Business** | Client names, project discussion |
```

---

## Example 2: session-files (Multiple Modes)

### Description (Good)
```yaml
description: Checkpoint (mid-work handoff) and End Session (wrap-up) with 100% context retention via raw transcript backup. Integrates with Obsidian vault using wikilinks.
```

**Why it works:**
- Two modes clearly named (Checkpoint, End Session)
- Purpose stated (context retention, handoff, wrap-up)
- Integration noted (Obsidian, wikilinks)

### Structure Pattern
- Trigger table mapping phrases to modes
- Step-by-step execution flow
- Separate templates for each mode
- Quality checklist with audit scoring
- Resume flow for loading saved sessions

### Key Technique: Trigger Table
```markdown
| Trigger | Mode | When to Use |
|---------|------|-------------|
| `checkpoint` | Checkpoint | Context long, mid-task |
| `save state` | Checkpoint | Same |
| `end session` | Session Log | Done working |
| `wrap up` | Session Log | Same |
```

### Key Technique: Templates
```markdown
## CHECKPOINT Template

---
type: checkpoint
created: YYYY-MM-DD
project: {project}
status: in_progress
resume_command: "{CLAUDE-ACTIONABLE instruction}"
---

# Checkpoint: {Project} - {Brief Description}

## Current Task
{What we're actively doing}

## Next Action
{EXACT next step - must be CLAUDE-ACTIONABLE}
```

---

## Example 3: obsidian-optimizer (Transformation with Quality Checks)

### Description (Good)
```yaml
description: Optimizes markdown for Obsidian with NLT/AMP scriptures, visual hierarchy, and 100% information retention.
```

**Why it works:**
- Action verb (Optimizes)
- Target (markdown for Obsidian)
- Key features (scriptures, hierarchy, retention)

### Structure Pattern
- The Oath (non-negotiable rules)
- Quick reference tables (hierarchy, whitespace)
- Detection patterns
- Content type handling table
- Before/After example
- Execution checklist

### Key Technique: The Oath
```markdown
## The Oath

1. **NEVER** delete information - restructure, don't remove
2. **NEVER** fabricate content - only clarify what exists
3. **ALWAYS** verify scriptures - fetch real text via API
```

### Key Technique: Before/After Example
```markdown
### Before

Gal 6
People get anxious in sowing. DZECEMBER is throwaway month

### After

---
date: 2025-11-30
type: sermon-notes
speaker: "[[Dr. Rodney Howard-Browne]]"
---

# Sowing & Reaping

## Key Scriptures

### Galatians 6:7-9
> Don't be misled—you cannot mock the justice of God...

## Notes
- People get anxious in sowing and reaping
- **December is NOT a throwaway month**
```

---

## Description Patterns

### Pattern 1: Action + Target + Triggers
```yaml
description: {Verb} {what} for {context}. Use when user says "{phrase 1}", "{phrase 2}", "{phrase 3}".
```

### Pattern 2: Feature List + Triggers
```yaml
description: {Feature 1}, {feature 2}, and {feature 3} for {domain}. Use when {trigger situations}.
```

### Pattern 3: Mode-Based
```yaml
description: {Mode 1} ({purpose}) and {Mode 2} ({purpose}) with {key feature}. Use when {triggers}.
```

### Pattern 4: With Exclusions
```yaml
description: {Action} {what}. Use when user says "{triggers}". NOT for {non-triggers}.
```

---

## Common Mistakes to Avoid

### Mistake 1: Vague Description
```yaml
# BAD
description: Helps with documents

# GOOD
description: Create and edit .docx files. Use when user says "create Word doc", "edit document", "make a docx". NOT for PDFs or Google Docs.
```

### Mistake 2: Body Explains Basics
```markdown
# BAD
## What is a PDF?
A PDF (Portable Document Format) is a file format...

# GOOD
## Filling PDF Forms
1. Run `scripts/analyze_form.py <input.pdf>`
2. Map user data to `fields.json`
3. Run `scripts/fill_form.py <input.pdf> <fields.json> <output.pdf>`
```

### Mistake 3: Duplicate Information
```markdown
# BAD - Same info in skill.md AND references/

# GOOD - Detailed info ONLY in references, skill.md says:
**Reference:** For complete API spec, read `references/api.md`
```

### Mistake 4: Triggers in Body
```markdown
# BAD
---
description: Processes meetings
---
## When to Use
Use this skill when you want to process meetings...

# GOOD
---
description: Processes meetings. Use when user says "process meeting", "sync Zoom", "organize transcript".
---
## Workflow
1. Sync from Zoom...
```

### Mistake 5: Passive Voice
```markdown
# BAD
The file should be read first, then it can be processed...

# GOOD
Read the file. Process the contents. Save the output.
```

---

## Skill Chaining Example

From transcript-processor - invoking meeting-summary skill:

```markdown
## Step 2: Generate Summary

Invoke the `meeting-summary` skill to generate `summary.md` from `transcript.md`.

The skill provides:
- Evidence-anchored decisions and action items
- Meeting type detection
- Quality gate checklist
```

This shows how one skill can reference another without duplicating logic.

---

## Quality Indicators

### Signs of a Good Skill
- Description fits in ~50 words
- Body is <500 lines
- Every section has clear purpose
- Commands are copy-paste ready
- Error handling covers likely failures
- Has concrete examples, not just explanations

### Signs of a Bad Skill
- Description is vague or >100 words
- Body explains things Claude already knows
- Duplicate info across files
- Relative paths instead of absolute
- No error handling
- All theory, no examples
