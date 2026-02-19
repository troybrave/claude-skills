---
name: session-files
description: Checkpoint (mid-work handoff) and End Session (wrap-up) with 100% context retention via raw transcript backup. Integrates with Obsidian vault using wikilinks.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, AskUserQuestion
---

# Session Files Skill

## Purpose
Save session state for handoff to next Claude instance. Two modes:
- **Checkpoint**: Mid-work, context dying, need to restart NOW
- **End Session**: Natural stopping point, wrap-up summary

All session files are Markdown files in an Obsidian vault and should use Obsidian best practices for linking.

## Triggers

| Trigger | Mode | When to Use |
|---------|------|-------------|
| `checkpoint` | Checkpoint | Context long, Claude slow/confused, mid-task |
| `save state` | Checkpoint | Same |
| `handoff` | Checkpoint | Same |
| `end session` | Session Log | Done working, stopping for now |
| `wrap up` | Session Log | Same |
| `session complete` | Session Log | Same |

---

# PROFILE DETECTION (MANDATORY FIRST STEP)

## Step 0: Detect Current Vault Profile

**BEFORE doing anything else**, determine which vault you're working in by checking the current working directory from the `<env>` section.

### Profile Detection Rules

| Working Directory Contains | Profile | Vault Root | Session Folder |
|---------------------------|---------|------------|----------------|
| `/Endless Winning` | Endless Winning | `/Users/troybrave/Documents/Projects/Endless Winning/` | `z - Session Files/Troy` |
| `/Full Vault` | Full Vault | `/Users/troybrave/Documents/Projects/Full Vault/` | `z - Session Files` |
| Neither / Unknown | Default to Full Vault | `/Users/troybrave/Documents/Projects/Full Vault/` | `z - Session Files` |

**Note:** Endless Winning has person subfolders: `Troy` and `Matt`. Default to `Troy` unless user specifies otherwise.

### Detection Examples

```
Working dir: /Users/troybrave/Documents/Projects/Endless Winning
→ Profile: Endless Winning
→ Vault: /Users/troybrave/Documents/Projects/Endless Winning/
→ Sessions: z - Session Files/Troy/YYYY/MM-Mon/DD/

Working dir: /Users/troybrave/Documents/Projects/Endless Winning/Power Bookkeeping Dashboard
→ Profile: Endless Winning
→ Vault: /Users/troybrave/Documents/Projects/Endless Winning/
→ Sessions: z - Session Files/Troy/YYYY/MM-Mon/DD/

Working dir: /Users/troybrave/Documents/Projects/Full Vault
→ Profile: Full Vault
→ Vault: /Users/troybrave/Documents/Projects/Full Vault/
→ Sessions: z - Session Files/YYYY/MM-Mon/DD/

Working dir: /Users/troybrave/Code Projects
→ Profile: Full Vault (default)
→ Vault: /Users/troybrave/Documents/Projects/Full Vault/
→ Sessions: z - Session Files/YYYY/MM-Mon/DD/
```

### Profile Variables

Once detected, use these variables throughout:

| Variable | Endless Winning Profile | Full Vault Profile |
|----------|------------------------|-------------------|
| `{vault_root}` | `/Users/troybrave/Documents/Projects/Endless Winning/` | `/Users/troybrave/Documents/Projects/Full Vault/` |
| `{session_folder}` | `z - Session Files/Troy` (or `Matt`) | `z - Session Files` |
| `{full_session_path}` | `{vault_root}{session_folder}/YYYY/MM-Mon/DD/` | `{vault_root}{session_folder}/YYYY/MM-Mon/DD/` |

### Date Format

Use `YYYY/MM-Mon/DD` format where `Mon` is the 3-letter month abbreviation:

| Month | Format |
|-------|--------|
| January | `01-Jan` |
| February | `02-Feb` |
| March | `03-Mar` |
| April | `04-Apr` |
| May | `05-May` |
| June | `06-Jun` |
| July | `07-Jul` |
| August | `08-Aug` |
| September | `09-Sep` |
| October | `10-Oct` |
| November | `11-Nov` |
| December | `12-Dec` |

---

## Step 0b: Project Root Detection

After detecting the vault profile, determine whether the working directory falls inside a **known client project**. This enables a project-level sessions index file.

### Known Projects Table

| Path Keyword | Client Name | Abbreviation |
|-------------|-------------|-------------|
| `Power Bookkeeping` | Power Bookkeeping | PBK |
| `MX Detail` | MxDetail | MXD |
| `Taskaroo` | Taskaroo | TSK |
| `Brave Life` | Brave Life | BLN |
| `Living Water` | Living Water | LVW |
| `Endless Winning` | Endless Winning | EW |

