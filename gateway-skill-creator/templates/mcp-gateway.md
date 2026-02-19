---
name: {service}-gateway
description: {action_verb} via {Service}. Use when user says "{trigger1}", "{trigger2}", "{trigger3}". Lazy-loads MCP on demand. NOT for {non_triggers}.
allowed-tools: Read, Bash, ToolSearch, Task, AskUserQuestion
---

# {Service} Gateway

Lazy-loading gateway for {Service} MCP server. Server activates only when you invoke this skill.

---

## Configuration

```yaml
service_name: {service}
gateway_type: mcp
lifecycle_mode: {lifecycle_mode}
fallback_type: {fallback_type}
fallback_cli_path: {fallback_cli_path}
fallback_http_url: {fallback_http_url}
env_vars: [{env_vars}]
idle_timeout_sec: 300
requires_confirmation: [{requires_confirmation}]
```

---

## Environment Requirements

| Variable | Purpose |
|----------|---------|
| `{ENV_VAR_1}` | {purpose} |

**Security:** Never echo, log, or write env var VALUES. Only reference by name.

---

## Discovered Operations

| Operation | Trigger Phrases | MCP Tool | Parameters |
|-----------|-----------------|----------|------------|
| {operation_1} | "{phrase}", "{phrase}" | `mcp__{service}__{tool1}` | {params} |
| {operation_2} | "{phrase}", "{phrase}" | `mcp__{service}__{tool2}` | {params} |

---

## Entity Resolvers

| Parameter | Resolver Tool | Search Param | Result Path |
|-----------|---------------|--------------|-------------|
| {param_name} | `mcp__{service}__{resolver}` | {search_param} | {result_path} |

---

## Collision Notes

**Triggers ONLY when user says:** {specific_triggers}

**Does NOT trigger for:** {non_triggers}

---

## Workflow

### Step 1: Parse User Intent

Extract from user request:
- **Operation:** Which action? (send, read, list, etc.)
- **Parameters:** Recipients, content, filters, etc.

### Step 2: Acquire Lock

```bash
# Check ~/.claude/skills/{service}-gateway/lock.json
# If locked and valid → wait (max 5s) or E011
# If stale (>60s) or orphan (PID dead) → break lock
# Create lock with PID + timestamp
```

### Step 3: Opportunistic Cleanup

```bash
# Read state.json
# If lifecycle_mode == gateway_managed AND pid exists:
#   If (now - last_used) > idle_timeout_sec:
#     Kill process, update state
```

### Step 4: Load MCP Tools

**Lifecycle Decision Table:**

| lifecycle_mode | Tool Call Result | fallback_type | Action |
|----------------|------------------|---------------|--------|
| claude_managed | success | (any) | Return result |
| claude_managed | failure | (any) | E001 + fix steps |
| auto | success | (any) | Return result |
| auto | failure | cli | Try fallback_cli_path |
| auto | failure | http | Try fallback_http_url |
| auto | failure | none | E001 + fix steps |

**Tool Discovery:**
```
ToolSearch query: "+{service}"
```

**Readiness Check (if tools not found):**
- Wait 500ms, retry (max 5 attempts = 2.5s)
- After timeout → E012

### Step 5: Resolve Entities

If required parameter (e.g., chat_id) is a name:
1. Check entity_cache in state.json (if valid TTL → use cached ID)
2. Call resolver_tool if defined
3. Handle results:
   - 0 matches → E013 (ask user for ID)
   - 1 match → use it, cache with 24h TTL
   - 2+ matches → E014 (ask user to disambiguate)

### Step 6: Execute Operation

Call the MCP tool with resolved parameters.

**For destructive actions** (in requires_confirmation):
- Ask user to confirm before executing

### Step 7: Return Result & Cleanup

- Format response for user
- Update state.json with last_used timestamp
- Release lock

---

## Error Handling

| Error | Code | Response |
|-------|------|----------|
| MCP tools not found | E001 | "Add {Service} to ~/.claude.json and restart Claude Code" |
| Server unavailable | E002 | "Check server logs, restart Claude Code" |
| Auth failed | E003 | "Update ${ENV_VAR} with valid token" |
| Rate limited | E004 | "Wait 60s and retry" |
| Tool discovery failed | E012 | "Verify {Service} in ~/.claude.json" |
| Resolution failed (0) | E013 | "Couldn't find '{name}'. Please provide the ID." |
| Ambiguous (2+) | E014 | "Found multiple matches. Which one?" |

---

## State Files

**state.json:**
```json
{
  "version": "2.3",
  "lifecycle_mode": "{lifecycle_mode}",
  "pid": null,
  "last_used": null,
  "entity_cache": {}
}
```

**discovery.json:**
```json
{
  "version": "2.3",
  "discovered_at": "{timestamp}",
  "tools": [],
  "resolver_tools": {}
}
```

---

## Notes

- MCP gateways never spawn processes (Claude owns lifecycle)
- Fallback to CLI/HTTP only if configured and MCP fails
- Entity cache uses 24h TTL by default
- Lock TTL is 60 seconds
