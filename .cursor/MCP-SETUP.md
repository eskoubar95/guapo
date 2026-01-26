# Linear MCP Setup (Optional)

If you're using Linear task mode, you may want to configure the Linear MCP server in Cursor to enable Linear integration.

## Quick Setup

1. Get your Linear API key from https://linear.app/settings/api
2. Configure MCP in Cursor Settings → Features → Model Context Protocol
3. Add Linear MCP server configuration with your API key
4. Restart Cursor

## Settings File Location

- **macOS**: `~/Library/Application Support/Cursor/User/globalStorage/rooveterinaryinc.roo-cline/settings/cline_mcp_settings.json`
- **Windows**: `%APPDATA%\Cursor\User\globalStorage\rooveterinaryinc.roo-cline\settings\cline_mcp_settings.json`
- **Linux**: `~/.config/Cursor/User/globalStorage/rooveterinaryinc.roo-cline/settings/cline_mcp_settings.json`

## Example Configuration

```json
{
  "mcpServers": {
    "guapo-linear": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-linear"],
      "env": {
        "LINEAR_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

## Guapo MCP names (source of truth)

- **Linear MCP server name:** `guapo-linear`
- **Supabase MCP server name:** `supabase`

## Known Issue: MCP Routing Conflicts

⚠️ **If you have both GitHub-MCP and Linear-MCP enabled:**

There is a known bug in Cursor where tools with the same name (e.g., `update_issue`, `list_issues`) from different MCP servers can cause routing conflicts. Cursor may route calls to the wrong server, resulting in errors like:

```
missing required parameter 'owner'
```

This happens because GitHub-MCP tools require an `owner` parameter, while Linear-MCP tools don't. When Cursor routes a Linear operation to GitHub-MCP by mistake, you'll see this error.

**Workaround:** If you encounter this issue when working with Linear tasks, temporarily disable GitHub-MCP in your MCP settings while using Linear operations. You can re-enable it when needed.

This is a known issue in the Cursor forum related to tool name collisions between MCP servers.

For more details, see [MCP Documentation](https://modelcontextprotocol.io).