### Detection Logic

1. Take the current working directory
2. Match (case-insensitive) against each **Path Keyword** in the table above
3. If matched:
   - `{project_name}` = the **Client Name** column
   - `{project_abbrev}` = the **Abbreviation** column
   - `{project_root}` = the portion of the working directory path **up to and including** the matched folder. Example: working dir `/Users/troybrave/Documents/Projects/Full Vault/Business/04 - Endless Winning Agency/Sub-Accounts/01 - Active/Power Bookkeeping/src` → `{project_root}` = `/Users/troybrave/Documents/Projects/Full Vault/Business/04 - Endless Winning Agency/Sub-Accounts/01 - Active/Power Bookkeeping/`
   - `{sessions_index_file}` = `{project_root}{project_abbrev} Sessions.md`
4. If **no match** → ASK user: "What abbreviation should I use for this project's session index? (or type 'skip' to skip indexing)". If user says skip or you can't determine, set `{project_root}` = null
5. If working directory is **outside the vault** → `{project_root}` = null (skip indexing)

### PBK Sub-Client Detection (Special Case)

Power Bookkeeping has its own clients under `Client FIles/` (note: capital I in "FIles"). When the working directory is inside a PBK sub-client folder, capture the sub-client name for use in session index entries.

**Detection:**
1. If `{project_abbrev}` = `PBK` AND the working directory path contains `Client FIles/`
2. Extract the sub-client folder name from the path (the folder immediately after `01 - Active/`, `02 - Prospective/`, or `03 - Inactive/`)
3. Store as `{sub_client_name}` (e.g., `Blackhawk Logistics`, `Pauls Painting`)

**Effect on index entries:**
- Normal PBK session → display name: `PBK - Session Description`
- PBK sub-client session → display name: `PBK/{sub_client_name} - Session Description`

**Example entries in PBK Sessions.md:**
```markdown
- [[z - Session Files/2026/02-Feb/10/pbk-blackhawk-airtable-setup|PBK/Blackhawk Logistics - Airtable Setup]] - session log - 2026-02-10
- [[z - Session Files/2026/02-Feb/08/pbk-session-files-update|PBK - Session Files Update]] - session log - 2026-02-08
```

**Important:** Sub-client sessions still go to `PBK Sessions.md` — there is no separate index per sub-client. The sub-client name in the display text provides the context.

### Project Root Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `{project_root}` | Absolute path to the project folder (with trailing `/`) or null | `/Users/.../Power Bookkeeping/` |
| `{project_abbrev}` | Short abbreviation for the project | `PBK` |
| `{project_name}` | Full client name | `Power Bookkeeping` |
| `{sessions_index_file}` | Full path to the sessions index file | `{project_root}PBK Sessions.md` |
| `{sub_client_name}` | PBK sub-client name (null if not in a sub-client folder) | `Blackhawk Logistics` |

---

## Output Location (Profile-Aware)
```
{vault_root}{session_folder}/YYYY/MM-Mon/DD/[name].md
```

**Endless Winning (Troy):**
```
/Users/troybrave/Documents/Projects/Endless Winning/z - Session Files/Troy/YYYY/MM-Mon/DD/[name].md
```

**Endless Winning (Matt):**
```
/Users/troybrave/Documents/Projects/Endless Winning/z - Session Files/Matt/YYYY/MM-Mon/DD/[name].md
```

**Full Vault:**
```
/Users/troybrave/Documents/Projects/Full Vault/z - Session Files/YYYY/MM-Mon/DD/[name].md
```

---

# OBSIDIAN INTEGRATION

## Wikilink Syntax

Session files live in an Obsidian vault. Use **wikilinks** to connect session files to other files created or modified during the session.

### Basic Wikilink Format
```markdown
[[Note Name]]                    # Link to note by name
[[Note Name|Display Text]]       # Link with custom display text
[[Folder/Subfolder/Note Name]]   # Link to note in subfolder
```

### Linking to Files Created This Session

When you create or modify files during a session, add wikilinks in the session file:

```markdown
## Files Created
- [[Discovery-Questions]] - Sales call script for qualifying prospects
- [[Onboarding-Checklist]] - Document collection after client signs
```

### Linking FROM Created Files Back to Session

When creating new files in the vault, add a backlink to the session file:

```markdown
---
created: 2025-12-02
session: [[z - Session Files/2025/12/02/tax-prep-business-sales-research]]
---
```

