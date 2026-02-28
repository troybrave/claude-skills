# Transcript Processor Skill

**Bulletproof transcript processing with Fireflies-style AI summaries**

## Quick Start

```bash
# Process any transcript
python3 /Users/troybrave/.claude/skills/transcript-processor/process-transcript.py "/path/to/transcript.md"

# Or invoke via Claude Code
"Use transcript-processor to process [file]"
```

## What You Get

**Input:** Any transcript format (VTT, raw dialogue, structured Markdown)

**Output:** Two files in same directory as source

1. **`[name]-transcript.md`** - Clean, formatted full transcript
2. **`[name]-summary.md`** - Goldilocks summary (scannable in 30 seconds)

## The Goldilocks Summary Format

```markdown
# [Meeting Title]
**Date:** [Date]
**Participants:** [Names]

## 🔑 Keywords
[6 max - instant context]

## 📋 Overview
[2-3 sentences - what happened and why]

## 📌 Key Points
- **[Point]** - [One sentence context]
[3-7 bullets max]

## ✅ Action Items
- [ ] **[Owner]**: [Specific task]
[Checkbox format, ready to act]
```

**Why it works:**
- ✅ 30-second scan time
- ✅ Actionable (checkboxes ready)
- ✅ Zero fluff
- ✅ Goldilocks zone (enough to act, not overwhelming)

## AI-Powered Summaries

### Setup (One-Time)

The script uses Claude API for intelligent summaries. Two ways to enable:

**Option 1: Environment Variable** (Recommended)
```bash
# Add to ~/.zshrc or ~/.bash_profile
export ANTHROPIC_API_KEY="your-api-key-here"

# Reload shell
source ~/.zshrc
```

**Option 2: Claude Code** (Already Works!)
Since you're using Claude Code, the script will automatically use the same API access when invoked through the skill.

### Get Your API Key

1. Visit: https://console.anthropic.com/settings/keys
2. Create new key
3. Export as environment variable (see above)

### Fallback Behavior

**If API key not set:**
- Script uses template summary
- All formatting still works
- Manual review needed for specifics
- Note appears in summary

**Template includes:**
- Generic keywords
- Placeholder overview
- Basic structure
- Instructions for setup

## Supported Formats

### VTT (Zoom, Otter.ai)
```
00:00:00.000 --> 00:00:06.260
Speaker Name: Text here
```

### Raw Conversational
```
Troy Bravenboer: I'll send you a transcript.

Ps Tomi: Okay, yeah, whatever helps.
```

### Structured Markdown
```
# Meeting Title
## Section
- Points
```

**All auto-detected - no configuration needed!**

## Usage Examples

### Via Claude Code (Recommended)
```
You: "Process the Taskaroo meeting transcript from yesterday"

Claude: [Finds file, runs processor, shows summary]
```

### Direct Script Call
```bash
python3 /Users/troybrave/.claude/skills/transcript-processor/process-transcript.py \
  "/Users/troybrave/Documents/Projects/Full Vault/Business/Endless Winning Agency/Sub-Accounts/02 Active/Taskaroo/Strategy/Meeting-Notes/Transcriptions/251112 Job Profile.md"
```

### Batch Processing
```bash
# Process all transcripts in directory
for file in /path/to/transcripts/*.md; do
  python3 /Users/troybrave/.claude/skills/transcript-processor/process-transcript.py "$file"
done
```

## File Locations

**Skill:**
```
/Users/troybrave/.claude/skills/transcript-processor/
├── skill.md                    # Full instructions
├── process-transcript.py       # Processor script
└── README.md                   # This file
```

**Common transcript locations:**
```
/Users/troybrave/Documents/Projects/Full Vault/Business/Endless Winning Agency/Sub-Accounts/02 Active/[Client]/Strategy/Meeting-Notes/Transcriptions/
```

## Troubleshooting

### "API key not set"
→ Export ANTHROPIC_API_KEY environment variable (see Setup above)
→ Or use via Claude Code skill (automatic)

### "No speakers detected"
→ Script uses generic "Speaker 1", "Speaker 2" labels
→ Works fine, just less specific

### "Summary too generic"
→ Check API key is set and valid
→ Verify internet connection
→ Check file has meaningful content (not just timestamps)

### "Can't find transcript file"
→ Use absolute path, not relative
→ Check file exists: `ls -la /path/to/file`
→ Ask Claude Code to find it for you

## Integration

**Works with your existing tools:**

- **daily-sync**: Auto-sync processed transcripts to Google Drive
- **obsidian-vault-organizer**: Organize summaries in vault
- **sermon-publisher**: Process ministry transcriptions
- **calendar-cli**: Link summaries to calendar events

## The Philosophy

### Goldilocks Zone
**Too little:** Just bullets (no context)
**Too much:** Full paragraphs (can't scan)
**Just right:** One-sentence bullets with bold topics ✓

### Ruthless Conciseness
- Every word earns its place
- No corporate speak
- No filler
- Signal, not noise

### Actionable Intelligence
Goal: User can scan in 30 seconds and know:
1. What happened (Keywords + Overview)
2. What matters (Key Points)
3. What to do (Action Items)

## Examples

### Before (Raw VTT)
```
00:00:00.000 --> 00:00:06.260
Sergio Valentin: Let's walk through this...

00:00:06.690 --> 00:00:07.850
Sergio Valentin: Alright, so we want to discuss...
[5000 more lines with timestamps]
```

### After (Clean Transcript)
```markdown
# Job Profile Discussion
**Date:** November 12, 2025
**Participants:** Sergio Valentin, Troy Bravenboer, Jeff Cross

**Sergio Valentin:** Let's walk through this really quick. Alright, so we want to discuss deprecating leads.

**Sergio Valentin:** And bringing that on as a status of a job...
```

### After (AI Summary)
```markdown
# Job Profile Discussion
**Date:** November 12, 2025
**Participants:** Sergio Valentin, Troy Bravenboer, Jeff Cross

## 🔑 Keywords
leads, job-status, workflow, invoicing, quotes, deprecation

## 📋 Overview
Team discussed deprecating the Leads module and integrating lead functionality as job statuses. Decision made to implement 5-stage workflow with invoice status integration.

## 📌 Key Points
- **Leads deprecation** - Moving leads functionality into jobs as status
- **New job statuses** - 5 stages: New/Lead, Pending, Accepted, Completed, Canceled
- **Invoice integration** - Display invoice status directly on jobs table
- **Quote flexibility** - Multiple quotes per job, updates on acceptance
- **Dual workflow** - Path A (quote-first) or Path B (direct to job items)

## ✅ Action Items
- [ ] **Sergio**: Implement new job status workflow
- [ ] **Sergio**: Add invoice status column to jobs table
- [ ] **Troy**: Update job creation form to match lead form
- [ ] **Jeff**: Design multi-quote capability for jobs
```

**Scan time:** 30 seconds
**Action clarity:** Immediate
**Fluff:** Zero

## Updates & Maintenance

**Version:** 1.0.0
**Last Updated:** November 21, 2025
**Dependencies:**
- Python 3.x
- anthropic library (optional, for AI summaries)

**To update:**
```bash
cd /Users/troybrave/.claude/skills/transcript-processor
git pull  # If version-controlled
# Or re-run skill creation
```

## Support

**Questions?**
- Check skill.md for detailed instructions
- Ask Claude Code for help
- Test with sample transcript first

**Issues?**
- Verify Python 3 installed: `python3 --version`
- Check file permissions: `ls -la /path/to/transcript`
- Try with absolute path

---

**Remember:** The goal is actionable intelligence, not comprehensive documentation. When in doubt, cut more.
