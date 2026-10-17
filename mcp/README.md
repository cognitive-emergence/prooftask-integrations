# Prooftask MCP adapter

A dependency-free Node.js 24+ stdio adapter over Prooftask's existing Agent API. The server reads the adjacent tool catalog and exposes read-only tools by default.

## Run from this repository

```sh
node mcp/agent-mcp.mjs
```

Example client configuration (replace the absolute path with your checkout):

```json
{
  "mcpServers": {
    "prooftask": {
      "command": "node",
      "args": ["/absolute/path/prooftask-integrations/mcp/agent-mcp.mjs"]
    }
  }
}
```

Public discovery needs no token. For private reads, complete the [Agent connection](https://prooftask.com/developers?utm_source=partner&utm_campaign=mcp_integrations) outside model context, then configure `PROOFTASK_AGENT_TOKEN_FILE` to the private credential JSON file. Do not put credentials in prompts, tool arguments or public issues.

Writes require both explicit local opt-in (`PROOFTASK_MCP_ALLOW_WRITES=1`) and current server-side authorization. Read live capabilities and exact project state before using any write tool. This adapter does not supply authority for signing or payment.

[Live MCP guide](https://prooftask.com/developers/mcp.md) · [Live adapter](https://prooftask.com/developers/agent-mcp.mjs) · [Live catalog](https://prooftask.com/developers/agent-mcp-tools.json)

## Distribution status

The package manifest and registry metadata are prepared for publication. They are not evidence that an npm package or official MCP Registry listing exists. Until publication is independently verified, use the local checkout command above.