Or in the body:
```markdown
## Related
- Created during: [[z - Session Files/2025/12/02/tax-prep-business-sales-research|Dec 2 Tax Prep Session]]
```

## Path Rules for Wikilinks

| File Location | How to Link |
|---------------|-------------|
| Same folder | `[[filename]]` |
| Different folder in vault | `[[Folder/Subfolder/filename]]` |
| Session file from anywhere | `[[{session_folder}/YYYY/MM-Mon/DD/session-name]]` |

**Note:** Both profiles use `z - Session Files` as the base folder. Endless Winning adds person subfolder (`Troy` or `Matt`).

### Path Calculation (Profile-Aware)

**Use the detected `{vault_root}` from Step 0.**

To create a wikilink path:
1. Take the full file path
2. Remove the `{vault_root}` (detected vault)
3. Remove the `.md` extension

**Full Vault Example:**
- Vault root: `/Users/troybrave/Documents/Projects/Full Vault/`
- Full path: `/Users/troybrave/Documents/Projects/Full Vault/Business/Endless Winning Agency/Strategy/Discovery-Questions.md`
- Wikilink: `[[Business/Endless Winning Agency/Strategy/Discovery-Questions]]`

**Endless Winning Example:**
- Vault root: `/Users/troybrave/Documents/Projects/Endless Winning/`
- Full path: `/Users/troybrave/Documents/Projects/Endless Winning/02 - Strategy/Power Bookkeeping/Discovery-Questions.md`
- Wikilink: `[[02 - Strategy/Power Bookkeeping/Discovery-Questions]]`

## Tags

Use tags in frontmatter and body for discoverability:

```yaml
---
tags:
  - session/checkpoint
  - project/taskaroo
  - status/in-progress
---
```

Common session tags:
- `#session/checkpoint` or `#session/log`
- `#project/{project-name}`
- `#status/in-progress`, `#status/blocked`, `#status/completed`

---

# EXECUTION FLOW

## Step 1: Detect Profile & Get Date (MANDATORY FIRST)

### 1a. Detect Profile
Read the `<env>` section for `Working directory:` and apply the profile detection rules from Step 0 above.

Store: `{vault_root}`, `{session_folder}`, `{profile_name}`

### 1b. Get Date
Read `<env>` section for `Today's date: YYYY-MM-DD`

**BUILD MONTH FOLDER:**
| Month # | Folder Name |
|---------|-------------|
| 01 | `01-Jan` |
| 02 | `02-Feb` |
| 03 | `03-Mar` |
| 04 | `04-Apr` |
| 05 | `05-May` |
| 06 | `06-Jun` |
| 07 | `07-Jul` |
| 08 | `08-Aug` |
| 09 | `09-Sep` |
| 10 | `10-Oct` |
| 11 | `11-Nov` |
| 12 | `12-Dec` |

Store: `year`, `month_folder` (e.g., `01-Jan`), `day`

### 1c. Detect Project Root

Apply the **Step 0b** rules to the working directory:
1. Match working directory against the Known Projects Table (case-insensitive)
2. If matched → store `{project_root}`, `{project_abbrev}`, `{project_name}`, `{sessions_index_file}`
3. If not matched and inside vault → ASK user for abbreviation or skip
4. If outside vault → set `{project_root}` = null

## Step 2: Build Folder Path (Profile-Aware)

```
{vault_root}{session_folder}/{year}/{month_folder}/{day}/
```

**Endless Winning (Troy):**
```
/Users/troybrave/Documents/Projects/Endless Winning/z - Session Files/Troy/{year}/{month_folder}/{day}/
```

**Endless Winning (Matt):**
```
/Users/troybrave/Documents/Projects/Endless Winning/z - Session Files/Matt/{year}/{month_folder}/{day}/
```

**Full Vault:**
```
/Users/troybrave/Documents/Projects/Full Vault/z - Session Files/{year}/{month_folder}/{day}/
```

Create if doesn't exist:
```bash
mkdir -p "{vault_root}{session_folder}/YYYY/MM-Mon/DD"
```

## Step 3: Determine Mode

**CHECKPOINT MODE** if trigger contains:
- checkpoint, save state, handoff, restart, context, slow

**SESSION LOG MODE** if trigger contains:
- end session, wrap up, done, complete, finished, stopping

## Step 4: Extract Context

### Required (MUST capture):

