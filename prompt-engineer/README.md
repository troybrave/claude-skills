# Prompt Engineer

Transforms rough prompt ideas into production-grade prompts that achieve maximum LLM effectiveness. Builds **systems**, not just outputs.

## What It Does

Give it a rough idea of what you want a prompt to do — it engineers a complete, optimized prompt with proper structure, constraints, examples, and verification.

## Key Features

- **4-Tier Complexity System**: Simple prompts get light treatment; production prompts get full systems architecture
- **Model-Specific Optimization**: Patterns for Claude (Opus, Sonnet, Haiku) and ChatGPT (GPT-4, GPT-4o)
- **Systems Architecture Approach**: 10-component framework for bulletproof prompts (Tier 3-4)
- **Prompt Scoring Rubric**: Rate prompts 1-100 with specific criteria
- **Before/After Examples**: 5 real transformation examples included

## Complexity Tiers

| Tier | Use When | Approach |
|------|----------|----------|
| Tier 1: Simple | Single step, clear output | Basic template |
| Tier 2: Moderate | Multiple steps, defined format | Structured template |
| Tier 3: Complex | Multi-phase, needs verification | Systems architecture |
| Tier 4: Production | Must be bulletproof, autonomous | Full engineering spec |

## Installation

1. Copy the `prompt-engineer/` folder into `~/.claude/skills/`
2. The skill is automatically available in Claude Code

## Usage

```
/prompt-engineer
```

Or ask Claude: "Help me make a prompt for [task]"

## Included Files

- `skill.md` — The core skill prompt
- `references/before-after-examples.md` — 5 detailed transformation examples

## Requirements

- [Claude Code](https://claude.ai/claude-code)
- No additional dependencies
