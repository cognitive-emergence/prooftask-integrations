# n8n delivery handover and acceptance

These workflows use built-in n8n nodes and the existing Prooftask API. Import JSON using n8n's import-from-file action. All exports are inactive and contain no credentials or real delivery data.

## 1. Try public discovery

Import [discover-templates.json](discover-templates.json), edit the search phrase and run manually. The public catalog supplies versioned templates and completion criteria. No account or Agent grant is needed. This is a read-only starting workflow.

For a guided handover, import the [annotated marketplace edition](../channels/n8n-prepare-client-delivery.json). Its canvas notes explain setup and how to retain the saved job ID. Submission 21159 is awaiting n8n human review; direct import remains available.

## 2. Connect an existing delivery

Open the [Agent connection guide](https://prooftask.com/developers?utm_source=partner&utm_campaign=n8n_integrations). A human chooses the exact projects, actions and expiry. Store `Authorization: Bearer <scoped token>` as an n8n Header Auth credential and select it on every authenticated HTTP Request node. Never paste tokens into Code nodes or exported JSON.

- [prepare-job.json](prepare-job.json): map an existing project, original workflow reference, criterion IDs and actual materials. Create and durably save one UUID request ID before the first run. The API persists the prepared job; save its returned job ID in your own durable task store.
- [send-job.json](send-job.json): load that saved job ID. Set `confirmed: true` only after deliberately reviewing the submission. Keep the same ID on retries; reconcile uncertain outcomes through readback rather than creating another job.
- [events.json](events.json): set the subscription ID, select the scoped credential, and register your HTTPS production webhook through the existing subscription API. Verify exact event bytes, then read saved jobs before updating an external task.

The receiver's final node is a mapping boundary. Add your actual CRM/task update node, store deduplication identities durably, and reject older sequences. A workflow export cannot supply that external persistence automatically. Rotate or renew subscriptions through the supported API and review current permissions.

## 3. Keep buyer decisions explicit

The buyer reviews the submitted version through their Prooftask link. Requests for changes or evidence need a new reviewed submission. A callback, successful execution or elapsed deadline does not establish acceptance or payment.

## Useful material

- [Automation acceptance guide](https://prooftask.com/guides/automation-acceptance?utm_source=partner&utm_campaign=n8n_integrations)
- [Live project-event guide](https://prooftask.com/developers/project-events.md)
- [Live prepare-job export](https://prooftask.com/developers/n8n/prepare-job.json)
- [Live send-job export](https://prooftask.com/developers/n8n/send-job.json)
- [Live event receiver export](https://prooftask.com/developers/n8n/events.json)

The authenticated exports are public product snapshots. Review the live version before operational use. No n8n marketplace approval or production integration is implied by this repository.
