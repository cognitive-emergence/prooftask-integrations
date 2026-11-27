# ProofTask integrations

ProofTask helps a service team and its client agree on what counts as done and keep a record of which delivery the client accepted. This repository connects that review to a Google Sheets queue, Slack, n8n and agent clients.

- **See a review from both sides.** An AI support agent passes 38 of 40 questions, but two handoff records are missing. Follow the buyer’s request through to the exact revision they accept. [Open the public example (no account needed)](https://prooftask.com/example?utm_source=partner&utm_campaign=github_integrations)
- **Try the n8n template.** Prepare a delivery from a Google Sheets row, notify your team in Slack, then submit the reviewed version and sync the buyer’s decision back to that row. [Open workflow #21159 on n8n](https://n8n.io/workflows/21159/) · [Setup guide and sample queue](n8n/DELIVERY_LIFECYCLE.md#configure-once)
- **Build your own integration.** Start with delivery criteria you can reuse or connect your own agent. [Delivery templates](https://prooftask.com/specifications?utm_source=partner&utm_campaign=github_integrations) · [API documentation](https://prooftask.com/developers?utm_source=partner&utm_campaign=github_integrations)

## Try the public MCP server in VS Code

[Open ProofTask public in VS Code](https://vscode.dev/redirect?url=vscode%3Amcp%2Finstall%3F%257B%2522name%2522%253A%2522proofTaskPublic%2522%252C%2522type%2522%253A%2522http%2522%252C%2522url%2522%253A%2522https%253A%252F%252Fprooftask.com%252Fmcp%252Fpublic%2522%257D) and review the HTTP server configuration. For manual setup, use `MCP: Add Server`, choose HTTP and enter `https://prooftask.com/mcp/public`. Public template discovery is free and works without a ProofTask account or token.

In chat, try “Find the customer-support AI template. Open the exact version you found and list the evidence the buyer should ask for when testing handoffs to a human.”

| Public tool | What it reads |
| --- | --- |
| `findTemplates` | Matching public templates, with their slugs, versions and digests |
| `getTemplate` | Scope, acceptance criteria and required evidence for a specific template version |
| `getResultStatus` | Public status for a known result ID, without the underlying delivery materials |
| `getTrustBundle` | Public key and verification information for checking exported records offline |

Start with an [n8n handover](https://prooftask.com/guides/n8n-handover-checklist), [AI customer-support acceptance](https://prooftask.com/guides/ai-chatbot-acceptance), or [software/project handover](https://prooftask.com/guides/project-handover-checklist). [中文交付指南](https://prooftask.com/zh) provides the same public starting points in Chinese. The canonical product is **prooftask.com**.

For access to a private project, use the separately authorized connection described in the [ProofTask MCP guide](https://prooftask.com/developers/mcp.md). Issued Result Records and separately quoted signing services follow [current product pricing](https://prooftask.com/pricing).

## Use the local agent adapter

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
| Connect an MCP client | Start with the [public HTTP server](#try-the-public-mcp-server-in-vs-code), or use the [local stdio adapter](mcp/README.md) for an existing integration |
| Hand over an n8n project | Agree scope and client checks with the [n8n handover checklist](https://prooftask.com/guides/n8n-handover-checklist) |
| Manage a delivery queue with n8n | Import the [workflow JSON](n8n/delivery-lifecycle.json) and follow the [setup and recovery guide](n8n/DELIVERY_LIFECYCLE.md) |
| Prepare a client delivery job | Use an existing authorized project and [n8n setup](n8n/README.md); preparation saves a job before any send |
| Evaluate adoption for your service team | Read the [provider guide](providers/README.md) |

The n8n workflow has three manual modes. `prepare` saves a job and sends an internal Slack reminder. After checking the original files, the operator uses `submit` to send that exact job. The buyer reviews it in ProofTask. Run `sync` to write the latest outcome to the original row, including requests for corrections. If the workflow cannot verify a status, the row shows `UNKNOWN`.

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

The [official MCP Registry entry for ProofTask public](https://registry.modelcontextprotocol.io/v0.1/servers/com.prooftask%2Fmcp-public/versions/latest) lists the hosted service used above. This repository also documents the [older three-tool gateway](remote/README.md) for existing clients.

The [local npm adapter](https://www.npmjs.com/package/prooftask-mcp) uses stdio for authorized private workflows. Run `npx -y prooftask-mcp@0.1.4` for optional Bitcoin time proof. See the [adapter guide](mcp/README.md) for supported operations.

## Validation and maintenance

```sh
node scripts/check.mjs
```

This checks exported workflows, default MCP read-only behavior and a complete stdio initialization/tool-list exchange without business writes. Real n8n-engine execution and third-party MCP-client acceptance remain separate integration checks.

Public asset snapshots were retrieved from prooftask.com on 2026-10-17. Compare live contracts and re-check authorization before deployment. Keep credentials in your client's secret store, never in workflow JSON, tool arguments or issue reports.

Contact: support@prooftask.com
