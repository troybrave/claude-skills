---
name: end-of-day
description: Review today's session files, create Notion tasks for completed work, identify pending action items, and send a daily summary email to Troy. Use when user says "end of day", "daily wrap up", "daily summary", "what did I do today", "EOD review". NOT for mid-session checkpoints (use session-files).
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Skill
---

# End of Day Review

Comprehensive daily wrap-up that reviews all session files, syncs completed and pending work to Notion, and sends an email summary.

---

## Key Resources

| Resource | Location |
|----------|----------|
| Session Files | `/Users/troybrave/Documents/Projects/Full Vault/Session Files/YYYY/MM/DD/` |
| Notion CLI | `/Users/troybrave/.claude/.CLI/notion-cli/` |
| Email CLI | `/Users/troybrave/.claude/.CLI/email-cli/` |
| Calendar CLI | `/Users/troybrave/.claude/.CLI/calendar-cli/` |
| Task Creation Script | `/Users/troybrave/.claude/.CLI/notion-cli/create-task.js` |
| Notion Config | `/Users/troybrave/.claude/.CLI/notion-cli/config.json` |

### Notion IDs (from config.json)

```
Master Tasks DB: ecccd412-65ff-41bf-9994-3bbfde001bf1
Master Cycles DB: 579faf32-07a5-4848-88ac-bb7bc7900c26  ⚠️ USE THIS TO LOOK UP CURRENT CYCLE
Troy's User ID: 29deb02a-1d21-4853-b470-8fb589e12ac0
Current Cycle: 1dc50f64-6387-80c0-a6d4-d9782d0c0e14 (2550)

Client/Company IDs:
- troy (personal): 099c618e-d42b-4074-b710-8bc140f41ce5
- endless-winning: 3bf11a9a-178e-4c88-8906-1604c1fcf0db
- brave-life: 318f827a-dd8a-4a29-b11b-9570f6d26e6c
- powerbooks: 23950f64-6387-801a-b11d-f21ede7797b0
- new-life-moving: 11b50f64-6387-8017-93c5-eb6ff3d45a16
- upper-room: 15c50f64-6387-80dc-a6dc-fb2b72432fd1
- trem: 7bc3cf2f-69bf-443b-b2cf-e7205815cf61
```

### ⚠️ CRITICAL: Cycle ID Lookup

**DO NOT use global Notion search for cycle IDs.** The same cycle name may exist in multiple databases.

**Correct method:** Query the Master Cycles DB (`579faf32-07a5-4848-88ac-bb7bc7900c26`) for `Sprint Status = Current`:

```javascript
// Reference: /Users/troybrave/.claude/.CLI/zoom-transcript-sync/create-meeting-tasks.cjs lines 209-241
const response = await notion.databases.query({
  database_id: '579faf32-07a5-4848-88ac-bb7bc7900c26',
  filter: { property: 'Sprint Status', status: { equals: 'Current' } }
});
const cycleId = response.results[0]?.id;
```

**Or use config.json:** Read cycle ID from `/Users/troybrave/.claude/.CLI/notion-cli/config.json` → `currentSprint.cycle.id`

---

## Workflow

### Step 1: Gather Today's Session Files

1. Get today's date: `date +%Y/%m/%d` → `YYYY/MM/DD`
2. List session files: `ls "/Users/troybrave/Documents/Projects/Full Vault/Session Files/YYYY/MM/DD/"`
3. Read each `.md` file in the directory
4. Extract from each session:
   - **Project name** (from frontmatter `project:` or filename)
   - **Status** (from frontmatter `status:`)
   - **What Got Done** section (completed tasks)
   - **What's Next** section (pending tasks)
   - **Decisions Made** table (key decisions)
   - **Files Created/Modified** sections

### Step 2: Gather Today's Calendar Events

Run calendar list for context:
```bash
cd /Users/troybrave/.claude/.CLI/calendar-cli && ./list-events.cjs --days 0
```

This provides:
- Meetings attended
- Time allocation context
- Meeting titles for task correlation

### Step 3: Analyze and Categorize Work

For each session file, categorize extracted items:

**Completed Tasks** (for Notion with "Completed" status):
- Items marked `[x]` in "What Got Done"
- Items with `status: completed` in frontmatter
- Files created/modified (as "Created X", "Updated Y")

**Pending Tasks** (for Notion with "Not Started" status):
- Items in "What's Next" section
- Unchecked items `[ ]` anywhere
- Action items mentioned but not completed

