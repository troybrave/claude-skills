---
name: book-to-reference
description: Converts books (EPUB, MOBI, PDF) into a 3-file reference library. Use when user says "convert book", "book to reference", "epub to markdown", "mobi to markdown", "create reference from book", or provides a book file for conversion. NOT for single-file PDF extraction (use pdf-to-markdown instead).
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, AskUserQuestion, Task
---

# Book to Reference Converter

Converts any book file (EPUB, MOBI, or PDF) into a standardized 3-file reference library format with Complete text, extracted Frameworks, and a project-tailored Quick Reference guide.

---

## ⛔ KNOWN FAILURE MODES (READ FIRST)

These failures have happened before. Do not repeat them.

| Failure | What Happened | Prevention |
|---------|---------------|------------|
| **Delivered 15% complete book** | Processed only a few chapters, generated all 3 files, declared "complete" | ALWAYS run Step 11 COMPLETENESS GATE. TEXT must be 100% word-perfect. Images may be missing (use placeholders). |
| **Skipped batch verification** | Batching plan had 10 batches, only 2 completed, but proceeded to assembly anyway | Before assembly, COUNT .batch-*.md files vs expected batches in plan |
| **No expected count recorded** | Couldn't verify completeness because expected chapter count wasn't recorded in Step 4e | ALWAYS record expected chapters to .conversion-plan.md in Step 4e |
| **Context exhausted mid-conversion** | Tried to hold too much in memory, ran out of context, lost work | Write .batch-{NNN}.md after EVERY batch. Never hold >1 batch in memory. |
| **Summarized instead of verbatim** | LLM interpreted/condensed content instead of pure mechanical extraction | Use MECHANICAL HTML-to-Markdown only. NEVER paraphrase, summarize, or interpret. Every word from source must appear in output. |
| **Manual read instead of pandoc** | Read HTML files one-by-one with Read tool, hit context limits at 15% | Use `pandoc -f html -t markdown --wrap=none *.html > Complete.md` to batch convert ALL files in one command. NEVER use Read tool for HTML conversion. |
| **Frameworks.md only covered Section 1** | Extracted frameworks from first section only, missed 18+ frameworks from rest of book | Frameworks.md must cover ALL sections/chapters. Scan ENTIRE Complete.md, not just beginning. |
| **Special characters broke bash commands** | Filenames from Anna's Archive with curly quotes/apostrophes caused bash failures | Use `find -print0 \| xargs -0 cp` to copy file to /tmp with safe name. NEVER use symlinks (fail in sandboxed environments). |
| **Symlinks failed in sandbox** | `ln -sf` fails silently in sandboxed environments, causing downstream failures | ALWAYS use `cp` instead of `ln -sf`. Copy is universally reliable. |
| **Visual book false-failed word count** | Illustrated books (O'Reilly, Head First) have ~100-150 words/page, not 250. Verification flagged as incomplete. | Detect visual books (words/page < 150) and use 80% threshold instead of 95%. |
| **No conversion plan created** | Skipped .conversion-plan.md, couldn't verify completeness or resume | Step 6a is BLOCKING. Create plan file BEFORE pandoc conversion. Verify file exists before proceeding. |

**If you catch yourself about to make one of these mistakes, STOP and correct course.**

---

## Pre-Flight: Read Skill Log

**Before every run:** Read `/Users/troybrave/.claude/skills/book-to-reference/skill-log.md` to learn from past runs.

---

## Step 0.5: Verify Dependencies (BLOCKING)

**⛔ DO NOT PROCEED without pandoc. It's the difference between 15% and 100% completion.**

```bash
# Check pandoc is installed - REQUIRED
which pandoc || { echo "FATAL: pandoc not installed. Run: brew install pandoc"; exit 1; }

# Check calibre for MOBI files (only needed if converting MOBI)
which ebook-convert || echo "WARNING: Calibre not installed. MOBI conversion will fail."

# Check poppler for PDF files (only needed if converting PDF)
which pdftotext || echo "WARNING: poppler not installed. PDF extraction may fail."
```

**If pandoc is missing:** STOP. Do not attempt extraction. Inform user:
```
"Cannot proceed: pandoc is required for book conversion.
Install with: brew install pandoc
Then restart the conversion."
```

---

## Step 0: Detect Resume State & Check Previous Completion

Before starting any new conversion, check if a previous conversion was interrupted OR incomplete:

### 0a: Check for Incomplete Previous Conversion

```bash
# If Complete.md exists, check if it's actually complete
if [ -f "$OUTPUT_FOLDER/{Book Title} - Complete.md" ]; then
    EXISTING_WORDS=$(wc -w < "$OUTPUT_FOLDER/{Book Title} - Complete.md")

    # Estimate expected words from source (rough: 250 words/page for PDF, or from HTML for EPUB)
    # If existing is <80% of expected, previous conversion failed
    echo "Existing output: $EXISTING_WORDS words"
    echo "⚠️ Check if this matches expected book length before proceeding"
fi
```

**If existing output appears incomplete (<80% expected):**
1. Warn user: "Previous conversion appears incomplete ({X}% of expected). Overwrite?"
2. If yes: Delete existing output, proceed fresh
3. If no: Abort

### 0b: Check for In-Progress Conversion

```bash
# Check for existing conversion plan in the output folder
ls "{output_folder}/.conversion-plan.md" 2>/dev/null
```

**If `.conversion-plan.md` exists with `Status: in_progress`:**
1. Read the plan file
2. Identify last completed batch
3. Resume from next incomplete batch
4. Skip to "Step 6: Batched Content Extraction" with resume context

**If no plan exists or status is `completed`:** Proceed with fresh conversion.

---

## Step 1: Validate Input

### Required Input
- **file_path:** Absolute path to the book file
- **--project (optional):** Project name for Quick Reference customization

### Validation Checks

1. **File exists (handle special characters in filenames):**

   Files from sources like Anna's Archive often have special characters (curly quotes, apostrophes, etc.). **Always use find with null-terminated strings for safety.**

   ```bash
   # Detect Anna's Archive files (always use find for these)
   DOWNLOAD_DIR=$(dirname "{file_path}")

   if [[ "{file_path}" == *"Anna"*"Archive"* ]] || [[ "{file_path}" == *"--"* ]]; then
       # Anna's Archive format: extract first meaningful words for search
       SEARCH_TERM=$(basename "{file_path}" | cut -d'-' -f1 | sed 's/[^a-zA-Z0-9]/ /g' | xargs | cut -d' ' -f1-3)
       SOURCE_FILE=$(find "$DOWNLOAD_DIR" -name "*${SEARCH_TERM%% *}*" -type f 2>/dev/null | head -1)
   elif [ ! -f "{file_path}" ]; then
       # Fallback search for other special character cases
       SEARCH_TERM=$(basename "{file_path}" | sed 's/[^a-zA-Z0-9]/ /g' | awk '{print $1" "$2}')
       SOURCE_FILE=$(find "$DOWNLOAD_DIR" -name "*$SEARCH_TERM*" -type f 2>/dev/null | head -1)
   else
       SOURCE_FILE="{file_path}"
   fi

   if [ -n "$SOURCE_FILE" ] && [ -f "$SOURCE_FILE" ]; then
       echo "✅ Source file located: $SOURCE_FILE"
   else
       echo "NOT_FOUND"
   fi
   ```
   - If NOT_FOUND: `"File not found: {file_path}"`

2. **Supported format:**
   - Extract extension: `.epub`, `.mobi`, or `.pdf` (case insensitive)
   - If unsupported: `"Unsupported format: {ext}. Supported: EPUB, MOBI, PDF"`

3. **Extract book name and sanitize for filesystem:**
   - From filename without extension
   - **Sanitize special characters for folder/file names:**

   ```bash
   # Remove or replace problematic characters
   BOOK_NAME=$(basename "{file_path}" | sed 's/\.[^.]*$//')  # Remove extension
   SAFE_BOOK_NAME=$(echo "$BOOK_NAME" | \
       sed "s/['']//g" | \           # Remove curly apostrophes
       sed 's/[""]//g' | \           # Remove curly quotes
       sed 's/[—–]/-/g' | \          # Normalize dashes
       sed 's/[^a-zA-Z0-9 ._-]//g' | \ # Remove other special chars
       sed 's/  */ /g')              # Collapse multiple spaces

   echo "Original: $BOOK_NAME"
   echo "Safe name: $SAFE_BOOK_NAME"
   ```

   **Use `$SAFE_BOOK_NAME` for all output folder and file names.**

### 1c: Create Safe Copy (CRITICAL for Special Characters)

**⛔ DO THIS BEFORE ANY OTHER BASH OPERATIONS.**

Files from sources like Anna's Archive often have curly quotes, apostrophes, and Unicode characters that break bash commands. **Always copy to a safe path** (symlinks fail in sandboxed environments).

```bash
# Create a safe copy in /tmp for all subsequent operations
# ALWAYS use cp, NEVER ln -sf (symlinks fail in sandboxed environments)
SAFE_SOURCE="/tmp/book-convert-$(date +%s).${SOURCE_FILE##*.}"

# Use find with null-termination for bulletproof copying
find "$(dirname "$SOURCE_FILE")" -maxdepth 1 -name "$(basename "$SOURCE_FILE" | cut -c1-30)*" -print0 2>/dev/null | \
    xargs -0 -I {} cp "{}" "$SAFE_SOURCE" 2>/dev/null

# If that fails, try direct copy (works if SOURCE_FILE path is clean)
if [ ! -f "$SAFE_SOURCE" ]; then
    cp "$SOURCE_FILE" "$SAFE_SOURCE" 2>/dev/null
fi

# Verify copy worked
if [ -f "$SAFE_SOURCE" ]; then
    echo "✅ Safe copy created: $SAFE_SOURCE"
else
    echo "❌ FATAL: Could not create safe copy of source file"
    echo "Try manually copying the file to /tmp with a simple name"
    exit 1
fi
```

**From this point forward, use `$SAFE_SOURCE` for ALL bash operations:**
- pandoc conversion
- unzip extraction
- pdftotext extraction
- md5 checksum

**Why copy instead of symlink:** Symlinks (`ln -sf`) fail silently in sandboxed environments. Copy (`cp`) works universally. The original file remains untouched.

---

## Step 2: Format Router

Based on file extension, route to appropriate handler:

| Extension | Handler | Notes |
|-----------|---------|-------|
| `.epub` | EPUB Handler (Step 4) | Primary path |
| `.mobi` | MOBI Handler (Step 3) | Converts to EPUB first |
| `.pdf` | PDF Handler (Step 5) | Quality warnings apply |

---

## Step 3: MOBI Handler

### 3a: Check Calibre Installation

```bash
which ebook-convert
```

**If not found:**
```
MOBI conversion requires Calibre.

Install with: brew install calibre

After installation, run this conversion again.
```
**Stop processing.**

### 3b: Convert MOBI to EPUB

```bash
# Create temp location for converted file
TEMP_EPUB="/tmp/book-conversion-$(date +%s).epub"

# Convert MOBI to EPUB
ebook-convert "{file_path}" "$TEMP_EPUB"
```

### 3c: Delegate to EPUB Handler

- Set `file_path` to the converted EPUB
- Set `cleanup_temp_epub: true` flag
- Continue to Step 4

---

## Step 4: EPUB Handler

### 4a: Determine Book Category and Author

**Before creating the output folder, ask the user which category this book belongs to:**

Use AskUserQuestion:
```
Which category does this book belong to?

1. Business - Business, marketing, sales, finance, entrepreneurship
2. Ministry - Theology, Bible study, church leadership, spiritual growth
3. Personal - Self-help, relationships, health, hobbies, general non-fiction
```

**Extract author from metadata (do this FIRST, before folder creation):**

```bash
# Extract author from OPF file
AUTHOR=$(grep -oP '(?<=<dc:creator[^>]*>)[^<]+' "$EXTRACT_DIR"/*.opf 2>/dev/null | head -1)

# If no author found, ask user
if [ -z "$AUTHOR" ]; then
    echo "AUTHOR_NOT_FOUND"
fi
```

**If AUTHOR_NOT_FOUND:** Use AskUserQuestion:
```
Could not extract author from book metadata.
Please enter the author name (e.g., "Russell Brunson", "Dave Ramsey"):
```

**Sanitize author name for folder:**
```bash
SAFE_AUTHOR=$(echo "$AUTHOR" | \
    sed "s/['']//g" | \
    sed 's/[""]//g' | \
    sed 's/[^a-zA-Z0-9 ._-]//g' | \
    sed 's/  */ /g' | \
    sed 's/^ *//;s/ *$//')

echo "Author: $AUTHOR → $SAFE_AUTHOR"
```

### 4b: Create Output Folder Structure

```bash
# Vault base path
VAULT="/Users/troybrave/Documents/Projects/Full Vault"

# Category paths
BUSINESS_PATH="$VAULT/Business/01 - Reference/Books/Reference"
MINISTRY_PATH="$VAULT/Ministry/01 - Reference/Books/Reference"
PERSONAL_PATH="$VAULT/Personal/01 - Reference/Books/Reference"

# Set base path based on user's category choice
case "$CATEGORY" in
    "Business") BASE_PATH="$BUSINESS_PATH" ;;
    "Ministry") BASE_PATH="$MINISTRY_PATH" ;;
    "Personal") BASE_PATH="$PERSONAL_PATH" ;;
esac

# Output folder structure: Category/Author/Book Title
OUTPUT_FOLDER="$BASE_PATH/$SAFE_AUTHOR/$SAFE_BOOK_NAME"

# Check if exists
if [ -d "$OUTPUT_FOLDER" ]; then
    echo "OUTPUT_EXISTS"
fi
```

**Folder structure example:**
```
Business/01 - Reference/Books/Reference/
├── Russell Brunson/
│   ├── Traffic Secrets/
│   │   ├── Traffic Secrets - Complete.md
│   │   ├── Traffic Secrets - Frameworks.md
│   │   └── Traffic Secrets - Quick Reference.md
│   └── Expert Secrets/
│       └── ...
├── Dave Ramsey/
│   └── Total Money Makeover/
│       └── ...
```

**If OUTPUT_EXISTS:** Use AskUserQuestion:
```
Output folder already exists: {OUTPUT_FOLDER}

How would you like to proceed?
1. Overwrite - Replace existing files
2. Rename - Create "{Book Name} (2)/" folder
3. Abort - Cancel conversion
```

### 4c: Setup Output Folder

```bash
# Create author folder if it doesn't exist
mkdir -p "$BASE_PATH/$SAFE_AUTHOR"

# Create book folder
mkdir -p "$OUTPUT_FOLDER"

# Copy source file to output folder
cp "{file_path}" "$OUTPUT_FOLDER/"

echo "Output: $OUTPUT_FOLDER"
```

### 4d: Extract EPUB Contents

```bash
# Create extraction directory
EXTRACT_DIR="$OUTPUT_FOLDER/.extracted"
mkdir -p "$EXTRACT_DIR"

# Extract EPUB (it's a ZIP file)
unzip -q "{file_path}" -d "$EXTRACT_DIR"
```

### 4e: Determine Chapter Order

**Precedence (try in order):**

1. **nav.xhtml (EPUB3):**
   ```bash
   find "$EXTRACT_DIR" -name "nav.xhtml" -o -name "nav.html" 2>/dev/null
   ```
   - Parse `<nav epub:type="toc">` for ordered chapter list

2. **toc.ncx (EPUB2):**
   ```bash
   find "$EXTRACT_DIR" -name "toc.ncx" 2>/dev/null
   ```
   - Parse `<navPoint>` elements for chapter order

3. **Spine from OPF:**
   ```bash
   find "$EXTRACT_DIR" -name "*.opf" 2>/dev/null
   ```
   - Parse `<spine>` element for `<itemref>` order
   - Cross-reference with `<manifest>` for file paths

4. **Fallback - Alphabetical:**
   ```bash
   find "$EXTRACT_DIR" -name "*.xhtml" -o -name "*.html" | sort
   ```
   - Log: "Using alphabetical file order (no TOC found)"

**Log which method was used.**

### 4f: Extract Metadata (CRITICAL - Record Expected Counts)

From OPF file, extract:
- `<dc:title>` → Book title
- `<dc:creator>` → Author(s)
- Count chapters from TOC → chapter_count

**⚠️ MANDATORY: Record the expected chapter count NOW.**

This number will be used in Step 11 to verify completeness. Write it to the conversion plan:

```bash
echo "Expected chapters: {chapter_count}" >> "$OUTPUT_FOLDER/.conversion-plan.md"
```

**If you skip this step, you cannot verify completeness later.**

### 4f: Detect Language (Early Verification)

**Purpose:** Catch wrong-language editions before processing the entire book.

```bash
# Extract first 500 words of actual content (skip TOC, copyright)
SAMPLE_TEXT=$(find "$EXTRACT_DIR" \( -name "*.xhtml" -o -name "*.html" \) -exec cat {} \; | sed 's/<[^>]*>//g' | head -500)

# Quick language check - look for common English words
if ! echo "$SAMPLE_TEXT" | grep -qi -E '\b(the|and|is|are|was|were|have|has|this|that|with|from|for|not|but|what|all|when|can|will)\b'; then
    echo "⚠️ WARNING: Content may not be in English"
fi
```

**Also check OPF metadata for language:**
```bash
grep -i "dc:language" "$EXTRACT_DIR"/*.opf 2>/dev/null
```

**If language appears to be non-English:**
1. Warn user immediately: "This appears to be a {language} edition. Continue?"
2. User can confirm to proceed or cancel to find the correct edition
3. Note in conversion plan: `Language: {detected}`

### 4g: Estimate Size for Batching

Count total content:
```bash
# Count words across all content files
find "$EXTRACT_DIR" \( -name "*.xhtml" -o -name "*.html" \) -exec cat {} \; | wc -w
```

**Batching triggers:**
- >5 chapters OR
- >20,000 words OR
- Estimated >15,000 tokens

**If batching triggered:** Continue to Step 6 (Batched Extraction)
**If small book:** Continue to Step 7 (Direct Extraction)

---

## Step 5: PDF Handler

### 5a: Check PDF Tools

```bash
which pdftotext && which pdfinfo
```

**If not found:**
```
PDF extraction requires poppler tools.

Install with: brew install poppler

After installation, run this conversion again.
```

### 5b: Get PDF Info (Handle Special Characters)

**Files from Anna's Archive often have special characters.** If `pdfinfo` fails:

```bash
# Try exact path first
pdfinfo "{file_path}" 2>/dev/null

# If that fails, use glob matching
if [ $? -ne 0 ]; then
    SEARCH_TERM=$(basename "{file_path}" | sed 's/[^a-zA-Z0-9]/ /g' | awk '{print $1" "$2}')
    PDF_FILE=$(find "$(dirname "{file_path}")" -name "*$SEARCH_TERM*.pdf" -type f 2>/dev/null | head -1)
    if [ -n "$PDF_FILE" ]; then
        pdfinfo "$PDF_FILE"
    fi
fi
```

Extract:
- Pages count
- Title (if available)
- Author (if available)

### 5c: Detect Content Type (Book vs Workbook)

**Workbooks have different characteristics than regular books:**

```bash
# Extract sample text
SAMPLE=$(pdftotext -f 1 -l 10 "{file_path}" - 2>/dev/null)

# Check for workbook indicators
if echo "$SAMPLE" | grep -qi -E 'exercise|worksheet|fill in|workbook|blank|write your'; then
    CONTENT_TYPE="workbook"
    WORDS_PER_PAGE=200  # Workbooks have less text per page
else
    CONTENT_TYPE="book"
    WORDS_PER_PAGE=250
fi

echo "Content type: $CONTENT_TYPE"
```

**Workbook-specific expectations:**
| Metric | Regular Book | Workbook |
|--------|--------------|----------|
| Words per page | ~250 | ~200 |
| Word count threshold | 95-105% | 85-110% (more variance OK) |
| Expected frameworks | Concepts, models | Exercises, checklists, forms |

### 5c2: Detect Visual Books (IMPORTANT for Word Count Verification)

**Visual books (O'Reilly, Head First, illustrated guides) have significantly less text per page.** The Badass book had only 116 words/page. Without this detection, word count verification will falsely flag these as incomplete.

```bash
# After initial extraction, calculate words per page
ACTUAL_WORDS=$(wc -w < "$OUTPUT_FOLDER/.raw-extract.txt")
PAGES=$(pdfinfo "$SAFE_SOURCE" | grep "Pages:" | awk '{print $2}')
WORDS_PER_PAGE=$((ACTUAL_WORDS / PAGES))

echo "Words per page: $WORDS_PER_PAGE"

# Detect visual/illustrated books
if [ "$WORDS_PER_PAGE" -lt 150 ]; then
    CONTENT_TYPE="visual"
    WORD_THRESHOLD=80  # Use 80% threshold instead of 95%
    echo "⚠️ Visual/illustrated book detected (${WORDS_PER_PAGE} words/page)"
    echo "Using relaxed word count threshold: ${WORD_THRESHOLD}%"
elif [ "$WORDS_PER_PAGE" -lt 200 ]; then
    CONTENT_TYPE="workbook"
    WORD_THRESHOLD=85
else
    CONTENT_TYPE="book"
    WORD_THRESHOLD=95
fi
```

**Visual book detection thresholds:**
| Words/Page | Type | Verification Threshold |
|------------|------|----------------------|
| < 150 | Visual/Illustrated (O'Reilly, Head First) | 80% |
| 150-200 | Workbook or semi-visual | 85% |
| > 200 | Standard text book | 95% |

**Record in conversion plan:**
```bash
echo "CONTENT_TYPE=$CONTENT_TYPE" >> "$OUTPUT_FOLDER/.conversion-plan.md"
echo "WORDS_PER_PAGE=$WORDS_PER_PAGE" >> "$OUTPUT_FOLDER/.conversion-plan.md"
echo "WORD_THRESHOLD=$WORD_THRESHOLD" >> "$OUTPUT_FOLDER/.conversion-plan.md"
```

### 5d: Detect Native vs Scanned

```bash
# Extract first 3 pages as text
pdftotext -f 1 -l 3 "{file_path}" - | head -100
```

**If output is mostly empty or garbled:** PDF is scanned
**If readable text:** PDF is native

### 5e: Quality Assessment & Warning

| Detection | Quality | Warning |
|-----------|---------|---------|
| Native text, <100 pages | high | None |
| Native text, >100 pages | high | "Large PDF - batched processing" |
| Scanned, any size | medium/low | "Scanned PDF detected. Accuracy will be lower. Manual review recommended." |
| Workbook | medium | "Workbook detected. Exercises and forms will be extracted. Fill-in blanks preserved as _____." |

**Always inform user of quality level before proceeding.**

### 5f: PDF Extraction Strategy

**For native text PDFs:**
```bash
# Extract to raw text first
pdftotext -layout "{file_path}" "$OUTPUT_FOLDER/.raw-extract.txt"

# Convert to markdown and run cleanup (including PDF-specific patterns)
python3 /Users/troybrave/.claude/skills/book-to-reference/scripts/cleanup-pandoc.py "$OUTPUT_FOLDER/.raw-extract.txt" "$OUTPUT_FOLDER/.raw-complete.md"
```

**The cleanup script now handles PDF-specific patterns (v3.2):**
- Multi-line chapter titles (number on one line, title on next)
- Page headers/footers with page numbers
- Running headers (book title repeated on pages)
- Exercise numbering normalization
- Fill-in-the-blank field cleanup

**For scanned PDFs:**
- Use the `pdf-to-markdown` skill for vision-based extraction
- Or use smaller batches with explicit quality warnings
- Chain with: `Invoke the pdf-to-markdown skill for vision extraction`

### 5g: PDF-Specific Framework Extraction

**For workbooks, look for these additional framework types:**

| Framework Type | Pattern | Example |
|----------------|---------|---------|
| Exercise sequences | "Exercise #1" through "Exercise #76" | Group by chapter |
| Key Concepts | "Key Concept:" or boxed text | Extract per chapter |
| Case Studies | "Case Study:" or named examples | Preserve full text |
| Forms/Worksheets | Tables with blank fields | Extract as appendix |
| Checklists | Checkbox lists (☐ or -) | Preserve structure |

**For workbooks, Frameworks.md should include:**
```markdown
## Exercise Summary

| Chapter | Exercises | Focus |
|---------|-----------|-------|
| 1 | #1-5 | Self-assessment |
| 2 | #6-12 | Goal setting |
...
```

### 5h: Setup Output and Continue

- Create output folder (same as EPUB Step 4a-4b) - **remember to ask for category and author**
- Copy source PDF
- Record content type in conversion plan: `Content-Type: {book|workbook}`
- Continue to Step 6 or 7 based on size

---

## Step 6: Batched Content Extraction (Large Books)

### 6a: Create Conversion Plan (BLOCKING - MUST COMPLETE)

**⛔ DO NOT proceed to pandoc conversion until this file exists and is verified.**

Write to `{output_folder}/.conversion-plan.md`:

```markdown
# Conversion Plan: {Book Title}

## Metadata
- Source: {file_path}
- Format: {epub|mobi|pdf}
- Estimated size: {chapters} chapters / {pages} pages
- Created: {timestamp}
- Status: in_progress

## Batch Plan
| Batch | Content | Status | Output File |
|-------|---------|--------|-------------|
| 1 | {Ch 1-3 or Pages 1-50} | pending | .batch-001.md |
| 2 | {Ch 4-6 or Pages 51-100} | pending | .batch-002.md |
{...continue for all batches...}

## Progress
- [ ] All batches complete
- [ ] Assembly complete
- [ ] Frameworks extraction complete
- [ ] Quick Reference generation complete
- [ ] Cleanup complete

## Resume Instructions
If context exhausted, new session should:
1. Read this plan file
2. Check batch status
3. Continue from last incomplete batch
4. Assembly happens after all batches complete
```

**⛔ BLOCKING VERIFICATION - Confirm plan file exists before proceeding:**

```bash
# Verify conversion plan was created
if [ ! -f "$OUTPUT_FOLDER/.conversion-plan.md" ]; then
    echo "❌ FATAL: Conversion plan not created. Cannot proceed."
    echo "Create .conversion-plan.md with expected chapters BEFORE continuing."
    exit 1
fi

# Verify expected chapters were recorded
if ! grep -q "Expected chapters:" "$OUTPUT_FOLDER/.conversion-plan.md"; then
    echo "❌ FATAL: Expected chapter count not recorded in plan."
    echo "Add 'Expected chapters: N' to .conversion-plan.md before continuing."
    exit 1
fi

echo "✅ Conversion plan verified. Proceeding to extraction."
```

**Why this is blocking:** Without the conversion plan, you cannot verify completeness in Step 11. This has caused deliveries of 15% complete books.

### 6b: Convert to Markdown with Pandoc (PREFERRED METHOD)

**⛔ DO NOT use the Read tool to manually read/convert HTML files.**
**This caused 15% completion failures due to context exhaustion.**

**✅ OPTION 1 (Simplest): Direct EPUB-to-Markdown with Auto-Cleanup**

Pandoc can read EPUB files directly. **Chain pandoc + cleanup in one command:**

```bash
# Convert EPUB directly to markdown AND run cleanup in one pipeline
pandoc -f epub -t markdown --wrap=none "{file_path}" -o "$OUTPUT_FOLDER/.raw-complete.md" && \
python3 /Users/troybrave/.claude/skills/book-to-reference/scripts/cleanup-pandoc.py "$OUTPUT_FOLDER/.raw-complete.md"
```

**✅ OPTION 2: From extracted HTML files (with auto-cleanup)**

If direct EPUB conversion has issues (rare), use extracted HTML:

```bash
cd "$EXTRACT_DIR/OEBPS"  # or wherever HTML files are located

# Convert ALL HTML/XHTML files to markdown in one command, then cleanup
pandoc -f html -t markdown --wrap=none *.xhtml > "$OUTPUT_FOLDER/.raw-complete.md" && \
python3 /Users/troybrave/.claude/skills/book-to-reference/scripts/cleanup-pandoc.py "$OUTPUT_FOLDER/.raw-complete.md"

# If .xhtml doesn't exist, try .html
pandoc -f html -t markdown --wrap=none *.html > "$OUTPUT_FOLDER/.raw-complete.md" && \
python3 /Users/troybrave/.claude/skills/book-to-reference/scripts/cleanup-pandoc.py "$OUTPUT_FOLDER/.raw-complete.md"
```

**⚠️ ALWAYS chain the cleanup script immediately after pandoc.** Do not run them as separate steps that could be forgotten.

**Pandoc benefits:**
- Converts ALL content at once - no batching needed
- No context limits - runs as shell command
- 100% verbatim - mechanical conversion, no LLM interpretation
- Handles nested tags, tables, lists correctly
- Direct EPUB mode preserves chapter order automatically

### 6c: Verify Sample Accuracy (MANDATORY)

**Before processing the entire book, verify extraction quality on a sample:**

1. Extract the first 500 characters of actual text content
2. Compare 3 random paragraphs against source HTML
3. Check for:
   - Missing words
   - Garbled characters
   - Quote attribution bugs
   - HTML entities not converted

```bash
# Quick sample check
head -100 "$OUTPUT_FOLDER/.raw-complete.md" | grep -v "^#" | head -20
```

**If ANY word differs from source:** STOP. Fix extraction logic before continuing.

**Log verification:**
```
echo "Verified: First chapter sample matches source - proceeding with full extraction"
```

### 6d: Clean Up Pandoc Output

After pandoc conversion, clean up Calibre artifacts using the Python cleanup script:

```bash
# Use the skill's Python cleanup script (handles complex patterns sed can't)
python3 /Users/troybrave/.claude/skills/book-to-reference/scripts/cleanup-pandoc.py "$OUTPUT_FOLDER/.raw-complete.md"
```

**What the script cleans:**
- CSS class markers: `{.calibre1}`, `{.bold}`, `{.italic}`
- Nested bracket issues: `[   **   **   SECRET #1   **   **   ]` → `## SECRET #1`
- Div wrappers: `:::` blocks
- Internal EPUB navigation links: `[text](index_split_006.html#...)` → `text`
- Excessive whitespace and trailing spaces

**Fallback (if Python unavailable):**
```bash
# Basic sed cleanup (less thorough)
sed -i '' 's/{[^}]*}//g' "$OUTPUT_FOLDER/.raw-complete.md"
sed -i '' 's/\[\]//g' "$OUTPUT_FOLDER/.raw-complete.md"
sed -i '' '/^$/N;/^\n$/D' "$OUTPUT_FOLDER/.raw-complete.md"
```

### 6d: Verify Word Count (BLOCKING GATE)

**⛔ DO NOT proceed to formatting until word count passes.**

This verification happens BEFORE any output files are created. If extraction failed, we catch it here.

```bash
# Count words in source HTML files (strip tags)
EXPECTED_WORDS=$(find "$EXTRACT_DIR" \( -name "*.xhtml" -o -name "*.html" \) -exec cat {} \; | sed 's/<[^>]*>//g' | wc -w)

# Count words in converted markdown
ACTUAL_WORDS=$(wc -w < "$OUTPUT_FOLDER/.raw-complete.md")

# Calculate percentage
WORD_PCT=$((ACTUAL_WORDS * 100 / EXPECTED_WORDS))

echo "Source: $EXPECTED_WORDS words → Output: $ACTUAL_WORDS words ($WORD_PCT%)"

# Store for Complete.md header metadata
echo "SOURCE_WORDS=$EXPECTED_WORDS" >> "$OUTPUT_FOLDER/.conversion-plan.md"
echo "OUTPUT_WORDS=$ACTUAL_WORDS" >> "$OUTPUT_FOLDER/.conversion-plan.md"
echo "WORD_PCT=$WORD_PCT" >> "$OUTPUT_FOLDER/.conversion-plan.md"
```

**Word count thresholds (BLOCKING):**
| Range | Result | Action |
|-------|--------|--------|
| 95-105% | ✅ PASS | Proceed to Step 6e |
| <95% | ❌ ABORT | Content lost - check pandoc errors, retry extraction |
| >105% | ⚠️ WARN | Check for duplicates - may proceed with review |

**If word count < 95%:** DO NOT create any output files. Diagnose and fix extraction first.

### 6e: Format and Structure (Read tool OK here)

Now read the `.raw-complete.md` file and format it:

1. **Read the converted markdown** (this is safe - it's already markdown, not HTML)
2. **Add proper heading structure:**
   - Book title as `# Title`
   - Chapters as `## Chapter X: Title`
   - Sections as `### Section`
3. **Verify all chapters present** - compare to TOC from Step 4d
4. **Write final Complete.md**

**HTML Edge Cases (publisher-specific markup):**

| HTML Pattern | Publisher | Conversion |
|--------------|-----------|------------|
| `<span class="smallcaps">` | Various | Remove span, keep text |
| `<span class="koboSpan">` | Kobo | Remove entirely |
| `<span id="kobo.X.X">` | Kobo tracking | Remove entirely |
| `<a id="kindle_X">` | Kindle anchors | Remove entirely |
| `<span class="calibre_X">` | Calibre | Remove span, keep text |
| `&ldquo;` / `&rdquo;` | All | → `"` / `"` (curly quotes) |
| `&lsquo;` / `&rsquo;` | All | → `'` / `'` (curly apostrophes) |
| `&mdash;` | All | → `—` (em-dash) |
| `&ndash;` | All | → `–` (en-dash) |
| `&nbsp;` | All | → regular space |
| `&hellip;` | All | → `…` (ellipsis) |

**If you see quote attribution bugs** (quotes not properly attributed to speakers), check for nested `<span>` elements that pandoc didn't handle correctly.

### 6f: Extract Frameworks

After Complete.md is finalized:
- Scan for tables, numbered processes, frameworks
- Extract to `.frameworks-draft.md`

### 6g: Fallback - Manual Batching (ONLY if pandoc fails)

**Only use this if pandoc is not installed or fails:**

For each batch (1-2 chapters max):

1. Read content files using Read tool
2. **MECHANICAL HTML-to-Markdown conversion** (pure tag replacement)
3. **Verify word count matches source**
4. Write batch to `.batch-{NNN}.md`
5. Update plan file

**⛔ FORBIDDEN during manual conversion:**
- DO NOT summarize any content
- DO NOT paraphrase or reword
- DO NOT skip "repetitive" sections
- DO NOT condense lists or examples
- DO NOT "clean up" or "improve" the text
- DO NOT merge similar paragraphs

**Batch files must be VERBATIM.** Every word from source HTML appears in output markdown. The only transformation is HTML tags → markdown syntax. Nothing else.

### 6h: Assembly (only if manual batching was used)

**⛔ Assembly is CONCATENATION ONLY. No editing, no summarizing, no "cleaning up".**

After ALL batches complete:

1. **Combine batch files with cat:**
   ```bash
   cat "{output_folder}/.batch-"*.md > "{output_folder}/{Book Title} - Complete.md"
   ```

   That's it. Literally `cat`. The Complete.md is the batch files concatenated.

2. **If bash fails, provide this command to user:**
   ```
   Run this in Terminal:
   cat "/path/to/output/.batch-"*.md > "/path/to/output/Book Title - Complete.md"
   ```

3. **Only fix at seams (if batches overlap):**
   - Check END of batch N against START of batch N+1
   - If same paragraph appears twice, remove ONE copy
   - Do NOT rewrite, rephrase, or "improve" anything

### 6i: Fallback Assembly (If Bash/Python Fails)

**Problem:** Bash commands may fail in sandboxed environments, stalling the entire assembly step.

**When to use this fallback:**
- Bash `cat` or concatenation commands fail
- Python cleanup script returns errors
- Sandbox restrictions prevent file operations

**Fallback Method - Use Write Tool Directly:**

1. **Read all batch files sequentially** using the Read tool:
   ```
   Read .batch-001.md
   Read .batch-002.md
   ... (all batches)
   ```

2. **Write Complete.md directly** using the Write tool with concatenated content

3. **For very large books** (>100k tokens combined):
   - Write in segments: first half, then append second half using Edit tool
   - Or create `Complete-Part1.md`, `Complete-Part2.md` with instructions to combine:
     ```
     # Note: This book was split due to size
     # Run: cat "Complete-Part1.md" "Complete-Part2.md" > "Complete.md"
     ```

**Cleanup Fallback:**
If rm commands fail, inform user to manually run:
```bash
cd "{output_folder}" && rm -rf .extracted .batch-*.md .raw-complete.md
```

And display this message:
```
⚠️ Automatic cleanup failed (sandbox restriction).
Manual cleanup command provided above.
Output files are complete and ready to use.
```

### 6j: Idempotency Rules

- **Same input = same output:** Running twice produces identical files
- **Skip if complete:** If output folder exists with valid 3-file set and source matches, skip conversion
- **Force flag:** User can pass --force to overwrite despite existing output
- **Partial state cleanup:** If conversion fails mid-way, temp files are removed but output folder preserved for inspection

---

## Step 7: Direct Content Extraction (Small Books)

For books that don't trigger batching:

1. Read all XHTML/HTML content files in chapter order
2. Strip HTML tags, preserve structure (same rules as Step 6b)
3. Proceed directly to Step 8

---

## Step 8: Generate Complete.md

Write `{Book Title} - Complete.md`:

```markdown
# {Book Title}

*{Subtitle if available}*

**By {Author(s)}**

---

> **Source:** {chapter_count} chapters | {SOURCE_WORDS:,} words
> **Converted:** {timestamp} | {OUTPUT_WORDS:,} words ({WORD_PCT}%)
> **Checksum:** MD5: {md5sum of source file}

---

## {Chapter 1 Title}

{Verbatim chapter content with proper markdown formatting}

---

## {Chapter 2 Title}

{Content continues...}

{...all chapters...}
```

**Get source checksum (for metadata):**
```bash
SOURCE_MD5=$(md5 -q "{file_path}")
echo "SOURCE_MD5=$SOURCE_MD5" >> "$OUTPUT_FOLDER/.conversion-plan.md"
```

**Formatting rules:**
- Book title as H1
- Chapters as H2
- Sections within chapters as H3
- Subsections as H4
- Preserve all tables as markdown tables
- Preserve all lists
- Preserve emphasis (bold/italic)
- Add `---` between major sections

---

## Step 9: Generate Frameworks.md

**⛔ CRITICAL: Frameworks.md must cover the ENTIRE book, not just Section 1.**

A prior failure extracted frameworks only from the first section, missing 18+ frameworks from the rest of the book. This is unacceptable.

### 9a: Framework Detection (FULL BOOK SCAN REQUIRED)

**You MUST scan the ENTIRE Complete.md file from beginning to end.**

DO NOT:
- Stop after the first section
- Assume early chapters contain all frameworks
- Skip later chapters because "you have enough"

DO:
- Process EVERY chapter/section in Complete.md
- Track which chapter/section each framework came from
- Verify you found frameworks from multiple parts of the book

**⛔ FRAMEWORK DETECTION CHECKLIST (verify each category):**

Use this checklist to ensure comprehensive coverage. Check off each category as you scan:

| Category | What to Look For | Example |
|----------|------------------|---------|
| ☐ **Numbered lists** | "The 5 Foundations", "7 Baby Steps", "10 Principles" | Dave Ramsey's 7 Baby Steps |
| ☐ **Tables and matrices** | Comparison tables, decision grids, scorecards | Spender vs Saver comparison |
| ☐ **Step-by-step processes** | Sequential instructions, workflows, procedures | "Step 1: Create budget..." |
| ☐ **Formulas and calculations** | Mathematical formulas, percentage rules | "50/30/20 Rule" |
| ☐ **Age-based progressions** | Life stage recommendations, timeline-based advice | "In your 20s... In your 30s..." |
| ☐ **Comparison charts** | Side-by-side comparisons, pros/cons lists | Roth vs Traditional IRA |
| ☐ **Budget breakdowns** | Allocation percentages, spending categories | Housing 25%, Food 10%... |
| ☐ **Pyramid/hierarchy diagrams** | Value ladders, priority stacks, Maslow-style hierarchies | Needs pyramid |
| ☐ **Acronyms with explanations** | SMART goals, FIRE movement, etc. | S.M.A.R.T. breakdown |
| ☐ **Checklists** | Pre-requisites, qualification criteria, readiness assessments | "Before investing, ensure..." |

Scan Complete.md (or .frameworks-draft.md if batched) for:

1. **Explicit tables** - Any markdown table structure
2. **Headed lists** - Numbered or bulleted lists following a header
3. **Keyword sections** - Paragraphs containing:
   - "Framework"
   - "Model"
   - "Process"
   - "Steps"
   - "Methodology"
   - "Formula"
   - "Equation"
   - "Secret" (for books with numbered secrets/principles)
   - "Law"
   - "Principle"
   - "Rule"
4. **Summary sections** - Chapter conclusions, "Key Takeaways"
5. **Diagrams** - Text describing visual models (convert to ASCII if possible)
6. **Numbered concepts** - "The 7 Laws of...", "22 Secrets", "10 Principles", etc.

### 9b: Framework Extraction Rules

- **Priority:** Tables > Headed lists > Keyword sections > Summaries
- **Duplicates:** Keep earliest canonical instance, merge later additions
- **ASCII diagrams:** Convert described processes to box-and-arrow format
- **Coverage verification:** Before writing Frameworks.md, verify you found frameworks from MULTIPLE sections/chapters (not just the first one)

**⚠️ COVERAGE CHECK:** If all extracted frameworks came from the first 20% of the book, STOP and re-scan. You likely missed frameworks from later sections.

### 9c: Write Frameworks.md

**Each framework MUST include its source chapter.** This prevents "Section 1 only" failures by making coverage gaps visible.

**Obsidian Integration:** Use wikilinks to connect frameworks back to the Complete.md source.

```markdown
# {Book Title} - Key Frameworks

*Extracted from "{Full Book Title}" by {Author(s)}*

> **Coverage:** {N} frameworks from {M} chapters
> **Full text:** [[{Book Title} - Complete]]

---

## {Framework 1 Name}
*Source: [[{Book Title} - Complete#Chapter 1 Title|Chapter 1]]*

### {Subcomponent if applicable}

{ASCII diagram if applicable - see 9d for format}

| Column 1 | Column 2 |
|----------|----------|
| Data | Data |

{Explanation text}

---

## {Framework 2 Name}
*Source: [[{Book Title} - Complete#Chapter 5 Title|Chapter 5]]*

{...continue for all frameworks...}
```

**Wikilink format:** `[[{Book Title} - Complete#{Heading}|Display Text]]`
- Links directly to the section in Complete.md
- Enables one-click navigation in Obsidian

**Coverage verification:** The header shows total frameworks and chapters covered. If frameworks only come from 1-2 chapters in a 20-chapter book, the extraction is incomplete.

### 9d: Verify Wikilink Anchors

**Before finalizing Frameworks.md, verify all wikilink anchors exist in Complete.md:**

```bash
# Extract all anchor targets from Frameworks.md
grep -oE '\[\[[^#]+#[^|]+' "$OUTPUT_FOLDER/{Book Title} - Frameworks.md" | \
    sed 's/.*#//' | sort -u > /tmp/framework-anchors.txt

# Check each anchor exists as a heading in Complete.md
while read anchor; do
    if ! grep -q "^##.*$anchor" "$OUTPUT_FOLDER/{Book Title} - Complete.md"; then
        echo "⚠️ Missing anchor: $anchor"
    fi
done < /tmp/framework-anchors.txt
```

**If anchors are missing:**
1. The heading text in the wikilink doesn't match Complete.md exactly
2. Fix by using the exact heading text from Complete.md
3. Common issues: extra spaces, different capitalization, special characters

**Example fix:**
- Wrong: `[[Book - Complete#SECRET #1|Secret 1]]`
- Right: `[[Book - Complete#SECRET #1: The Secret Formula|Secret 1]]`

### 9e: Diagram Placeholders

**When the book contains diagrams, charts, or visual models:**

Use Obsidian callout format for diagram placeholders:

```markdown
> [!diagram] {Diagram Name}
> See original book page {X} for visual.
>
> **ASCII approximation:**
> ```
> ┌─────────────┐
> │  Step 1     │
> └──────┬──────┘
>        ↓
> ┌─────────────┐
> │  Step 2     │
> └─────────────┘
> ```
```

**Diagram types and handling:**

| Diagram Type | Handling |
|--------------|----------|
| Flow charts | Convert to ASCII boxes with arrows (↓ → ← ↑) |
| Pyramids/Hierarchies | Use indentation or ASCII art |
| Matrices/Grids | Convert to markdown tables |
| Venn diagrams | Describe overlap in text + simple ASCII |
| Complex visuals | Placeholder with page reference only |

**Example - Value Ladder:**
```markdown
> [!diagram] The Value Ladder
> See original book page 47 for visual.
>
> **ASCII approximation:**
> ```
>                    ┌─────────────┐
>                    │ High Ticket │ $$$$
>                    └──────┬──────┘
>               ┌──────────┴──────────┐
>               │   Mid-Tier Offer    │ $$$
>               └──────────┬──────────┘
>          ┌───────────────┴───────────────┐
>          │      Core Product/Service      │ $$
>          └───────────────┬───────────────┘
>     ┌────────────────────┴────────────────────┐
>     │           Lead Magnet / Free Offer       │ Free
>     └──────────────────────────────────────────┘
> ```
```

---

## Step 10: Generate Quick Reference

**Target length:** 5-10% of Complete.md word count, focused on actionable items.

If Complete.md is 50,000 words, Quick Reference should be 2,500-5,000 words.

### 10a: Determine Project Context

**If --project flag provided:**
- Use project name for tailoring
- Look up project context if available (e.g., "Power Bookkeeping" context)

**If no --project flag:**
- Create generic Quick Reference
- Use "{Book Title} Quick Reference.md" as filename

### 10b: Project-Specific Tailoring

For each framework in Frameworks.md:
1. Identify how it applies to the specified project
2. Create project-specific examples
3. Add actionable application notes

### 10c: Write Quick Reference

**With project:**
```markdown
# {Book Title} Quick Reference for {Project}

*Tailored application of "{Book Title}" by {Author(s)} for {Project}*

---

## {Project} Context

- **Business Model:** {description or "To be defined"}
- **Core Product:** {description or "To be defined"}
- **Customer Type:** {description or "To be defined"}

---

## {Project} Application of {Framework 1}

### How This Applies

{Framework adapted specifically for this project}

### Action Items

- [ ] {Specific action for this project}
- [ ] {Another action}

---

## {Project} Application of {Framework 2}

{...continue for all frameworks...}
```

**Without project (generic):**
```markdown
# {Book Title} Quick Reference

*Key applications from "{Book Title}" by {Author(s)}*

---

## How to Use This Reference

This reference extracts actionable frameworks from the book.
For each framework, consider:
- How does this apply to your specific context?
- What's the first action you can take?

---

## {Framework 1}: Application Guide

### The Framework

{Brief summary}

### Application Prompts

- In your context, what is your equivalent of {key concept}?
- How might you implement {process step}?

---

{...continue for all frameworks...}
```

---

## Step 11: COMPLETENESS GATE (BLOCKING)

**⛔ DO NOT PROCEED TO CLEANUP OR DELIVERY UNTIL THIS GATE PASSES.**

This step prevents delivering incomplete conversions. It has happened before where only 15% of a book was converted and delivered as "complete." This is unacceptable.

### 11a: Count Expected vs Actual Content

**For EPUB/MOBI - Chapter Count:**
```bash
# Count expected chapters from TOC/spine (you recorded this in Step 4d)
EXPECTED_CHAPTERS={number from Step 4d}

# Count actual chapter headings in Complete.md
ACTUAL_CHAPTERS=$(grep -c "^## " "$OUTPUT_FOLDER/{Book Title} - Complete.md")

# Calculate completion percentage
COMPLETION_PCT=$((ACTUAL_CHAPTERS * 100 / EXPECTED_CHAPTERS))
```

**For EPUB/MOBI - Word Count Verification (CRITICAL FOR VERBATIM):**
```bash
# Count words in source HTML files (strip tags)
EXPECTED_WORDS=$(find "$EXTRACT_DIR" \( -name "*.xhtml" -o -name "*.html" \) -exec cat {} \; | sed 's/<[^>]*>//g' | wc -w)

# Count words in Complete.md
ACTUAL_WORDS=$(wc -w < "$OUTPUT_FOLDER/{Book Title} - Complete.md")

# Calculate word percentage (should be 95-105% to account for markdown syntax)
WORD_PCT=$((ACTUAL_WORDS * 100 / EXPECTED_WORDS))

echo "Expected: $EXPECTED_WORDS words, Actual: $ACTUAL_WORDS words ($WORD_PCT%)"
```

**Word count thresholds:**
| Word % | Meaning | Action |
|--------|---------|--------|
| 95-105% | ✅ Verbatim | Proceed |
| 80-94% | ⚠️ Some content lost | Review and re-extract missing sections |
| <80% | ❌ Significant summarization | Re-extract from scratch with stricter verbatim rules |

**For PDF:**
```bash
# Get expected page count
EXPECTED_PAGES=$(pdfinfo "{file_path}" | grep "Pages:" | awk '{print $2}')

# Estimate actual pages from word count (avg 250 words/page)
ACTUAL_WORDS=$(wc -w < "$OUTPUT_FOLDER/{Book Title} - Complete.md")
ESTIMATED_PAGES=$((ACTUAL_WORDS / 250))

# Calculate completion percentage
COMPLETION_PCT=$((ESTIMATED_PAGES * 100 / EXPECTED_PAGES))
```

### 11b: HARD STOP - Completeness Threshold

**TEXT must be 100% word-perfect. No exceptions.**

| Content Type | Requirement | Acceptable Variance |
|--------------|-------------|---------------------|
| **Text** | 100% word-perfect | 0% - every word from source must appear in output |
| **Images/Graphs** | Best effort | May be missing - note in output where images appeared |
| **Charts/Diagrams** | Describe if text-based | Tables must be 100% accurate |

**Verification:**

| Check | Pass | Fail |
|-------|------|------|
| **Chapter count** | 100% of chapters present | ANY missing chapter |
| **Word count** | 95-105% of source (variance = markdown syntax) | <95% = text was summarized or lost |
| **All text preserved** | Every paragraph, list, quote present | ANY summarization or paraphrasing |

| Result | Action |
|--------|--------|
| **All chapters + word count 95-105%** | ✅ PASS - Proceed |
| **Missing chapters** | ❌ DO NOT DELIVER - Extract missing chapters |
| **Word count <95%** | ❌ DO NOT DELIVER - Content was summarized, re-extract verbatim |
| **Word count >105%** | ⚠️ Check for duplicated content at batch seams |

**Images/graphs note:** If images cannot be extracted, add a placeholder:
```markdown
[IMAGE: {description if caption available, otherwise "Image on page X"}]
```

**There is no "good enough" for TEXT. Every word must be preserved.**

**If batched conversion was used, also verify:**
```bash
# Count expected batches from plan
EXPECTED_BATCHES=$(grep -c "^| [0-9]" "$OUTPUT_FOLDER/.conversion-plan.md")

# Count completed batch files
ACTUAL_BATCHES=$(ls -1 "$OUTPUT_FOLDER/.batch-"*.md 2>/dev/null | wc -l)

if [ "$ACTUAL_BATCHES" -lt "$EXPECTED_BATCHES" ]; then
    echo "INCOMPLETE: Only $ACTUAL_BATCHES of $EXPECTED_BATCHES batches completed"
    # DO NOT PROCEED - resume incomplete batches first
fi
```

### 11c: Verify All Outputs Exist

```bash
ls -la "$OUTPUT_FOLDER/"
```

Confirm:
- [ ] `{Book Title} - Complete.md` exists AND passes completeness threshold
- [ ] `{Book Title} - Frameworks.md` exists
- [ ] `{Book Title} - Quick Reference{...}.md` exists
- [ ] Source book file copied

### 11d: Artifact Detection (BEFORE cleanup)

**Run these checks before declaring complete:**

```bash
# Check for remaining artifacts - all should return 0
echo "Artifact check:"
echo "  Internal links: $(grep -c 'index_split' "$OUTPUT_FOLDER/{Book Title} - Complete.md" || echo 0)"
echo "  Image placeholders: $(grep -c '^Image$' "$OUTPUT_FOLDER/{Book Title} - Complete.md" || echo 0)"
echo "  CSS classes: $(grep -c '{\.calibre' "$OUTPUT_FOLDER/{Book Title} - Complete.md" || echo 0)"
echo "  Div wrappers: $(grep -c ':::' "$OUTPUT_FOLDER/{Book Title} - Complete.md" || echo 0)"
```

**If any count > 0:** Run cleanup script again before proceeding.

### 11e: Post-Cleanup Verification

**Before deleting temp files, verify conversion accuracy:**

```bash
# Re-extract source to /tmp for verification
VERIFY_DIR="/tmp/book-verify-$(date +%s)"
mkdir -p "$VERIFY_DIR"

# For EPUB: re-extract and count words
unzip -q "{file_path}" -d "$VERIFY_DIR"
SOURCE_WORDS=$(find "$VERIFY_DIR" \( -name "*.xhtml" -o -name "*.html" \) -exec cat {} \; | sed 's/<[^>]*>//g' | wc -w)
OUTPUT_WORDS=$(wc -w < "$OUTPUT_FOLDER/{Book Title} - Complete.md")
ACCURACY=$((OUTPUT_WORDS * 100 / SOURCE_WORDS))

# Log verification results
cat > "$OUTPUT_FOLDER/.verification-log.md" << EOF
# Verification Log

**Source:** {file_path}
**Converted:** $(date)
**Source words:** $SOURCE_WORDS
**Output words:** $OUTPUT_WORDS
**Accuracy:** ${ACCURACY}%

## Artifact Check
- Internal links: $(grep -c 'index_split' "$OUTPUT_FOLDER/{Book Title} - Complete.md" || echo 0)
- CSS classes: $(grep -c '{\.calibre' "$OUTPUT_FOLDER/{Book Title} - Complete.md" || echo 0)
- Div wrappers: $(grep -c ':::' "$OUTPUT_FOLDER/{Book Title} - Complete.md" || echo 0)

## Result
$([ $ACCURACY -ge 95 ] && echo "✅ PASS" || echo "❌ FAIL - review needed")
EOF

# Cleanup verification temp
rm -rf "$VERIFY_DIR"

echo "Verification log saved to .verification-log.md"
```

### 11f: Remove Temp Files (ONLY after verification passes)

```bash
# Remove extraction directory
rm -rf "$OUTPUT_FOLDER/.extracted"

# Remove batch files (if batched processing)
rm -f "$OUTPUT_FOLDER/.batch-"*.md
rm -f "$OUTPUT_FOLDER/.frameworks-draft.md"
# KEEP .conversion-plan.md for reference
# KEEP .verification-log.md for audit trail

# Remove temp EPUB (if converted from MOBI)
if [ "$cleanup_temp_epub" = true ]; then
    rm -f "$TEMP_EPUB"
fi

# Remove raw PDF extract
rm -f "$OUTPUT_FOLDER/.raw-extract.txt"
```

### 11c: Update Conversion Plan (if exists)

If `.conversion-plan.md` still exists, update status to `completed` before deletion.

---

## Step 12: Report Success

Present to user:

```
Conversion complete!

Output: {OUTPUT_FOLDER}/

Files created:
- {Book Title} - Complete.md ({word_count} words)
- {Book Title} - Frameworks.md ({framework_count} frameworks)
- {Book Title} - Quick Reference{...}.md

Quality Assessment: {high|medium|low}
{If medium/low: "Manual review recommended for accuracy"}

Cleanup: Complete
```

---

## Error Handling

| Error | Response |
|-------|----------|
| File not found | `"File not found: {path}. Please verify the path and try again."` |
| Unsupported format | `"Unsupported format: {ext}. Supported formats: EPUB, MOBI, PDF"` |
| Calibre not installed | `"MOBI conversion requires Calibre. Install with: brew install calibre"` |
| pdftotext not installed | `"PDF extraction requires poppler. Install with: brew install poppler"` |
| EPUB extraction fails | Retry with alternate structure paths (OEBPS/, EPUB/, root), then fail with details |
| No TOC found | Log warning, use alphabetical file order, continue |
| Output folder exists | Ask user: Overwrite, Rename, or Abort |
| Context limit approaching | Save state to .conversion-plan.md, inform user to resume |
| PDF is scanned | Warn user about accuracy, proceed with vision extraction |
| <50% content extracted | Abort with: `"Extraction failed: insufficient content recovered. Manual intervention required."` |

---

## Quality Checklist (BLOCKING - Must Pass Before Delivery)

**⛔ ALL items must be checked before reporting success to user.**

Before marking complete, verify:

- [ ] **COMPLETENESS GATE PASSED** (Step 11b showed 100% - no exceptions)
- [ ] All 3 output files generated
- [ ] Complete.md contains full book content (verified by chapter count comparison)
- [ ] Chapter order matches source book
- [ ] Frameworks.md contains relevant models/tables from ALL sections (not just first)
- [ ] Quick Reference tailored to project (if specified)
- [ ] Artifact check passed (no internal links, CSS classes, div wrappers)
- [ ] .verification-log.md created with accuracy results
- [ ] Source file copied to output folder
- [ ] User informed of quality assessment
- [ ] Skill log updated with conversion results

**If any item is unchecked, DO NOT report success. Fix the issue first.**

---

## Step 12: Update Skill Log

**After every conversion (success or failure), update the skill log:**

```bash
# Append to skill log
cat >> /Users/troybrave/.claude/skills/book-to-reference/skill-log.md << EOF

### $(date +%Y-%m-%d) - {Book Title} Conversion

**Outcome:** {Success/Partial/Failed}
**Source:** {file_path}
**Format:** {EPUB/MOBI/PDF}
**Word count:** {SOURCE_WORDS} → {OUTPUT_WORDS} ({ACCURACY}%)
**Chapters:** {expected} → {actual}
**Frameworks extracted:** {count} from {chapter_count} chapters

**Issues encountered:**
- {Any issues or "None"}

**Lessons learned:**
- {Any new patterns discovered or "None - clean run"}
EOF
```

**Why this matters:** The skill log is how the skill gets smarter. Without logging results, the same mistakes repeat.

---

## Dependencies

| Dependency | Required For | Installation |
|------------|--------------|--------------|
| **pandoc** | HTML→Markdown conversion (CRITICAL) | `brew install pandoc` |
| **Python 3** | Cleanup script for Calibre artifacts | `brew install python3` (usually pre-installed on macOS) |
| Calibre | MOBI conversion | `brew install calibre` |
| poppler | PDF extraction | `brew install poppler` |

**Check pandoc is installed before starting:**
```bash
which pandoc || echo "INSTALL PANDOC: brew install pandoc"
```

---

## Chained Skills

| Skill | When Used |
|-------|-----------|
| `pdf-to-markdown` | Scanned PDF vision extraction |

**Chaining Contract:**
- If chained skill succeeds: Continue normally
- If partial output: Warn user, annotate quality as "degraded"
- If complete failure: Abort with error, suggest manual intervention
- If <50% content: Abort - unusable output
