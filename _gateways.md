# Installed Gateways

Index of all gateway skills for lazy-loading services.

---

## Active Gateways

| Gateway | Type | Lifecycle | Triggers | Status |
|---------|------|-----------|----------|--------|
| *(none installed yet)* | - | - | - | - |

---

## How to Add a Gateway

```
User: "create a gateway for telegram"
```

Or manually:
```bash
node ~/.claude/skills/gateway-skill-creator/scripts/init-gateway.cjs telegram --type=mcp
```

---

## How to Validate

```bash
# Validate configuration
node ~/.claude/skills/gateway-skill-creator/scripts/validate-gateway.cjs telegram-gateway

# Check for trigger collisions
node ~/.claude/skills/gateway-skill-creator/scripts/collision-check.cjs telegram-gateway

# Scan for secret leaks
node ~/.claude/skills/gateway-skill-creator/scripts/secret-scan.cjs telegram-gateway
```

---

## Gateway Types

| Type | Use Case | Lifecycle Options |
|------|----------|-------------------|
| MCP | MCP server in ~/.claude.json | claude_managed, auto |
| CLI | CLI tool in ~/.claude/.CLI/ | gateway_managed |
| HTTP | REST API endpoint | gateway_managed |

---

## Startup Savings

For gateways to provide startup savings, the corresponding MCP server should be:
- Removed from ~/.claude.json, OR
- Disabled (if Claude supports that)

Then the gateway skill will lazy-load the service only when invoked.

---

*Last updated: {timestamp}*
