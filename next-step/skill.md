---
name: next-step
description: Manage per-client/org "Next Steps" files as a living action item tracker. Use when user says "next steps", "update next steps", "add next steps", "what's next for [client]", "client action items". NOT for session checkpoints (use session-files). NOT for creating Notion tasks (use task-creator).
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, AskUserQuestion, Task
---

# Next Step Skill

Maintain per-client/organization "Next Steps" markdown files as living action item trackers. Every client or org gets one file that serves as the ongoing "what we got to do next" reference.

---

## ⛔ CRITICAL RULES (READ FIRST)

| Rule | Why |
|------|-----|
| **NEVER auto-create a Next Steps file** | Always ask the user first. Wrong file location or wrong client = wasted work and confusion. |
| **NEVER guess the client** | If ambiguous, ASK. Misidentifying a client means updating the wrong file. |
| **Always search for existing file first** | Duplicates are worse than missing files. |
| **Append, don't overwrite** | Next Steps files are living documents. Add to them, never replace existing content. |

---

## Step 1: Identify Client / Organization

### Auto-Detection (try in this order)

1. **Explicit mention** — User said a client name ("next steps for Brave Life", "MxDetail action items")
2. **Current working directory** — Check `<env>` Working directory for client path
3. **Current session context** — What client/project have we been working on this session?
4. **Recent files** — What files have been created or modified this session?

### Client Reference Table

| Client / Org | Keywords | Next Steps Location |
|-------------|----------|-------------------|
| Brave Life | "brave life", "BLN", "ministry", "board meeting" | `Ministry/03 - Execution/Brave Life - Next Steps & Action Items.md` |
| Endless Winning | "endless winning", "EWA", "agency" | Business client path (see below) |
| Power Bookkeeping | "powerbooks", "clear piggy", "bookkeeping" | `Business/.../Power Bookkeeping/` area |
| MxDetail | "mxdetail", "auto spa", "detailing", "alex" | Business client path |
| Taskaroo | "taskaroo" | Business client path |
| Upper Room | "upper room" | Business client path |
| TREM | "trem" | Business client path |
| New Life Moving | "new life", "moving" | Business client path |
| Millionaire (R-HVAC) | "millionaire", "r-hvac", "hvac" | Business client path |
| Troy (Personal) | "personal", no client context | ASK — personal next steps need a location |

### Business Client Base Path
```
/Users/troybrave/Documents/Projects/Full Vault/Business/04 - Endless Winning Agency/Sub-Accounts/01 - Active/{Client}/
```

**Also check the older path:**
```
/Users/troybrave/Documents/Projects/Full Vault/Business/Endless Winning Agency/Sub-Accounts/02 Active/{Client}/
```

### If Client Cannot Be Determined

**ASK the user:**
```
I'm not sure which client or organization these next steps belong to. Who is this for?
```

Provide options from the client reference table if helpful.

---

## Step 2: Find Existing Next Steps File

Search for an existing Next Steps file for the identified client:

### Search Strategy

1. **Known location** — Check the Client Reference Table above first
2. **Glob search** — Search the client's folder tree:
   ```
   Glob: **/*Next Steps*  (in client directory)
   Glob: **/*next-step*   (in client directory)
   Glob: **/*Action Items* (in client directory)
   ```
3. **Broader search** — If not in client folder, search the vault:
   ```
   Glob: **/*{ClientName}*Next Steps*
   Glob: **/*{ClientName}*Action Items*
   ```

### If File EXISTS → Go to Step 3 (Amend)

### If File DOES NOT EXIST → Go to Step 2b (Ask to Create)

---

## Step 2b: Ask Before Creating

**⛔ MANDATORY: Never create a Next Steps file without explicit user approval.**

Ask:
```
No existing Next Steps file found for {Client Name}. Should I create one?

Proposed location: {suggested_path}

If that's not the right spot, let me know where you'd like it.
```

**Wait for user confirmation before proceeding.**

### File Naming Convention

| Context | File Name |
|---------|-----------|
| Business client | `Next Steps.md` (in their client folder) |
| Ministry | `Brave Life - Next Steps & Action Items.md` (in Execution folder) |
| Personal | Ask user for preferred name and location |

