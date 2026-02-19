# Subscription Detector

Analyzes any transaction dataset to identify recurring payments and subscriptions. Works with any client's data - you provide the source, it finds the patterns.

---

## Trigger Phrases

- "find recurring subscriptions"
- "detect subscriptions in [client name]"
- "analyze transactions for recurring payments"
- "/subscription-detector"

---

## Before Starting

1. Read `/Users/troybrave/.claude/skills/subscription-detector/skill-log.md` for past learnings
2. Load vendor aliases from `/Users/troybrave/.claude/skills/subscription-detector/config/vendor-aliases.json`
3. Load known SaaS vendors from `/Users/troybrave/.claude/skills/subscription-detector/config/saas-vendors.json`
4. Load known SaaS pricing from `/Users/troybrave/.claude/skills/subscription-detector/config/saas-pricing.json`

---

## Phase 0: Pre-Flight Checks (CRITICAL)

**Run these checks BEFORE any analysis. Stop if any fail.**

### 0.1 - Verify Data Source Access

```bash
# For Airtable - verify base exists and PAT is valid
node /Users/troybrave/.claude/.CLI/airtable-cli/cli.js tables [BASE_ID]
# Expected: List of tables. If error → PAT expired or base ID wrong

# For Notion - verify database access
node /Users/troybrave/.claude/.CLI/notion-cli/cli.js schema [DATABASE_ID]
# Expected: Property list. If error → integration not shared with database
```

**If access fails:**
1. Check if PAT/token is expired
2. Verify base/database ID is correct
3. For Notion: ensure integration is shared with the database
4. Report specific error to user before proceeding

### 0.2 - Verify View Exists (Airtable)

```bash
# Check if "Master View" or equivalent exists
node /Users/troybrave/.claude/.CLI/airtable-cli/cli.js views [BASE_ID] [TABLE_NAME]
```

**If "Master View" doesn't exist:**
- Look for views named: "All Records", "Complete", "Full", or the default "Grid view"
- Ask user which view contains ALL transactions
- NEVER use a filtered view (e.g., "This Month", "Recent", "Active")

### 0.3 - Check for Existing Notion Entries (Dedupe)

**CRITICAL: Prevent duplicate entries on re-runs.**

```bash
# Query existing entries in SaaS Subscription database
node /Users/troybrave/.claude/.CLI/notion-cli/cli.js query 2d350f64638780049cb8fdba17228cd7 200
```

**Build a dedupe map:**
```python
existing_vendors = {}
for entry in notion_results:
    vendor_name = entry["Vendor"].lower().strip()
    existing_vendors[vendor_name] = {
        "page_id": entry["id"],
        "current_amount": entry["Total Charge"],
        "status": entry["Status"]
    }
```

**On export, for each vendor:**
```
If vendor in existing_vendors:
    If amount changed → UPDATE existing entry (don't create new)
    If amount same → SKIP (already exists)
Else:
    CREATE new entry
```

### 0.4 - Validate Currency

Check transaction amounts for currency indicators:
- If amounts contain "$" → USD (default)
- If amounts contain "€", "£", "¥" → Flag and ask user for conversion rate
- If amounts are unusually large (>10,000) or small (<0.01) → May be different currency

**Currency normalization:**
```python
currency_rates = {
    "EUR": 1.08,  # to USD
    "GBP": 1.27,
    "CAD": 0.74,
    "AUD": 0.65
}
# Normalize all to USD for consistent analysis
```

### 0.5 - Pre-Flight Report

Before proceeding, output:
```
PRE-FLIGHT CHECK
──────────────────────────────────────────────────────────────
✓ Data source: [Airtable/CSV/Notion] - Connected
✓ Table/View: [name] - [X] records accessible
✓ Notion SaaS DB: [X] existing entries found
✓ Currency: USD (or conversion applied)
✓ Date range: [earliest] to [latest]

Ready to analyze. Proceed? [Y/n]
```

**If ANY check fails → STOP and report before wasting compute on analysis.**

---

## Required Input

The user MUST provide OR you must discover:

| Input | Required | Example |
|-------|----------|---------|
| Data source type | YES | Airtable, CSV, Notion, API |
| Source location | YES | Base ID, file path, database ID |
| Table/collection name | YES | "Transactions", "Payments" |

