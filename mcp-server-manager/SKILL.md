---
name: mcp-server-manager
description: Manages MCP server configurations, tests connections, validates setups, and troubleshoots issues. Use when working with MCP servers, checking server status, fixing MCP connection problems, or setting up new MCP integrations.
version: "1.0.0"
---

# MCP Server Manager

This skill helps you manage Model Context Protocol (MCP) servers efficiently, including testing connections, validating configurations, troubleshooting issues, and setting up new servers.

## When This Skill Activates

- User asks about MCP server status or health
- User mentions MCP connection problems
- User wants to add/configure MCP servers
- User needs to validate MCP setup
- User troubleshoots MCP-related issues
- User asks "what MCP servers do I have?"

## Quick Actions

### Check MCP Server Status

To see all configured MCP servers:
1. Read the MCP config using the `/runconfig` slash command
2. Parse the configuration to list all servers
3. Report server names, types, and connection status

### Test MCP Server Connection

For testing a specific server:
1. Locate server configuration in Claude Code settings
2. Attempt to connect using appropriate method
3. Report connection success/failure with diagnostic info
4. If failure, provide troubleshooting steps from TROUBLESHOOTING.md

### Validate MCP Configuration

To validate MCP server configs:
1. Check JSON syntax in configuration files
2. Verify required fields are present
3. Check file paths and executables exist
4. Validate environment variables are set
5. Run validation script: `python3 scripts/validate_mcp.py <config-file>`

### Add New MCP Server

When adding a new MCP server:
1. Ask user for server type (stdio, SSE, or custom)
2. Generate configuration template from TEMPLATES.md
3. Guide user through required parameters
4. Add to appropriate config location
5. Test connection
6. Document the server purpose and usage

## Configuration File Locations

MCP servers are typically configured in:
- **Claude Desktop**: `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)
- **Claude Code**: Project-specific or global settings
- **Your MCP Servers**: `~/.claude/.MCP/` - All your custom MCP server implementations
- **Custom locations**: User may specify

## Progressive Disclosure

For detailed information:
- **Server templates**: See TEMPLATES.md for config examples
- **Troubleshooting**: See TROUBLESHOOTING.md for common issues
- **Advanced setup**: See ADVANCED.md for complex scenarios

## Validation Workflow

When validating or troubleshooting:

1. **Check configuration syntax**
   - Valid JSON format
   - Required fields present
   - Proper nesting and structure

2. **Verify paths and executables**
   - Node.js/Python executables exist
   - Server scripts are accessible
   - Working directories are valid

3. **Test environment**
   - Required environment variables set
   - Dependencies installed
   - Permissions correct

4. **Attempt connection**
   - Start server process
   - Check for errors in output
   - Verify tools are available

5. **Report results**
   - Clear success/failure status
   - Actionable next steps if failed
   - Documentation of what works

## Output Format

Always provide clear, actionable information:

```
✅ Server Name: [name]
   Type: [stdio/SSE]
   Status: [Connected/Failed]
   Tools: [list of available tools]

❌ Server Name: [name]
   Type: [stdio/SSE]
   Status: Failed
   Error: [specific error message]
   Fix: [specific troubleshooting step]
```

## Best Practices

- Always validate before making changes
- Back up configurations before modifying
- Test one server at a time when troubleshooting
- Document custom servers for team reference
- Keep server purposes clear in descriptions

## Error Handling

If you encounter errors:
1. Read the full error message
2. Check TROUBLESHOOTING.md for known issues
3. Validate configuration syntax
4. Verify all paths and dependencies
5. Provide specific, actionable fixes

## Notes

- MCP servers require proper Node.js or Python environments
- Some servers need API keys or credentials in environment variables
- Server stdout/stderr provides valuable diagnostic information
- Configuration changes may require Claude restart
