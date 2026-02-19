---
name: pdf-to-markdown
description: Converts PDFs to word-for-word Markdown. Use when user says "convert PDF to Markdown", "make Markdown of this PDF", "extract PDF to .md", or provides a PDF path for conversion. Handles books of any size, scanned or native text, with optional images.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, AskUserQuestion
---

# PDF to Markdown Converter

Converts PDFs of any size to accurate, well-formatted Markdown files with proper headings, formatting, and optional image extraction.

---

## Pre-Flight Checks

Before starting conversion:

1. **Verify PDF exists** at the provided path
2. **Check file size** using `pdfinfo` to determine page count
3. **Detect PDF type** (native text vs. scanned/image-based)

```bash
# Get PDF info
pdfinfo "/path/to/file.pdf"

# Test if native text (if output is mostly empty, it's scanned)
pdftotext -f 1 -l 3 "/path/to/file.pdf" - | head -100
```

---

## Step 1: Ask About Image Handling

Use AskUserQuestion to ask:

```
How should images be handled for this PDF?

1. **Text only** - No images, just the text content
2. **With images** - Extract images and embed them in the Markdown
3. **Both versions** - Create two files: one text-only, one with images
```

---

## Step 2: Gather PDF Information

```bash
# Get page count and metadata
pdfinfo "/path/to/file.pdf"
```

Store:
- Total page count
- PDF title (if available)
- Whether it's native text or scanned

---

## Step 3: Determine Processing Strategy

### For Native Text PDFs (has selectable text)

Use `pdftotext` with layout preservation:

```bash
# Extract with layout preservation
pdftotext -layout "/path/to/file.pdf" "/path/to/file_raw.txt"
```

Then read the raw text and convert to Markdown with proper formatting.

### For Scanned PDFs (image-based, no selectable text)

Use Claude's vision capability in batches:

1. Convert PDF pages to images (batch of 8-12 pages)
2. Read images with Claude's Read tool
3. Extract text with formatting instructions
4. Combine batches with proper line breaks

```bash
# Create temp directory for page images
mkdir -p "/tmp/pdf_conversion_$(basename '/path/to/file.pdf' .pdf)"

# Convert specific page range to images (adjust range as needed)
pdftoppm -png -f 1 -l 10 "/path/to/file.pdf" "/tmp/pdf_conversion_name/page"
```

**Batch Processing for Large Scanned PDFs:**
- Process 8-12 pages per batch (smaller batches = better accuracy)
- For a 300-page book: ~25-30 batches
- Save each batch's output to a temp file
- Combine all batches at the end with explicit blank lines between

**Vision Extraction Best Practices:**

When reading scanned pages with the Read tool, provide these instructions:

```
Please transcribe this page exactly as written, preserving:
- All text word-for-word
- Paragraph breaks
- Any headings or section titles (note them clearly)
- Scripture references in their exact format
- Bold/italic emphasis where visible
- Any bullet points or numbered lists

If any text is unclear or hard to read, make your best interpretation
and note uncertain words in [brackets].
```

**Quality Tips for Vision Extraction:**
1. Read each page image carefully - rushed extraction introduces errors
2. Pay special attention to:
   - Names (especially proper nouns, authors, philosophers)
   - Scripture references (chapter:verse format)
   - Technical/theological terms
3. If a word looks wrong in context, it probably is - verify with surrounding sentences
4. Old scans (2010 and earlier) often have lower quality - use smaller batch sizes

---

## Step 4: Extract Images (If Requested)

```bash
# Create images folder next to PDF
mkdir -p "/path/to/file_images"

# Extract all images from PDF
pdfimages -png "/path/to/file.pdf" "/path/to/file_images/img"
```

This creates files like `img-000.png`, `img-001.png`, etc.

---

## Step 5: Convert to Markdown

### Critical: Batch Boundary Handling

When processing scanned PDFs in batches, ensure clean transitions:

1. **End each batch at a natural break** - Complete paragraph, end of section, or sentence
2. **Start new batch with context** - Reference the last paragraph from previous batch to maintain flow
3. **Add explicit line breaks** - Always end batch output with `\n\n` to prevent text running together
4. **Verify continuity** - Check that sentences don't get cut mid-word or mid-thought

**Common Batch Boundary Issues:**
- Text running together: `"...end of paragraph.Start of next..."` (missing space/newline)
- Duplicated content: Same sentence appearing at end of batch N and start of batch N+1
- Lost context: New batch doesn't continue the thought properly

