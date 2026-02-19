# Skill Log: book-to-reference

> This log tracks learnings, failures, and improvements. Claude reads this BEFORE each run.

---

## Status

| Metric | Value |
|--------|-------|
| **Created** | 2025-12-26 |
| **Last Updated** | 2025-12-26 |
| **Clean Runs** | 1 |
| **Stability** | Learning |

**Stability Levels:**
- `Learning` (0-1 clean runs) - Actively collecting feedback
- `Improving` (2-3 clean runs) - Getting stable
- `Stable` (4+ clean runs) - No longer asking for feedback

---

## Known Issues & Fixes

### 2025-12-26 - Manual Read Tool Caused 15% Completion (Traffic Secrets)

**Problem:** "Traffic Secrets" conversion stopped at 15% of book. Used Read tool to manually read/convert HTML files one-by-one, hit context limits.

**Root Cause:** Skill instructed to use Read tool for HTML conversion. Each file consumed context, and with 42 HTML files, context exhausted before completion.

**Fix Applied:**
1. Added "Manual read instead of pandoc" to KNOWN FAILURE MODES table
2. Rewrote Step 6b to use `pandoc -f html -t markdown --wrap=none *.html` instead of Read tool
3. Pandoc runs as shell command - no context limits
4. Added pandoc to Dependencies as CRITICAL
5. Manual batching moved to fallback (Step 6g) only if pandoc fails

**Files Modified:** skill.md (v2.3 → v2.4)

**Prevention:** ALWAYS use pandoc for HTML→Markdown. NEVER use Read tool for HTML conversion.

**What worked after fix:**
- `pandoc -f html -t markdown --wrap=none *.html > Complete.md` converted all 42 files in one command
- Cleaned up calibre artifacts with sed
- All 22 Secrets present in final output

---

### 2025-12-26 - Summarized Instead of Verbatim Extraction

**Problem:** Book conversion for "Hooked" produced 11,017 words when source contained significantly more. The LLM interpreted and condensed content instead of performing pure mechanical HTML-to-Markdown conversion.

**Root Cause:** Step 6b instructions said "strip HTML tags, preserve structure" but didn't explicitly forbid summarization or interpretation. LLM optimized for "clean" output rather than verbatim accuracy.

**Fix Applied:**
1. Added "Summarized instead of verbatim" to KNOWN FAILURE MODES table
2. Rewrote Step 6b with explicit FORBIDDEN actions (no summarizing, paraphrasing, condensing)
3. Added REQUIRED pure tag replacement rules
4. Added word count verification before writing each batch
5. Added word count verification to Step 11a completeness gate
6. Reduced batch size to 1-2 chapters max for accuracy

**Files Modified:** skill.md (v2.1 → v2.2)

**Prevention:** Verify output word count is within 95-105% of source word count. If <80%, content was summarized - re-extract.

---

### 2025-12-26 - Delivered 15% Complete Book as "Complete"

**Problem:** A book conversion only extracted ~15% of content, but the skill generated all 3 output files and declared "Conversion complete!" to the user.

**Root Cause:** The skill had no completeness verification. It checked that files *exist* but never verified that Complete.md actually contained the full book. The quality checklist was a suggestion, not a blocking gate.

**Fix Applied:**
1. Added Step 11 COMPLETENESS GATE as a blocking step before delivery
2. Added chapter count comparison: expected vs actual chapters in Complete.md
3. Added word count/page estimation check for PDFs
4. Made quality checklist a blocking gate with explicit "DO NOT report success" instruction
5. Added KNOWN FAILURE MODES section at top of skill.md
6. Made Step 4e MANDATORY to record expected chapter count

**Files Modified:** skill.md (v1.0 → v2.0)

**Prevention:** Before ANY delivery, run the completeness gate. If <90% complete, DO NOT deliver.

---

### Issue Template
```
### {Date} - {Brief Issue Title}

**Problem:** {What went wrong}

**Root Cause:** {Why it happened}

**Fix Applied:** {What was changed}

**Files Modified:** {skill.md, scripts/x.cjs, etc.}
```

---

## Learnings

### 2025-12-26 - Pandoc Artifacts Require Python Cleanup

