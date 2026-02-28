---
name: chase-transaction-import
description: "DEPRECATED: Use statement-processing and merchant-mapping skills instead. Redirects to the new pipeline from Endless-Winning-AI/statement-processing repo."
allowed-tools: Read
---

# Bank Transaction Import Skill (DEPRECATED)

> **This skill is deprecated.** It has been replaced by two specialized skills from the `Endless-Winning-AI/statement-processing` repository:
>
> - **statement-processing** -- Organize PDFs, OCR extract, import to Airtable
>   - `/organize-statements` -- Scan, rename, distribute PDFs
>   - `/import-statements` -- Full OCR + Airtable import
>   - `/setup-import` -- Auto-discover Airtable schema
>   - `/new-client` -- Register a new client
>   - `/find-client` -- Lookup client details
>
> - **merchant-mapping** -- AI-powered transaction matching
>   - `/map-merchants` -- 5-tier merchant matching pipeline
>   - `/setup-coa` -- Auto-discover COA schema
>   - `/seed-client` -- Seed COA + merchants from Supabase master
>
> **Source repo:** cloned to `/Users/troybrave/.claude/.CLI/statement-processing`
>
> Use those skills instead of this one.

---

## Usage
```
/chase-transaction-import <client> <statement-uid>
```

### Parameters
| Parameter | Required | Description | Example |
|-----------|----------|-------------|---------|
| client | Yes | Airtable client alias | "blackhawk logistics" |
| statement-uid | Yes | Statement UID | "0823 \| CHK - 5509" |

### Example
```
/chase-transaction-import "blackhawk logistics" "0823 | CHK - 5509"
```

---

## Workflow

### Step 1: Parse Arguments

Extract from the invocation:
- `client` - The Airtable client alias (e.g., "blackhawk logistics")
- `statement_uid` - The Statement UID (e.g., "0823 | CHK - 5509")

If arguments are missing, use AskUserQuestion to prompt for them.

### Step 2: Load Airtable Tools

Use ToolSearch to load the required Airtable MCP tools:
```
ToolSearch: "airtable client"
```

This loads: `mcp__airtable__client_getRecords`, `mcp__airtable__client_createRecords`, etc.

### Step 3: Fetch Statement Record

Query Airtable for the statement:
```
Client: <client>
Table: Statements
Filter: {Statement UID} = '<statement-uid>'
Fields: Statement UID, Statement Doc, Account, Statement Beginning Balance, Statement Ending Balance
```

**Validation Checklist:**
- [ ] Statement record exists → If not: "❌ Statement '<uid>' not found in <client>"
- [ ] PDF attachment present (Statement Doc) → If not: "❌ No PDF attached to statement '<uid>'"
- [ ] Account linked → If not: "❌ No account linked to statement '<uid>'"

Extract and store:
- `statement_record_id` - The record ID for linking
- `account_record_id` - From the Account linked field
- `pdf_url` - From Statement Doc attachment
- `beginning_balance` - Statement Beginning Balance
- `ending_balance` - Statement Ending Balance

### Step 4: Check if Statement Already Has Transactions (CRITICAL)

**IMPORTANT:** Before processing, check if transactions are already linked to this statement.

**Query the Statement's linked transactions:**
```
Client: <client>
Table: Statements
Filter: {Statement UID} = '<statement-uid>'
Fields: Statement UID, Transactions
```

**Decision Logic:**
- If `Transactions` field has linked records → **STOP** and report:
  ```
  ⚠️ Statement '<uid>' already has <count> transactions linked.

  To re-import, first unlink or delete existing transactions.

  Existing transactions:
  - <date> | <merchant> | $<amount>
  - ...
  ```
- If `Transactions` field is empty → Proceed to Step 5

This prevents duplicate imports when the skill is run multiple times on the same statement.

### Step 4a: Check for Existing Account Transactions (Fuzzy Match for Plaid)

**Why fuzzy matching:** Plaid imports may have dates that differ by 1-3 days from the bank statement date. We need to check for potential duplicates across the entire account, not just statement-linked transactions.

Query existing transactions for the **account** within the statement period ±3 days:
```
Client: <client>
Table: Transactions
Filter: AND(
  {Accounts} = '<account_record_id>',
  {Created At} >= '<statement_start_date - 3 days>',
  {Created At} <= '<statement_end_date + 3 days>'
)
Fields: Created At, Amount, Description, Merchant, Transaction Type, record_id
```

Build a list of existing transactions for fuzzy matching:
```python
existing_transactions = [
  {
    "date": "2023-08-01",
    "amount": 150.00,
    "description": "AMAZON.COM*ABC123...",
    "merchant": "Amazon",
    "record_id": "rec123..."
  },
  ...
]
```

