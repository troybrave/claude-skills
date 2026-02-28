# Gateway Skill Creator v2 - Hybrid Specification

> A meta-skill that generates "gateway skills" - lightweight skills that lazy-load MCP servers or CLI tools only when invoked, saving both memory and context.

**Version:** 2.0 (incorporates architectural review feedback)
**Status:** Implementation-ready

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
4. Manages lifecycle (timeout-based cleanup)

### Key Insight

Claude Code skills have a two-layer architecture:

| Layer | When Loaded | Size |
|-------|-------------|------|
| Frontmatter description | ALWAYS (every conversation) | ~50 tokens |
| skill.md body | Only when skill triggers | ~500-2000 tokens |

Gateway skills exploit this by keeping the "always loaded" part tiny, while the "execution logic" only loads when needed.

---

## Architecture

### Flow Diagram (v2 - Hybrid Lifecycle)

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
│  1. Parse user intent (recipient: John, action: send)      │
│  2. Acquire lock (prevent concurrent starts)               │
│  3. Use ToolSearch to discover MCP tools                   │
│  4. Attempt tool call (implicit start)                     │
│     ├─ SUCCESS → Return result                             │
│     └─ FAILURE → Explicit start + health-check + retry     │
│  5. Update last-used timestamp                             │
│  6. Release lock                                           │
└────────────────────────────────────────────────────────────┘
                    ↓
Result: "Message sent to John via Telegram"

[Background: Idle timeout monitor stops server after N minutes]
```

### Three Gateway Types

| Type | Use Case | Mechanism |
|------|----------|-----------|
| **MCP Gateway** | Wraps an MCP server | ToolSearch → Implicit start → (Explicit fallback) → Execute |
| **CLI Gateway** | Wraps a CLI tool | Parses intent → Validates deps → Runs CLI command → Returns result |
| **HTTP Gateway** | Wraps HTTP endpoint | Parses intent → Auth headers → curl/fetch → Returns result |

---

## Resolved Design Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| **MCP Lifecycle** | Hybrid (C) | Attempt implicit first (ToolSearch + tool call). On failure, run explicit start + health-check + retry once. Robust across different runtimes. |
| **Multiple Operations** | Timeout-based (C) | Keep server running, track last-used timestamp, stop after N minutes idle (default: 5 min, configurable). Best balance of responsiveness and resource savings. |
| **Gateway vs Always-On** | Threshold-based | Use gateway when: <5 uses/day OR >5 servers configured OR >500 tools in context. Use always-on when: used continuously in workflow sessions. |
| **Naming Convention** | `{service}-gateway` with aliases | Primary name includes `-gateway` for clarity. Trigger phrases allow `/telegram` invocation. Optional alias skill if no collision. |
| **Error Recovery** | Retry once + Optional fallback | One retry after explicit start/health-check. Fallback to CLI only if `fallback_cli_path` configured and user approved. |

---

## File Structure

```
/Users/troybrave/.claude/skills/gateway-skill-creator/
├── skill.md                    # Main skill definition (the meta-skill)
├── skill-log.md                # Learning log for this skill
├── templates/
│   ├── mcp-gateway.md          # Template for MCP-based gateway skills
│   ├── cli-gateway.md          # Template for CLI-based gateway skills
│   └── http-gateway.md         # Template for HTTP-based gateway skills
├── scripts/
│   ├── init-gateway.cjs        # Scaffolds a new gateway skill directory
│   ├── validate-gateway.cjs    # Validates generated gateways
│   └── collision-check.cjs     # Checks trigger phrase collisions
└── references/
    ├── gateway-patterns.md     # Detailed patterns for lifecycle, wrapping
    └── error-taxonomy.md       # Standardized error messages
```

---

## Skill Workflow

### Phase 1: Discovery

When user says "create a gateway skill" or "make a gateway for X":

**Questions to Ask:**

1. **Service Identification**
   - "What service or tool do you want to gateway? (e.g., Telegram, Slack, custom API)"

2. **Gateway Type**
   - "Is this an MCP server, CLI tool, or HTTP endpoint?"
   - If unclear: "Do you have an MCP server package, a CLI in ~/.claude/.CLI/, or an API endpoint?"

3. **Existing Configuration Check** *(new)*
   - "Is there an existing MCP entry in ~/.claude.json (even if disabled)?"

4. **For MCP Gateways:**
   - "What's the server start command?" (e.g., `npx @anthropic/mcp-telegram`)
   - "What environment variables are needed?" (e.g., `TELEGRAM_BOT_TOKEN`)
   - "What are the main tools/operations available?" (e.g., send_message, get_updates)
   - Run **tool discovery** to get actual tool names/schemas

5. **For CLI Gateways:**
   - "Where is the CLI tool located?" (e.g., `/Users/troybrave/.claude/.CLI/telegram-cli/`)
   - "What are the main commands?" (e.g., `node cli.js send`, `node cli.js read`)
   - Read **HELP.md** and parse available commands

6. **For HTTP Gateways:** *(new)*
   - "What's the base URL?" (e.g., `http://localhost:8080` or `https://api.service.com`)
   - "What authentication method?" (Bearer token, API key header, Basic auth)
   - "What are the main endpoints?"

