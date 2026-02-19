# Claude Skills

A collection of Claude Code skills — modular packages that extend Claude's capabilities.

## What Are Claude Skills?

Skills are reusable prompt packages for [Claude Code](https://claude.ai/claude-code) (Anthropic's CLI). Each skill gives Claude specialized knowledge and workflows for specific tasks.

## Skills

| Skill | Description |
|-------|-------------|
| `book-to-reference` | Convert books (EPUB, MOBI, PDF) into a 3-file reference library |
| `copywriting-prompt` | Create prompts for persuasive marketing and sales copy |
| `customer-success-copywriter` | Customer success emails and retention copy |
| `daily-sync` | Bi-directional sync between local ventures and Google Drive |
| `email-curator` | Write emails in an authentic personal voice |
| `end-of-day` | EOD review, task creation, and daily summary |
| `gateway-skill-creator` | Create lightweight gateway skills for MCP servers and APIs |
| `github-pages-deploy` | Deploy HTML content to GitHub Pages with custom domains |
| `image-prompt` | Optimized image generation prompts |
| `link-entity-airtable` | Link entities to Airtable and trigger sync |
| `mcp-server-manager` | Manage MCP server configurations and troubleshoot |
| `meeting-summary` | Generate Fireflies-quality meeting summaries |
| `merchant-mapping` | AI-powered merchant matching pipeline |
| `next-step` | Per-client action item tracker |
| `obsidian-optimizer` | Optimize markdown for Obsidian |
| `obsidian-vault-organizer` | Organize Obsidian vaults and manage notes |
| `pdf-to-markdown` | Convert PDFs to word-for-word Markdown |
| `production-week` | Generate production week records in Airtable |
| `prompt-engineer` | Optimize prompts for maximum LLM effectiveness |
| `prompt-review` | Evaluate prompts, plans, and code with rigorous scoring |
| `provision-user` | Provision new users in Supabase |
| `research` | Consultant-grade research with phased investigation |
| `saas-copywriter` | High-converting SaaS copy from tagged copywriting books |
| `sermon-publisher` | Publish sermon notes to Notion with formatting |
| `session-files` | Session checkpoints with 100% context retention |
| `shortcut-story` | Manage Shortcut stories via MCP |
| `skill-creator` | Create new Claude Code skills |
| `slack-gateway` | Send messages and manage Slack via direct API |
| `sprint-rotation` | Rotate sprint statuses in Notion |
| `statement-processing` | Full bank statement processing pipeline |
| `suno-prompt-master` | Expert Suno AI music generation prompting |
| `task-creator` | Create tasks in Airtable |
| `text-curator` | Write text messages in an authentic personal voice |
| `transcript-processor` | Download and organize meeting transcripts |
| `video-copywriter` | Transform briefs into production-ready video scripts |
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

## Sharing

To give a friend access:
```bash
gh repo add-collaborator claude-skills <friend-github-username>
```

---

Built with [Claude Code](https://claude.ai/claude-code)
