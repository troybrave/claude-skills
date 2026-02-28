# Gateway Skill Creator - Full Specification

> A meta-skill that generates "gateway skills" - lightweight skills that lazy-load MCP servers or CLI tools only when invoked, saving both memory and context.

---

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Solution: Gateway Pattern](#solution-gateway-pattern)
3. [Architecture](#architecture)
4. [File Structure](#file-structure)
5. [Skill Workflow](#skill-workflow)
6. [Templates](#templates)
7. [Init Script Specification](#init-script-specification)
8. [Validation Requirements](#validation-requirements)
9. [Example Gateway Skills](#example-gateway-skills)
10. [Open Questions](#open-questions)

---

## Problem Statement

### Current State (Without Gateways)

| Issue | Impact |
|-------|--------|
| MCP servers load at Claude Code startup | Memory consumed even if never used |
| All MCP tools appear in context | Token overhead for every conversation |
| Complex MCP configuration required | User must edit `~/.claude.json` manually |
| No way to "lazy load" capabilities | All or nothing approach |

### Real-World Example

User has 10 MCP servers configured:
- Notion, Airtable, Supabase, Slack, Discord, Telegram, Linear, GitHub, Figma, Stripe

**Without Gateways:**
- All 10 servers start at launch
- ~100+ tools loaded into context
- Memory: ~500MB+ used constantly
- Context: Thousands of tokens consumed listing available tools

**With Gateways:**
- 0 servers start at launch
- 10 lightweight skill descriptions in context (~50 tokens each)
- Memory: Near zero until invoked
- Only the needed server starts when user says "/telegram send message"

---

## Solution: Gateway Pattern

### What is a Gateway Skill?

A gateway skill is a **lightweight wrapper** that:
1. Has minimal context footprint (just a description)
2. Starts an MCP server OR calls a CLI tool **only when invoked**
3. Executes the requested operation
4. Optionally cleans up (stops server) after completion

### Key Insight

Claude Code skills have a two-layer architecture:

| Layer | When Loaded | Size |
|-------|-------------|------|
| Frontmatter description | ALWAYS (every conversation) | ~50 tokens |
| skill.md body | Only when skill triggers | ~500-2000 tokens |

Gateway skills exploit this by keeping the "always loaded" part tiny, while the "execution logic" only loads when needed.

---

## Architecture

### Flow Diagram

```
User says "/telegram send message to John"
                    ↓
┌────────────────────────────────────────────────────────────┐
│  SKILL TRIGGER CHECK (Always in context - ~50 tokens)      │
│  description: "Send Telegram messages. Use when user says  │
│  'telegram', 'send telegram', 'message via telegram'."     │
└────────────────────────────────────────────────────────────┘
                    ↓ (Skill triggers)
┌────────────────────────────────────────────────────────────┐
│  SKILL BODY LOADS (Only now - ~500 tokens)                 │
│  - Parse user intent (recipient: John, action: send)       │
│  - Start MCP server in background                          │
│  - Use ToolSearch to load MCP tools                        │
│  - Execute: mcp__telegram__send_message                    │
│  - Return result to user                                   │
│  - (Optional) Stop MCP server                              │
└────────────────────────────────────────────────────────────┘
                    ↓
Result: "Message sent to John via Telegram"
```

### Two Gateway Types

| Type | Use Case | Mechanism |
|------|----------|-----------|
| **MCP Gateway** | Wraps an MCP server | Starts server → ToolSearch → Execute → (Stop) |
| **CLI Gateway** | Wraps a CLI tool | Parses intent → Runs CLI command → Returns result |

---

## File Structure

```
/Users/troybrave/.claude/skills/gateway-skill-creator/
├── skill.md                    # Main skill definition (the meta-skill)
├── skill-log.md                # Learning log for this skill
├── templates/
│   ├── mcp-gateway.md          # Template for MCP-based gateway skills
│   └── cli-gateway.md          # Template for CLI-based gateway skills
├── scripts/
│   └── init-gateway.cjs        # Scaffolds a new gateway skill directory
└── references/
    └── gateway-patterns.md     # Detailed patterns for MCP lifecycle, CLI wrapping
```

---

## Skill Workflow

### Phase 1: Discovery

When user says "create a gateway skill" or "make a gateway for X":

**Questions to Ask:**

1. **Service Identification**
   - "What service or tool do you want to gateway? (e.g., Telegram, Slack, custom API)"

2. **Gateway Type**
   - "Is this an MCP server or a CLI tool?"
   - If unclear: "Do you have an MCP server package/command, or a CLI tool in ~/.claude/.CLI/?"

3. **For MCP Gateways:**
   - "What's the server start command?" (e.g., `npx @anthropic/mcp-telegram`)
   - "What environment variables are needed?" (e.g., `TELEGRAM_BOT_TOKEN`)
   - "What are the main tools/operations available?" (e.g., send_message, get_updates)

4. **For CLI Gateways:**
   - "Where is the CLI tool located?" (e.g., `/Users/troybrave/.claude/.CLI/telegram-cli/`)
   - "What are the main commands?" (e.g., `node cli.js send`, `node cli.js read`)
   - "What arguments do commands take?" (e.g., `--to`, `--message`)

5. **Trigger Phrases**
   - "What phrases should trigger this gateway?"
   - Examples: "telegram", "send telegram message", "check telegram"

6. **Non-Triggers (if ambiguous)**
   - "Any similar phrases that should NOT trigger this?"
   - Example: "message" alone shouldn't trigger if there's also a Slack gateway

### Phase 2: Generate Gateway Skill

1. Run init script:
   ```bash
   /Users/troybrave/.claude/skills/gateway-skill-creator/scripts/init-gateway.cjs {service-name} --type={mcp|cli}
   ```

2. Populate skill.md from appropriate template

3. Customize:
   - Insert server command / CLI path
   - Insert environment variables
   - Insert available operations
   - Insert trigger phrases
   - Add service-specific error handling

4. Create skill-log.md from standard template

### Phase 3: Validate & Deliver

1. Run validation script (reuse from skill-creator)
2. Self-rate using standard rubric (must be 85+)
3. Deliver with standard format
4. Ask for feedback

---

## Templates

### MCP Gateway Template (`templates/mcp-gateway.md`)

```markdown
---
name: {service}-gateway
description: {Action verb} via {Service}. Use when user says "{trigger1}", "{trigger2}", "{trigger3}". Lazy-loads MCP server on demand - zero overhead until invoked. NOT for {non-triggers if any}.
allowed-tools: Read, Bash, ToolSearch, Task
---

# {Service} Gateway

Lazy-loading gateway for {Service} MCP server. Server starts only when you invoke this skill.

---

## Environment Requirements

| Variable | Purpose | Location |
|----------|---------|----------|
| `{ENV_VAR_1}` | {Purpose} | Set in shell or .zshrc |
| `{ENV_VAR_2}` | {Purpose} | Set in shell or .zshrc |

---

## Available Operations

| Operation | Trigger Phrases | MCP Tool |
|-----------|-----------------|----------|
| {Operation 1} | "{phrase}", "{phrase}" | `mcp__{service}__{tool1}` |
| {Operation 2} | "{phrase}", "{phrase}" | `mcp__{service}__{tool2}` |
| {Operation 3} | "{phrase}", "{phrase}" | `mcp__{service}__{tool3}` |

---

## Workflow

### Step 1: Parse User Intent

Extract from user request:
- **Operation:** Which action? (send, read, list, etc.)
- **Parameters:** Recipients, message content, filters, etc.

### Step 2: Load MCP Tools

Use ToolSearch to discover and load the {Service} MCP tools:

```
ToolSearch query: "+{service}"
```

This loads the MCP tools into context without starting the server until a tool is called.

### Step 3: Execute Operation

Call the appropriate MCP tool based on parsed intent:

| Intent | Tool Call |
|--------|-----------|
| {Intent 1} | `mcp__{service}__{tool1}` with params |
| {Intent 2} | `mcp__{service}__{tool2}` with params |

### Step 4: Return Result

Format the response for the user:
- Confirm action completed
- Show relevant details (message ID, timestamp, etc.)
- Report any warnings

---

## Error Handling

| Error | Cause | Response |
|-------|-------|----------|
| MCP tool not found | Server not configured | "The {Service} MCP server isn't configured. Add it to ~/.claude.json" |
| Authentication failed | Invalid/expired token | "Check your {ENV_VAR} - authentication failed" |
| Rate limited | Too many requests | "Rate limited by {Service}. Wait and retry." |
| Network error | Connectivity issue | "Couldn't reach {Service}. Check your connection." |

---

## Notes

- Server starts automatically when MCP tool is invoked via ToolSearch
- No manual server management needed
- Context only consumed when skill is actively used
```

### CLI Gateway Template (`templates/cli-gateway.md`)

```markdown
---
name: {service}-gateway
description: {Action verb} via {Service}. Use when user says "{trigger1}", "{trigger2}", "{trigger3}". Zero overhead - CLI called only when needed. NOT for {non-triggers if any}.
allowed-tools: Read, Bash
---

# {Service} Gateway

Lightweight gateway for {Service} CLI tool. CLI executes only when you invoke this skill.

---

## CLI Location

```
/Users/troybrave/.claude/.CLI/{service}-cli/
```

**Before first use:** Read the HELP.md file:
```bash
cat /Users/troybrave/.claude/.CLI/{service}-cli/HELP.md
```

---

## Available Commands

| Operation | Command | Arguments |
|-----------|---------|-----------|
| {Operation 1} | `node cli.js {cmd1}` | `{args}` |
| {Operation 2} | `node cli.js {cmd2}` | `{args}` |
| {Operation 3} | `node cli.js {cmd3}` | `{args}` |

---

## Workflow

### Step 1: Parse User Intent

Extract from user request:
- **Action:** Which command to run
- **Arguments:** Values to pass to CLI

### Step 2: Execute CLI Command

```bash
cd /Users/troybrave/.claude/.CLI/{service}-cli && node cli.js {command} {arguments}
```

### Step 3: Return Result

Parse CLI output and format for user:
- Confirm action completed
- Show relevant response data
- Report any errors clearly

---

## Error Handling

| Error | Cause | Response |
|-------|-------|----------|
| CLI not found | Tool not installed | "The {Service} CLI isn't installed at expected path" |
| Command failed | Invalid arguments | Show CLI error message, suggest correct usage |
| Auth error | Credentials issue | "Check {Service} credentials - authentication failed" |

---

## Notes

- No persistent process - CLI runs and exits
- Zero memory overhead when not in use
- Full CLI capabilities available through this gateway
```

---

## Init Script Specification

### `scripts/init-gateway.cjs`

```javascript
#!/usr/bin/env node
/**
 * Initialize a new gateway skill
 *
 * Usage: ./init-gateway.cjs <service-name> --type=<mcp|cli>
 *
 * Creates:
 *   /Users/troybrave/.claude/skills/<service>-gateway/
 *   ├── skill.md           (from appropriate template)
 *   └── skill-log.md       (standard template)
 */

// Arguments:
//   service-name: lowercase, hyphenated (e.g., "telegram", "my-api")
//   --type=mcp: Use MCP gateway template
//   --type=cli: Use CLI gateway template

// Behavior:
// 1. Validate service name (lowercase, letters/numbers/hyphens)
// 2. Check skill doesn't already exist
// 3. Create directory: /Users/troybrave/.claude/skills/{service}-gateway/
// 4. Copy appropriate template to skill.md
// 5. Replace {service}, {Service} placeholders
// 6. Copy skill-log template
// 7. Print success message with next steps

// Template locations:
//   MCP: /Users/troybrave/.claude/skills/gateway-skill-creator/templates/mcp-gateway.md
//   CLI: /Users/troybrave/.claude/skills/gateway-skill-creator/templates/cli-gateway.md

// Skill-log template:
//   /Users/troybrave/.claude/skills/skill-creator/skill-log-template.md
```

---

## Validation Requirements

Gateway skills must pass standard skill validation plus:

| Check | Requirement |
|-------|-------------|
| Description length | < 60 words (gateways should be lightweight) |
| Trigger phrases | At least 2 specific triggers |
| Non-triggers | Specified if service name is ambiguous |
| Type consistency | MCP gateways use ToolSearch, CLI gateways use Bash |
| Error handling | Covers: not found, auth failed, network error |
| Path accuracy | CLI path exists OR MCP server is documented |

---

## Example Gateway Skills

### Example 1: Telegram MCP Gateway

**Discovery Answers:**
- Service: Telegram
- Type: MCP
- Server command: `npx @anthropic/mcp-telegram`
- Env vars: `TELEGRAM_BOT_TOKEN`
- Operations: send_message, get_updates, get_chat
- Triggers: "telegram", "send telegram", "telegram message"

**Generated skill.md frontmatter:**
```yaml
---
name: telegram-gateway
description: Send and receive Telegram messages. Use when user says "telegram", "send telegram message", "check telegram". Lazy-loads MCP server on demand. NOT for SMS or other messaging.
allowed-tools: Read, Bash, ToolSearch, Task
---
```

### Example 2: Notion CLI Gateway

**Discovery Answers:**
- Service: Notion
- Type: CLI
- Location: `/Users/troybrave/.claude/.CLI/notion-cli/`
- Commands: `todos`, `pages`, `search`
- Triggers: "notion tasks", "check notion", "notion pages"

**Generated skill.md frontmatter:**
```yaml
---
name: notion-cli-gateway
description: Interact with Notion via CLI. Use when user says "notion tasks", "check notion", "notion pages". Zero overhead CLI wrapper. NOT for Notion MCP operations.
allowed-tools: Read, Bash
---
```

---

## Open Questions

### 1. MCP Server Lifecycle

**Question:** Should gateway skills explicitly manage server lifecycle, or rely on Claude Code's built-in MCP handling?

**Options:**
- **A) Explicit management** - Gateway starts server in background, kills after operation
- **B) Implicit via ToolSearch** - Just use ToolSearch to load tools; Claude Code handles server
- **C) Hybrid** - Use ToolSearch, but provide manual start/stop for long-running sessions

**Current assumption:** Option B (ToolSearch handles it)

### 2. Multiple Operations in One Session

**Question:** If user invokes gateway multiple times in one conversation, should server stay running?

**Options:**
- **A) Stay running** - Better performance for multiple operations
- **B) Start/stop each time** - Maximum memory savings
- **C) Timeout-based** - Stay running for 5 minutes of inactivity

**Current assumption:** Let Claude Code manage this (Option A effectively)

### 3. Gateway vs. Always-On MCP

**Question:** When should a user use a gateway vs. just configuring MCP in `~/.claude.json`?

**Guidelines:**
- Use **gateway** when: Service is rarely used, memory matters, want simple invocation
- Use **always-on MCP** when: Service used constantly, need fastest response time

### 4. Skill Naming Convention

**Question:** Should gateway skills be named `{service}-gateway` or just `{service}`?

**Options:**
- **A) `{service}-gateway`** - Clear it's a gateway, distinguishes from potential native skill
- **B) `{service}`** - Simpler, user doesn't need to know implementation

**Current assumption:** Option A (`{service}-gateway`) for clarity

### 5. Error Recovery

**Question:** What should happen if an MCP server fails to start?

**Options:**
- **A) Fail fast** - Return error immediately
- **B) Retry once** - Try starting again with small delay
- **C) Fallback** - If CLI alternative exists, use that instead

**Current assumption:** Option A (fail fast with clear error message)

---

## Implementation Priority

1. **Phase 1:** Create skill.md for gateway-skill-creator (the meta-skill)
2. **Phase 2:** Create templates (mcp-gateway.md, cli-gateway.md)
3. **Phase 3:** Create init-gateway.cjs script
4. **Phase 4:** Create references/gateway-patterns.md
5. **Phase 5:** Test by creating a real gateway skill
6. **Phase 6:** Validate and deliver

---

## Success Criteria

The gateway-skill-creator is successful when:

1. User can say "create a gateway for Telegram" and get a working gateway skill
2. Generated gateway skills have < 60 words in description
3. Generated gateway skills correctly lazy-load their target service
4. Memory usage is near-zero until gateway is invoked
5. Context tokens are minimal until gateway is invoked
6. Error handling covers common failure modes
7. Self-rating achieves 85+ before delivery
