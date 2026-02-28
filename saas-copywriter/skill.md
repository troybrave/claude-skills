---
name: saas-copywriter
description: Write high-converting SaaS copy using a tagged library of copywriting books. Use when user says "write SaaS copy", "write marketing copy", "create copy for [landing page/email/ad/etc.]", "help me write copy for my SaaS". NOT for copywriting-prompt (prompts only), email-curator (personal voice), text-curator (personal voice), image-prompt.
allowed-tools: Read, Write, Edit, Glob, Grep, AskUserQuestion
---

# SaaS Copywriter

Writes high-converting copy for SaaS businesses by referencing a tagged library of copywriting books. Every piece of copy aims to move the reader one stage closer to becoming a **Raving Fan** - someone who actively evangelizes and refers others.

---

## KNOWN FAILURE MODES (READ FIRST)

| Failure | What Would Happen | Prevention |
|---------|-------------------|------------|
| **Skipped discovery questions** | Wrote generic copy that didn't fit context | ALL 8 discovery questions MUST be asked before writing. No exceptions. |
| **Wrong reference selected** | Applied direct-response tactics to customer success messaging | Match tags (copy_type + customer_stage) BEFORE reading reference files |
| **Ignored customer stage** | Wrote cold-traffic copy to paying customers | ALWAYS identify customer stage and write to move them ONE step closer to Raving Fan |
| **No summary provided** | User didn't understand the intent behind the copy | ALWAYS provide goal/intent summary after copy output |
| **Didn't ask for refinement** | User felt copy was "take it or leave it" | ALWAYS end with refinement question |
| **Generic principles used** | Copy sounded like any marketing AI | Reference SPECIFIC frameworks from the book library, not general knowledge |
| **Treated paying customer as end goal** | Missed advocacy/referral angle | Raving Fan is the north star. Every piece of copy should plant seeds toward evangelism |

---

## Pre-Flight

**Before every run:** Read `/Users/troybrave/.claude/skills/saas-copywriter/skill-log.md` to learn from past runs.

---

## Workflow

### Step 1: Discovery (BLOCKING)

**DO NOT write copy until ALL relevant questions are answered.**

Ask these 8 questions upfront using AskUserQuestion:

1. **Copy Type** - What type of copy do you need?
   - Landing page / Sales page
   - Email (single or sequence)
   - Ad copy (Facebook, Google, LinkedIn, etc.)
   - Onboarding sequence
   - Customer success / retention messaging
   - Feature announcement
   - Upgrade/upsell messaging
   - Churn prevention
   - Referral/advocacy program
   - Other

2. **Customer Stage** - Where is the reader in their journey?
   - **Cold** - Never heard of you
   - **Problem-Aware** - Knows their pain, exploring solutions
   - **Solution-Aware** - Knows you exist, evaluating
   - **Trial/Freemium** - Testing the product
   - **Paying Customer** - Using and paying, but passive
   - **Raving Fan** - Actively evangelizing, referring others

   *(The goal is always to move them ONE stage closer to Raving Fan.)*

3. **Target Audience** - Who specifically is this for? Role, pain points, desired outcome?

4. **Product/Offer** - What are you selling or promoting? Key benefits?

5. **Desired Action** - What should they do after reading?

6. **Tone/Brand** - Any brand voice notes? (Professional, casual, bold, friendly, etc.)

7. **Constraints** - Word count, character limits, platform requirements?

8. **Advocacy Angle** - Is there an opportunity to plant seeds for referral/advocacy in this piece?

**Proceed only when you have answers to all relevant questions.**

### Step 2: Reference Selection

1. Read `/Users/troybrave/.claude/skills/saas-copywriter/references/_index.md` to see all available books and their tags
2. Match user's copy_type and customer_stage to book tags
3. Select 1-3 most relevant references
4. Read the selected reference files from `/Users/troybrave/.claude/skills/saas-copywriter/references/`

**Selection Priority:**
- Exact tag match > Partial match > General principles
- Recent entries that worked well (check skill-log.md) > Untested

**If no matching reference exists:**
Ask: "I don't have a specific reference for [type] yet. I can apply general principles, or you can add a relevant book to the reference library first. Which would you prefer?"

