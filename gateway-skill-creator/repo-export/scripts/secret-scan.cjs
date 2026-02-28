#!/usr/bin/env node
/**
 * Scan gateway skill files for secret leaks
 *
 * Usage: node secret-scan.cjs <gateway-name>
 *
 * Three-layer detection:
 * - Layer 1: Pattern matching (block)
 * - Layer 2: Key name detection (block)
 * - Layer 3: Entropy heuristic (warn only)
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const SKILLS_DIR = path.join(os.homedir(), '.claude/skills');

// Layer 1: Secret patterns (block if matched)
const SECRET_PATTERNS = [
  { pattern: /sk-[a-zA-Z0-9]{20,}/, name: 'OpenAI-style key' },
  { pattern: /Bearer\s+[a-zA-Z0-9._-]{20,}/, name: 'Bearer token' },
  { pattern: /AKIA[A-Z0-9]{16}/, name: 'AWS access key' },
  { pattern: /ghp_[a-zA-Z0-9]{36}/, name: 'GitHub personal token' },
  { pattern: /gho_[a-zA-Z0-9]{36}/, name: 'GitHub OAuth token' },
  { pattern: /xox[baprs]-[a-zA-Z0-9-]+/, name: 'Slack token' },
  { pattern: /eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/, name: 'JWT token' }
];

// Layer 2: Sensitive key names with values (block if matched)
const SENSITIVE_KEYS = [
  'api_key', 'apiKey', 'secret_key', 'secretKey',
  'access_token', 'accessToken', 'refresh_token', 'refreshToken',
  'private_key', 'privateKey', 'password', 'passwd',
  'credentials', 'auth_token', 'authToken', 'bearer'
];

function calculateEntropy(str) {
  const freq = {};
  for (const char of str) {
    freq[char] = (freq[char] || 0) + 1;
  }

  let entropy = 0;
  const len = str.length;
  for (const count of Object.values(freq)) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }

  return entropy;
}

function isAlphanumeric(str) {
  return /^[a-zA-Z0-9]+$/.test(str);
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  const results = {
    layer1: [],
    layer2: [],
    layer3: []
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    for (const { pattern, name } of SECRET_PATTERNS) {
      if (pattern.test(line)) {
        results.layer1.push({
          line: lineNum,
          type: name,
          preview: line.substring(0, 60) + (line.length > 60 ? '...' : '')
        });
      }
    }

    for (const key of SENSITIVE_KEYS) {
      const regex = new RegExp(`["']?${key}["']?\\s*[:=]\\s*["']([^"']{5,})["']`, 'i');
      const match = line.match(regex);
      if (match) {
        results.layer2.push({
          line: lineNum,
          key: key,
          preview: line.substring(0, 60) + (line.length > 60 ? '...' : '')
        });
      }
    }

    const longStrings = line.match(/["']([a-zA-Z0-9]{20,})["']/g) || [];
    for (const match of longStrings) {
      const value = match.replace(/["']/g, '');
      const entropy = calculateEntropy(value);

      if (entropy > 3.5 && isAlphanumeric(value)) {
        results.layer3.push({
          line: lineNum,
          entropy: entropy.toFixed(2),
          preview: value.substring(0, 20) + '...'
        });
      }
    }
  }

  return results;
}

function main() {
  const gatewayName = process.argv[2];

  if (!gatewayName) {
    console.error('Usage: node secret-scan.cjs <gateway-name>');
    process.exit(1);
  }

  const skillDir = path.join(SKILLS_DIR, gatewayName);
  if (!fs.existsSync(skillDir)) {
    console.error(`Error: Gateway not found at ${skillDir}`);
    process.exit(1);
  }

  console.log(`Secret Leak Scan: ${gatewayName}`);
  console.log('='.repeat(50));

  const filesToScan = [];
  const files = fs.readdirSync(skillDir);
  for (const file of files) {
    if (file.endsWith('.md') || file.endsWith('.json')) {
      filesToScan.push(path.join(skillDir, file));
    }
  }

  const allResults = {
    layer1: [],
    layer2: [],
    layer3: []
  };

  for (const file of filesToScan) {
    const results = scanFile(file);
    const relPath = path.relative(skillDir, file);

    for (const r of results.layer1) {
      allResults.layer1.push({ file: relPath, ...r });
    }
    for (const r of results.layer2) {
      allResults.layer2.push({ file: relPath, ...r });
    }
    for (const r of results.layer3) {
      allResults.layer3.push({ file: relPath, ...r });
    }
  }

  if (allResults.layer1.length === 0) {
    console.log('Layer 1 (Patterns):    ✓ PASS (0 matches)');
  } else {
    console.log(`Layer 1 (Patterns):    ✗ FAIL (${allResults.layer1.length} matches)`);
    for (const r of allResults.layer1) {
      console.log(`  - ${r.file}:${r.line}: ${r.type}`);
    }
  }

  if (allResults.layer2.length === 0) {
    console.log('Layer 2 (Key Names):   ✓ PASS (0 matches)');
  } else {
    console.log(`Layer 2 (Key Names):   ✗ FAIL (${allResults.layer2.length} matches)`);
    for (const r of allResults.layer2) {
      console.log(`  - ${r.file}:${r.line}: ${r.key}`);
    }
  }

  if (allResults.layer3.length === 0) {
    console.log('Layer 3 (Entropy):     ✓ PASS (0 suspicious values)');
  } else {
    console.log(`Layer 3 (Entropy):     ⚠ WARN (${allResults.layer3.length} suspicious values)`);
    for (const r of allResults.layer3) {
      console.log(`  - ${r.file}:${r.line}: "${r.preview}" (entropy: ${r.entropy})`);
    }
  }

  console.log('');

  if (allResults.layer1.length > 0 || allResults.layer2.length > 0) {
    console.log('Result: FAIL');
    console.log('Fix: Remove secret values from files. Use environment variable names only.');
    process.exit(1);
  } else if (allResults.layer3.length > 0) {
    console.log('Result: PASS with warnings');
    console.log('Review the high-entropy strings to verify they are not secrets.');
    process.exit(0);
  } else {
    console.log('Result: PASS');
    process.exit(0);
  }
}

main();
