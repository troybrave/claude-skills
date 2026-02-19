# Meeting Summary

Generate Fireflies-quality meeting summaries from transcripts with timestamps, action items, and decision tracking.

## What It Does

Paste a meeting transcript and get a structured summary with:
- Metadata (date, duration, participants, type)
- Keywords
- Key decisions with evidence quotes
- Action items with owners, deadlines, and timestamps
- Risks and blockers
- Discussion summary grouped by topic
- Key takeaways

## Quality Standards

| Rule | Requirement |
|------|-------------|
| Deterministic Names | Full names from the transcript — no ambiguous first-name-only references |
| Absolute ISO Dates | All deadlines in `YYYY-MM-DD` format — no "next Monday" |
| Total Timestamping | Every decision, action item, and risk anchored with `[HH:MM]` |
| Speaker Consistency | Participant names match action item owners exactly |

## Installation

1. Copy the `meeting-summary/` folder into `~/.claude/skills/`
2. The skill is automatically available in Claude Code

## Usage

```
/meeting-summary
```

Or paste a transcript and ask Claude to summarize it.

## Requirements

- [Claude Code](https://claude.ai/claude-code)
- A meeting transcript (text format)
