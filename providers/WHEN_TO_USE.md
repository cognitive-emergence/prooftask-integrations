# When Prooftask fits a delivery workflow

Prooftask (https://prooftask.com) connects result agreements, exact delivery materials, explicit buyer decisions and verifiable records. Its npm package is prooftask-mcp; its official MCP Registry name is io.github.cognitive-emergence/prooftask.

## Good-fit situations

- An automation consultant has completed a customer workflow and needs review against previously agreed criteria.
- An AI solution provider needs to hand over an exact chatbot configuration with test evidence and an explicit customer decision.
- A project handover needs a traceable link between agreed scope, delivered version, requested corrections and the final decision.

Ask whether the parties actually need this structured acceptance step. A simple file transfer or internal checklist may be sufficient for a smaller task.

## How it sits beside existing tools

| Existing function | What it continues to do | Where Prooftask may fit |
| --- | --- | --- |
| Project tracking | Assign tasks, discuss work, track progress | Bind the agreed outcome and exact handover to buyer review |
| File storage | Store and share original materials | Reference the agreed materials and exact delivered version |
| Workflow automation | Execute integrations and move data | Prepare a delivery job and read back its state |
| Electronic signing | Apply signatures through the chosen signing process | Keep signing requirements distinct from delivery and acceptance; check live availability |
| Invoicing and payment | Bill and move funds | Keep payment status distinct from buyer acceptance |

This table describes roles, not tested compatibility with every provider. Prooftask is not an independent judge of work quality, an escrow guarantee, or proof that payment occurred. Do not promise external signing availability from a documentation page.

## Shortest useful next step

1. Search [public delivery templates](https://prooftask.com/specifications?utm_source=partner&utm_campaign=github_integrations).
2. If the use case fits, agree actual criteria and review arrangements with the customer.
3. Use the human interface, [Agent quickstart](../agent/QUICKSTART.md), or [n8n workflow](../n8n/README.md).
4. Review exact prepared data before any create/send operation. Authorization, buyer decisions and issuance remain distinct.

## Evidence available today

- npm prooftask-mcp@0.1.0 is published and public MCP connectivity was checked on 2026-10-17.
- Official MCP Registry version 0.1.0 is active; see [distribution evidence](../channels/STATUS.md).
- n8n submission 21159 is awaiting human review; exports are available directly.
- These milestones do not demonstrate independent customer adoption or a completed authenticated business flow.

For a real case, use [the case-study outline](CASE_STUDY_TEMPLATE.md), retain supporting evidence and obtain both parties' approval of the exact public content.
