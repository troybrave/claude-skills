# Claude Skills

A curated collection of Claude Code skills — modular packages that extend Claude's capabilities.

## What Are Claude Skills?

Skills are reusable prompt packages for [Claude Code](https://claude.ai/claude-code) (Anthropic's CLI). Each skill gives Claude specialized knowledge and workflows for specific tasks.

## Skills

| Skill | Description |
|-------|-------------|
| `copywriting-prompt` | Create prompts for persuasive marketing and sales copy |
| `meeting-summary` | Generate Fireflies-quality meeting summaries from transcripts |
| `pdf-to-markdown` | Convert PDFs to word-for-word Markdown (any size, scanned or native) |
| `prompt-engineer` | Optimize prompts for maximum LLM effectiveness |
| `prompt-review` | Evaluate prompts, plans, and code with rigorous scoring |
| `research` | Consultant-grade research with phased investigation and citations |
| `youtube-transcript` | Download YouTube video transcripts |

## Installation

1. Clone this repo into your `.claude/` directory:
   ```bash
   git clone https://github.com/troybrave/claude-skills.git ~/.claude/skills
   ```

2. Skills are automatically available in Claude Code.

## Usage

Invoke any skill in Claude Code by name:
```
/skill-name
```

Or ask Claude to use a specific skill for your task.

---

Built by Troy Brave with [Claude Code](https://claude.ai/claude-code)