If not provided, ASK:
```
To detect subscriptions, I need:
1. Where is the transaction data? (Airtable base, CSV file, Notion database, etc.)
2. What's the table/file name?
3. Which client is this for? (for labeling output)
```

---

## Phase 1: Schema Discovery

### 1.1 - Connect to Data Source

**For Airtable:**
```bash
node /Users/troybrave/.claude/.CLI/airtable-cli/cli.js tables [BASE_ID]
node /Users/troybrave/.claude/.CLI/airtable-cli/cli.js schema [BASE_ID] [TABLE_NAME]
```

**For CSV:**
```bash
head -1 [FILE_PATH]  # Get headers
```

**For Notion:**
```bash
node /Users/troybrave/.claude/.CLI/notion-cli/cli.js schema [DATABASE_ID]
```

### 1.2 - Identify Required Fields

Map these concepts to actual field names:

| Concept | Common Names | Required |
|---------|--------------|----------|
| Vendor/Merchant | Merchant, Payee, Vendor, Name, Description | YES |
| Amount | Amount, Total, Value, Debit, Credit | YES |
| Date | Date, Created At, Transaction Date, Posted Date | YES |
| Account | Account, Account Name, Bank, Source | NO (enhances accuracy) |
| Category | Category, Type, Classification | NO (helps SaaS detection) |
| Transaction ID | ID, Transaction ID, Reference | NO (for source tracking) |

If required fields missing → STOP and report.

### 1.3 - Output Schema Map
```
SCHEMA DISCOVERED:
  Source: [Airtable/CSV/Notion]
  Location: [base_id/path/db_id]
  Table: [name]

  Field Mapping:
    Vendor → [actual_field_name]
    Amount → [actual_field_name]
    Date → [actual_field_name]
    Account → [actual_field_name or "N/A"]
    Category → [actual_field_name or "N/A"]
    ID → [actual_field_name or "N/A"]
```

---

## Phase 2: Data Ingestion

### 2.1 - Load Transactions

**CRITICAL: Use pagination to get ALL records, not just first 100.**

**For Airtable (via direct API - more reliable than CLI for large datasets):**
```python
# Use Python with urllib for reliable pagination
import urllib.request, urllib.parse, json

all_records = []
offset = None
while True:
    params = {"view": "Master View", "pageSize": 100, "fields[]": ["Merchant", "Amount", "Created At"]}
    if offset: params["offset"] = offset
    url = f"https://api.airtable.com/v0/{BASE_ID}/{TABLE}?" + urllib.parse.urlencode(params, doseq=True)
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {API_KEY}"})
    data = json.loads(urllib.request.urlopen(req).read().decode())
    all_records.extend(data.get("records", []))
    offset = data.get("offset")
    if not offset: break
```

**IMPORTANT:** Always use "Master View" or equivalent that contains ALL transactions. Don't use filtered views that might exclude records.

**For CSV:**
```bash
# Read and parse
cat [FILE_PATH]
```

**For Notion:**
```bash
node /Users/troybrave/.claude/.CLI/notion-cli/cli.js query [DATABASE_ID] 500
```

### 2.2 - Normalize Vendors

Load aliases from config:
```bash
cat /Users/troybrave/.claude/skills/subscription-detector/config/vendor-aliases.json
```

Apply transformations:
1. Trim whitespace
2. Remove punctuation: `. , - ' " ( ) * #`
3. Remove legal suffixes: `INC, LLC, LTD, CORP, CO, COMPANY, ENTERPRISES`
4. Remove URL cruft: `WWW, HTTP, HTTPS, .COM, .IO, .CO`
5. Apply known aliases from config
6. Title Case for display, lowercase for matching

### 2.3 - Flag Anomalies

- **Refunds:** Negative amounts OR keywords (REFUND, REVERSAL, CREDIT, RETURN)
- **Missing data:** Blank vendor, zero amount, missing date → skip
- **Duplicates:** Same vendor + amount + date within 24 hours → dedupe

**Output:**
```
INGESTED: [X] valid transactions
SKIPPED: [X] (missing data)
FLAGGED: [X] refunds/reversals
UNIQUE VENDORS: [X]
DATE RANGE: [earliest] to [latest]
```

### 2.4 - Build Transaction Audit Trail

**CRITICAL: Track which transactions support each detected subscription.**