### Step 5: Download PDF

Download the PDF attachment to the scratchpad:
```bash
curl -L "<pdf_url>" -o "<scratchpad>/statement.pdf"
```

Use the session scratchpad directory for temporary files.

### Step 6: Run Gemini OCR (Adaptive Thinking)

Use Gemini 3 Flash Agentic Vision to extract all transactions from the PDF. This handles **any bank format** automatically.

**Step 6a: First attempt with MEDIUM thinking (faster/cheaper)**
```bash
cd /Users/troybrave/.claude/.CLI/gemini-ocr && doppler run -- .venv/bin/python test_ocr.py --file "<scratchpad>/statement.pdf" --output "<scratchpad>/ocr_results.json" --thinking MEDIUM
```

**Step 6b: Read and evaluate results**
```bash
cat "<scratchpad>/ocr_results.json"
```

Parse the JSON and check the quality score:

**Quality Score Calculation:**
```
quality_score = 100

# Deduct for reconciliation failure
if reconciliation.matches_stated_balance == false:
    quality_score -= 30

# Deduct for missing metadata
if metadata.bank_name is empty: quality_score -= 10
if metadata.account_last_four is empty: quality_score -= 5
if metadata.beginning_balance == 0: quality_score -= 10
if metadata.ending_balance == 0: quality_score -= 10

# Deduct for discrepancy amount (% of ending balance)
if reconciliation.discrepancy > 0:
    discrepancy_pct = abs(discrepancy) / ending_balance * 100
    quality_score -= min(discrepancy_pct * 2, 20)

# Deduct for low transaction count (possible missed transactions)
if transaction_count < 5 and ending_balance > 1000:
    quality_score -= 15
```

**Step 6c: Retry with HIGH thinking if quality < 85**

If `quality_score < 85`:
```
⚠️ Low confidence OCR (score: <quality_score>). Retrying with HIGH thinking...
```

```bash
cd /Users/troybrave/.claude/.CLI/gemini-ocr && doppler run -- .venv/bin/python test_ocr.py --file "<scratchpad>/statement.pdf" --output "<scratchpad>/ocr_results.json" --thinking HIGH
```

Re-read and re-evaluate. If still < 85, proceed but flag for manual review:
```
⚠️ OCR quality score: <score>/100 - Manual review recommended
```

**The OCR returns structured JSON with:**
- `metadata` - bank_name, account_type, account_last_four, statement_period_start/end, beginning/ending_balance
- `transactions` - array of {date, description, merchant, amount, transaction_type}
- `reconciliation` - calculated_ending_balance, matches_stated_balance, discrepancy

Extract the `statements[0].result` object which contains the structured data.

---

### Step 7: Map Transaction Types

The Gemini OCR returns transaction_type values that need to be mapped to Airtable singleSelect values.

**Gemini → Airtable Transaction Type Mapping:**

*For Checking/Savings Accounts:*
| Gemini Value | Airtable Value |
|--------------|----------------|
| "Deposits and Additions" | `Deposits & Additions` |
| "ATM & Debit Card Withdrawals" | `ATM & Debit Card Withdrawals` |
| "Electronic Withdrawals" | `Electronic Withdrawals` |
| "Fees" | `Fees` |

*For Credit Cards:*
| Gemini Value | Airtable Value |
|--------------|----------------|
| "Payments" | `Payments` |
| "Purchases" | `Purchases` |
| "Interest Charged" | `Interest Charged` |
| "Fees" | `Fees` |
| "Cash Advances" | `Cash Advances` |
| "Balance Transfers" | `Balance Transfers` |

**Amount Sign Convention (already applied by Gemini):**
- **NEGATIVE** = Money IN (deposits, credits, payments)
- **POSITIVE** = Money OUT (withdrawals, debits, purchases, fees)

**IMPORTANT:** The Transaction Type field is a singleSelect in Airtable. Use the EXACT Airtable values above when creating records.

### Step 8: Verify Gemini Reconciliation

Gemini OCR performs automatic reconciliation by calculating:
```
beginning_balance - sum(all_transactions) = ending_balance
```

**Check the `reconciliation` object from Gemini output:**
- `matches_stated_balance: true` → Transactions are balanced ✓
- `matches_stated_balance: false` → Discrepancy detected ⚠️
- `discrepancy` → Dollar amount of any mismatch

**If discrepancy detected:**
```
⚠️ Gemini OCR Reconciliation Mismatch:
   Calculated ending: $X,XXX.XX
   Stated ending:     $X,XXX.XX
   Discrepancy:       $XXX.XX

Proceeding with import - manual review recommended.
```