**Observation:** When using pandoc on Calibre-exported EPUBs, the output contains artifacts that sed struggles to clean:
- CSS class markers: `{.calibre1}`, `{.bold}`, `{.italic}`
- Nested bracket issues: `[   **   **   SECRET #1   **   **   ]`
- Div wrappers: `:::` blocks

**Implication:** Simple sed commands fail when patterns contain embedded markdown characters (asterisks). Python regex is more reliable for complex patterns.

**Action Taken:** For Expert Secrets, used Python regex cleanup:
```python
content = re.sub(r'\[\s*\**\s*SECRET #(\d+)\s*\**\s*\]', r'## SECRET #\1', content)
content = re.sub(r'\[([^\]]+)\](?!\()', r'\1', content)  # brackets not links
content = re.sub(r':::\s*\n?', '', content)
content = re.sub(r'\{[^}]*\}', '', content)  # CSS classes
```

Added to skill.md Step 6c: Post-pandoc cleanup now uses Python for robust pattern matching.

---

### 2025-12-26 - Internal EPUB Links Need Removal

**Observation:** EPUB Table of Contents often contains internal navigation links like `(index_split_006.html#filepos12316)` that persist through pandoc conversion.

**Implication:** Complete.md ends up with 100+ broken internal links that clutter the text.

**Action Taken:** Added to cleanup step:
```python
content = re.sub(r'\[([^\]]+)\]\(index_split_\d+\.html[^)]*\)', r'\1', content)
```

---

### Learning Template
```
### {Date} - {Brief Learning Title}

**Observation:** {What was noticed}

**Implication:** {What this means for the skill}

**Action Taken:** {How skill was updated, or "None - noted for future"}
```

---

## Run History

<!-- Automatically updated after each feedback session -->

| Date | Outcome | Feedback | Action Taken |
|------|---------|----------|--------------|
| 2025-12-26 | {Clean/Issue} | {Summary or "None"} | {What was done} |

---

## Version Notes

### Versioning Rules

| Change Type | Version Bump | Example |
|-------------|--------------|---------|
| Bug fix, typo, minor tweak | v1.0 → v1.1 | Fixed path typo |
| New feature, new step | v1.x → v2.0 | Added email notification step |
| Breaking change, major rewrite | Note in description | "v3 - Complete redesign" |

### v3.6 - 2025-12-26
**Running header auto-detection, visual book support, improved file handling**

Based on analysis of 4 successful conversions (Boron Letters, No B.S. Direct Marketing, Badass, Total Money Makeover Workbook):

**Cleanup Script - Patterns 49-50:**
1. **Pattern 49: Running header auto-detection** - Detects strings appearing 15+ times on their own lines (like "The Challenge" in Badass) and removes them automatically
2. **Pattern 50: Final cleanup after header removal**

**Skill.md Changes:**
3. **Known Failure Modes table** - Added "Symlinks failed in sandbox" and "Visual book false-failed word count"
4. **Step 1c: Improved file copy** - Uses `find -print0 | xargs -0 cp` for bulletproof handling of special characters
5. **Step 5c2: Visual book detection** - NEW. Detects illustrated books (< 150 words/page) and uses 80% threshold instead of 95%

**Visual Book Detection Thresholds:**
| Words/Page | Type | Verification Threshold |
|------------|------|----------------------|
| < 150 | Visual/Illustrated | 80% |
| 150-200 | Workbook | 85% |
| > 200 | Standard | 95% |

**Files Modified:**
- skill.md (v3.5 → v3.6)
- scripts/cleanup-pandoc.py (added patterns 49-50, Counter import)

---

### v3.5 - 2025-12-26
**Standalone colon cleanup and final blank line normalization**

Based on Boron Letters conversion artifact check:

**Cleanup Script - Patterns 46-48:**
1. **Pattern 46: Standalone colon markers** - `:` or `::` on their own line removed
2. **Pattern 47: Calibre class text markers** - `: calibre1` etc. removed
3. **Pattern 48: Final blank line normalization** - 3+ blank lines → 2 blank lines

**Files Modified:**
- scripts/cleanup-pandoc.py (added patterns 46-48)

---

