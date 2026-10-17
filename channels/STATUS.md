# Distribution status

Updated 2026-10-17. Availability, publication and approval are separate milestones.

| Channel | Prepared asset | Verified state |
| --- | --- | --- |
| GitHub | This curated public integration repository | Read repository visibility and commit history for publication state |
| n8n | Four inactive importable workflows, setup guide and submission description | Export syntax and graph validated; no local n8n-engine or marketplace approval claimed; Creator Portal requires sign-in |
| MCP clients | Local stdio adapter, adjacent catalog and setup instructions | Actual stdio initialize/tools-list check passes with read-only defaults; no third-party client acceptance claimed |
| npm | mcp/package.json | Package metadata prepared; local npm session is not authenticated; no package publication claimed |
| Official MCP Registry | mcp/server.json.example | Metadata prepared; npm publication and publisher namespace authentication must precede submission |
| Service providers | providers/README.md | Public onboarding guidance; no outreach sent and no customer adoption claimed |
| Public customer cases | Existing Prooftask bilateral publication mechanism | Requires real projects and both parties' approval of the exact public projection |

## Publish the MCP package when the account is ready

Confirm ownership and availability of the `prooftask-mcp` npm name, the package's reuse license and the `io.github.cognitive-emergence/prooftask` registry namespace. Then inspect `npm pack --dry-run`, authenticate to npm, publish the reviewed package and verify its installed contents. Publishing a package is not registry acceptance.

The official registry quickstart requires the npm package to exist first and its `mcpName` to match the registry name. Use the official `mcp-publisher` and verify the namespace before submitting `server.json.example` as the reviewed manifest. Do not add a fictitious hosted MCP URL.

## Sources

- https://support.n8n.io/article/becoming-an-n8n-template-creator-and-getting-help
- https://github.com/modelcontextprotocol/registry/blob/main/docs/modelcontextprotocol-io/quickstart.mdx
