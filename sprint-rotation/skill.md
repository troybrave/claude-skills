---
name: sprint-rotation
description: Rotates sprint statuses in Notion Master Cycles every Tuesday at 1 AM EST. Blocks execution until current sprint ends.
---

# Sprint Rotation Skill

Rotates sprint statuses in the Master Cycles Notion database.

## What It Does

- **Sprint Rotation**: `Last → Past | Current → Last | Next → Current | Future[0] → Next`
- **Auto Task Rollover**: Incomplete tasks from Last sprint move to Current automatically
- **Move To Next Week**: Tasks flagged with `Cycle Helper = "Move To Next Week"` advance one week

## Token

Stored in `.env` file (auto-loaded):
```
/Users/troybrave/.claude/skills/sprint-rotation/.env
```

## Commands

```bash
cd /Users/troybrave/.claude/skills/sprint-rotation

node rotate-sprints.cjs status          # Check status
node rotate-sprints.cjs dry-run         # Preview rotation
node rotate-sprints.cjs rotate          # Execute rotation
node rotate-sprints.cjs rotate --force  # Force (bypass checks)
node rotate-sprints.cjs rollback        # Rollback
node rotate-sprints.cjs rollover        # Move incomplete tasks Last→Current
node rotate-sprints.cjs rollover --dry-run
node rotate-sprints.cjs move-next       # Move flagged tasks to next week
node rotate-sprints.cjs move-next --dry-run
```

## Exit Codes

0=Success, 1=Error, 2=Not Tuesday, 4=Invalid state, 5=Sprint hasn't ended

## Railway

- **Cron**: `0 6 * * 2` (6 AM UTC = 1 AM EST Tuesday)
- **Command**: `node rotate-sprints.cjs rotate`
