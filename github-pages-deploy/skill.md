---
name: github-pages-deploy
description: Deploys HTML content to GitHub Pages with custom Namecheap subdomain and verified SSL. Use when publishing static sites, landing pages, or HTML guides to GitHub Pages with custom domains like subdomain.endlesswinning.com.
version: "1.0.0"
allowed-tools: Read, Write, Bash, Glob, WebFetch
---

# GitHub Pages Deploy Skill

Deploys static HTML content to GitHub Pages with custom Namecheap subdomain configuration and SSL verification. Battle-tested with proper verification at every step.

## What This Skill Does

1. **Creates or converts** content to styled HTML (if needed)
2. **Sets up GitHub Pages** repository with proper structure
3. **Configures CNAME** for custom domain
4. **Adds DNS record** to Namecheap via API
5. **Verifies DNS propagation** with retry loop
6. **Confirms SSL certificate** is provisioned
7. **Returns verified working URL** (both HTTP and HTTPS)

## Critical Learnings (Battle-Tested)

### Namecheap API - DANGER ZONE
**The `setHosts` API requires ALL records to be sent at once.** If you only send the new record, you will DELETE all existing DNS records. This is catastrophic.

**ALWAYS:**
1. First call `getHosts` to retrieve ALL existing records
2. Parse and preserve every record
3. Add your new record to the list
4. Send ALL records back via `setHosts`

### DNS Propagation Takes Time
- Authoritative nameserver updates immediately
- Public resolvers (8.8.8.8, 1.1.1.1) can take 5-30 minutes
- **Always verify at authoritative nameserver first, then poll public resolvers**

### SSL Certificates Take Time
- GitHub Pages uses Let's Encrypt
- Certificate provisioning can take 10-30 minutes AFTER DNS propagates
- **HTTP will work before HTTPS - this is normal**
- Must poll for SSL certificate, not just assume it works

### GitHub Pages Structure
- Repository MUST be named `{username}.github.io` for user pages
- OR any repo name for project pages (accessed at `{username}.github.io/{repo}`)
- CNAME file MUST be at repository root
- index.html MUST be at repository root (or specified path in config)

## Configuration

### Namecheap API Credentials
```
API User: troybravenboer
API Key: 92fc70a3fefd497a9e4cfdfe36755621
Username: troybravenboer
Client IP: 47.198.233.238
API Base: https://api.namecheap.com/xml.response
```

### GitHub Configuration
- **Primary User Pages Repo:** `troybrave.github.io`
- **GitHub Username:** `troybrave`

### Domains Available
- `endlesswinning.com` - Primary domain for subdomains

## Step-by-Step Process

### Step 1: Prepare HTML Content

If user provides markdown or raw content:
```bash
# Convert to styled HTML with Stripe-inspired theme
# Use CSS variables for theming:
# --primary: #635bff (Stripe purple)
# --accent: #00d4ff (Cyan accent)
# --background: #0a2540 (Dark blue)
```

If user provides HTML:
- Verify it's valid and complete
- Ensure responsive meta tags exist

### Step 2: Set Up GitHub Repository

**For new deployments to troybrave.github.io:**
```bash
# Check if repo exists
gh repo view troybrave/troybrave.github.io 2>/dev/null

# If it exists, clone or work with existing
# If not, create it:
gh repo create troybrave.github.io --public
```

**For project-specific repos:**
```bash
gh repo create {project-name} --public
```

### Step 3: Create Required Files

**index.html** - The main page content

**CNAME** - Custom domain configuration
```
subdomain.endlesswinning.com
```

### Step 4: Push to GitHub

**Using GitHub API (more reliable than git push):**
```bash
# Get existing file SHA if updating
SHA=$(gh api repos/troybrave/troybrave.github.io/contents/index.html --jq '.sha' 2>/dev/null || echo "")

# Create/update index.html
CONTENT=$(base64 < index.html)
if [ -n "$SHA" ]; then
  gh api repos/troybrave/troybrave.github.io/contents/index.html \
    -X PUT \
    -f message="Update index.html" \
    -f content="$CONTENT" \
    -f sha="$SHA"
else
  gh api repos/troybrave/troybrave.github.io/contents/index.html \
    -X PUT \
    -f message="Add index.html" \
    -f content="$CONTENT"
fi

# Same for CNAME
CNAME_CONTENT=$(echo -n "subdomain.endlesswinning.com" | base64)
gh api repos/troybrave/troybrave.github.io/contents/CNAME \
  -X PUT \
  -f message="Add CNAME for custom domain" \
  -f content="$CNAME_CONTENT"
```

**Verification:**
```bash
# Confirm files exist in repo
gh api repos/troybrave/troybrave.github.io/contents/index.html --jq '.name'
gh api repos/troybrave/troybrave.github.io/contents/CNAME --jq '.name'
```

### Step 5: Configure Namecheap DNS (CRITICAL)