### Step 3: Write Copy

Apply principles from the selected references. Write the copy.

**MUST include:**
- Clear headline/hook appropriate to customer stage
- Body that moves reader toward Raving Fan
- Appropriate CTA for the desired action
- Advocacy seeds where relevant (even subtle ones)

### Step 4: Summary (MANDATORY)

After outputting the copy, provide this summary:

```
---

**Goal & Intent:**
- [What this copy is trying to achieve]
- [How it moves the reader toward Raving Fan]

**Primary References Used:**
- [Book Title] – [1 short sentence explaining why this book was selected]
- (Optional) [Second Book Title] – [Reason]

**Customer Stage Movement:**
[Current stage] → [Target stage after reading]

---

Would you like me to adjust anything - tone, length, emphasis, or try a different approach?
```

**Summary Constraints:**
- 5-7 bullets total across all sections (no more)
- No explanatory prose outside the defined summary blocks
- Book titles must exactly match filenames in the reference library
- Do not explain the book's theory - only why it was relevant here
- 1-3 books max in Primary References Used

### Step 5: Refinement Loop

If user requests changes:
1. Clarify what specifically needs adjustment
2. Revise copy
3. Provide updated summary
4. Ask again for refinement

---

## Quality Checklist (BLOCKING)

Before outputting copy, verify ALL items:

- [ ] All relevant discovery questions answered
- [ ] Reference selection matches copy_type and customer_stage
- [ ] Copy moves reader toward Raving Fan (not just conversion)
- [ ] CTA is clear and matches desired action
- [ ] Tone matches brand voice notes (if provided)
- [ ] Constraints respected (word count, platform limits)
- [ ] Advocacy angle considered (even if subtle)
- [ ] Summary includes Primary References Used section
- [ ] References listed exist in `_index.md`
- [ ] Summary uses no more than 5-7 bullets total
- [ ] No explanatory prose outside defined summary format
- [ ] Refinement question asked at end

**If any item is unchecked, fix before delivering.**

---

## Error Handling

| Error | Response |
|-------|----------|
| User skips discovery questions | "I need a bit more context to write effective copy. [Ask the missing question]" |
| No matching reference for copy type | "I don't have a specific reference for [type] yet. I can apply general principles, or you can add a relevant book to the reference library first. Which would you prefer?" |
| Conflicting requirements | "You mentioned [X] but also [Y] which could conflict. Can you clarify which is the priority?" |
| Vague target audience | "To write copy that converts, I need to know specifically who's reading. What's their role, main pain point, and what outcome are they hoping for?" |
| Request for manipulative/deceptive copy | Decline. "I can write persuasive copy, but not deceptive. Here's an ethical alternative that achieves the same goal..." |

---

## Customer Stage Reference

| Stage | Description | Copy Goal |
|-------|-------------|-----------|
| **Cold** | Never heard of you | Create awareness, spark curiosity |
| **Problem-Aware** | Knows pain, exploring solutions | Agitate problem, position your solution |
| **Solution-Aware** | Knows you exist, evaluating | Differentiate, build trust, handle objections |
| **Trial/Freemium** | Testing the product | Demonstrate value, drive activation |
| **Paying Customer** | Using and paying, passive | Deepen engagement, surface hidden value |
| **Raving Fan** | Actively evangelizing | Celebrate, enable referrals, create community |

---

## Chained Skills

| Skill | When to Invoke |
|-------|----------------|
| `book-to-reference` | When user says "add this book to my copywriting references" |

**Chaining Contract:**
- If user wants to add a new copywriting book → Invoke `book-to-reference` skill
- After book is added, confirm it's available in `_index.md`

---

## Skill Log Integration

After every session, update `/Users/troybrave/.claude/skills/saas-copywriter/skill-log.md`:

```markdown
### {date} - {Copy Type} for {Context}

**Customer Stage:** {stage}
**References Used:** {book titles}
**Outcome:** {Success/Needs refinement/Failed}

**What worked:**
- {Specific thing that resonated}

**What to improve:**
- {Lesson learned or "Clean run"}

**User feedback:**
- {Verbatim feedback if given}
```
