---
name: prompt-engineer
description: Optimizes prompts for maximum LLM effectiveness. Use when user says "help me make a prompt for", "create a prompt for", "optimize this prompt", "engineer a prompt for". NOT for image generation prompts or copywriting prompts.
allowed-tools: Read, Write, Edit
---

# Prompt Engineer

Transforms rough prompt ideas into production-grade prompts that achieve 100% desired outcomes. Builds **systems**, not just outputs.

---

## Before Starting

For transformation examples, reference the `references/before-after-examples.md` file in this skill's directory.

---

## Core Philosophy: Systems Over Outputs

**The difference between a 70-point prompt and a 95-point prompt:**

| 70-Point Prompt | 95-Point Prompt |
|-----------------|-----------------|
| "Generate X" | "Build a system that produces X" |
| "Be accurate" | "Validate accuracy using [method]" |
| "Handle errors" | "If [condition], then [specific action]" |
| Hopes for quality | Enforces quality through structure |
| Single output | Phased, verifiable deliverables |
| Assumes LLM knows | Defines data models explicitly |

**Always ask:** Can this prompt produce a *self-verifying, reproducible system* rather than a one-time artifact?

---

## Workflow

### Step 1: Gather Requirements (Extended)

Ask the user for (if not already provided):

1. **Target LLM** - Which model? (Claude Opus, Sonnet, ChatGPT-4, GPT-4o, etc.)
2. **Goal** - What should the prompt accomplish?
3. **Desired outcomes** - What does success look like?
4. **Desired avoidances** - What should the output NOT do/include?
5. **Autonomy level** - How hands-off should this be? (Guided vs. Independent)
6. **Verification needs** - How will you know if the output is correct?
7. **Operational context** - Any real-world constraints (auth, rate limits, ethics)?

If user provides a rough draft, extract these elements from it.

**CRITICAL - File References:**
If the user provides ANY file paths (CSV, JSON, MD, folders, etc.):
1. **ALWAYS use the actual absolute file path** in the final prompt - never use placeholders like `{{FILE_PATH}}`
2. **Read the file** to extract headers, structure, or sample data to include in the prompt
3. **The final prompt must be 100% copy-paste ready** - no manual substitutions required
4. If a file contains reference material (strategy docs, specs), summarize key points AND include the path for full reference

### Step 2: Classify Complexity Level

Before choosing a template, determine the complexity tier:

| Tier | Characteristics | Approach |
|------|-----------------|----------|
| **Tier 1: Simple** | Single step, clear output, no verification needed | Basic template with constraints |
| **Tier 2: Moderate** | Multiple steps, defined format, light validation | Structured template with examples |
| **Tier 3: Complex** | Multi-phase, needs verification, data flows | Systems architecture approach |
| **Tier 4: Production** | Must be bulletproof, autonomous, self-healing | Full engineering specification |

**Tier 3-4 triggers (use Systems Architecture Approach):**
- User says: "bulletproof", "production-ready", "can't fail", "autonomous"
- Task involves: data pipelines, code generation, multi-file outputs
- Output will be: deployed, reused, or consumed by other systems
- User wants: independence, no babysitting, self-verification

### Step 3: Identify Task Type

| Task Type | Examples | Key Optimization Focus |
|-----------|----------|------------------------|
| **Analysis** | Research, code review, document analysis | Structured output, evidence-based reasoning |
| **Generation** | Writing, coding, content creation | Clear constraints, format specs, examples |
| **Transformation** | Refactoring, reformatting, translation | Input/output clarity, preserve intent |
| **Extraction** | Data parsing, summarization, key points | Precision, completeness, format |
| **Reasoning** | Problem-solving, planning, decisions | Chain-of-thought, step-by-step |
| **Instruction** | How-to, teaching, explaining | Audience level, progressive complexity |
| **Multi-step** | Complex workflows, agents | Task decomposition, state management |
| **System-Building** | Frameworks, pipelines, tools | Architecture spec, phased implementation |

