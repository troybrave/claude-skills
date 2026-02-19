---
name: production-week
description: Generates production week records in Airtable for client bases. Use when user says "create production weeks", "generate production weeks", "set up production weeks for", "add production weeks". NOT for individual week edits or non-Airtable calendars.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, AskUserQuestion, mcp__airtable__*
---

# Production Week Generator

Creates production week records in Airtable for Power Bookkeeping clients. Handles the critical rule that the **Final Date determines the year**, not the Start Date.

---

## Critical Rule (NEVER VIOLATE)

**The Final Date (last day of the 7-day cycle) determines which year a week belongs to.**

Example:
- Start Date: December 26, 2023 (Tuesday)
- Final Date: January 1, 2024 (Monday)
- Week#: **2401** (Year 24, Week 01) — NOT 2353

Week 01 of any year = first 7-day cycle where the Final Date falls in that year.

---

## Required Inputs

Collect these before generating:

| Input | Description | Example |
|-------|-------------|---------|
| **Client Base** | Airtable base ID or name | `app2lotuCcMzY8lt1` or "Blackhawk" |
| **Week Window** | Cycle pattern (start day → end day) | "Tues-Mon", "Wed-Tues" |
| **Start Year** | First year to generate | 2023 |
| **End Year** | Last year to generate | 2025 |

---

## Workflow

### Step 1: Identify Client Base

Look up base ID in `/Users/troybrave/Documents/Projects/Endless Winning/01 - Reference/Airtable Reference.md`.

Find the Production Week table ID for that base.

### Step 2: Check for Existing Records (REQUIRED)

**Always check for duplicates before generating.**

```bash
AIRTABLE_PAT="your_token" node /Users/troybrave/.claude/skills/production-week/scripts/check-existing.cjs \
  --base "{base_id}" \
  --table "{table_id}"
```

Or via Airtable MCP:
```
Query Production Week table, retrieve all Week# values
```

**If records exist:**
- Ask user: "Found weeks 2301-2352 already exist. Do you want to skip existing, replace all, or abort?"
- **Skip existing**: Only create weeks not in the existing list
- **Replace all**: Delete existing records first, then create fresh
- **Abort**: Stop and let user review

**Example deduplication logic:**
```javascript
const existingWeekIds = new Set(['2301', '2302', ...]); // from check-existing.cjs
const weeksToCreate = generatedWeeks.filter(w => !existingWeekIds.has(w.weekId));
console.log(`Skipping ${generatedWeeks.length - weeksToCreate.length} existing weeks`);
```

### Step 3: Determine Cycle Pattern

Parse the week window to get:
- **Start Day**: First day of cycle (0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat)
- **End Day**: Last day of cycle (Start Day + 6) % 7

| Week Window | Start Day | End Day |
|-------------|-----------|---------|
| Tues-Mon | 2 (Tuesday) | 1 (Monday) |
| Wed-Tues | 3 (Wednesday) | 2 (Tuesday) |
| Mon-Sun | 1 (Monday) | 0 (Sunday) |
| Sun-Sat | 0 (Sunday) | 6 (Saturday) |

### Step 4: Calculate First Week

**Algorithm: Start from Final Date, work backwards**

1. Find January 1 of Start Year
2. Find the first occurrence of End Day on or after January 1
   - This is the Final Date of Week 01
3. Calculate Start Date = Final Date - 6 days

```javascript
// Example for Tues-Mon (End Day = Monday = 1) starting 2023
const jan1 = new Date("2023-01-01T12:00:00");
let finalDate = new Date(jan1);

// Find first Monday on or after Jan 1
while (finalDate.getDay() !== 1) { // 1 = Monday
  finalDate.setDate(finalDate.getDate() + 1);
}
// finalDate = Jan 2, 2023 (Monday)

let startDate = new Date(finalDate);
startDate.setDate(startDate.getDate() - 6);
// startDate = Dec 27, 2022 (Tuesday)

// Week#: 2301 (because Final Date Jan 2 is in 2023)
```

### Step 5: Generate Week Records

Run the generation script:

