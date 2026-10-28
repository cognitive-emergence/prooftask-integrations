# Distribution status

Updated 2026-10-28 for n8n. Other channel evidence retains its original observation date. Publication and live customer integration are separate milestones.

| Channel | Verified state |
| --- | --- |
| GitHub | Public integration repository with MCP adapter, n8n preparation/submission/status examples and provider guidance |
| npm | [prooftask-mcp@0.1.0](https://www.npmjs.com/package/prooftask-mcp) published; clean installation and stdio initialize/tools-list passed with 21 read-only tools |
| Official MCP Registry | io.github.cognitive-emergence/prooftask version 0.1.0 published and independently returned as active/latest by the public API at 2026-10-17T15:14Z |
| n8n | Template [21159](https://n8n.io/workflows/21159-prepare-reviewable-client-delivery-jobs-from-google-sheets-with-prooftask-and-slack/) is published; official API returned `status=published` and `reviewStatus=published` on 2026-10-28. Its 28 execution nodes and seven notes match the repository JSON. Companion submission, event receiver and queue-status sync are separate examples; live Google Sheets/Slack production acceptance is not established. |
| Service providers | Public onboarding guidance; no outreach or adoption claimed |
| Public customer cases | Requires real projects and bilateral approval |

## Publication evidence

- n8n [official template API](https://api.n8n.io/templates/workflows/21159), observed 2026-10-28: published JSON equals `channels/n8n-prepare-client-delivery.json` after normalizing object key order. The owner previously observed publication date 2026-10-20 in the Creator Portal. No resubmission or marketplace approval is claimed for the separate status-sync example.

- [Successful manual OIDC publish run](https://github.com/cognitive-emergence/prooftask-integrations/actions/runs/39044145410), source commit 2b680a9456d1e6b3e46b59aca355036a4ddeea9d.
- [Official Registry API record](https://registry.modelcontextprotocol.io/v0.1/servers?search=io.github.cognitive-emergence%2Fprooftask): name, version, npm identifier and stdio transport match the reviewed manifest. Published at 2026-10-17T15:14:20.359108Z.
- Manual workflow uses repository OIDC, contents:read and id-token:write, a five-minute limit and no stored publisher credentials. It does not deploy the Prooftask product.

## Verified anonymous discovery release — 2026-10-18 Asia/Shanghai

- npm `prooftask-mcp@0.1.1` was independently installed; 23 default read-only tools, public capabilities and anonymous MCP search/exact-version digest reads passed. Private reads without credentials remain blocked. No business writes.
- Official MCP Registry `io.github.cognitive-emergence/prooftask` version `0.1.1` is active/latest, published at `2026-10-17T16:39:21.943977Z`. Manual publication: https://github.com/cognitive-emergence/prooftask-integrations/actions/runs/39050346781 . Existing permissions, publisher checksum and five-minute job limit were preserved; only the reviewed version target changed.
- `remote/` contains a public-only Streamable HTTP gateway candidate tested with the official SDK client. It is not deployed and does not expose private operations. Standard private remote authorization and real external-product journey validation remain pending.
- Website catalog synchronization is tracked in https://github.com/cognitive-emergence/prooftask/pull/536; its merge and exact production verification are separate from npm/Registry release.
