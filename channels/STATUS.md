# Distribution status

Updated 2026-10-17. Availability, publication and approval are separate milestones.

| Channel | Prepared asset | Verified state |
| --- | --- | --- |
| GitHub | This curated public integration repository | Read repository visibility and commit history for publication state |
| n8n | Four inactive importable workflows, setup guide and submission description | Export syntax and graph validated; no local n8n-engine or marketplace approval claimed; Creator Portal requires sign-in |
| MCP clients | Local stdio adapter, adjacent catalog and setup instructions | Actual stdio initialize/tools-list check passes with read-only defaults; no third-party client acceptance claimed |
| npm | mcp/package.json | Package metadata prepared; Published prooftask-mcp@0.1.0; clean npm install and installed stdio handshake passed with 21 read-only tools |
| Official MCP Registry | mcp/server.json.example | Metadata prepared; GitHub public membership confirmed, but device login still grants only the personal namespace; organization publication returned 403 |
| Service providers | providers/README.md | Public onboarding guidance; no outreach sent and no customer adoption claimed |
| Public customer cases | Existing Prooftask bilateral publication mechanism | Requires real projects and both parties' approval of the exact public projection |

## Publish the MCP package when the account is ready

Confirm ownership and availability of the `prooftask-mcp` npm name, the package's reuse license and the `io.github.cognitive-emergence/prooftask` registry namespace. Then inspect `npm pack --dry-run`, authenticate to npm, publish the reviewed package and verify its installed contents. Publishing a package is not registry acceptance.

The official registry quickstart requires the npm package to exist first and its `mcpName` to match the registry name. Use the official `mcp-publisher` and verify the namespace before submitting `server.json.example` as the reviewed manifest. Do not add a fictitious hosted MCP URL.

## Sources

- https://support.n8n.io/article/becoming-an-n8n-template-creator-and-getting-help
- https://github.com/modelcontextprotocol/registry/blob/main/docs/modelcontextprotocol-io/quickstart.mdx

## Proposed organization authentication repair

GitHub public membership was enabled with the owner's explicit approval. The public GitHub API confirms the organization is visible. Reauthenticated device login still grants only io.github.schchit/*; the official authentication guide now requires proof of the organization Owner role. The private login app supplies identity but has not granted that role proof.

Prepared channels/publish-mcp-registry.workflow.yml for owner review. It is inert in this folder. Moving it into .github/workflows would add a single manual-only, main-branch registry publish job with a five-minute limit, contents:read and id-token:write. It uses GitHub OIDC, no PAT/npm credentials, and does not republish npm, alter the product repository or start periodic jobs. Public GitHub-hosted runner execution is proposed; no paid service provisioning. The exact manifest and package version are checked before publication.
