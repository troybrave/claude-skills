# ENDLESS WINNING — MARKDOWN → PRODUCTION WEBSITE PIPELINE

## Elite Production Specification (100/100, Truth-Locked)

---

## ROLE & OPERATING MODE

You are a senior full-stack engineer building a CLI tool that converts a local Markdown document into a live, HTTPS-secured website on GitHub Pages with DNS managed via Namecheap.

This CLI follows the established pattern at `/Users/troybrave/.claude/.CLI/` and integrates with existing tooling.

You must not assume ideal conditions.
You must not lie about platform capabilities.
Your output must be production-ready, not aspirational.

---

## OBJECTIVE (HARD CONTRACT)

Build `site-cli` that:

1. Ingests a local Markdown file from:
   ```
   /Users/troybrave/Documents/Projects/Full Vault/Business/04 - Endless Winning Agency/Sub-Accounts/02 - Prospective/Living Water/60-Day-Marketing-System.md
   ```

2. Generates a static website with:
   - Clean typography
   - Deterministic heading anchors (GitHub-style slugs)
   - Table of contents
   - Code highlighting (Shiki)
   - SEO metadata
   - Sitemap + canonical URLs

3. Deploys to GitHub Pages with custom apex domain: `https://endlesswinning.com`

4. Configures DNS via Namecheap API (safe, idempotent, non-destructive)

5. Enforces HTTPS

6. Requires zero manual UI interaction within the supported envelope

7. Can be re-run safely with no side effects when state is unchanged

---

## SUPPORTED OPERATING ENVELOPE

Full automation guaranteed when ALL conditions are true:

| Condition | Detection Method |
|-----------|------------------|
| GitHub account permits Pages API config | `gh api /repos/{owner}/{repo}/pages` returns 200 or 404 (not 403) |
| Repository is public OR Pages enabled for private | Check repo visibility + org settings |
| GitHub Actions Pages deployment allowed | Workflow file deploys successfully |
| Domain registered at Namecheap | `namecheap.domains.getList` includes domain |
| Namecheap API enabled + IP whitelisted | Test call to `namecheap.domains.dns.getHosts` succeeds |
| No production service depends on @ or www | User confirms via `--confirm-dns-safe` flag on first run |

**If any condition fails:**
- Exit immediately with code 1
- Print exact blocker
- Print exact remediation steps
- Never partially mutate

---

## REQUIRED ENVIRONMENT VARIABLES

| Variable | Required | Description | Validation |
|----------|----------|-------------|------------|
| `NAMECHEAP_API_USER` | Yes | Namecheap API username | Non-empty string |
| `NAMECHEAP_API_KEY` | Yes | Namecheap API key | Non-empty string |
| `NAMECHEAP_CLIENT_IP` | Yes | Whitelisted public IP | IPv4 format |
| `GITHUB_TOKEN` | Yes | Token with `repo` + `pages` scopes | `gh auth status` passes OR token validates |

**Validation behavior:**
- Missing/empty → exit 1 with: `Error: Missing required environment variable: {NAME}`
- Invalid format → exit 1 with: `Error: Invalid format for {NAME}: {value}`

Secrets are never logged. Masking required in all output.

---

## GITHUB PAGES APEX IPs (SOURCE OF TRUTH)

```typescript
const GITHUB_PAGES_IPS = [
  '185.199.108.153',
  '185.199.109.153',
  '185.199.110.153',
  '185.199.111.153',
] as const;
```

**Source:** https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site#configuring-an-apex-domain

**Update procedure:** Single constant update + test run.

---

## ARCHITECTURE

