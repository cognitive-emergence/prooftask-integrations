// Pure mapping helpers embedded in the distributable Code nodes. No secrets or network calls.
export function selectQueue(items) {
  const rows = items.map(i => i.json);
  const ids = new Set();
  for (const row of rows) {
    const id = String(row.task_id || '').trim();
    if (!id || !/^[A-Za-z0-9:_-]{1,100}$/.test(id) || ids.has(id)) {
      throw new Error('Every populated row needs a unique task_id (letters, digits, colon, underscore or hyphen). No rows were changed.');
    }
    ids.add(id);
  }
  if (rows.length > 200) throw new Error('Use a queue of at most 200 rows per manual run.');
  return items.flatMap((item, i) => String(item.json.ready_for_review).trim().toUpperCase() === 'YES'
    && !(item.json.job_id && item.json.notified_job_id === item.json.job_id)
    ? [{ json: item.json, pairedItem: { item: i } }] : []);
}

export function inspectDelivery(input) {
  const text = key => String(input[key] ?? '').trim();
  const row = { task_id: text('task_id'), project_id: text('project_id'), request_id: text('request_id'),
    request_json: text('request_json'), job_id: text('job_id'), notified_job_id: text('notified_job_id'),
    prepared_at: text('prepared_at'), kind: 'invalid', handover_state: 'NEEDS_INPUT', handover_note: '' };
  const invalid = message => ({ ...row, handover_note: message });
  const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
  if (!/^delivery_[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(row.project_id)) return invalid('Set the exact authorized project_id.');
  const summary = text('summary');
  if (summary.length < 10 || summary.length > 4000) return invalid('summary must contain 10–4000 characters describing this delivery.');
  let raw;
  try { raw = JSON.parse(text('materials_json')); } catch { return invalid('materials_json must be a JSON array. See the sample queue.'); }
  if (!Array.isArray(raw) || raw.length < 1 || raw.length > 20) return invalid('Provide 1–20 material items, one per agreed criterion.');
  const ids = new Set(), materials = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object' || Array.isArray(item) || Object.keys(item).some(k => !['criterionId', 'summary', 'references', 'files'].includes(k))) return invalid('Use only criterionId, summary, references and files in each material item.');
    if (typeof item.criterionId !== 'string' || !item.criterionId.trim() || item.criterionId.length > 64 || ids.has(item.criterionId)) return invalid('Each material needs a distinct agreed criterionId, up to 64 characters.');
    ids.add(item.criterionId);
    if (typeof item.summary !== 'string' || item.summary.trim().length < 10 || item.summary.length > 4000) return invalid('Each material summary must contain 10–4000 characters.');
    if (!Array.isArray(item.references) || item.references.length < 1 || item.references.length > 5 || new Set(item.references).size !== item.references.length || item.references.some(r => typeof r !== 'string' || !/^https:\/\/[^\s]+$/.test(r))) return invalid('Provide 1–5 distinct original material references per criterion, using HTTPS. Links are not fetched or quality-checked.');
    if (!Array.isArray(item.files) || item.files.length !== item.references.length || new Set(item.files.map(f => f?.reference)).size !== item.references.length) return invalid('Each original material reference needs matching actual file metadata: reference, name, size and sha256.');
    for (const file of item.files) {
      if (!file || typeof file !== 'object' || Object.keys(file).some(k => !['reference','name','size','sha256'].includes(k)) || !item.references.includes(file.reference) || typeof file.name !== 'string' || !file.name.trim() || file.name.length > 255 || !Number.isSafeInteger(file.size) || file.size < 0 || file.size > 2 * 1024 * 1024 * 1024 || !/^[a-f0-9]{64}$/.test(file.sha256 || '')) return invalid('File metadata must describe the actual original: matching reference, name, byte size up to 2 GiB and lowercase SHA-256 digest.');
    }
    materials.push({ criterionId: item.criterionId, summary: item.summary, references: item.references, files: item.files });
  }
  if (row.job_id && !/^job_[a-f0-9]{64}$/.test(row.job_id)) return invalid('job_id is invalid. Preserve the original identity and reconcile it before retrying.');
  if ((row.request_id || row.request_json || row.job_id) && !(row.request_id && row.request_json)) return invalid('Incomplete retry identity. Recover request_id AND request_json; do not generate a replacement for an uncertain request.');
  const requestId = row.request_id || input.candidate_request_id;
  if (!uuid.test(requestId || '')) return invalid('A valid UUID v4 request ID is required.');
  const body = { requestId, projectId: row.project_id, workflowReference: 'sheet:' + row.task_id, summary, materials };
  const serialized = JSON.stringify(body);
  if (serialized.length > 40000) return invalid('The saved request exceeds the 40,000 character queue-cell limit.');
  if (row.request_json && row.request_json !== serialized) return invalid('The source differs from the saved request. Restore it to retry; use a new task row for a deliberate new delivery revision.');
  return { ...row, request_id: requestId, request_json: serialized, kind: row.job_id ? 'resume' : 'prepare', handover_state: 'PREPARING', handover_note: 'Preparing only. No delivery has been submitted or accepted.' };
}

