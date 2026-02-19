#!/usr/bin/env python3
"""
Cleanup Pandoc Output for Book Conversions

Handles artifacts that sed struggles with when converting Calibre-exported EPUBs:
- CSS class markers: {.calibre1}, {.bold}, {.italic}
- Nested bracket issues: [   **   **   SECRET #1   **   **   ]
- Div wrappers: ::: blocks
- Internal EPUB navigation links

Usage:
    python cleanup-pandoc.py input.md output.md
    python cleanup-pandoc.py input.md  # Overwrites in place
"""

import re
import sys
from pathlib import Path
from collections import Counter


def cleanup_pandoc_output(content: str) -> str:
    """
    Clean up pandoc-converted markdown from Calibre EPUBs.

    Returns cleaned content with artifacts removed.
    """

    # 1. Remove CSS class artifacts like {.calibre1}, {.bold}, {.italic}
    content = re.sub(r'\{[^}]*\}', '', content)

    # 2. Clean up SECRET/CHAPTER markers with nested asterisks
    # Pattern: [   **   **   SECRET #1   **   **   ] -> ## SECRET #1
    content = re.sub(
        r'\[\s*\**\s*\**\s*(SECRET\s*#\d+)\s*\**\s*\**\s*\]',
        r'## \1',
        content,
        flags=re.IGNORECASE
    )

    # 3. Clean up CHAPTER markers similarly
    content = re.sub(
        r'\[\s*\**\s*\**\s*(CHAPTER\s*\d+[^]]*)\s*\**\s*\**\s*\]',
        r'## \1',
        content,
        flags=re.IGNORECASE
    )

    # 4. Remove standalone brackets that aren't links [text] but not [text](url)
    content = re.sub(r'\[([^\]]+)\](?!\()', r'\1', content)

    # 5. Remove empty brackets []
    content = re.sub(r'\[\]', '', content)

    # 6. Remove div wrapper markers (pandoc ::: blocks)
    content = re.sub(r':::\s*\n?', '', content)

    # 7. Remove internal EPUB navigation links
    # Pattern: [Link Text](index_split_006.html#filepos12316) -> Link Text
    content = re.sub(
        r'\[([^\]]+)\]\(index_split_\d+\.html[^)]*\)',
        r'\1',
        content
    )

    # 8. Remove other internal EPUB links (various formats)
    content = re.sub(
        r'\[([^\]]+)\]\([^)]*\.x?html[^)]*\)',
        r'\1',
        content
    )

    # 9. Clean up excessive whitespace (more than 2 blank lines)
    content = re.sub(r'\n{4,}', '\n\n\n', content)

    # 10. Clean up trailing whitespace on lines
    content = re.sub(r'[ \t]+$', '', content, flags=re.MULTILINE)

    # 11. Remove any remaining calibre-specific patterns
    # class="calibreX" that might have leaked through
    content = re.sub(r'class="[^"]*calibre[^"]*"', '', content, flags=re.IGNORECASE)

    # 12. Remove standalone calibre markers (calibre10, calibre11, etc. on their own lines)
    content = re.sub(r'^calibre\d+\s*$', '', content, flags=re.MULTILINE)

    # 13. Remove keep_together markers
    content = re.sub(r'keep_together\d*', '', content, flags=re.IGNORECASE)

    # 14. Remove SVG blocks (cover images, decorative elements)
    content = re.sub(r'<svg[^>]*>.*?</svg>', '', content, flags=re.DOTALL | re.IGNORECASE)

    # 15. Remove inline SVG references
    content = re.sub(r'!\[.*?\]\([^)]*\.svg\)', '', content)

    # 16. Clean up lines that are just whitespace after removals
    content = re.sub(r'^\s+$', '', content, flags=re.MULTILINE)

    # 17. Normalize chapter headings (convert word numbers to digits)
    # "chapter one" -> "## Chapter 1", "chapter two" -> "## Chapter 2", etc.
    word_to_num = {
        'one': '1', 'two': '2', 'three': '3', 'four': '4', 'five': '5',
        'six': '6', 'seven': '7', 'eight': '8', 'nine': '9', 'ten': '10',
        'eleven': '11', 'twelve': '12', 'thirteen': '13', 'fourteen': '14',
        'fifteen': '15', 'sixteen': '16', 'seventeen': '17', 'eighteen': '18',
        'nineteen': '19', 'twenty': '20', 'twenty-one': '21', 'twenty-two': '22',
        'twenty-three': '23', 'twenty-four': '24', 'twenty-five': '25',
        'twenty-six': '26', 'twenty-seven': '27', 'twenty-eight': '28',
        'twenty-nine': '29', 'thirty': '30'
    }

    def replace_chapter_word(match):
        word = match.group(1).lower()
        num = word_to_num.get(word, word)
        return f'\n\n---\n\n## Chapter {num}'

    # Match standalone "chapter <word>" lines (case insensitive)
    content = re.sub(
        r'^chapter\s+(' + '|'.join(word_to_num.keys()) + r')\s*$',
        replace_chapter_word,
        content,
        flags=re.MULTILINE | re.IGNORECASE
    )

    # Also normalize "CHAPTER ONE: Title" patterns
    def replace_chapter_with_title(match):
        word = match.group(1).lower()
        title = match.group(2).strip()
        num = word_to_num.get(word, word)
        return f'\n\n---\n\n## Chapter {num}: {title}'

    content = re.sub(
        r'^chapter\s+(' + '|'.join(word_to_num.keys()) + r')[:\s]+(.+)$',
        replace_chapter_with_title,
        content,
        flags=re.MULTILINE | re.IGNORECASE
    )

    # ============================================
    # PDF-SPECIFIC CLEANUP (patterns 18-25)
    # ============================================

    # 18. PDF chapter detection: standalone number followed by title on next lines
    # Pattern:    1
    #            The Total Money
    #            Makeover Challenge
    # -> ## Chapter 1: The Total Money Makeover Challenge
    def pdf_chapter_from_number(match):
        num = match.group(1)
        # Collect title lines, join with space
        title_lines = match.group(2).strip().split('\n')
        title = ' '.join(line.strip() for line in title_lines if line.strip())
        return f'\n\n---\n\n## Chapter {num}: {title}'

    content = re.sub(
        r'^\s*(\d{1,2})\s*\n((?:[A-Z][^\n]*\n?){1,3})',
        pdf_chapter_from_number,
        content,
        flags=re.MULTILINE
    )

    # 19. Multi-line chapter titles with colon separator
    # Pattern: Title Part One:
    #          SUBTITLE
    # -> ## Title Part One: SUBTITLE
    content = re.sub(
        r'^([A-Z][^:\n]+):\s*\n\s*([A-Z][A-Z\s]+)\s*$',
        r'\n\n---\n\n## \1: \2',
        content,
        flags=re.MULTILINE
    )

    # 20. PDF page headers/footers - book title + page number
    # Pattern: "the total money makeover workbook          15"
    content = re.sub(
        r'^[a-z][a-z\s]+(?:workbook|book|guide)?\s+\d{1,3}\s*$',
        '',
        content,
        flags=re.MULTILINE | re.IGNORECASE
    )

    # 21. PDF page numbers on their own line (but preserve chapter numbers in context)
    # Only remove if surrounded by blank lines (isolated page number)
    content = re.sub(
        r'\n\n\s*\d{1,3}\s*\n\n',
        '\n\n',
        content
    )

    # 22. PDF running headers (repeated title at top of pages)
    content = re.sub(
        r'^(?:chapter\s+\d+\s*)?[a-z][a-z\s,]+\s+\d{1,3}\s*$',
        '',
        content,
        flags=re.MULTILINE | re.IGNORECASE
    )

    # 23. Form fields / fill-in-the-blanks from workbooks
    # Clean up excessive underscores but preserve some structure
    content = re.sub(r'_{10,}', '_____', content)

    # 24. Exercise numbering normalization
    # "Exercise #1" or "EXERCISE 1" -> consistent format
    content = re.sub(
        r'^(?:EXERCISE|Exercise)\s*#?\s*(\d+)\s*$',
        r'\n### Exercise \1\n',
        content,
        flags=re.MULTILINE
    )

    # 25. Clean up after PDF patterns (may have created extra blank lines)
    content = re.sub(r'\n{4,}', '\n\n\n', content)

    # ============================================
    # ADDITIONAL CLEANUP PATTERNS (v3.3)
    # ============================================

    # 26. Chapter comma-separator normalization
    # "Chapter One, A Special Communication" -> "## Chapter 1: A Special Communication"
    def replace_chapter_comma(match):
        word = match.group(1).lower()
        title = match.group(2).strip()
        num = word_to_num.get(word, word)
        return f'\n\n---\n\n## Chapter {num}: {title}'

    content = re.sub(
        r'^(?:##\s*)?[Cc]hapter\s+(' + '|'.join(word_to_num.keys()) + r'),\s*(.+)$',
        replace_chapter_comma,
        content,
        flags=re.MULTILINE | re.IGNORECASE
    )

    # 27. Remove standalone endorsement/author images
    # Pattern: ![Image](images/image1.png) or ![](images/imageN.png)
    content = re.sub(r'!\[(?:Image)?\]\(images/image\d+\.png\)\n*', '', content)

    # 28. Remove generic image placeholders that are just "Image" on their own line
    content = re.sub(r'^Image\s*$', '', content, flags=re.MULTILINE)

    # 29. Clean up image references with broken alt text
    content = re.sub(r'!\[\s*\]\([^)]+\)\n*', '', content)

    # 30. Normalize "Chapter X," patterns (numeric with comma)
    # "Chapter 1, Introduction" -> "## Chapter 1: Introduction"
    content = re.sub(
        r'^(?:##\s*)?[Cc]hapter\s+(\d+),\s*(.+)$',
        r'\n\n---\n\n## Chapter \1: \2',
        content,
        flags=re.MULTILINE
    )

    # 31. Final cleanup pass for excessive blank lines created by removals
    content = re.sub(r'\n{4,}', '\n\n\n', content)

    # ============================================
    # PUBLISHER-SPECIFIC CLEANUP (v3.4)
    # ============================================

    # 32. Entrepreneur Press markers (No B.S. series, etc.)
    content = re.sub(r'^hide\s*$', '', content, flags=re.MULTILINE)
    content = re.sub(r'^box[n]?\s*$', '', content, flags=re.MULTILINE)
    content = re.sub(r'^top\d+\s*$', '', content, flags=re.MULTILINE)

    # 33. Generic publisher sidebar/callout markers
    content = re.sub(r'^sidebar\s*$', '', content, flags=re.MULTILINE | re.IGNORECASE)
    content = re.sub(r'^callout\s*$', '', content, flags=re.MULTILINE | re.IGNORECASE)
    content = re.sub(r'^note\s*$', '', content, flags=re.MULTILINE | re.IGNORECASE)
    content = re.sub(r'^tip\s*$', '', content, flags=re.MULTILINE | re.IGNORECASE)

    # 34. Remove horizontal rules that are just dashes (often artifacts)
    content = re.sub(r'^-{10,}\s*$', '\n---\n', content, flags=re.MULTILINE)

    # ============================================
    # HTML TAG CLEANUP (v3.4)
    # ============================================

    # 35. Remove figure tags and their wrappers
    content = re.sub(r'<figure[^>]*>', '', content, flags=re.IGNORECASE)
    content = re.sub(r'</figure>', '', content, flags=re.IGNORECASE)

    # 36. Remove remaining img tags (images can't be preserved in markdown text)
    content = re.sub(r'<img[^>]*/?\s*>', '', content, flags=re.IGNORECASE)

    # 37. Remove span tags (keep content)
    content = re.sub(r'<span[^>]*>', '', content, flags=re.IGNORECASE)
    content = re.sub(r'</span>', '', content, flags=re.IGNORECASE)

    # 38. Remove paragraph tags (keep content)
    content = re.sub(r'</?p[^>]*>', '', content, flags=re.IGNORECASE)

    # 39. Remove div tags (keep content)
    content = re.sub(r'</?div[^>]*>', '', content, flags=re.IGNORECASE)

    # 40. Remove anchor tags but keep link text
    content = re.sub(r'<a[^>]*>([^<]*)</a>', r'\1', content, flags=re.IGNORECASE)

    # 41. Remove any remaining HTML comments
    content = re.sub(r'<!--.*?-->', '', content, flags=re.DOTALL)

    # 42. Remove empty parentheses from anchor cleanup
    content = re.sub(r'\(\s*#[^)]*\)', '', content)

    # ============================================
    # FINAL CLEANUP (v3.4)
    # ============================================

    # 43. Clean up lines that became empty after HTML removal
    content = re.sub(r'^\s+$', '', content, flags=re.MULTILINE)

    # 44. Final pass for excessive blank lines
    content = re.sub(r'\n{4,}', '\n\n\n', content)

    # 45. Remove trailing whitespace from all lines
    content = re.sub(r'[ \t]+$', '', content, flags=re.MULTILINE)

    # 46. Remove standalone colon markers (: or :: on their own line)
    content = re.sub(r'^:+\s*$', '', content, flags=re.MULTILINE)

    # 47. Remove calibre class markers that appear as standalone text
    content = re.sub(r'^: calibre\d*\s*$', '', content, flags=re.MULTILINE)

    # 48. Final blank line cleanup after all removals
    content = re.sub(r'\n{3,}', '\n\n', content)

    # ============================================
    # RUNNING HEADER AUTO-DETECTION (v3.4)
    # For PDFs with repeated headers/footers like "The Challenge" appearing 100+ times
    # ============================================

    # 49. Detect and remove running headers
    # Find strings that appear 15+ times on their own lines - likely running headers
    lines = content.split('\n')
    line_counts = Counter(line.strip() for line in lines if line.strip() and len(line.strip()) < 60)

    # Identify lines that appear too frequently (running headers/footers)
    # Exclude markdown headers (lines starting with #)
    running_headers = [
        line for line, count in line_counts.items()
        if count >= 15 and not line.startswith('#') and not line.startswith('>')
    ]

    for header in running_headers:
        # Only remove if it's on its own line (not part of content)
        content = re.sub(rf'^{re.escape(header)}\s*$', '', content, flags=re.MULTILINE)

    # 50. Final cleanup after running header removal
    content = re.sub(r'\n{3,}', '\n\n', content)

    return content


def main():
    if len(sys.argv) < 2:
        print("Usage: cleanup-pandoc.py input.md [output.md]")
        print("  If output.md is omitted, input.md is overwritten in place.")
        sys.exit(1)

    input_path = Path(sys.argv[1])
    output_path = Path(sys.argv[2]) if len(sys.argv) > 2 else input_path

    if not input_path.exists():
        print(f"Error: Input file not found: {input_path}")
        sys.exit(1)

    # Read input
    content = input_path.read_text(encoding='utf-8')
    original_length = len(content)

    # Clean up
    cleaned = cleanup_pandoc_output(content)
    cleaned_length = len(cleaned)

    # Write output
    output_path.write_text(cleaned, encoding='utf-8')

    # Report
    reduction = ((original_length - cleaned_length) / original_length) * 100
    print(f"Cleaned: {input_path}")
    print(f"  Original: {original_length:,} chars")
    print(f"  Cleaned:  {cleaned_length:,} chars")
    print(f"  Reduced:  {reduction:.1f}%")
    print(f"  Output:   {output_path}")


if __name__ == "__main__":
    main()