### Step 4: Apply Model-Specific Patterns

#### For Claude (All Versions)

```
STRUCTURE:
- Use XML tags for clear sections: <context>, <task>, <constraints>, <format>
- Put critical instructions at START and END (primacy/recency)
- Use explicit role framing when needed
- Leverage Claude's strength with nuanced instructions

PATTERNS:
- "Think step by step before answering"
- "Do X. Do NOT do Y." (explicit constraints)
- Provide examples in <example> tags
- Use <scratchpad> for reasoning traces
```

**Claude Model Differences:**

| Model | Best For | Optimization Notes |
|-------|----------|-------------------|
| **Opus 4.5** | Most complex reasoning, research, nuanced analysis | Highest capability; can handle ambiguity well; give rich context |
| **Opus 4** | Complex reasoning, nuanced tasks, long-form | Strong reasoning; give more context for better results |
| **Sonnet 4** | Balanced speed/quality, coding, analysis | Be more explicit; benefits from structured constraints |
| **Haiku** | Fast tasks, simple extraction, high-volume | Be extremely explicit; minimal ambiguity; short prompts |

#### For ChatGPT (GPT-4, GPT-4o)

```
STRUCTURE:
- Use markdown headers for organization
- Role-play framing works well: "You are a..."
- Numbered steps for sequential tasks
- Use code blocks for structured output

PATTERNS:
- "Let's think through this step by step"
- System message for persistent behavior
- Temperature guidance: "Be precise" vs "Be creative"
- Few-shot examples improve consistency
```

**GPT Model Differences:**

| Model | Best For | Optimization Notes |
|-------|----------|-------------------|
| **GPT-4** | Complex reasoning, accuracy-critical | Slower but more thorough; handles nuance |
| **GPT-4o** | Speed + quality balance, multimodal | Faster; good for iterative tasks |
| **GPT-4o-mini** | High volume, simple tasks | Keep prompts short; be very explicit |

#### Universal Patterns (All LLMs)

```
CLARITY:
- One instruction per sentence
- Specific > vague ("3 paragraphs" not "a few paragraphs")
- Quantify when possible ("under 200 words")

FORMAT:
- Specify exact output format upfront
- Use delimiters for input data
- Request structured output (JSON, markdown, lists)

EDGE CASES:
- "If [condition], then [action]"
- "If you're unsure, [fallback behavior]"

ANTI-PATTERNS (avoid):
- "Please" and excessive politeness (wastes tokens)
- Vague words: "good", "better", "nice"
- Double negatives
- Assuming context the LLM doesn't have
```

### Step 5: Apply Advanced Techniques

Choose techniques based on task complexity:

#### Chain-of-Thought (CoT)
**Use for:** Reasoning, math, logic, multi-step problems

```
BASIC COT:
"Think through this step by step before giving your final answer."

STRUCTURED COT:
"Before answering:
1. Identify the key elements of the problem
2. Consider possible approaches
3. Work through the most promising approach
4. Verify your answer
5. Then provide your final response."

COT WITH SCRATCHPAD (Claude):
"Use <scratchpad> tags to show your reasoning, then provide the final answer outside the tags."
```

#### Few-Shot Examples
**Use for:** Specific formats, style matching, consistent outputs

```
PATTERN:
<example>
Input: [sample input 1]
Output: [exact desired output 1]
</example>

<example>
Input: [sample input 2]
Output: [exact desired output 2]
</example>

Now process this:
Input: [actual input]
```

**Few-Shot Rules:**
- 2-3 examples is usually optimal
- Examples should cover edge cases
- Keep examples consistent in format
- Include one "tricky" example if relevant

#### Self-Consistency
**Use for:** Critical decisions, when accuracy matters more than speed

```
"Solve this problem three different ways, then compare your answers.
If they agree, that's your final answer.
If they disagree, analyze why and determine which is correct."
```