**Company/Client Detection** (from project name, file path, or content):
| Keyword/Path | Master Company ID |
|--------------|-------------------|
| "Claude Code", "skill", ".claude" | `099c618e-d42b-4074-b710-8bc140f41ce5` (Troy) |
| "Endless Winning", "EWA", "agency" | `3bf11a9a-178e-4c88-8906-1604c1fcf0db` |
| "Brave Life", "BLN" | `318f827a-dd8a-4a29-b11b-9570f6d26e6c` |
| "Taskaroo" | `099c618e-d42b-4074-b710-8bc140f41ce5` (Troy - personal project) |
| "Powerbooks", "Clear Piggy" | `23950f64-6387-801a-b11d-f21ede7797b0` |
| "New Life Moving" | `11b50f64-6387-8017-93c5-eb6ff3d45a16` |
| "Upper Room" | `15c50f64-6387-80dc-a6dc-fb2b72432fd1` |
| "TREM" | `7bc3cf2f-69bf-443b-b2cf-e7205815cf61` |
| Default | `099c618e-d42b-4074-b710-8bc140f41ce5` (Troy) |

**Time Estimation**:
| Complexity Signal | Time |
|-------------------|--------|
| "created skill", "new feature", "implemented" | 4 |
| "built", "developed", "migrated" | 4 |
| "configured", "setup", "integrated" | 3 |
| "fixed", "updated", "modified" | 2 |
| "reviewed", "researched", "explored" | 1 |
| Default | 2 |

### Step 4: Create Notion Tasks for Completed Work

**First, get the current cycle ID from config:**
```bash
CYCLE_ID=$(node -e "console.log(require('/Users/troybrave/.claude/.CLI/notion-cli/config.json').currentSprint.cycle.id)")
```

For each completed task, create a Notion task with status "Completed":

```bash
cd /Users/troybrave/.claude/.CLI/notion-cli && node create-task.js "[EOD] Task title" \
  --status "Completed" \
  --priority "Low" \
  --time <estimated-time> \
  --task-lead "29deb02a-1d21-4853-b470-8fb589e12ac0" \
  --cycle "$CYCLE_ID" \
  --master-company "<detected-company-id>"
```

**Task Title Format**: `[EOD] <Verb> <What>`
- Example: `[EOD] Created meeting-summary skill`
- Example: `[EOD] Updated transcript-processor workflow`

**Note**: Mark all EOD-created completed tasks as `Low` priority (work is done, just logging it).

### Step 5: Create Notion Tasks for Pending Work

For each pending task, create a Notion task with status "Not Started" (use same `$CYCLE_ID` from Step 4):

```bash
cd /Users/troybrave/.claude/.CLI/notion-cli && node create-task.js "Task title" \
  --status "Not Started" \
  --priority "Medium" \
  --time <estimated-time> \
  --task-lead "29deb02a-1d21-4853-b470-8fb589e12ac0" \
  --cycle "$CYCLE_ID" \
  --master-company "<detected-company-id>"
```

**Status Selection:**
| Task Source | Status |
|-------------|--------|
| From a meeting | `Meeting Task` |
| Completed work | `Completed` |
| Pending/new work | `Not Started` |

**Cycle Helper** (optional select field):
- `Move To Next Week` - Flags task to auto-move to next cycle during sprint rotation
- Leave empty for normal tasks that should stay in current cycle

**Priority Detection for Pending Tasks**:
| Signal | Priority |
|--------|----------|
| "urgent", "asap", "critical", "today" | `🔴 Urgent` |
| "important", "soon", "this week" | `🟠 High` |
| "next week", no signal | `🟡 Medium` |
| "when possible", "eventually" | `🔵 Low` |

### Step 6: Generate Daily Summary Email

Build email content with this structure:

```
Subject: EOD Summary: [Today's Date] - [X tasks completed, Y pending]

---

Hey Troy,

Here's your end-of-day wrap-up for [Today's Date].

## Today's Sessions
[List session file names with one-line summary each]

## Completed Work ([X] items)
[Grouped by company/project]

### [Company Name]
- [Task 1] (weight: X)
- [Task 2] (weight: X)

## Pending Items ([Y] items)
[Grouped by priority]

### 🔥 Urgent
- [Task]

### 🥑 High
- [Task]

### 🥩 Medium
- [Task]

## Key Decisions Made
[From session "Decisions Made" sections]

## Calendar Activity
[List of meetings/events from today]

## Notion Tasks Created
- [X] completed tasks logged
- [Y] pending tasks created

---

Great work today!
```

