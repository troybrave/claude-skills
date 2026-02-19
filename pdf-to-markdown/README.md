# PDF to Markdown

Converts PDFs of any size to accurate, well-formatted Markdown — handles both native text and scanned/image-based documents.

## What It Does

- Detects whether a PDF has selectable text or is scanned
- Extracts text with proper heading hierarchy, formatting, and structure
- Optionally extracts and embeds images
- Handles books of any length with batch processing
- Includes a second-pass verification step for scanned PDFs

## Features

- **Native text PDFs**: Uses `pdftotext` for fast, accurate extraction
- **Scanned PDFs**: Uses Claude's vision to OCR page images in batches
- **Image extraction**: Optional — extract and embed images in Markdown
- **Quality scoring**: Rates conversion accuracy (95-100%, 85-94%, etc.)
- **Large book support**: Batch processing for 300+ page books

## Installation

1. Copy the `pdf-to-markdown/` folder into `~/.claude/skills/`
2. Install system dependencies:

```bash
# macOS
brew install poppler

# Ubuntu/Debian
sudo apt-get install poppler-utils
```

## Usage

```
/pdf-to-markdown
```

Or provide a PDF path: "Convert this PDF to Markdown: /path/to/file.pdf"

## Requirements

- [Claude Code](https://claude.ai/claude-code)
- `pdftotext` and `pdfinfo` (from Poppler)
- `pdfimages` (for image extraction, also from Poppler)
- `pdftoppm` (for scanned PDF conversion)

## Output

Files are saved alongside the source PDF:

| Scenario | Output |
|----------|--------|
| Text only | `filename.md` |
| With images | `filename.md` + `filename_images/` |
| Both versions | `filename.md` + `filename_with_images.md` + `filename_images/` |
