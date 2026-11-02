# Manage client delivery reviews in one n8n workflow

Import [delivery-lifecycle.json](delivery-lifecycle.json). This candidate combines preparation, explicit saved-job submission and exact buyer-status readback on one canvas. It does not require importing companion workflows. It has not been submitted or approved by n8n.

## Who it helps and what changes

An automation consultant tracks client delivery revisions in Google Sheets. Previously, preparation stopped at a Slack reminder and the operator had to configure two more workflow imports. This candidate uses one configuration and three deliberate run modes. A submitted job is immediately read back into the original queue; after buyer action, another sync records pending review, correction, acceptance or an uncertain read. A correction gets a new task row, retaining the earlier delivery history.

## Configure once

1. Import [delivery-lifecycle-example.csv](delivery-lifecycle-example.csv) into Google Sheets. It includes preparation and review columns. All sample IDs and file references are fictional; sample rows start with `ready_for_review=NO`.
2. Use an existing, mutually agreed Prooftask project. Connect its supplier Agent with project-scoped `SUBMIT_MATERIALS`; retain the original grant for saved-job reads. In n8n, select the same Header Auth credential on **all five** Prooftask HTTP nodes. Store the token only in Credentials.
3. Select the same Google Sheets OAuth credential on every Sheet node. Set `spreadsheetId`, numeric `sheetId` and the authorized internal `slackChannelId` in **Configuration**. Select the internal bot credential on the Slack node (`chat:write`, bot added to the channel).
4. Replace the sample materials with actual references, criterion mappings and file metadata. Existing [material preparation and failure recovery](DELIVERY_QUEUE.md) applies. Run `node agent/fingerprint-file.mjs /path/to/original https://your-original-reference` to compute metadata from the actual original file rather than inventing a digest. The helper only reads your local file; it does not upload it.
5. Use at most 200 queue rows and operate only one execution per queue at a time. Automatic triggers and concurrent runs are not configured.

## Run the complete scenario

| Stage | Operator action | Observable result |
| --- | --- | --- |
| Prepare | Set `operation: 'prepare'`, keep `submitConfirmed: false`, mark an actual row ready and execute. | The original row receives a frozen request and job ID; Slack receives an internal review reminder. No submission. |
| Review | Read the saved `request_json` and original files. | Reviewer identifies exactly which task, request and job they approve. Slack is a reminder, not an approval control. |
| Submit | Set `operation: 'submit'`, `reviewedTaskId`, `reviewedRequestId`, `reviewedJobId` and `submitConfirmed: true` after that review; execute. | The workflow re-reads the queue, requires unique task identity and matching saved IDs, submits that job and runs a fresh queue sync. |
| Reset | Set `submitConfirmed: false` after the deliberate submission run. | A later accidental submit-mode run fails its explicit approval check. |
| Buyer review | The authorized buyer opens the project in Prooftask and records their decision there. | The buyer's actual decision applies to the exact submitted version. |
| Sync | Set `operation: 'sync'` and execute after buyer action. | The original rows receive `review_*` fields. Notified rows are included. No new submission occurs. |
| Correct | Follow the buyer's requested changes, add a new `task_id` row and repeat preparation and review. | The earlier row and saved identity remain intact. An old acceptance is not inherited by the new delivery. |

Do not leave submit mode and confirmation enabled as an unattended approval mechanism. Approval is operator configuration for this deliberate run, not a Sheet cell, Slack response or automatic buyer decision. The existing API enforces current grant, project and version checks at submission.

`review_accepted=YES` requires exact current acceptance for that saved submission. Pending or correction reads produce NO. Failed or mismatched reads produce UNKNOWN and replace an older acceptance observation. Read `review_next_action`; observation time is not signed acceptance time.

If submission times out or fails, the workflow stops before automatic status sync. Set `operation: 'sync'` to reconcile the saved job before retrying the same identity. Never clear request/job IDs to work around an uncertain result. A later status-write failure does not undo a successful submission; sync again. The existing preparation recovery and Slack duplicate-notification limitations still apply.

## Reviewer demonstration

Use an authorized disposable project, Sheet and internal channel. Record only redacted/non-customer material:

1. Show a valid row and a missing-material row; run prepare. Show saved request/job, actionable feedback and Slack reminder.
2. Rerun prepare; show stable saved IDs and skipped confirmed reminder.
3. Try submit with `submitConfirmed: false`; show the guard prevents submission. Then review and approve the exact saved job and submit.
4. Show fresh queue status as pending, not accepted. Have the authorized buyer request changes; sync and show the next action.
5. Prepare a corrected row with a new identity, explicitly submit it, then have the buyer accept that exact version. Sync and show YES only on the matching delivery.
6. Demonstrate failed/mismatched status read in a disposable fixture, showing UNKNOWN rather than an old YES.

The recording has not been made. Add a real YouTube embed only once the video exists; do not insert a fictional video ID.

## Verification and remaining acceptance

The candidate reuses the existing preparation and status mappers. Local tests cover identity recovery, exact-version acceptance, revoked/mismatched reads, submission approval binding, exclusive branch wiring, namespaced node references and reproducible export. `node scripts/check.mjs` checks Code syntax, graph targets, inactive exports, provenance hashes and MCP startup.

Run:

```sh
node --test tests/n8n-delivery-queue.test.mjs tests/n8n-job-status.test.mjs tests/n8n-delivery-lifecycle.test.mjs
node scripts/check.mjs
```

These checks have passed. The combined export also passed import and execution in n8n 2.39.8 against an isolated actual Prooftask API, with synthetic Google Sheets and Slack transport. The [engine evidence](../evidence/n8n-lifecycle-engine-20261102.json) records the exact export digest and verified scenarios, including corrections with new file metadata, old-version non-inheritance and revoked readback. Real Google/Slack credentials and destination writes remain untested. Complete the [production acceptance scenarios](DELIVERY_LOOP.md#production-acceptance) and the demonstration above before resubmitting. No deployment, buyer acceptance, signature or payment has been performed by this follow-up.

To run the combined canvas in an isolated real n8n engine (n8n 2.39.8), provide a local Prooftask source checkout and the installed CLI:

```sh
PROOFTASK_SOURCE_ROOT=/path/to/prooftask N8N_CLI=/path/to/n8n/bin/n8n node scripts/test-n8n-delivery-lifecycle-engine.mjs
```

That harness reads the exported JSON, replaces Google Sheets/Slack transport only in a disposable copy, imports it into an isolated n8n database and checks preparation, feedback, retries, approval blocking, saved-job submission/replay, automatic pending-status writeback, correction with a new saved delivery, exact acceptance and revoked readback against the actual isolated Prooftask API. It reports the original export digest. It cannot establish real Google/Slack OAuth or destination writes.