### Step 7: Send Email

```bash
cd /Users/troybrave/.claude/.CLI/email-cli && node email-cli.cjs send \
  "troy@endlesswinning.com" \
  "troybrave@gmail.com" \
  "EOD Summary: $(date '+%B %d, %Y') - X completed, Y pending" \
  "<email-body>"
```

**Note**: Send from `troy@endlesswinning.com` to `troybrave@gmail.com` (personal inbox).

### Step 8: Sync to Google Drive

**MANDATORY: Keep Obsidian vault and Google Drive in sync.**

After all tasks are created and email is sent, run **both** sync scripts:

**8a. Sync current working directory (media-aware):**
```bash
/Users/troybrave/.claude/scripts/vault-gdrive-sync.sh --path "$(pwd)"
```
- Syncs the current working folder between Vault and Google Drive
- Large media (videos, raw images, WAV, etc.) stays on Google Drive only
- Small media (JPG, PNG, MP3, PDF) syncs normally
- If CWD is outside Vault/GDrive, skip silently

**8b. Sync Endless Winning Agency folder:**
```bash
/Users/troybrave/.claude/skills/daily-sync/ew-sync.sh
```
- Syncs the EW Agency business folder specifically
- Skip if the vault-gdrive-sync already covered this path

**Behavior:**
- Runs automatically (no user prompt needed)
- Bi-directional sync — newer files win
- If Google Drive is disconnected, warn but don't fail the EOD process

**Output:**
```
🔄 Syncing working directory to Google Drive...
✅ Vault ↔ GDrive sync complete (media excluded from vault)
🔄 Syncing Endless Winning Agency...
✅ EW sync complete
```

**If sync fails:**
```
⚠️ Google Drive sync failed (Drive may be disconnected)
   All other EOD tasks completed. Run sync manually later:
   /Users/troybrave/.claude/scripts/vault-gdrive-sync.sh --path "<working-dir>"
   /Users/troybrave/.claude/skills/daily-sync/ew-sync.sh
```

### Step 9: Report Results

Display to user:
```
✅ End-of-Day Review Complete

📁 Sessions Reviewed: [count]
   - [session-name-1.md]
   - [session-name-2.md]

✅ Notion Tasks Created:
   - [X] completed tasks (logged for tracking)
   - [Y] pending tasks (ready for tomorrow)

📧 Summary email sent to troybrave@gmail.com

🔄 Google Drive synced

Tasks by Company:
   - Troy/Personal: [count]
   - Endless Winning: [count]
   - [etc.]
```

---

## Quality Checklist

- [ ] All session files for today were read
- [ ] Completed work extracted and logged to Notion as "Completed"
- [ ] Pending work extracted and logged to Notion as "Not Started"
- [ ] Company/client relations correctly detected
- [ ] Time assigned based on complexity
- [ ] Calendar events included in email
- [ ] Email sent successfully
- [ ] Google Drive sync executed (or warned if failed)
- [ ] Summary displayed to user

---

## Error Handling

| Error | Response |
|-------|----------|
| No session files for today | Report "No session files found for today. Nothing to review." and skip |
| Notion API fails | Log error, continue with other tasks, report failures at end |
| Email send fails | Save email content to `/tmp/eod-summary-YYYY-MM-DD.md` as backup |
| Calendar CLI fails | Skip calendar section, note in email "Calendar unavailable" |
| Unknown company in session | Default to Troy personal (`099c618e-d42b-4074-b710-8bc140f41ce5`) |
| Google Drive sync fails | Warn user, continue - all other EOD work is complete |

---

## Dry Run Mode

If user says "dry run" or "preview":
1. Complete Steps 1-3 (gather and analyze)
2. Display what WOULD be created (tasks, email)
3. DO NOT create Notion tasks
4. DO NOT send email
5. Ask for confirmation before proceeding

---

## Edge Cases

**No completed work**: Skip Step 4, note in email "No completed tasks today"

**No pending work**: Skip Step 5, note in email "No pending action items"

**Session file missing frontmatter**: Extract project from filename (e.g., `taskaroo-meeting-notes.md` → project: "Taskaroo")

**Multiple sessions, same project**: Group tasks by project in email, create separate Notion tasks

**Very long session file**: Focus on "What Got Done" and "What's Next" sections; skip transcript details
