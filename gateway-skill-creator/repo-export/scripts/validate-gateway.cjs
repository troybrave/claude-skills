#!/usr/bin/env node
/**
 * Validate a gateway skill
 *
 * Usage: node validate-gateway.cjs <gateway-name>
 *
 * Checks:
 * - Description length (≤60 words, ≤350 chars)
 * - Trigger phrases (≥2)
 * - Config invariants (I1-I5)
 * - Dependencies (node/curl/paths)
 * - Secret scan
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const SKILLS_DIR = path.join(os.homedir(), '.claude/skills');

// Config invariant rules
const INVARIANTS = {
  I1: { condition: 'gateway_type == mcp', allowed: ['claude_managed', 'auto'], field: 'lifecycle_mode' },
  I2: { condition: 'lifecycle_mode == gateway_managed', allowed: ['cli', 'http'], field: 'gateway_type' },
  I3: { condition: 'lifecycle_mode == auto && gateway_type == mcp', allowed: ['cli', 'http', 'none', null, ''], field: 'fallback_type' },
  I4: { condition: 'fallback_type == cli', required: 'fallback_cli_path' },
  I5: { condition: 'fallback_type == http', required: 'fallback_http_url' }
};

// Secret patterns (Layer 1)
const SECRET_PATTERNS = [
  /sk-[a-zA-Z0-9]{20,}/,
  /Bearer\s+[a-zA-Z0-9._-]{20,}/,
  /AKIA[A-Z0-9]{16}/,
  /ghp_[a-zA-Z0-9]{36}/,
  /gho_[a-zA-Z0-9]{36}/,
  /xox[baprs]-[a-zA-Z0-9-]+/
];

// Sensitive key names (Layer 2)
const SENSITIVE_KEYS = [
  'api_key', 'apiKey', 'secret_key', 'secretKey',
  'access_token', 'accessToken', 'refresh_token',
  'private_key', 'password', 'credentials', 'auth_token'
];

function parseYamlConfig(content) {
  const configMatch = content.match(/```yaml\n([\s\S]*?)```/);
  if (!configMatch) return null;

  const config = {};
  const lines = configMatch[1].split('\n');
  for (const line of lines) {
    const match = line.match(/^(\w+):\s*(.+)?$/);
    if (match) {
      let value = match[2] ? match[2].trim() : null;
      if (value && value.startsWith('[') && value.endsWith(']')) {
        value = value.slice(1, -1).split(',').map(s => s.trim());
      }
      config[match[1]] = value;
    }
  }
  return config;
}

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const frontmatter = {};
  const lines = match[1].split('\n');
  for (const line of lines) {
    const m = line.match(/^(\w+[-\w]*):\s*(.+)$/);
    if (m) {
      frontmatter[m[1]] = m[2].trim();
    }
  }
  return frontmatter;
}

function countWords(text) {
  return text.split(/\s+/).filter(w => w.length > 0).length;
}

function checkInvariants(config) {
  const errors = [];

  if (config.gateway_type === 'mcp') {
    if (!['claude_managed', 'auto'].includes(config.lifecycle_mode)) {
      errors.push(`E015 I1: gateway_type=mcp requires lifecycle_mode in {claude_managed, auto}, got: ${config.lifecycle_mode}`);
    }
  }

  if (config.lifecycle_mode === 'gateway_managed') {
    if (!['cli', 'http'].includes(config.gateway_type)) {
      errors.push(`E015 I2: lifecycle_mode=gateway_managed requires gateway_type in {cli, http}, got: ${config.gateway_type}`);
    }
  }

  if (config.fallback_type === 'cli') {
    if (!config.fallback_cli_path || config.fallback_cli_path === 'null') {
      errors.push('E015 I4: fallback_type=cli requires fallback_cli_path to be non-empty');
    }
  }

  if (config.fallback_type === 'http') {
    if (!config.fallback_http_url || config.fallback_http_url === 'null') {
      errors.push('E015 I5: fallback_type=http requires fallback_http_url to be non-empty');
    }
  }

  return errors;
}

function checkSecrets(content) {
  const errors = [];

  for (const pattern of SECRET_PATTERNS) {
    if (pattern.test(content)) {
      errors.push(`Secret pattern detected: ${pattern.source}`);
    }
  }

  for (const key of SENSITIVE_KEYS) {
    const regex = new RegExp(`["']?${key}["']?\\s*[:=]\\s*["'][^"']{5,}["']`, 'i');
    if (regex.test(content)) {
      errors.push(`Sensitive key with value detected: ${key}`);
    }
  }

  return { errors, warnings: [] };
}

function checkDependencies(config) {
  const errors = [];

  if (config.gateway_type === 'cli' || config.lifecycle_mode === 'gateway_managed') {
    try {
      execSync('command -v node', { stdio: 'pipe' });
    } catch {
      errors.push('E006: Node.js not found');
    }

    if (config.cli_path) {
      const cliPath = config.cli_path.replace(/^~/, os.homedir());
      if (!fs.existsSync(cliPath)) {
        errors.push(`E008: CLI path not found: ${config.cli_path}`);
      } else if (!fs.existsSync(path.join(cliPath, 'cli.js'))) {
        errors.push(`E008: cli.js not found in ${config.cli_path}`);
      }
    }
  }

  if (config.gateway_type === 'http') {
    try {
      execSync('command -v curl', { stdio: 'pipe' });
    } catch {
      errors.push('E006: curl not found');
    }
  }

  return errors;
}

function extractTriggers(description) {
  const matches = description.match(/"([^"]+)"/g) || [];
  return matches.map(m => m.replace(/"/g, ''));
}

function main() {
  const gatewayName = process.argv[2];

  if (!gatewayName) {
    console.error('Usage: node validate-gateway.cjs <gateway-name>');
    process.exit(1);
  }

  const skillDir = path.join(SKILLS_DIR, gatewayName);
  const skillFile = path.join(skillDir, 'skill.md');

  if (!fs.existsSync(skillFile)) {
    console.error(`Error: Gateway not found at ${skillDir}`);
    process.exit(1);
  }

  const content = fs.readFileSync(skillFile, 'utf8');
  const frontmatter = parseFrontmatter(content);
  const config = parseYamlConfig(content);

  console.log(`Validating: ${gatewayName}`);
  console.log('='.repeat(50));

  let passed = 0;
  let failed = 0;
  let warnings = 0;

  const description = frontmatter?.description || '';
  const wordCount = countWords(description);
  const charCount = description.length;

  if (wordCount <= 60 && charCount <= 350) {
    console.log(`✓ Description: ${wordCount} words, ${charCount} chars`);
    passed++;
  } else {
    console.log(`✗ Description too long: ${wordCount} words (max 60), ${charCount} chars (max 350)`);
    failed++;
  }

  const triggers = extractTriggers(description);
  if (triggers.length >= 2) {
    console.log(`✓ Triggers: ${triggers.length} found - ${triggers.join(', ')}`);
    passed++;
  } else {
    console.log(`✗ Triggers: need ≥2 specific phrases, found ${triggers.length}`);
    failed++;
  }

  if (config) {
    const invariantErrors = checkInvariants(config);
    if (invariantErrors.length === 0) {
      console.log('✓ Config invariants: all pass');
      passed++;
    } else {
      for (const err of invariantErrors) {
        console.log(`✗ ${err}`);
      }
      failed += invariantErrors.length;
    }
  } else {
    console.log('⚠ Config block not found (optional for some templates)');
    warnings++;
  }

  const secretCheck = checkSecrets(content);
  if (secretCheck.errors.length === 0) {
    console.log('✓ Secret scan: L1+L2 pass');
    passed++;
  } else {
    for (const err of secretCheck.errors) {
      console.log(`✗ Secret leak: ${err}`);
    }
    failed += secretCheck.errors.length;
  }

  if (config) {
    const depErrors = checkDependencies(config);
    if (depErrors.length === 0) {
      console.log('✓ Dependencies: all available');
      passed++;
    } else {
      for (const err of depErrors) {
        console.log(`✗ ${err}`);
      }
      failed += depErrors.length;
    }
  }

  console.log('');
  console.log('='.repeat(50));
  console.log(`Result: ${passed} passed, ${failed} failed, ${warnings} warnings`);

  if (failed > 0) {
    console.log('\nValidation FAILED');
    process.exit(1);
  } else {
    console.log('\nValidation PASSED');
    process.exit(0);
  }
}

main();
