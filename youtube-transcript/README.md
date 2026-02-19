# YouTube Transcript

Downloads transcripts from YouTube videos and converts them to clean, readable Markdown files.

## What It Does

Give it a YouTube URL — it extracts the auto-generated or manual subtitles and saves a clean Markdown file with:
- Video title as heading
- Source URL
- Deduplicated, timestamp-free text
- HTML tags stripped

## Installation

1. Copy the `youtube-transcript/` folder into `~/.claude/skills/`
2. Install `yt-dlp`:

```bash
# macOS
brew install yt-dlp

# Linux
pip3 install -U yt-dlp
```

## Usage

```
/youtube-transcript
```

Or paste a YouTube URL: "Get the transcript from https://youtube.com/watch?v=..."

## Output

Markdown file saved to `~/Downloads/Youtube Transcripts/` (or your preferred directory):

```markdown
# Video Title

**Source:** https://youtube.com/watch?v=...

---

Transcript text here, one line per subtitle segment,
with duplicates removed and timestamps stripped...
```

## Requirements

- [Claude Code](https://claude.ai/claude-code)
- `yt-dlp` (auto-installed if missing)
- `python3`

## Supported URLs

- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
