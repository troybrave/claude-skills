---
name: daily-sync
description: Bulletproof bi-directional sync between local ventures and Google Drive with zero data loss guarantee
---

# Daily Sync Skill

Sync Endless Winning Agency files between Obsidian vault and Google Drive.

## The Simple Script (Recommended)

**Single file, 75 lines, impossible to break:**

```bash
# Preview what would sync
/Users/troybrave/.claude/skills/daily-sync/ew-sync.sh --dry-run

# Actually sync (bi-directional, newer wins)
/Users/troybrave/.claude/skills/daily-sync/ew-sync.sh

# One-way sync options
/Users/troybrave/.claude/skills/daily-sync/ew-sync.sh --to-gdrive
/Users/troybrave/.claude/skills/daily-sync/ew-sync.sh --to-local
```

**Paths are defined at the TOP of the script.** If folders move, edit them there.

## How It Works

1. Validates both paths exist (fails fast if not)
2. Uses `rsync` (battle-tested, built into macOS)
3. Bi-directional: newer file wins
4. Progress shown during sync

## When It Fails

If Google Drive is disconnected or paths are wrong, you'll see:

```
✗ GDRIVE path does not exist
  Is Google Drive app running? Is troy@endlesswinning.com signed in?
SYNC ABORTED
```

**Fix:** Open Google Drive app, sign in, try again.

## Legacy Complex System (Still Available)

The old multi-file system with rollback capability:

```bash
# Full sync with all safety checks
/Users/troybrave/.claude/skills/daily-sync/sync-ventures.sh --dry-run

# Health check
/Users/troybrave/.claude/skills/daily-sync/health-check.sh
```

## When to Invoke

When user asks to:
- "sync my files"
- "sync to Google Drive"
- "backup my work"
- "sync Endless Winning"
