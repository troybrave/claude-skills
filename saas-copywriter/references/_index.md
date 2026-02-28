# Copywriting Reference Library Index

This index lists all copywriting books available for reference. Read this file FIRST to determine which references to load based on the user's copy_type and customer_stage.

---

## How to Use This Index

1. Identify the user's **copy_type** and **customer_stage** from discovery questions
2. Find books below that match both tags (or closest match)
3. Read the matching reference file(s) before writing copy
4. Select 1-3 references maximum

---

## Books by Copy Type

### Landing Page / Sales Page
*(No books added yet)*

### Email
*(No books added yet)*

### Ad Copy
*(No books added yet)*

### Onboarding
*(No books added yet)*

### Customer Success / Retention
*(No books added yet)*

### Referral / Advocacy
*(No books added yet)*

---

## Books by Customer Stage

### Cold (Awareness)
*(No books added yet)*

### Problem-Aware
*(No books added yet)*

### Solution-Aware
*(No books added yet)*

### Trial / Freemium
*(No books added yet)*

### Paying Customer
*(No books added yet)*

### Raving Fan
*(No books added yet)*

---

## All Books (Alphabetical)

| Book File | Title | Author | Copy Types | Customer Stages | Style |
|-----------|-------|--------|------------|-----------------|-------|
| *(No books added yet)* | | | | | |

---

## Adding New Books

To add a new book to this library:

1. Use the `book-to-reference` skill to convert the book
2. Or manually create a file at `/Users/troybrave/.claude/skills/saas-copywriter/references/{book-title-slug}.md`
3. Include required frontmatter tags:
   - `copy_type`: landing-page, email, ad-copy, sales-page, onboarding, retention, referral, etc.
   - `customer_stage`: cold, problem-aware, solution-aware, trial, paying, raving-fan
   - `use_case`: acquisition, activation, revenue, retention, referral
   - `style`: direct-response, storytelling, educational, urgency-driven, relationship-based, etc.
4. Update this index file with the new entry

---

## Book File Template

Each book file should follow this structure:

```markdown
---
title: [Full Book Title]
author: [Author Name]
tags:
  copy_type: [comma-separated list]
  customer_stage: [comma-separated list]
  use_case: [comma-separated list]
  style: [comma-separated list]
---

## Core Principles
[Key frameworks and principles from this book]

## When to Use
[Situations where this book's approach works best]

## When NOT to Use
[Situations where this approach would backfire]

## Key Frameworks
[Named frameworks with step-by-step application]

## Example Patterns
[Templates and structures to follow]

## Phrases/Structures That Work
[Specific language patterns from the book]

## Common Mistakes
[What people get wrong when applying this book's principles]
```
