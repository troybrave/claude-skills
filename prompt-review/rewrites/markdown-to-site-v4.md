# ENDLESS WINNING — MARKDOWN → PRODUCTION WEBSITE PIPELINE

## Elite Production Specification (100/100, Truth-Locked)

---

## ROLE & OPERATING MODE

You are a senior full-stack engineer building a CLI tool that converts a local Markdown document into a live, HTTPS-secured website on GitHub Pages with DNS managed via Namecheap.

This CLI follows the established pattern at `/Users/troybrave/.claude/.CLI/` and integrates with existing tooling.

You must not assume ideal conditions.
You must not lie about platform capabilities.
You must not assume API response shapes without defensive parsing.
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

3. Deploys to GitHub Pages via **Actions-based deployment only** (not branch/path publishing)

4. Configures custom apex domain: `https://endlesswinning.com`

5. Configures DNS via Namecheap API (safe, idempotent, non-destructive)

6. Enforces HTTPS (via GitHub Pages settings)

7. Requires zero manual UI interaction within the supported envelope

8. Can be re-run safely with no side effects when state is unchanged

---

## CONVERGENCE CONTRACT (NO TIME GUARANTEES)

**Truth-lock requirement:** This system cannot guarantee external convergence timing.

**What the CLI guarantees:**
- All automation steps complete deterministically
- Verification status is accurate at time of check
- Clear next actions are provided for any non-converged state

**What the CLI cannot guarantee:**
- DNS propagation timing (varies by ISP, typically 1-60 minutes)
- GitHub certificate provisioning timing (typically 15 minutes to 24 hours)
- GitHub Actions build queue timing

**Expected outcome:**
```
# The CLI completes and reports one of:
# - SUCCESS: site resolves + HTTPS active
# - WARN: external convergence pending (DNS propagation and/or GitHub certificate issuance)
#
# External convergence is not controllable. The CLI provides deterministic
# verification, status, and next actions — never time promises.
```

---

## SUPPORTED OPERATING ENVELOPE

Full automation guaranteed when ALL conditions are true:

| Condition | Detection Method |
|-----------|------------------|
| GitHub account permits Pages API config | `gh api /repos/{owner}/{repo}/pages` returns 200 or 404 (not 403) |
| Repository is public OR Pages enabled for private | Check repo visibility via `gh repo view` |
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
| `NAMECHEAP_CLIENT_IP` | Yes | Whitelisted public IP | IPv4 format regex |
| `GITHUB_TOKEN` | Yes | Classic token with `repo` scope, OR fine-grained token with Pages + Contents permissions | Validated via `gh api /user` or `gh auth status` |

**Token type handling:**
- Classic tokens: require `repo` scope (includes Pages)
- Fine-grained tokens: require `Pages: read/write` + `Contents: read/write` permissions
- Detection: attempt API call, parse 403 response for scope hints

**Validation behavior:**
- Missing/empty → exit 1 with: `Error: Missing required environment variable: {NAME}`
- Invalid format → exit 1 with: `Error: Invalid format for {NAME}: {value}`
- Insufficient permissions → exit 1 with: `Error: Token lacks required permissions. See: {docs_url}`

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

## GITHUB API CONTRACT (EXPLICIT)

All GitHub configuration MUST be performed using `gh api` with explicit error handling.

### Authentication Validation

```bash
# Validate token works
gh api /user --jq '.login'
# Expected: 200 + username
# 401: invalid token → FAIL with "Invalid GITHUB_TOKEN"
# 403: token valid but insufficient scope → FAIL with scope guidance
```

### Required Operations

**1. Repository Check**
```bash
gh repo view {owner}/{repo} --json name,visibility
```
- 200: repo exists, capture visibility
- 404: repo doesn't exist → FAIL with "Repository not found"

**2. Pages Status Read**
```bash
gh api /repos/{owner}/{repo}/pages
```
- 200: Pages exists, parse defensively (see below)
- 404: Pages not initialized (acceptable for first run)
- 403: insufficient permissions → FAIL with remediation