7. **Session Behavior** *(new)*
   - "Do you want this gateway to support multi-step sessions (keepalive) or one-shot calls?"
   - Default: timeout-based (5 min idle)

8. **Trigger Phrases**
   - "What phrases should trigger this gateway?"
   - Examples: "telegram", "send telegram message", "check telegram"
   - **Minimum 2 specific triggers required**

9. **Non-Triggers (collision prevention)**
   - "Any similar phrases that should NOT trigger this?"
   - Run **collision check** against existing gateway triggers
   - Force non-triggers when overlap is high

10. **Destructive Actions** *(new)*
    - "Any destructive actions that should require confirmation?"
    - Examples: delete, bulk update, send to all

### Phase 2: Generate Gateway Skill

1. Run init script:
   ```bash
   node /Users/troybrave/.claude/skills/gateway-skill-creator/scripts/init-gateway.cjs {service-name} --type={mcp|cli|http}
   ```

2. **Tool Discovery Step** *(new for MCP)*
   - Run ToolSearch to discover actual tool names
   - Populate "Available Operations" from discovered tools (not guessed names)

3. **Dependency Validation Step** *(new for CLI)*
   - Check: `command -v node`, `node -v`
   - Check: HELP.md exists at CLI path
   - Check: executable permissions
   - Check: macOS quarantine/gatekeeper issues

4. Populate skill.md from appropriate template

5. Customize:
   - Insert server command / CLI path / HTTP base URL
   - Insert environment variables (names only, never values)
   - Insert discovered operations with actual tool names
   - Insert trigger phrases
   - Insert non-triggers
   - Add service-specific error handling
   - Configure timeout and fallback settings

6. Generate config block:
   ```yaml
   # Gateway Configuration
   service_name: telegram
   gateway_type: mcp
   server_command: npx @anthropic/mcp-telegram
   env_vars: [TELEGRAM_BOT_TOKEN]
   idle_timeout_sec: 300
   fallback_cli_path: null
   requires_confirmation: [delete_message, leave_chat]
   ```

7. Create skill-log.md with redaction rules

### Phase 3: Validate & Deliver

1. Run validation script:
   ```bash
   node /Users/troybrave/.claude/skills/gateway-skill-creator/scripts/validate-gateway.cjs {service}-gateway
   ```

2. **Validation Checklist:**
   - [ ] Description ≤60 words and ≤350 characters
   - [ ] At least 2 specific trigger phrases
   - [ ] Non-triggers specified if collision risk detected
   - [ ] MCP gateways use ToolSearch + hybrid lifecycle
   - [ ] CLI gateways use Bash with dependency checks
   - [ ] Error handling covers: not found, auth failed, network error, dependency missing
   - [ ] CLI path exists and is executable
   - [ ] Includes non-destructive test operation
   - [ ] No secrets written to skill files (only variable names)
   - [ ] Passes trigger collision check

3. Run collision check:
   ```bash
   node /Users/troybrave/.claude/skills/gateway-skill-creator/scripts/collision-check.cjs {service}-gateway
   ```

4. Self-rate using standard rubric (must be 85+)

5. Deliver with standard format

6. Update gateway index:
   ```bash
   # Append to ~/.claude/skills/_gateways.md
   ```

---

## Templates

### MCP Gateway Template (v2)