For each vendor group, maintain a reference list:
```python
audit_trail = {
    "vendor_normalized": "HighLevel",
    "source_transactions": [
        {"id": "rec123abc", "date": "2024-12-15", "amount": 530.00, "raw_vendor": "HighLevel Inc"},
        {"id": "rec456def", "date": "2024-11-15", "amount": 530.00, "raw_vendor": "HighLevel Agency Sub"},
        {"id": "rec789ghi", "date": "2024-10-15", "amount": 497.00, "raw_vendor": "HighLevel"}
    ],
    "monthly_breakdown": {
        "2024-12": {"total": 530.00, "transactions": 1},
        "2024-11": {"total": 530.00, "transactions": 1},
        "2024-10": {"total": 497.00, "transactions": 1}
    },
    "aggregation_applied": true,
    "variants_combined": ["HighLevel Inc", "HighLevel Agency Sub", "HighLevel"]
}
```

**Why this matters:**
- User can verify which transactions were counted
- Debugging when amounts seem wrong
- Audit trail for financial reconciliation
- Can re-run with different grouping if user disagrees

**Store audit trail:**
- In memory during run
- Optionally export to `audit-[client]-[date].json` if user requests

---

## Phase 3: Recurrence Detection

### 3.1 - Group and Aggregate Transactions

**CRITICAL: Aggregate Multiple Charges Per Vendor**
Many vendors have multiple line items per month (e.g., iPostal has storage + shipping + scans). These must be SUMMED to get true monthly cost.

Group by: `normalized_vendor` (combine related services like "iPostal1", "Ipostal Storage", "Ipostalship" → "iPostal (combined)")

For each group, calculate:
- **Count:** Number of transactions
- **Monthly Totals:** Sum all charges per calendar month
- **Typical Monthly:** Use MODE (most common monthly value) NOT average - duplicates and outliers skew averages
- **Dates:** List of all dates, sorted
- **Intervals:** Days between consecutive transactions

**CRITICAL: Use MODE not AVERAGE**
- If Dec has $1,059 (duplicate) but Nov/Oct/Sep all have ~$530, the typical is $530
- Look at 6+ months of data to find the recurring pattern
- Flag months with unusual amounts (2x normal = possible duplicate)

**Vendor Aggregation Rules:**
- Combine vendor variants: "HighLevel Inc." + "HighLevel Agency Sub" → "HighLevel (combined)"
- Combine iPostal variants: all "ipostal*" → "iPostal (combined)"
- Combine AWS variants: "Amazon Web Services" + any "AWS*" → "AWS"

### 3.2 - Detect Frequency

| Frequency | Interval Range | Notes |
|-----------|---------------|-------|
| Weekly | 5-9 days | Rare for SaaS |
| Bi-weekly | 12-16 days | Payroll-style |
| Monthly | 25-35 days | Most common |
| Quarterly | 85-100 days | Common for enterprise |
| Semi-annual | 175-195 days | Uncommon |
| Annual | 350-380 days | Common for SaaS |

If no pattern matches → `Irregular`

### 3.2.1 - Annual Subscription Special Handling

**CRITICAL: Annual subs only have 1-2 transactions, so standard confidence scoring fails.**

**Detection criteria for annual:**
```python
if transaction_count <= 2 and any_amount > 100:
    # Check if amount looks like annual (typically 10-20% discount vs monthly)
    # Annual = ~10x monthly equivalent

    # Compare to known pricing
    for vendor_key, vendor_data in saas_pricing.items():
        if vendor_matches(normalized_vendor, vendor_key):
            monthly_tier = find_closest_tier(amount / 12, vendor_data.tiers)
            if monthly_tier:
                # This is likely an annual subscription
                return {
                    "frequency": "Annual",
                    "monthly_equivalent": amount / 12,
                    "confidence": 0.75,  # Override low occurrence score
                    "note": f"Annual payment, ~${amount/12:.0f}/mo equivalent"
                }
```

**Annual subscription indicators:**
- Large single payment ($200+)
- Matches ~10-12x a known monthly tier
- Keywords in vendor: "annual", "yearly", "12 month"
- Transaction date in Jan/Dec (common renewal months)