| Field | How to Find |
|-------|-------------|
| **Project** | File paths (`/Projects/X/`), explicit mention, or ASK |
| **Current Task** | What user asked to do, what we've been working on |
| **Current State** | Where we are RIGHT NOW - in progress, blocked, debugging |
| **Last Actions** | Last 2-3 things we did |
| **Next Action** | What to do when resuming |
| **Key Files** | All file paths mentioned in conversation |
| **Files Created** | Any new files created this session (for Obsidian linking) |

### If Present (capture if exists):

| Field | How to Find |
|-------|-------------|
| **Blocker** | Errors, "stuck", "not working", failed attempts |
| **Decisions** | "Let's go with", "using X because", explicit choices |
| **What Was Tried** | For debugging - what didn't work |
| **Important Context** | Constraints, warnings, things next Claude MUST know |

## Step 5: Generate Session Name

Format: `{project}-{brief-description}`

Rules:
- Lowercase
- Hyphen-separated
- 3-6 words max
- Descriptive of WHAT, not WHEN

Examples:
- `taskaroo-ghl-webhook-auth`
- `mxdetail-api-401-debugging`
- `obsidian-skill-redesign`

**If file exists for today:** Append `-v2`, `-v3`, etc.

## Step 6: Capture Raw Transcript

**THIS IS CRITICAL FOR 100% RETENTION**

The entire conversation from this session goes in a collapsed section.

Format each exchange as:
```
**User:** [what user said - VERBATIM, not summarized]

**Claude:** [what I did/said - preserve substance, can trim filler words]
```

### TRANSCRIPT RULES (STRICT)

**MUST KEEP VERBATIM (never summarize these):**
- User messages - EXACT words, not "[Long prompt about X]"
- Error messages - EXACT output, not "got an error"
- Code snippets - ALL code, not "wrote some functions"
- File paths - EVERY path mentioned
- Command outputs - EXACT results
- Architecture/design docs created - FULL content
- Decisions with reasoning - COMPLETE rationale

**CAN TRIM:**
- Filler phrases ("Let me think about this...")
- Repeated explanations of same concept
- Tool call metadata (but keep results)

**NEVER DO THIS:**
```
❌ "User: [Long detailed prompt requesting backup system]"
❌ "Claude: Created several files and implemented the system"
❌ "Error occurred during testing"
```

**ALWAYS DO THIS:**
```
✅ "User: I need a backup system that handles these 5 requirements: 1) ... 2) ..."
✅ "Claude: Created /scripts/backup.cjs with functions: exportPages(), syncToGit()..."
✅ "Error: Could not find block with ID: d64f6dd4-4cca-4a4a-a03e-da5c6c062948"
```

### File Size Guidelines

**DO NOT use file size as an excuse to summarize.**

| Checkpoint Size | Verdict |
|-----------------|---------|
| < 5,000 lines (~400 KB) | ✅ Normal - include everything verbatim |
| 5,000 - 15,000 lines (~1.2 MB) | ✅ Large but fine - include everything verbatim |
| > 15,000 lines (~1.2+ MB) | ⚠️ Split strategy required (see below) |

### If Transcript Exceeds 15,000 Lines

For massive sessions, use the **split strategy**:

1. **Save major artifacts as separate files** in same checkpoint folder:
   ```
   z - Session Files/2025/12/02/
   ├── project-name-checkpoint.md      (main checkpoint)
   ├── project-name-architecture.md    (full architecture doc)
   ├── project-name-code-snippets.md   (all code created)
   └── project-name-full-transcript.md (raw conversation)
   ```

2. **Reference them in the main checkpoint using wikilinks**:
   ```markdown
   ## Attached Files
   - [[z - Session Files/2025/12/02/project-name-architecture|Architecture Doc]] - Full 2000-line architecture document
   - [[z - Session Files/2025/12/02/project-name-code-snippets|Code Snippets]] - All code created this session
   - [[z - Session Files/2025/12/02/project-name-full-transcript|Full Transcript]] - Complete raw transcript
   ```

3. **Main checkpoint contains**:
   - Summary header with resume_command
   - Key decisions and rationale
   - Current state and next action
   - Wikilinks to attached files

**The goal is 100% retention, not 100% in one file.**

### If Transcript Is Moderately Long (< 15,000 lines)

Keep everything in one file:
1. Keep ALL user messages verbatim (non-negotiable)
2. Keep ALL errors verbatim (non-negotiable)
3. Keep ALL code/architecture docs (non-negotiable)
4. Summarize Claude's explanatory text (OK to trim filler)
5. Note: "⚠️ Some explanatory text trimmed for length - core content preserved"

## Step 7: Add Obsidian Links

