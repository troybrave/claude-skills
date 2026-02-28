#!/usr/bin/env node
/**
 * Initialize a new gateway skill
 *
 * Usage: node init-gateway.cjs <service-name> --type=<mcp|cli|http>
 *
 * Creates:
 *   ~/.claude/skills/<service>-gateway/
 *   ├── skill.md           (from appropriate template)
 *   ├── state.json         (initial state)
 *   └── discovery.json     (empty, for MCP only)
 */

const fs = require('fs');
const path = require('path');

const SKILLS_DIR = '/Users/troybrave/.claude/skills';
const TEMPLATES_DIR = path.join(SKILLS_DIR, 'gateway-skill-creator/templates');

function main() {
  const args = process.argv.slice(2);
  const serviceName = args.find(a => !a.startsWith('--'));
  const typeArg = args.find(a => a.startsWith('--type='));
  const type = typeArg ? typeArg.split('=')[1] : null;

  // 1. Validate service name
  if (!serviceName) {
    console.error('Error: Service name required');
    console.error('Usage: node init-gateway.cjs <service-name> --type=<mcp|cli|http>');
    process.exit(1);
  }

  if (!/^[a-z0-9-]+$/.test(serviceName)) {
    console.error('Error: Service name must be lowercase letters, numbers, and hyphens only');
    process.exit(1);
  }

  // 2. Validate type
  if (!['mcp', 'cli', 'http'].includes(type)) {
    console.error('Error: --type must be mcp, cli, or http');
    process.exit(1);
  }

  // 3. Check skill doesn't already exist
  const skillDir = path.join(SKILLS_DIR, `${serviceName}-gateway`);
  if (fs.existsSync(skillDir)) {
    console.error(`Error: Skill already exists at ${skillDir}`);
    process.exit(1);
  }

  // 4. Create directory and logs subdirectory
  fs.mkdirSync(skillDir, { recursive: true });
  fs.mkdirSync(path.join(skillDir, 'logs'), { recursive: true });

  // 5. Copy appropriate template
  const templateFile = path.join(TEMPLATES_DIR, `${type}-gateway.md`);
  if (!fs.existsSync(templateFile)) {
    console.error(`Error: Template not found at ${templateFile}`);
    process.exit(1);
  }

  const skillFile = path.join(skillDir, 'skill.md');
  let template = fs.readFileSync(templateFile, 'utf8');

  // 6. Replace basic placeholders
  const ServiceName = serviceName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  template = template.replace(/\{service\}/g, serviceName);
  template = template.replace(/\{Service\}/g, ServiceName);

  fs.writeFileSync(skillFile, template);

  // 7. Create initial state.json
  const stateFile = path.join(skillDir, 'state.json');
  const initialState = {
    version: '2.3',
    lifecycle_mode: type === 'mcp' ? 'auto' : 'gateway_managed',
    pid: null,
    last_used: null,
    entity_cache: {}
  };
  fs.writeFileSync(stateFile, JSON.stringify(initialState, null, 2));

  // 8. Create empty discovery.json (for MCP gateways)
  if (type === 'mcp') {
    const discoveryFile = path.join(skillDir, 'discovery.json');
    const emptyDiscovery = {
      version: '2.3',
      discovered_at: null,
      tools: [],
      resolver_tools: {}
    };
    fs.writeFileSync(discoveryFile, JSON.stringify(emptyDiscovery, null, 2));
  }

  // 9. Print success
  console.log(`✓ Created ${serviceName}-gateway at ${skillDir}`);
  console.log(`  Type: ${type}`);
  console.log(`  Lifecycle: ${initialState.lifecycle_mode}`);
  console.log('');
  console.log('Next steps:');
  console.log(`1. Edit ${skillFile} to customize triggers and operations`);
  if (type === 'mcp') {
    console.log(`2. Run discovery: node discovery.cjs ${serviceName}`);
  } else if (type === 'cli') {
    console.log(`2. Update cli_path in skill.md`);
    console.log(`3. Read the CLI's HELP.md for available commands`);
  } else if (type === 'http') {
    console.log(`2. Update base_url and auth config in skill.md`);
    console.log(`3. Document available endpoints`);
  }
  console.log(`3. Run validation: node validate-gateway.cjs ${serviceName}-gateway`);
  console.log(`4. Run collision check: node collision-check.cjs ${serviceName}-gateway`);
}

main();
