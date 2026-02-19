---
name: transcript-processor
description: Downloads transcripts from Zoom/Google Drive, renames them intelligently based on content, organizes into appropriate folders, and generates Fireflies-style summaries. Use when syncing meeting recordings, organizing transcripts, or processing meetings.
allowed-tools: Read, Write, AskUserQuestion, Grep, Glob, Bash
---

# Zoom Transcript Workflow

**Automated pipeline: Zoom Cloud → Local → Organized → Google Drive**

## When to Activate

User says:
- "Process my Zoom recordings"
- "Sync my Zoom meetings"
- "Download and organize my meeting transcripts"
- "Summarize recent meetings"
- "Run zoom workflow"

## ⚡ MANDATORY WORKFLOW - EXECUTE ALL STEPS

| Step | Action | Details |
|------|--------|---------|
| 1 | **Sync from Zoom Cloud** | Downloads VTT, MP4, creates transcript.md, saves participants |
| 2 | **Generate Summary** | Writes summary.md (Goldilocks format) |
| 3 | **Create Airtable Tasks** | Tasks for Troy/Matt from action items |
| 4 | **Rename Folder** | Based on content (client, topic, type) |
| 5 | **Classify Recording** | Determine: Personal, Ministry, or Business |
| 6 | **Route to Destination** | **Read `folder-routing.md`** for exact path mapping |
| 7 | **Move to Proper Location** | Use path from routing file |
| 8 | **Sync to Google Drive** | Mirrors to Drive |
| 8.5 | **Share with Participants** | If external emails in participants.json, share Drive folder |
| 9 | **Delete from Zoom Cloud** | After Drive sync confirmed |

**DO NOT SKIP ANY STEPS** - Execute the full workflow automatically.

**IMPORTANT:** Before Step 6, read `/Users/troybrave/.claude/skills/transcript-processor/folder-routing.md` to determine the exact destination path based on classification signals.

---

## Folder Structure

**All recordings go to the centralized `z - Meeting Recordings/` folder.**

| Category | Path Pattern |
|----------|--------------|
| **Personal** | `z - Meeting Recordings/Personal/YYYY/MM-Mon/` |
| **Ministry** | `z - Meeting Recordings/Ministry/[Org]/YYYY/MM-Mon/` |
| **Business** | `z - Meeting Recordings/Business/[Entity]/YYYY/MM-Mon/` |

**Month format:** `12-Dec`, `01-Jan`, `02-Feb`, etc.

**Examples:**
- `z - Meeting Recordings/Personal/2025/12-Dec/`
- `z - Meeting Recordings/Ministry/Mighty Men/2025/12-Dec/`
- `z - Meeting Recordings/Ministry/Brave Life/2025/12-Dec/`
- `z - Meeting Recordings/Business/Taskaroo/2025/12-Dec/`
- `z - Meeting Recordings/Business/MX Detail/2025/12-Dec/`

---

## Step 1: Sync from Zoom Cloud

```bash
/Users/troybrave/.claude/.CLI/zoom-transcript-sync/sync-transcripts.cjs
```

**Downloads to:** `/Users/troybrave/Documents/Projects/Full Vault/z - Meeting Recordings/_Inbox/`

**Files created per recording:**
- `recording.vtt` - Raw Zoom transcript
- `recording.mp4` - Video (if available)
- `transcript.md` - Clean readable transcript
- `participants.json` - Attendee data

---

## Step 2: Generate Summary

Use the `meeting-summary` skill to generate `summary.md` from `transcript.md`.

The skill provides:
- Evidence-anchored decisions and action items (with timestamps + quotes)
- WHO + WHAT + WHEN for every action (with fallbacks)
- Meeting type detection (Sales, Team, 1:1, Interview, General)
- Risks/blockers extraction
- Quality gate checklist

---

## Step 3: Create Airtable Tasks

```bash
# Dry run first
node /Users/troybrave/.claude/.CLI/zoom-transcript-sync/create-meeting-tasks-airtable.cjs "/path/to/meeting-folder" --dry-run

# Create tasks
node /Users/troybrave/.claude/.CLI/zoom-transcript-sync/create-meeting-tasks-airtable.cjs "/path/to/meeting-folder"
```

**Creates tasks in:** Operations Base > Tasks table
**Status:** "Meeting Task" (for review before scheduling)
**Only creates tasks for Troy and Matt** - other assignees are skipped.

---

## Step 4: Rename Folder

Based on content analysis, rename from generic to descriptive:

**Before:** `25-12-06 | Voice Note`
**After:** `25-12-06 | Spanish Practice & Joshua Study`

**Naming format:** `YY-MM-DD | [Descriptive Title]`

---

## Step 5: Classify Recording

Analyze transcript to determine category:

| Category | Detection Signals |
|----------|-------------------|
| **Personal** | Solo recording, Spanish practice, family, casual notes |
| **Ministry - Mighty Men** | Testimony, prayer, Timothy, men's group |
| **Ministry - Brave Life** | Sermon, church, preaching, ministry planning |
| **Business - Taskaroo** | Jeff, Sergio, job creation, leads, GHL, platform |
| **Business - MxDetail** | Detailing, cars, quotes, clients |
| **Business - Other** | Other client names, business discussion |