**For annual subs in reports:**
```
ANNUAL SUBSCRIPTIONS (Renews Yearly)
┌────────────────────┬──────────┬──────────────┬────────────────┬──────────────┐
│ Vendor             │ Annual   │ Monthly Equiv│ Next Renewal   │ Confidence   │
├────────────────────┼──────────┼──────────────┼────────────────┼──────────────┤
│ Adobe CC           │ $599     │ $49.92       │ ~2025-03       │ 0.82         │
│ 1Password          │ $36      │ $3.00        │ ~2025-07       │ 0.75         │
└────────────────────┴──────────┴──────────────┴────────────────┴──────────────┘
```

### 3.2.2 - Proration Detection

**Problem:** Mid-month signups show irregular first payment.

**Detection:**
```python
if transaction_count >= 3:
    amounts = sorted(all_amounts)
    typical = mode(amounts)
    first_amount = amounts_by_date[0]

    # First amount is partial (proration)
    if first_amount < typical * 0.9 and first_amount > 0:
        proration_detected = True
        # Exclude first payment from typical calculation
        typical = mode(amounts[1:])
```

**Proration indicators:**
- First transaction amount < 90% of typical
- Subsequent amounts are consistent
- First transaction date is mid-month (10th-25th)

**Report prorated subs:**
```
Note: [Vendor] first charge was $12.50 (prorated), typical is $25/mo
```

### 3.2.3 - Tier Change Detection

**Detect upgrades/downgrades within the same vendor:**

```python
# Sort amounts chronologically
amounts_chronological = [a for d, a in sorted(zip(dates, amounts))]

# Check for consistent change
if len(set(amounts_chronological[:3])) == 1 and len(set(amounts_chronological[-3:])) == 1:
    old_amount = amounts_chronological[0]
    new_amount = amounts_chronological[-1]

    if old_amount != new_amount:
        change_type = "Upgrade" if new_amount > old_amount else "Downgrade"
        change_date = find_transition_date(amounts_chronological)

        return {
            "tier_change": True,
            "type": change_type,
            "from": old_amount,
            "to": new_amount,
            "date": change_date,
            "current_amount": new_amount  # Use current tier for totals
        }
```

**Report tier changes:**
```
TIER CHANGES DETECTED
┌────────────────────┬──────────┬──────────┬──────────┬──────────────┐
│ Vendor             │ Change   │ From     │ To       │ Date         │
├────────────────────┼──────────┼──────────┼──────────┼──────────────┤
│ Slack              │ Upgrade  │ $45/mo   │ $90/mo   │ 2024-08      │
│ Notion             │ Downgrade│ $15/mo   │ $10/mo   │ 2024-11      │
└────────────────────┴──────────┴──────────┴──────────┴──────────────┘
```

### 3.3 - Calculate Confidence Score (0.0 - 1.0)

**CRITICAL: Known SaaS Boost**
If vendor matches ANY name in `saas-vendors.json` (case-insensitive):
- Set MINIMUM confidence floor of 0.65
- This means known SaaS with 2+ transactions ALWAYS makes "Likely" threshold

```
base_confidence = occurrence_score × interval_score × amount_score × anomaly_penalty

occurrence_score:
  2 transactions: 0.55
  3 transactions: 0.75
  4 transactions: 0.88
  5+ transactions: 1.00

interval_score (based on std deviation of intervals):
  std_dev < 3 days: 1.00
  std_dev < 7 days: 0.90
  std_dev < 14 days: 0.75
  std_dev >= 14 days: 0.50

amount_score (coefficient of variation = std_dev / mean):
  cv < 0.05 (5%): 1.00
  cv < 0.10 (10%): 0.95
  cv < 0.20 (20%): 0.85
  cv >= 0.20: 0.70

anomaly_penalty:
  Has refund in history: × 0.85
  Has gap > 2× expected interval: × 0.90

KNOWN_SAAS_BOOST (applied AFTER base calculation):
  If vendor in saas-vendors.json:
    confidence = MAX(base_confidence, 0.65)
```

### 3.4 - Determine Activity Status

**CRITICAL: Staleness Check**
Before categorizing, determine if subscription is ACTIVE or INACTIVE:

```
days_since_last = today - last_transaction_date

Activity Status:
  days_since_last <= 45:  ACTIVE
  days_since_last <= 90:  ACTIVE (but flag "May be churned")
  days_since_last <= 180: INACTIVE - "Cancelled or lapsed"
  days_since_last > 180:  INACTIVE - "Dormant (6+ months)"
```