**Step 5a: Get ALL existing DNS records first**
```bash
curl -s "https://api.namecheap.com/xml.response?ApiUser=troybravenboer&ApiKey=92fc70a3fefd497a9e4cfdfe36755621&UserName=troybravenboer&ClientIp=47.198.233.238&Command=namecheap.domains.dns.getHosts&SLD=endlesswinning&TLD=com"
```

**Step 5b: Parse ALL existing records**
Extract from XML response:
- HostName, RecordType, Address, TTL, MXPref (for MX records)
- Build a complete list of all current records

**Step 5c: Add new CNAME record to the list**
New record format:
```
HostName: {subdomain}
RecordType: CNAME
Address: troybrave.github.io.  # Note the trailing dot
TTL: 1799
```

**Step 5d: Set ALL hosts (including new record)**
Build URL with ALL records numbered sequentially:
```
HostName1=@&RecordType1=A&Address1=...&TTL1=1799&
HostName2=www&RecordType2=CNAME&Address2=...&TTL2=1799&
...
HostNameN={subdomain}&RecordTypeN=CNAME&AddressN=troybrave.github.io.&TTLN=1799
```

**Example setHosts call:**
```bash
curl -s "https://api.namecheap.com/xml.response?ApiUser=troybravenboer&ApiKey=92fc70a3fefd497a9e4cfdfe36755621&UserName=troybravenboer&ClientIp=47.198.233.238&Command=namecheap.domains.dns.setHosts&SLD=endlesswinning&TLD=com&[ALL_RECORDS_HERE]"
```

**Verification:**
```bash
# Confirm record was added
curl -s "https://api.namecheap.com/xml.response?ApiUser=troybravenboer&ApiKey=92fc70a3fefd497a9e4cfdfe36755621&UserName=troybravenboer&ClientIp=47.198.233.238&Command=namecheap.domains.dns.getHosts&SLD=endlesswinning&TLD=com" | grep -i "{subdomain}"
```

### Step 6: Verify DNS Propagation

**Step 6a: Check authoritative nameserver (immediate)**
```bash
dig @dns1.registrar-servers.com {subdomain}.endlesswinning.com CNAME +short
# Expected: troybrave.github.io.
```

**Step 6b: Poll public resolvers (with retry)**
```bash
# Check Google DNS
for i in {1..12}; do
  RESULT=$(dig @8.8.8.8 {subdomain}.endlesswinning.com CNAME +short)
  if [ -n "$RESULT" ]; then
    echo "DNS propagated to Google DNS: $RESULT"
    break
  fi
  echo "Waiting for DNS propagation... attempt $i/12"
  sleep 30
done

# Check Cloudflare DNS
dig @1.1.1.1 {subdomain}.endlesswinning.com CNAME +short
```

**Success criteria:**
- CNAME resolves to `troybrave.github.io.`
- Response from at least one public resolver

### Step 7: Verify HTTP Access

```bash
# Test HTTP (should work immediately after DNS propagates)
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://{subdomain}.endlesswinning.com)

if [ "$HTTP_STATUS" = "200" ]; then
  echo "HTTP access verified"
else
  echo "HTTP not yet working. Status: $HTTP_STATUS"
  # May need to wait for GitHub Pages to recognize the domain
fi
```

### Step 8: Verify SSL/HTTPS (With Retry Loop)

**This is the most common failure point. SSL takes time.**

```bash
# Poll for SSL certificate (up to 30 minutes)
for i in {1..30}; do
  HTTPS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://{subdomain}.endlesswinning.com 2>/dev/null)

  if [ "$HTTPS_STATUS" = "200" ]; then
    echo "HTTPS verified! SSL certificate is active."
    break
  fi

  echo "Waiting for SSL certificate... attempt $i/30 (Status: $HTTPS_STATUS)"
  sleep 60
done

# If still not working after 30 attempts:
if [ "$HTTPS_STATUS" != "200" ]; then
  echo "WARNING: SSL certificate not yet provisioned."
  echo "This can take up to 1 hour. Check GitHub Pages settings."
  echo "HTTP is working: http://{subdomain}.endlesswinning.com"
fi
```

**Manual SSL check via GitHub:**
- Go to repo Settings > Pages
- Check "Enforce HTTPS" is enabled
- Look for certificate status message

### Step 9: Final Verification Report

```bash
echo "=== DEPLOYMENT VERIFICATION ==="
echo ""
echo "Repository: https://github.com/troybrave/troybrave.github.io"
echo "Custom Domain: {subdomain}.endlesswinning.com"
echo ""
echo "DNS Status:"
dig @8.8.8.8 {subdomain}.endlesswinning.com CNAME +short
echo ""
echo "HTTP Status:"
curl -s -o /dev/null -w "%{http_code}" http://{subdomain}.endlesswinning.com
echo ""
echo "HTTPS Status:"
curl -s -o /dev/null -w "%{http_code}" https://{subdomain}.endlesswinning.com
echo ""
echo "=== END VERIFICATION ==="
```

## Success Criteria

A deployment is ONLY considered successful when ALL of these are true:

