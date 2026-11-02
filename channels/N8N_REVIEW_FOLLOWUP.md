# Review follow-up draft — not sent

Submission: #21159. Candidate source: upstream snapshot `6d54a1afa459bf83bed8eebc99cb6febb8659f5b` plus the local lifecycle changes.

## Current follow-up evidence

- 2026-11-02: public listing and official template API return HTTP 404; API message is `Workflow not found`.
- After the owner signed in, Creator Portal shows the existing submission under Pending with `IMPLEMENT CHANGES` (displayed date 2026-10-28). The resubmission dialog permits replacing the workflow JSON and submitting for human review.
- `Copy your last submitted JSON` was saved to `evidence/n8n-last-submitted-20261102.json` and recursively compared with upstream preparation export `6d54a1af`: all values matched at inspection (28 execution nodes and seven notes). The feedback therefore applies to the enhanced preparation export, not merely the initial small example. The original export remains frozen for comparison.
- The revised JSON passed the Creator Portal upload preflight: `Uploaded: delivery-lifecycle.json`; Submit for human review is enabled. Earlier preflight uploads were discarded. After native-node correction and owner-authorized simulation, the final corrected JSON was uploaded and Submit for human review was clicked. The dashboard now shows `UNDER REVIEW`, dated 2026-11-02; this is not marketplace approval.
- Local checks: 25 tests passed; export/provenance/MCP check passed; the combined candidate passed n8n 2.39.8 import/execution against the actual isolated Prooftask API, using synthetic Sheet/Slack transport. The previous preflight digest is retained separately from the native-node-corrected candidate. Real Google/Slack transport acceptance remains pending.
- Repository status wording is corrected locally. The live Prooftask website has not been changed.

## Scope of any separate reviewer message

- Read the existing Creator Portal submission and retain the observed `IMPLEMENT CHANGES` state and original JSON evidence. The current combined candidate was not in the last submitted JSON.
- The owner authorized API-contract simulation in place of connecting live vendor accounts for this review revision. Native nodes and browser runs are verified; do not claim live OAuth or vendor delivery.
- Use the tested native-node-corrected export and describe the simulation scope accurately. No duplicate submission or approval claim.

## Proposed title

Manage client delivery reviews from Google Sheets with Prooftask and Slack

## Proposed description

For automation consultants coordinating client deliverables in Google Sheets. Prepare a validated, persistent delivery job and notify an internal reviewer in Slack; deliberately submit the exact reviewed job; then write the buyer's current decision back to the original queue.

One workflow provides three explicit run modes with one configuration. Preparation validates current agreement access and material mappings, persists retry identity before the API call and reuses saved jobs. Submission requires operator confirmation bound to the reviewed task, request and job IDs. Status sync distinguishes pending review, corrections, exact-version acceptance and unknown reads. Corrections retain the previous row and use a new delivery identity.

Requires an agreed Prooftask project, an appropriately scoped Agent credential, Google Sheets read/write access and an internal Slack bot. Uses standard n8n nodes. Buyer review happens in Prooftask between runs; acceptance, signing and payment are never automated. Prooftask service availability and pricing apply separately. Setup, recovery, sample queue and acceptance steps are supplied.

## Message draft

Hi Miha,

Thank you for reviewing template #21159. We are revising the workflow around a complete consultant delivery scenario rather than preparation alone: prepare and internally review a delivery, deliberately submit the exact saved job, then write the buyer's current decision back to its original Google Sheets row. Corrections retain separate delivery identities, and uncertain status reads do not report acceptance.

Could you confirm which revision the November 2 feedback refers to? We previously observed the listing as published, but its public page and template API now return 404. We want to update the existing submission with the correct scope rather than submit a duplicate.

The revision includes native-node API simulations and local browser execution evidence; live OAuth and vendor delivery are separate operator setup steps.

Best,
Prooftask

## Native-node correction and local lab

The native Slack V2 helper normalizes `ts` into `message_timestamp`. The previous reminder code accepted only `ts`; the revision accepts either successful receipt format and rejects failures or conflicting timestamps. Both reproducible exports are corrected, while the original portal JSON is retained as historical evidence.

The owner’s local n8n lab is running with a runnable SIMULATION workflow. Two browser executions succeeded; the repeated run kept task/request/job identity and a single captured message. See `evidence/n8n-native-provider-engine-20261102.json`, `evidence/n8n-local-lab-20261102.json` and `n8n/LOCAL_LAB.md`.