**INACTIVE subscriptions:**
- Do NOT include in "Confirmed" or "Likely" lists
- Report separately in "INACTIVE SUBSCRIPTIONS" section
- Do NOT count toward monthly cost totals
- Label with reason: "Last charged [date] - [X] months ago"

### 3.5 - Categorize Results

**For ACTIVE subscriptions only:**

| Confidence | Category | Action |
|------------|----------|--------|
| ≥ 0.75 | **Confirmed** | High confidence recurring |
| 0.50 - 0.74 | **Likely** | Probable recurring, needs review |
| 0.30 - 0.49 | **Possible** | Might be recurring, low confidence |
| < 0.30 | **Skip** | Not enough evidence |

**For INACTIVE subscriptions:**
- List ALL detected recurring patterns regardless of confidence
- Group by: "Recently Lapsed (3-6 mo)" vs "Dormant (6+ mo)"

---

## Phase 4: SaaS Classification

### 4.1 - Load Known SaaS Vendors
```bash
cat /Users/troybrave/.claude/skills/subscription-detector/config/saas-vendors.json
```

### 4.2 - Classify Each Vendor

**Positive SaaS signals:**
- Matches known SaaS vendor list
- Keywords: software, cloud, saas, api, hosting, app, subscription, platform, service
- Category contains: Software, Technology, Cloud, Digital, Online

**Negative signals (NOT SaaS):**
- Keywords: utility, electric, gas, water, insurance, rent, lease, loan
- Physical goods indicators: shipping, delivery, retail, store
- Food/travel: restaurant, hotel, airline, uber, lyft

**Classification:**
- `SaaS` - Confirmed software subscription
- `Service` - Recurring but not software (gym, utilities)
- `Unknown` - Can't determine
- `Not Recurring` - Doesn't meet recurrence criteria

---

## Phase 4.5: Price Validation & Research

### 4.5.1 - Load Known Pricing

```bash
cat /Users/troybrave/.claude/skills/subscription-detector/config/saas-pricing.json
```

This file contains known SaaS pricing tiers for validation.

### 4.5.2 - Validate Detected Amounts

For each detected subscription, compare against known pricing:

```
For each vendor in saas-pricing.json:
  1. Find the detected monthly amount
  2. Compare to known tiers
  3. Determine which tier matches (within 10% tolerance)
  4. Flag anomalies:
     - Amount is 1.8x+ a known tier → possible duplicate charge
     - Amount doesn't match ANY tier → needs manual review
     - Amount matches tier exactly → high confidence
```

**Validation Output:**
```
PRICE VALIDATION
┌────────────────────┬──────────┬──────────────┬────────────────┬──────────┐
│ Vendor             │ Detected │ Expected Tier│ Tier Price     │ Status   │
├────────────────────┼──────────┼──────────────┼────────────────┼──────────┤
│ HighLevel          │ $530     │ saas_pro     │ $497 + usage   │ ✓ Valid  │
│ Claude             │ $213     │ team_premium │ $150/seat      │ ✓ Valid  │
│ Webflow            │ $31      │ cms          │ $29/site       │ ✓ Valid  │
│ Unknown Vendor     │ $99      │ -            │ -              │ ? Review │
└────────────────────┴──────────┴──────────────┴────────────────┴──────────┘
```

### 4.5.3 - Research Unknown Vendors (Systematic Protocol)

**For vendors NOT in saas-pricing.json**, follow this EXACT research protocol:

#### Step 1: Find Official Pricing Page
```bash
# Use WebSearch to find the official pricing page
WebSearch: "[vendor name] pricing plans"
```

**Priority order for sources:**
1. Official website `/pricing` or `/plans` page (BEST)
2. Official documentation
3. Review sites (G2, Capterra) - use with caution, may be outdated
4. NEVER trust: random blogs, affiliate sites, old articles

#### Step 2: Extract Pricing Data (Structured)

