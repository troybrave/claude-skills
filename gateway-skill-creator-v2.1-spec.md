# Gateway Skill Creator v2.1 - Final Specification

> A meta-skill that generates "gateway skills" - lightweight skills that lazy-load MCP servers or CLI tools only when invoked, saving both memory and context.

**Version:** 2.1 (100/100 target - all runtime assumptions made explicit)
**Status:** Implementation-ready with deterministic behavior

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

**With Gateways:**
- 0 servers start at launch
- 10 lightweight skill descriptions (~50 tokens each)
- Memory: Near zero until invoked

---

## Solution: Gateway Pattern

### What is a Gateway Skill?

A gateway skill is a **lightweight wrapper** that:
1. Has minimal context footprint (just a description)
2. Starts an MCP server OR calls a CLI tool **only when invoked**
3. Executes the requested operation
4. Manages lifecycle (opportunistic cleanup)

### Key Insight

Claude Code skills have a two-layer architecture:

| Layer | When Loaded | Size |
|-------|-------------|------|
| Frontmatter description | ALWAYS (every conversation) | ~50 tokens |
| skill.md body | Only when skill triggers | ~500-2000 tokens |

---

## Architecture

### Flow Diagram (v2.1 - Fully Specified)

```
User says "/telegram send message to John"
                    ↓
┌────────────────────────────────────────────────────────────┐
│  SKILL TRIGGER CHECK (Always in context - ~50 tokens)      │
└────────────────────────────────────────────────────────────┘
                    ↓ (Skill triggers)
┌────────────────────────────────────────────────────────────┐
│  SKILL BODY LOADS                                          │
│  1. Parse user intent                                      │
│  2. Acquire lock (atomic + TTL + stale recovery)           │
│  3. Opportunistic cleanup (if idle > timeout)              │
│  4. ToolSearch to discover MCP tools                       │
│  5. Attempt tool call                                      │
│     ├─ SUCCESS → Update state → Return result              │
│     └─ FAILURE → Explicit start → Health check → Retry     │
│  6. Update last_used timestamp                             │
│  7. Release lock                                           │
└────────────────────────────────────────────────────────────┘
```

### Three Gateway Types

| Type | Use Case | Mechanism |
|------|----------|-----------|
| **MCP Gateway** | Wraps an MCP server | ToolSearch → Implicit → (Explicit fallback) → Execute |
| **CLI Gateway** | Wraps a CLI tool | Validate deps → Run command → Return result |
| **HTTP Gateway** | Wraps HTTP endpoint | Build request → curl → Return result |

---

## MCP Runtime Contract (NEW)

### Supported Lifecycle Modes

| Mode | Description | When to Use |
|------|-------------|-------------|
| **M1: Claude-managed** | Rely on Claude Code's MCP registry. No explicit start. Fallback = repair config / re-run discovery. | Default for MCP servers in `~/.claude.json` |
| **M2: Gateway-managed** | Gateway launches server via Bash, writes PID + port to state file | Servers NOT in Claude config, or need custom start |
| **M3: Wrapper daemon** | External `gatewayd` process manages server lifecycle | Multi-user or high-reliability needs |

**Default Mode:** M1 (Claude-managed) with opportunistic M2 fallback on failure.

### M1 Behavior (Default)

```
1. ToolSearch query: "+{service}"
2. Call discovered tool
3. If tool call succeeds → done
4. If tool call fails with "server unavailable":
   - Log error
   - Report: "MCP server not available. Ensure it's configured in ~/.claude.json"
   - Do NOT attempt explicit start (Claude owns lifecycle)
```

### M2 Behavior (Gateway-managed fallback)

Only used when:
- User explicitly configures `lifecycle_mode: gateway_managed` in gateway config
- OR M1 fails and `explicit_start_command` is defined