### Link TO files created/modified this session:

For each file created or modified during the session, add a wikilink in the "Files Created" or "Key Files" section:

```markdown
## Files Created This Session
- [[Business/Endless Winning Agency/Strategy/Power Bookkeeping Ai/Discovery-Questions|Discovery Questions]] - Sales call qualification script
- [[Business/Endless Winning Agency/Strategy/Power Bookkeeping Ai/Onboarding-Checklist|Onboarding Checklist]] - Post-sale document collection
```

### Link FROM created files back to session (when possible):

If creating files that will live in the vault long-term, add frontmatter or a "Related" section linking back:

```markdown
---
created: 2025-12-02
session: [[z - Session Files/2025/12/02/session-name]]
tags:
  - source/claude-session
---
```

## Step 8: Skip Verification — Just Write

**Do NOT prompt for approval.** Proceed directly to writing the session file. User will review and edit after the fact if needed.

## Step 9: Write File (Profile-Aware)

Use Write tool to save to:
```
{vault_root}{session_folder}/YYYY/MM-Mon/DD/{name}.md
```

**Endless Winning (Troy):**
```
/Users/troybrave/Documents/Projects/Endless Winning/z - Session Files/Troy/YYYY/MM-Mon/DD/{name}.md
```

**Endless Winning (Matt):**
```
/Users/troybrave/Documents/Projects/Endless Winning/z - Session Files/Matt/YYYY/MM-Mon/DD/{name}.md
```

**Full Vault:**
```
/Users/troybrave/Documents/Projects/Full Vault/z - Session Files/YYYY/MM-Mon/DD/{name}.md
```

## Step 9b: Update Project Sessions Index

**Skip this step if `{project_root}` is null.**

This step maintains a project-level sessions index file that accumulates wikilinks to every session for the project.

### 9b-1: Check if index file exists

Check whether `{sessions_index_file}` (e.g., `/path/to/Power Bookkeeping/PBK Sessions.md`) exists.

### 9b-2: Create index file if it doesn't exist

If the file does NOT exist, create it with this template:

```markdown
---
type: sessions-index
project: {project_name}
abbreviation: {project_abbrev}
created: {YYYY-MM-DD}
tags:
  - sessions-index
  - project/{project-slug}
---

# {project_name} Sessions

*Auto-maintained index of all sessions for this project.*

---
```

Where `{project-slug}` is the lowercase-hyphenated version of the project name (e.g., `power-bookkeeping`).

### 9b-3: Append wikilink entry

Add the new session entry under the correct `## {Year}` and `### {Month Name}` heading.

**Rules:**
1. If the `## {Year}` heading doesn't exist, create it (most recent year first)
2. If the `### {Month Name}` heading doesn't exist under that year, create it (most recent month first)
3. Append the entry as a bullet under the month heading
4. Newest entries go at the **top** of their month section (reverse chronological)

**Entry format:**
```
- [[{session_folder}/{year}/{month_folder}/{day}/{session-name}|{project_abbrev} - {Brief Description}]] - {type} - {YYYY-MM-DD}
```

Where:
- `{session_folder}` = the session folder path relative to vault root (e.g., `z - Session Files`)
- `{session-name}` = the filename without `.md`
- `{Brief Description}` = title-cased summary of what the session was about (derived from the session name)
- `{type}` = `checkpoint` or `session log` (matching the session mode)

**Example entries:**
```markdown
## 2026

### February
- [[z - Session Files/2026/02-Feb/10/pbk-session-files-update|PBK - Session Files Update]] - session log - 2026-02-10

### January
- [[z - Session Files/2026/01-Jan/15/pbk-client-onboarding-flow|PBK - Client Onboarding Flow]] - checkpoint - 2026-01-15
- [[z - Session Files/2026/01-Jan/02/pbk-slide-deck-copy|PBK - Slide Deck Copy]] - session log - 2026-01-02
```

## Step 10: Confirm (Profile-Aware)

```
✅ {Checkpoint/Session} saved

🏠 Profile: {profile_name}
📍 {session_folder}/{year}/{month_folder}/{day}/{name}.md
📂 Project Index: {index_status}

🔗 Linked to:
   - [[path/to/file1]]
   - [[path/to/file2]]

🔄 To resume in new session:
   "Load checkpoint from {month}/{day}/{name} and continue"
```

**Project Index status values:**
- `✅ Updated {abbrev} Sessions.md (new entry added)` — appended to existing file
- `✅ Created {abbrev} Sessions.md (new file + entry)` — file was just created
- `⏭️ Skipped (no project root detected)` — `{project_root}` was null