Create a mental model of the pricing:
```
VENDOR: [Name]
URL: [pricing page URL]
LAST_VERIFIED: [today's date]

PRICING MODEL: [flat | per_seat | per_project | per_site | usage_based | hybrid]

TIERS:
  - [tier_name]: $[monthly] /mo ($[annual]/mo if annual)
  - [tier_name]: $[monthly] /mo ($[annual]/mo if annual)
  - [tier_name]: "Contact Sales" or "Custom"

USAGE COMPONENTS: [if any]
  - [component]: $[rate] per [unit]

NOTES: [special conditions, minimums, etc.]
```

#### Step 3: Match Detected Amount to Tier

```python
detected = [detected_monthly_amount]

# Check each tier
for tier_name, tier_price in vendor.tiers.items():
    # Direct match (within 10%)
    if 0.9 * tier_price <= detected <= 1.1 * tier_price:
        return {"tier": tier_name, "confidence": "high", "users": 1}

    # Per-seat match (try 1-20 users)
    if vendor.per_seat:
        for n in range(1, 21):
            if 0.9 * (tier_price * n) <= detected <= 1.1 * (tier_price * n):
                return {"tier": tier_name, "confidence": "high", "users": n}

    # Usage-based adjustment
    if vendor.usage_based:
        # Base tier + ~20% typical usage overhead
        if 0.9 * tier_price <= detected <= 1.3 * tier_price:
            return {"tier": tier_name, "confidence": "medium", "note": "includes usage"}

# No match found
return {"tier": "unknown", "confidence": "low", "action": "manual review"}
```

#### Step 4: Update saas-pricing.json

**ALWAYS add newly researched vendors to the config:**
```bash
# Read current config
cat /Users/troybrave/.claude/skills/subscription-detector/config/saas-pricing.json

# Add new vendor entry
# Use Edit tool to add to "vendors" section
```

**New vendor template:**
```json
"newvendor": {
  "name": "New Vendor Display Name",
  "tiers": {
    "free": 0,
    "starter": 10,
    "pro": 25,
    "enterprise": "custom"
  },
  "per_seat": true,
  "usage_based": false,
  "notes": "Researched [DATE]. Source: [URL]"
}
```

#### Step 5: Log Research for Future Reference

Add to skill-log.md under "Pricing Research":
```markdown
| Vendor | Researched | Source | Notes |
|--------|------------|--------|-------|
| [Name] | [Date] | [URL] | [key findings] |
```

### 4.5.4 - Determine User Count

For per-seat SaaS (marked `per_seat: true` in saas-pricing.json):

```python
if vendor.per_seat:
    # Find matching tier
    for tier_name, tier_price in vendor.tiers.items():
        if abs(detected_amount - tier_price * n) < tolerance:
            user_count = n
            cost_per_user = tier_price
            break

    # Example: Claude at $213/mo with $150/seat tier
    # → likely 1-2 users (1 user = $150, difference is usage)
```

**Per-Seat Calculations:**
| Vendor | Detected | Tier | Per Seat | Est. Users | Cost/User |
|--------|----------|------|----------|------------|-----------|
| Claude | $213 | team_premium | $150 | 1 | $150 |
| Slack | $45 | pro | $9 | 5 | $9 |
| Figma | $45 | professional | $15 | 3 | $15 |

### 4.5.5 - Flag Pricing Anomalies

Report these for user review:

```
PRICING ANOMALIES
──────────────────────────────────────────────────────────────

⚠️  POSSIBLE DUPLICATE CHARGES:
  • HighLevel: $1,059 in Dec (typical is $530) - 2x normal

⚠️  AMOUNT DOESN'T MATCH KNOWN TIERS:
  • Unknown Corp: $47/mo - no matching tier found

⚠️  USAGE-BASED VARIANCE:
  • AWS: Varies $80-$200/mo - usage-based, typical ~$80
```

---

## Phase 5: Generate Report

### 5.1 - Summary Statistics

```
══════════════════════════════════════════════════════════════
           SUBSCRIPTION DETECTION REPORT
══════════════════════════════════════════════════════════════

CLIENT: [client_name]
SOURCE: [source_type] → [location]
ANALYZED: [date_range]
TRANSACTIONS: [total_count]

DETECTED SUBSCRIPTIONS
──────────────────────────────────────────────────────────────
```

### 5.2 - Confirmed Subscriptions (confidence ≥ 0.75)

