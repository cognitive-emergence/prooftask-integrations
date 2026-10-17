# n8n Creator Portal submission

## Suggested title

Prepare a reviewable client delivery with Prooftask

## Description

Add a deliberate delivery handover to an existing automation workflow. Map the existing project and agreed criteria, then prepare and persist a Prooftask delivery job. The customer reviews the exact submitted version separately.

This template stops at preparation. Use the separate saved-job submission workflow only after reviewing the actual materials and deliberately confirming the send.

### Who it is for

Automation consultants and service teams that need an explicit client acceptance step for a completed workflow or integration.

### Setup

1. Import channels/n8n-prepare-client-delivery.json (the marketplace edition adds canvas setup notes).
2. Connect the exact Prooftask project through the Agent connection flow.
3. Select an n8n Header Auth credential on the HTTP Request node.
4. Replace the example project ID, stable UUID request ID, workflow reference and materials with actual values mapped to agreed criteria.
5. Run manually and durably retain the returned job ID in your existing task system.

### Requirements and limits

Uses built-in Manual Trigger, Code and HTTP Request nodes. Requires an existing Prooftask project and an explicitly authorized Agent grant. No token is included. Prooftask service availability and pricing apply separately from n8n.

Preparation does not send a delivery, accept work, issue a record, sign or pay. The workflow is inactive. Production-engine execution should be verified before a marketplace submission is described as tested.

### Supporting links

- Source and import files: https://github.com/cognitive-emergence/prooftask-integrations/tree/main/n8n
- Setup: https://prooftask.com/developers?utm_source=partner&utm_campaign=n8n_creator
- Templates: https://prooftask.com/specifications?utm_source=partner&utm_campaign=n8n_creator

## Submission state

Prepared; not submitted. Creator Portal account prooftask is signed in. The marketplace edition includes required sticky notes; final upload and submission Terms acceptance remain pending. The official guide says new creators submit one template at a time; review approval remains external.