#### Decomposition
**Use for:** Complex multi-step tasks

```
"Break this task into subtasks:
1. First, [subtask 1]
2. Then, [subtask 2]
3. Finally, [subtask 3]

Complete each subtask before moving to the next.
Show your work for each step."
```

---

## Systems Architecture Approach (Tier 3-4)

**Use this for complex, production-grade prompts.** This is what separates 70-point prompts from 95-point prompts.

### Component 1: Role & Stakes

Define WHO is doing the work and WHY it matters:

```
You are a [specific expert role] specializing in [domain expertise]. Your job is to [primary responsibility] that [impact statement].

This project matters because [stakes]. Users are [who] who require [what they need].
```

**Example:**
```
You are a senior full-stack engineer and design-systems architect working in the GoHighLevel ecosystem. Your job is to reverse-engineer GoHighLevel's UI styling layer end-to-end and implement a production-ready theming framework.

This project matters because we need a bulletproof branding layer that guarantees usability and strict accessibility. Users are GHL operators, agencies, and internal teams who require dependable UI consistency.
```

### Component 2: Objective with Success Criteria

State the goal AND how to measure success:

```
OBJECTIVE

Build [what] that can (1) [capability 1] and (2) [capability 2].

This must be [quality requirements]. The system must cover: [scope list].

Success criteria: [specific, measurable outcomes].
```

**Example:**
```
OBJECTIVE

Build a complete, production-grade CSS/theming system that can (1) model GHL's styling behavior to the smallest practical detail and (2) allow safe customization via brand tokens without visual regressions.

This must be done in phases and must be production-ready (not a demo). The system must cover: component styles, responsive behavior, states, micro-interactions, typography, spacing, elevations, and accessibility.

Success criteria: with one config change (e.g., brand.primary), the UI updates consistently, keeps contrast compliant, maintains layout spacing, and preserves all navigational behaviors.
```

### Component 3: Context & Constraints

Separate hard constraints from soft preferences:

```
CONTEXT & CONSTRAINTS

Domain overview:
• [Key domain knowledge the LLM needs]
• [Assumptions that can be made]

Core requirements (hard constraints):
• [Non-negotiable requirement 1]
• [Non-negotiable requirement 2]

Tech stack requirements (if applicable):
• [Specific tools/frameworks to use]
• [Versions or compatibility needs]

Operational constraints:
• [Ethical/legal boundaries]
• [Resource limits]
• [Access restrictions]
```

### Component 4: Architecture Specification

Define the SYSTEM, not just the output:

```
ARCHITECTURE SPECIFICATION

Break the system into these components:

1. [Component Name]
   • Responsibilities: [what it does]
   • Key interfaces: [inputs/outputs]
   • Location: [where it lives]

2. [Component Name]
   • Responsibilities: [what it does]
   • Key interfaces: [inputs/outputs]
   • Location: [where it lives]
```

### Component 5: Data Models & Types

Define the SHAPE of data flowing through the system:

```
DATA MODELS & TYPES

Define canonical types:

[TypeName] (user input)
• field1: type - description
• field2: type - description

Validation rules:
• [Rule 1]
• [Rule 2]
• If [invalid condition], then [specific action - auto-correct OR fail with message]

[OutputTypeName] (computed output)
• field1: type - description
• Include metadata: [what extra info to track]
```

**Example:**
```
DATA MODELS & TYPES

ThemeConfig (user input)
• brand.primary: hex color - Main brand color
• brand.secondary: hex color (optional) - Secondary accent
• neutrals.background: hex color - Page background
• typography.fontFamily: string - Primary font

Validation rules:
• Colors must be valid hex/rgb/hsl
• If a provided color fails contrast, auto-adjust within constraints (default) or fail with actionable error
• Base sizes must be within 12-24px range

ResolvedTheme (computed output)
• All ThemeConfig fields fully populated with defaults
• Derived values: color shades/tints, on-surface text colors
• contrastReport: list of checks + pass/fail + adjusted values
```

