# Prooftask integrations

Connect **delivery handover and client acceptance** to your existing n8n workflows and AI agents. Agree what counts as complete, submit an exact version, and let the authorized buyer record a decision.

[Prooftask](https://prooftask.com/?utm_source=partner&utm_campaign=github_integrations) · [API documentation](https://prooftask.com/developers?utm_source=partner&utm_campaign=github_integrations) · [Delivery templates](https://prooftask.com/specifications?utm_source=partner&utm_campaign=github_integrations)

## Public discovery: scope and price

**Public template search and exact-version reads are free and need no account or credential.** This describes public discovery only; issued Result Records and separately quoted signing services follow [current product pricing](https://prooftask.com/pricing).

| Public hosted tool | What it reads |
| --- | --- |
| `getAgentCapabilities` | Published connection and client capabilities |
| `searchPublicSpecifications` | Public delivery acceptance templates for a scenario |
| `getPublicSpecification` | The exact template version and digest returned by search |

Start with an [n8n handover](https://prooftask.com/guides/n8n-handover-checklist), [AI customer-support acceptance](https://prooftask.com/guides/ai-chatbot-acceptance), or [software/project handover](https://prooftask.com/guides/project-handover-checklist). [中文交付指南](https://prooftask.com/zh) provides the same public starting points in Chinese. The canonical product is **prooftask.com**.

These three hosted tools cannot read private projects, create agreements or record acceptance. Private workflows require a separate scoped connection.

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
| Connect an MCP client | Run `npx -y prooftask-mcp@0.1.2` (Node.js 24+); see [MCP adapter setup](mcp/README.md) |
| Hand over an n8n project | Agree scope and client checks with the [n8n handover checklist](https://prooftask.com/guides/n8n-handover-checklist) |
| Manage a delivery queue with n8n | Import the [single-workflow lifecycle candidate](n8n/delivery-lifecycle.json), then follow its [setup and recovery guide](n8n/DELIVERY_LIFECYCLE.md) |
| Prepare a client delivery job | Use an existing authorized project and [n8n setup](n8n/README.md); preparation saves a job before any send |
| Evaluate adoption for your service team | Read the [provider guide](providers/README.md) |

The n8n submission #21159 is not currently verified as published: the owner received a rejection on 2026-11-02 and the official listing/API return 404. Import the [delivery lifecycle candidate](n8n/delivery-lifecycle.json) and follow its [setup and review guide](n8n/DELIVERY_LIFECYCLE.md) to prepare, deliberately submit and sync buyer decisions in one workflow. This candidate has not been resubmitted or marketplace approved. Live Google Sheets/Slack acceptance remains separate.

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

Public template discovery is available over [hosted Streamable HTTP](remote/README.md) without a credential. The npm adapter uses local stdio for separately authorized private workflows. [prooftask-mcp@0.1.2](https://www.npmjs.com/package/prooftask-mcp/v/0.1.2) was published and independently installed from the public npm registry on 2026-11-06. Run `npx -y prooftask-mcp@0.1.2` for the published adapter. The client JSON examples retain their reviewed 0.1.1 pins pending the separate coordinated registry release; server metadata 0.1.4 still names npm 0.1.1. The [official MCP Registry](https://registry.modelcontextprotocol.io/v0.1/servers?search=io.github.cognitive-emergence%2Fprooftask) publishes the independently versioned server metadata; see the registry for its current status. See [channel status](channels/STATUS.md) for verified distribution status.

## Validation and maintenance

```sh
node scripts/check.mjs
```

This checks exported workflows, default MCP read-only behavior and a complete stdio initialization/tool-list exchange without business writes. Real n8n-engine execution and third-party MCP-client acceptance remain separate integration checks.

Public asset snapshots were retrieved from prooftask.com on 2026-10-17. Compare live contracts and re-check authorization before deployment. Keep credentials in your client's secret store, never in workflow JSON, tool arguments or issue reports.

Contact: support@prooftask.com
