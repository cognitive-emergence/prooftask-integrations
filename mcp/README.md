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

Published [prooftask-mcp@0.1.0](https://www.npmjs.com/package/prooftask-mcp) is independently installable. Its installed stdio handshake exposes 21 read-only tools by default. Run it with Node.js 24+ using `npx -y prooftask-mcp@0.1.0`.

The [official MCP Registry record](https://registry.modelcontextprotocol.io/v0.1/servers?search=io.github.cognitive-emergence%2Fprooftask) lists `io.github.cognitive-emergence/prooftask` version `0.1.0` as active/latest. [Publication evidence](../channels/STATUS.md).
