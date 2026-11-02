# n8n submission #21159 — follow-up

## Current status — 2026-11-02

The owner supplied a rejection email dated 2026-11-02 stating that the workflow is too basic. On the same date, the public listing and `https://api.n8n.io/templates/workflows/21159` returned HTTP 404 (`Workflow not found` from the API). Earlier published observations below are retained as history, not current approval. Authenticated Creator Portal now shows the existing submission under Pending with `IMPLEMENT CHANGES`. Its last-submitted JSON recursively matches the repository preparation export (28 execution nodes plus seven notes). The combined candidate has not yet been submitted. A 404 alone does not establish a permanent removal.

The [unified lifecycle candidate](../n8n/delivery-lifecycle.json) and [review package](../n8n/DELIVERY_LIFECYCLE.md) are ready for local review. The candidate passed n8n 2.39.8 execution against the isolated Prooftask API with synthetic Sheet/Slack transport; see the [exact-export engine evidence](../evidence/n8n-lifecycle-engine-20261102.json). Real destination acceptance remains pending. No resubmission or reviewer communication has been sent. Keep the previous export intact for comparison.

## Previous title and scope

**Prepare reviewable client delivery jobs from Google Sheets with Prooftask and Slack**

[Official listing](https://n8n.io/workflows/21159-prepare-reviewable-client-delivery-jobs-from-google-sheets-with-prooftask-and-slack/) · [Official template API](https://api.n8n.io/templates/workflows/21159)

The previous preparation export reads selected Google Sheets rows, validates material mappings and current project access, persists the request and saved job, writes the result to the original queue and sends an internal Slack review reminder. It uses 28 execution nodes and seven canvas notes. The distributable JSON is [channels/n8n-prepare-client-delivery.json](n8n-prepare-client-delivery.json).

Preparation stops at internal review. Submission uses the separate saved-job workflow after explicit review and approval. Buyer acceptance, record issuance, signing and payment remain distinct.

## Setup and the complete loop

1. Follow [queue configuration and recovery](../n8n/DELIVERY_QUEUE.md). Use an existing agreed project, a project-scoped Agent grant with `SUBMIT_MATERIALS`, a Google Sheets credential on every Sheet node and a Slack bot with `chat:write` in the intended internal channel.
2. Configure Header Auth on all three Prooftask HTTP nodes. Set spreadsheet ID, numeric sheet ID and Slack channel ID in Configuration. Replace fictional data and map actual file metadata to every agreed criterion.
3. Run one manual execution per queue at a time. Preserve the saved request and job IDs on retries. An uncertain Slack response may duplicate a reminder.
4. Follow the [complete delivery loop](../n8n/DELIVERY_LOOP.md) for review, deliberate submission, buyer decision, separate queue status sync and production acceptance.

No community nodes, credentials or real customer materials are included in the previous preparation export. The separate submission, event receiver and status-sync examples are not part of the previous preparation template. The new candidate is a separate file so the previous submission can be compared exactly.

## Publication evidence and history

- Submitted for human review on 2026-10-17, ID 21159. The original small preparation example was subsequently replaced with the delivery-queue workflow.
- Publication date 2026-10-20 was observed by the owner in the signed-in Creator Portal on 2026-10-27.
- On 2026-10-28 the official public API returned `status=published` and `reviewStatus=published`; its workflow JSON matches the repository's annotated export after normalizing object key order.
- The existing isolated engine validation used n8n 2.39.8 and an isolated Prooftask API; Google Sheets and Slack transport were synthetic. Production OAuth, an actual receiver write and customer acceptance require their own observed evidence.

Check this existing submission in the Creator Portal before deciding whether to revise it; avoid duplicate submissions. The Creator Portal management page is https://creators.n8n.io/workflows/21159/edit (creator login required). A public listing or a successful synthetic test does not establish production integration.