```
/Users/troybrave/.claude/.CLI/site-cli/
├── HELP.md                    # CLI documentation (required by convention)
├── package.json
├── tsconfig.json
├── .nvmrc                     # Node version pin
├── src/
│   ├── index.ts               # CLI entry point
│   ├── commands/
│   │   ├── init.ts            # Initialize repo + config
│   │   ├── deploy.ts          # Full pipeline
│   │   ├── dns.ts             # DNS operations
│   │   └── verify.ts          # Verification checks
│   ├── steps/
│   │   ├── sync-content.ts    # Copy + normalize markdown
│   │   ├── build-site.ts      # Astro build
│   │   ├── push-repo.ts       # Git operations
│   │   ├── configure-pages.ts # GitHub Pages API
│   │   ├── apply-dns.ts       # Namecheap API
│   │   └── verify-https.ts    # Cert verification
│   ├── lib/
│   │   ├── namecheap.ts       # Namecheap API client
│   │   ├── github.ts          # GitHub API helpers
│   │   ├── state.ts           # State management
│   │   └── lock.ts            # Concurrency lock
│   ├── constants.ts           # IPs, URLs, timeouts
│   └── types.ts               # Zod schemas + types
├── templates/
│   └── astro-site/            # Pre-configured Astro project
│       ├── astro.config.mjs
│       ├── package.json
│       ├── src/
│       │   ├── content/
│       │   │   └── source.md  # Placeholder (replaced at runtime)
│       │   ├── layouts/
│       │   │   └── Base.astro
│       │   └── pages/
│       │       └── index.astro
│       └── public/
│           └── CNAME
└── .site-cli/                 # Runtime state (gitignored in target repo)
    ├── state.json
    ├── state.json.bak
    ├── lock
    └── dns-backup-{timestamp}.json
```

**No monorepo. No workspace packages. Single CLI following existing convention.**

---

## CLI COMMANDS

```bash
# Initialize target repo
site-cli init --repo endlesswinning-site

# Full deploy pipeline
site-cli deploy --source "/path/to/markdown.md" --domain endlesswinning.com

# DNS only
site-cli dns apply --domain endlesswinning.com
site-cli dns verify --domain endlesswinning.com
site-cli dns rollback --backup .site-cli/dns-backup-2024-01-15.json

# Verification only
site-cli verify --domain endlesswinning.com
```

---

## STATE MACHINE

| Step | Precondition | Action | Success Criteria |
|------|--------------|--------|------------------|
| `content_synced` | Source file exists | Copy + normalize to template | Content hash matches |
| `site_built` | Content synced | `pnpm build` | `dist/` exists + non-empty |
| `repo_pushed` | Site built | Git commit + push | Remote HEAD matches local |
| `pages_configured` | Repo pushed | `gh api` configure Pages | API returns 200 |
| `dns_applied` | Pages configured | Namecheap API | Records match desired state |
| `dns_verified` | DNS applied | Authoritative NS query | All 4 IPs resolve |
| `https_verified` | DNS verified | GitHub Pages API | Cert status = active OR pending (warn) |

**State persistence:**
- Location: `.site-cli/state.json`
- Git status: Always gitignored
- Backup: `.site-cli/state.json.bak` created before each write
- Format:
  ```typescript
  interface State {
    steps: Record<StepName, 'pending' | 'success' | 'failed'>;
    contentHash: string;
    lastRun: string;
    lastError?: { step: string; message: string };
  }
  ```

---

## DNS APPLY SEMANTICS (TRUTHFUL)

**Reality:** Namecheap API does not support atomic transactions. Updates replace the full record set.

**Behavior:**

1. Fetch current full record set via `namecheap.domains.dns.getHosts`
2. Write backup to `.site-cli/dns-backup-{timestamp}.json`
3. Compute merged record set:
   - **PRESERVE** (never touch): MX, TXT (except `_github-pages-challenge-*`), CAA, SRV, any host not in `[@, www, _github-pages-challenge-*]`
   - **REPLACE**: `@` A records → GitHub Pages IPs, `www` CNAME → `{owner}.github.io`
4. Submit full record set via `namecheap.domains.dns.setHosts`
5. Verify via authoritative nameservers: `dns1.registrar-servers.com`, `dns2.registrar-servers.com`

**Inconsistency window:** 1-5 seconds between API call and propagation start. Acknowledged and acceptable.

**Rollback:**
```bash
site-cli dns rollback --backup .site-cli/dns-backup-2024-01-15.json
```

---

## RETRY POLICY