```
CONFIRMED (High Confidence)
┌────────────────────┬──────────┬──────────┬────────┬───────────┬──────────┐
│ Vendor             │ Type     │ Frequency│ Amount │ Confidence│ Last Paid│
├────────────────────┼──────────┼──────────┼────────┼───────────┼──────────┤
│ Vercel             │ SaaS     │ Monthly  │ $60.00 │ 0.95      │ 2025-12  │
│ Webflow            │ SaaS     │ Monthly  │ $31.62 │ 0.88      │ 2025-12  │
│ Shortcut Software  │ SaaS     │ Monthly  │ $85.28 │ 0.82      │ 2024-09  │
└────────────────────┴──────────┴──────────┴────────┴───────────┴──────────┘
```

### 5.3 - Likely Subscriptions (0.50-0.74)

```
LIKELY (Needs Review)
┌────────────────────┬──────────┬──────────┬────────┬───────────┬──────────────────┐
│ Vendor             │ Type     │ Frequency│ Amount │ Confidence│ Review Reason    │
├────────────────────┼──────────┼──────────┼────────┼───────────┼──────────────────┤
│ iPostal1           │ Service  │ Monthly  │ $6.72  │ 0.68      │ Only 3 occurrences│
│ Apple              │ Unknown  │ Irregular│ $26.63 │ 0.55      │ Amount varies 40%│
└────────────────────┴──────────┴──────────┴────────┴───────────┴──────────────────┘
```

### 5.4 - Inactive Subscriptions (CRITICAL SECTION)

**ALWAYS include this section.** These are recurring patterns that have stopped.

```
INACTIVE SUBSCRIPTIONS (Not Currently Charging)
──────────────────────────────────────────────────────────────

RECENTLY LAPSED (3-6 months since last charge):
┌────────────────────┬──────────┬──────────┬────────┬─────────────────────────┐
│ Vendor             │ Type     │ Frequency│ Amount │ Status                  │
├────────────────────┼──────────┼──────────┼────────┼─────────────────────────┤
│ Shortcut           │ SaaS     │ Monthly  │ $85.28 │ Last: 2024-09 (3 mo ago)│
└────────────────────┴──────────┴──────────┴────────┴─────────────────────────┘

DORMANT (6+ months since last charge):
┌────────────────────┬──────────┬──────────┬────────┬─────────────────────────┐
│ Vendor             │ Type     │ Frequency│ Amount │ Status                  │
├────────────────────┼──────────┼──────────┼────────┼─────────────────────────┤
│ DAT Solutions      │ SaaS     │ Monthly  │ $99.00 │ Last: 2024-07 (6 mo ago)│
│ Old Vendor         │ Service  │ Annual   │ $199   │ Last: 2024-01 (12 mo)   │
└────────────────────┴──────────┴──────────┴────────┴─────────────────────────┘

⚠️  Review these - may be cancelled, expired cards, or still active elsewhere.
```

### 5.5 - Financial Summary

```
MONTHLY COST ESTIMATE
──────────────────────────────────────────────────────────────
  Monthly subscriptions:      $[sum]
  Quarterly (÷3):            $[sum/3]
  Annual (÷12):              $[sum/12]
  ────────────────────────────────────
  TOTAL MONTHLY:             $[total]
  TOTAL ANNUAL:              $[total × 12]

TOP 5 BY COST:
  1. [Vendor] - $[amount]/month
  2. [Vendor] - $[amount]/month
  3. [Vendor] - $[amount]/month
  4. [Vendor] - $[amount]/month
  5. [Vendor] - $[amount]/month
```

### 5.5 - Export Options

After presenting results, offer:
```
What would you like to do with these results?
1. Export to Notion (specify database)
2. Export to CSV
3. Export to Airtable (specify base/table)
4. Just save the report
```

---

## Phase 6: Optional Export

If user requests export:

### To Notion (SaaS Subscription Database):

**Database ID:** `2d350f64638780049cb8fdba17228cd7` (default SaaS tracking)

**Full field mapping:**
| Notion Field | Type | Source |
|--------------|------|--------|
| Vendor | title | Normalized vendor name |
| Total Charge | number | Monthly amount (MODE, not average) |
| cost/user | number | Per-seat cost from saas-pricing.json |
| Active User Count | rich_text | Estimated user count (string) |
| Status | status | "Active" or "De-Activated" |
| Occurance | status | "Monthly", "Annual", or "One Time" |
| Description | rich_text | "[type] subscription detected from [source]" |