### New File Template

```markdown
# {Client/Org Name} — Next Steps

*Living document — updated each session*

**Last Updated:** {today's date}

---

## Action Items

{items go here}

---

## Completed
{move completed items here with date}
```

---

## Step 3: Amend Existing File

### 3a: Read the Current File

Read the entire existing Next Steps file to understand:
- Current structure and sections
- Existing action items (to avoid duplicates)
- How the file is organized (varies per client)

### 3b: Gather New Items

Collect new action items from:

1. **User's explicit request** — "Add X to next steps"
2. **Current session work** — Items discussed or decided this session
3. **Tasks just created** — If we created Notion tasks or Airtable records this session, those should be reflected
4. **Meeting action items** — If we just processed a meeting

### 3c: Deduplicate

**Before adding any item, check if it already exists in the file.**

Compare new items against existing items:
- Same task, same wording → Skip (already there)
- Same task, different wording → Skip and note to user
- New task → Add

### 3d: Determine Where to Add

Respect the existing file structure:
- If the file has sections (like "Immediate", "Ongoing", "Phase II"), ask where items belong or infer from context
- If the file is a flat list, append to the end of the action items section
- Never reorganize the existing file unless explicitly asked

### 3e: Add Items

Use the Edit tool to append new items. Format:

```markdown
- [ ] {Action item description}
```

If items have context (dates, priorities, assignments):
```markdown
- [ ] {Action item} — {context/notes}
```

### 3f: Update "Last Updated" Date

If the file has a "Last Updated" field, update it to today's date.

---

## Step 4: Confirm Changes

After amending, display:

```
✅ Next Steps updated for {Client/Org}

📄 File: {file_path}

Added {N} items:
- {item 1}
- {item 2}
- {item N}

Skipped {M} duplicates (already in file)
```

---

## Integration: Session End Hook

When invoked from the **session-files** skill during end-session:

1. Receive the "What's Next" items from the session
2. Run Steps 1-4 above
3. If client detection fails, list the items and ask:
   ```
   These next steps came from the session. Which client do they belong to?
   ```

---

## Integration: Task Creation Sync

When tasks are created via **Notion** or **Airtable** during the session:

1. Note which tasks were created
2. When next-step is invoked (manually or via end-session), include those tasks
3. Format: `- [ ] {Task name}` with any relevant context

### Airtable Task Detection

If tasks were added to Airtable via MCP during this session, capture:
- Record name/title
- Table and base they were added to
- Any status or priority info

### Notion Task Detection

If tasks were created in Notion Master Tasks during this session, capture:
- Task title
- Status
- Priority
- Company assignment

---

## Error Handling

| Error | Response |
|-------|----------|
| Client not identified | ASK user — never guess |
| Next Steps file not found | ASK before creating — never auto-create |
| Multiple possible Next Steps files | Show all matches, ask user which one |
| File is in unexpected format | Append to end of file, note the structure mismatch |
| Write/Edit fails | Output the items to chat so user can add manually |
| Duplicate items detected | Skip silently, report count in confirmation |
| Client folder doesn't exist | STOP — ask user. The client may not be set up yet. |

---

## Standalone vs Chained Usage

### Standalone (user invokes directly)

User says "update next steps for MxDetail" or "add to Brave Life next steps":
1. Run Steps 1-4
2. Done

### Chained from End Session

The session-files skill passes context:
1. Client/project name from session
2. "What's Next" items
3. Any tasks created during session
4. Run Steps 1-4 using that context

### Chained from Meeting Processing

After a Zoom meeting is processed:
1. Action items from the meeting summary
2. Tasks created in Notion
3. Run Steps 1-4

---

## Quality Checklist

- [ ] Client correctly identified (not guessed)
- [ ] Existing file found (or user approved creation)
- [ ] No duplicate items added
- [ ] Existing file structure preserved
- [ ] New items formatted consistently with existing items
- [ ] "Last Updated" date refreshed
- [ ] Confirmation displayed to user
- [ ] All session tasks reflected (Notion + Airtable)