**If uncertain:** See `folder-routing.md` for fallback rules (NEVER block - use `_Unknown` if needed).

---

## Step 6: Route to Destination

**Read the routing file to determine exact path:**

```bash
# Reference file with all category → path mappings
/Users/troybrave/.claude/skills/transcript-processor/folder-routing.md
```

The routing file contains:
- Detection signals for each category (Personal, Ministry, Business)
- Exact path patterns for each client/organization
- Decision tree for classification
- Folder naming conventions

**Use this file to determine the exact destination path before moving.**

---

## Step 7: Move to Proper Location

```bash
# Create target directory (path from routing file)
mkdir -p "/Users/troybrave/Documents/Projects/Full Vault/z - Meeting Recordings/[Category]/[Entity]/YYYY/MM-Mon/"

# Move entire folder
mv "/path/to/_Inbox/meeting-folder" "/path/to/target/"
```

**Quick Reference (see folder-routing.md for complete list):**

| Category | Base Path |
|----------|-----------|
| Personal | `z - Meeting Recordings/Personal/` |
| Ministry - Mighty Men | `z - Meeting Recordings/Ministry/Mighty Men/` |
| Ministry - Brave Life | `z - Meeting Recordings/Ministry/Brave Life/` |
| Ministry - River Finland | `z - Meeting Recordings/Ministry/River Finland/` |
| Business - Endless Winning | `z - Meeting Recordings/Business/Endless Winning/` |
| Business - Taskaroo | `z - Meeting Recordings/Business/Taskaroo/` |
| Business - Other Client | `z - Meeting Recordings/Business/[Client]/` |

---

## Step 8: Sync to Google Drive

```bash
node /Users/troybrave/.claude/.CLI/zoom-transcript-sync/sync-to-drive.cjs --meeting "/path/to/meeting"
```

**Drive location:** `/Users/troybrave/Library/CloudStorage/GoogleDrive-troy@endlesswinning.com/My Drive/Meeting Recordings/`

---

## Step 8.5: Share with Participants

**If participants.json contains external email addresses**, share the Drive folder with them:

```bash
# Get folder ID from Drive sync output, then share with participant emails
node /Users/troybrave/.claude/.CLI/gdrive-cli/share-folder.cjs <folder-id> participant1@email.com participant2@email.com
```

**Logic:**
1. Read `participants.json` from meeting folder
2. Filter out internal emails (@endlesswinning.com, @taskaroo.com, @fortisentities.com)
3. Share folder with remaining external participants
4. Skip this step if no external participants

---

## Step 9: Delete from Zoom Cloud

**Only after confirming Drive sync succeeded:**

```bash
node /Users/troybrave/.claude/.CLI/zoom-transcript-sync/delete-all-cloud.cjs --force
```

**Safety:** Only deletes recordings that have been successfully downloaded.

---

## Optional Steps

### Share Folder (only if requested)

```bash
# Share with specific emails
node /Users/troybrave/.claude/.CLI/gdrive-cli/share-folder.cjs <folder-id> email@example.com

# Make public
node /Users/troybrave/.claude/.CLI/gdrive-cli/share-folder.cjs <folder-id> --public
```

### Email Participants (only if requested)

```bash
# Preview
node /Users/troybrave/.claude/.CLI/zoom-transcript-sync/send-meeting-email.cjs "/path/to/meeting" --preview

# Send
node /Users/troybrave/.claude/.CLI/zoom-transcript-sync/send-meeting-email.cjs "/path/to/meeting" --send
```

---

## Quick Reference Commands

| Action | Command |
|--------|---------|
| Sync Zoom | `/Users/troybrave/.claude/.CLI/zoom-transcript-sync/sync-transcripts.cjs` |
| List recordings | `/Users/troybrave/.claude/.CLI/zoom-transcript-sync/list-recordings.cjs --days 30` |
| Create tasks | `node .../create-meeting-tasks-airtable.cjs "/path"` |
| Sync to Drive | `node .../sync-to-drive.cjs --meeting "/path"` |
| Delete cloud | `node .../delete-all-cloud.cjs --force` |

---

## Classification Examples

**Spanish practice + Bible study (solo)**
→ Personal → `z - Meeting Recordings/Personal/2025/12-Dec/`

**Mighty Men testimony meeting**
→ Ministry → `z - Meeting Recordings/Ministry/Mighty Men/2025/12-Dec/`

**Taskaroo dev meeting with Jeff**
→ Business → `z - Meeting Recordings/Business/Taskaroo/2025/12-Dec/`

**EW Founders call with Matt Wood**
→ Business → `z - Meeting Recordings/Business/Endless Winning/2025/12-Dec/`

**Discovery call with new prospect**
→ Business → `z - Meeting Recordings/Business/[Prospect Name]/2025/12-Dec/`

---

## Success Criteria

✅ All recordings downloaded (VTT + MP4)
✅ Summaries created (Goldilocks format)
✅ Airtable tasks created for Troy/Matt
✅ Folders renamed descriptively
✅ Routing determined from `folder-routing.md`
✅ Files moved to correct category/organization/year/month
✅ Synced to Google Drive
✅ Shared with external participants (if applicable)
✅ Deleted from Zoom cloud (after sync)

---

**Remember:** Execute the FULL workflow. Don't stop after sync and ask what to do next.
