---
name: gateway-skill-creator
description: Creates lightweight gateway skills that lazy-load MCP servers, CLI tools, or HTTP APIs on demand. Use when user says "create gateway", "make gateway for", "gateway skill for". Saves memory and context by not loading services until invoked. NOT for regular skills (use skill-creator).
allowed-tools: Read, Write, Bash, Edit, Glob, Grep, AskUserQuestion
---

# Gateway Skill Creator

A meta-skill that generates "gateway skills" - lightweight wrappers that lazy-load services only when invoked, saving memory and context.

---

## What This Skill Does

When you say "create a gateway for Telegram", this skill:
1. Asks discovery questions (type, triggers, config)
2. Validates config against invariant rules
3. Generates a complete gateway skill
4. Runs validation (collision check, secret scan, dependency check)
5. Delivers a working gateway

---

## Gateway Types

| Type | Use Case | Mechanism |
|------|----------|-----------|
| **MCP Gateway** | Wraps MCP server in ~/.claude.json | ToolSearch → Execute |
| **CLI Gateway** | Wraps CLI tool in ~/.claude/.CLI/ | Validate → Bash → Execute |
| **HTTP Gateway** | Wraps REST API | Build request → curl → Parse response |

---

## Config Invariants (MUST ENFORCE)

| Rule | Condition | Allowed Values |
|------|-----------|----------------|
| I1 | gateway_type == mcp | lifecycle_mode in {claude_managed, auto} |
| I2 | lifecycle_mode == gateway_managed | gateway_type in {cli, http} |
| I3 | lifecycle_mode == auto AND gateway_type == mcp | fallback_type in {cli, http, none} |
| I4 | fallback_type == cli | fallback_cli_path must be non-empty |
| I5 | fallback_type == http | fallback_http_url must be non-empty |

If any invariant violated → E015 (Config invalid)

---

## Workflow

### Phase 1: Discovery

Ask these questions using AskUserQuestion:

**Q1: Service Identification**
- "What service do you want to gateway?" (e.g., Telegram, Slack, Stripe)

**Q2: Gateway Type**
- Options: MCP server, CLI tool, HTTP API
- If unsure: "Do you have an MCP server in ~/.claude.json, a CLI in ~/.claude/.CLI/, or an API endpoint?"

**Q3: Based on Type**

For MCP:
- "Is the MCP server already in ~/.claude.json?" (determines lifecycle_mode)
- "What environment variables are needed?"
- "Do you have a CLI or HTTP fallback if MCP fails?"

For CLI:
- "Where is the CLI?" (default: ~/.claude/.CLI/{service}-cli/)
- "What are the main commands?"
- Read HELP.md if exists

For HTTP:
- "What's the base URL?"
- "What auth method?" (Bearer, API key, Basic)
- "What env var holds the token?"

**Q4: Trigger Phrases**
- "What phrases should trigger this gateway?" (minimum 2)
- Examples: "telegram", "send telegram message"

**Q5: Non-Triggers (if collision risk)**
- Run collision check against existing gateways
- If score > 0.3, ask: "What phrases should NOT trigger this?"

**Q6: Destructive Actions**
- "Any actions that need confirmation before executing?" (delete, bulk update, etc.)

### Phase 2: Generate Gateway Skill

1. **Validate config** against invariant rules (I1-I5)
   - If invalid → report E015 with exact fix

2. **Run init script:**
   ```bash
   node /Users/troybrave/.claude/skills/gateway-skill-creator/scripts/init-gateway.cjs {service} --type={mcp|cli|http}
   ```

3. **For MCP gateways:** Run discovery to get actual tool names
   ```bash
   node /Users/troybrave/.claude/skills/gateway-skill-creator/scripts/discovery.cjs {service}
   ```

4. **Customize skill.md:**
   - Insert config block with all settings
   - Insert trigger phrases and non-triggers
   - Insert discovered operations (for MCP) or commands (for CLI) or endpoints (for HTTP)
   - Add entity resolvers if applicable

5. **Create state.json:**
   ```json
   {
     "version": "2.3",
     "lifecycle_mode": "{mode}",
     "pid": null,
     "last_used": null,
     "entity_cache": {}
   }
   ```

### Phase 3: Validate & Deliver

1. **Run validation:**
   ```bash
   node /Users/troybrave/.claude/skills/gateway-skill-creator/scripts/validate-gateway.cjs {service}-gateway
   ```

2. **Run collision check:**
   ```bash
   node /Users/troybrave/.claude/skills/gateway-skill-creator/scripts/collision-check.cjs {service}-gateway
   ```

3. **Run secret scan:**
   ```bash
   node /Users/troybrave/.claude/skills/gateway-skill-creator/scripts/secret-scan.cjs {service}-gateway
   ```

4. **Validation Checklist:**
   - [ ] Description ≤60 words, ≤350 chars
   - [ ] ≥2 trigger phrases
   - [ ] Collision scores all <0.7
   - [ ] Secret scan L1+L2 pass
   - [ ] Config invariants pass
   - [ ] Dependencies validated (node/curl/paths)

5. **Update gateway index:**
   ```bash
   # Append to ~/.claude/skills/_gateways.md
   ```

6. **Deliver with format:**
   ```
   Gateway Created: {service}-gateway
   Location: ~/.claude/skills/{service}-gateway/
   Type: {mcp|cli|http}
   Lifecycle: {claude_managed|gateway_managed|auto}
   Triggers: {list}

   Test it: "/{service} {test-operation}"
   ```

---

## Error Codes

| Code | Type | Fix |
|------|------|-----|
| E001 | Server not found | Add to ~/.claude.json |
| E002 | Server unavailable | Check logs, restart Claude |
| E003 | Auth failed | Update ${ENV_VAR} |
| E006 | Dependency missing | Install node/curl |
| E007 | Permission denied | chmod or xattr -cr |
| E008 | Path not found | Create path or fix config |
| E010 | Collision detected | Change trigger |
| E015 | Config invalid | Fix per invariant rules |

---

## File Locations

- Templates: `/Users/troybrave/.claude/skills/gateway-skill-creator/templates/`
- Scripts: `/Users/troybrave/.claude/skills/gateway-skill-creator/scripts/`
- Gateway index: `/Users/troybrave/.claude/skills/_gateways.md`

---

## Quick Examples

### Create MCP Gateway (with fallback)
```
User: "create a gateway for telegram"
→ Type: MCP (in ~/.claude.json)
→ Lifecycle: auto (try MCP, fall back to CLI)
→ Triggers: "telegram", "send telegram", "telegram message"
→ Output: ~/.claude/skills/telegram-gateway/
```

### Create CLI Gateway
```
User: "create a gateway for notion cli"
→ Type: CLI
→ Path: ~/.claude/.CLI/notion-cli/
→ Lifecycle: gateway_managed
→ Triggers: "notion tasks", "check notion"
→ Output: ~/.claude/skills/notion-cli-gateway/
```

### Create HTTP Gateway
```
User: "create a gateway for stripe api"
→ Type: HTTP
→ Base URL: https://api.stripe.com/v1
→ Auth: Bearer token from STRIPE_SECRET_KEY
→ Triggers: "stripe", "check stripe", "stripe balance"
→ Output: ~/.claude/skills/stripe-gateway/
```

---

## Notes

- Always run collision check before delivering
- Never write env var VALUES to files (only names)
- For MCP gateways, user should disable the server in ~/.claude.json to get startup savings
- Generated gateways use opportunistic cleanup (no background monitor)
