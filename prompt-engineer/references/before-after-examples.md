# Before/After Prompt Examples

Real examples showing how rough prompts transform into optimized ones.

---

## Example 1: Code Analysis (Claude)

### Before (User's Rough Draft)
```
Look at this code and tell me what's wrong with it
```

### After (Optimized for Claude)
```
<task>
Analyze the following code for bugs, security vulnerabilities, and performance issues.
</task>

<code>
[USER'S CODE HERE]
</code>

<requirements>
For each issue found:
1. State the line number and issue type (bug/security/performance)
2. Explain WHY it's a problem
3. Provide the corrected code

If no issues found, confirm the code is sound and explain why.
</requirements>

<format>
## Issues Found

### Issue 1: [Type] - Line [N]
**Problem:** [explanation]
**Fix:**
```[language]
[corrected code]
```

[Repeat for each issue]

## Summary
[X] bugs, [Y] security issues, [Z] performance issues found.
</format>
```

### Why This Works
| Element | Before | After | Principle |
|---------|--------|-------|-----------|
| Task clarity | Vague "what's wrong" | Specific categories (bugs, security, performance) | Specificity drives precision |
| Structure | None | XML tags separate concerns | Claude excels with delimited sections |
| Output format | Undefined | Explicit template | Gets consistent, actionable output |
| Edge case | Not addressed | "If no issues found" clause | Prevents empty or confused responses |

---

## Example 2: Research Task (ChatGPT)

### Before (User's Rough Draft)
```
Tell me about the best CRM for small business
```

### After (Optimized for ChatGPT)
```
# Task
Research and compare CRM options for small businesses (1-50 employees, $500-2000/year budget).

## Requirements
1. Compare exactly 5 CRM platforms
2. For each, provide:
   - Pricing (starting tier)
   - Best for (use case)
   - Key limitation
   - Integration capabilities

3. Rank them by value-for-money for a service business

## Constraints
- Focus on established platforms (not startups)
- Must have mobile app
- Must integrate with Google Workspace

## Output Format
| CRM | Price/mo | Best For | Limitation | Integrations |
|-----|----------|----------|------------|--------------|

Followed by: "My recommendation for a service business is [X] because [reason]."
```

### Why This Works
| Element | Before | After | Principle |
|---------|--------|-------|-----------|
| Scope | "Best" is subjective | Specific criteria defined | Eliminates ambiguity |
| Context | None | Budget, team size specified | LLM can't assume your situation |
| Format | None | Table + recommendation | Easy to scan and compare |
| Constraints | None | Must-haves defined | Filters irrelevant options |

---

## Example 3: Content Generation (Claude)

### Before (User's Rough Draft)
```
Write a blog post about productivity
```

### After (Optimized for Claude)
```
<context>
Audience: Busy professionals aged 30-45, skeptical of "hustle culture"
Tone: Conversational, evidence-based, slightly contrarian
Length: 800-1000 words
</context>

<task>
Write a blog post arguing that REDUCING work hours increases productivity.
</task>

<structure>
1. Hook: Counter-intuitive opening that challenges "more hours = more output"
2. Evidence: 2-3 studies or real-world examples (cite sources)
3. Practical tips: 3 actionable ways to work fewer, better hours
4. Close: Call-to-action to try one tip this week
</structure>

<constraints>
DO:
- Use short paragraphs (2-3 sentences max)
- Include one personal anecdote or relatable scenario
- Bold key takeaways

DO NOT:
- Use buzzwords like "synergy", "leverage", "hustle"
- Make claims without backing them up
- Write generic advice like "take breaks"
</constraints>

<example_tone>
"You've been lied to. The 80-hour week isn't a badge of honor—it's a symptom
of broken systems. Here's what the research actually says..."
</example_tone>
```

### Why This Works
| Element | Before | After | Principle |
|---------|--------|-------|-----------|
| Audience | Undefined | Specific demographics + mindset | Tone calibration |
| Angle | Generic "productivity" | Specific contrarian take | Differentiates content |
| Structure | None | 4-part outline | Ensures completeness |
| Tone example | None | Sample paragraph provided | Show > tell |
| Constraints | None | DOs and DON'Ts | Prevents common mistakes |

---

## Example 4: Data Extraction (Claude)

### Before (User's Rough Draft)
```
Get the important info from this email
```

### After (Optimized for Claude)
```
<task>
Extract structured data from the following email.
</task>

<email>
[EMAIL CONTENT HERE]
</email>

<extract>
Return a JSON object with these fields (use null if not found):
{
  "sender_name": string,
  "sender_email": string,
  "date_mentioned": string (YYYY-MM-DD format),
  "action_requested": string (what they want me to do),
  "deadline": string (YYYY-MM-DD) or null,
  "attachments_mentioned": boolean,
  "sentiment": "positive" | "neutral" | "negative" | "urgent",
  "requires_response": boolean,
  "key_numbers": [any dollar amounts, percentages, quantities mentioned]
}
</extract>

<rules>
- If multiple dates mentioned, use the one most relevant to the action requested
- For sentiment, "urgent" overrides other sentiments if deadline pressure exists
- Extract exact numbers, not rounded
</rules>
```

### Why This Works
| Element | Before | After | Principle |
|---------|--------|-------|-----------|
| "Important" | Subjective | Explicit field list | Objective extraction |
| Format | Undefined | JSON with types | Machine-readable, consistent |
| Edge cases | None | null handling, multiple dates | Robust to variation |
| Ambiguity | "info" is vague | Specific fields defined | No interpretation needed |

---

## Example 5: Reasoning/Planning (ChatGPT)

### Before (User's Rough Draft)
```
Help me decide if I should hire a contractor or employee
```

### After (Optimized for ChatGPT)
```
# Decision Analysis: Contractor vs Employee

## My Situation
- Role: [describe the role]
- Duration: [ongoing/project-based/uncertain]
- Hours needed: [full-time/part-time/variable]
- Budget: [range]
- Location requirements: [remote/onsite/hybrid]

## Task
Think through this decision step by step:

1. **List the key factors** that matter for this decision (cost, control, flexibility, legal, etc.)

2. **For each factor**, score Contractor vs Employee (1-5) based on my situation

3. **Identify deal-breakers** - any factors that would immediately rule out one option

4. **Calculate weighted recommendation** - which option wins and by how much

5. **List risks** of the recommended option and how to mitigate them

## Output Format
A decision matrix table, followed by a clear recommendation with confidence level (high/medium/low) and the #1 risk to watch for.
```

### Why This Works
| Element | Before | After | Principle |
|---------|--------|-------|-----------|
| Context | None | Situation variables defined | Decision depends on specifics |
| Process | "Help me decide" | 5-step analysis framework | Structured reasoning |
| Output | Undefined | Matrix + recommendation + risk | Actionable deliverable |
| Confidence | None | Confidence level requested | Honest about uncertainty |

---

## Pattern Summary

### Universal Optimization Checklist

1. **Replace vague words** → specific criteria
   - "good" → [measurable quality]
   - "important" → [named fields]
   - "best" → [ranked by criteria X]

2. **Add context the LLM lacks**
   - Who is the audience?
   - What's the use case?
   - What constraints exist?

3. **Define output format explicitly**
   - Table, JSON, markdown, numbered list
   - Include field types and structure

4. **Handle edge cases**
   - "If X, then Y"
   - "If not found, return null"
   - "If multiple, choose by [criteria]"

5. **Show, don't tell (for tone/style)**
   - Provide a sample paragraph
   - Reference known styles

6. **Include both DO and DON'T**
   - Positive instructions (what to include)
   - Negative instructions (what to avoid)
