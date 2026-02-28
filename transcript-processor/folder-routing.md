# Meeting Recording Folder Routing

**All recordings go to the centralized `z - Meeting Recordings/` folder.**

Structure: `z - Meeting Recordings/[Category]/[Entity]/YYYY/MM-Mon/[Meeting Folder]/`

Staging: `z - Meeting Recordings/_Inbox/` (unprocessed recordings land here first)

---

## NEVER BLOCK POLICY

**This workflow must NEVER get stuck waiting for user input about folder structure.**

### Step 1: VERIFY Before Creating

**Before creating any new folder, always check existing folders first:**

```bash
# Check existing business entities
ls "/Users/troybrave/Documents/Projects/Full Vault/z - Meeting Recordings/Business/"

# Check existing ministry orgs
ls "/Users/troybrave/Documents/Projects/Full Vault/z - Meeting Recordings/Ministry/"
```

**Look for:**
- Spelling variations (MxDetail vs MX Detail vs Mx Detail)
- Abbreviated names (MM vs Mighty Men)
- Similar names that might be the same org

### Step 2: Match or Create

**If existing folder found** → Use it

**If no match found** → Create new folder:

```bash
mkdir -p "/Users/troybrave/Documents/Projects/Full Vault/z - Meeting Recordings/[Category]/[Entity]/YYYY/MM-Mon/"
```

### Truly Unknown → Use Fallback

**If after verification you still can't determine the organization:**

| Category | Fallback Path |
|----------|---------------|
| Unknown Business | `z - Meeting Recordings/Business/_Unknown/YYYY/MM-Mon/` |
| Unknown Ministry | `z - Meeting Recordings/Ministry/_Unknown/YYYY/MM-Mon/` |
| Completely Ambiguous | `z - Meeting Recordings/Personal/_Unknown/YYYY/MM-Mon/` |

**The `_Unknown` folder signals these need manual review later, but doesn't block the workflow.**

---

## Path Patterns

| Category | Path Pattern |
|----------|--------------|
| **Personal** | `z - Meeting Recordings/Personal/YYYY/MM-Mon/` |
| **Ministry** | `z - Meeting Recordings/Ministry/[Org]/YYYY/MM-Mon/` |
| **Business** | `z - Meeting Recordings/Business/[Entity]/YYYY/MM-Mon/` |

**Month format:** `12-Dec`, `01-Jan`, `02-Feb`, etc.

---

## PERSONAL

**Detection signals:** Solo recording, Spanish practice, family, casual notes, personal study, devotional

**Path:** `z - Meeting Recordings/Personal/YYYY/MM-Mon/`

---

## MINISTRY ORGANIZATIONS

| Organization | Detection Signals | Path |
|--------------|-------------------|------|
| **Mighty Men** | Timothy Jooste, testimony, men's group, kingdom business, Bobby, Paul van Eijden, Tony | `z - Meeting Recordings/Ministry/Mighty Men/YYYY/MM-Mon/` |
| **Brave Life** | Sermon, church, preaching, ministry planning, bravelifenow | `z - Meeting Recordings/Ministry/Brave Life/YYYY/MM-Mon/` |
| **River Finland** | Ps Tomi, Helsinki, Finland, Sakari, Finnish | `z - Meeting Recordings/Ministry/River Finland/YYYY/MM-Mon/` |
| **OCI** | OCI, leadership pathway, Katie | `z - Meeting Recordings/Ministry/OCI/YYYY/MM-Mon/` |
| **Overflow Life** | Overflow | `z - Meeting Recordings/Ministry/Overflow Life/YYYY/MM-Mon/` |
| **ARB** | ARB | `z - Meeting Recordings/Ministry/ARB/YYYY/MM-Mon/` |

---

## BUSINESS ENTITIES

