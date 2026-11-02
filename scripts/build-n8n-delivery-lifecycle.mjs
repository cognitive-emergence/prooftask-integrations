import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { deliveryQueueWorkflow } from './build-n8n-delivery-queue.mjs';
import { jobStatusWorkflow } from './build-n8n-job-status.mjs';

export function validateConfiguration(value) {
  if (!['prepare', 'submit', 'sync'].includes(value.operation)) throw new Error('Choose prepare, submit or sync.');
  if (!/^[a-zA-Z0-9_-]{20,}$/.test(value.spreadsheetId) || value.spreadsheetId.startsWith('REPLACE') || !/^\d+$/.test(value.sheetId)) throw new Error('Set spreadsheetId and numeric sheetId.');
  if (value.operation === 'prepare' && !/^[CG][A-Z0-9]+$/.test(value.slackChannelId)) throw new Error('Set the authorized Slack channel ID.');
  if (value.operation === 'submit' && (value.submitConfirmed !== true || !/^[A-Za-z0-9:_-]{1,100}$/.test(value.reviewedTaskId) || !/^job_[a-f0-9]{64}$/.test(value.reviewedJobId) || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(value.reviewedRequestId))) throw new Error('Review the frozen request and originals, then explicitly confirm the exact task, request and saved job.');
  return value;
}

export function selectReviewedJob(items, config) {
  if (items.length > 200) throw new Error('Use at most 200 queue rows before submitting or syncing.');
  const ids = new Set();
  for (const { json: row } of items) {
    if (!row.task_id || ids.has(row.task_id)) throw new Error('Queue task IDs must be present and unique.');
    ids.add(row.task_id);
  }
  const matches = items.filter(({ json }) => json.task_id === config.reviewedTaskId);
  if (matches.length !== 1) throw new Error('Reviewed task must still exist exactly once.');
  const row = matches[0].json;
  if (config.operation !== 'submit' || config.submitConfirmed !== true || row.job_id !== config.reviewedJobId || row.request_id !== config.reviewedRequestId) throw new Error('Explicit approval does not match this saved task, request and job.');
  let request;
  try { request = JSON.parse(row.request_json); } catch { throw new Error('Recover the frozen request before submission.'); }
  if (request.requestId !== row.request_id || request.projectId !== row.project_id || request.workflowReference !== 'sheet:' + row.task_id) throw new Error('Frozen request does not belong to the reviewed queue task.');
  return [{ json: { id: row.job_id, confirmed: true }, pairedItem: { item: items.indexOf(matches[0]) } }];
}

