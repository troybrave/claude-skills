---
name: copywriting-prompt
description: Creates prompts for persuasive marketing and sales copy. Use when user says "write copy for", "create marketing content", "sales page prompt", "email sequence prompt", "ad copy for". NOT for general text prompts or image prompts.
allowed-tools: Read, Write, Edit
---

# Copywriting Prompt Engineer

Creates precisely optimized prompts that generate high-converting marketing copy, sales pages, emails, ads, and persuasive content for Claude or ChatGPT.

---

---

## Workflow

### Step 1: Gather Requirements

Ask the user for (if not already provided):

1. **Copy type** - Landing page, email, ad, social post, sales letter?
2. **Target audience** - Who is this for? Demographics, pain points, desires?
3. **Product/Service** - What are we selling? Key benefits?
4. **Desired action** - What should the reader do? (Buy, sign up, click, call?)
5. **Tone** - Professional, casual, urgent, friendly, authoritative?
6. **Constraints** - Word count, platform limits, brand guidelines?

### Step 2: Identify Copy Type and Framework

#### Sales Pages / Landing Pages

```
FRAMEWORKS:
- AIDA: Attention → Interest → Desire → Action
- PAS: Problem → Agitate → Solution
- PASTOR: Problem → Amplify → Story → Transformation → Offer → Response
- 4Ps: Promise → Picture → Proof → Push

PROMPT ELEMENTS:
- Headline variations (benefit-driven, curiosity, urgency)
- Subheadline that elaborates
- Bullet points for benefits/features
- Social proof sections
- Objection handlers
- Call-to-action buttons
- Guarantee statement
```

#### Email Sequences

```
FRAMEWORKS:
- Welcome sequence: Introduce → Value → Soft pitch → Hard pitch
- Launch sequence: Story → Problem → Solution → Urgency → Last chance
- Nurture sequence: Value → Value → Value → Soft CTA

PROMPT ELEMENTS:
- Subject lines (curiosity, benefit, urgency variants)
- Preview text
- Opening hook (personal, story, question)
- Body copy (single idea per email)
- CTA (one clear action)
- P.S. line (second hook)
```

#### Ads (Facebook, Google, LinkedIn)

```
FRAMEWORKS:
- Hook → Problem → Solution → CTA
- Before/After transformation
- Testimonial-led
- Curiosity-driven

PROMPT ELEMENTS:
- Primary text (platform character limits)
- Headline (short, punchy)
- Description (supporting copy)
- CTA button text
- Platform-specific requirements
```

#### Social Media Posts

```
FRAMEWORKS:
- Hook → Value → CTA
- Story-based (beginning → middle → lesson)
- List posts (3-7 points)
- Engagement posts (questions, polls)

PROMPT ELEMENTS:
- Opening hook (first line is crucial)
- Body (scannable, short paragraphs)
- Hashtags (if applicable)
- CTA or engagement prompt
```

### Step 3: Build the Prompt with Copywriting Principles

Include these elements in the prompt:

```
1. AUDIENCE DEFINITION
"Write for [specific avatar]: [demographics], who struggles with
[pain points], and wants [desires/outcomes]."

2. VOICE/TONE SPECIFICATION
"Use a [tone] voice. Write like [reference] or avoid sounding like [anti-reference]."

3. FRAMEWORK INSTRUCTION
"Follow the [AIDA/PAS/etc.] framework:
- [Step 1]: [specific instruction]
- [Step 2]: [specific instruction]
..."

4. BENEFIT-FOCUSED LANGUAGE
"Lead with benefits, not features. Transform features into 'so you can...' statements."

5. EMOTIONAL TRIGGERS
"Incorporate: [fear of missing out / desire for status / pain avoidance /
pleasure seeking / social proof / authority / scarcity]"

6. SPECIFICITY REQUIREMENTS
"Include specific numbers, timeframes, and concrete outcomes.
Avoid vague claims like 'better' or 'improved.'"

7. CTA SPECIFICATION
"End with a clear call-to-action that [describes exactly what to do]."

8. CONSTRAINTS
"Keep under [X] words. Use [short/medium/long] sentences.
Include [X] headline variations."
```

### Step 4: Add Persuasion Amplifiers

Layer in these proven copywriting techniques:

#### Power Words by Category

```
URGENCY: now, today, instant, immediately, deadline, limited, expires
EXCLUSIVITY: secret, insider, members-only, exclusive, private, invitation
TRUST: proven, guaranteed, certified, trusted, verified, backed
VALUE: free, bonus, save, discount, value, included, extra
EMOTION: discover, unlock, transform, breakthrough, finally, imagine
```

#### Sentence Structures That Convert

```
- "What if you could [desire] without [objection]?"
- "The [audience] guide to [outcome] (without [pain])"
- "[Number] ways to [benefit] in [timeframe]"
- "How [person like reader] went from [before] to [after]"
- "Stop [pain]. Start [pleasure]."
```

#### Objection Handling Prompts

```
"Address these common objections:
- 'I don't have time' → [counter]
- 'It's too expensive' → [counter]
- 'I've tried this before' → [counter]
- 'I'm not sure it'll work for me' → [counter]"
```

### Step 5: Explain the Prompt Strategy

Teach the user by explaining:

1. **Why this framework** - matches their goal and audience
2. **Key persuasion elements** - what triggers are being used
3. **What to test** - variations worth A/B testing

Format as:

```markdown
## Strategy Notes

| Element | Why It Works | Test This |
|---------|--------------|-----------|
| [element] | [psychology] | [variation] |
```

### Step 6: Deliver with Variations

Present the optimized prompt in a code block.

Then offer:
- "Want variations targeting different pain points?"
- "Should I create an A/B test version?"
- "Want me to adapt this for a different platform?"

---

## Quality Checklist

Before delivering:

- [ ] Target audience is specifically defined (not generic)
- [ ] Framework matches the copy type and goal
- [ ] Benefits emphasized over features
- [ ] Emotional triggers are appropriate for audience
- [ ] CTA is clear and single-focused
- [ ] Constraints (length, tone) are specified
- [ ] Objections are addressed or prompted
- [ ] Power words are strategically included
- [ ] Specificity requested (numbers, timeframes, outcomes)

---

## Error Handling

| Error | Response |
|-------|----------|
| User doesn't specify audience | Ask for demographics, pain points, desires before proceeding |
| Vague product/service description | Ask for key benefits, differentiators, proof points |
| No clear CTA defined | Ask what action they want readers to take |
| Conflicting tone requests | Clarify: "Professional but casual" needs specifics |
| Request for deceptive copy | Decline; suggest ethical persuasion alternatives |
| Generic "write good copy" request | Ask: What platform? What goal? Who's reading? |

---

## Copy Type Quick Reference

| Type | Best Framework | Key Element | Common Mistake |
|------|----------------|-------------|----------------|
| **Landing Page** | AIDA or PAS | Strong headline | Too many CTAs |
| **Email** | Single idea | Subject line | Too long |
| **Facebook Ad** | Hook-Problem-Solution | First line hook | Too salesy |
| **Google Ad** | Benefit + CTA | Keywords in headline | Ignoring character limits |
| **Sales Letter** | PASTOR | Story | Not enough proof |

---

## Follow-Up

After delivering a prompt:

1. Ask: "How did the copy perform? Any elements that worked especially well?"
2. Note which frameworks resonated, tone preferences, and A/B test results for future reference.
