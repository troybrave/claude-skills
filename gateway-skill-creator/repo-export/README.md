# Gateway Skill Creator

A Claude Code skill that generates "gateway skills" - lightweight wrappers that lazy-load MCP servers, CLI tools, or HTTP APIs **only when invoked**, saving memory and context.

## The Problem

When you configure MCP servers in Claude Code, they all load at startup:
- 10 servers = ~500MB memory used constantly
- 100+ tools in context = thousands of tokens consumed
- Services running even when not needed

## The Solution

Gateway skills wrap services and only activate them on demand:
- 0 servers at startup
- ~50 tokens per gateway (just the description)
- Service starts only when you invoke it

## Installation

Copy the `gateway-skill-creator` folder to your Claude Code skills directory:

```bash
cp -r gateway-skill-creator ~/.claude/skills/
```

## Usage

Tell Claude:
```
"create a gateway for telegram"
"make gateway for notion cli"
"gateway skill for stripe api"
```

The skill will:
1. Ask discovery questions (type, triggers, config)
2. Generate a complete gateway skill
3. Validate it (collision check, secret scan)
4. Deliver a working gateway

## Gateway Types

| Type | Use Case | Example |
|------|----------|---------|
| **MCP** | Services with MCP servers | Telegram, Slack, Notion |
| **CLI** | Command-line tools | Custom CLIs in ~/.claude/.CLI/ |
| **HTTP** | REST APIs | Stripe, any HTTP endpoint |

## File Structure

```
gateway-skill-creator/
├── skill.md                 # Main skill definition
├── templates/
│   ├── mcp-gateway.md       # MCP gateway template
│   ├── cli-gateway.md       # CLI gateway template
│   └── http-gateway.md      # HTTP gateway template
├── scripts/
│   ├── init-gateway.cjs     # Create new gateway
│   ├── validate-gateway.cjs # Validate configuration
│   ├── collision-check.cjs  # Check trigger collisions
│   ├── secret-scan.cjs      # Detect secret leaks
│   └── discovery.cjs        # MCP tool discovery
└── references/
    └── error-taxonomy.md    # Error codes E001-E015
```

## Scripts

### init-gateway.cjs
Creates a new gateway skill from template:
```bash
node scripts/init-gateway.cjs telegram --type=mcp
```

### validate-gateway.cjs
Validates a gateway's configuration:
```bash
node scripts/validate-gateway.cjs telegram-gateway
```

### collision-check.cjs
Checks for trigger phrase collisions with other gateways:
```bash
node scripts/collision-check.cjs telegram-gateway
```

### secret-scan.cjs
Scans for accidentally committed secrets (3-layer detection):
```bash
node scripts/secret-scan.cjs telegram-gateway
```

## Configuration Invariants

The skill enforces these rules to prevent invalid configurations:

| Rule | Condition | Allowed |
|------|-----------|---------|
| I1 | gateway_type = mcp | lifecycle_mode in {claude_managed, auto} |
| I2 | lifecycle_mode = gateway_managed | gateway_type in {cli, http} |
| I3 | auto + mcp | fallback_type in {cli, http, none} |
| I4 | fallback_type = cli | fallback_cli_path required |
| I5 | fallback_type = http | fallback_http_url required |

## Collision Scoring

Trigger phrases are scored for collision risk:

- **0.0-0.29**: Allow
- **0.3-0.69**: Warn (add non-triggers)
- **0.7-0.99**: Block (must change trigger)
- **1.0**: Block (exact duplicate)

The scoring uses:
- Jaccard similarity (base)
- +0.3 boost for service token overlap (telegram, slack, etc.)
- -0.2 penalty for generic-only overlap (send, check, etc.)
- +0.15 boost for prefix matches

## Error Codes

| Code | Type | Fix |
|------|------|-----|
| E001 | Server not found | Add to ~/.claude.json |
| E003 | Auth failed | Update environment variable |
| E006 | Dependency missing | Install node/curl |
| E010 | Collision detected | Change trigger phrase |
| E015 | Config invalid | Fix per invariant rules |

See `references/error-taxonomy.md` for the complete list.

## Security

- Never writes secret VALUES to files (only variable names)
- Three-layer secret detection (patterns, key names, entropy)
- Validates no tokens are committed before delivery

## License

MIT