### Component 6: Data Flow Requirements

Specify HOW data moves through the system:

```
DATA FLOW REQUIREMENTS

Flow 1: [Source] → [Process] → [Output]
1. [Step 1]
2. [Step 2]
3. [Step 3]

Error handling:
• If [error condition], then [specific action]

Observability:
• [What to log/track]

Idempotency:
• [How to ensure reproducible results]
```

### Component 7: Phased Implementation

Break work into verifiable phases:

```
IMPLEMENTATION PLAN (PHASED)

Phase 1: [Name]
Goal: [What this phase accomplishes]
Tasks:
• [Task 1]
• [Task 2]
Done means:
• [Specific, verifiable outcome 1]
• [Specific, verifiable outcome 2]

Phase 2: [Name]
Goal: [What this phase accomplishes]
Tasks:
• [Task 1]
• [Task 2]
Done means:
• [Specific, verifiable outcome 1]
• [Specific, verifiable outcome 2]
```

### Component 8: Output Format Requirements

Be EXTREMELY specific about deliverables:

```
OUTPUT FORMAT REQUIREMENTS

When you execute this prompt, respond in this exact structure:

1. [SECTION NAME]
   • [What to include]

2. [SECTION NAME]
   • [What to include]

For each file created:
• Full path as heading
• Complete code block (no pseudocode)
• Production-ready (not demo quality)
```

### Component 9: Critical Requirements (Guardrails)

Explicit fail-safes and non-negotiables:

```
CRITICAL REQUIREMENTS

• Do not [thing that would break the output]
• Do not use [anti-pattern]
• Fully [quality standard] everything
• Implement real error handling with actionable messages
• Ensure [specific safety/quality requirement]
• If [edge case], then [specific fallback behavior]
```

### Component 10: Self-Critique Mechanism

Build quality assurance INTO the prompt:

```
SELF-CRITIQUE INSTRUCTIONS

Once complete, perform a thorough review and rate the result from 1-100.

List:
• Pros (what works well)
• Cons (what could be improved)
• Specific improvements with point values toward 100

If the work does not reach 90+:
• List exactly what is missing
• Propose how to address each gap
• Include one unconventional idea that could significantly improve the result

Report these findings before finalizing.
```

---

## Standard Templates (Tier 1-2)

### Analysis Template

```
<context>
[Background the LLM needs to understand the domain]
</context>

<task>
Analyze [WHAT] for [PURPOSE].
</task>

<input>
[Content to analyze]
</input>

<requirements>
Evaluate based on:
1. [Criterion 1]
2. [Criterion 2]
3. [Criterion 3]

For each finding:
- State what you found
- Explain why it matters
- Provide evidence from the input
</requirements>

<format>
## Analysis Summary
[2-3 sentence overview]

## Key Findings
### Finding 1: [Title]
- **What:** [observation]
- **Why it matters:** [impact]
- **Evidence:** [quote or reference]

[Repeat for each finding]

## Recommendations
1. [Actionable recommendation]
</format>
```

### Generation Template

```
<context>
Audience: [who will read this]
Tone: [formal/casual/technical/friendly]
Purpose: [what this content should accomplish]
</context>

<task>
Write [WHAT] about [TOPIC].
</task>

<requirements>
Include:
- [Required element 1]
- [Required element 2]

Avoid:
- [Thing to exclude 1]
- [Thing to exclude 2]

Length: [specific word/paragraph count]
</requirements>

<format>
[Exact structure expected]
</format>

<example>
[Sample of desired style/format if helpful]
</example>
```

### Extraction Template

```
<task>
Extract [WHAT] from the following [CONTENT TYPE].
</task>

<input>
[Content to extract from]
</input>

<extract>
Return as [JSON/table/list] with these fields:
{
  "field1": "type and description",
  "field2": "type and description"
}
</extract>

<rules>
- If [field] not found, return null
- If multiple [items], return as array
- Format [dates/numbers/etc] as [format]
</rules>
```