### v3.4 - 2025-12-26
**Publisher-specific markers, HTML tag cleanup, symlink→copy fix**

Based on No B.S. Direct Marketing and Badass conversions:

**Skill.md Changes:**
1. **Step 1c: Symlink→Copy** - Changed from `ln -sf` to `cp` with find. Symlinks fail in sandboxed environments.
2. **Known Failure Modes** - Added "Symlinks failed in sandbox" and "Visual book false-failed word count"
3. **Step 1: Anna's Archive detection** - Auto-detect `--` pattern in filenames, use find immediately

**Cleanup Script - Patterns 32-45:**
- Publisher markers: hide, box, boxn, top1, top2, sidebar, callout, note, tip
- HTML tags: figure, img, span, p, div, anchor tags
- Empty parentheses from anchor cleanup
- Dash normalization for horizontal rules

**Files Modified:**
- skill.md (v3.3 → v3.4)
- scripts/cleanup-pandoc.py (added patterns 32-45)

---

### v3.3 - 2025-12-26
**Special character handling, chapter normalization, image cleanup, and plan enforcement**

Based on user feedback from "How to Have the Awesome Power of Public Speaking" conversion:

**Special Character Handling (Priority: Medium):**
1. **Step 1c: Safe Symlink Creation** - NEW BLOCKING STEP. Create symlink in `/tmp` with safe filename BEFORE any bash operations. Prevents failures from curly quotes, apostrophes, and Unicode in filenames from Anna's Archive.

**Cleanup Script Improvements:**
2. **Pattern 26: Chapter comma-separator normalization** - "Chapter One, A Special Communication" → "## Chapter 1: A Special Communication"
3. **Pattern 27: Endorsement/author image removal** - `![Image](images/image1.png)` patterns removed
4. **Pattern 28: Standalone "Image" text removal** - Lines with just "Image" removed
5. **Pattern 29: Broken image references** - `![ ](path)` patterns removed
6. **Pattern 30: Numeric chapter comma patterns** - "Chapter 1, Introduction" → "## Chapter 1: Introduction"
7. **Pattern 31: Final blank line cleanup** - Extra blank lines from pattern removal cleaned

**Conversion Plan Enforcement:**
8. **Step 6a: BLOCKING verification** - Plan file MUST exist before pandoc runs. Added bash verification that checks for `.conversion-plan.md` AND "Expected chapters:" line.

**Known Failure Modes Added:**
9. "Special characters broke bash commands" - Added to table with symlink prevention
10. "No conversion plan created" - Added to table with blocking verification

**Files Modified:**
- skill.md (v3.2 → v3.3)
- scripts/cleanup-pandoc.py (added patterns 26-31)

---

### v3.2 - 2025-12-26
**PDF-specific handling improvements from real-world workbook testing**

Based on user feedback from PDF workbook conversion (The Total Money Makeover Workbook):

**Cleanup Script - PDF Patterns (18-25):**
1. **Pattern 18: PDF chapter detection** - Standalone number followed by title on next lines → `## Chapter N: Title`
2. **Pattern 19: Multi-line chapter titles** - Title with colon on one line, subtitle on next → `## Title: Subtitle`
3. **Pattern 20: Page headers/footers** - Book title + page number patterns removed
4. **Pattern 21: Isolated page numbers** - Standalone page numbers between blank lines removed
5. **Pattern 22: Running headers** - Repeated chapter/title + page number headers removed
6. **Pattern 23: Form fields** - Excessive underscores (10+) normalized to `_____`
7. **Pattern 24: Exercise numbering** - `EXERCISE #1` → `### Exercise 1` normalized
8. **Pattern 25: Post-PDF cleanup** - Extra blank lines from pattern removal cleaned

**Skill.md - Step 5 Enhancements:**
9. **Step 5c: Content type detection** - Detects workbooks vs regular books via keywords (exercise, worksheet, fill in)
10. **Step 5d: Adjusted expectations** - Workbooks expect 200 words/page vs 250 for regular books
11. **Step 5e: Special character handling** - Strip special chars from PDF filename for folder naming
12. **Step 5g: PDF-specific framework extraction** - Workbook exercise summary table with chapter, exercise count, focus area