```markdown
---
name: {service}-gateway
description: {Action verb} via {Service}. Use when user says "{trigger1}", "{trigger2}", "{trigger3}". Lazy-loads MCP server on demand. NOT for {non-triggers}.
allowed-tools: Read, Bash, ToolSearch, Task
---

# {Service} Gateway

Lazy-loading gateway for {Service} MCP server. Server starts only when you invoke this skill.

---

## Configuration

```yaml
service_name: {service}
gateway_type: mcp
server_command: {server_command}
env_vars: [{ENV_VAR_1}, {ENV_VAR_2}]
idle_timeout_sec: 300
fallback_cli_path: {fallback_path_or_null}
requires_confirmation: [{destructive_actions}]
```

---

## Environment Requirements

| Variable | Purpose | Setup |
|----------|---------|-------|
| `{ENV_VAR_1}` | {Purpose} | Add to `.env` file (never commit) |
| `{ENV_VAR_2}` | {Purpose} | Add to `.env` file (never commit) |

**Security:** Never echo, log, or write env var VALUES. Only reference by name.

---

## Discovered Operations

| Operation | Trigger Phrases | MCP Tool | Parameters |
|-----------|-----------------|----------|------------|
| {Operation 1} | "{phrase}", "{phrase}" | `mcp__{service}__{tool1}` | {params} |
| {Operation 2} | "{phrase}", "{phrase}" | `mcp__{service}__{tool2}` | {params} |
| {Operation 3} | "{phrase}", "{phrase}" | `mcp__{service}__{tool3}` | {params} |

---

## Collision Notes

This gateway triggers ONLY when user explicitly mentions: {specific_triggers}

Does NOT trigger for: {non_triggers}

---

## Workflow

### Step 1: Parse User Intent

Extract from user request:
- **Operation:** Which action? (send, read, list, etc.)
- **Parameters:** Recipients, message content, filters, etc.

### Step 2: Acquire Lock

Check for existing lock file:
```
~/.claude/skills/{service}-gateway/.lock
```

If locked, wait briefly (500ms) and re-check. If still locked, report "Gateway busy, try again."

### Step 3: Load MCP Tools (Hybrid Lifecycle)

**Attempt 1: Implicit Start**
```
ToolSearch query: "+{service}"
```

Call the appropriate MCP tool. If successful, proceed to Step 5.

**Attempt 2: Explicit Start + Retry** (on failure)
1. Start server explicitly (if start command available)
2. Health-check: Call a non-destructive tool (e.g., list/get)
3. Retry the original operation

### Step 4: Execute Operation

Call the appropriate MCP tool based on parsed intent:

| Intent | Tool Call |
|--------|-----------|
| {Intent 1} | `mcp__{service}__{tool1}` with params |
| {Intent 2} | `mcp__{service}__{tool2}` with params |

**For destructive actions:** Require user confirmation before executing.

### Step 5: Return Result & Cleanup

Format the response for the user:
- Confirm action completed
- Show relevant details (message ID, timestamp, etc.)
- Report any warnings

Update last-used timestamp. Release lock.

---

## Error Handling

| Error | Cause | Response |
|-------|-------|----------|
| MCP tool not found | Server not configured | "The {Service} MCP server isn't configured. Add it to ~/.claude.json or check the server package name." |
| Server start failed | Process error | "Failed to start {Service} server. Check that `{server_command}` is valid and dependencies are installed." |
| Authentication failed | Invalid/expired token | "Check your {ENV_VAR} - authentication failed. Verify the token is valid and not expired." |
| Rate limited | Too many requests | "Rate limited by {Service}. Wait 60 seconds and retry." |
| Network error | Connectivity issue | "Couldn't reach {Service}. Check your internet connection." |
| Dependency missing | node/npx not found | "Required dependency missing. Run: `brew install node` or check your PATH." |
| Permission denied | macOS quarantine | "Permission denied. Run: `xattr -cr {path}` to clear quarantine flag." |
| Tool schema mismatch | Outdated mapping | "Tool call failed - schema may have changed. Re-run gateway discovery to update mappings." |

---

## Notes

- Hybrid lifecycle: implicit start first, explicit fallback on failure
- Timeout-based cleanup: server stops after 5 min idle
- Lock file prevents concurrent start race conditions
- No secrets logged - only variable names referenced
```

### CLI Gateway Template (v2)

