# Research

Conducts consultant-grade research with phased investigation, weighted scoring, and citation-backed recommendations. Replaces $15K-$50K engagements from McKinsey, Forrester, or Gartner.

## What It Does

Give it a research topic — it runs a 5-phase investigation:

1. **Objective Lock-In** — Confirms the right question before researching
2. **Priority Discovery** — Surfaces hidden priorities with weighted criteria
3. **Deep Investigation** — Multi-source evidence gathering (6 options by default)
4. **Comparative Analysis** — Scored matrix with letter grades
5. **Recommendation** — Primary pick with conditional alternatives

## Key Features

- **Weighted scoring formula** with transparent math
- **Citation standard** — every factual claim gets a footnote
- **Source quality hierarchy** (5 tiers: Official docs → Vendor marketing)
- **Bias detection** — flags affiliates, astroturfing, and single-source claims
- **No-Fake-Winners rule** — refuses to rank under low confidence
- **Context protection** — writes findings to files mid-research to prevent data loss
- **Degraded mode** — handles tool failures gracefully

## Output

A full research report in Markdown with:
- Executive summary
- Weighted scoring matrix
- Category winners
- Individual option profiles (pros/cons/best for/worst for)
- Primary recommendation with confidence level
- Risk flags with mitigations
- Footnoted citations with source index

## Installation

1. Copy the `research/` folder into `~/.claude/skills/`
2. The skill is automatically available in Claude Code

## Usage

```
/research [topic]
```

Or ask Claude: "Research the best project management tools" / "Evaluate options for [X]"

## Requirements

- [Claude Code](https://claude.ai/claude-code)
- Internet access (for WebSearch and WebFetch)
