# Skill Log: pdf-to-markdown

> This log tracks learnings, failures, and improvements. Claude reads this BEFORE each run.

---

## Status

| Metric | Value |
|--------|-------|
| **Created** | 2025-12-18 |
| **Last Updated** | 2025-12-18 |
| **Clean Runs** | 1 |
| **Stability** | Learning |

**Stability Levels:**
- `Learning` (0-1 clean runs) - Actively collecting feedback
- `Improving` (2-3 clean runs) - Getting stable
- `Stable` (4+ clean runs) - No longer asking for feedback

---

## Known Issues & Fixes

### 2025-12-18 - OCR Artifacts in Scanned PDFs

**Problem:** Some text passages came out garbled or with wrong words (e.g., "Lying blind" instead of "Living blind", "Ie" instead of "He", "Hagel" instead of "Hegel")

**Root Cause:** Vision-based extraction on old/lower-quality scans (2010 Canon scanner) combined with larger batch sizes reduced accuracy

**Fix Applied:**
- Reduced recommended batch size from 15-20 to 8-12 pages
- Added detailed quality verification checklist
- Added common OCR misread reference table
- Added vision extraction best practices with explicit instructions

**Files Modified:** skill.md (Step 3, Step 8)

---

### 2025-12-18 - Batch Boundary Text Running Together

**Problem:** Text at batch boundaries sometimes ran together without proper line breaks (e.g., "...paragraph end.New paragraph start...")

**Root Cause:** Batch outputs weren't consistently ending with blank lines, and no verification step existed

**Fix Applied:**
- Added "Critical: Batch Boundary Handling" section before formatting rules
- Added explicit guidance to end each batch with `\n\n`
- Added batch boundary issues to quality verification checklist

**Files Modified:** skill.md (Step 5)

---

## Learnings

### 2025-12-18 - Vision Accuracy vs Batch Size Trade-off

**Observation:** The 77-page "Two Kinds of Righteousness" test used 8 batches (~10 pages each). Quality was generally good (structure, chapters, formatting preserved) but some OCR errors appeared especially in dense theological text.

**Implication:** Smaller batches allow more careful reading per page. For academic, theological, or text-dense PDFs, smaller batches (5-8 pages) may be worth the extra processing time.

**Action Taken:** Updated recommended batch size from 15-20 to 8-12, with note about using even smaller batches for complex content.

---

### 2025-12-18 - Religious/Academic Text Requires Extra Care

**Observation:** Scripture references, philosopher names, and theological terms were occasionally misread. These errors matter more in religious texts where accuracy is critical.

**Implication:** The skill should include a special verification step for religious/academic content with known high-value terms to double-check.

**Action Taken:** Added Scripture/Quote verification section to Step 8 quality checklist.

---

### 2025-12-18 - Old Scans Need Different Handling

**Observation:** The test PDF was scanned in 2010 with a Canon scanner. Image quality was lower than modern scans.

**Implication:** Scan age and source should be noted during initial analysis, and processing strategy should adapt accordingly.

**Action Taken:** Added note about old scans (2010 and earlier) needing smaller batch sizes.

---

## Run History

| Date | Outcome | Feedback | Action Taken |
|------|---------|----------|--------------|
| 2025-12-18 | Issue | OCR artifacts in ~5 locations, batch boundary gaps in ~4 locations | Updated skill.md with quality checklist, batch handling, vision best practices |

---

## Version Notes

### Versioning Rules

| Change Type | Version Bump | Example |
|-------------|--------------|---------|
| Bug fix, typo, minor tweak | v1.0 → v1.1 | Fixed path typo |
| New feature, new step | v1.x → v2.0 | Added email notification step |
| Breaking change, major rewrite | Note in description | "v3 - Complete redesign" |

### v1.2 - 2025-12-18
- **Added Second-Pass Verification (Step 8)** - Major accuracy improvement
- Glossary building during extraction to track names, terms, Scripture refs
- Inconsistency detection (name variants, incomplete references, unparseable sentences)
- Targeted re-read of flagged sections with focused prompting
- Consistency pass using grep to find suspect single-occurrence names
- Skip conditions for native text PDFs and short documents

### v1.1 - 2025-12-18
- **Post-test improvements based on "Two Kinds of Righteousness" conversion**
- Reduced recommended batch size from 15-20 to 8-12 pages
- Added "Critical: Batch Boundary Handling" section
- Added comprehensive quality verification checklist with real examples
- Added common OCR misread reference table
- Added Scripture/Quote verification for religious texts
- Added vision extraction best practices with explicit prompting
- Added quality score assessment rubric
- Added guidance for old/low-quality scans

### v1.0 - 2025-12-18
- Initial skill creation
- Native text PDF extraction via pdftotext
- Scanned PDF support via vision-based batch processing
- Image extraction and embedding support
- Chapter/section structure detection
- Formatting preservation (headings, bold, italic, lists, quotes)
- Batch processing for large PDFs (300+ pages)
- Helper scripts: pdf-info.cjs, extract-batch.cjs, extract-images.cjs, prepare-scanned.cjs