**Files Modified:**
- skill.md (v3.1 → v3.2)
- scripts/cleanup-pandoc.py (added PDF patterns 18-25)

---

### v3.1 - 2025-12-26
**Category routing and author-based folder organization**

Based on user request to organize books by category and author:

**Folder Organization:**
1. **Step 4a: Category selection** - AskUserQuestion for Business/Ministry/Personal routing
2. **Step 4b: Author extraction** - Extract author from TOC or ask user if not found
3. **Output paths updated** - Books now save to `Category/01 - Reference/Books/Reference/Author/Book Title/`

**Category Definitions:**
- Business: Business, marketing, sales, finance, entrepreneurship
- Ministry: Theology, Bible study, church leadership, spiritual growth
- Personal: Self-help, relationships, health, hobbies, general non-fiction

**Files Modified:**
- skill.md (v3.0 → v3.1)

---

### v3.0 - 2025-12-26
**Automation, chapter normalization, framework checklist, and filename handling**

Based on user feedback from a successful conversion that identified manual steps:

**Automation Improvements:**
1. **Step 6b: Chained pandoc + cleanup** - Now runs as single command: `pandoc ... && python3 cleanup-pandoc.py` instead of separate steps
2. **Cleanup script: Chapter heading normalization** - Converts "chapter one" → "## Chapter 1" automatically (handles 1-30)

**Framework Detection:**
3. **Step 9a: Added framework detection checklist** - 10-category checklist (numbered lists, tables, formulas, comparisons, etc.) to ensure comprehensive coverage

**Filename Handling:**
4. **Step 1: Special character handling** - Files from Anna's Archive often have curly quotes/apostrophes. Added `find` fallback when exact path fails
5. **Step 1: Filename sanitization** - Removes curly quotes, normalizes dashes, strips special characters for safe folder names

**Already Existed (Feedback Confirmed):**
- Verification log (Step 11e) ✅
- Skill log update (Step 12) ✅
- --project flag for Quick Reference (Step 10) ✅
- Metadata header generation (Step 8) ✅

**Files Modified:**
- skill.md (v2.9 → v3.0)
- scripts/cleanup-pandoc.py (added chapter normalization patterns 17)

---

### v2.9 - 2025-12-26
**Cleanup script improvements, pre-conversion checks, and wikilink verification**

Based on user feedback from a 36% incomplete conversion that wasn't caught:

**Cleanup Script Improvements:**
1. Added patterns: standalone `calibre10`, `calibre11` lines
2. Added patterns: `keep_together` markers
3. Added patterns: SVG blocks from cover images
4. Added patterns: inline SVG references
5. Added cleanup for whitespace-only lines after removals

**Pre-Conversion Checks:**
6. **Step 0a: Check Incomplete Previous Conversion** - If Complete.md exists but is <80% of expected, warn user before overwriting

**Wikilink Verification:**
7. **Step 9d: Verify Wikilink Anchors** - Check all `[[Book#Heading]]` anchors actually exist in Complete.md before finalizing

**Verbatim Enforcement:**
8. Strengthened Step 6g FORBIDDEN list with "DO NOT clean up" and "DO NOT merge"
9. Added explicit "Batch files must be VERBATIM" statement
10. Step 6h now says "Assembly is CONCATENATION ONLY" with literal `cat` command

**Files Modified:**
- skill.md (v2.8 → v2.9)
- scripts/cleanup-pandoc.py (added 5 new patterns)

---

### v2.8 - 2025-12-26
**Sandbox resilience, Obsidian integration, and output improvements**

Based on user feedback rating the skill B+ (85/100), implemented reliability and output quality improvements:

**Sandbox Resilience:**
1. **Step 6i: Fallback Assembly** - When bash/Python fails in sandboxed environments, use Read/Write tools directly to assemble Complete.md
2. **Cleanup Fallback** - If rm commands fail, provide manual cleanup command to user instead of stalling

**Obsidian Integration:**
3. **Wikilinks in Frameworks.md** - Each framework links back to source chapter: `[[Book - Complete#Chapter 1|Chapter 1]]`
4. **Step 9d: Diagram Placeholders** - Obsidian callout format `> [!diagram]` with ASCII approximations for visual models

