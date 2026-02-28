# Gateway Error Taxonomy

All gateway errors follow this format:

```
[GATEWAY_ERROR] E{XXX}: {Type}
Problem: {What happened}
Cause: {Why}
Fix: {Exact steps}
```

---

## Error Codes

| Code | Type | Problem | Cause | Fix |
|------|------|---------|-------|-----|
| E001 | Server not found | MCP tools not in Claude context | Server not configured | Add to ~/.claude.json and restart Claude Code |
| E002 | Server unavailable | MCP server not responding | Server crashed or timeout | Check server logs, restart Claude Code |
| E003 | Auth failed | Authentication rejected | Token invalid or expired | Update ${ENV_VAR} with valid token |
| E004 | Rate limited | Too many requests | API rate limit hit | Wait 60 seconds and retry |
| E005 | Network error | Cannot reach service | No internet or service down | Check internet connection |
| E006 | Dependency missing | Required tool not found | node/npx/curl not installed | Install with: `brew install node` or check PATH |
| E007 | Permission denied | Cannot execute file | File permissions or macOS quarantine | Run: `chmod +x {file}` or `xattr -cr {path}` |
| E008 | Path not found | Directory or file missing | Path doesn't exist | Create path or fix configuration |
| E009 | Schema mismatch | Tool signature changed | MCP tool updated | Auto-rediscovery triggered, retry |
| E010 | Collision detected | Trigger matches another gateway | Overlapping trigger phrases | Change trigger or add non-trigger |
| E011 | Lock timeout | Gateway busy | Another operation in progress | Wait 5 seconds and retry |
| E012 | Tool discovery failed | ToolSearch found no tools | Server not ready or misconfigured | Verify server in ~/.claude.json |
| E013 | Resolution failed | Entity lookup returned 0 | Name not found in service | Provide explicit ID instead of name |
| E014 | Ambiguous entity | Multiple matches found | Name matches multiple entities | Select from list or provide explicit ID |
| E015 | Config invalid | Configuration violates rules | Invalid config combination | Fix config per invariant rules |

---

## Error Examples

### E001: Server not found
```
[GATEWAY_ERROR] E001: Server not found
Problem: Cannot find Telegram MCP tools
Cause: Server not configured in Claude Code
Fix: Add telegram server to ~/.claude.json:
  "mcpServers": {
    "telegram": {
      "command": "npx",
      "args": ["@anthropic/mcp-telegram"]
    }
  }
  Then restart Claude Code.
```

### E003: Auth failed
```
[GATEWAY_ERROR] E003: Auth failed
Problem: Telegram API rejected authentication
Cause: TELEGRAM_BOT_TOKEN is invalid or expired
Fix: 1. Get a new token from @BotFather
     2. Set: export TELEGRAM_BOT_TOKEN="new-token"
     3. Retry the operation
```

### E011: Lock timeout
```
[GATEWAY_ERROR] E011: Lock timeout
Problem: Could not acquire gateway lock after 5 seconds
Cause: Another operation may be in progress or a previous operation crashed
Fix: 1. Wait a few seconds and retry
     2. If persists, check for stuck processes: ps aux | grep gateway
     3. Remove stale lock: rm ~/.claude/skills/telegram-gateway/lock.json
```

### E015: Config invalid
```
[GATEWAY_ERROR] E015: Config invalid
Problem: Invalid configuration combination detected
Cause: Invariant I1 violated: gateway_type=mcp requires lifecycle_mode in {claude_managed, auto}
Fix: Change lifecycle_mode from "gateway_managed" to "auto" or "claude_managed"
```

---

## Invariant Rules (E015)

| Rule | Condition | Allowed Values |
|------|-----------|----------------|
| I1 | gateway_type == mcp | lifecycle_mode in {claude_managed, auto} |
| I2 | lifecycle_mode == gateway_managed | gateway_type in {cli, http} |
| I3 | lifecycle_mode == auto AND gateway_type == mcp | fallback_type in {cli, http, none} |
| I4 | fallback_type == cli | fallback_cli_path must be non-empty |
| I5 | fallback_type == http | fallback_http_url must be non-empty |

---

## Recovery Strategies

### Automatic Recovery
- **E009 (Schema mismatch):** Auto-rediscovery runs, updates discovery.json, retries once
- **E011 (Lock timeout):** Stale/orphan lock detection, automatic cleanup after 60s

### Manual Recovery
- **E001-E002:** User must fix Claude Code configuration
- **E003:** User must update credentials
- **E006-E008:** User must install dependencies or fix paths

### Fallback Recovery
- **MCP fails → CLI fallback:** If fallback_type=cli and fallback_cli_path is valid
- **MCP fails → HTTP fallback:** If fallback_type=http and fallback_http_url is valid
