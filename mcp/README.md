# Prooftask MCP adapter

Dependency-free Node.js 24+ stdio adapter for delivery agreements, client acceptance and verifiable records.

## Start without an account

```sh
npx -y prooftask-mcp@0.1.1
```

Version 0.1.1 exposes 23 read-only tools by default. Three public tools need no credential:

1. `getAgentCapabilities`: read available connection and workflow capabilities.
2. `searchPublicSpecifications`: `{"query":{"q":"automation"}}`. Find a matching scenario; broaden a query if no items match.
3. `getPublicSpecification`: `{"path":{"id":"business-automation"},"query":{"version":2}}`. Use the actual slug and version returned by search; compare the digest.

Review completion criteria and evidence with the user. Templates are editable examples, not independent certification. If the fit is appropriate, link to the returned template on https://prooftask.com/specifications and let the user review it.

Published npm 0.1.1 was independently installed and verified on 2026-10-18 (Asia/Shanghai): 23 tools, public capability read, anonymous MCP template search, exact-version/digest read and blocked private read. No business writes. The packaged README was written during publication preparation; this repository records the verified release status.

## Private business integration

Complete the existing [Agent connection](https://prooftask.com/developers) outside model context and configure `PROOFTASK_AGENT_TOKEN_FILE` locally. Credentials must not enter prompts or tool arguments. `listUsableTemplates` remains authenticated and is separate from public search.

Call `getAgent` to confirm workspace and scope. Saved jobs, current authorization and exact request IDs govern deliberate business writes. Writes require `PROOFTASK_MCP_ALLOW_WRITES=1`, exact request approval and server-side authority. Signing and payment remain human actions.

## Validate

```sh
node --test tests/public-mcp.test.mjs
node agent/public-mcp-check.mjs
```

The second command makes anonymous production reads: search, exact version/digest read and a blocked private read. It loads no credential and makes no business write.

## Hosted public discovery

Clients supporting Streamable HTTP can connect without installing the adapter:

```json
{"mcpServers":{"prooftask-public":{"url":"https://prooftask-public-mcp-production.up.railway.app/mcp"}}}
```

This endpoint exposes only `getAgentCapabilities`, `searchPublicSpecifications` and `getPublicSpecification`. It needs no credential and cannot access private projects or perform business writes. See the [remote service guide](../remote/README.md).

The npm adapter remains local stdio. Private project access requires the separate scoped Agent connection described above; the public endpoint does not provide hosted private access or remote authorization.

The existing npm 0.1.1 package can contain an older README. This corrected repository guide does not retroactively replace immutable package contents. The official MCP Registry uses an independently versioned server record; check its current entry for metadata versions. The website's downloadable catalog may differ from the npm distribution during release.
