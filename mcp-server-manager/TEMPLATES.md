# MCP Server Configuration Templates

## Basic STDIO Server Template

```json
{
  "mcpServers": {
    "server-name": {
      "command": "node",
      "args": ["/path/to/server/index.js"]
    }
  }
}
```

## STDIO Server with Environment Variables

```json
{
  "mcpServers": {
    "server-name": {
      "command": "node",
      "args": ["/path/to/server/index.js"],
      "env": {
        "API_KEY": "your-api-key-here",
        "DEBUG": "true"
      }
    }
  }
}
```

## STDIO Server with Working Directory

```json
{
  "mcpServers": {
    "server-name": {
      "command": "node",
      "args": ["index.js"],
      "cwd": "/path/to/server/directory"
    }
  }
}
```

## NPX-Based Server Template

```json
{
  "mcpServers": {
    "server-name": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-package-name"]
    }
  }
}
```

## Python Server Template

```json
{
  "mcpServers": {
    "server-name": {
      "command": "python3",
      "args": ["/path/to/server.py"],
      "env": {
        "PYTHONPATH": "/path/to/dependencies"
      }
    }
  }
}
```

## Python Server with Virtual Environment

```json
{
  "mcpServers": {
    "server-name": {
      "command": "/path/to/venv/bin/python",
      "args": ["/path/to/server.py"]
    }
  }
}
```

## Server with Shell Script Wrapper

```json
{
  "mcpServers": {
    "server-name": {
      "command": "/bin/bash",
      "args": ["/path/to/start-server.sh"]
    }
  }
}
```

## Common MCP Servers

### Filesystem Server
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/allowed/directory"]
    }
  }
}
```

### GitHub Server
```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your-token-here"
      }
    }
  }
}
```

### Google Drive Server
```json
{
  "mcpServers": {
    "google-drive": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-gdrive"],
      "env": {
        "GOOGLE_CLIENT_ID": "your-client-id",
        "GOOGLE_CLIENT_SECRET": "your-client-secret"
      }
    }
  }
}
```

### Memory Server
```json
{
  "mcpServers": {
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    }
  }
}
```

### Brave Search Server
```json
{
  "mcpServers": {
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-brave-search"],
      "env": {
        "BRAVE_API_KEY": "your-brave-api-key"
      }
    }
  }
}
```

### Postgres Server
```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres", "postgresql://user:password@localhost/dbname"]
    }
  }
}
```

### Slack Server
```json
{
  "mcpServers": {
    "slack": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-slack"],
      "env": {
        "SLACK_BOT_TOKEN": "xoxb-your-token",
        "SLACK_TEAM_ID": "your-team-id"
      }
    }
  }
}
```

## Your Custom MCP Servers

Based on your environment, you have custom MCP servers in `~/.claude/.MCP/`:

### Email MCP Server
```json
{
  "mcpServers": {
    "email": {
      "command": "node",
      "args": ["cli.js"],
      "cwd": "/Users/troybrave/.claude/.MCP/email-mcp"
    }
  }
}
```

### Other Available Custom Servers
All located in `~/.claude/.MCP/`:
- `airtable-mcp` - Airtable integration
- `calendar-mcp` - Calendar management
- `gdrive-mcp` - Google Drive operations
- `ghl-mcp` - GoHighLevel integration
- `logos-mcp` - Logos Bible software
- `notion-mcp` - Notion workspace
- `obsidian-mcp` - Obsidian vault access

## Complete Configuration Example

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/troybrave/Documents"]
    },
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "email": {
      "command": "node",
      "args": ["cli.js"],
      "cwd": "/path/to/email-mcp"
    }
  }
}
```

## Tips for Configuration

1. **Use absolute paths** for reliability
2. **Set environment variables** in config or shell profile
3. **Test servers manually** before adding to config
4. **Use descriptive names** for easy identification
5. **Document custom servers** with comments in README
6. **Version control** your configurations
7. **Use environment variable substitution** for secrets: `${VAR_NAME}`
8. **Restart Claude** after configuration changes
9. **Check logs** if server doesn't appear
10. **One server at a time** when troubleshooting
