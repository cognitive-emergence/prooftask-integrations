# MCP artifact fixtures

`mcp-export-artifacts.json` contains complete synthetic public artifacts generated
from an in-memory website test service at commit
`00e48889a4eb7fd3273050f98edee7e2774f20b1`. It covers legacy result-review and current
Conformity exports and their signed status observations. Only public signing keys
are retained; no private keys, account credentials or live project data are stored.

The Conformity fixture has an explicitly uncommitted extra attachment with a
`ptag_` lookalike in its path and base64url data. The original signed Record and
committed evidence remain intact. The legacy wrapper has optional public-key label
metadata with the same lookalike. These fixtures detect destructive transport
redaction without treating arbitrary prefixes as active credentials.

Tests check original signatures, file digests and exact transport preservation.
They do not establish real work quality, organizational authority or payment.