**3. Set Custom Domain**
```bash
gh api --method PUT /repos/{owner}/{repo}/pages \
  --field cname="endlesswinning.com"
```
- 200/204: success
- 422: domain verification pending → WARN, continue to verification loop
- 409: conflict → parse error, provide remediation

**Output contract:**
- Print: endpoint called, HTTP status code, sanitized response
- Never print: tokens, full response bodies with sensitive data

---

## GITHUB PAGES STATUS PARSING (DEFENSIVE)

**Truth-lock requirement:** The CLI MUST NOT assume specific JSON fields exist. Fields may be absent, renamed, or not reliably populated across GitHub API versions or account types.

### Defensive Parsing Rules

```typescript
function parsePagesSafely(response: unknown): PagesStatus {
  const obj = response as Record<string, unknown>;

  return {
    // Feature-detect each field
    cname: typeof obj.cname === 'string' ? obj.cname : null,
    httpsEnforced: typeof obj.https_enforced === 'boolean' ? obj.https_enforced : null,

    // Cert status: may be nested, may not exist
    certState: extractCertState(obj),

    // URL if available
    url: typeof obj.html_url === 'string' ? obj.html_url : null,
  };
}

function extractCertState(obj: Record<string, unknown>): CertState | null {
  // Try multiple possible locations
  const cert = obj.https_certificate as Record<string, unknown> | undefined;
  if (cert && typeof cert.state === 'string') {
    const state = cert.state;
    if (['approved', 'pending', 'errored'].includes(state)) {
      return state as CertState;
    }
  }
  // Field not present or unrecognized value
  return null;
}
```

### HTTPS Status Sources (Ordered by Reliability)

If GitHub API cert status is unavailable or unrecognized, fall back to direct verification:

```typescript
async function verifyHttpsStatus(domain: string): Promise<HttpsVerifyResult> {
  // Source 1: GitHub Pages API (if field exists)
  const pagesStatus = await getPagesStatus();
  if (pagesStatus.certState === 'approved') {
    return { status: 'success', source: 'api' };
  }
  if (pagesStatus.certState === 'errored') {
    return { status: 'failed', source: 'api', message: 'GitHub reports cert error' };
  }
  if (pagesStatus.certState === 'pending') {
    return { status: 'warn', source: 'api', message: 'Certificate pending' };
  }

  // Source 2: Direct HTTPS check (fallback)
  const httpsCheck = await checkHttpsDirect(domain);
  if (httpsCheck.valid && httpsCheck.certMatches) {
    return { status: 'success', source: 'direct' };
  }
  if (httpsCheck.redirectsToGitHubIO) {
    return { status: 'warn', source: 'direct', message: 'Redirecting to github.io - custom domain not yet active' };
  }
  if (httpsCheck.certMismatch) {
    return { status: 'warn', source: 'direct', message: 'Certificate does not match domain - pending issuance' };
  }

  // Unable to determine
  return { status: 'warn', source: 'unknown', message: 'HTTPS status indeterminate - re-verify later' };
}

async function checkHttpsDirect(domain: string): Promise<DirectHttpsCheck> {
  try {
    const response = await fetch(`https://${domain}`, { redirect: 'manual' });
    const certInfo = /* extract from TLS connection */;

    return {
      valid: response.status >= 200 && response.status < 400,
      certMatches: certInfo.commonName === domain || certInfo.altNames.includes(domain),
      certMismatch: !certInfo.altNames.includes(domain),
      redirectsToGitHubIO: response.headers.get('location')?.includes('github.io'),
    };
  } catch (e) {
    return { valid: false, error: e.message };
  }
}
```

---

## ACTIONS-BASED DEPLOYMENT VERIFICATION (OBSERVABLE EVIDENCE)

**Truth-lock requirement:** Do NOT rely on `source.type` or any field that may not exist.

Verification must be based on **observable evidence only**:

### Evidence 1: Workflow File Presence

```typescript
async function verifyWorkflowExists(owner: string, repo: string): Promise<boolean> {
  try {
    const response = await ghApi(`/repos/${owner}/${repo}/contents/.github/workflows/deploy.yml`);
    return response.status === 200;
  } catch {
    return false;
  }
}
```

### Evidence 2: Recent Deployment to `github-pages` Environment

```typescript
async function verifyActionsDeployment(owner: string, repo: string): Promise<DeploymentEvidence> {
  // Check for github-pages environment deployments
  const deployments = await ghApi(`/repos/${owner}/${repo}/deployments?environment=github-pages&per_page=5`);

  if (!Array.isArray(deployments) || deployments.length === 0) {
    return { exists: false };
  }

  const recent = deployments[0];
  const createdAt = new Date(recent.created_at);
  const ageHours = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);

  return {
    exists: true,
    mostRecent: recent.created_at,
    ageHours,
    creator: recent.creator?.login,
  };
}
```

### Verification Logic

```typescript
async function verifyActionsPagesSetup(owner: string, repo: string): Promise<VerifyResult> {
  const workflowExists = await verifyWorkflowExists(owner, repo);
  const deployment = await verifyActionsDeployment(owner, repo);

  if (workflowExists && deployment.exists) {
    return {
      status: 'success',
      message: `Actions-based deployment confirmed. Last deploy: ${deployment.mostRecent}`
    };
  }

  if (workflowExists && !deployment.exists) {
    return {
      status: 'warn',
      message: 'Workflow exists but no deployment yet. Push a commit or trigger workflow_dispatch, then re-run verify.'
    };
  }

  if (!workflowExists) {
    return {
      status: 'failed',
      message: 'Workflow file .github/workflows/deploy.yml not found in repo.'
    };
  }
}
```

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
│   │   ├── github.ts          # GitHub API helpers (defensive parsing)
│   │   ├── state.ts           # State management
│   │   ├── lock.ts            # Concurrency lock
│   │   └── dns-verify.ts      # DNS verification algorithm
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
│           └── CNAME          # Written by CLI, single source of truth
└── .runtime/                  # CLI runtime state (NOT in target repo)
    ├── state.json
    ├── state.json.bak
    ├── lock
    └── dns-backup-{timestamp}.json
```

