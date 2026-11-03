# Prooftask MCP adapter

Dependency-free Node.js 24+ stdio adapter for delivery agreements, client acceptance and verifiable records.

Public hosted discovery is **free**: no credential is needed for `getAgentCapabilities`, `searchPublicSpecifications` or `getPublicSpecification`. Issued records and signing services have separate [product pricing](https://prooftask.com/pricing).

[中文入口与验收清单](https://prooftask.com/zh) · [n8n handover](https://prooftask.com/guides/n8n-handover-checklist) · [AI support acceptance](https://prooftask.com/guides/ai-chatbot-acceptance) · [Project handover](https://prooftask.com/guides/project-handover-checklist)

## Compatibility candidate 0.1.2 — not published

This checkout prepares a reviewable 0.1.2 candidate. It preserves the existing 45-tool
catalog, 23 read-only tools and `{httpStatus,data}` response wrapper; it does not
replace them with the website's separately versioned task-level tools. No npm or registry release
of this candidate is claimed. The client JSON files and registry metadata are
prepared for that future release and must not be used as evidence of availability.

Run this checkout without an account:

```sh
node mcp/agent-mcp.mjs
```

After a separately authorized npm publication, the prepared client configurations
will use `npx -y prooftask-mcp@0.1.2`. Until then, configure the absolute path to this
checkout's adapter. The published 0.1.1 remains immutable and contains the earlier
export-redaction behavior; updating this checkout does not repair installed copies.

The candidate exposes 23 read-only tools by default. Three public tools need no credential:

1. `getAgentCapabilities`: read available connection and workflow capabilities.
2. `searchPublicSpecifications`: `{"query":{"q":"automation"}}`. Find a matching scenario; broaden a query if no items match.
3. `getPublicSpecification`: `{"path":{"id":"business-automation"},"query":{"version":2}}`. Use the actual slug and version returned by search; compare the digest.

Review completion criteria and evidence with the user. Templates are editable examples, not independent certification. If the fit is appropriate, link to the returned template on https://prooftask.com/specifications and let the user review it.

Published npm 0.1.1 was independently installed and verified on 2026-10-18 (Asia/Shanghai): 23 tools, public capability read, anonymous MCP template search, exact-version/digest read and blocked private read. No business writes. The packaged README was written during publication preparation; this repository records the verified release status.

## Record exports and verification

`exportResultPackage` preserves the API artifact without rewriting signed strings:
current projects return a bare Conformity Package; pre-release projects return a
`prooftask.result-review/v1` wrapper. `exportLegacyRecord` also returns the current
bare Package for Conformity projects despite its historical tool name. A Package
is a historical carrier, not fresh status or a second receipt.

Use `getStatus` with a fresh UUID nonce for a separate signed current observation.
Conformity Status carries nonce and project details in
`extensions["com.prooftask.status-details"]`; legacy status uses `body`. The old
`{httpStatus,data}` MCP wrapper remains: save `structuredContent.data` as the artifact,
not the surrounding transport metadata. These tools return data rather than writing
local files; the caller controls private storage.

Successful structured responses containing the exact active configured credential are refused with a
generic error before return. Arbitrary token-like labels or base64url strings are
preserved, including digest-bound template/binding and project fields. Non-success error text still receives credential redaction. This is transport integrity, not signature verification. Verify current
artifacts offline with independently confirmed issuer keys; pre-release formats
require the frozen legacy verifier. See the [current verification guide](https://prooftask.com/developers/agent-workflows.md).

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
