---
name: customer-success-copywriter
description: Write customer success emails and retention copy using frameworks from Customer Success (Mehta), Obviously Awesome (Dunford), and Influence (Cialdini). Use when writing onboarding emails, retention sequences, churn prevention, QBR communications, customer health interventions, upsell/expansion emails, or success milestone messaging. NOT for cold acquisition copy, brand marketing, or personal voice emails (use email-curator instead).
allowed-tools: Read, Write, Edit, Glob, Grep, AskUserQuestion
---

# Customer Success Copywriter

Writes customer success emails and retention-focused copy by applying frameworks from three core reference books:

1. **Customer Success** (Nick Mehta) - The 10 Laws of customer success, time-to-value obsession, customer health metrics, retention/expansion strategies
2. **Obviously Awesome** (April Dunford) - Positioning, value articulation, competitive alternatives framing, Big Fish/Small Pond strategy
3. **Influence** (Robert Cialdini) - The 6 principles of persuasion: Reciprocation, Commitment/Consistency, Social Proof, Liking, Authority, Scarcity

Every email aims to move the customer one stage closer to **Net Revenue Retention > 100%** - the ultimate measure of customer success.

---

## KNOWN FAILURE MODES (READ FIRST)

| Failure | What Would Happen | Prevention |
|---------|-------------------|------------|
| **Skipped discovery** | Wrote generic email that missed customer context | ALL discovery questions MUST be answered before writing. No exceptions. |
| **Ignored customer health** | Sent expansion email to at-risk customer | ALWAYS identify customer health status and match messaging accordingly |
| **Transactional tone** | Email felt like a ticket, not a partnership | Apply Liking principle - write as a trusted advisor, not a vendor |
| **Feature-focused instead of value** | Listed features without connecting to customer outcomes | Use Dunford's Value Mapping: Feature → Benefit → Value in customer terms |
| **No clear next step** | Customer didn't know what to do after reading | ALWAYS include one clear, low-friction CTA |
| **Missed reciprocity setup** | Asked for something without giving first | Apply Cialdini's Reciprocation - give value before asking |
| **Wrong urgency for stage** | Used Scarcity on a new customer, felt pushy | Match persuasion principles to customer lifecycle stage |
| **No time-to-value focus** | Email didn't drive product engagement | Mehta's Law 7: Every touchpoint should reduce time-to-value |

---

## Pre-Flight

**Before every run:** Read the three reference books' key frameworks:

1. `/Users/troybrave/Documents/Projects/Full Vault/Business/01 - Reference/Books/Reference/Nick Mehta/Customer Success/Customer Success - Complete.md`
2. `/Users/troybrave/Documents/Projects/Full Vault/Business/01 - Reference/Books/Reference/April Dunford/Obviously Awesome/Obviously Awesome - Complete.md`
3. `/Users/troybrave/Documents/Projects/Full Vault/Business/01 - Reference/Books/Reference/Robert Cialdini/Influence/Influence - The Psychology of Persuasion - Complete.md`

Focus on sections most relevant to the email type being written.

---

## Customer Success Email Framework Matrix

### By Customer Lifecycle Stage