```markdown
---
name: {service}-gateway
description: {Action verb} via {Service}. Use when user says "{trigger1}", "{trigger2}", "{trigger3}". Zero overhead CLI wrapper. NOT for {non-triggers}.
allowed-tools: Read, Bash
---

# {Service} Gateway

Lightweight gateway for {Service} CLI tool. CLI executes only when you invoke this skill.

---

## Configuration

```yaml
service_name: {service}
gateway_type: cli
cli_path: /Users/troybrave/.claude/.CLI/{service}-cli/
cli_command: node cli.js
requires_confirmation: [{destructive_actions}]
dry_run_supported: {true|false}
```

---

## CLI Location

```
/Users/troybrave/.claude/.CLI/{service}-cli/
```

**Before first use:** Read the HELP.md file.

---

## Dependency Validation

Before executing, verify:
- [ ] `command -v node` returns valid path
- [ ] CLI directory exists
- [ ] cli.js is executable
- [ ] HELP.md exists (for reference)

---

## Available Commands

| Operation | Command | Arguments | Destructive? |
|-----------|---------|-----------|--------------|
| {Operation 1} | `node cli.js {cmd1}` | `{args}` | No |
| {Operation 2} | `node cli.js {cmd2}` | `{args}` | No |
| {Operation 3} | `node cli.js {cmd3}` | `{args}` | **Yes** |

---

## Collision Notes

This gateway triggers ONLY when user explicitly mentions: {specific_triggers}

Does NOT trigger for: {non_triggers}

---

## Workflow

### Step 1: Parse User Intent

Extract from user request:
- **Action:** Which command to run
- **Arguments:** Values to pass to CLI

### Step 2: Validate Dependencies

```bash
command -v node && test -f /Users/troybrave/.claude/.CLI/{service}-cli/cli.js
```

If validation fails, report specific missing dependency.

### Step 3: Execute CLI Command

**For non-destructive operations:**
```bash
cd /Users/troybrave/.claude/.CLI/{service}-cli && node cli.js {command} {arguments}
```

**For destructive operations:**
1. If dry_run_supported: Run with `--dry-run` first, show preview
2. Ask user to confirm
3. Execute actual command

### Step 4: Return Result

Parse CLI output and format for user:
- Confirm action completed
- Show relevant response data
- Report any errors clearly

---

## Error Handling

| Error | Cause | Response |
|-------|-------|----------|
| CLI not found | Tool not installed | "The {Service} CLI isn't installed at `/Users/troybrave/.claude/.CLI/{service}-cli/`. Create the directory and add cli.js." |
| Node not found | Node.js missing | "Node.js not found. Install with: `brew install node`" |
| Command failed | Invalid arguments | Show CLI error message + correct usage from HELP.md |
| Auth error | Credentials issue | "Check {Service} credentials - authentication failed. Verify config in CLI directory." |
| Permission denied | File permissions | "Permission denied. Run: `chmod +x cli.js` or check directory permissions." |
| Working directory invalid | Path doesn't exist | "CLI directory not found. Expected: `/Users/troybrave/.claude/.CLI/{service}-cli/`" |

---

## Notes

- No persistent process - CLI runs and exits
- Zero memory overhead when not in use
- Full CLI capabilities available through this gateway
- Destructive operations require confirmation
```

### HTTP Gateway Template (v2) *(new)*

```markdown
---
name: {service}-gateway
description: {Action verb} via {Service} API. Use when user says "{trigger1}", "{trigger2}", "{trigger3}". Lightweight HTTP wrapper. NOT for {non-triggers}.
allowed-tools: Read, Bash, WebFetch
---

# {Service} Gateway

Lightweight gateway for {Service} HTTP API. Requests made only when you invoke this skill.

---

## Configuration

```yaml
service_name: {service}
gateway_type: http
base_url: {base_url}
auth_method: {bearer|api_key|basic}
auth_header: {Authorization|X-API-Key|etc}
env_var_for_token: {ENV_VAR_NAME}
```

---

## Environment Requirements

| Variable | Purpose | Setup |
|----------|---------|-------|
| `{ENV_VAR_NAME}` | API authentication | Add to `.env` file (never commit) |

**Security:** Never echo, log, or write token VALUES. Only reference by name.

---

## Available Endpoints

| Operation | Method | Endpoint | Parameters |
|-----------|--------|----------|------------|
| {Operation 1} | GET | `/api/{endpoint1}` | `{params}` |
| {Operation 2} | POST | `/api/{endpoint2}` | `{body}` |
| {Operation 3} | DELETE | `/api/{endpoint3}` | `{params}` |

---

## Workflow

### Step 1: Parse User Intent

Extract from user request:
- **Operation:** Which endpoint to call
- **Parameters:** Query params, request body, etc.

### Step 2: Build Request

Construct the HTTP request:
- URL: `{base_url}{endpoint}`
- Headers: Authentication header with token from env var
- Body: JSON payload (for POST/PUT)

### Step 3: Execute Request

Use curl or WebFetch:
```bash
curl -X {METHOD} "{base_url}{endpoint}" \
  -H "{auth_header}: ${{ENV_VAR_NAME}}" \
  -H "Content-Type: application/json" \
  -d '{body}'