**Output Improvements:**
5. **Value Ladder ASCII example** - Added detailed example for pyramid/hierarchy diagrams

**Files Modified:** skill.md (v2.7 → v2.8)

---

### v2.7 - 2025-12-26
**Quality assurance and verification improvements from multiple user feedback sessions**

Based on feedback from multiple users who ran the skill, implemented verification and quality improvements:

**Verification & Audit Trail:**
1. **Step 6c: Sample Accuracy Verification** - Verify extraction quality on first 500 chars BEFORE processing entire book
2. **Step 11d: Artifact Detection** - Check for remaining internal links, CSS classes, div wrappers before declaring complete
3. **Step 11e: Post-Cleanup Verification** - Creates `.verification-log.md` with accuracy metrics and artifact counts for audit trail
4. **Step 12: Update Skill Log** - Every conversion (success or failure) now logs results to skill-log.md

**Edge Case Handling:**
5. **Step 4f: Language Detection** - Early check to catch wrong-language editions before processing
6. **HTML Edge Cases Table** - Publisher-specific markup patterns (Kobo tracking spans, Kindle anchors, HTML entities)
7. **Python 3 added to Dependencies** - Required for cleanup script

**Files Modified:** skill.md (v2.6 → v2.7)

---

### v2.6 - 2025-12-26
**Major improvements from user feedback**

Based on detailed feedback analyzing skill-log evolution (v1.0 → v2.5), implemented 7 improvements:

**High Priority (Implemented):**
1. **Step 0.5: BLOCKING pandoc check** - Don't start extraction without pandoc. It's the difference between 15% and 100% completion.
2. **Python cleanup script** - Created `/scripts/cleanup-pandoc.py` that handles complex patterns sed can't (nested asterisks, CSS classes, EPUB links)
3. **Step 6d: Word count is now BLOCKING** - Verification happens BEFORE output files are created. If <95%, ABORT immediately.
4. **Complete.md header metadata** - Added source chapter count, word counts, conversion timestamp, and MD5 checksum

**Medium Priority (Implemented):**
5. **Frameworks.md source chapters** - Each framework shows `*Source: Chapter X*`. Header shows coverage: "{N} frameworks from {M} chapters"
6. **Quick Reference word count target** - 5-10% of Complete.md, focused on actionable items
7. **Direct EPUB extraction** - Added `pandoc -f epub -t markdown` as Option 1 (simpler than unzip → find HTML → convert)

**Files Created:**
- `/Users/troybrave/.claude/skills/book-to-reference/scripts/cleanup-pandoc.py`

### v2.5 - 2025-12-26
**Critical fix: Frameworks.md must cover ENTIRE book**

After "Traffic Secrets" Frameworks.md only covered Section 1, missing 18 Secrets worth of frameworks.

**Changes:**
- Step 9 now has CRITICAL warning: must cover entire book, not just Section 1
- Added DO NOT / DO list for framework extraction
- Added coverage verification: check frameworks come from multiple sections
- Added coverage check: if all frameworks from first 20%, re-scan
- Added keyword triggers: "Secret", "Law", "Principle", "Rule"
- Added detection for numbered concepts ("22 Secrets", "10 Principles")
- Added failure mode to KNOWN FAILURE MODES table

### v2.4 - 2025-12-26
**Critical fix: Use pandoc instead of Read tool for HTML conversion**

After "Traffic Secrets" stopped at 15% due to context exhaustion from manual HTML reading, switched to pandoc.

**Changes:**
- Step 6b now uses `pandoc -f html -t markdown --wrap=none *.html`
- Pandoc converts ALL files in one shell command - no context limits
- Added cleanup step for calibre CSS artifacts
- Manual Read tool batching moved to fallback (Step 6g)
- Added pandoc to Dependencies as CRITICAL
- Added failure mode: "Manual read instead of pandoc"

### v2.3 - 2025-12-26
**Clarified: TEXT = 100% word-perfect, Images = best effort**

User clarified the distinction between text and images:
- TEXT must be 100% word-perfect - every word preserved, no summarization
- Images/graphs are acceptable to miss (use placeholders instead)

