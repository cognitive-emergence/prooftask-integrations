# MCP 0.1.2 compatibility candidate

Status: DRAFT PULL REQUEST #10 — source/gateway fix under review; npm 0.1.2 remains unpublished. A source merge can deploy the public gateway independently of npm.

Base: integrations main `8e0e5f152eb653474b9aaca32f36cef18e6a7e9f`, whose tree matches the original reviewed `883352b1fbacdff56c2391e8741929aae41588c5` base.
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
- Both active MCP client JSON examples retain published `prooftask-mcp@0.1.1`.
- `mcp/server.json.example` retains active registry metadata 0.1.4/npm 0.1.1.
- Packaged README/CHANGELOG describe version behavior without claiming availability; this channel document retains unpublished status.
- `ASSET_PROVENANCE.json`: original retrieval/hashes retained, local backports and
  source commit recorded separately; current file hashes do not pretend to be an
  unchanged upstream download.

No immutable 0.1.1 package is repaired by these local changes. A separately
reviewed release must publish npm 0.1.2 before distributing its npx pins, then
review/update registry metadata and verify the actual installed package and
hosted gateway independently. This document authorizes none of those actions.

The manual registry publication workflow's two version assertions retain
server metadata 0.1.4/npm 0.1.1. Its manual trigger, permissions, pinned publisher
checksum and all other metadata checks remain unchanged. The download URL now names
immutable publisher v1.8.1, whose downloaded bytes and official asset digest both
match the existing SHA256 `a06c9096dcb9727c13555b6be26c7effa707b01f06a4c561ba7a3635443cf2cc`.
This repairs the mutable `latest` URL without upgrading the trusted binary. This candidate has not
dispatched publication. Publish and independently verify npm 0.1.2 before making
the registry metadata/pins the active release. The older workflow example in
`channels/` remains historical and is not a release command.

## Deliberate limits

This is a focused input-schema backport, not a claim of full API 1.11 feature parity.
New draft HOLDER-signing and trust-policy options remain outside the old catalog;
their conditional validation requires a separate change. No permissions, signatures,
acceptance decisions or payment behavior are added. Record/Status signatures still
require independent issuer trust and offline verification after download.

## Source/gateway phase and later package release

The gateway imports the source adapter/catalog directly, without installing the npm
package. Railway tracks main and watches those files plus the remote runtime, dependency
files and Dockerfile. A reviewed source merge can therefore trigger a public-only
deployment; verify its exact commit, three tools, template digest and private-tool
refusal afterward. This does not repair installed npm 0.1.1 or publish private exports.

Keep npm publication open: publish the exact reviewed 0.1.2 tarball through an
authorized route, independently install and verify it, then advance both client
pins and registry metadata/version assertions together to 0.1.2/0.1.5. No registry
dispatch is required for this source phase.