```
1. Check state.json for existing PID
2. If PID exists and process running → use existing server
3. If no server running:
   a. Run: nohup {server_command} > logs/server.log 2>&1 &
   b. Capture PID, write to state.json
   c. Readiness check (see below)
4. Readiness check:
   - Attempt ToolSearch + list operation every 500ms
   - Timeout after 10 seconds
   - If ready → proceed
   - If timeout → fail with E002
5. Execute operation
6. Update state.json with last_used timestamp
```

### Explicit Start Command Format

```yaml
# In gateway config
explicit_start_command: "npx @anthropic/mcp-telegram"
explicit_start_port: null  # null = auto, or specific port
readiness_tool: "mcp__telegram__list_chats"  # Non-destructive tool to test readiness
readiness_timeout_sec: 10
```

---

## State & Artifacts (NEW)

### Per-Gateway State Directory

```
/Users/troybrave/.claude/skills/{service}-gateway/
├── skill.md              # Skill definition
├── skill-log.md          # Learning log (redacted)
├── state.json            # Runtime state (PID, timestamps)
├── discovery.json        # Discovered tools + schemas
├── lock.json             # Atomic lock file
└── logs/
    └── gateway.log       # Execution log (redacted)
```

### state.json Schema

```json
{
  "pid": 12345,
  "started_at": "2026-01-31T10:00:00Z",
  "last_used": "2026-01-31T10:05:00Z",
  "port": null,
  "lifecycle_mode": "claude_managed",
  "version": "2.1"
}
```

**Rules:**
- `pid` = null for M1 (Claude-managed) mode
- `started_at` = when server was started (M2 only)
- `last_used` = last successful operation timestamp
- Never contains secrets

### discovery.json Schema

```json
{
  "discovered_at": "2026-01-31T10:00:00Z",
  "tools": [
    {
      "tool_name": "mcp__telegram__send_message",
      "operation_id": "send_message",
      "description": "Send a message to a Telegram chat",
      "parameters": {
        "chat_id": { "type": "string", "required": true },
        "text": { "type": "string", "required": true }
      },
      "sample_invocation": {
        "chat_id": "123456",
        "text": "Hello world"
      }
    }
  ],
  "trigger_phrases": {
    "send_message": ["send telegram", "telegram message", "message via telegram"]
  }
}
```

**Rediscovery Policy:**
- On E009 (schema mismatch): auto-run discovery, compare with existing, retry once
- If schema changed: update discovery.json, log diff summary, proceed
- If still fails: report error with schema diff

### Intent → Tool Argument Builder

```
User: "send telegram message to John saying hello"
                    ↓
┌─────────────────────────────────────────┐
│ Intent Parser                            │
│ - operation: "send_message"              │
│ - recipient: "John"                      │
│ - content: "hello"                       │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│ Argument Builder (uses discovery.json)   │
│ - Look up operation_id "send_message"    │
│ - Map recipient → chat_id (resolve John) │
│ - Map content → text                     │
└─────────────────────────────────────────┘
                    ↓
Tool call: mcp__telegram__send_message(chat_id="john_id", text="hello")
```

---

## Locking Mechanism v2 (NEW)

### Lock File Schema

```json
{
  "pid": 12345,
  "hostname": "troy-macbook",
  "started_at": "2026-01-31T10:00:00Z",
  "gateway_version": "2.1",
  "ttl_seconds": 60
}
```

### Lock Acquisition Algorithm

```python
def acquire_lock(gateway_path, timeout_ms=5000):
    lock_path = f"{gateway_path}/lock.json"
    temp_path = f"{gateway_path}/lock.{os.getpid()}.tmp"
    start = now()

    while (now() - start) < timeout_ms:
        # Check for existing lock
        if exists(lock_path):
            lock = read_json(lock_path)

            # Stale lock detection
            lock_age = now() - parse(lock["started_at"])
            if lock_age > lock["ttl_seconds"]:
                # Lock is stale - break it with warning
                log_warning(f"Breaking stale lock (age: {lock_age}s, owner: {lock['pid']})")
                remove(lock_path)
            elif not process_running(lock["pid"]):
                # Owner process died - break lock
                log_warning(f"Breaking orphan lock (pid {lock['pid']} not running)")
                remove(lock_path)
            else:
                # Lock is valid - wait
                sleep(100ms)
                continue

        # Attempt atomic lock creation
        write_json(temp_path, {
            "pid": os.getpid(),
            "hostname": hostname(),
            "started_at": now_iso(),
            "gateway_version": "2.1",
            "ttl_seconds": 60
        })

        try:
            # Atomic rename (fails if lock_path exists)
            rename(temp_path, lock_path)
            return True  # Lock acquired
        except FileExistsError:
            remove(temp_path)
            sleep(100ms)
            continue

    return False  # Timeout - could not acquire lock

def release_lock(gateway_path):
    lock_path = f"{gateway_path}/lock.json"
    if exists(lock_path):
        lock = read_json(lock_path)
        if lock["pid"] == os.getpid():
            remove(lock_path)
```