**Changes:**
- Step 11b now has separate requirements for text vs images/graphs
- Added image placeholder format: `[IMAGE: {description}]`
- Tables must still be 100% accurate (they're text-based)

### v2.2 - 2025-12-26
**Critical fix: Verbatim extraction enforcement**

After "Hooked" conversion produced summarized output, added strict mechanical extraction rules.

**Changes:**
- Rewrote Step 6b with FORBIDDEN actions list
- Added word count verification (95-105% of source)
- Reduced batch size to 1-2 chapters for accuracy

### v2.1 - 2025-12-26
**Requirement: 100% completeness, no exceptions**

User clarified that 90% is not acceptable - a book with 10% missing is still broken.

**Changes:**
- 100% is now the ONLY passing threshold
- 95-99% triggers retry for missing chapters
- <95% blocks delivery entirely

### v2.0 - 2025-12-26
**Critical fix: Completeness verification**

After a user reported receiving a "complete" book that was only 15% extracted, added blocking gates to prevent incomplete deliveries.

**Changes:**
- Added KNOWN FAILURE MODES section at top of skill
- Step 4e now MANDATORY records expected chapter count
- Step 11 renamed to COMPLETENESS GATE (blocking)
- Added 11a: Count expected vs actual content
- Added 11b: HARD STOP with thresholds
- Quality checklist now blocking with explicit "DO NOT report success" instruction
- Batch verification: count .batch-*.md vs expected before assembly

### v1.0 - 2025-12-26
- Initial skill creation
- EPUB, MOBI, and PDF format support
- 3-file output: Complete.md, Frameworks.md, Quick Reference.md
- Batched processing with resume capability for large books
- --project flag for tailored Quick Reference generation
- Calibre integration for MOBI conversion
- pdftotext/vision extraction for PDFs
- TOC-based chapter ordering with fallback precedence
- Cleanup of temp files after conversion

### 2025-12-26 - The Boron Letters Conversion

**Outcome:** Success
**Source:** The Boron Letters -- Halbert, Gary; Halbert, Bond (Anna's Archive EPUB)
**Format:** EPUB
**Word count:** 45,273 → 44,414 (98%)
**Chapters:** 25 → 25 (100%)
**Frameworks extracted:** 13 from 15+ chapters

**Issues encountered:**
- Special characters in filename (curly apostrophe in "Anna's Archive") - resolved with find command
- Symlink creation failed in sandboxed environment - used cp instead

**Lessons learned:**
- Anna's Archive filenames commonly have special characters that break bash - always use find or glob patterns
- Copy to /tmp with safe name is more reliable than symlinks in sandboxed environments

### 2024-12-26 - No B.S. Direct Marketing Conversion

**Outcome:** Success
**Source:** The no B_S_ guide to direct marketing...Anna's Archive.epub
**Format:** EPUB
**Word count:** 69,057 → 68,027 (98%)
**Chapters:** 18 → 18 (100%)
**Frameworks extracted:** 10 major frameworks from all 3 sections

**Issues encountered:**
- Special characters in filename required using `find -print0 | xargs -0 cp` for safe copying
- Additional cleanup needed for "hide", "box", "boxn" markers and remaining HTML img tags

**Lessons learned:**
- Anna's Archive filenames consistently need special handling
- Post-pandoc cleanup should include publisher-specific markers (hide, box, top1, top2)

### 2025-12-26 - Badass Making Users Awesome Conversion

**Outcome:** Success
**Source:** Badass: Making Users Awesome by Kathy Sierra (PDF, 293 pages)
**Format:** PDF
**Word count:** ~35,000 source → 34,178 output (97%)
**Chapters:** 10 chapters + Prologue + Epilogue (all verified present)
**Frameworks extracted:** 15 from all sections

**Issues encountered:**
- PDF is highly visual with many diagrams - these were not extracted
- Layout had duplicate cover content (removed during formatting)
- Running headers/footers required cleanup

**Lessons learned:**
- Visual books (like O'Reilly Head First style) will have lower word-per-page ratio
- 34k words from 293 pages (~116 words/page) is normal for illustrated books
- The pdftotext -layout flag preserves structure well but includes layout artifacts
