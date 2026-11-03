# Changelog

## 0.1.2

- Preserve successful structured responses, including signed records/status, export packages, hash-bound templates/bindings and project evidence, instead of regex-redacting their contents. Refuse the exact active credential without returning response data; retain error redaction.
- Describe current Conformity Packages and separate current status accurately while retaining legacy artifacts and all v1 tool names, arguments and HTTP wrappers.
- Accept current v2 template snapshots, provenance and bounded check rules alongside strictly validated historical v1 snapshots. Accept exact check-run references; require an explicit draft role as the current API does.
- Start correctly through npm binary symlinks and canonical filesystem aliases.
- Preserve the three-tool public gateway; derive its health inventory from the actual served catalog.

Version entries describe package behavior, not registry availability. Check the exact npm version before installation; MCP Registry metadata has an independent version.

## 0.1.1 — existing immutable npm publication

Public discovery additions to the original route-driven v1 adapter. Historical release evidence remains dated in the repository; it does not establish authenticated integration acceptance.
