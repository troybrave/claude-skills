---
name: youtube-transcript
description: Download YouTube video transcripts when user provides a YouTube URL or asks to download/get/fetch a transcript from YouTube. Also use when user wants to transcribe or get captions/subtitles from a YouTube video.
allowed-tools: Bash,Read,Write,AskUserQuestion
---

# YouTube Transcript Downloader

Extract transcripts (subtitles/captions) from YouTube videos using yt-dlp.

## When to Activate

User provides YouTube URL and wants:
- Transcript/subtitles/captions
- Text content from video
- To transcribe a video

## Workflow

### 1. Validate YouTube URL

Ensure URL matches pattern: `https://(www\.)?youtube\.com/watch\?v=[\w-]{11}` or `https://youtu\.be/[\w-]{11}`

**If invalid**: Inform user and request correct YouTube URL.

### 2. Check yt-dlp Installation

```bash
which yt-dlp
```

**If not found**, install automatically:
- macOS: `brew install yt-dlp`
- Linux: `pip3 install -U yt-dlp`

**If install fails**: Tell user to manually install from https://github.com/yt-dlp/yt-dlp

### 3. Download Transcript

**Try auto-generated subtitles first** (fastest, almost always available):

```bash
cd /tmp && yt-dlp --write-auto-sub --skip-download --sub-lang en --convert-subs srt --output "yt_temp_%(id)s" "YOUTUBE_URL"
```

**If auto-subs fail**, try manual subtitles:

```bash
cd /tmp && yt-dlp --write-sub --skip-download --sub-lang en --convert-subs srt --output "yt_temp_%(id)s" "YOUTUBE_URL"
```

**If both fail**: Inform user no subtitles available for this video.

### 4. Get Video Title (for filename)

```bash
yt-dlp --print "%(title)s" "YOUTUBE_URL"
```

Sanitize title for filesystem:
- Replace `/` → `_`
- Replace `:` → `-`
- Remove `?`, `"`, `*`, `<`, `>`, `|`
- Limit to 100 characters

### 5. Convert to Markdown

**First, ensure output directory exists:**
```bash
mkdir -p "/Users/troybrave/Downloads/Youtube Transcripts"
```

**Then convert with Python:**
- Add video title as H1 header
- Add YouTube URL
- Remove SRT timestamps
- Strip duplicate lines (YouTube auto-subs repeat)
- Remove HTML tags
- Decode HTML entities

```bash
python3 << 'EOF'
import re

# Read video title and URL (from previous steps)
video_title = "VIDEO_TITLE_HERE"
video_url = "YOUTUBE_URL_HERE"
output_file = "/Users/troybrave/Downloads/Youtube Transcripts/SANITIZED_TITLE.md"

with open(output_file, 'w', encoding='utf-8') as out:
    # Write markdown header
    out.write(f"# {video_title}\n\n")
    out.write(f"**Source:** {video_url}\n\n")
    out.write("---\n\n")

    # Process transcript
    seen = set()
    with open('/tmp/SUBTITLE_FILE.srt', 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            # Skip timestamps and sequence numbers
            if not line or line.isdigit() or '-->' in line:
                continue
            # Clean HTML
            clean = re.sub(r'<[^>]+>', '', line)
            clean = clean.replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>')
            # Deduplicate and write
            if clean not in seen:
                out.write(clean + '\n\n')
                seen.add(clean)

print(f"Saved to: {output_file}")
EOF
```

### 6. Cleanup

Remove temporary files:
```bash
rm /tmp/yt_temp_*.srt
```

### 7. Confirm Success

Show user:
- File saved location
- File size
- First 5 lines preview

## Error Handling

**URL validation fails**: Request valid YouTube URL
**yt-dlp not found**: Auto-install or provide manual instructions
**No subtitles available**: Inform user (don't attempt audio download/transcription)
**Download fails**: Show yt-dlp error, check if video is private/restricted
**Conversion fails**: Provide raw SRT file instead

## Security Notes

- Validate URL format before passing to shell
- Sanitize video title to prevent path traversal
- Work in /tmp to isolate operations
- Limit filename length to prevent filesystem issues
- Never execute user-provided content

## Output Format

Markdown file with:
- Video title as H1 header
- YouTube URL as metadata
- One line per subtitle segment
- Duplicates removed
- No timestamps
- Clean, readable text

Saved to: `/Users/troybrave/Downloads/Youtube Transcripts/{sanitized_video_title}.md`
