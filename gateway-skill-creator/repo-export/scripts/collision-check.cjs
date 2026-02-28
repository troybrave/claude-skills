#!/usr/bin/env node
/**
 * Check trigger phrase collisions between gateways
 *
 * Usage: node collision-check.cjs <gateway-name>
 *
 * Scoring formula:
 * - Jaccard similarity base
 * - +0.3 boost for service token overlap
 * - -0.2 penalty if ONLY generic tokens overlap
 * - +0.15 boost for prefix match
 *
 * Thresholds:
 * - 0.0-0.29: Allow
 * - 0.3-0.69: Warn (require non-trigger)
 * - 0.7-0.99: Block (must change)
 * - 1.0: Block (exact duplicate)
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const SKILLS_DIR = path.join(os.homedir(), '.claude/skills');

// Service identifiers - get +0.3 boost
const SERVICE_TOKENS = new Set([
  'telegram', 'slack', 'discord', 'notion', 'airtable',
  'stripe', 'github', 'linear', 'figma', 'supabase',
  'zoom', 'calendar', 'gmail', 'drive', 'sheets',
  'trello', 'jira', 'asana', 'monday', 'clickup'
]);

// Generic verbs - get -0.2 penalty if ONLY these overlap
const GENERIC_TOKENS = new Set([
  'send', 'check', 'get', 'list', 'create', 'update', 'delete',
  'message', 'email', 'file', 'task', 'event', 'note', 'add',
  'remove', 'view', 'show', 'find', 'search', 'fetch'
]);

function tokenize(phrase) {
  return new Set(phrase.toLowerCase().split(/\s+/).filter(t => t.length > 0));
}

function intersection(setA, setB) {
  return new Set([...setA].filter(x => setB.has(x)));
}

function union(setA, setB) {
  return new Set([...setA, ...setB]);
}

function collisionScore(triggerA, triggerB) {
  const tokensA = tokenize(triggerA);
  const tokensB = tokenize(triggerB);

  if (triggerA.toLowerCase() === triggerB.toLowerCase()) {
    return 1.0;
  }

  const inter = intersection(tokensA, tokensB);
  const uni = union(tokensA, tokensB);

  if (uni.size === 0) return 0.0;

  let jaccard = inter.size / uni.size;
  const serviceOverlap = intersection(inter, SERVICE_TOKENS);
  const serviceBoost = serviceOverlap.size > 0 ? 0.3 : 0.0;
  const nonGenericOverlap = new Set([...inter].filter(t => !GENERIC_TOKENS.has(t)));
  const genericPenalty = (inter.size > 0 && nonGenericOverlap.size === 0) ? -0.2 : 0.0;
  const prefixMatch = triggerA.toLowerCase().startsWith(triggerB.toLowerCase()) ||
                      triggerB.toLowerCase().startsWith(triggerA.toLowerCase());
  const prefixBoost = prefixMatch ? 0.15 : 0.0;

  const score = Math.max(0.0, Math.min(1.0, jaccard + serviceBoost + genericPenalty + prefixBoost));
  return Math.round(score * 100) / 100;
}

function extractTriggers(content) {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) return [];

  const descMatch = frontmatterMatch[1].match(/description:\s*(.+)/);
  if (!descMatch) return [];

  const description = descMatch[1];
  const matches = description.match(/"([^"]+)"/g) || [];
  return matches.map(m => m.replace(/"/g, ''));
}

function findAllGateways() {
  const gateways = {};

  const dirs = fs.readdirSync(SKILLS_DIR);
  for (const dir of dirs) {
    if (dir.endsWith('-gateway')) {
      const skillFile = path.join(SKILLS_DIR, dir, 'skill.md');
      if (fs.existsSync(skillFile)) {
        const content = fs.readFileSync(skillFile, 'utf8');
        const triggers = extractTriggers(content);
        if (triggers.length > 0) {
          gateways[dir] = triggers;
        }
      }
    }
  }

  return gateways;
}

function main() {
  const gatewayName = process.argv[2];

  if (!gatewayName) {
    console.error('Usage: node collision-check.cjs <gateway-name>');
    process.exit(1);
  }

  const skillFile = path.join(SKILLS_DIR, gatewayName, 'skill.md');
  if (!fs.existsSync(skillFile)) {
    console.error(`Error: Gateway not found at ${path.join(SKILLS_DIR, gatewayName)}`);
    process.exit(1);
  }

  const content = fs.readFileSync(skillFile, 'utf8');
  const newTriggers = extractTriggers(content);

  if (newTriggers.length === 0) {
    console.error('Error: No trigger phrases found in gateway description');
    process.exit(1);
  }

  const allGateways = findAllGateways();
  delete allGateways[gatewayName];

  console.log(`Collision Report for ${gatewayName}`);
  console.log('='.repeat(50));
  console.log(`Triggers analyzed: ${JSON.stringify(newTriggers)}`);
  console.log('');

  const collisions = [];

  for (const newTrigger of newTriggers) {
    for (const [existingGateway, existingTriggers] of Object.entries(allGateways)) {
      for (const existingTrigger of existingTriggers) {
        const score = collisionScore(newTrigger, existingTrigger);
        if (score >= 0.3) {
          collisions.push({
            newTrigger,
            existingGateway,
            existingTrigger,
            score,
            action: score >= 0.7 ? 'BLOCK' : 'WARN'
          });
        }
      }
    }
  }

  if (collisions.length === 0) {
    console.log('✓ No collisions detected');
    console.log('');
    console.log('Result: PASS');
    process.exit(0);
  }

  console.log(`Conflicts found: ${collisions.length}`);
  console.log('');
  console.log('| Trigger | Conflicts With | Gateway | Score | Action |');
  console.log('|---------|----------------|---------|-------|--------|');

  const blocks = [];
  const warns = [];
  const suggestedNonTriggers = new Set();

  for (const c of collisions) {
    console.log(`| ${c.newTrigger} | ${c.existingTrigger} | ${c.existingGateway} | ${c.score} | ${c.action} |`);

    if (c.action === 'BLOCK') {
      blocks.push(c);
    } else {
      warns.push(c);
      suggestedNonTriggers.add(c.existingTrigger);
    }
  }

  console.log('');

  if (suggestedNonTriggers.size > 0) {
    console.log('Suggested non-triggers to add:');
    for (const nt of suggestedNonTriggers) {
      console.log(`  - "${nt}"`);
    }
    console.log('');
  }

  if (blocks.length > 0) {
    console.log('Result: FAIL (blocked collisions detected)');
    console.log('Fix: Change trigger phrases to reduce collision score below 0.7');
    process.exit(1);
  } else {
    console.log('Result: PASS with warnings');
    console.log('Recommendation: Add non-triggers to avoid ambiguity');
    process.exit(0);
  }
}

main();
