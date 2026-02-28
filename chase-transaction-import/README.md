# Bank Transaction Import Skill

Imports bank transactions from PDF statement attachments in Airtable using **Gemini 3 Flash Agentic Vision** for OCR.

## Features

- **Universal Bank Support** - Works with any bank format (Chase, Wells Fargo, BofA, PNC, and more)
- **Adaptive Processing** - Starts with MEDIUM thinking, escalates to HIGH if quality < 85
- **Auto-Reconciliation** - Gemini verifies math via code execution
- **Duplicate Detection** - Fuzzy matching (±3 days) to avoid Plaid duplicates
- **Cost Optimized** - ~$0.004 average per statement

## Usage

```
/chase-transaction-import <client> <statement-uid>
```

### Examples
```
/chase-transaction-import "blackhawk logistics" "0823 | CHK - 5509"
/chase-transaction-import "acme corp" "1224 | CC - 4532"
```

## How It Works

```
┌─────────────────┐
│  Airtable       │
│  Statement PDF  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Gemini OCR     │  ← MEDIUM thinking first
│  (Doppler)      │  ← HIGH if score < 85
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Quality Check  │  ← Score based on:
│  (85 threshold) │    - Reconciliation
└────────┬────────┘    - Metadata completeness
         │             - Discrepancy amount
         ▼
┌─────────────────┐
│  Duplicate      │  ← ±3 day fuzzy match
│  Detection      │    vs existing transactions
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Airtable       │  ← Create transaction records
│  Records        │    Link to statement/account
└─────────────────┘
```

## Quality Score Calculation

| Factor | Deduction |
|--------|-----------|
| Reconciliation fails | -30 |
| Missing bank name | -10 |
| Missing account number | -5 |
| Missing beginning balance | -10 |
| Missing ending balance | -10 |
| Discrepancy (% of balance) | -up to 20 |
| Low transaction count | -15 |

**Score < 85** → Retry with HIGH thinking
**Still < 85** → Proceed with manual review flag

## API Keys (Doppler)

| Project | Secret | Purpose |
|---------|--------|---------|
| ocr-api | `GEMINI_API_KEY_STATEMENTS` | Statement OCR |
| ocr-api | `GEMINI_API_KEY_TRANSACTIONS` | Transaction OCR |
| ocr-api | `GEMINI_API_KEY_RECEIPTS` | Receipt OCR |

## Cost

| Scenario | Cost |
|----------|------|
| MEDIUM thinking (most statements) | ~$0.003 |
| HIGH thinking (complex statements) | ~$0.006 |
| Average | ~$0.004 |

## Transaction Type Mapping

### Checking/Savings
| Gemini Output | Airtable Field |
|---------------|----------------|
| Deposits and Additions | `Deposits & Additions` |
| ATM & Debit Card Withdrawals | `ATM & Debit Card Withdrawals` |
| Electronic Withdrawals | `Electronic Withdrawals` |
| Fees | `Fees` |

### Credit Cards
| Gemini Output | Airtable Field |
|---------------|----------------|
| Payments | `Payments` |
| Purchases | `Purchases` |
| Interest Charged | `Interest Charged` |
| Fees | `Fees` |
| Cash Advances | `Cash Advances` |
| Balance Transfers | `Balance Transfers` |

## Amount Sign Convention

- **NEGATIVE** = Money IN (deposits, credits, payments)
- **POSITIVE** = Money OUT (withdrawals, debits, purchases)

## Dependencies

- Gemini OCR Tool: `/Users/troybrave/.claude/.CLI/gemini-ocr/`
- Doppler CLI (authenticated)
- Airtable MCP tools

## Files

```
chase-transaction-import/
├── skill.md        # Full skill specification
├── README.md       # This file
└── skill-log.md    # Execution history
```

## Supported Banks (Tested)

- ✓ Chase (Checking, Credit Card, Savings)
- ✓ Wells Fargo
- ✓ Bank of America
- ✓ PNC
- ○ Any other US bank (should work, may need testing)

## Changelog

### 2026-01-31
- Migrated from Claude PDF reading to Gemini 3 Flash Agentic Vision
- Added adaptive thinking (MEDIUM → HIGH fallback)
- Added quality score calculation
- Removed bank-specific parsers (Gemini handles all formats)
- Reduced cost from ~$0.05 to ~$0.004 per statement