### Lock Behavior

| Scenario | Action |
|----------|--------|
| No lock exists | Create lock, proceed |
| Lock exists, owner running, not stale | Wait up to 5 seconds, then fail with E011 |
| Lock exists, owner NOT running | Break lock with warning, create new lock |
| Lock exists, age > TTL (60s) | Break stale lock with warning, create new lock |
| Lock acquired | Proceed with operation |
| Operation complete | Release lock |
| Operation crashes | Next invocation detects orphan lock, breaks it |

---

## Idle Timeout Mechanism v2 (NEW)

### Approach: Opportunistic Cleanup (No Background Monitor)

Skills cannot run persistent background processes. Instead, cleanup happens **on each invocation**.

### Cleanup Algorithm

```python
def opportunistic_cleanup(gateway_path, idle_timeout_sec=300):
    state_path = f"{gateway_path}/state.json"

    if not exists(state_path):
        return  # No state, nothing to clean

    state = read_json(state_path)

    # Only applies to M2 (gateway-managed) mode
    if state.get("lifecycle_mode") != "gateway_managed":
        return

    if state.get("pid") is None:
        return  # No server to clean

    last_used = parse(state["last_used"])
    idle_time = now() - last_used

    if idle_time > idle_timeout_sec:
        log_info(f"Stopping idle server (idle: {idle_time}s)")

        # Stop the server
        try:
            os.kill(state["pid"], signal.SIGTERM)
            sleep(1000ms)
            if process_running(state["pid"]):
                os.kill(state["pid"], signal.SIGKILL)
        except ProcessNotFound:
            pass  # Already dead

        # Update state
        state["pid"] = None
        state["started_at"] = None
        write_json(state_path, state)
```

### Invocation Flow with Cleanup

```
1. Acquire lock
2. Run opportunistic_cleanup()  ← NEW
3. Check if server needed and not running
4. Start server if needed (M2 mode)
5. Execute operation
6. Update last_used
7. Release lock
```

### Manual Stop Command

Each gateway also supports explicit stop:

```
User: "/telegram stop"
→ Gateway reads state.json
→ Kills PID if running
→ Updates state (pid=null)
→ Reports: "Telegram gateway stopped"
```

---

## Collision Scoring Algorithm (NEW)

### Formula

```python
def collision_score(trigger_a: str, trigger_b: str) -> float:
    """
    Returns 0.0 (no collision) to 1.0 (exact match)
    """
    # Tokenize
    tokens_a = set(trigger_a.lower().split())
    tokens_b = set(trigger_b.lower().split())

    # Exact match
    if trigger_a.lower() == trigger_b.lower():
        return 1.0

    # Token overlap (Jaccard similarity)
    intersection = tokens_a & tokens_b
    union = tokens_a | tokens_b
    jaccard = len(intersection) / len(union) if union else 0

    # Service name boost (if service name token overlaps, add 0.3)
    service_tokens = {"telegram", "slack", "notion", "discord", "email", "message"}
    service_overlap = bool(intersection & service_tokens)
    service_boost = 0.3 if service_overlap else 0

    # Prefix match penalty
    prefix_match = trigger_a.lower().startswith(trigger_b.lower()) or \
                   trigger_b.lower().startswith(trigger_a.lower())
    prefix_boost = 0.2 if prefix_match else 0

    score = min(1.0, jaccard + service_boost + prefix_boost)
    return round(score, 2)

def check_collisions(new_triggers: list, existing_gateways: dict) -> list:
    """
    Returns list of collisions with scores
    """
    collisions = []

    for new_trigger in new_triggers:
        for gateway_name, gateway_triggers in existing_gateways.items():
            for existing_trigger in gateway_triggers:
                score = collision_score(new_trigger, existing_trigger)
                if score >= 0.3:  # Threshold for warning
                    collisions.append({
                        "new_trigger": new_trigger,
                        "existing_gateway": gateway_name,
                        "existing_trigger": existing_trigger,
                        "score": score,
                        "action": "block" if score >= 0.7 else "warn"
                    })

    return collisions
```