## Step 10b: Sync Working Directory to Google Drive

**MANDATORY: Sync the current working directory between Vault and Google Drive.**

After the session file is saved, sync the root folder being worked on so that changes are mirrored and large media stays on Google Drive only.

```bash
/Users/troybrave/.claude/scripts/vault-gdrive-sync.sh --path "$(pwd)"
```

**Behavior:**
- Auto-detects whether CWD is in Vault or Google Drive
- Maps to the corresponding path on the other side (1:1 for most folders, custom mapping for Endless Winning Agency)
- Syncs non-media files bidirectionally (newer wins)
- Excludes large media (videos, raw images, WAV, etc.) from the vault — keeps them on Google Drive only
- Small media (JPG, PNG, MP3, PDF) syncs normally
- Never deletes files, always backs up before overwriting

**If CWD is outside both Vault and Google Drive:** Skip this step silently — the sync script only works for paths inside the vault or GDrive.

**If sync fails:**
```
⚠️ Vault ↔ GDrive sync failed (Drive may be disconnected)
   Session file saved. Run sync manually later:
   /Users/troybrave/.claude/scripts/vault-gdrive-sync.sh --path "<working-dir>"
```

---

## Step 11: Update Next Steps (SESSION LOG MODE ONLY)

**This step ONLY runs in End Session / Session Log mode. Skip for Checkpoints.**

After the session file is saved, chain into the **next-step** skill to update the client/org's living Next Steps file with any "What's Next" items from this session.

### 11a: Collect Items

Gather action items from:
1. The **"What's Next"** section of the session log just written
2. Any **Notion tasks** created during this session
3. Any **Airtable records** created during this session
4. Any **explicit action items** discussed but not yet captured

### 11b: Identify Client/Org

Use the session context to determine who the next steps belong to:
- The **project** field from the session log
- The **working directory** and file paths from the session
- If ambiguous, ASK the user

### 11c: Invoke next-step Skill

Pass the collected items to the next-step skill workflow:
1. Identify the client (from 11b)
2. Search for existing Next Steps file
3. Amend with new items (deduplicated)
4. Confirm changes

**If no actionable "What's Next" items exist** (e.g., session was purely research or exploration), skip this step silently.

---

# TEMPLATES

## CHECKPOINT Template (Mid-Work Handoff)

```markdown
---
type: checkpoint
created: YYYY-MM-DD
project: {project}
status: in_progress
resume_command: "{CLAUDE-ACTIONABLE instruction - what Claude should DO, not what user should do}"
tags:
  - session/checkpoint
  - project/{project-slug}
  - status/in-progress
---

# Checkpoint: {Project} - {Brief Description}

## Current Task
{What we're actively doing - be specific}

## Status
{IN PROGRESS / BLOCKED / DEBUGGING} - {X}% complete

## Last Actions
- {Most recent thing done}
- {Second most recent}
- {Third if relevant}

## Next Action
{EXACT next step - must be CLAUDE-ACTIONABLE}
{Bad: "User needs to share database" / Good: "Read /lib/auth.ts and fix line 47"}
{If blocked on user action, state: "WAITING ON USER: [action]. Once done, Claude should: [next step]"}

## Current Blocker
{If any - include EXACT error messages, not descriptions}

Example of WRONG:
```
Got an authentication error when trying to refresh the token
```

Example of RIGHT:
```
Error: Request failed with status 401
  at refreshToken (/lib/ghl-client.ts:47)
  Response: {"error": "invalid_grant", "error_description": "Token has been revoked"}
```

{If no blocker, delete this section}

## What Was Tried
{For debugging - what didn't work and why}
{If not debugging, delete this section}

## Files Created This Session
- [[path/to/file1|Display Name]] - {description}
- [[path/to/file2|Display Name]] - {description}

## Key Files (Existing)
- `{path1}` - {what/why}
- `{path2}` - {what/why}

## Important Context
{Things next Claude MUST know}
{Decisions made, constraints, warnings, gotchas}

## Decisions Made
- {Decision}: {Choice} - {Why}

---

## Resume Instructions

To continue this work:

1. Read this checkpoint
2. Read key files listed above
3. Execute: "{resume_command from frontmatter}"

---

<details>
<summary>📜 Full Session Transcript (click to expand)</summary>

{RAW CONVERSATION HERE - preserves 100% context}

**User:** {first message}

**Claude:** {response summary}

**User:** {next message}

**Claude:** {response summary}

{... entire conversation ...}

</details>
```

