# Complete the n8n delivery loop

There are two different starting points:

- **Hand over an n8n project to a client:** use the [handover checklist](https://prooftask.com/guides/n8n-handover-checklist) to agree scope, test cases, original materials and operating responsibilities. The agreement uses the existing Prooftask business-automation specification.
- **Use n8n to manage Prooftask deliveries:** connect the published preparation workflow, a deliberate submission step and a separate result sync as described below. Your deliverable need not itself be an n8n workflow.

## 1. Agree and connect

Create or open an actual project and have both parties confirm the exact agreement. The supplier's authorized person connects an Agent for that project with `SUBMIT_MATERIALS` through [Developers](https://prooftask.com/developers). Store its token in n8n Header Auth Credentials only. Keep the same grant for preparation, submission and saved-job status reads; renewal preserves jobs, a replacement grant does not own them.

Choose the Google Sheets queue and authorized internal Slack review channel. Use the [sample queue](delivery-queue-example.csv), replacing all fictional values. Never put credentials in queue cells, workflow input or exports. Only one manual execution may operate on a queue at a time, including status sync.

## 2. Prepare and review

Import [published n8n template #21159](https://n8n.io/workflows/21159-prepare-reviewable-client-delivery-jobs-from-google-sheets-with-prooftask-and-slack/) or the identical [annotated JSON](../channels/n8n-prepare-client-delivery.json). Follow the complete [configuration and recovery guide](DELIVERY_QUEUE.md).

The published template is the preparation workflow only: read selected rows, check current criteria and material metadata, persist and read back `request_id` and `request_json`, save the Prooftask job, write `job_id` and notify Slack. `PREPARED` is an internal handoff label. It is not submission or buyer acceptance.

The internal reviewer checks the frozen `request_json` and actual original files in the queue before approving submission. The Slack project link opens the authorized project; a prepared job has not yet attached a submitted material set to that project. Inspect the saved job through `GET /api/agents/v1/jobs/{jobId}` as needed. Do not assume the project page already displays unsubmitted materials.

## 3. Submit the same saved job

Import [send-job.json](send-job.json). Configure its Header Auth with the same grant. In **Input**, use the exact `job_id` from the reviewed queue row and set `confirmed: true` only after that review and approval. Run deliberately. This calls the existing `POST /api/agents/v1/jobs/{jobId}/submit` operation; the Prooftask API applies the current permissions and version checks.

On an uncertain result, preserve the same job ID and read its status before retrying. Repeating the same submission does not create a new delivery. A changed agreement, paused authorization or stale version requires an authorized person to reconcile the project; do not clear IDs or bypass the error.

## 4. Buyer review and correction

The authorized buyer opens the submitted project and reviews the exact materials against the agreement. Acceptance, requests for changes or evidence, and rejection remain explicit decisions in Prooftask. Apply required human confirmation/signing rules there.

For a deliberate correction, follow the current review request and create a new queue row with a new `task_id`. Retain the earlier row, request and job IDs. Material changes must not overwrite a frozen request. Do not treat an older job's acceptance or a project-level status as acceptance of the new job.

Record issuance, paid coverage, signing and payment remain separate. The status sync reports a buyer decision; it does not export or independently verify a signed record, sign anything, purchase credits or execute payment. If a record is required, use the existing [record export and verification flow](https://prooftask.com/developers/portable-records.md).

## 5. Sync the result to the same queue

The published preparation workflow skips already-notified rows. It is not a continuing acceptance-status poller. Import the separate [sync-job-status.json](sync-job-status.json) companion to read **all saved jobs**, including those rows.

1. Add these exact new columns to the same sheet, leaving existing columns unchanged:

   ```text
   review_job_id,review_state,review_decision,review_accepted,review_next_action,review_observed_at,review_url,review_note
   ```

2. In **Configuration**, set the same `spreadsheetId` and numeric `sheetId`. Select the same Google Sheets credential on both Sheet nodes. This credential needs write access to the listed status columns.
3. On **Read current saved job**, select the Header Auth credential for the original Agent grant that owns these jobs. This companion only makes Prooftask GET requests; no additional decision permission is needed.
4. Run manually after submission and again after a buyer action. It updates existing unique `task_id` rows, never appends another task, and leaves `request_id`, `request_json`, `job_id`, materials, preparation and reminder fields unchanged. It has no automatic schedule or public webhook.
5. Read `review_next_action` and follow `review_url`. `review_observed_at` is a status observation time, not a signed decision/issuance time. A later correction, concern or withdrawal can change the observation; run the sync again before relying on it.

| Value | Meaning |
| --- | --- |
| `review_accepted=YES` | Fresh API readback binds an ACCEPT decision and current `BUYER_CONFIRMED` state to this exact saved submission. |
| `review_accepted=NO` | Current supported readback does not establish acceptance of this saved submission. Check `review_next_action`; pending, corrections, rejection and replaced submissions remain distinct. |
| `review_accepted=UNKNOWN` | Readback failed, access changed, correlation mismatched or an unsupported response was returned. Reconcile and retry; do not rely on an older YES. |

There is no external exactly-once promise. Repeating this manual sync writes the latest observation to the same task. Run it serially and verify the actual Sheet write before considering downstream processing complete.

For event-driven CRM/task updates, use [events.json](events.json) and the [event guide](https://prooftask.com/developers/project-events.md). Its final node produces a mapping; attach your actual authorized update node and durably store event/job deduplication keys **after** the destination write succeeds. Read current jobs before updating. A verified old event cannot replace a fresh state. Reconcile missed notifications using delivery history and saved-job reads. This Sheet sync is a manual readback alternative; it does not install that receiver for you.

## Production acceptance

These are acceptance steps for your own authorized test project, queue and review channel. Do not use customer production data or a customer channel just to try the example. Keep the observed evidence in your own restricted records.

| Check | Required observation |
| --- | --- |
| Connect | Google Sheets credential reads/writes the selected sheet; the Slack bot can post in the selected review channel; the Agent sees only the intended project. |
| Prepare | A valid row saves its frozen request and job ID before Slack is notified. A missing-material row receives actionable feedback. No delivery has yet been submitted. |
| Retry | Rerun the same preparation: preserve the request/job IDs and normally skip the confirmed reminder. Simulate a lost sheet writeback and a failed reminder in a disposable test copy, then recover the same saved job. An uncertain Slack response can duplicate a reminder. |
| Submit | Explicitly approve and submit that exact job. Read back the submitted state; repeat the same submission and verify only one delivered version exists. |
| Pending and correction | Sync before buyer acceptance and after a change/evidence request. The row remains unaccepted and identifies the next action. A corrected delivery has a new row/job identity. |
| Accept and write back | The authorized buyer accepts the exact submitted version. Run sync and inspect the original Sheet row: `review_accepted=YES`, correct job ID and observation time. No extra row or claimed payment appears. |
| Revocation and changed state | Revoke or pause the appropriate test grant, or raise a supported concern after acceptance. Rerun sync: revoked reads become UNKNOWN; changed business state must not remain falsely accepted. Restore access only through the supported owner flow. |
| Receiver, if used | Verify actual destination persistence, duplicate-event suppression, delayed-event fresh readback and missed-event reconciliation. A generated mapping alone is insufficient evidence. |

The repository's mapping/export tests and isolated Prooftask HTTP tests are technical evidence. They do not establish your Google/Slack OAuth setup, vendor engine execution, production HTTPS receiver, customer acceptance, independent record verification or payment. Record those observations separately before relying on the integration.
