# Distribution status

Updated 2026-11-06 for npm; n8n retains its 2026-11-02 observation. Other channel evidence retains its original observation date. Publication and live customer integration are separate milestones.

| Channel | Verified state |
| --- | --- |
| GitHub | Public integration repository with MCP adapter, n8n preparation/submission/status examples and provider guidance |
| npm | prooftask-mcp@0.1.2 published and independently installed from the public registry on 2026-11-06; see verification below. |
| Official MCP Registry | Current public metadata: active/latest server 0.1.4, npm 0.1.1, existing hosted URL. |
| n8n | Not currently verified as published. The owner supplied a 2026-11-02 rejection email; listing #21159 and the official API return 404. Earlier published observations below are historical. The corrected lifecycle candidate was resubmitted to #21159 on 2026-11-02; authenticated Creator Portal shows UNDER REVIEW. Native Google Sheets/Slack nodes passed local API simulations and two browser runs. Marketplace approval and live vendor authorization/delivery remain unverified. |
| Service providers | Public onboarding guidance; no outreach or adoption claimed |
| Public customer cases | Requires real projects and bilateral approval |

## npm publication and installed-bin verification — 2026-11-06

The public npm registry serves `prooftask-mcp@0.1.2`. Its 25,412-byte tarball has SHA256 `9f35d6c1cef5a563057bedcc564290b687e0d862a8663805234cb15cc9d8a70e`; its registry SHA512 integrity and all five package files match the reviewed artifact. A fresh anonymous `npm install --ignore-scripts` and the npm-created executable passed initialization, the 45-tool catalog / 23 default read-only inventory, public capabilities, template search, exact-version/digest reads and local credential-required rejection. No private writes, grants, signing or payments were performed.

Run `npx -y prooftask-mcp@0.1.2` with Node.js 24+. Checked-in client pins and the separately versioned MCP Registry manifest remain unchanged pending coordinated release review; npm publication does not publish Registry metadata or verify third-party client acceptance.

## Historical MCP observation — 2026-11-04

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