```bash
node /Users/troybrave/.claude/skills/production-week/scripts/generate-weeks.cjs \
  --base "{base_id}" \
  --table "{table_id}" \
  --window "{week_window}" \
  --start-year {start_year} \
  --end-year {end_year}
```

Or generate programmatically:

```javascript
// Core generation logic
function generateWeeks(startYear, endYear, endDayNum) {
  const weeks = [];

  // Find first Final Date of startYear
  let finalDate = new Date(`${startYear}-01-01T12:00:00`);
  while (finalDate.getDay() !== endDayNum) {
    finalDate.setDate(finalDate.getDate() + 1);
  }

  let startDate = new Date(finalDate);
  startDate.setDate(startDate.getDate() - 6);

  let currentYear = startYear;
  let weekNum = 1;

  while (true) {
    const finalYear = finalDate.getFullYear();

    // Stop if we've passed end year
    if (finalYear > endYear) break;

    // Reset week counter on year change
    if (finalYear > currentYear) {
      currentYear = finalYear;
      weekNum = 1;
    }

    const weekId = String(currentYear % 100).padStart(2, "0") +
                   String(weekNum).padStart(2, "0");

    weeks.push({
      weekId,
      startDate: startDate.toISOString().split("T")[0],
      finalDate: finalDate.toISOString().split("T")[0],
      year: currentYear
    });

    // Move to next week
    startDate.setDate(startDate.getDate() + 7);
    finalDate.setDate(finalDate.getDate() + 7);
    weekNum++;
  }

  return weeks;
}
```

### Step 6: Create Airtable Records

Use Airtable MCP to create records in batches of 10:

```javascript
// Fields to populate
const record = {
  "Week#": weekId,           // e.g., "2301"
  "Start Date": startDate,   // e.g., "2022-12-27"
  "Final Date": finalDate,   // e.g., "2023-01-02"
  "Week_Frame": weekWindow   // e.g., "Tues-Mon"
};
```

### Step 7: Verify Boundary Weeks

After creation, verify these critical boundary weeks:

| Check | Expected |
|-------|----------|
| Last week of Year N | Final Date in Year N (Dec 25-31) |
| First week of Year N+1 | Final Date is first End Day in January |
| Week# format | YYWW (2301, 2352, 2401, etc.) |

Example verification for Tues-Mon 2023→2024:
- 2352: Final Dec 25, 2023 → Year 23 ✓
- 2401: Final Jan 1, 2024 → Year 24 ✓

---

## Quality Checklist

- [ ] **Checked for existing records BEFORE generating** (Step 2)
- [ ] Week# uses YYWW format (not YYYY-WW)
- [ ] Final Date determines year (not Start Date)
- [ ] Week 01 is first week where Final Date is in that year
- [ ] No gaps between weeks (consecutive 7-day cycles)
- [ ] No duplicates created (filtered out existing Week# values)
- [ ] Boundary weeks verified (last of year N, first of year N+1)
- [ ] All dates use T12:00:00 to avoid timezone issues

---

## Error Handling

| Error | Response |
|-------|----------|
| Table ID not found | Check Airtable Reference.md or query Airtable MCP for table list |
| Records already exist | Query existing records first, skip duplicates or offer to delete/replace |
| Timezone date shift | Use `T12:00:00` in all date strings to avoid edge cases |
| Week# calculated wrong | Stop immediately, verify algorithm matches Critical Rule |
| Batch creation fails | Retry individual records, report which failed |

---

## Field Mappings by Client

| Client | Base ID | Table ID | Week# Field | Start Date Field | Final Date Field |
|--------|---------|----------|-------------|------------------|------------------|
| Blackhawk | app2lotuCcMzY8lt1 | tblVsFIOkwXMwEnHq | Week# | Start Date | Final Date |

Add new clients as they're onboarded.

---

## Example Invocations

**User:** "Create production weeks for Blackhawk from 2023 to 2025, Tuesday to Monday cycle"

**User:** "Generate production weeks for the new client, Wednesday to Tuesday, years 2024-2026"

**User:** "Set up production weeks for Justin Abdella base"