1. **Files pushed:** index.html and CNAME exist in GitHub repo
2. **DNS configured:** CNAME record exists at Namecheap
3. **DNS propagated:** Record resolves from public DNS (8.8.8.8)
4. **HTTP works:** `curl http://subdomain.endlesswinning.com` returns 200
5. **HTTPS works:** `curl https://subdomain.endlesswinning.com` returns 200

**Do NOT report success until step 5 is verified.**

## Error Handling

### "DNS record not found after setHosts"
- Check XML response for errors
- Verify all existing records were included
- Check for URL encoding issues in addresses

### "HTTP returns 404"
- Verify index.html is at repository root
- Check CNAME file contents (no extra whitespace/newlines)
- Ensure GitHub Pages is enabled in repo settings

### "HTTPS certificate error"
- Wait longer (up to 1 hour)
- Check GitHub Pages settings for certificate status
- Verify DNS is correctly pointing to GitHub
- Try disabling and re-enabling "Enforce HTTPS" in settings

### "DNS not propagating"
- Verify at authoritative nameserver first
- Clear local DNS cache: `sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder`
- Try different public resolvers (8.8.8.8, 1.1.1.1, 208.67.222.222)

### "Namecheap API error"
- Verify Client IP is whitelisted
- Check API key is active
- Ensure account has API access enabled

## Example Execution

```
User: "Deploy my guide to abdella.endlesswinning.com"

Step 1: Prepare content
 Converting markdown to styled HTML with Stripe theme

Step 2: Set up repository
 Repository troybrave.github.io exists

Step 3: Create files
 Created index.html (557 lines)
 Created CNAME (abdella.endlesswinning.com)

Step 4: Push to GitHub
 Uploaded index.html via GitHub API
 Uploaded CNAME via GitHub API
 Verified files exist in repository

Step 5: Configure DNS
 Retrieved 35 existing DNS records from Namecheap
 Added abdella CNAME pointing to troybrave.github.io.
 Sent all 36 records via setHosts API
 Verified abdella record exists

Step 6: DNS propagation
 Authoritative NS: troybrave.github.io. (immediate)
 Polling Google DNS...
 Attempt 1: Not yet propagated
 Attempt 2: Not yet propagated
 Attempt 3: troybrave.github.io. (propagated!)

Step 7: HTTP verification
 HTTP Status: 200 (working!)

Step 8: SSL verification
 Polling for SSL certificate...
 Attempt 1: Connection refused (certificate pending)
 Attempt 2: Connection refused
 ...
 Attempt 8: 200 (SSL active!)

=== DEPLOYMENT COMPLETE ===
URL: https://abdella.endlesswinning.com
HTTP: Working
HTTPS: Working
```

## Quick Reference

### Deploy a Page
```
Use github-pages-deploy to publish [content] at [subdomain].endlesswinning.com
```

### Check DNS Status
```bash
dig @8.8.8.8 {subdomain}.endlesswinning.com CNAME +short
```

### Check HTTP/HTTPS
```bash
curl -I http://{subdomain}.endlesswinning.com
curl -I https://{subdomain}.endlesswinning.com
```

### Manual Namecheap DNS Check
```bash
curl -s "https://api.namecheap.com/xml.response?ApiUser=troybravenboer&ApiKey=92fc70a3fefd497a9e4cfdfe36755621&UserName=troybravenboer&ClientIp=47.198.233.238&Command=namecheap.domains.dns.getHosts&SLD=endlesswinning&TLD=com"
```

## Mistakes to Avoid (Lessons Learned)

1. **Don't build MCPs when curl works** - Direct API calls are simpler and more reliable
2. **Don't declare success before verification** - Always verify DNS, HTTP, AND HTTPS
3. **Don't forget existing DNS records** - The setHosts API replaces ALL records
4. **Don't assume SSL is instant** - Certificate provisioning takes time
5. **Don't use git push when auth fails** - Use GitHub API with `gh` CLI instead
6. **Don't skip the retry loops** - DNS and SSL both need patience

## Related Commands

```bash
# List GitHub repos
gh repo list

# Check GitHub Pages status
gh api repos/troybrave/troybrave.github.io/pages

# Enable GitHub Pages
gh api repos/troybrave/troybrave.github.io/pages -X POST -f source='{"branch":"main"}'

# Get Namecheap domains
curl -s "https://api.namecheap.com/xml.response?ApiUser=troybravenboer&ApiKey=92fc70a3fefd497a9e4cfdfe36755621&UserName=troybravenboer&ClientIp=47.198.233.238&Command=namecheap.domains.getList"
```

## Files Created by This Skill

- `index.html` - Main HTML content
- `CNAME` - Custom domain configuration
- DNS CNAME record at Namecheap

## Timing Expectations

| Step | Typical Time |
|------|--------------|
| HTML creation | Immediate |
| GitHub push | 5-10 seconds |
| DNS at authoritative NS | Immediate |
| DNS propagation | 5-30 minutes |
| HTTP working | After DNS propagates |
| SSL certificate | 10-60 minutes after DNS |

**Total deployment time: 15-90 minutes** (mostly waiting for SSL)