export function deliveryLifecycleWorkflow() {
  const nodes = [], connections = {};
  const add = (name, type, parameters, position, version = 2) => nodes.push({ id: 'pt-lifecycle-' + nodes.length, name, type: 'n8n-nodes-base.' + type, typeVersion: version, position, parameters });
  const edge = (from, to, output = 0) => { const main = (connections[from] ||= { main: [] }).main; (main[output] ||= []).push({ node: to, type: 'main', index: 0 }); };
  add('Run delivery lifecycle', 'manualTrigger', {}, [0, 0], 1);
  const defaults = { operation: 'prepare', spreadsheetId: 'REPLACE_SPREADSHEET_ID', sheetId: '0', slackChannelId: 'REPLACE_SLACK_CHANNEL_ID', reviewedTaskId: '', reviewedJobId: '', reviewedRequestId: '', submitConfirmed: false };
  add('Configuration', 'set', { assignments: { assignments: Object.entries(defaults).map(([name, value]) => ({ id: 'config-' + name, name, value, type: typeof value })) }, options: {} }, [220, 0], 3.4);
  nodes.at(-1).notes = 'Choose operation: prepare, submit or sync. spreadsheetId is the document ID; sheetId is the numeric tab ID. slackChannelId identifies the internal review channel. For submit only, copy the reviewed task_id, job_id and request_id into reviewedTaskId, reviewedJobId and reviewedRequestId; set submitConfirmed=true after reviewing the frozen request and actual originals. Reset it after running. No credentials belong here.';
  nodes.at(-1).notesInFlow = true;
  add('Validate configuration', 'code', { jsCode: 'const validate=' + validateConfiguration.toString() + ';return [{json:validate($input.first().json)}];' }, [440, 0]);
  function condition(name, operation, position) {
    add(name, 'if', { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 }, conditions: [{ id: operation, leftValue: '={{ $json.operation }}', rightValue: operation, operator: { type: 'string', operation: 'equals' } }], combinator: 'and' }, options: {} }, position, 2.2);
  }
  condition('Prepare deliveries', 'prepare', [660, 0]);
  condition('Submit reviewed job', 'submit', [660, 900]);
  edge('Run delivery lifecycle', 'Configuration'); edge('Configuration', 'Validate configuration'); edge('Validate configuration', 'Prepare deliveries'); edge('Prepare deliveries', 'Submit reviewed job', 1);

  // Namespace every component reference, including paired-item lookups inside code.
  function component(flow, prefix, offset) {
    const excluded = new Set(flow.nodes.filter(n => n.type.endsWith('.manualTrigger') || n.name === 'Configuration' || (n.type.endsWith('.stickyNote') && n.parameters.color === 1)).map(n => n.name));
    const mapping = new Map(flow.nodes.filter(n => !excluded.has(n.name)).map(n => [n.name, prefix + n.name]));
    const rename = value => {
      if (typeof value === 'string') {
        for (const [before, after] of mapping) value = value.replaceAll("$('" + before + "')", "$('" + after + "')");
        return value;
      }
      if (Array.isArray(value)) return value.map(rename);
      if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, v]) => [key, rename(v)]));
      return value;
    };
    for (const n of flow.nodes) if (mapping.has(n.name)) {
      const node = rename(structuredClone(n)); node.name = mapping.get(n.name); node.id = prefix.trim() + n.id; node.position = [n.position[0] + offset[0], n.position[1] + offset[1]]; nodes.push(node);
    }
    for (const [from, connection] of Object.entries(flow.connections)) if (mapping.has(from)) {
      for (const [output, list] of connection.main.entries()) for (const target of list || []) if (mapping.has(target.node)) edge(mapping.get(from), mapping.get(target.node), output);
    }
    return mapping;
  }
  component(deliveryQueueWorkflow(), 'Prepare · ', [700, 0]);
  component(jobStatusWorkflow(), 'Sync · ', [700, 1800]);
  const queueSection = nodes.find(n => n.name === 'Prepare · Section 1 — delivery queue');
  queueSection.position = [1040, 0]; queueSection.parameters.width = 680;
  edge('Prepare deliveries', 'Prepare · Read delivery queue');
  edge('Submit reviewed job', 'Sync · Read saved delivery queue', 1);
  const submit = JSON.parse(readFileSync(new URL('../n8n/send-job.json', import.meta.url)));
  const sheet = structuredClone(nodes.find(n => n.name === 'Prepare · Read delivery queue'));
  sheet.id = 'pt-lifecycle-submit-read'; sheet.name = 'Read queue for explicit submission'; sheet.position = [1100, 1200]; nodes.push(sheet);
  add('Bind explicit approval to saved task', 'code', { jsCode: 'const select=' + selectReviewedJob.toString() + ";return select($input.all(),$('Configuration').first().json);" }, [1320, 1200]);
  const submitNode = structuredClone(submit.nodes.find(n => n.name === 'Submit saved job'));
  submitNode.id = 'pt-lifecycle-submit'; submitNode.position = [1540, 1200]; nodes.push(submitNode);
  edge('Submit reviewed job', 'Read queue for explicit submission'); edge('Read queue for explicit submission', 'Bind explicit approval to saved task'); edge('Bind explicit approval to saved task', 'Submit saved job'); edge('Submit saved job', 'Sync · Read saved delivery queue');
  const note = (name, position, width, height, content, color = 7) => add(name, 'stickyNote', { content, width, height, color }, position, 1);
  note('Start here', [-650, -100], 600, 1100, `### How it works
For automation consultants managing client deliverables in Google Sheets. Choose one manual operation per run: prepare validated jobs and notify an internal Slack reviewer; deliberately submit one exact reviewed job; or sync buyer decisions to the original rows. Submission also refreshes queue status. Buyer review happens in Prooftask between runs. Corrections use a new task row, preserving delivery history.

### Setup
1. Import the [sample queue](https://github.com/cognitive-emergence/prooftask-integrations/blob/fix/n8n-delivery-lifecycle-review/n8n/delivery-lifecycle-example.csv). Replace fictional data with actual material references, file metadata and agreed project criteria.
2. Set spreadsheetId, numeric sheetId and slackChannelId in Configuration. Follow the [complete setup and recovery guide](https://github.com/cognitive-emergence/prooftask-integrations/blob/fix/n8n-delivery-lifecycle-review/n8n/DELIVERY_LIFECYCLE.md).
3. Use the same Google Sheets OAuth credential on every Sheet node, the original project-scoped Agent Header Auth on all five Prooftask HTTP nodes, and an internal Slack bot with chat:write.
4. Run operation=prepare. Review the frozen request and originals. For operation=submit, set reviewedTaskId, reviewedRequestId, reviewedJobId and submitConfirmed=true deliberately. Reset confirmation afterwards.
5. After buyer action, run operation=sync; inspect review_next_action and review_accepted.

One execution per queue at a time. Preserve IDs after failures; sync uncertain submissions before retrying. UNKNOWN is not acceptance. No automatic buyer decision, signing or payment. Prooftask availability and pricing apply. Uses standard nodes; no sub-workflows required.`, 1);
  note('Deliberately submit', [1000, 980], 1050, 470, '## Submit the reviewed job\nExplicit operator approval must match one saved task, request and job. Current permissions apply. Success refreshes queue status; timeout requires manual reconciliation.');
  note('Observe buyer decision', [1000, 1980], 1800, 650, '## 3 · Sync\nRead saved jobs, including already-notified deliveries. Update only review_* columns on original tasks. Pending, corrections, exact acceptance and UNKNOWN remain distinct. Buyer reviews in Prooftask between runs.');
  return { name: 'Manage client delivery reviews from Google Sheets with Prooftask and Slack', nodes, connections, active: false, settings: { executionOrder: 'v1', saveDataSuccessExecution: 'none', saveDataErrorExecution: 'none', saveManualExecutions: false }, pinData: {}, tags: [] };
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeFileSync(new URL('../n8n/delivery-lifecycle.json', import.meta.url), JSON.stringify(deliveryLifecycleWorkflow(), null, 2) + '\n');
  console.log('Built inactive delivery lifecycle candidate.');
}
