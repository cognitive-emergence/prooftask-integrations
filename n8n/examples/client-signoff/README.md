# How a client signed off on revision 2 of an n8n workflow

The buyer had one acceptance criterion. When two notifications refer to the same support ticket, the handoff queue should contain that ticket once, in first-seen order. The first delivery duplicated a ticket. The buyer requested a correction and replayed the same three notifications against the revised export before accepting it.

This is a synthetic client handover. Template [#21159 on n8n](https://n8n.io/workflows/21159-prepare-client-delivery-review-jobs-from-google-sheets-with-prooftask-and-slack/) managed the two delivery rows. The files below are the small workflows being delivered. Both ran in n8n 2.39.8 with the same input. Buyer and supplier actions ran under separate test identities in a local ProofTask service. The Google Sheets and Slack nodes used local test services.

| Delivery | Notifications | Output from the Handoff queue node | Buyer decision |
| --- | --- | --- | --- |
| [Revision 1](workflow-v1.json) | T-104, T-104, T-205 | T-104, T-104, T-205 | Requested a correction. T-104 was handed off twice. |
| [Revision 2](workflow-v2.json) | T-104, T-104, T-205 | T-104, T-205 | Accepted this revision. Each distinct ticket appeared once. |

Revision 2 filters repeated ticket IDs within one execution. Handling retries across separate executions would require a persistent deduplication key and another acceptance test.

## Replay the buyer's check

1. Download the two workflow JSON files above. In a disposable n8n instance, import each file as a separate workflow.
2. Select **Execute workflow** in revision 1. Open the **Handoff queue** node and read the ticket IDs in its output. Repeat with revision 2. Both workflows use a manual trigger and synthetic input. They require no credentials or external service.
3. Compare your output with the table and the [captured replay results](replay.json). The delivery workflow kept revision 1 as unaccepted when revision 2 was accepted. The two submission IDs and file digests are in the replay results.

## Verify the signed record

Download the [signed result record](result-record.json), the [demo issuer's public key policy](demo-trust.json), both workflow files and the [standalone ProofTask verifier](https://prooftask.com/developers/verify-conformity.mjs). With Node.js 24, run these commands from the download directory. The checks run offline.

```sh
node verify-conformity.mjs result-record.json demo-trust.json --text
shasum -a 256 workflow-v1.json workflow-v2.json
```

| File | SHA-256 of the submitted bytes |
| --- | --- |
| `workflow-v1.json` | `3de18fc461737060bf04f689142b40fd61fe28e1d6d4ee9e7a1cd742599867a3` |
| `workflow-v2.json` | `a80d8bc77a26007aa66074c0b67e8f060f7ee8e52a81ed393067a855c40fdfff` |

The verifier reports `VERIFIED_WITH_LIMITATIONS` with closure `COMPLETE`. The example uses the issuer’s clock. The verifier checks the signed decision history, and the separate SHA-256 command checks the original files against the values above.

The example issuer is `https://n8n-signoff.example`. Its key was generated for this run. The signature establishes what the local recorder recorded. Replaying the workflows establishes whether their outputs meet the criterion. Production issuer keys, customer identities and real payments play no part in this demonstration.

## Reproduce the delivery review with your own test project

Use the [client handover guide](https://prooftask.com/guides/n8n-handover-checklist) and the [integration setup guide](../../DELIVERY_LIFECYCLE.md) to configure template #21159. Use a disposable project with separate buyer and supplier roles, a test Sheet and an internal Slack channel. Agree the criterion above using the identifier `workflow`, or substitute your project's actual criterion identifier in the queue.

The [two-row queue](queue.csv) contains the public file references, lengths and SHA-256 digests. Set the project ID on both rows and leave revision 2 unready until a correction has been requested.

1. Mark only revision 1 ready. Run **prepare**, inspect the original file and frozen request, then deliberately **submit** its exact task, request and job IDs. Reset the submit confirmation afterwards.
2. As the buyer, replay revision 1 and request a correction. Run **sync** and check the first row.
3. Mark revision 1 unready for preparation, mark revision 2 ready, and repeat **prepare** and the reviewed **submit** with revision 2's IDs. The buyer replays revision 2 and accepts that exact submission. Run **sync** again. Only revision 2 should show accepted.
4. Export the new result record from the buyer's project. Use that project's independently trusted issuer key for verification. A new run will have its own IDs, timestamps and signatures.
