# Prooftask MCP adapter

Dependency-free Node.js 24+ stdio adapter for delivery agreements, client acceptance and verifiable records.

Public hosted discovery is **free**: no credential is needed for `getAgentCapabilities`, `searchPublicSpecifications` or `getPublicSpecification`. Issued records and signing services have separate [product pricing](https://prooftask.com/pricing).

[中文入口与验收清单](https://prooftask.com/zh) · [n8n handover](https://prooftask.com/guides/n8n-handover-checklist) · [AI support acceptance](https://prooftask.com/guides/ai-chatbot-acceptance) · [Project handover](https://prooftask.com/guides/project-handover-checklist)

## Bitcoin time proof

For `createProject` or `prepareExternalDraft`, set `body.bitcoinTimeProof`.
For `createProposal` or `updateProposal`, set `body.terms.bitcoinTimeProof`.
Omit the field or send `false` for baseline timestamps only. Send `true` only
when the creator chooses an additional Bitcoin time proof for the issued record.
A draft proposes the choice for review. Public registration is independent.

## Version 0.1.4 and setup

Version 0.1.4 preserves the existing 45-tool catalog, 23 read-only tools and
`{httpStatus,data}` response wrapper. It remains separate from the website's
independently versioned task-level tools. Version behavior in this document does
not establish registry availability; check the exact version before installation:

```sh
npm view prooftask-mcp@0.1.4 version --registry=https://registry.npmjs.org
```

If that lookup succeeds, configure an MCP client to launch `npx` with arguments
`["-y", "prooftask-mcp@0.1.4"]`, or install and launch the CLI:

```sh
npm install prooftask-mcp@0.1.4
./node_modules/.bin/prooftask-mcp
```

For a repository checkout, run this command from the repository root instead:

```sh
node mcp/agent-mcp.mjs
```

For a manually unpacked npm tarball, run `node /absolute/path/to/package/agent-mcp.mjs`.
For MCP client configuration, use the absolute checkout/package path; `mcp/` is a
repository directory and is not part of the installed package path. The stdio
process waits for an MCP client; it is not an interactive shell command.

The local adapter exposes 23 read-only tools by default. Three public tools need no credential:

1. `getAgentCapabilities`: read available connection and workflow capabilities.
2. `searchPublicSpecifications`: `{"query":{"q":"automation"}}`. Find a matching scenario; broaden a query if no items match.
3. `getPublicSpecification`: `{"path":{"id":"business-automation"},"query":{"version":2}}`. Use the actual slug and version returned by search; compare the digest.

Review completion criteria and evidence with the user. Templates are editable examples, not independent certification. If the fit is appropriate, link to the returned template on https://prooftask.com/specifications and let the user review it.

## Record exports and verification

Use `exportResultPackage` with the scoped project ID, expected agreement digest,
expected event hash and a fresh UUID v4 nonce. It calls `POST /projects/{id}/exports/record`.
Save `structuredContent.data` intact, including the signed status and any registration proof.
Use `verifyRecordOffline` from `@prooftask/sdk@0.1.4` with independently trusted issuer keys.
Check the issuance state and the verification report before relying on the file.
`exportLegacyRecord` and `getRecord` read the service's result file via `GET /projects/{id}/record`.

On `createProject`, omit `jurisdictionProfile` to use the current generic rules or supply the exact
ID, version and digest shown during agreement preparation. Include `relatedReferences` to cite other
agreements or records. Set `publicRegistration` to true to register the record. Bitcoin time proof
has a separate `bitcoinTimeProof` switch, which defaults to false.

Successful structured responses containing the exact active configured credential are refused with a
generic error before return. Arbitrary token-like labels or base64url strings are
preserved, including digest-bound template/binding and project fields. Non-success error text still receives credential redaction. This is transport integrity, not signature verification. Verify current
artifacts offline with independently confirmed issuer keys; pre-release formats
require the frozen legacy verifier. See the [current verification guide](https://prooftask.com/developers/agent-workflows.md).

## Private business integration

Complete the existing [Agent connection](https://prooftask.com/developers) outside model context and configure `PROOFTASK_AGENT_TOKEN_FILE` locally. Credentials must not enter prompts or tool arguments. `listUsableTemplates` remains authenticated and is separate from public search.

Call `getAgent` to confirm workspace and scope. Saved jobs, current authorization and exact request IDs govern deliberate business writes. Writes require `PROOFTASK_MCP_ALLOW_WRITES=1`, exact request approval and server-side authority. Signing and payment remain human actions.

## Validate a repository checkout

The following commands require the full repository and run from its root; test
files and the public check script are not included in the npm package.

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

This endpoint exposes only `getAgentCapabilities`, `searchPublicSpecifications` and `getPublicSpecification`. It needs no credential and cannot access private projects or perform business writes. See the [remote service guide](https://github.com/cognitive-emergence/prooftask-integrations/blob/main/remote/README.md).

The npm adapter remains local stdio. Private project access requires the separate scoped Agent connection described above; the public endpoint does not provide hosted private access or remote authorization.

Version 0.1.1 retains its earlier export-redaction behavior; upgrading source files does not repair an installed copy. Install the intended exact version and verify its contents. The official MCP Registry uses an independently versioned server record; check its current entry for metadata versions. The website's downloadable catalog may differ from the npm distribution during release.
