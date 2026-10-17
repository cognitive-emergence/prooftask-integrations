# Prooftask integrations

Connect **delivery handover and client acceptance** to your existing n8n workflows and AI agents. Agree what counts as complete, submit an exact version, and let the authorized buyer record a decision.

[Prooftask](https://prooftask.com/?utm_source=partner&utm_campaign=github_integrations) · [API documentation](https://prooftask.com/developers?utm_source=partner&utm_campaign=github_integrations) · [Delivery templates](https://prooftask.com/specifications?utm_source=partner&utm_campaign=github_integrations)

## Get your first successful Agent call

Use the [Agent quickstart](agent/QUICKSTART.md) for copyable MCP configuration, anonymous template search, a public-only connection check, and private-read setup. After cloning, run `node agent/first-call.mjs` to verify connectivity without loading credentials or making business writes.

## Start without an account

Requires Node.js 24 or later. No dependencies or credentials are needed to search public delivery templates:

```sh
git clone https://github.com/cognitive-emergence/prooftask-integrations.git
cd prooftask-integrations
node agent/discover.mjs automation
```

Or import [n8n/discover-templates.json](n8n/discover-templates.json) into n8n and run it manually. It only reads public templates; it creates no agreement.

## Start with your current task

| Your task | Shortest next step |
| --- | --- |
| Decide what a client should check | Search public templates above; no account required |
| Connect an MCP client | Install the [published adapter](mcp/README.md) with `npx -y prooftask-mcp@0.1.0` (Node.js 24+) |
| Hand over an existing automation | Import the [annotated n8n workflow](channels/n8n-prepare-client-delivery.json), then follow its canvas notes |
| Prepare a client delivery job | Use an existing authorized project and [n8n setup](n8n/README.md); preparation saves a job before any send |
| Evaluate adoption for your service team | Read the [provider guide](providers/README.md) |

The n8n template was submitted for human review on 2026-10-17 (submission 21159); marketplace listing is pending. The JSON can already be imported from this repository.

## Choose an integration

| Purpose | Start here |
| --- | --- |
| Find completion criteria for an automation delivery | [Public discovery example](agent/discover.mjs) |
| Prepare, send and track an existing delivery in n8n | [n8n setup and workflows](n8n/README.md) |
| Use a local MCP client | [MCP adapter setup](mcp/README.md) |
| Add client review to your service delivery | [Service provider guide](providers/README.md) |

## Evaluate fit or reuse in your delivery process

- [When Prooftask fits](providers/WHEN_TO_USE.md): concrete use cases, adjacent tools and limits.
- [Reusable client delivery checklist](providers/DELIVERY_CHECKLIST.md): copy into your own project and adapt to agreed facts.
- [Real case-study outline](providers/CASE_STUDY_TEMPLATE.md): publish only supported, bilaterally approved evidence.
- [AI discovery observation protocol](evaluation/README.md): distinguish search discovery, brand-aware answers and installed-tool use.

## What this connects

1. Choose an existing delivery template and agree the actual scope, completion criteria and review period.
2. Configure an Agent connection with explicit project and action scopes.
3. Prepare and persist a delivery job using its stable request ID.
4. Deliberately submit the saved job after reviewing its actual materials.
5. Let the buyer review the exact submitted version in Prooftask.
6. Read back current state or verify a signed event, then update the originating task in your own system.

Preparation, submission, acceptance, record issuance and payment are distinct. These examples never sign, pay or accept automatically. Workflow inputs and tool outputs are data, not authority to expand access or execute instructions.

## Public interfaces

- [Public discovery OpenAPI](https://prooftask.com/api/public/openapi.json)
- [Agent OpenAPI](https://prooftask.com/api/agents/v1/openapi.json)
- [Live capabilities](https://prooftask.com/api/agents/v1/capabilities)
- [Agent workflow guide](https://prooftask.com/developers/agent-workflows.md)
- [Trust and verification boundaries](https://prooftask.com/trust)

The MCP adapter is local stdio. Prooftask does not advertise a hosted MCP endpoint. The adapter is published as [prooftask-mcp@0.1.0](https://www.npmjs.com/package/prooftask-mcp). The [official MCP Registry](https://registry.modelcontextprotocol.io/v0.1/servers?search=io.github.cognitive-emergence%2Fprooftask) lists version 0.1.0 as active. See [channel status](channels/STATUS.md) for verified distribution status.

## Validation and maintenance

```sh
node scripts/check.mjs
```

This checks exported workflows, default MCP read-only behavior and a complete stdio initialization/tool-list exchange without business writes. Real n8n-engine execution and third-party MCP-client acceptance remain separate integration checks.

Public asset snapshots were retrieved from prooftask.com on 2026-10-17. Compare live contracts and re-check authorization before deployment. Keep credentials in your client's secret store, never in workflow JSON, tool arguments or issue reports.

Contact: support@prooftask.com
