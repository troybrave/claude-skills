# MCP Server Troubleshooting Guide

## Common Issues and Solutions

### Issue: Server Not Appearing in Available Tools

**Symptoms:**
- MCP server configured but tools not showing up
- No errors in logs

**Solutions:**
1. Restart Claude Code/Desktop
2. Check JSON syntax in config file
3. Verify `mcpServers` object structure:
   ```json
   {
     "mcpServers": {
       "server-name": {
         "command": "node",
         "args": ["/path/to/server.js"]
       }
     }
   }
   ```
4. Check server name doesn't conflict with existing server

### Issue: "Command not found" Error

**Symptoms:**
- Error: `command not found: node` or `command not found: npx`

**Solutions:**
1. Verify Node.js is installed: `node --version`
2. Use full path to executable:
   ```json
   "command": "/usr/local/bin/node"
   ```
3. Check PATH environment variable includes Node.js
4. For npx, ensure npm is installed: `npm --version`

### Issue: Module Not Found Error

**Symptoms:**
- Error: `Cannot find module '@modelcontextprotocol/sdk'`
- Server script errors on startup

**Solutions:**
1. Navigate to server directory
2. Install dependencies: `npm install`
3. Verify `node_modules` folder exists
4. Check package.json for required dependencies
5. For global npm packages: `npm install -g <package>`

### Issue: Environment Variable Not Set

**Symptoms:**
- Error: `API key not found`
- Authentication failures

**Solutions:**
1. Set in config file:
   ```json
   {
     "command": "node",
     "args": ["/path/to/server.js"],
     "env": {
       "API_KEY": "your-key-here"
     }
   }
   ```
2. For sensitive data, use shell expansion:
   ```json
   "env": {
     "API_KEY": "${API_KEY}"
   }
   ```
3. Set in shell profile (~/.zshrc or ~/.bashrc)
4. Restart Claude after setting environment variables

### Issue: Permission Denied

**Symptoms:**
- Error: `EACCES: permission denied`
- Cannot execute server script

**Solutions:**
1. Make script executable:
   ```bash
   chmod +x /path/to/server.js
   ```
2. Check file ownership: `ls -l /path/to/server.js`
3. Verify read permissions on directory
4. For Python: ensure virtualenv is activated if used

### Issue: Server Starts Then Immediately Exits

**Symptoms:**
- Server appears briefly then disappears
- No error message visible

**Solutions:**
1. Run server manually to see errors:
   ```bash
   node /path/to/server.js
   ```
2. Check server logs in working directory
3. Verify all dependencies are installed
4. Check for uncaught exceptions in server code
5. Add verbose logging to server startup

### Issue: Tools Available But Not Working

**Symptoms:**
- Server connected, tools listed
- Tool calls fail or return errors

**Solutions:**
1. Check tool-specific API keys/credentials
2. Verify network connectivity if tool requires external API
3. Check tool-specific logs for errors
4. Test tool outside of Claude to isolate issue
5. Verify tool parameters match expected schema

### Issue: Configuration Changes Not Taking Effect

**Symptoms:**
- Modified config but no change in behavior
- Old servers still appearing

**Solutions:**
1. Completely quit and restart Claude
2. Verify editing correct config file
3. Check for syntax errors preventing config load
4. Look for duplicate config files
5. Clear cache if applicable

### Issue: Server Works Locally But Not in Claude

**Symptoms:**
- Manual execution works
- Fails when Claude invokes it

**Solutions:**
1. Check working directory in config:
   ```json
   {
     "command": "node",
     "args": ["/path/to/server.js"],
     "cwd": "/path/to/server/directory"
   }
   ```
2. Verify relative paths resolve correctly from cwd
3. Check environment variables available to Claude
4. Ensure no interactive prompts in server startup

## Diagnostic Commands

### Check Node.js Environment
```bash
node --version
npm --version
which node
echo $PATH
```

### Test Server Manually
```bash
# For Node.js servers
node /path/to/server.js

# For Python servers
python3 /path/to/server.py

# For npx servers
npx -y @modelcontextprotocol/server-name
```

### Validate JSON Config
```bash
# Check JSON syntax
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json | python3 -m json.tool
```

### Check File Permissions
```bash
ls -la /path/to/server.js
ls -la /path/to/server/directory
```

## Getting Help

If issues persist:
1. Check MCP server documentation
2. Review server GitHub issues
3. Enable debug logging in server config
4. Test with minimal configuration
5. Check Anthropic documentation for MCP updates
