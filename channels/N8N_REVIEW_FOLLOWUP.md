# Review follow-up draft — not sent

Submission: #21159. Candidate source: upstream snapshot `6d54a1afa459bf83bed8eebc99cb6febb8659f5b` plus the local lifecycle changes.

## Current follow-up evidence

- 2026-11-02: public listing and official template API return HTTP 404; API message is `Workflow not found`.
- After the owner signed in, Creator Portal shows the existing submission under Pending with `IMPLEMENT CHANGES` (displayed date 2026-10-28). The resubmission dialog permits replacing the workflow JSON and submitting for human review.
- `Copy your last submitted JSON` was saved to `evidence/n8n-last-submitted-20261102.json` and recursively compared with the prior repository export: all values match (28 execution nodes and seven notes). The feedback therefore applies to the enhanced preparation export, not merely the initial small example. A replacement file was staged for preflight only; no human-review resubmission has been made.
- The revised JSON passed the Creator Portal upload preflight: `Uploaded: delivery-lifecycle.json`; Submit for human review is enabled. The submit button has not been clicked.
- Local checks: 20 tests passed; export/provenance/MCP check passed; no actual n8n-engine execution or real Google/Slack transport acceptance for the combined candidate.
- Repository status wording is corrected locally. The live Prooftask website has not been changed.

## Confirm before sending

- Read the existing Creator Portal submission and retain the observed `IMPLEMENT CHANGES` state and original JSON evidence. The current combined candidate was not in the last submitted JSON.
- Import and run the combined candidate in n8n, then complete the authorized end-to-end demonstration with actual Sheet/Slack transport.
- Replace the previous submission only after review of the exact final JSON and description. No duplicate submission or approval claim.

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

We will provide the final tested workflow and an end-to-end demonstration with the revision.

Best,
Prooftask
