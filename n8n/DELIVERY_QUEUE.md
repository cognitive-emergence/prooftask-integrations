# Prepare client delivery reviews from Google Sheets

For automation consultants who keep a delivery checklist in Google Sheets and need to hand the actual materials to a responsible reviewer. This template reads the queue, identifies missing input, checks the current agreed criteria in Prooftask, saves a delivery job, writes the job ID back and posts an internal Slack reminder.

**The endpoint is an internal review handoff.** Preparation saves a job; it does not submit delivery, accept work, sign or pay. The owner reviews the saved materials before using the existing separate [send-job workflow](send-job.json). Only the authorized buyer records acceptance.

For the next steps, use the [complete delivery loop](DELIVERY_LOOP.md): deliberate saved-job submission, buyer review, a separate [queue status sync](sync-job-status.json), and production acceptance. This published preparation workflow skips already-notified jobs; it does not continually refresh their later acceptance status.

## Requirements

- n8n 2.39.8 or a compatible later release, using built-in Google Sheets, Crypto, Code, HTTP Request, If, Loop Over Items and Slack nodes. No community node is required.
- A Google Sheets OAuth2 credential with read/write access to this delivery queue.
- An existing Prooftask account, agreed project and Agent grant for that exact project with `SUBMIT_MATERIALS`. Follow the [Agent connection guide](https://prooftask.com/developers). Prooftask and other service pricing applies separately.
- A Slack credential with `chat:write`; add its bot to the authorized internal review channel.

## Setup

1. Download [delivery-queue-example.csv](delivery-queue-example.csv) and import it into a new Google Sheet. Keep its exact header names. All example data is fictional; replace the project and criterion IDs with your actual authorized ones.
2. Import [the annotated workflow JSON](../channels/n8n-prepare-client-delivery.json) into n8n.
3. In **Configuration**, set `spreadsheetId` (from the Google Sheets URL), numeric `sheetId` (the URL's `gid`, often `0`) and `slackChannelId` (for example, the actual `C…` ID of your authorized review channel).
4. Select the **same Google Sheets OAuth2 credential on every Google Sheets node**. The document and sheet IDs are expressions reading Configuration; leave those expressions in place.
5. On **Read agreed project**, **Prepare saved delivery** and **Read saved job**, select an n8n Header Auth credential with name `Authorization` and value `Bearer <your scoped Agent token>`. Store the token only in Credentials.
6. Select your Slack credential on **Notify responsible team**. Review which team members can access that channel; it receives task/job identifiers and project/queue links, never material contents. Link previews, automatic mentions and workflow links are disabled.
7. Fill one queue row per intended delivery revision. Set `ready_for_review` to `YES` only when you want that row prepared for internal review. Run the workflow manually. **Do not overlap executions against the same sheet.** No schedule or public webhook is included.

The export is inactive and contains no credentials or pinned customer data. Keep n8n execution retention disabled as shipped and apply your normal service access/retention controls. Original material references and frozen requests are stored in the sheet, so protect it accordingly.

## Queue columns

| Column | Purpose |
| --- | --- |
| `task_id` | Stable unique opaque reference, such as `client-42-v1`; letters, digits, `:`, `_`, `-`, maximum 100 characters. Use a new row and ID for a deliberate new delivery revision. |
| `ready_for_review` | `YES` opts into preparation and the internal reminder. Other values are ignored. This is not submission or acceptance authority. |
| `project_id` | Exact existing authorized `delivery_…` project ID. |
| `summary` | What this delivery contains, 10–4,000 characters. |
| `materials_json` | JSON array, 1–20 entries, mapped to every current agreed criterion exactly once. See below. |
| `request_id` | Workflow-managed UUID v4, persisted before calling Prooftask. Leave empty only on a new intended delivery. |
| `request_json` | Workflow-managed frozen request, maximum 40,000 characters. Preserve it for every retry. |
| `job_id` | Workflow-managed saved Prooftask job ID. |
| `handover_state` | Operational result: `NEEDS_INPUT`, `NEEDS_OWNER`, `PREPARING`, `RETRY_SAME_REQUEST`, `PREPARED`, `ALREADY_SUBMITTED`. These are queue labels, not buyer decisions. |
| `handover_note` | Actionable feedback or the next human step. |
| `prepared_at` | Time this queue first observed the prepared job; not a signed timestamp or issuance time. |
| `notified_job_id` | Last job whose Slack reminder was confirmed and marked in the queue. Normal reruns skip it. |

`materials_json` example (replace `workflow` with your exact agreed criterion ID):

```json
[{"criterionId":"workflow","summary":"Fictional file metadata example; replace with your actual deliverable.","references":["https://example.com/client-workflow.json"],"files":[{"reference":"https://example.com/client-workflow.json","name":"workflow.json","size":2,"sha256":"44136fa355b3678a1146ad16f7e8649e94fb4fc21fe77e8310c060f61caaff8a"}]}]
```

The example digest describes the two bytes `{}`; it is not customer evidence. Replace it with your actual original's metadata. Each of the 1–5 references per criterion must have exactly one matching file version. Add separate entries for additional agreed criteria. Reuse actual metadata from your source workflow, or generate it locally without uploading the file:

```sh
node agent/fingerprint-file.mjs /path/to/workflow.json https://your-original-reference
```

Copy the returned object into the material's `files` array and use its identical `reference` in `references`. Do not invent hashes. This workflow checks mapping completeness and required fields. It does not fetch original links, check availability, independently verify supplied digests, judge evidence quality or decide acceptance. Prooftask performs its existing authorized request validation.

## Normal run and recovery

1. Duplicate or malformed `task_id` values stop the entire run before writes, because an update would otherwise be ambiguous. Limit the queue to 200 populated rows per run.
2. Incomplete material rows receive `NEEDS_INPUT`; other selected rows continue one at a time. Missing project access, paused authorization or criterion mismatches receive `NEEDS_OWNER`.
3. A new UUID and exact request are written to the sheet and read back before preparation. A mismatching readback stops that execution without making the preparation call.
4. `POST /api/agents/v1/jobs` saves the existing authorized delivery envelope server-side. The returned job identity is checked before it is written back.
5. A `PREPARED` row triggers the internal Slack reminder. Only a confirmed Slack response is marked as delivered.

| Failure | Safe next step |
| --- | --- |
| Preparation times out | Retry the same frozen `request_json` and `request_id`. The server deduplicates the request. Never clear them just to escape an error. |
| Server saves the job but sheet writeback fails | Rerun the queue. The previously persisted identical request returns the same saved job. |
| Source is edited after its request was frozen | Restore the original values to reconcile/retry. Use a new task row for a deliberate new delivery revision. |
| Reminder fails after the job was saved | Rerun. The workflow reads the saved job and retries the reminder instead of creating another delivery. |
| Slack succeeds but its response or marker is lost | Reconcile the reminder. A rerun may send a duplicate reminder; notifications are not promised exactly once. |
| Existing job was submitted separately | Mark `ALREADY_SUBMITTED`, leave the actual buyer decision in Prooftask, and do not create or submit anything new. |
| Credential/grant revoked or replaced | Ask the owner to reconcile authorization. A replacement grant does not inherit the original saved jobs. |

## Customization

Map your existing task system to these columns, or replace Slack with your own authorized internal notification. Preserve scoped authorization, one original task reference per delivery revision, the durable request snapshot, server job identity and explicit submission/acceptance boundaries. Keep the basic [prepare](prepare-job.json), [send](send-job.json) and [event](events.json) adapters available for existing users.

## Validation scope

`node --test tests/n8n-delivery-queue.test.mjs` checks missing/changed materials, exact agreement mappings, failed and mismatching responses, replay identity and notification boundaries. `node scripts/check.mjs` checks all exported workflows, including the marketplace edition.

The optional engine check uses a real n8n 2.39.8 engine and the actual isolated Prooftask server with synthetic parties. Google Sheets and Slack transport are replaced only in temporary test copies; no real customer queue, Slack channel or production Prooftask project is touched. It verifies graph execution and recovery, not the customer's OAuth setup or live external-service acceptance.