| Entity | Detection Signals | Path |
|--------|-------------------|------|
| **Endless Winning** | Matt Wood, EW internal, agency strategy, founders meeting, MVP planning | `z - Meeting Recordings/Business/Endless Winning/YYYY/MM-Mon/` |
| **Taskaroo** | Jeff, Sergio, job creation, leads, GHL platform, taskaroo | `z - Meeting Recordings/Business/Taskaroo/YYYY/MM-Mon/` |
| **Power Bookkeeping** | 4Ts, bookkeeping, receipts, Mike Mazur | `z - Meeting Recordings/Business/Power Bookkeeping/YYYY/MM-Mon/` |
| **MX Detail** | Detailing, cars, quotes, MX, auto | `z - Meeting Recordings/Business/MX Detail/YYYY/MM-Mon/` |
| **Clear Piggy** | Clear Piggy, finance app | `z - Meeting Recordings/Business/Clear Piggy/YYYY/MM-Mon/` |
| **Chris Comacho** | Chris Comacho | `z - Meeting Recordings/Business/Chris Comacho/YYYY/MM-Mon/` |
| **Joels Place Coffee** | Joel, coffee | `z - Meeting Recordings/Business/Joels Place Coffee/YYYY/MM-Mon/` |
| **Millionaire** | Millionaire, lead sets, power lists | `z - Meeting Recordings/Business/Millionaire/YYYY/MM-Mon/` |
| **Fortis** | Fortis, entities | `z - Meeting Recordings/Business/Fortis/YYYY/MM-Mon/` |
| **Endless Energy** | Endless Energy, energy | `z - Meeting Recordings/Business/Endless Energy/YYYY/MM-Mon/` |
| **Priority Roofing** | Priority, roofing (prospective) | `z - Meeting Recordings/Business/Priority Roofing/YYYY/MM-Mon/` |

---

## Decision Tree

```
1. Is it a solo recording (no other participants)?
   └── YES → z - Meeting Recordings/Personal/
   └── NO → Continue

2. Does transcript mention ministry keywords?
   (testimony, prayer, sermon, church, men's group, Timothy, Sakari, Ps Tomi)
   └── YES → Match to Ministry org → z - Meeting Recordings/Ministry/[Org]/
   └── NO → Continue

3. Does transcript mention a business entity or client?
   └── YES → Match to entity → z - Meeting Recordings/Business/[Entity]/
   └── NO → Continue

4. Can you extract ANY organization/company name from transcript?
   └── YES → Create new folder in appropriate category
   └── NO → Use _Unknown fallback
```

---

## Month Folder Format

Always use: `MM-Mon` format

| Month | Folder |
|-------|--------|
| January | `01-Jan` |
| February | `02-Feb` |
| March | `03-Mar` |
| April | `04-Apr` |
| May | `05-May` |
| June | `06-Jun` |
| July | `07-Jul` |
| August | `08-Aug` |
| September | `09-Sep` |
| October | `10-Oct` |
| November | `11-Nov` |
| December | `12-Dec` |

---

## Full Vault Root

All paths are relative to:
```
/Users/troybrave/Documents/Projects/Full Vault/
```

---

## Examples

**Mighty Men weekly call (Dec 10, 2025)**
→ `z - Meeting Recordings/Ministry/Mighty Men/2025/12-Dec/25-12-10 | Mighty Men - Kingdom Business/`

**Taskaroo roadmap planning (Dec 4, 2025)**
→ `z - Meeting Recordings/Business/Taskaroo/2025/12-Dec/25-12-04 | Taskaroo Roadmap Planning/`

**Personal voice note (Dec 8, 2025)**
→ `z - Meeting Recordings/Personal/2025/12-Dec/25-12-08 | Voice Note - Flight Recording/`

**EW Founders call with Matt (Nov 26, 2025)**
→ `z - Meeting Recordings/Business/Endless Winning/2025/11-Nov/25-11-26 | Matt Wood/`

**River Finland Notion Setup (Dec 2, 2025)**
→ `z - Meeting Recordings/Ministry/River Finland/2025/12-Dec/25-12-02 | Notion Setup/`

---

## Google Drive Mirror

All paths mirror to Google Drive at:
`/Users/troybrave/Library/CloudStorage/GoogleDrive-troy@endlesswinning.com/My Drive/Meeting Recordings/`

The sync script handles the mirroring automatically.

---

## When Uncertain (But Still Don't Block)

If classification is unclear, use these steps to make the best decision:

1. Check `participants.json` for known contacts or email domains
2. Search transcript for client/org names, project names, or keywords
3. Look for email domains (@taskaroo.com, @bravelifenow.com, etc.)
4. Check if any participant emails match existing client folders

**If still unclear after these checks:**
- Discovery/sales call → `z - Meeting Recordings/Business/[Best guess name]/`
- Ministry-related → `z - Meeting Recordings/Ministry/[Best guess name]/`
- Truly ambiguous → `z - Meeting Recordings/Personal/` (can always be moved later)

**NEVER block the workflow. Make the best decision and proceed.**
