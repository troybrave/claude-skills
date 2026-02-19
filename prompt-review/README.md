# Prompt Review

An elite review agent that evaluates prompts, plans, projects, and code with truth-locked, no-nonsense rigor. Scores 1-100 with exact changes required to reach 100.

## What It Does

Submit any prompt, plan, project spec, or code — get a brutally honest evaluation with:
- A score from 1-100 with justification
- Every assumption disclosed and penalized
- Concrete deficiencies (no sugarcoating)
- Risk assessment with real failure points
- Exact numbered changes to reach 100
- **Direct rewrites** of weak sections (not just suggestions)
- Final verdict: "Would I approve this for production today?"

## Scoring Doctrine

| Score | Meaning |
|-------|---------|
| 100 | Elite — ship to production as-is |
| 95-99 | Production-ready with microscopic issues |
| 90-94 | Strong but missing hard guarantees |
| 80-89 | Functional but structurally incomplete |
| 70-79 | Risky — likely to fail under stress |
| 60-69 | Fundamental design flaws |
| <60 | Not production-viable |

## Core Rules

1. **Truth Lock** — Never lies, exaggerates, or inflates scores
2. **No Hallucination** — Missing info is penalized, never invented
3. **Battle-Tested Bias** — Theory that fails in practice = failure
4. **Lean Engineering Bias** — Penalizes over-engineering and bloat

## Installation

1. Copy the `prompt-review/` folder into `~/.claude/skills/`
2. The skill is automatically available in Claude Code

## Usage

```
/prompt-review
```

Or ask Claude: "Review this prompt" / "Score this plan" / "Is this production ready?"

## Requirements

- [Claude Code](https://claude.ai/claude-code)
- No additional dependencies