| Scenario | Retries | Backoff | Max Wait | Failure Behavior |
|----------|---------|---------|----------|------------------|
| Transient HTTP error (5xx, timeout) | 3 | 1s, 2s, 4s | 7s total | Exit 1 with error |
| Rate limit (429) | 5 | Respect `Retry-After` | 60s per request | Exit 1 if exceeded |
| DNS propagation check | 20 | 30s interval | 10 minutes | Exit 0 with WARN |
| GitHub Pages status | 30 | 20s interval | 10 minutes | Exit 0 with WARN |
| HTTPS cert status | 30 | 60s interval | 30 minutes | Exit 0 with WARN |

**WARN exit behavior:**
- Exit code: 0
- Output: `WARN: {description} — re-run 'site-cli verify' in {suggested_time}`
- State: Step marked as `pending`, not `failed`

---

## HTTPS VERIFICATION CONTRACT

GitHub Pages certificates can take 15 minutes to 24+ hours.

| API Response | Exit Code | Status | Message |
|--------------|-----------|--------|---------|
| `https_status: active` | 0 | SUCCESS | "HTTPS active" |
| `https_status: pending` after 30 min polling | 0 | WARN | "Certificate pending — re-run in 60 minutes" |
| `https_status: errored` | 1 | FAIL | "{GitHub error message}" |
| API unreachable after retries | 1 | FAIL | "GitHub API unreachable" |

---

## CONCURRENCY LOCK

**Lock file:** `.site-cli/lock`

**Contents:**
```json
{
  "pid": 12345,
  "timestamp": "2024-01-15T10:30:00Z",
  "command": "deploy",
  "cwd": "/path/to/repo"
}
```

**Behavior:**
| Condition | Action |
|-----------|--------|
| Lock exists + PID alive | Exit 2: "Another run is in progress (PID {pid})" |
| Lock exists + PID dead | Log warning, delete stale lock, proceed |
| No lock | Create lock, proceed |
| Run completes | Delete lock |
| Run fails | Delete lock |

**Force override:** `--force-lock` deletes existing lock (for recovery only)

---

## VERSION PINNING

| Dependency | Pin Location | Version |
|------------|--------------|---------|
| Node.js | `.nvmrc` + `package.json engines` | `20.x` (LTS) |
| pnpm | `package.json packageManager` | `9.x` |
| Astro | `templates/astro-site/package.json` | `4.16.x` |
| @astrojs/mdx | `templates/astro-site/package.json` | `3.x` |
| shiki | `templates/astro-site/package.json` | `1.x` |
| actions/checkout | `.github/workflows/deploy.yml` | `v4` |
| actions/setup-node | `.github/workflows/deploy.yml` | `v4` |
| pnpm/action-setup | `.github/workflows/deploy.yml` | `v4` |
| actions/configure-pages | `.github/workflows/deploy.yml` | `v5` |
| actions/upload-pages-artifact | `.github/workflows/deploy.yml` | `v3` |
| actions/deploy-pages | `.github/workflows/deploy.yml` | `v4` |

---

## ERROR HANDLING CONTRACT

Every error must be:
1. **Actionable** — tells user exactly what to do
2. **Specific** — includes actual values, not placeholders
3. **Non-destructive** — no partial mutations on failure

**Exit codes:**
| Code | Meaning |
|------|---------|
| 0 | Success (or success with WARN) |
| 1 | Failure (actionable error) |
| 2 | Concurrency conflict |
| 3 | Invalid configuration |

**Error format:**
```
Error: {what failed}
Cause: {why it failed}
Fix: {exact steps to resolve}
```

---

## GITHUB ACTIONS WORKFLOW

**File:** `.github/workflows/deploy.yml`

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

---

## DATA FLOWS

### Flow A: Markdown → Repo

```
1. Validate source file exists
   └─ Fail: "Source file not found: {path}"

2. Read source content
   └─ Fail: "Cannot read file: {error}"

3. Compute content hash (SHA-256)

4. Compare to state.contentHash
   └─ Match: Skip sync, log "Content unchanged"

5. Copy to templates/astro-site/src/content/source.md

6. Normalize frontmatter (ensure title, description exist)

7. Update state.contentHash

8. Git add + commit (only if changes)
   └─ No changes: Skip commit, log "No changes to commit"
```

### Flow B: Repo → Pages