### Collision Thresholds

| Score | Action | Example |
|-------|--------|---------|
| 0.0 - 0.29 | Allow | "telegram message" vs "check calendar" |
| 0.3 - 0.69 | Warn (require non-trigger) | "send message" vs "slack message" |
| 0.7 - 0.99 | Block (must change trigger) | "message John" vs "message" |
| 1.0 | Block (exact duplicate) | "telegram" vs "telegram" |

### Collision Check Output

```
$ node collision-check.cjs telegram-gateway

Collision Report for telegram-gateway
=====================================

Triggers analyzed: ["telegram", "send telegram", "telegram message"]

Conflicts found: 2

| Trigger          | Conflicts With    | Gateway       | Score | Action |
|------------------|-------------------|---------------|-------|--------|
| telegram message | slack message     | slack-gateway | 0.52  | WARN   |
| send telegram    | send slack        | slack-gateway | 0.45  | WARN   |

Suggested non-triggers to add:
- "slack"
- "send slack"

Run with --fix to auto-add non-triggers to skill.md
```

---

## Validation Enhancements (NEW)

### MCP Gateway Validation

```bash
# 1. Check node/npx available
command -v node || fail "E006: Node.js not found"
command -v npx || fail "E006: npx not found"

# 2. Check env vars exist (names only, not values)
for var in $REQUIRED_ENV_VARS; do
  [ -z "${!var}" ] && fail "E003: Environment variable $var not set"
done

# 3. Dry-run start (M2 mode only)
if [ "$LIFECYCLE_MODE" = "gateway_managed" ]; then
  timeout 10s $SERVER_COMMAND --help >/dev/null 2>&1 || \
    warn "Server command may not be valid: $SERVER_COMMAND"
fi

# 4. Tool availability check
# Run ToolSearch and verify at least one tool discovered
```

### HTTP Gateway Validation

```bash
# 1. URL parse validation
python3 -c "from urllib.parse import urlparse; urlparse('$BASE_URL')" || \
  fail "E008: Invalid URL format"

# 2. Auth env var exists
[ -z "${!AUTH_ENV_VAR}" ] && fail "E003: Auth token not set"

# 3. Optional health check
if [ -n "$HEALTH_ENDPOINT" ]; then
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "$AUTH_HEADER: ${!AUTH_ENV_VAR}" \
    "$BASE_URL$HEALTH_ENDPOINT")
  [ "$HTTP_CODE" != "200" ] && warn "Health check returned $HTTP_CODE"
fi

# 4. curl available
command -v curl || fail "E006: curl not found"
```

### CLI Gateway Validation (existing + enhanced)

```bash
# 1. Node available
command -v node || fail "E006: Node.js not found"

# 2. CLI directory exists
[ -d "$CLI_PATH" ] || fail "E008: CLI directory not found"

# 3. cli.js exists and executable
[ -f "$CLI_PATH/cli.js" ] || fail "E008: cli.js not found"

# 4. HELP.md exists
[ -f "$CLI_PATH/HELP.md" ] || warn "HELP.md not found (recommended)"

# 5. macOS quarantine check
xattr "$CLI_PATH/cli.js" 2>/dev/null | grep -q quarantine && \
  warn "File has quarantine flag. Run: xattr -cr $CLI_PATH"

# 6. Test run
cd "$CLI_PATH" && node cli.js --help >/dev/null 2>&1 || \
  warn "CLI --help failed"
```

