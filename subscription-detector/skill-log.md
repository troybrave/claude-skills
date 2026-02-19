# Skill Log: subscription-detector

> Tracks learnings, corrections, and improvements. Claude reads this BEFORE each run.

---

## Status

| Metric | Value |
|--------|-------|
| **Created** | 2025-12-24 |
| **Last Updated** | 2025-12-25 |
| **Runs Completed** | 3 |
| **Stability** | Battle-Tested |

---

## Vendor Corrections

When users correct vendor classifications, log them here for future reference.

| Vendor | Incorrect Classification | Correct Classification | Date |
|--------|-------------------------|------------------------|------|
| Canva | Low confidence (0.30) | Known SaaS - should be 0.65+ | 2025-12-25 |
| DAT Solutions | Marked as Active | INACTIVE (6+ months since last charge) | 2025-12-25 |
| Shortcut | Included in active list | INACTIVE (last charge March 2025) | 2025-12-25 |

---

## Missed Subscriptions

Subscriptions the skill missed that users identified.

| Vendor | Why Missed | Fix Applied | Date |
|--------|-----------|-------------|------|
| *None yet* | - | - | - |

---

## False Positives

Vendors incorrectly flagged as subscriptions.

| Vendor | Why Flagged | Actual Nature | Date |
|--------|------------|---------------|------|
| DAT Solutions | Had recurring pattern | Cancelled 6+ months ago | 2025-12-25 |
| Shortcut | Had recurring pattern | Cancelled 9+ months ago | 2025-12-25 |

---

## Amount Corrections

**CRITICAL LEARNINGS** - These mistakes must not be repeated.

| Vendor | Wrong Amount | Correct Amount | Why Wrong | Fix |
|--------|-------------|----------------|-----------|-----|
| HighLevel | $784 | ~$530 | Averaged months with duplicates | Use MODE not AVERAGE |
| iPostal | $12 | ~$70 | Only counted one line item | Sum ALL charges per vendor per month |
| AWS | $129 | ~$80 | Included old high months | Use recent MODE, note variance |
| Claude | $296 | ~$213 | Double charge in Dec | Use MODE from 6+ months |
| OpenAI | $67 | ~$21 | Averaging error | Verify against known pricing |

**KEY LESSON:** Always use MODE (most common monthly value), not AVERAGE. Duplicates and outliers destroy averages.

---

## Data Source Notes

Learnings about specific data sources.

| Source | Notes |
|--------|-------|
| Airtable - Brave Entities | Base ID: appYMEW2CsYkfGxGv, Transactions table, field "Merchant" for vendor, "Amount" for charge, "Created At" for date |
| Airtable Pagination | CLI only gets 100 records - MUST use direct API with pagination for large datasets |
| Airtable Views | Always use "Master View" - filtered views may exclude records |

---

## Confidence Tuning

If thresholds need adjustment based on real-world performance.

| Change | Reason | Date |
|--------|--------|------|
| Added Known SaaS Boost (min 0.65) | Canva was 0.30 despite being obvious SaaS | 2025-12-25 |
| Added Staleness Check (>90 days = INACTIVE) | DAT was marked active but hadn't charged in 6 months | 2025-12-25 |

---

## Run History

| Date | Client/Source | Transactions | Confirmed | Likely | Exported |
|------|--------------|--------------|-----------|--------|----------|
| 2025-12-25 | Brave Entities (Airtable) | 7,129 | 81 | 184 | 19 to Notion |
| 2025-12-25 | Brave Entities (Re-run) | 7,129 | - | - | Corrected amounts |

---

## Pricing Validation

**Added Phase 4.5** to validate detected amounts against known SaaS pricing.

Reference file: `/Users/troybrave/.claude/skills/subscription-detector/config/saas-pricing.json`

Contains 25+ vendors with:
- Tier names and prices
- Per-seat flags
- Usage-based indicators
- Notes for special cases

**Validation rules:**
- 10% tolerance for tier matching
- 1.8x threshold for duplicate detection

---

## Notion Export Format

**Database ID:** `2d350f64638780049cb8fdba17228cd7`

**Required fields:**
- Vendor (title)
- Total Charge (number)
- cost/user (number) - per-seat cost
- Active User Count (rich_text) - estimated users
- Status (status) - Active/De-Activated
- Occurance (status) - Monthly/Annual/One Time

**CRITICAL:** Use proper Notion API property format, not simple key-value pairs.

---

## Improvement Ideas

- [x] Add support for multi-currency normalization → Added Phase 0.4
- [x] Detect subscription tier changes (upgrade/downgrade) → Added Phase 3.2.3
- [x] Add "stale subscription" detection (last paid > 60 days) → Added staleness check
- [ ] Integration with GoHighLevel for agency clients
- [x] Research vendor pricing websites for validation → Added Phase 4.5.3 systematic protocol
- [x] Store known pricing in JSON for reference → Created saas-pricing.json
- [x] Auto-dedupe Notion entries when re-running → Added Phase 0.3
- [x] Track tier changes over time (upgrade/downgrade history) → Added Phase 3.2.3
- [x] Add pre-flight checks → Added Phase 0
- [x] Add transaction audit trail → Added Phase 2.4
- [x] Add annual subscription handling → Added Phase 3.2.1
- [x] Add proration detection → Added Phase 3.2.2

---

## Skill Rating History

| Date | Score | Notes |
|------|-------|-------|
| 2025-12-25 (initial) | 65/100 | Basic detection, many edge case failures |
| 2025-12-25 (v2) | 78/100 | Added SaaS boost, staleness, MODE, aggregation |
| 2025-12-25 (v3) | 92/100 | Added Phase 0 pre-flight, dedupe, audit trail, annual/proration handling |

**Current gaps to 100:**
- GoHighLevel integration for agency clients (-3)
- Cross-account deduplication (same vendor on multiple cards) (-2)
- Automated pricing updates when vendors change prices (-2)
- Historical trend analysis (spend increasing/decreasing over time) (-1)
