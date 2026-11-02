# n8n delivery handover and acceptance

> Status checked 2026-11-02: #21159 is not currently verified as published; the owner received a rejection and the public listing/API return 404. References to publication below describe the previous export. For the new single-import workflow, use [delivery lifecycle setup](DELIVERY_LIFECYCLE.md).

These workflows use built-in n8n nodes and the existing Prooftask API. Import JSON using n8n's import-from-file action. All exports are inactive and contain no credentials or real delivery data.

## 1. Try public discovery

Import [discover-templates.json](discover-templates.json), edit the search phrase and run manually. The public catalog supplies versioned templates and completion criteria. No account or Agent grant is needed. This is a read-only starting workflow.

For the complete queue scenario, import the [delivery lifecycle candidate](delivery-lifecycle.json) and follow its [configuration, recovery and review steps](DELIVERY_LIFECYCLE.md). Preparation, deliberate submission and buyer-decision sync share one configuration and original queue. The [previous preparation export](../channels/n8n-prepare-client-delivery.json) remains available for comparison and stops before submission; #21159 currently needs changes, not a new duplicate submission.

## 2. Connect an existing delivery

Open the [Agent connection guide](https://prooftask.com/developers?utm_source=partner&utm_campaign=n8n_integrations). A human chooses the exact projects, actions and expiry. Store `Authorization: Bearer <scoped token>` as an n8n Header Auth credential and select it on every authenticated HTTP Request node. Never paste tokens into Code nodes or exported JSON.

- [prepare-job.json](prepare-job.json): map an existing project, original workflow reference, criterion IDs and actual materials. Create and durably save one UUID request ID before the first run. The API persists the prepared job; save its returned job ID in your own durable task store.
- [send-job.json](send-job.json): load that saved job ID. Set `confirmed: true` only after deliberately reviewing the submission. Keep the same ID on retries; reconcile uncertain outcomes through readback rather than creating another job.
- [events.json](events.json): set the subscription ID, select the scoped credential, and register your HTTPS production webhook through the existing subscription API. Verify exact event bytes, then read saved jobs before updating an external task.
- [sync-job-status.json](sync-job-status.json): manually read saved-job results and update the same Google Sheets rows, including already-notified deliveries. Add the documented status columns and configure the original grant and Sheet credentials. It never submits or decides acceptance; failed reads write UNKNOWN. See [setup and acceptance](DELIVERY_LOOP.md#5-sync-the-result-to-the-same-queue).

The receiver's final node is a mapping boundary. Add your actual CRM/task update node, store deduplication identities durably, and reject older sequences. A workflow export cannot supply that external persistence automatically. Rotate or renew subscriptions through the supported API and review current permissions.

## 3. Keep buyer decisions explicit

The buyer reviews the submitted version through their Prooftask link. Requests for changes or evidence need a new reviewed submission. A callback, successful execution or elapsed deadline does not establish acceptance or payment.

## Useful material

- [Automation acceptance guide](https://prooftask.com/guides/automation-acceptance?utm_source=partner&utm_campaign=n8n_integrations)
- [Live project-event guide](https://prooftask.com/developers/project-events.md)
- [Live prepare-job export](https://prooftask.com/developers/n8n/prepare-job.json)
- [Live send-job export](https://prooftask.com/developers/n8n/send-job.json)
- [Live event receiver export](https://prooftask.com/developers/n8n/events.json)

The authenticated exports are public product snapshots. Review the live version before operational use. Previous publication evidence concerns preparation export #21159 only; its current Creator Portal state is Implement changes. The lifecycle candidate and companion examples do not have new marketplace approval. Complete [production acceptance](DELIVERY_LOOP.md#production-acceptance) with your authorized services before claiming a live integration.