**API Format (IMPORTANT - use proper Notion property format):**
```bash
node /Users/troybrave/.claude/.CLI/notion-cli/cli.js create [DATABASE_ID] '{
  "Vendor": {"title": [{"text": {"content": "[name]"}}]},
  "Total Charge": {"number": [amount]},
  "cost/user": {"number": [cost_per_user or null]},
  "Active User Count": {"rich_text": [{"text": {"content": "[user_count]"}}]},
  "Status": {"status": {"name": "Active"}},
  "Occurance": {"status": {"name": "[Monthly/Annual/One Time]"}},
  "Description": {"rich_text": [{"text": {"content": "[type] subscription - [tier_name] tier"}}]}
}'
```

**Example with per-seat calculation:**
```bash
# Claude.ai - $213/mo, team premium tier at $150/seat, ~1 user
node /Users/troybrave/.claude/.CLI/notion-cli/cli.js create 2d350f64638780049cb8fdba17228cd7 '{
  "Vendor": {"title": [{"text": {"content": "Claude.ai (Anthropic)"}}]},
  "Total Charge": {"number": 213},
  "cost/user": {"number": 150},
  "Active User Count": {"rich_text": [{"text": {"content": "1"}}]},
  "Status": {"status": {"name": "Active"}},
  "Occurance": {"status": {"name": "Monthly"}},
  "Description": {"rich_text": [{"text": {"content": "SaaS - Team Premium tier"}}]}
}'
```

**For non-per-seat vendors:**
- Set `cost/user` to the total charge (they are the only user)
- Set `Active User Count` to "1" or "N/A"

### To CSV:
Create file at user-specified path with columns:
`Vendor, Type, Frequency, Amount, Cost Per User, User Count, Tier, Confidence, Last Paid, Source`

### To Airtable:
```bash
node /Users/troybrave/.claude/.CLI/airtable-cli/cli.js create [BASE_ID] [TABLE] '{...}'
```

---

## Error Handling

| Error | Action |
|-------|--------|
| Can't connect to data source | Report error, suggest checking credentials |
| Required fields not found | List available fields, ask user to map |
| No transactions found | Report empty dataset |
| No recurring patterns found | Report "No subscriptions detected" with stats |
| Export fails | Log error, offer alternative export |

---

## After Completion

Ask user:
```
Was this analysis helpful? Any vendors miscategorized or missed?
```

If feedback provided, log to skill-log.md for future improvement.

---

## Configuration Files

### vendor-aliases.json
Location: `/Users/troybrave/.claude/skills/subscription-detector/config/vendor-aliases.json`

Used to normalize vendor names across different transaction sources.

### saas-vendors.json
Location: `/Users/troybrave/.claude/skills/subscription-detector/config/saas-vendors.json`

Known SaaS vendors for classification by category.

### saas-pricing.json
Location: `/Users/troybrave/.claude/skills/subscription-detector/config/saas-pricing.json`

Known SaaS pricing tiers for validation and user count calculation.

**Structure:**
```json
{
  "vendors": {
    "vendor_key": {
      "name": "Display Name",
      "tiers": {
        "tier_name": price_in_dollars
      },
      "per_seat": true/false,
      "per_site": true/false,
      "per_project": true/false,
      "usage_based": true/false,
      "notes": "Additional context"
    }
  },
  "validation_rules": {
    "exact_match_tolerance": 0.10,
    "duplicate_threshold": 1.8
  }
}
```

**Updating the pricing file:**
When you discover a new vendor's pricing via web research, add it to this file:
1. Use lowercase key (e.g., "newvendor")
2. Include all tier names and prices
3. Mark `per_seat: true` if pricing is per-user
4. Add `notes` for any special pricing rules

---

## Example Invocations

**Airtable client:**
```
User: "Find subscriptions in the Brave Entities Airtable base"
→ Discovers Transactions table, runs analysis
```

**CSV file:**
```
User: "Analyze /path/to/client-transactions.csv for recurring payments"
→ Parses CSV, runs analysis
```

**Notion database:**
```
User: "Detect subscriptions in Notion database abc123"
→ Queries Notion, runs analysis
```

**Generic:**
```
User: "/subscription-detector"
→ Asks: "Which data source should I analyze?"
```