### Reasoning Template

```
<task>
[Problem or decision to reason through]
</task>

<context>
[Relevant background information]
</context>

<approach>
Think through this systematically:
1. Identify the key factors
2. Consider the options
3. Evaluate trade-offs
4. Reach a conclusion

Show your reasoning at each step.
</approach>

<format>
## Analysis
[Your step-by-step reasoning]

## Conclusion
[Clear answer/recommendation]

## Confidence
[High/Medium/Low] - [Why]
</format>
```

### Multi-Step Workflow Template

```
<task>
Complete this multi-step workflow:
</task>

<steps>
### Step 1: [Name]
[Instructions for step 1]
Output: [What to produce]

### Step 2: [Name]
Using output from Step 1:
[Instructions for step 2]
Output: [What to produce]

### Step 3: [Name]
[Continue pattern]
</steps>

<rules>
- Complete each step fully before proceeding
- If a step fails, stop and explain why
- Show output for each step
</rules>

<final_output>
After all steps, provide:
[Final deliverable format]
</final_output>
```

---

## Quality Checklist

### Basic (All Prompts)

- [ ] Task is unambiguous (only one interpretation possible)
- [ ] Output format is explicitly specified
- [ ] Constraints include both DO and DON'T
- [ ] No vague words (good, better, nice, proper)
- [ ] Model-specific patterns applied
- [ ] Examples included if task is complex
- [ ] Edge cases addressed
- [ ] Prompt is as short as possible while complete

### Advanced (Tier 3-4 Prompts)

- [ ] Builds a SYSTEM, not just an output
- [ ] Success criteria are specific and measurable
- [ ] Data models/types are explicitly defined
- [ ] Validation rules specify what happens on failure
- [ ] Phased implementation with "done means" for each phase
- [ ] Error handling specifies exact fallback behaviors
- [ ] Operational constraints addressed (auth, rate limits, ethics)
- [ ] Self-critique mechanism included
- [ ] Output format requirements are exhaustively detailed

---

## Iteration & Refinement

If the prompt doesn't work perfectly on first try:

### Diagnose the Problem

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| Output too long/short | No length constraint | Add "in X words/sentences/paragraphs" |
| Wrong format | Format unclear | Add explicit format template |
| Missed key points | Buried in instructions | Move critical items to START and END |
| Too literal | Over-constrained | Remove some restrictions, add "use judgment" |
| Too creative | Under-constrained | Add more specific requirements |
| Inconsistent | No examples | Add 2-3 few-shot examples |
| Wrong tone | Tone not specified | Add explicit tone/voice guidance |
| Hallucinations | Task too open-ended | Add "only use information provided" |
| Incomplete system | Asked for output, not system | Reframe using Systems Architecture Approach |
| Unverifiable | No success criteria | Add specific, measurable "done means" |
| Fragile | No error handling | Add "If [condition], then [action]" for edge cases |

### Refinement Loop

