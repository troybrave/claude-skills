#!/usr/bin/env node
/**
 * Run MCP tool discovery for a gateway
 *
 * Usage: node discovery.cjs <service-name>
 *
 * This script helps document MCP tools by:
 * 1. Reading existing discovery.json if present
 * 2. Providing a template for manual tool documentation
 * 3. Updating discovery.json with tool information
 *
 * Note: Actual ToolSearch must be run by Claude during skill execution.
 * This script provides the structure for documenting discovered tools.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const SKILLS_DIR = path.join(os.homedir(), '.claude/skills');

function main() {
  const serviceName = process.argv[2];

  if (!serviceName) {
    console.error('Usage: node discovery.cjs <service-name>');
    console.error('');
    console.error('This creates/updates discovery.json for an MCP gateway.');
    process.exit(1);
  }

  const gatewayName = `${serviceName}-gateway`;
  const skillDir = path.join(SKILLS_DIR, gatewayName);
  const discoveryFile = path.join(skillDir, 'discovery.json');

  if (!fs.existsSync(skillDir)) {
    console.error(`Error: Gateway not found at ${skillDir}`);
    console.error('Run init-gateway.cjs first to create the gateway.');
    process.exit(1);
  }

  let discovery;
  if (fs.existsSync(discoveryFile)) {
    discovery = JSON.parse(fs.readFileSync(discoveryFile, 'utf8'));
    console.log(`Updating existing discovery.json (${discovery.tools.length} tools found)`);
  } else {
    discovery = {
      version: '2.3',
      discovered_at: null,
      tools: [],
      resolver_tools: {}
    };
    console.log('Creating new discovery.json');
  }

  discovery.discovered_at = new Date().toISOString();

  if (discovery.tools.length === 0) {
    console.log('');
    console.log('No tools discovered yet. To add tools:');
    console.log('');
    console.log('1. Run ToolSearch in Claude Code:');
    console.log(`   ToolSearch query: "+${serviceName}"`);
    console.log('');
    console.log('2. For each tool found, add an entry like:');
    console.log('');
    console.log(JSON.stringify({
      tool_name: `mcp__${serviceName}__example_tool`,
      operation_id: 'example_operation',
      description: 'What this tool does',
      parameters: {
        param1: { type: 'string', required: true },
        param2: { type: 'string', required: false }
      }
    }, null, 2));
    console.log('');
    console.log('3. For entity resolution, add resolver_tools:');
    console.log('');
    console.log(JSON.stringify({
      chat_id: {
        tool: `mcp__${serviceName}__search_contacts`,
        search_param: 'query',
        result_path: 'contacts[].id',
        display_path: 'contacts[].name'
      }
    }, null, 2));
  }

  fs.writeFileSync(discoveryFile, JSON.stringify(discovery, null, 2));
  console.log('');
  console.log(`✓ Updated ${discoveryFile}`);

  if (discovery.tools.length > 0) {
    console.log('');
    console.log('Discovered tools:');
    for (const tool of discovery.tools) {
      console.log(`  - ${tool.tool_name} (${tool.operation_id})`);
    }
  }
}

main();