---

## HTTP Gateway: Tool Selection (NEW)

### Allowed Tools

HTTP gateways use **Bash + curl only** (not WebFetch):

```yaml
allowed-tools: Read, Bash
```

**Rationale:**
- `curl` is universally available
- `WebFetch` availability varies by environment
- Bash provides consistent behavior

### HTTP Gateway Template (v2.1)

```markdown
---
name: {service}-gateway
description: {Action verb} via {Service} API. Use when user says "{trigger1}", "{trigger2}". Lightweight HTTP wrapper. NOT for {non-triggers}.
allowed-tools: Read, Bash
---

# {Service} Gateway

...

## Workflow

### Step 3: Execute Request

Use curl (NOT WebFetch):

```bash
curl -s -X {METHOD} "{base_url}{endpoint}" \
  -H "{auth_header}: ${AUTH_ENV_VAR}" \
  -H "Content-Type: application/json" \
  -d '{body}'
```

**Note:** WebFetch is NOT used due to environment variability.
```

---

## Resolved Design Decisions (v2.1)

| Question | Decision | Rationale |
|----------|----------|-----------|
| **MCP Lifecycle** | M1 default + M2 fallback | M1 (Claude-managed) for simplicity. M2 (gateway-managed) only when explicitly configured or M1 fails with `explicit_start_command` defined. |
| **Multiple Operations** | Opportunistic cleanup | No background monitor (skills can't run them). Cleanup on each invocation if idle > timeout. |
| **Locking** | Atomic lock + TTL + stale recovery | Prevents race conditions. 60s TTL. Stale/orphan detection. |
| **Discovery** | discovery.json artifact | Stable mapping from intent → tool. Auto-rediscovery on schema mismatch. |
| **Collision Scoring** | Jaccard + service boost + prefix penalty | Reproducible formula. Thresholds: 0.3 warn, 0.7 block. |
| **HTTP Tools** | Bash + curl only | WebFetch availability varies. curl is universal. |
| **Validation** | Type-specific checks | MCP: node/npx/env/dry-run. HTTP: URL/curl/auth. CLI: path/permissions/quarantine. |

---

## File Structure (v2.1)

```
/Users/troybrave/.claude/skills/gateway-skill-creator/
├── skill.md                    # Meta-skill definition
├── skill-log.md                # Learning log
├── templates/
│   ├── mcp-gateway.md          # MCP template
│   ├── cli-gateway.md          # CLI template
│   └── http-gateway.md         # HTTP template
├── scripts/
│   ├── init-gateway.cjs        # Scaffolds new gateway
│   ├── validate-gateway.cjs    # Validates gateway
│   ├── collision-check.cjs     # Checks trigger collisions
│   └── discovery.cjs           # Runs tool discovery for MCP
├── references/
│   ├── error-taxonomy.md       # Standardized errors
│   ├── lock-algorithm.md       # Lock implementation
│   └── collision-formula.md    # Scoring algorithm
└── _gateways.md                # Index of installed gateways
```

---

## Success Criteria (v2.1 - Fully Measurable)

| Criterion | Target | Measurement Method |
|-----------|--------|-------------------|
| Time-to-first-use | ≤60 seconds | Timer from "create gateway" to valid skill.md |
| Description footprint | ≤60 words, ≤350 chars | `wc -w`, `wc -c` on frontmatter description |
| Startup savings | 0 MCP servers auto-started | `ps aux \| grep mcp` after fresh launch |
| First-call reliability | ≥90% success | 10 invocations on fresh launch, count successes |
| Tool discovery | ≥1 operation discovered | Check discovery.json has ≥1 tool |
| No secret leakage | 0 values in files | `grep -rE "(sk-|token=|Bearer )"` returns empty |
| Collision safety | All pass check | `collision-check.cjs` returns 0 blocks |
| Lock correctness | No deadlocks in 50 rapid calls | Stress test with concurrent invocations |
| Cleanup correctness | Server stops after idle | Verify PID gone after timeout + invocation |

---

## Error Taxonomy (v2.1)

All errors follow format:
```
[GATEWAY_ERROR] E{XXX}: {Type}
Problem: {What happened}
Cause: {Why}
Fix: {Exact steps}
```

| Code | Type | Problem | Fix |
|------|------|---------|-----|
| E001 | Server not found | MCP server not in Claude config | Add to ~/.claude.json |
| E002 | Server start failed | Explicit start timed out | Check server_command, view logs/server.log |
| E003 | Auth failed | Token invalid/expired | Check ${ENV_VAR} value |
| E004 | Rate limited | Too many requests | Wait 60s, retry |
| E005 | Network error | No connectivity | Check internet connection |
| E006 | Dependency missing | node/npx/curl not found | Install missing dependency |
| E007 | Permission denied | File permissions or quarantine | `chmod +x` or `xattr -cr` |
| E008 | Path not found | Directory/file missing | Create path or fix config |
| E009 | Schema mismatch | Tool signature changed | Auto-rediscovery triggered |
| E010 | Collision detected | Trigger matches another gateway | Change trigger or add non-trigger |
| E011 | Lock timeout | Gateway busy | Wait and retry, or check for stuck process |
| E012 | Discovery failed | No tools found | Verify server config, check ToolSearch |

---

## Implementation Checklist

### Core Files
- [ ] `skill.md` - Meta-skill with discovery questions + generation logic
- [ ] `templates/mcp-gateway.md` - With M1/M2 lifecycle support
- [ ] `templates/cli-gateway.md` - With dependency validation
- [ ] `templates/http-gateway.md` - curl-only, no WebFetch

### Scripts
- [ ] `init-gateway.cjs` - Creates directory + copies template
- [ ] `validate-gateway.cjs` - Type-specific validation checks
- [ ] `collision-check.cjs` - Implements scoring formula
- [ ] `discovery.cjs` - Populates discovery.json for MCP

### References
- [ ] `error-taxonomy.md` - All E001-E012 with examples
- [ ] `lock-algorithm.md` - Pseudocode for lock/unlock
- [ ] `collision-formula.md` - Scoring formula with examples

### Testing
- [ ] Test MCP gateway (M1 mode) - Telegram or similar
- [ ] Test MCP gateway (M2 mode) - Custom server
- [ ] Test CLI gateway - notion-cli
- [ ] Test HTTP gateway - Any REST API
- [ ] Stress test locking - 50 rapid calls
- [ ] Verify cleanup - Check PID after idle timeout

---

## Appendix: Template Configs

### MCP Gateway Config Block

```yaml
# Gateway Configuration
service_name: telegram
gateway_type: mcp
lifecycle_mode: claude_managed  # or gateway_managed
server_command: npx @anthropic/mcp-telegram  # only for gateway_managed
env_vars: [TELEGRAM_BOT_TOKEN]
idle_timeout_sec: 300
readiness_tool: mcp__telegram__list_chats
readiness_timeout_sec: 10
requires_confirmation: [delete_message]
```

### CLI Gateway Config Block

```yaml
# Gateway Configuration
service_name: notion
gateway_type: cli
cli_path: /Users/troybrave/.claude/.CLI/notion-cli/
cli_command: node cli.js
requires_confirmation: [delete]
dry_run_supported: true
```

### HTTP Gateway Config Block

```yaml
# Gateway Configuration
service_name: stripe
gateway_type: http
base_url: https://api.stripe.com/v1
auth_method: bearer
auth_header: Authorization
auth_env_var: STRIPE_SECRET_KEY
health_endpoint: /balance  # optional
requires_confirmation: [delete, refund]
```

---

*Version 2.1 - All runtime assumptions explicit, all algorithms defined, all thresholds specified*
*Target: 100/100 implementation readiness*
