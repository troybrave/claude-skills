---
name: meeting-summary
description: "Generate Fireflies-quality meeting summaries from transcripts. Produces keywords, overview, decisions, action items, and key takeaways with evidence anchoring. Optimized for 100/100 Antigravity Gold Standard."
---

# Meeting Summary Generator (Goldilocks Standard - 100/100)

## TL;DR (Processing Order)
1. Read full transcript → detect meeting type.
2. Extract: Action Items → Decisions → Risks → Topics.
3. **Strict Filter**: Apply 100/100 standards (Deterministic Names, ISO Dates, Total Timestamps).
4. Output: Metadata → Keywords → Overview → Sections.

---

## 💎 100/100 Standards (Mandatory)

| Rule | Requirement |
| :--- | :--- |
| **Deterministic Names** | Use full names matching `contacts.json` (e.g., "Justin Sierra", not "Justin"). |
| **Absolute ISO Dates** | All deadlines must use `YYYY-MM-DD` (e.g., `2026-01-05`, not "Monday"). |
| **Total Timestamping** | Every decision, action item, and risk MUST have a `[HH:MM]` anchor. |
| **Speaker Consistency** | Metadata participants must match action item owners exactly. |

---

## Output Structure

### 1. METADATA
```
📅 Date: [YYYY-MM-DD]
⏱️ Duration: [HH:MM:SS]
👥 Participants: [Name 1, Name 2, Name 3] (Use full names)
🎯 Type: [Detected Type]
```

### 2. KEYWORDS (5-8 max)
Significant recurring terms.

### 3. OVERVIEW (2-3 sentences, <75 words)
Lead with PRIMARY OUTCOME.

### 4. KEY DECISIONS
```
✅ [Decision] — [Who] — [HH:MM "evidence quote"]
```

### 5. ACTION ITEMS ⚠️ CRITICAL
Every item MUST have WHO + WHAT + WHEN + evidence:
```
- [ ] **[Owner Full Name]**: [Specific task] — Due: [YYYY-MM-DD] — [HH:MM "quote"]
```
*Note: Use `- [ ]` format for Notion compatibility.*

### 6. RISKS / BLOCKERS
```
⚠️ [Risk]: [Impact] — [Owner] — [HH:MM "quote"]
```

### 7. DISCUSSION SUMMARY
Group by topic with timestamps:
```
## [Topic Name] [HH:MM-HH:MM]
- Key point 1 [HH:MM]
- Key point 2 [HH:MM]
```

### 8. KEY TAKEAWAYS (3-5 bullets)
Strategic implications.

### 9. OPEN QUESTIONS
Items without clear owner or deadline.

---

## Quality Gate (100/100 Checklist)
- [ ] No relative dates ("next week", "Friday").
- [ ] No ambiguous names ("Troy", "Matty").
- [ ] 100% timestamp coverage for extracted items.
- [ ] Every action uses `- [ ] **Owner**: ` format.