### Formatting Rules

Apply these transformations to the extracted text:

| PDF Element | Markdown Output |
|-------------|-----------------|
| Chapter titles | `# Chapter Title` |
| Section headers | `## Section` or `### Subsection` |
| Bold text | `**bold**` |
| Italic text | `*italic*` |
| Underlined text | `<u>underlined</u>` (or skip if not critical) |
| Bullet lists | `- item` |
| Numbered lists | `1. item` |
| Block quotes | `> quote text` |
| Page breaks | `---` with optional `<!-- Page X -->` comment |
| Footnotes | `[^1]` with `[^1]: footnote text` at bottom |

### Structure Detection

Look for these patterns to identify structure:

- **Chapter markers:** "Chapter 1", "CHAPTER ONE", Roman numerals (I, II, III)
- **Part markers:** "Part 1", "PART ONE"
- **Section breaks:** Extra whitespace, centered text, decorative elements
- **Headers:** ALL CAPS lines, larger font indicators, bold standalone lines

### Heading Hierarchy

```markdown
# Book Title (if identifiable)

## Part I: Part Title (if book has parts)

### Chapter 1: Chapter Title

#### Section Heading

##### Subsection

###### Minor heading
```

---

## Step 6: Image Embedding (If Requested)

For versions with images, embed extracted images at appropriate locations:

```markdown
![Description of image](file_images/img-000.png)
```

**Image Placement Strategy:**
- Note image positions during text extraction
- Insert image references where they logically belong in the flow
- Add descriptive alt text based on context

---

## Step 7: Assembly and Output

### Output Files

Place in same folder as source PDF:

| Scenario | Output |
|----------|--------|
| Text only | `filename.md` |
| With images | `filename.md` + `filename_images/` folder |
| Both versions | `filename.md` (text) + `filename_with_images.md` + `filename_images/` |

### Final File Structure

```markdown
# [Book/Document Title]

> Converted from: original-filename.pdf
> Pages: [X] | Converted: [Date]

---

## [Chapter/Section 1]

[Content...]

---
<!-- Page 2 -->

[Content continues...]
```

---

## Step 8: Second-Pass Verification (Scanned PDFs Only)

**This step is critical for achieving 90%+ accuracy on scanned PDFs.**

After the initial extraction, perform a targeted re-read of uncertain sections before finalizing.

### 8a: Build the Glossary

During first-pass extraction, track:

```
GLOSSARY (build as you extract):
- Names: [list all proper nouns found]
- Scripture refs: [list all Bible references]
- Technical terms: [domain-specific vocabulary]
- Recurring phrases: [frequently used expressions]
```

### 8b: Identify Inconsistencies

After combining all batches, scan for:

1. **Name inconsistencies**: Same person spelled differently
   - Example: "Hagel" (1x) vs "Hegel" (10x) → likely "Hegel" is correct

2. **Scripture reference anomalies**:
   - Incomplete refs: "Romans 5:" without verse
   - Unlikely refs: "Genesis 50:99" (chapter 50 only has 26 verses)

3. **Sentences that don't parse**:
   - Read each paragraph - if meaning is unclear, flag for re-read

### 8c: Re-Read Flagged Sections

For each flagged issue:

1. **Identify the source page** from the batch that produced it
2. **Re-read that specific page image** with focused attention:

```
I need to verify specific text on this page. Please look carefully at:
- [describe the location: "middle of page", "third paragraph", etc.]
- The word/phrase in question appears to be: "[uncertain text]"

Please read that section very carefully and tell me exactly what it says.
```

3. **Correct the Markdown** with the verified text

### 8d: Consistency Pass

After fixing individual issues, do a final consistency check:

```bash
# Find all unique capitalized words (potential names)
grep -oE '\b[A-Z][a-z]+\b' output.md | sort | uniq -c | sort -rn | head -50
```

- Any name appearing only 1-2 times when similar names appear 10+ times is suspect
- Cross-reference against the glossary built during extraction

### When to Skip This Step

- Native text PDFs (pdftotext worked) - skip, accuracy is already high
- Very short documents (<10 pages) - quick manual review is faster
- User explicitly requests speed over accuracy

---

## Step 9: Quality Verification & Post-Processing

After conversion, perform a thorough quality review:

### Automated Checks

- [ ] All pages accounted for (compare page count)
- [ ] Chapter structure preserved
- [ ] Images extracted (if requested)
- [ ] Markdown renders correctly

### Manual Quality Review (CRITICAL)