---

## SESSION LOG Template (End of Work)

```markdown
---
type: session_log
created: YYYY-MM-DD
project: {project}
status: completed
duration_estimate: ~{X} hours
resume_command: "{what to do if continuing this work later}"
tags:
  - session/log
  - project/{project-slug}
  - status/completed
---

# Session: {Project} - {Brief Description}

## Summary
{2-3 sentences: what was accomplished, current state, what's next}

## What Got Done
- [x] {completed item}
- [x] {completed item}
- [ ] {incomplete item - if any}

## Decisions Made
| Decision | Choice | Rationale |
|----------|--------|-----------|
| {topic} | {choice} | {why} |

## Blockers/Issues
{Problems encountered and their status}
{Delete section if none}

## Files Created This Session
- [[path/to/file1|Display Name]] - {NEW} - {description}
- [[path/to/file2|Display Name]] - {NEW} - {description}

## Files Modified
- [[path/to/file3|Display Name]] - {MODIFIED} - {what changed}

## Key Files (Reference)
- `{path}` - {what}

## What's Next
1. {Priority next step}
2. {Secondary step}

---

## To Continue Later

```
{Orientation paragraph for future session}
{Project, current state, where to pick up, any warnings}
```

---

## Related Notes
- [[Other Related Note]]
- [[Another Related Note]]

---

<details>
<summary>📜 Full Session Transcript (click to expand)</summary>

{RAW CONVERSATION HERE}

</details>
```

---

# RESUME FLOW

When user says "resume from checkpoint" or "load session from X":

1. Find the file (search z - Session Files folder or use path user provided)
2. Read the file
3. Extract `resume_command` from frontmatter
4. Read the Key Files listed (follow wikilinks if needed)
5. Output:

```
📂 Loaded: {checkpoint name}
📍 Project: {project}
📋 Status: {status}

🔗 Related files:
   - [[file1]]
   - [[file2]]

Resuming: {resume_command}

Ready to continue. {Ask clarifying question or start working}
```

---

# ERROR HANDLING

| Error | Response |
|-------|----------|
| Can't determine project | ASK: "Which project? I see files from X, Y..." |
| Folder doesn't exist | Create it with mkdir -p |
| File already exists | Append -v2, -v3, etc. |
| Write fails | Output checkpoint content to conversation (user can copy) |
| Context too long | Prioritize: current state > recent > earlier. Note truncation. |
| Can't determine wikilink path | Use full path in backticks as fallback |
| Project root not detected | Skip Step 9b — do not block main session save |
| Sessions index write fails | Log error in confirmation output, do not block main session save |

---

# QUALITY CHECKLIST

Before saving, verify:

- [ ] **Profile detected correctly** (Endless Winning vs Full Vault)
- [ ] **Vault root is correct** for the detected profile
- [ ] **Session folder is correct** (`z - Session Files`)
- [ ] Date is from `<env>` (month number correct!)
- [ ] Project name is accurate
- [ ] Current task is specific (not vague)
- [ ] Next action is CLAUDE-ACTIONABLE (not "user needs to do X")
- [ ] Key files are listed with paths AND purposes
- [ ] Blocker includes VERBATIM error message (not description)
- [ ] Resume command is CLAUDE-ACTIONABLE (Claude does X, not user does X)
- [ ] Transcript includes ALL user messages VERBATIM
- [ ] Transcript includes ALL error outputs VERBATIM
- [ ] Transcript includes ALL code/architecture docs FULLY
- [ ] Folder path is correct: `{session_folder}/YYYY/MM/DD/`
- [ ] **Wikilinks use correct vault-relative paths**
- [ ] **Tags added in frontmatter**
- [ ] **Project index updated** (if `{project_root}` is set)

## AUDIT SCORE GUIDE

After creating checkpoint, score yourself:

| Criteria | 1-3 (Fail) | 4-6 (Weak) | 7-10 (Pass) |
|----------|-----------|------------|-------------|
| Resume command | User action | Vague Claude action | Specific Claude action with file:line |
| Next action | "Continue work" | "Fix the bug" | "Debug refreshToken() at /lib/auth.ts:47" |
| Blocker | "Got an error" | "401 error" | Full stack trace + response body |
| Transcript | "[Long prompt]" | Partial quotes | Full verbatim content |
| Obsidian links | No links | Some links | All created files linked with wikilinks |

**Target: 70+/80 total. Below 60 = rewrite failed sections.**

---

# EXAMPLES

## Example Checkpoint Output

### Endless Winning Profile Example

