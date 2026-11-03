# MCP 0.1.2 compatibility candidate

Status: LOCAL CANDIDATE — not published, pushed, submitted or released.

Base: integrations commit `883352b1fbacdff56c2391e8741929aae41588c5`.
This candidate preserves the existing catalog-v1 tool names, routes, annotations,
top-level argument envelopes and `{httpStatus,data}` MCP result wrapper. The
website's task-level v2 MCP is a separate interface and is not copied here.

## Review and local verification

```sh
node --test tests/mcp-compatibility.test.mjs tests/public-mcp.test.mjs
node scripts/check.mjs
cd remote
npm ci --ignore-scripts --no-audit --no-fund
npm test
```

The compatibility test packs npm version 0.1.2 without running lifecycle scripts,
extracts only declared package files, and actually initializes/list-tools through
both the packaged script and an npm-style binary symlink. Packing does not publish.
Synthetic complete legacy/Conformity fixtures retain only public signing keys;
checks cover original signature/file integrity, unchanged payloads and exact-active-
credential refusal. They do not establish production business acceptance.

The gateway SDK test confirms that the three public tools still work, private
authority is absent, and health reports the actual tool inventory. No deployed
service change is claimed.

## Prepared future-release files

- `mcp/package.json`: npm candidate 0.1.2.
- Both MCP client JSON examples: future `prooftask-mcp@0.1.2` pin.
- `mcp/server.json.example`: registry metadata candidate 0.1.5, npm package 0.1.2.
- README/CHANGELOG: explicit candidate status; old 0.1.1 evidence remains historical.
- `ASSET_PROVENANCE.json`: original retrieval/hashes retained, local backports and
  source commit recorded separately; current file hashes do not pretend to be an
  unchanged upstream download.

No immutable 0.1.1 package is repaired by these local changes. A separately
reviewed release must publish npm 0.1.2 before distributing its npx pins, then
review/update registry metadata and verify the actual installed package and
hosted gateway independently. This document authorizes none of those actions.

The active registry publication workflow remains unchanged. Its reviewed assertions
currently require server metadata 0.1.4/npm 0.1.1 and will reject this candidate.
Before any future authorized publication, separately review the two version-only
assertion changes to 0.1.5/0.1.2; preserve its trigger, permissions, pinned publisher
checksum and all other metadata checks. The older workflow example in `channels/`
is historical and is not a release command.

## Deliberate limits

This is a focused input-schema backport, not a claim of full API 1.11 feature parity.
New draft HOLDER-signing and trust-policy options remain outside the old catalog;
their conditional validation requires a separate change. No permissions, signatures,
acceptance decisions or payment behavior are added. Record/Status signatures still
require independent issuer trust and offline verification after download.