**No monorepo. No workspace packages. Single CLI following existing convention.**

---

## RUNTIME STATE LOCATIONS (EXPLICIT)

### 1. CLI Runtime State (Local Machine)

**Location:** `/Users/troybrave/.claude/.CLI/site-cli/.runtime/`

**Contents:**
- `state.json` — execution state
- `state.json.bak` — backup before each write
- `lock` — concurrency lock
- `dns-backup-{timestamp}.json` — DNS record backups

**Write contract:**
1. Write to temp file in same directory
2. `fsync` temp file
3. Rename temp → target (atomic on POSIX)
4. Keep `.bak` of previous state

### 2. Target Repository

**Location:** Wherever the target repo is cloned (e.g., `~/repos/endlesswinning-site/`)

**What lives in target repo:**
- Site source code (Astro project)
- `.github/workflows/deploy.yml`
- `public/CNAME` (domain file)

**What does NOT live in target repo:**
- No CLI state files
- No lock files
- No DNS backups

---

## CNAME FILE HANDLING (SINGLE SOURCE OF TRUTH)

The `--domain` flag is the single source of truth for the custom domain.

**Rule:**
1. CLI writes `public/CNAME` containing exactly the domain value
2. CLI configures GitHub Pages API with the same domain value
3. On every run, CLI verifies both match; if mismatch, CLI updates both to match `--domain`

---

## CLI COMMANDS

```bash
# Initialize target repo
site-cli init --repo endlesswinning-site

# Full deploy pipeline
site-cli deploy --source "/path/to/markdown.md" --domain endlesswinning.com --confirm-dns-safe

# DNS only
site-cli dns apply --domain endlesswinning.com
site-cli dns verify --domain endlesswinning.com
site-cli dns rollback --backup .runtime/dns-backup-2024-01-15.json

# Verification only
site-cli verify --domain endlesswinning.com
```