| Stage | Primary Focus | Key Frameworks to Apply |
|-------|---------------|------------------------|
| **Onboarding (0-30 days)** | Time-to-value, activation | Mehta Law 7 (Time-to-Value), Commitment/Consistency (small wins) |
| **Early Adoption (30-90 days)** | Engagement, habit formation | Social Proof (what similar customers do), Dunford Value Themes |
| **Growth (90+ days)** | Expansion, deepening value | Reciprocity (value given first), Dunford's Competitive Alternatives |
| **At-Risk** | Intervention, re-engagement | Liking (relationship repair), Mehta Law 8 (understand the metrics) |
| **Renewal (pre-renewal window)** | Retention, advocacy | Commitment/Consistency (past success), Dunford Positioning |
| **Expansion** | Upsell, cross-sell | Scarcity (when ethical), Social Proof (similar customers expanded) |
| **Advocacy** | Referral, case study, review | Reciprocity (they've received value), Liking (relationship depth) |

### By Email Type

| Email Type | Mehta Framework | Dunford Framework | Cialdini Principle |
|------------|-----------------|-------------------|-------------------|
| **Welcome/Onboarding** | Law 7: Time-to-Value | Unique Value articulation | Commitment (micro-commitment) |
| **Feature Announcement** | Law 6: Product is #1 driver | Feature → Benefit → Value | Social Proof (early adopters) |
| **QBR/Check-in** | Law 9: Hard Metrics | Value Themes | Authority (data-backed) |
| **Health Score Alert** | Law 8: Customer Metrics | Positioning (reframe value) | Liking (genuine concern) |
| **Churn Prevention** | Law 5: Don't churn if fixable | Competitive Alternatives | Commitment (past investments) |
| **Expansion/Upsell** | Law 9: Retention ≠ Success | Big Fish, Small Pond | Reciprocity (value delivered) |
| **Renewal Reminder** | Law 4: Time-to-Value × Usage | Value recap | Scarcity (if genuine) |
| **Success Milestone** | Law 10: Top-Down Commitment | Value proven | Social Proof (share the win) |
| **Referral Request** | Law 10: Customer Success = Company Success | Positioning clarity | Reciprocity + Liking |

---

## Workflow

### Step 1: Discovery (BLOCKING)

**DO NOT write email until ALL relevant questions are answered.**

Ask these questions upfront using AskUserQuestion:

1. **Email Type** - What type of customer success email?
   - Welcome/Onboarding sequence
   - Feature announcement
   - QBR/Business Review prep or follow-up
   - Health score intervention
   - Churn prevention outreach
   - Expansion/Upsell opportunity
   - Renewal reminder/nudge
   - Success milestone celebration
   - Referral/Advocacy request
   - Re-engagement (dormant user)
   - Other

2. **Customer Health** - What's this customer's current status?
   - **Healthy** - Using product, seeing value, engaged
   - **At-Risk** - Low usage, complaints, non-responsive
   - **Churning** - Indicated intent to cancel
   - **Champion Gone** - Key contact left the company
   - **Unknown** - No recent health data

3. **Time-to-Value Status** - Where are they in realizing value?
   - **Pre-activation** - Haven't reached first value milestone
   - **Early value** - Some wins, not yet habitual
   - **Realized value** - Clear ROI demonstrated
   - **Expanding value** - Finding new use cases

4. **Customer Segment** - What type of customer?
   - Enterprise (high-touch)
   - Mid-market (mid-touch)
   - SMB (low-touch/tech-touch)
   - *(Affects tone and depth of personalization)*

5. **Sender Role** - Who is sending this?
   - CSM (relationship manager)
   - CS Leader/VP
   - CEO/Founder
   - Product team
   - Support escalation

6. **Desired Outcome** - What should they DO after reading?
   - Schedule a call
   - Complete an action in-product
   - Reply with information
   - Renew/sign agreement
   - Refer someone
   - Just feel informed/valued

7. **Context/Backstory** - Any relevant history?
   - Recent support tickets?
   - Upcoming renewal date?
   - Recent product changes?
   - Champion relationship status?

8. **Tone Preference** - Any specific voice?
   - Professional/formal
   - Warm/friendly
   - Urgent/direct
   - Celebratory

**Proceed only when you have sufficient context.**

### Step 2: Framework Selection

Based on discovery answers, select the primary frameworks to apply:

**From Customer Success (Mehta):**
- Law 7: Time-to-Value obsession
- Law 8: Understand customer metrics
- Law 9: Drive through hard metrics
- Law 10: Top-down commitment

**From Obviously Awesome (Dunford):**
- Value Themes (Feature → Benefit → Value)
- Competitive Alternatives framing
- "Who Cares a Lot" targeting
- Market Frame positioning

**From Influence (Cialdini):**
- **Reciprocation** - Give value before asking
- **Commitment/Consistency** - Reference past actions/commitments
- **Social Proof** - What similar customers do
- **Liking** - Build genuine rapport
- **Authority** - Use data and expertise
- **Scarcity** - Only when genuinely applicable

**Selection Rules:**
- At-risk customers: Lead with Liking + Mehta (understand the real issue)
- Expansion: Lead with Reciprocity (value delivered) + Dunford (articulate new value)
- Onboarding: Lead with Commitment (micro-wins) + Mehta Law 7 (time-to-value)
- Renewal: Lead with Social Proof + Dunford (value recap)

### Step 3: Write Email

Apply selected frameworks. Write the email.

**Structure (adapt as needed):**

```
Subject Line: [Clear, benefit-focused, no clickbait]

[Opening - 1-2 sentences max]
- For healthy customers: Start with recognition or shared win
- For at-risk: Start with genuine concern, not accusation
- Apply Liking principle: Write as partner, not vendor

[Body - 3-5 short paragraphs max]
- Apply Dunford: Feature → Benefit → Value in THEIR terms
- Apply relevant Cialdini principle based on type
- Apply Mehta: Connect to their success metrics/time-to-value

[CTA - 1 clear action]
- Low friction, high clarity
- One ask only (don't dilute)

[Sign-off]
- Warm, human, appropriate to sender role
```

**MUST include:**
- Subject line (unless explicitly not needed)
- One clear, low-friction CTA
- Value articulation in customer terms (not your product terms)
- Appropriate persuasion principle for the stage

**MUST avoid:**
- Feature dumps without value translation
- Asking without giving first (violates Reciprocity)
- Generic "checking in" without purpose
- Multiple competing CTAs
- Scarcity on at-risk customers (feels manipulative)

### Step 4: Summary (MANDATORY)

After the email, provide:

```
---

**Goal & Strategy:**
- [What this email is trying to achieve]
- [Customer stage movement: Current → Target]

**Frameworks Applied:**
- **Mehta:** [Which law and how it was applied - 1 sentence]
- **Dunford:** [Which framework and how - 1 sentence]
- **Cialdini:** [Which principle and how - 1 sentence]

**Time-to-Value Connection:**
[How this email drives toward customer success/value realization]

---

Would you like me to adjust the tone, length, or try a different approach?
```

**Summary Constraints:**
- 6-8 bullets max across all sections
- Must name specific frameworks used from each book
- Include time-to-value connection for every email

### Step 5: Refinement Loop

If user requests changes:
1. Clarify what specifically needs adjustment
2. Consider if different framework would help
3. Revise email
4. Provide updated summary
5. Ask again for refinement

---

## Quality Checklist (BLOCKING)

Before outputting email, verify ALL items:

- [ ] All relevant discovery questions answered
- [ ] Customer health status considered in tone
- [ ] At least one framework from each book applied
- [ ] Value articulated in customer terms (Dunford)
- [ ] Appropriate Cialdini principle applied
- [ ] Time-to-value connection clear (Mehta)
- [ ] One clear CTA (not multiple)
- [ ] Tone matches customer health and sender role
- [ ] No asking without giving (Reciprocity check)
- [ ] No false scarcity or manipulation
- [ ] Summary includes specific frameworks used
- [ ] Refinement question asked at end

**If any item is unchecked, fix before delivering.**

---

## Error Handling

| Error | Response |
|-------|----------|
| User skips discovery | "To write an effective CS email, I need to understand the customer context. [Ask specific missing question]" |
| Conflicting requirements | "You mentioned the customer is at-risk, but you want to ask for a referral. That's a mismatch. Can you clarify the priority - retention or expansion?" |
| Generic "check-in" request | "Just 'checking in' emails have low value. What specific outcome do you want from this touchpoint? Then I can write something with purpose." |
| Expansion to at-risk customer | "Asking for expansion when customer health is low could backfire. Should we pivot to a health intervention email instead, or is there context I'm missing?" |
| No value to offer first | "You're asking them to [action] but we haven't given them something first. What value can we lead with to set up reciprocity?" |

---

## Reference Quick-Lookup

### Mehta's 10 Laws (Customer Success)

1. Sell to the right customer
2. Natural tendency is to churn
3. Customers expect you to make them successful
4. Relentlessly monitor and manage customer health
5. Loyalty is earned through personal relationships
6. Product is the main driver
7. **Obsessively improve time-to-value**
8. **Deeply understand customer metrics**
9. **Drive through hard metrics**
10. **It's a top-down, company-wide commitment**

### Dunford's Positioning Framework (Obviously Awesome)

1. Competitive Alternatives (what would they do without you?)
2. Unique Attributes (what do you have that alternatives don't?)
3. Value (what do those attributes enable for customers?)
4. "Who Cares a Lot" (best-fit customers)
5. Market Frame (where you position)

### Cialdini's 6 Principles (Influence)

1. **Reciprocation** - People feel obligated to return favors
2. **Commitment/Consistency** - People align with past actions
3. **Social Proof** - People follow similar others
4. **Liking** - People say yes to those they like
5. **Authority** - People defer to experts
6. **Scarcity** - People want what's limited

---

## Example Applications

### Onboarding Email (Day 3)

**Frameworks:** Mehta Law 7 (Time-to-Value) + Commitment (micro-win) + Dunford (value in their terms)

**Structure:**
- Open: Acknowledge their decision to start (commitment made)
- Body: One specific action that delivers quick value (time-to-value)
- CTA: Complete that single action
- Tone: Encouraging, low-pressure

### Churn Prevention Email

**Frameworks:** Mehta Law 4 (Health Monitoring) + Liking + Dunford (reframe value)

**Structure:**
- Open: Genuine concern, not accusation ("I noticed...")
- Body: Reframe value they may have forgotten (Dunford's value themes)
- Body: Social proof of similar customers who found success
- CTA: Low-pressure conversation offer
- Tone: Caring partner, not desperate vendor

### Expansion Email

**Frameworks:** Reciprocity + Dunford (new value articulation) + Mehta Law 9 (metrics)

**Structure:**
- Open: Acknowledge value already delivered (reciprocity setup)
- Body: Connect new capability to their proven success metrics
- Body: Social proof of expansion wins from similar customers
- CTA: Specific next step (not "let me know if interested")
- Tone: Confident, data-backed, not pushy

---

## Skill Log Integration

After every session, record what worked:

```markdown
### {date} - {Email Type} for {Customer Segment}

**Customer Stage:** {stage}
**Health Status:** {healthy/at-risk/etc}
**Frameworks Applied:** {specific frameworks from each book}

**What worked:**
- {Specific approach that resonated}

**What to improve:**
- {Lesson or "Clean run"}
```
