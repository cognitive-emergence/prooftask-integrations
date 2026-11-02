# Local n8n simulation lab

This lab runs the n8n editor and actual Google Sheets/Slack nodes on your computer. Fake credentials and local API fixtures stand in for vendor accounts. It does not establish real Google OAuth, Slack channel permissions or message delivery to a workspace.

## Open the environment

- Editor: http://localhost:5678
- Synthetic queue, captured messages and request audit: http://127.0.0.1:5680/lab/state
- Login: `.local/n8n-lab/owner.json` (local file, owner-only permissions)
- Readable queue export: `.local/n8n-lab/queue.csv`
- Captured Slack messages: `.local/n8n-lab/slack-messages.txt`

The instance contains two inactive workflows:

1. **Manage client delivery reviews…** — the current review candidate, with original service URLs and configuration placeholders.
2. **SIMULATION — Client delivery reviews (local mock services)** — the runnable local copy with fake Google/Slack credentials and a synthetic Prooftask project.

Open the SIMULATION workflow and click Execute workflow. A valid row should receive saved request/job IDs, one captured Slack reminder and a reminder-delivered marker. A second row should receive missing-material feedback. Execute again: the saved IDs remain stable and the confirmed reminder is skipped.

## Continue through buyer review

In the SIMULATION workflow's Configuration node:

1. After inspecting the frozen request, set `operation=submit`, copy the exact row's task, request and job IDs to the reviewed fields, then deliberately set `submitConfirmed=true`. Execute; the queue should show pending buyer review. Reset confirmation afterwards.
2. Simulate a buyer correction request:

   ```sh
   node scripts/n8n-lab/action.mjs request-changes
   ```

   Run `operation=sync` to observe the requested correction. The fixture also adds a new revision row; prepare and deliberately submit that new job using its own IDs.

3. Simulate acceptance of the exact current submission:

   ```sh
   node scripts/n8n-lab/action.mjs accept
   ```

   Run `operation=sync`; only the matching delivery can become accepted.

4. Simulate revoked access with `node scripts/n8n-lab/action.mjs revoke`, then sync. Previous acceptance observations must become UNKNOWN.

These commands affect only the disposable synthetic project at loopback addresses. Restarting the lab resets that project, queue and fake service grant. The n8n login and imported workflows persist locally. The simulation grant expires after 23 hours; restart for a fresh demonstration.

## Start or restart

The runtime is retained in `.local/n8n-runtime`, and its database/settings are in `.local/n8n-lab`. Both are excluded from Git. This setup uses Node 24.22.0 and n8n 2.39.8.

On this configured checkout:

```sh
node scripts/start-n8n-lab.mjs
```

For a new checkout, set `N8N_CLI` to an installed n8n executable and `PROOFTASK_SOURCE_ROOT` to a Prooftask source checkout. The source path is saved locally for subsequent starts. Ctrl+C in the startup terminal stops the editor and its local fixtures. No login at boot or public hosting is configured.

## Repeat the automated native-node simulation

```sh
N8N_PROVIDER_TRANSPORT=native \
N8N_PROVIDER_EVIDENCE=.local/n8n-lab/provider-results.json \
PROOFTASK_SOURCE_ROOT=/path/to/prooftask \
N8N_CLI=/path/to/n8n/bin/n8n \
node scripts/test-n8n-delivery-lifecycle-engine.mjs
```

Unlike the earlier lightweight transport test, this mode keeps the Google Sheets and Slack node types and their credential handling intact. A test-process bridge redirects only those vendors' requests carrying the explicit fake tokens to local API-contract fixtures. It refuses other credentials for the simulated vendors; it does not disable TLS verification. Google value ranges, RAW cell writes and Slack `chat.postMessage` success/error responses are exercised through the actual node implementations.

The test found and fixed a real integration defect: Slack V2 normalizes `ts` into `message_timestamp`. Reminder confirmation now accepts the native normalized receipt as well as a direct vendor receipt, and rejects unsuccessful or conflicting receipts.

The [native-node evidence](../evidence/n8n-native-provider-engine-20261102.json) records the exact candidate digest, 130 provider requests and the verified recovery/review scenarios. The [synthetic snapshots](../evidence/n8n-native-provider-snapshots-20261102.json) contain only test rows and captured fake messages. Real vendor authorization and delivery remain separate acceptance steps.

Contract references: [Google Sheets values.batchUpdate](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/batchUpdate) and [Slack chat.postMessage](https://docs.slack.dev/reference/methods/chat.postMessage/).