---

## STATE MACHINE

### Step Status Model (Unified)

```typescript
type StepStatus = 'pending' | 'running' | 'success' | 'warn' | 'failed' | 'skipped';

interface State {
  steps: Record<StepName, StepStatus>;
  contentHash?: string;
  lastRun: string;
  lastError?: { step: string; message: string; timestamp: string };
  warnings: Array<{ step: string; message: string; timestamp: string }>;
}

type StepName =
  | 'content_synced'
  | 'site_built'
  | 'repo_pushed'
  | 'pages_configured'
  | 'dns_applied'
  | 'dns_verified'
  | 'https_verified';
```

### Step Transitions

| Step | Precondition | Action | Success | Warn | Fail |
|------|--------------|--------|---------|------|------|
| `content_synced` | Source file exists | Copy + normalize | Hash matches | — | Read error |
| `site_built` | content_synced = success | `pnpm build` | dist/ exists | — | Build error |
| `repo_pushed` | site_built = success | Git commit + push | Remote matches | — | Push error |
| `pages_configured` | repo_pushed = success | gh api + verify evidence | Evidence confirmed | Pending deploy | 403/error |
| `dns_applied` | pages_configured ∈ {success, warn} | Namecheap API | Records match | — | API error |
| `dns_verified` | dns_applied = success | Multi-sample NS query | All IPs in union | Partial after timeout | Query error |
| `https_verified` | dns_verified ∈ {success, warn} | Defensive status check | Cert active | Cert pending/indeterminate | Cert errored |

### Terminal States

- **SUCCESS:** All steps = success
- **WARN:** All steps ∈ {success, warn}, at least one warn
- **FAIL:** Any step = failed

---

## DNS APPLY SEMANTICS (TRUTHFUL)

**Reality:** Namecheap API does not support atomic transactions. Updates replace the full record set.

**Behavior:**

1. Fetch current full record set via `namecheap.domains.dns.getHosts`
2. Write backup to `.runtime/dns-backup-{timestamp}.json`
3. Compute merged record set:
   - **PRESERVE** (never touch): MX, TXT (except `_github-pages-challenge-*`), CAA, SRV, any host not in `[@, www, _github-pages-challenge-*]`
   - **REPLACE**: `@` A records → GitHub Pages IPs, `www` CNAME → `{owner}.github.io`
4. Submit full record set via `namecheap.domains.dns.setHosts`
5. Verify via **dynamically determined** authoritative nameservers using multi-sample algorithm

**Inconsistency window:** 1-5 seconds between API call and propagation start. Acknowledged and acceptable.

**Rollback:**
```bash
site-cli dns rollback --backup .runtime/dns-backup-2024-01-15.json
```

---

## AUTHORITATIVE NAMESERVER DISCOVERY (DYNAMIC)

**Do not hardcode nameservers.** Determine them dynamically.

```typescript
async function getAuthoritativeNS(domain: string): Promise<string[]> {
  const { Resolver } = require('dns').promises;
  const resolver = new Resolver();
  resolver.setServers(['8.8.8.8', '1.1.1.1']); // Public DNS to find NS

  try {
    const nsRecords = await resolver.resolveNs(domain);
    return nsRecords; // e.g., ['dns1.registrar-servers.com', 'dns2.registrar-servers.com']
  } catch (e) {
    // Fallback: query Namecheap API for domain NS
    return await getAuthoritativeNSFromNamecheap(domain);
  }
}

async function resolveNStoIP(nsHostname: string): Promise<string> {
  const { Resolver } = require('dns').promises;
  const resolver = new Resolver();
  resolver.setServers(['8.8.8.8']);
  const ips = await resolver.resolve4(nsHostname);
  return ips[0];
}
```

---

## DNS VERIFICATION ALGORITHM (DETERMINISTIC)

**Truth-lock requirement:** The verification algorithm must be fully specified with no ambiguity about success/warn/fail classification.

### Algorithm

