# Distribution status

Updated 2026-10-17. Publication and marketplace approval are separate milestones.

| Channel | Verified state |
| --- | --- |
| GitHub | Public integration repository with MCP adapter, four n8n workflow exports and provider guidance |
| npm | [prooftask-mcp@0.1.0](https://www.npmjs.com/package/prooftask-mcp) published; clean installation and stdio initialize/tools-list passed with 21 read-only tools |
| Official MCP Registry | io.github.cognitive-emergence/prooftask version 0.1.0 published and independently returned as active/latest by the public API at 2026-10-17T15:14Z |
| n8n | Four inactive importable workflows validated for syntax and graph; submission 21159 sent for human review on 2026-10-17; marketplace approval remains pending |
| Service providers | Public onboarding guidance; no outreach or adoption claimed |
| Public customer cases | Requires real projects and bilateral approval |

## Publication evidence

- [Successful manual OIDC publish run](https://github.com/cognitive-emergence/prooftask-integrations/actions/runs/39044145410), source commit 2b680a9456d1e6b3e46b59aca355036a4ddeea9d.
- [Official Registry API record](https://registry.modelcontextprotocol.io/v0.1/servers?search=io.github.cognitive-emergence%2Fprooftask): name, version, npm identifier and stdio transport match the reviewed manifest. Published at 2026-10-17T15:14:20.359108Z.
- Manual workflow uses repository OIDC, contents:read and id-token:write, a five-minute limit and no stored publisher credentials. It does not deploy the Prooftask product.
