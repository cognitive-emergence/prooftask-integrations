// Readback mapping for a saved delivery. No network, business commands or event acknowledgements.
export function selectSavedJobs(items) {
  const ids = new Set();
  if (items.length > 200) throw new Error('Use at most 200 queue rows per manual sync.');
  for (const { json: row } of items) {
    if (!/^[A-Za-z0-9:_-]{1,100}$/.test(row.task_id || '') || ids.has(row.task_id)) throw new Error('Every populated row needs a unique task_id. No rows were changed.');
    ids.add(row.task_id);
    if (!row.job_id) continue;
    if (!/^job_[a-f0-9]{64}$/.test(row.job_id) || !/^delivery_[a-f0-9-]{36}$/.test(row.project_id || '') || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(row.request_id || '')) throw new Error('Recover the exact job, project and request IDs before syncing. No rows were changed.');
  }
  return items.flatMap((item, i) => item.json.job_id ? [{ json: item.json, pairedItem: { item: i } }] : []);
}

export function savedJobStatus(row, response) {
  const output = { task_id: row.task_id, review_job_id: row.job_id, review_state: 'UNKNOWN', review_decision: '', review_accepted: 'UNKNOWN', review_next_action: 'RECONCILE_SUBMISSION', review_observed_at: '', review_url: '', review_note: '' };
  const fail = note => ({ ...output, review_note: note });
  if (response.statusCode !== 200) return fail('Readback failed or access changed. Preserve the saved IDs, reconcile authorization and retry; acceptance is unknown.');
  const value = response.body, current = value?.current, next = value?.continuation;
  if (!value || value.id !== row.job_id || value.requestId !== row.request_id || value.workflowReference !== 'sheet:' + row.task_id || current?.projectId !== row.project_id
    || !/^[a-f0-9]{64}$/.test(current.agreementDigest || '') || !/^sha256:[a-f0-9]{64}$/.test(current.headEventHash || '')
    || typeof current.state !== 'string' || !current.state || !Number.isFinite(Date.parse(current.observedAt || ''))
    || typeof value.submitted !== 'boolean' || typeof value.appliesToSavedSubmission !== 'boolean'
    || next?.schema !== 'prooftask.automation-continuation/v1' || typeof next.acceptedForSavedSubmission !== 'boolean'
    || !['REVIEW_CURRENT_PROJECT', 'REVIEW_SAVED_REQUEST', 'RECONCILE_SUBMISSION', 'RECORD_ACCEPTANCE', 'WAIT_FOR_HUMAN', 'PREPARE_CORRECTION', 'RECORD_REJECTION', 'WAIT_FOR_BUYER'].includes(next.nextAction)) return fail('Job readback did not match this exact queue row or supported contract. Reconcile the original task before relying on its status.');
  const accepted = value.submitted && value.appliesToSavedSubmission && value.decisionForSavedSubmission === 'ACCEPT' && current.state === 'BUYER_CONFIRMED' && next.acceptedForSavedSubmission && next.nextAction === 'RECORD_ACCEPTANCE';
  if ((next.acceptedForSavedSubmission || next.nextAction === 'RECORD_ACCEPTANCE') && !accepted) return fail('Conflicting acceptance facts. Read the exact saved submission in Prooftask; do not mark this task accepted.');
  const rawUrl = current.humanUrl;
  const url = typeof rawUrl === 'string' && rawUrl.startsWith('/') && !rawUrl.startsWith('//') ? 'https://prooftask.com' + rawUrl
    : typeof rawUrl === 'string' && rawUrl.startsWith('https://prooftask.com/') ? rawUrl : '';
  const decision = value.appliesToSavedSubmission ? value.decisionForSavedSubmission : null;
  if (decision !== null && !['ACCEPT', 'REQUEST_CHANGES', 'REQUEST_EVIDENCE', 'REJECT'].includes(decision)) return fail('Unknown saved-submission decision. Review the current API contract before using this status.');
  return { ...output, review_state: current.state, review_decision: decision || '', review_accepted: accepted ? 'YES' : 'NO', review_next_action: next.nextAction, review_observed_at: current.observedAt, review_url: url,
    review_note: 'Current readback for this saved job only. A buyer decision does not establish signing, record verification or payment.' };
}