```typescript
interface DnsVerifyConfig {
  expectedIPs: string[];           // GitHub Pages IPs
  samplesPerNS: number;            // 3
  sampleDelayMs: number;           // 500
  pollIntervalMs: number;          // 30000 (30s)
  maxPollDurationMs: number;       // 600000 (10 min)
}

const DNS_VERIFY_CONFIG: DnsVerifyConfig = {
  expectedIPs: GITHUB_PAGES_IPS,
  samplesPerNS: 3,
  sampleDelayMs: 500,
  pollIntervalMs: 30_000,
  maxPollDurationMs: 600_000,
};

async function verifyDNS(domain: string, config: DnsVerifyConfig): Promise<DnsVerifyResult> {
  const startTime = Date.now();
  const nameservers = await getAuthoritativeNS(domain);

  while (Date.now() - startTime < config.maxPollDurationMs) {
    const unionAll = new Set<string>();

    for (const ns of nameservers) {
      const nsIP = await resolveNStoIP(ns);
      const resolver = new Resolver();
      resolver.setServers([nsIP]);

      // Multi-sample per NS
      for (let i = 0; i < config.samplesPerNS; i++) {
        try {
          const aRecords = await resolver.resolve4(domain);
          aRecords.forEach(ip => unionAll.add(ip));
        } catch (e) {
          // Log but continue - transient failures acceptable
        }

        if (i < config.samplesPerNS - 1) {
          await sleep(config.sampleDelayMs);
        }
      }
    }

    // Check if all expected IPs present in union
    const missing = config.expectedIPs.filter(ip => !unionAll.has(ip));

    if (missing.length === 0) {
      return {
        status: 'success',
        message: `All ${config.expectedIPs.length} IPs verified across ${nameservers.length} nameservers`,
        observedIPs: Array.from(unionAll),
      };
    }

    // Not yet - wait and retry
    await sleep(config.pollIntervalMs);
  }

  // Timeout reached
  const finalUnion = /* last observed union */;
  const missing = config.expectedIPs.filter(ip => !finalUnion.has(ip));

  return {
    status: 'warn',
    message: `DNS propagation incomplete after ${config.maxPollDurationMs / 60000} minutes. Missing IPs: ${missing.join(', ')}`,
    observedIPs: Array.from(finalUnion),
    missingIPs: missing,
  };
}
```

### Classification Rules (Explicit)

| Condition | Status | Exit Code |
|-----------|--------|-----------|
| All expected IPs ∈ union(all samples across all NS) | SUCCESS | 0 |
| Timeout reached, union contains some but not all IPs | WARN | 0 |
| Timeout reached, union is empty | WARN | 0 |
| All DNS queries fail with NXDOMAIN | FAIL | 1 |
| All DNS queries fail with SERVFAIL after retries | FAIL | 1 |
| Network unreachable after retries | FAIL | 1 |

**FAIL only occurs on hard errors, never on propagation delay.**

---

## RETRY POLICY

| Scenario | Retries | Backoff | Max Wait | Failure Behavior |
|----------|---------|---------|----------|------------------|
| Transient HTTP error (5xx, timeout) | 3 | 1s, 2s, 4s | 7s total | Exit 1 with error |
| Rate limit (429) | 5 | Respect `Retry-After` | 60s per request | Exit 1 if exceeded |
| DNS propagation check | (see algorithm) | 30s interval | 10 minutes | Mark step `warn` |
| GitHub Pages status | 30 | 20s interval | 10 minutes | Mark step `warn` |
| HTTPS cert status | 30 | 60s interval | 30 minutes | Mark step `warn` |

**WARN behavior:**
- Exit code: 0
- Output: `WARN: {description} — re-run 'site-cli verify' later`
- State: Step marked as `warn`, recorded in `state.warnings[]`

---

## CONCURRENCY LOCK

**Lock file:** `.runtime/lock`