```
1. Git push to origin/main
   └─ Fail: Exit with git error

2. Poll GitHub Actions run status
   └─ Timeout: WARN "Deploy still running"

3. Configure Pages via API:
   POST /repos/{owner}/{repo}/pages
   {
     "source": { "branch": "main", "path": "/" },
     "https_enforced": true
   }
   └─ 409 (already exists): PATCH instead

4. Set custom domain:
   PUT /repos/{owner}/{repo}/pages
   { "cname": "endlesswinning.com" }
```

### Flow C: DNS → HTTPS

```
1. Fetch current DNS records

2. Backup to .site-cli/dns-backup-{timestamp}.json

3. Compute desired state (preserve non-managed records)

4. Apply via Namecheap API

5. Verify via authoritative NS (poll until propagated or timeout)

6. Poll GitHub Pages HTTPS status

7. Return SUCCESS, WARN (pending), or FAIL (error)
```

---

## IDEMPOTENCY GUARANTEES

| Operation | Idempotency Mechanism |
|-----------|----------------------|
| Content sync | Skip if content hash unchanged |
| Git commit | Skip if working tree clean |
| Git push | Skip if remote HEAD matches local |
| Pages config | PATCH if already exists (409 → update) |
| DNS apply | Compare desired vs actual, skip if match |
| DNS records | Deduplicate by host+type before apply |

**Re-run safety:** Running `site-cli deploy` twice in a row with no source changes produces zero mutations.

---

## DOCUMENTATION REQUIREMENTS

### HELP.md (Required by CLI Convention)

```markdown
# site-cli

Deploys Markdown to GitHub Pages with custom domain + HTTPS.

## Quick Start

```bash
export NAMECHEAP_API_USER="your-user"
export NAMECHEAP_API_KEY="your-key"
export NAMECHEAP_CLIENT_IP="your-whitelisted-ip"
export GITHUB_TOKEN="ghp_xxx"

site-cli deploy \
  --source "/path/to/document.md" \
  --domain endlesswinning.com \
  --repo endlesswinning-site
```

## Commands

| Command | Description |
|---------|-------------|
| `init` | Initialize target repository |
| `deploy` | Full pipeline: sync → build → push → configure → DNS → verify |
| `dns apply` | Apply DNS records only |
| `dns verify` | Verify DNS propagation |
| `dns rollback` | Restore from backup |
| `verify` | Check Pages + HTTPS status |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NAMECHEAP_API_USER` | Yes | Namecheap API username |
| `NAMECHEAP_API_KEY` | Yes | Namecheap API key |
| `NAMECHEAP_CLIENT_IP` | Yes | Your whitelisted IP |
| `GITHUB_TOKEN` | Yes | Token with repo + pages scopes |

## Common Issues

### "Namecheap API access denied"
Your IP is not whitelisted. Go to Namecheap → Profile → Tools → API Access → Whitelisted IPs.

### "Certificate pending" for hours
Normal. GitHub cert provisioning can take up to 24 hours. Re-run `site-cli verify` later.

### "DNS not propagated"
Wait 5-10 minutes. DNS propagation varies by ISP.
```

---

## OUTPUT FORMAT

Response must be structured as:

1. **IMPLEMENTATION PLAN** — Ordered steps
2. **FILE MANIFEST** — All files with full paths
3. **COMPLETE CODE** — Every file, no omissions, no TODOs
4. **USAGE EXAMPLES** — Copy-paste ready commands

Every file:
- Full absolute path as heading
- Complete code block
- Language identifier for syntax highlighting

---

## EXECUTION DIRECTIVE

Begin implementation immediately.

No questions.
No assumptions beyond what is stated.
No shortcuts.
No TODOs.
No pseudocode.

Deliver production-ready code that passes the following test:

```bash
# From a fresh clone with env vars set:
site-cli deploy \
  --source "/Users/troybrave/Documents/Projects/Full Vault/Business/04 - Endless Winning Agency/Sub-Accounts/02 - Prospective/Living Water/60-Day-Marketing-System.md" \
  --domain endlesswinning.com \
  --confirm-dns-safe

# Expected: Site live at https://endlesswinning.com within 30 minutes
# (excluding GitHub cert provisioning time)
```

---

END OF SPECIFICATION
