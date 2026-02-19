---
name: {service}-gateway
description: {action_verb} via {Service} CLI. Use when user says "{trigger1}", "{trigger2}", "{trigger3}". Zero overhead wrapper. NOT for {non_triggers}.
allowed-tools: Read, Bash, AskUserQuestion
---

# {Service} Gateway

Lightweight gateway for {Service} CLI tool. CLI executes only when you invoke this skill.

---

## Configuration

```yaml
service_name: {service}
gateway_type: cli
lifecycle_mode: gateway_managed
cli_path: {cli_path}
cli_command: node cli.js
requires_confirmation: [{requires_confirmation}]
dry_run_supported: {dry_run_supported}
```

---

## CLI Location

```
{cli_path}
```

**Before first use:** Read HELP.md for available commands.

---

## Available Commands

| Operation | Command | Arguments | Destructive? |
|-----------|---------|-----------|--------------|
| {operation_1} | `node cli.js {cmd1}` | `{args}` | {yes_no} |
| {operation_2} | `node cli.js {cmd2}` | `{args}` | {yes_no} |

---

## Collision Notes

**Triggers ONLY when user says:** {specific_triggers}

**Does NOT trigger for:** {non_triggers}

---

## Workflow

### Step 1: Parse User Intent

Extract from user request:
- **Action:** Which command to run
- **Arguments:** Values to pass to CLI

### Step 2: Validate Dependencies

```bash
# Check node available
command -v node || exit 1  # E006

# Check CLI path exists
test -d "{cli_path}" || exit 1  # E008

# Check cli.js exists
test -f "{cli_path}/cli.js" || exit 1  # E008

# Check executable (macOS quarantine)
xattr "{cli_path}/cli.js" 2>/dev/null | grep -q quarantine && echo "E007: Run xattr -cr {cli_path}"
```

### Step 3: Execute CLI Command

**For non-destructive operations:**
```bash
cd "{cli_path}" && node cli.js {command} {arguments}
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

| Error | Code | Response |
|-------|------|----------|
| Node not found | E006 | "Install Node.js: `brew install node`" |
| CLI path not found | E008 | "CLI not installed at {cli_path}" |
| cli.js not found | E008 | "cli.js missing from {cli_path}" |
| Permission denied | E007 | "Run: `chmod +x {cli_path}/cli.js`" |
| Quarantine flag | E007 | "Run: `xattr -cr {cli_path}`" |
| Command failed | - | Show CLI error + suggest correct usage |
| Auth error | E003 | "Check credentials in CLI config" |

---

## State Files

**state.json:**
```json
{
  "version": "2.3",
  "lifecycle_mode": "gateway_managed",
  "pid": null,
  "last_used": null,
  "entity_cache": {}
}
```

---

## Notes

- No persistent process - CLI runs and exits
- Zero memory overhead when not in use
- Always validate dependencies before execution
- Destructive operations require confirmation
- Read HELP.md for command reference