Note: Gemini uses code execution to verify arithmetic, so discrepancies usually indicate PDF quality issues or unusual statement formats rather than parsing errors.

### Step 9: Filter Duplicates (Fuzzy Match ±3 Days)

**Fuzzy matching algorithm** to detect Plaid-imported duplicates:

For each parsed transaction, check against existing transactions:

```python
def is_duplicate(parsed_txn, existing_transactions):
    for existing in existing_transactions:
        # 1. Amount must match exactly
        if abs(parsed_txn.amount - existing.amount) > 0.01:
            continue

        # 2. Date must be within ±3 days
        date_diff = abs(parsed_txn.date - existing.date)
        if date_diff > 3 days:
            continue

        # 3. Description similarity check (any of these):
        #    - First 20 chars match (normalized, case-insensitive)
        #    - Merchant name matches
        #    - Key identifiers match (last 4 of card, reference numbers)
        if description_matches(parsed_txn, existing):
            return True, existing.record_id

    return False, None

def description_matches(parsed, existing):
    # Normalize: lowercase, remove extra spaces
    p_desc = normalize(parsed.description)
    e_desc = normalize(existing.description)

    # Check 1: First 20 chars match
    if p_desc[:20] == e_desc[:20]:
        return True

    # Check 2: Merchant matches
    if parsed.merchant and existing.merchant:
        if parsed.merchant.lower() == existing.merchant.lower():
            return True

    # Check 3: Key identifiers (card numbers, reference IDs)
    # Look for patterns like "...1234" or "Ref#12345"
    p_ids = extract_identifiers(p_desc)
    e_ids = extract_identifiers(e_desc)
    if p_ids and e_ids and p_ids.intersection(e_ids):
        return True

    return False
```

**For each parsed transaction:**
```
match_found, existing_id = is_duplicate(parsed_txn, existing_transactions)

if match_found:
    → Add to duplicates_skipped list (note: matched with existing_id)
else:
    → Add to transactions_to_add list
```

**Report duplicate matches:**
```
Duplicates Skipped: 12
├── Exact date match: 8
└── Fuzzy date match (±3 days): 4
```

### Step 10: Create Transaction Records

For each transaction to add, create Airtable record:

**Record Structure:**
```json
{
  "Created At": "<date in YYYY-MM-DD format>",
  "Description": "<full bank description>",
  "Merchant": "<extracted merchant>",
  "Amount": <signed_amount_as_number>,
  "Transaction Type": "<EXACT value from Step 7 table>",
  "Statements": ["<statement_record_id>"],
  "Accounts": ["<account_record_id>"],
  "Sync_Source": "Gemini OCR",
  "Last_Synced_At": "<today in YYYY-MM-DD format>",
  "Code Status": "Review"
}
```

**Transaction Type MUST be one of these exact values:**

*For Checking Accounts:*
- `Deposits & Additions` (for deposits)
- `ATM & Debit Card Withdrawals` (for card purchases)
- `Electronic Withdrawals` (for ACH/electronic debits)
- `Fees` (for bank fees)

*For Credit Cards:*
- `Payments` (payments made to card)
- `Purchases` (merchant charges)
- `Interest Charged` (interest charges)
- `Fees` (annual fees, late fees, etc.)
- `Cash Advances` (ATM/cash withdrawals from credit line)
- `Balance Transfers` (transfers from other cards)
```

**Batch Size:** Create 10 records per API call to avoid rate limits.

### Step 11: Generate Final Report

**Success Output Format:**
```
✓ Transaction Import Complete: <statement-uid>
  Bank Detected: <bank_name>

Transactions Added: <count>
├── Deposits and Additions: <count> ($<total>)
├── ATM & Debit Card Withdrawals: <count> ($<total>)
├── Electronic Withdrawals: <count> ($<total>)
└── Fees: <count> ($<total>)

Duplicates Skipped: <count>
├── Exact date match: <count>
└── Fuzzy date match (±3 days): <count>

Reconciliation: ✓ Balanced / ⚠️ Discrepancies Found
  Beginning Balance: $<amount>
  Ending Balance: $<amount>

[If discrepancies:]
⚠️ Discrepancies:
  - <Category>: Expected $X,XXX.XX, Parsed $X,XXX.XX (Diff: $XXX.XX)