```
📋 Checkpoint Verification:
- Profile: Endless Winning
- Project: Power Bookkeeping AI
- Current task: Creating sales and onboarding documents
- Status: IN PROGRESS - documents created
- Next action: Continue with pitch scripts or pricing sheets if requested
- Files to link:
  - [[02 - Strategy/Power Bookkeeping/Discovery-Questions]]
  - [[02 - Strategy/Power Bookkeeping/Onboarding-Checklist]]

Correct? (y/fix)
```

User: "y"

```
✅ Checkpoint saved

🏠 Profile: Endless Winning
📍 z - Session Files/Troy/2025/12-Dec/02/power-bookkeeping-sales-docs.md

🔗 Linked to:
   - [[02 - Strategy/Power Bookkeeping/Discovery-Questions|Discovery Questions]]
   - [[02 - Strategy/Power Bookkeeping/Onboarding-Checklist|Onboarding Checklist]]

To resume in new session:
   "Load checkpoint from 12-Dec/02/power-bookkeeping-sales-docs and continue"
```

### Full Vault Profile Example

```
📋 Checkpoint Verification:
- Profile: Full Vault
- Project: Taskaroo GHL Integration
- Current task: Debugging webhook authentication
- Status: BLOCKED - 401 on token refresh
- Next action: Debug refreshToken() at /lib/ghl-client.ts:47
- Files to link:
  - [[Business/Endless Winning Agency/Sub-Accounts/02 Active/Taskaroo/lib/ghl-client]]

Correct? (y/fix)
```

User: "y"

```
✅ Checkpoint saved

🏠 Profile: Full Vault
📍 z - Session Files/2025/12-Dec/02/taskaroo-webhook-auth-debug.md

🔗 Linked to:
   - [[Business/Endless Winning Agency/Sub-Accounts/02 Active/Taskaroo/lib/ghl-client|GHL Client]]

To resume in new session:
   "Load checkpoint from 12-Dec/02/taskaroo-webhook-auth-debug and continue"
```

## Example Resume

User: "resume from yesterday's taskaroo checkpoint"

```
📂 Loaded: taskaroo-ghl-webhook-auth
🏠 Profile: Full Vault
📍 Project: Taskaroo
📋 Status: BLOCKED - 401 on token refresh

🔗 Related files:
   - [[Business/Endless Winning Agency/Sub-Accounts/02 Active/Taskaroo/lib/ghl-client]]
   - [[Business/Endless Winning Agency/Sub-Accounts/02 Active/Taskaroo/docs/webhook-flow]]

Resuming: Debug refreshToken() in /lib/ghl-client.ts:47 - hardcoded token works, dynamic refresh fails

Let me read that file and pick up where we left off...
```

---

# WIKILINK QUICK REFERENCE (PROFILE-AWARE)

## Vault Roots

| Profile | Vault Root |
|---------|------------|
| **Full Vault** | `/Users/troybrave/Documents/Projects/Full Vault/` |
| **Endless Winning** | `/Users/troybrave/Documents/Projects/Endless Winning/` |

## Common Paths by Profile

### Full Vault Profile
| Location | Wikilink Format |
|----------|-----------------|
| Session file | `[[z - Session Files/YYYY/MM-Mon/DD/name]]` |
| Business docs | `[[Business/Company/Folder/name]]` |
| Projects | `[[Projects/ProjectName/path/name]]` |
| Scripts/CLI | Usually outside vault - use backtick paths |

### Endless Winning Profile
| Location | Wikilink Format |
|----------|-----------------|
| Session file (Troy) | `[[z - Session Files/Troy/YYYY/MM-Mon/DD/name]]` |
| Session file (Matt) | `[[z - Session Files/Matt/YYYY/MM-Mon/DD/name]]` |
| Reference docs | `[[01 - Reference/Folder/name]]` |
| Strategy docs | `[[02 - Strategy/Folder/name]]` |
| Execution docs | `[[03 - Execution/Folder/name]]` |
| Scripts/CLI | Usually outside vault - use backtick paths |

## Converting Full Path to Wikilink

**Full Vault:**
```
Full:     /Users/troybrave/Documents/Projects/Full Vault/Business/EWA/file.md
Wikilink: [[Business/EWA/file]]
```

**Endless Winning:**
```
Full:     /Users/troybrave/Documents/Projects/Endless Winning/02 - Strategy/Power Bookkeeping/file.md
Wikilink: [[02 - Strategy/Power Bookkeeping/file]]
```

**Formula:** Remove `{vault_root}` + remove `.md` extension
