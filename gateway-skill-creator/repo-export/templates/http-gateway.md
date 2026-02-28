---
name: {service}-gateway
description: {action_verb} via {Service} API. Use when user says "{trigger1}", "{trigger2}", "{trigger3}". Lightweight HTTP wrapper. NOT for {non_triggers}.
allowed-tools: Read, Bash, AskUserQuestion
---

# {Service} Gateway

Lightweight gateway for {Service} HTTP API. Requests made only when you invoke this skill.

---

## Configuration

```yaml
service_name: {service}
gateway_type: http
lifecycle_mode: gateway_managed
base_url: {base_url}
auth_method: {auth_method}
auth_header: {auth_header}
auth_env_var: {auth_env_var}
health_endpoint: {health_endpoint}
requires_confirmation: [{requires_confirmation}]
```

---

## Environment Requirements

| Variable | Purpose |
|----------|---------|
| `{auth_env_var}` | API authentication token |

**Security:** Never echo, log, or write token VALUES. Only reference by name.

---

## Available Endpoints

| Operation | Method | Endpoint | Parameters |
|-----------|--------|----------|------------|
| {operation_1} | {method} | `{endpoint1}` | {params} |
| {operation_2} | {method} | `{endpoint2}` | {params} |

---

## Collision Notes

**Triggers ONLY when user says:** {specific_triggers}

**Does NOT trigger for:** {non_triggers}

---

## Workflow

### Step 1: Parse User Intent

Extract from user request:
- **Operation:** Which endpoint to call
- **Parameters:** Query params, request body, etc.

### Step 2: Validate Dependencies

```bash
# Check curl available
command -v curl || exit 1  # E006

# Validate URL format
python3 -c "from urllib.parse import urlparse; urlparse('{base_url}')" || exit 1  # E008

# Check auth env var exists (name only, not value)
[ -n "${{{auth_env_var}}}" ] || exit 1  # E003
```

### Step 3: Optional Health Check

```bash
# If health_endpoint is configured
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "{auth_header}: ${{{auth_env_var}}}" \
  "{base_url}{health_endpoint}")

[ "$HTTP_CODE" != "200" ] && echo "Warning: Health check returned $HTTP_CODE"
```

### Step 4: Execute Request

**Use curl (NOT WebFetch):**

```bash
# GET request
curl -s -X GET "{base_url}{endpoint}" \
  -H "{auth_header}: ${{{auth_env_var}}}" \
  -H "Content-Type: application/json"

# POST request
curl -s -X POST "{base_url}{endpoint}" \
  -H "{auth_header}: ${{{auth_env_var}}}" \
  -H "Content-Type: application/json" \
  -d '{body}'
```

**For destructive operations:**
1. Ask user to confirm before executing
2. Execute request

### Step 5: Return Result

Parse JSON response and format for user:
- Confirm action completed
- Show relevant response data
- Handle error status codes

---

## Error Handling

| HTTP Code | Error | Response |
|-----------|-------|----------|
| 401 | E003 | "Authentication failed. Check ${auth_env_var}" |
| 403 | - | "Access denied. Token may lack permissions." |
| 404 | E008 | "Endpoint not found. Check API path." |
| 429 | E004 | "Rate limited. Wait and retry." |
| 500 | - | "{Service} server error. Try again later." |
| Network | E005 | "Couldn't reach {Service}. Check connection." |

| Local Error | Code | Response |
|-------------|------|----------|
| curl not found | E006 | "Install curl or check PATH" |
| Invalid URL | E008 | "Check base_url configuration" |
| Auth var not set | E003 | "Set ${auth_env_var} environment variable" |

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

- Uses curl only (NOT WebFetch) for consistency
- No persistent connection - request/response only
- Zero memory overhead when not in use
- Destructive operations require confirmation
- Auth tokens never logged or written to files