export function checkProject(row, response) {
  const fail = message => ({ ...row, kind: 'invalid', handover_state: 'NEEDS_OWNER', handover_note: message });
  if (response.statusCode !== 200 || !response.body?.project) return fail('Authorized project read failed. Check the scoped credential and project access; no preparation was attempted.');
  const view = response.body, project = view.project;
  if (project.taskId !== row.project_id) return fail('The API returned a different project. Stop and check configuration.');
  if (row.kind === 'prepare' && (view.automation?.mode !== 'AGENT' || !view.availableActions?.includes('SUBMIT_MATERIALS'))) return fail('This project does not currently permit this Agent to prepare delivery. The owner must review its authorization.');
  const criteria = project.agreement?.criteria;
  const materials = JSON.parse(row.request_json).materials;
  if (!Array.isArray(criteria) || criteria.length !== materials.length || criteria.some(c => !materials.some(m => m.criterionId === c.id))) return fail('Map material items to every CURRENT agreed criterion exactly once. Completeness is not buyer acceptance.');
  const rawUrl = view.humanUrl;
  const humanUrl = typeof rawUrl === 'string' && rawUrl.startsWith('/') && !rawUrl.startsWith('//')
    ? 'https://prooftask.com' + rawUrl : typeof rawUrl === 'string' && rawUrl.startsWith('https://prooftask.com/') ? rawUrl : '';
  return { ...row, human_url: humanUrl };
}

export function confirmSnapshot(expected, items) {
  if (items.length !== 1) throw new Error('Expected exactly one task row on readback. No preparation was attempted.');
  const saved = items[0].json;
  if (saved.task_id !== expected.task_id || saved.request_id !== expected.request_id || saved.request_json !== expected.request_json || saved.job_id) {
    throw new Error('Durable request readback did not match, or a job already exists. Stop concurrent runs and reconcile the queue before continuing.');
  }
  return expected;
}

export function assessJob(row, response, mode, now) {
  const result = { task_id: row.task_id, request_id: row.request_id, job_id: row.job_id, prepared_at: row.prepared_at,
    handover_state: 'RETRY_SAME_REQUEST', handover_note: '', notify: false, human_url: row.human_url || '' };
  const status = response.statusCode;
  const failed = message => ({ ...result, handover_note: message });
  if (!Number.isInteger(status)) return failed('Request outcome is uncertain. Retry with the SAME saved request or job ID; never clear its identity.');
  if (status < 200 || status >= 300) return failed('Prooftask returned HTTP ' + status + '. Resolve access, input or service errors, then retry the same saved identity. No acceptance is inferred.');
  const value = response.body;
  if (!value || !/^job_[a-f0-9]{64}$/.test(value.id || '') || value.workflowReference !== 'sheet:' + row.task_id) return failed('Unexpected job response. Reconcile the same request before continuing.');
  if (mode === 'prepare' && (value.prepared?.projectId !== row.project_id || value.prepared?.envelope?.input?.requestId !== row.request_id)) return failed('Prepared request identity did not match. Stop and reconcile the saved request.');
  if (mode === 'resume' && (value.id !== row.job_id || value.requestId !== row.request_id || value.current?.projectId !== row.project_id)) return failed('Saved job identity did not match. Stop and reconcile the original task.');
  if (typeof value.submitted !== 'boolean') return failed('Missing explicit submission state. Stop and reconcile the saved request.');
  if (value.submitted) return { ...result, job_id: value.id, handover_state: 'ALREADY_SUBMITTED', handover_note: 'This job was already submitted separately. Read its actual buyer decision in Prooftask; no new submission was made.' };
  return { ...result, job_id: value.id, prepared_at: row.prepared_at || now, handover_state: 'PREPARED',
    handover_note: 'Saved for authorized human review. Submission and buyer acceptance remain separate.', notify: row.notified_job_id !== value.id };
}

export function notificationText(result, config) {
  return ['Delivery ready for owner review: ' + result.task_id, 'Saved Prooftask job: ' + result.job_id,
    result.human_url ? 'Authorized project: ' + result.human_url : 'Open the corresponding authorized project in Prooftask.',
    'Queue: https://docs.google.com/spreadsheets/d/' + config.spreadsheetId + '/edit#gid=' + config.sheetId,
    'PREPARED only. Review the exact saved materials before a separate deliberate submission. Buyer acceptance and payment have not been recorded.'].join('\n');
}