```

### Step 12: Auto-Reconcile Transactions (If Statement Reconciled)

After all transactions are created, check if the Statement's Reconcile Status has automatically updated to "Reconciled".

**1. Re-fetch the Statement record:**
```
Client: <client>
Table: Statements
Filter: {Statement UID} = '<statement-uid>'
Fields: Statement UID, Reconcile Status
```

**2. Check Reconcile Status:**
- If `Reconcile Status` = "Reconciled" → Proceed to update transactions
- If `Reconcile Status` ≠ "Reconciled" → Skip this step (transactions remain as "Review")

**3. Update all created transactions to "Reconciled":**

Collect all the record IDs from the transactions created in Step 10, then batch update:
```
Client: <client>
Table: Transactions
Records: [
  { "id": "<record_id_1>", "fields": { "Code Status": "Reconciled" } },
  { "id": "<record_id_2>", "fields": { "Code Status": "Reconciled" } },
  ...
]
```

**Batch Size:** Update 10 records per API call to avoid rate limits.

**4. Report the auto-reconciliation:**
```
✓ Statement auto-reconciled: <count> transactions updated to "Reconciled"
```

If the statement is NOT reconciled, report:
```
ℹ Statement not yet reconciled - transactions remain in "Review" status
```

---

## Amount Sign Convention

**CRITICAL:** This system follows accounting convention where:
- **NEGATIVE amounts** = Money IN (deposits, credits, refunds)
- **POSITIVE amounts** = Money OUT (withdrawals, debits, fees, purchases)

This allows summing all transactions to calculate balance changes:
```
ending_balance = beginning_balance - sum(all_transactions)
```

---

## Error Handling

| Error | Detection | Response |
|-------|-----------|----------|
| Statement not found | Empty query result | "❌ Statement '<uid>' not found in <client>" |
| No PDF attached | Statement Doc is null/empty | "❌ No PDF attached to statement '<uid>'" |
| No Account linked | Account field is null | "❌ No account linked to statement '<uid>'" |
| Unknown bank format | No detection pattern matches | Ask user to identify bank |
| PDF download failed | curl error | "❌ Failed to download PDF: <error>" |
| PDF parse failure | Can't extract transactions | "❌ Could not parse transactions from PDF. Please verify PDF quality." |
| Total mismatch | Parsed ≠ Expected | Include discrepancy in report, continue with import |

---

## Field Mappings Reference

| Parsed Field | Airtable Field Name | Airtable Type |
|--------------|---------------------|---------------|
| date | Created At | dateTime |
| description | Description | singleLineText |
| merchant | Merchant | singleLineText |
| amount | Amount | currency |
| transaction_type | Transaction Type | singleSelect |
| statement_link | Statements | multipleRecordLinks |
| account_link | Accounts | multipleRecordLinks |
| sync_source | Sync_Source | singleLineText |
| sync_date | Last_Synced_At | dateTime |
| code_status | Code Status | singleSelect |

---

## Quality Checklist

Before completing, verify:
- [ ] **Step 4 duplicate check passed** (statement had no existing transactions)
- [ ] All transactions have correct date (full YYYY-MM-DD)
- [ ] Amounts have correct sign (negative for deposits, positive for withdrawals)
- [ ] **Transaction Type is EXACT match** (Checking: Deposits & Additions, ATM & Debit Card Withdrawals, Electronic Withdrawals, Fees) (Credit Card: Payments, Purchases, Interest Charged, Fees, Cash Advances, Balance Transfers)
- [ ] Merchant extracted correctly
- [ ] Statements link populated
- [ ] Accounts link populated
- [ ] Sync_Source = "Gemini OCR"
- [ ] Last_Synced_At = today's date
- [ ] Code Status = "Review" (or "Reconciled" if auto-reconciled in Step 12)
- [ ] Totals reconcile with statement summary
- [ ] Step 12 auto-reconciliation check completed

---

## Notes

- All imported transactions get `Code Status: "Review"` for manual verification
- `Sync_Source` is set to "Gemini OCR" to identify programmatic imports
- **Fuzzy duplicate detection** accounts for Plaid date variations:
  - Checks ALL transactions on the account (not just statement-linked)
  - Matches within ±3 days (Plaid dates often differ from bank statement)
  - Requires exact amount match + description/merchant similarity
- Only transactions NOT already present are added (incremental import)
- The skill can be run multiple times safely on the same statement

---

## Gemini OCR Configuration

**Tool Location:** `/Users/troybrave/.claude/.CLI/gemini-ocr/`

**API Key:** Stored in Doppler
- Project: `ocr-api`
- Config: `dev`
- Secret: `GEMINI_API_KEY_STATEMENTS`

**Cost:**
- MEDIUM thinking (first attempt): ~$0.003 per statement
- HIGH thinking (retry if needed): ~$0.006 per statement
- Average: ~$0.004 per statement (most pass on MEDIUM)

**Supported Banks:** Any bank format - Gemini adapts automatically. Tested on:
- Chase (Checking, Credit Card, Savings)
- Wells Fargo
- Bank of America
- PNC
