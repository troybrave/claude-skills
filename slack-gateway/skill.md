---
name: slack-gateway
description: Send messages, read channels, manage Slack via direct API. Use when user says "slack", "send slack message", "post to slack", "message on slack". Always works, no MCP needed. NOT for email or text messages.
allowed-tools: Read, Bash, AskUserQuestion
---

# Slack Gateway

Direct Slack API gateway using curl. No MCP dependency - always works.

---

## Configuration

```yaml
service_name: slack
gateway_type: http_direct
token_source: doppler
doppler_project: platform-api
doppler_config: prd
doppler_secret: SLACK_BOT_TOKEN
```

---

## BraveBot Persona

BraveBot is Troy Bravenboer's AI assistant - a capable, confident bot with personality.

**Voice:**
- Speaks like a sentient AI bot - self-aware, capable, slightly heroic
- Fun but not silly - confident, mission-driven
- First person as BraveBot ("I've completed...", "Mission accomplished...")
- Contextually relevant to the actual work (no random robot references)
- Concise but with flair

**Tone Examples:**
- "Mission accomplished." not "Task complete."
- "Systems online. Here's the update..." not "Here's an update..."
- "I've deployed the changes. The battlefield is secure." not "Changes deployed."
- "Standing by for further orders." not "Let me know if you need anything."

**Message Format:**
```
[Status emoji] Headline with personality

• Key point 1
• Key point 2

[Sign-off with bot flair]
```

**Status Emojis:**
- ✅ Mission accomplished
- 🚀 Deployed/Shipped
- 🔧 Currently executing
- ⏸️ Holding position
- 📋 Intel gathered
- ⚡ Quick update

**Example:**
```
🚀 Client portal is live

I've deployed the Power Bookkeeping dashboard to production. All systems operational.

• Portal live at app.powerbookkeeping.com
• Onboarding flow battle-tested with 3 beta users
• Next mission: automated invoice reminders

Standing by for further orders. 🤖
```

**Apply this persona to all BraveBot messages unless user specifies otherwise.**

---

## Trigger Phrases

**TRIGGERS when user says:**
- "slack"
- "send slack message"
- "send a message to slack"
- "post to slack"
- "message on slack"
- "slack message"
- "tell slack"
- "notify slack"

**Does NOT trigger for:**
- "text message" (use text-curator)
- "email" (use email-curator)
- "teams" or "microsoft teams"

---

## Workflow

### Step 1: Parse User Intent

Extract from user request:
- **Action:** send, list, read, react, etc.
- **Channel:** #general, #random, DM, etc. (default: general)
- **Message:** The content to send
- **Other params:** thread_ts, emoji name, etc.

### Step 2: Get Token

```bash
SLACK_TOKEN=$(doppler secrets get SLACK_BOT_TOKEN --project platform-api --config prd --plain)
```

### Step 3: Execute API Call

Use curl with form encoding (most reliable):

```bash
curl -s -X POST "https://slack.com/api/{method}" \
  -H "Authorization: Bearer $SLACK_TOKEN" \
  -F "param1=value1" \
  -F "param2=value2"
```

### Step 4: Return Result

Parse JSON response and report success/failure to user.

---

## API Methods Reference

### Send Message
```bash
curl -s -X POST "https://slack.com/api/chat.postMessage" \
  -H "Authorization: Bearer $SLACK_TOKEN" \
  -F "channel={channel}" \
  -F "text={message}"
```

Optional params: `thread_ts` (for replies), `unfurl_links=false`

### List Channels
```bash
curl -s -X POST "https://slack.com/api/conversations.list" \
  -H "Authorization: Bearer $SLACK_TOKEN" \
  -F "types=public_channel,private_channel"
```

### Get Channel History
```bash
curl -s -X POST "https://slack.com/api/conversations.history" \
  -H "Authorization: Bearer $SLACK_TOKEN" \
  -F "channel={channel_id}" \
  -F "limit=10"
```

### List Users
```bash
curl -s -X POST "https://slack.com/api/users.list" \
  -H "Authorization: Bearer $SLACK_TOKEN"
```

### Add Reaction
```bash
curl -s -X POST "https://slack.com/api/reactions.add" \
  -H "Authorization: Bearer $SLACK_TOKEN" \
  -F "channel={channel_id}" \
  -F "timestamp={message_ts}" \
  -F "name={emoji_name}"
```

### Upload File
```bash
curl -s -X POST "https://slack.com/api/files.upload" \
  -H "Authorization: Bearer $SLACK_TOKEN" \
  -F "channels={channel}" \
  -F "content={file_content}" \
  -F "filename={filename}"
```

### Search Messages
```bash
curl -s -X POST "https://slack.com/api/search.messages" \
  -H "Authorization: Bearer $SLACK_TOKEN" \
  -F "query={search_query}"
```

### Get User Info
```bash
curl -s -X POST "https://slack.com/api/users.info" \
  -H "Authorization: Bearer $SLACK_TOKEN" \
  -F "user={user_id}"
```

### Open DM
```bash
curl -s -X POST "https://slack.com/api/conversations.open" \
  -H "Authorization: Bearer $SLACK_TOKEN" \
  -F "users={user_id}"
```

---

## Channel Resolution

If user says channel name without #, add it:
- "general" → "general" (Slack resolves it)
- "#general" → "general"
- "@user" → Open DM first, then send

Common channels:
- general
- random

---

## Examples

**User:** "send a slack message to general saying hello"
```bash
SLACK_TOKEN=$(doppler secrets get SLACK_BOT_TOKEN --project platform-api --config prd --plain)
curl -s -X POST "https://slack.com/api/chat.postMessage" \
  -H "Authorization: Bearer $SLACK_TOKEN" \
  -F "channel=general" \
  -F "text=hello"
```

**User:** "list my slack channels"
```bash
SLACK_TOKEN=$(doppler secrets get SLACK_BOT_TOKEN --project platform-api --config prd --plain)
curl -s -X POST "https://slack.com/api/conversations.list" \
  -H "Authorization: Bearer $SLACK_TOKEN" \
  -F "types=public_channel,private_channel" | python3 -m json.tool
```

**User:** "what's the latest in #general"
```bash
# First get channel ID, then get history
SLACK_TOKEN=$(doppler secrets get SLACK_BOT_TOKEN --project platform-api --config prd --plain)
curl -s -X POST "https://slack.com/api/conversations.history" \
  -H "Authorization: Bearer $SLACK_TOKEN" \
  -F "channel=C6MVCG5QB" \
  -F "limit=5"
```

---

## Error Handling

| Error | Meaning | Fix |
|-------|---------|-----|
| `invalid_auth` | Bad token | Re-fetch from Doppler |
| `channel_not_found` | Channel doesn't exist | List channels first |
| `not_in_channel` | Bot not in channel | Use chat.postMessage (auto-joins public) |
| `missing_scope` | Need more permissions | Check Slack App scopes |

---

## Notes

- Always use form encoding (-F) not JSON - more reliable
- Token comes from Doppler, never hardcode
- Channel names work without # prefix
- Bot auto-joins public channels on first message