```

### Step 4: Return Result

Parse response and format for user:
- Confirm action completed
- Show relevant response data
- Handle error status codes

---

## Error Handling

| Error | Cause | Response |
|-------|-------|----------|
| 401 Unauthorized | Invalid token | "Authentication failed. Check your {ENV_VAR_NAME} token." |
| 403 Forbidden | Insufficient permissions | "Access denied. Your token may not have permission for this operation." |
| 404 Not Found | Invalid endpoint | "Endpoint not found. Check the API path." |
| 429 Rate Limited | Too many requests | "Rate limited. Wait and retry." |
| 500 Server Error | Service issue | "{Service} server error. Try again later." |
| Network error | Connectivity | "Couldn't reach {Service}. Check your connection." |

---

## Notes

- No persistent connection - HTTP request/response only
- Zero overhead when not in use
- Supports REST APIs and simple HTTP services
```

---

## Init Script Specification (v2)

### `scripts/init-gateway.cjs`

```javascript
#!/usr/bin/env node
/**
 * Initialize a new gateway skill
 *
 * Usage: ./init-gateway.cjs <service-name> --type=<mcp|cli|http>
 *
 * Creates:
 *   /Users/troybrave/.claude/skills/<service>-gateway/
 *   ├── skill.md           (from appropriate template)
 *   ├── skill-log.md       (standard template)
 *   └── .lock              (empty lock file)
 */

const fs = require('fs');
const path = require('path');

const SKILLS_DIR = '/Users/troybrave/.claude/skills';
const TEMPLATES_DIR = path.join(SKILLS_DIR, 'gateway-skill-creator/templates');

// Arguments:
//   service-name: lowercase, letters/numbers/hyphens only
//   --type=mcp|cli|http

function main() {
  const args = process.argv.slice(2);
  const serviceName = args.find(a => !a.startsWith('--'));
  const typeArg = args.find(a => a.startsWith('--type='));
  const type = typeArg ? typeArg.split('=')[1] : null;

  // 1. Validate service name
  if (!serviceName || !/^[a-z0-9-]+$/.test(serviceName)) {
    console.error('Error: Service name must be lowercase letters, numbers, and hyphens only');
    process.exit(1);
  }

  // 2. Validate type
  if (!['mcp', 'cli', 'http'].includes(type)) {
    console.error('Error: --type must be mcp, cli, or http');
    process.exit(1);
  }

  // 3. Check skill doesn't already exist
  const skillDir = path.join(SKILLS_DIR, `${serviceName}-gateway`);
  if (fs.existsSync(skillDir)) {
    console.error(`Error: Skill already exists at ${skillDir}`);
    process.exit(1);
  }

  // 4. Create directory
  fs.mkdirSync(skillDir, { recursive: true });

  // 5. Copy appropriate template
  const templateFile = path.join(TEMPLATES_DIR, `${type}-gateway.md`);
  const skillFile = path.join(skillDir, 'skill.md');

  let template = fs.readFileSync(templateFile, 'utf8');

  // 6. Replace placeholders
  const ServiceName = serviceName.charAt(0).toUpperCase() + serviceName.slice(1);
  template = template.replace(/\{service\}/g, serviceName);
  template = template.replace(/\{Service\}/g, ServiceName);

  fs.writeFileSync(skillFile, template);

  // 7. Copy skill-log template
  const logTemplate = path.join(SKILLS_DIR, 'skill-creator/skill-log-template.md');
  const logFile = path.join(skillDir, 'skill-log.md');
  if (fs.existsSync(logTemplate)) {
    fs.copyFileSync(logTemplate, logFile);
  }

  // 8. Create empty lock file
  fs.writeFileSync(path.join(skillDir, '.lock'), '');

  // 9. Print success
  console.log(`✓ Created ${serviceName}-gateway at ${skillDir}`);
  console.log(`\nNext steps:`);
  console.log(`1. Edit ${skillFile} to customize for your service`);
  console.log(`2. Run tool discovery (for MCP) or read HELP.md (for CLI)`);
  console.log(`3. Run validation: node validate-gateway.cjs ${serviceName}-gateway`);
  console.log(`4. Run collision check: node collision-check.cjs ${serviceName}-gateway`);
}

main();
```

---

## Validation Requirements (v2)

Gateway skills must pass ALL checks:

| Check | Requirement | How to Verify |
|-------|-------------|---------------|
| Description length | ≤60 words AND ≤350 characters | Word/char count |
| Trigger phrases | At least 2 specific triggers | Parse frontmatter |
| Non-triggers | Specified if collision risk >0.3 | Collision check script |
| Type consistency | MCP→ToolSearch, CLI→Bash, HTTP→WebFetch/Bash | Parse allowed-tools |
| Error handling | Covers: not found, auth failed, network error, dependency missing | Section exists |
| Path/command validity | CLI path exists OR MCP command documented OR HTTP URL valid | File/command check |
| Test operation | Includes non-destructive test (list/get) | Section exists |
| No secret leakage | No env var VALUES in skill files | Grep for known patterns |
| Collision safety | Trigger collision score <0.5 | Collision check script |
| Config block | YAML config present with required fields | Parse skill.md |

---

## Success Criteria (v2 - Measurable)

| Criterion | Target | How to Measure |
|-----------|--------|----------------|
| Time-to-first-use | ≤1 minute of interaction | Timer from "create gateway" to runnable directory |
| Description footprint | ≤60 words, ≤350 characters | Automated check |
| Startup savings | 0 MCP servers auto-started | `ps aux | grep mcp` after fresh Claude Code launch |
| First-call reliability | ≥90% success rate | 10 test invocations on fresh launch |
| Tool discovery correctness | Successfully calls 1+ "hello world" operation | Validation step |
| No secret leakage | 0 env var values in files/logs | `grep -r` for known token patterns |
| Collision safety | All gateways pass collision check | Automated script |

---

## Error Taxonomy (Standardized)

All gateway errors follow this format:

```
[GATEWAY_ERROR] {Error Type}
Problem: {What happened}
Likely cause: {Why it happened}
Fix: {Exact steps to resolve}
```

**Error Types:**

| Code | Type | Example |
|------|------|---------|
| `E001` | Server not found | MCP server package not installed |
| `E002` | Server start failed | Process crashed or timed out |
| `E003` | Auth failed | Invalid or expired token |
| `E004` | Rate limited | Too many requests |
| `E005` | Network error | No connectivity |
| `E006` | Dependency missing | Node.js, npx, etc. not found |
| `E007` | Permission denied | File permissions or macOS quarantine |
| `E008` | Path not found | CLI directory or file missing |
| `E009` | Schema mismatch | Tool call signature changed |
| `E010` | Collision detected | Trigger phrase matches another gateway |
| `E011` | Lock timeout | Gateway busy from another invocation |

---

## Risk Mitigation Summary

| Risk | Mitigation |
|------|------------|
| MCP startup differs from assumptions | Hybrid lifecycle: implicit first, explicit fallback |
| Tool naming mismatch | Discovery step populates actual tool names |
| Orphan processes | PID files + idle timeout + manual stop command |
| Race conditions | File-based lock, acquire before start/stop |
| CLI environment drift | Dependency validation before execution |
| Trigger collisions | Collision check script + forced non-triggers |
| Confusing errors | Standardized error taxonomy |
| Discovery friction | Fast path: infer from start command or CLI path |
| Template drift | Version header + minimal templates + shared patterns |
| Skill sprawl | Gateway index file (~/.claude/skills/_gateways.md) |

---

## Gateway Index

Maintain at `~/.claude/skills/_gateways.md`:

```markdown
# Installed Gateways

| Gateway | Type | Triggers | Status |
|---------|------|----------|--------|
| telegram-gateway | mcp | telegram, send telegram | active |
| notion-cli-gateway | cli | notion tasks, check notion | active |
| stripe-gateway | http | stripe, payment | active |

Last updated: {timestamp}
```

---

## Implementation Checklist

- [ ] Create `gateway-skill-creator/` directory structure
- [ ] Write `skill.md` (meta-skill definition)
- [ ] Create `templates/mcp-gateway.md`
- [ ] Create `templates/cli-gateway.md`
- [ ] Create `templates/http-gateway.md`
- [ ] Write `scripts/init-gateway.cjs`
- [ ] Write `scripts/validate-gateway.cjs`
- [ ] Write `scripts/collision-check.cjs`
- [ ] Create `references/error-taxonomy.md`
- [ ] Create `_gateways.md` index file
- [ ] Test with real MCP gateway (e.g., Telegram)
- [ ] Test with real CLI gateway (e.g., Notion)
- [ ] Validate all success criteria pass

---

*Generated: Hybrid specification combining original design + architectural review feedback*
*Ready for implementation*