Scan the output for these common issues:

#### 1. OCR Artifacts & Garbled Text

Look for nonsensical text patterns that indicate poor scan quality or OCR errors:

**Examples from real conversions:**
```
BAD:  "Lying blind in the heart tragedy that man in the reason for Sin Consciousness"
GOOD: "Living blind to the heart tragedy, that man is the reason for Sin Consciousness"

BAD:  "Ie is perfectly righteous"
GOOD: "He is perfectly righteous"

BAD:  "Hagel"
GOOD: "Hegel" (philosopher name)
```

**How to spot:**
- Sentences that don't make grammatical sense
- Random capitalization mid-sentence
- Words that look similar but wrong (Ie/He, Hagel/Hegel, striped/stripped)
- Missing spaces or extra spaces
- Characters like `|`, `}`, `{` appearing in normal text

**Fix strategy:**
1. Read surrounding context to understand intended meaning
2. Use the Read tool to re-examine the original page image if uncertain
3. Make the minimum correction needed for accuracy

#### 2. Batch Boundary Issues

Search for these patterns that indicate batch join problems:
- Missing blank lines between paragraphs (text running together)
- Duplicated sentences at batch boundaries
- Abrupt topic changes mid-paragraph

**Search for:** Lines that end without punctuation followed immediately by capitalized words

#### 3. Scripture & Quote Verification

Religious texts especially need verification:
- Scripture references should be complete (e.g., "Romans 5:17" not "Romans 5:1")
- Quoted passages should maintain proper quotation marks
- Chapter:verse format should be consistent

#### 4. Common OCR Misreads

| Scanned As | Usually Means |
|------------|---------------|
| `rn` | `m` |
| `cl` | `d` |
| `1` | `l` or `I` |
| `0` | `O` |
| `vv` | `w` |
| `ii` | `u` |

### Quality Score Assessment

Rate the conversion:
- **95-100%**: Near-perfect, only 1-2 minor typos
- **85-94%**: Good, a few OCR errors that don't impede understanding
- **70-84%**: Acceptable, noticeable errors but content is readable
- **Below 70%**: Needs significant manual cleanup

### Report to User

Provide:
- Total pages processed
- Chapters/sections detected
- Images extracted (count)
- Output file location(s)
- **Quality assessment** with specific examples of any issues found
- **Recommendations** for manual review sections if needed

---

## Batch Processing Script (For Large PDFs)

For PDFs over 50 pages, use this approach:

```bash
# Get total pages
TOTAL_PAGES=$(pdfinfo "$PDF_PATH" | grep "Pages:" | awk '{print $2}')

# Process in batches of 20
BATCH_SIZE=20
for ((start=1; start<=TOTAL_PAGES; start+=BATCH_SIZE)); do
    end=$((start + BATCH_SIZE - 1))
    if [ $end -gt $TOTAL_PAGES ]; then
        end=$TOTAL_PAGES
    fi

    echo "Processing pages $start to $end..."
    pdftotext -f $start -l $end -layout "$PDF_PATH" "/tmp/batch_${start}.txt"
done
```

Then read and process each batch, maintaining context between batches for proper formatting.

---

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| `pdftotext` returns empty | Scanned PDF | Switch to vision-based extraction |
| `pdfinfo` fails | Corrupted or encrypted PDF | Ask user to provide unencrypted version |
| Image extraction fails | No embedded images | Note in output, continue with text |
| Context limit during vision | Too many pages in batch | Reduce batch size to 10-15 pages |
| Garbled text output | Complex layout or fonts | Try `-raw` mode instead of `-layout` |
| Poor scan quality | Old/faded document | Use smaller batch size (5-8 pages) for more careful reading |
| Inconsistent formatting | Multiple scan sessions | Note in output, may need manual cleanup |

---

## Special Cases

### Two-Column Layouts

```bash
# Use raw mode which handles columns better
pdftotext -raw "/path/to/file.pdf" output.txt
```

### PDFs with Headers/Footers

- Identify repeating text at top/bottom of pages
- Strip these during processing
- Common patterns: page numbers, chapter titles, author names

### Table of Contents

- Preserve as a navigable list
- Convert to Markdown links if generating anchors:
  ```markdown
  - [Chapter 1: Introduction](#chapter-1-introduction)
  ```

---

## Cleanup

After successful conversion:

```bash
# Remove temp files
rm -rf "/tmp/pdf_conversion_*"
```

Keep the images folder if images were requested.
