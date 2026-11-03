# Distribution status

Updated 2026-11-02 for n8n. Other channel evidence retains its original observation date. Publication and live customer integration are separate milestones.

| Channel | Verified state |
| --- | --- |
| GitHub | Public integration repository with MCP adapter, n8n preparation/submission/status examples and provider guidance |
| npm | Current public metadata: prooftask-mcp@0.1.1; source 0.1.2 remains unpublished. See dated verification below. |
| Official MCP Registry | Current public metadata: active/latest server 0.1.4, npm 0.1.1, existing hosted URL. |
| n8n | Not currently verified as published. The owner supplied a 2026-11-02 rejection email; listing #21159 and the official API return 404. Earlier published observations below are historical. The corrected lifecycle candidate was resubmitted to #21159 on 2026-11-02; authenticated Creator Portal shows UNDER REVIEW. Native Google Sheets/Slack nodes passed local API simulations and two browser runs. Marketplace approval and live vendor authorization/delivery remain unverified. |
| Service providers | Public onboarding guidance; no outreach or adoption claimed |
| Public customer cases | Requires real projects and bilateral approval |

## MCP observation — 2026-11-04

Public npm metadata currently reports latest `prooftask-mcp@0.1.1`; 0.1.2 is absent.
The official registry currently reports active/latest server metadata 0.1.4 with
npm 0.1.1 and the hosted public URL. These observations supersede older dated MCP
release observations below, which remain historical.

Hosted health reports `ok`, exactly three public tools, `privateTools:false`, commit
`cee21fd6f357a218f948470347d0815fb1685fa4` and deployment
`57864952-bdae-4f3d-bb4d-af19f923a5ae`. PR10 source/gateway fixes are separate from
unpublished npm 0.1.2; active npm/registry pins remain unchanged. Verify the deployed
commit after source rollout. See [phase and release requirements](MCP_0.1.2_CANDIDATE.md).

## Publication evidence (historical observations)

- n8n [official template API](https://api.n8n.io/templates/workflows/21159), observed 2026-10-28: published JSON equals `channels/n8n-prepare-client-delivery.json` after normalizing object key order. The owner previously observed publication date 2026-10-20 in the Creator Portal. No resubmission or marketplace approval is claimed for the separate status-sync example.

- [Successful manual OIDC publish run](https://github.com/cognitive-emergence/prooftask-integrations/actions/runs/39044145410), source commit 2b680a9456d1e6b3e46b59aca355036a4ddeea9d.
- [Official Registry API record](https://registry.modelcontextprotocol.io/v0.1/servers?search=io.github.cognitive-emergence%2Fprooftask): name, version, npm identifier and stdio transport match the reviewed manifest. Published at 2026-10-17T15:14:20.359108Z.
- Manual workflow uses repository OIDC, contents:read and id-token:write, a five-minute limit and no stored publisher credentials. It does not deploy the Prooftask product.

## Verified anonymous discovery release — 2026-10-18 Asia/Shanghai

- npm `prooftask-mcp@0.1.1` was independently installed; 23 default read-only tools, public capabilities and anonymous MCP search/exact-version digest reads passed. Private reads without credentials remain blocked. No business writes.
- Official MCP Registry `io.github.cognitive-emergence/prooftask` version `0.1.1` is active/latest, published at `2026-10-17T16:39:21.943977Z`. Manual publication: https://github.com/cognitive-emergence/prooftask-integrations/actions/runs/39050346781 . Existing permissions, publisher checksum and five-minute job limit were preserved; only the reviewed version target changed.
- `remote/` contains a public-only Streamable HTTP gateway candidate tested with the official SDK client. It is not deployed and does not expose private operations. Standard private remote authorization and real external-product journey validation remain pending.
- Website catalog synchronization is tracked in https://github.com/cognitive-emergence/prooftask/pull/536; its merge and exact production verification are separate from npm/Registry release.