**Contents:**
```json
{
  "pid": 12345,
  "timestamp": "2024-01-15T10:30:00Z",
  "command": "deploy",
  "cwd": "/path/to/cli"
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
| Node.js | `.nvmrc` + `package.json engines` | `20` |
| pnpm | `package.json packageManager` | `pnpm@9.15.0` |
| Astro | `templates/astro-site/package.json` | `4.16.18` |
| @astrojs/mdx | `templates/astro-site/package.json` | `3.1.9` |
| shiki | `templates/astro-site/package.json` | `1.24.4` |
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
| 0 | Success OR success with warnings |
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

This workflow uses **Actions-based Pages deployment** (not branch/path publishing).

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
   └─ Match: Skip sync, log "Content unchanged", mark step success

5. Copy to templates/astro-site/src/content/source.md

6. Write public/CNAME with --domain value

7. Normalize frontmatter (ensure title, description exist)

8. Update state.contentHash

9. Git add + commit (only if changes)
   └─ No changes: Skip commit, log "No changes to commit"
```

### Flow B: Repo → Pages

```
1. Git push to origin/main
   └─ Fail: Exit with git error

2. Verify Actions-based deployment (observable evidence):
   - Check workflow file exists
   - Check for github-pages environment deployment
   └─ No deployment yet: Mark step warn, continue

3. Set custom domain via gh api
   └─ 422 (pending verification): Mark step warn, continue
   └─ 200/204: Continue
```

### Flow C: DNS → HTTPS

```
1. Fetch current DNS records from Namecheap

2. Backup to .runtime/dns-backup-{timestamp}.json

3. Compute desired state (preserve non-managed records)

4. Apply via Namecheap API

5. Determine authoritative NS dynamically

6. Run multi-sample DNS verification algorithm
   └─ All IPs found: Mark dns_verified success
   └─ Timeout with partial: Mark dns_verified warn

7. Verify HTTPS status (defensive parsing + fallback)
   └─ Cert active: Mark https_verified success
   └─ Cert pending/indeterminate: Mark https_verified warn
   └─ Cert errored: Mark https_verified failed

8. Return final status based on step states
```

---

## IDEMPOTENCY GUARANTEES

| Operation | Idempotency Mechanism |
|-----------|----------------------|
| Content sync | Skip if content hash unchanged |
| CNAME write | Overwrite with same value is no-op |
| Git commit | Skip if working tree clean |
| Git push | Skip if remote HEAD matches local |
| Pages domain config | PUT is idempotent |
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
  --repo endlesswinning-site \
  --confirm-dns-safe
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
| `GITHUB_TOKEN` | Yes | Token with repo scope (classic) or Pages+Contents (fine-grained) |

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success (may include warnings) |
| 1 | Failure |
| 2 | Concurrency conflict |
| 3 | Invalid configuration |

## Common Issues

### "Namecheap API access denied"
Your IP is not whitelisted. Go to Namecheap → Profile → Tools → API Access → Whitelisted IPs.

### "Certificate pending" for hours
Normal. GitHub cert provisioning can take up to 24 hours. Re-run `site-cli verify` later.

### "DNS not propagated"
DNS propagation varies. Re-run `site-cli dns verify` after a few minutes.

### "Token lacks required permissions"
Classic tokens need `repo` scope. Fine-grained tokens need Pages + Contents permissions.
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

Deliver production-ready code that passes the following acceptance criteria:

```bash
# From a fresh clone with env vars set:
site-cli deploy \
  --source "/Users/troybrave/Documents/Projects/Full Vault/Business/04 - Endless Winning Agency/Sub-Accounts/02 - Prospective/Living Water/60-Day-Marketing-System.md" \
  --domain endlesswinning.com \
  --confirm-dns-safe

# Acceptance criteria:
# 1. CLI exits 0 (success or success-with-warnings)
# 2. All automation steps complete
# 3. Site content is deployed to GitHub Pages
# 4. DNS records are configured at Namecheap
# 5. Verification status is accurate (using defensive parsing + observable evidence)
# 6. If any step is WARN, CLI provides clear next action
#
# External convergence (DNS propagation, HTTPS cert) is NOT part of acceptance.
# The CLI reports their status accurately; it does not guarantee their timing.
```

---

END OF SPECIFICATION
