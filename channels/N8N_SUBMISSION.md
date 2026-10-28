# Published n8n template #21159

## Current title and scope

**Prepare reviewable client delivery jobs from Google Sheets with Prooftask and Slack**

[Official listing](https://n8n.io/workflows/21159-prepare-reviewable-client-delivery-jobs-from-google-sheets-with-prooftask-and-slack/) · [Official template API](https://api.n8n.io/templates/workflows/21159)

The published workflow reads selected Google Sheets rows, validates material mappings and current project access, persists the request and saved job, writes the result to the original queue and sends an internal Slack review reminder. It uses 28 execution nodes and seven canvas notes. The distributable JSON is [channels/n8n-prepare-client-delivery.json](n8n-prepare-client-delivery.json).

Preparation stops at internal review. Submission uses the separate saved-job workflow after explicit review and approval. Buyer acceptance, record issuance, signing and payment remain distinct.

## Setup and the complete loop

1. Follow [queue configuration and recovery](../n8n/DELIVERY_QUEUE.md). Use an existing agreed project, a project-scoped Agent grant with `SUBMIT_MATERIALS`, a Google Sheets credential on every Sheet node and a Slack bot with `chat:write` in the intended internal channel.
2. Configure Header Auth on all three Prooftask HTTP nodes. Set spreadsheet ID, numeric sheet ID and Slack channel ID in Configuration. Replace fictional data and map actual file metadata to every agreed criterion.
3. Run one manual execution per queue at a time. Preserve the saved request and job IDs on retries. An uncertain Slack response may duplicate a reminder.
4. Follow the [complete delivery loop](../n8n/DELIVERY_LOOP.md) for review, deliberate submission, buyer decision, separate queue status sync and production acceptance.

No community nodes, credentials or real customer materials are included in the published export. The separate submission, event receiver and status-sync examples are not part of the marketplace-approved preparation template. Keep the approved JSON unchanged unless deliberately revising that publication.

## Publication evidence and history

- Submitted for human review on 2026-10-17, ID 21159. The original small preparation example was subsequently replaced with the delivery-queue workflow.
- Publication date 2026-10-20 was observed by the owner in the signed-in Creator Portal on 2026-10-27.
- On 2026-10-28 the official public API returned `status=published` and `reviewStatus=published`; its workflow JSON matches the repository's annotated export after normalizing object key order.
- The existing isolated engine validation used n8n 2.39.8 and an isolated Prooftask API; Google Sheets and Slack transport were synthetic. Production OAuth, an actual receiver write and customer acceptance require their own observed evidence.

Maintain this existing listing rather than submitting duplicates. The Creator Portal management page is https://creators.n8n.io/workflows/21159/edit (creator login required). A public listing or a successful synthetic test does not establish production integration.