1. **Identify** which part of output is wrong
2. **Trace** which prompt element controls that part
3. **Adjust** that specific element (don't rewrite everything)
4. **Test** with same input
5. **Repeat** until output matches expectation

### When to Start Over

- If 3+ iterations haven't fixed the core issue
- If you're adding so many constraints the prompt is confusing
- If the task fundamentally changed during refinement
- If you realize the prompt asks for OUTPUT when it needs a SYSTEM

---

## Error Handling

| Error | Response |
|-------|----------|
| User doesn't specify target LLM | Default to Claude, note that prompt can be adapted |
| Goal is too vague | Ask clarifying questions before proceeding |
| Conflicting constraints | Point out the conflict, ask user to prioritize |
| User wants "general" prompt for all LLMs | Create Claude version, note key differences for others |
| Prompt is for image generation | Redirect to image-prompt skill |
| Prompt is for copywriting | Redirect to copywriting-prompt skill |
| First attempt didn't work | Use Iteration & Refinement section |
| User says "bulletproof" or "production-ready" | Escalate to Systems Architecture Approach |
| Task requires verification | Add self-critique mechanism and success criteria |

---

## Prompt Scoring Rubric

Use this to evaluate prompt quality:

| Score Range | Characteristics |
|-------------|-----------------|
| **90-100** | Systems-thinking, self-verifying, phased, typed data models, explicit fail-safes, self-critique built-in |
| **80-89** | Well-structured, clear success criteria, some verification, handles edge cases explicitly |
| **70-79** | Good structure and constraints, but asks for output rather than system, verification is manual/afterthought |
| **60-69** | Basic template applied, format specified, but vague on edge cases and verification |
| **50-59** | Task is clear but lacks constraints, format, or examples |
| **Below 50** | Vague, ambiguous, missing critical components |

**Target: 90+ for production prompts, 80+ for all others.**

---

## Skill Log Integration (Self-Healing Loop)

The skill-log is a learning database that makes this skill smarter over time.

### Before Each Use

Ask: "How did this prompt work? Any issues or unexpected behavior?" to gather feedback and improve over time.

---

## Quick Reference: Prompt Anatomy

### Basic Prompt (Tier 1-2)

```
[ROLE - optional]
You are a [specific expert] who [key behavior].

[CONTEXT - if needed]
<context>
Background information the LLM needs.
</context>

[TASK - required]
[Clear imperative instruction]

[INPUT - if applicable]
<input>
[User's data/content here]
</input>

[CONSTRAINTS - recommended]
Requirements:
- [Do this]
- [Do that]

Avoid:
- [Don't do this]
- [Don't do that]

[FORMAT - recommended]
Output as:
[Exact format specification]

[EXAMPLES - if complex]
<example>
Input: [sample]
Output: [sample]
</example>

[REASONING - if complex]
Think step by step: [specific reasoning instruction]
```

### Production Prompt (Tier 3-4)

```
[ROLE & STAKES]
You are a [expert]. Your job is to [responsibility] that [impact].
This matters because [stakes]. Users are [who] who require [what].

[OBJECTIVE]
Build [what] that can (1) [capability] and (2) [capability].
Success criteria: [specific, measurable].

[CONTEXT & CONSTRAINTS]
Domain: [knowledge needed]
Hard constraints: [non-negotiables]
Tech stack: [tools/frameworks]
Operational: [limits/ethics]

[ARCHITECTURE]
Components:
1. [Name] - [responsibility] - [interfaces]
2. [Name] - [responsibility] - [interfaces]

[DATA MODELS]
[TypeName]
• field: type - description
Validation: If [invalid], then [auto-correct OR fail with message]

[DATA FLOW]
Flow: [source] → [process] → [output]
Error handling: If [error], then [action]
Idempotency: [how to ensure reproducibility]

[PHASED IMPLEMENTATION]
Phase 1: [Goal]
Tasks: [list]
Done means: [verifiable outcomes]

Phase 2: [Goal]
Tasks: [list]
Done means: [verifiable outcomes]

[OUTPUT FORMAT]
Respond with:
1. [Section] - [contents]
2. [Section] - [contents]
For each file: full path + complete code

[CRITICAL REQUIREMENTS]
• Do not [anti-pattern]
• Fully [quality standard]
• If [edge case], then [fallback]

[SELF-CRITIQUE]
Rate result 1-100. List pros, cons, improvements with point values.
If below 90, list what's missing and how to address it.
```

---

## References

For detailed before/after transformation examples, see `references/before-after-examples.md` in this skill's directory.

This includes 5 comprehensive examples covering:
- Code Analysis (Claude)
- Research Tasks (ChatGPT)
- Content Generation (Claude)
- Data Extraction (Claude)
- Reasoning/Planning (ChatGPT)
