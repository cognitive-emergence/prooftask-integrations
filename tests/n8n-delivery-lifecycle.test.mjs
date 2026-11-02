import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { deliveryLifecycleWorkflow, validateConfiguration, selectReviewedJob } from '../scripts/build-n8n-delivery-lifecycle.mjs';
const config = { operation: 'submit', spreadsheetId: 'sheet-with-a-long-identifier', sheetId: '0', reviewedTaskId: 'task-1', reviewedJobId: 'job_' + 'a'.repeat(64), reviewedRequestId: '11111111-1111-4111-8111-111111111111', submitConfirmed: true };
const row = { task_id: config.reviewedTaskId, job_id: config.reviewedJobId, request_id: config.reviewedRequestId, project_id: 'delivery_test' };
row.request_json = JSON.stringify({ requestId: row.request_id, projectId: row.project_id, workflowReference: 'sheet:' + row.task_id });

test('submit requires explicit operator approval; queue fields cannot provide it', () => {
  assert.deepEqual(validateConfiguration(config), config);
  for (const change of [{ operation: 'automatic' }, { submitConfirmed: false }, { reviewedJobId: '' }, { reviewedRequestId: '' }, { reviewedTaskId: '' }]) assert.throws(() => validateConfiguration({ ...config, ...change }));
  assert.throws(() => selectReviewedJob([{ json: { ...row, confirmed: true } }], { ...config, submitConfirmed: false }));
  assert.throws(() => selectReviewedJob([{ json: row }], { ...config, operation: 'prepare' }));
});
test('changed, missing, duplicate or mismatched saved identity blocks submission', () => {
  assert.equal(selectReviewedJob([{ json: row }], config)[0].json.id, row.job_id);
  for (const change of [{ job_id: 'job_' + 'b'.repeat(64) }, { request_id: 'other' }, { task_id: 'other' }, { project_id: 'other' }, { request_json: '{}' }, { request_json: 'broken' }]) assert.throws(() => selectReviewedJob([{ json: { ...row, ...change } }], config));
  assert.throws(() => selectReviewedJob([], config));
  assert.throws(() => selectReviewedJob(Array.from({length:201}, (_, i) => ({json:{...row, task_id:'task-' + i}})), config), /200/);
  assert.throws(() => selectReviewedJob([{ json: row }, { json: row }], config));
});
test('single manual entry routes exclusively and submits before fresh queue sync', () => {
  const flow = deliveryLifecycleWorkflow();
  assert.deepEqual(JSON.parse(readFileSync(new URL('../n8n/delivery-lifecycle.json', import.meta.url))), flow);
  assert.equal(flow.nodes.filter(n => n.type.endsWith('.manualTrigger')).length, 1);
  assert.equal(new Set(flow.nodes.map(n => n.name)).size, flow.nodes.length);
  const configuration = flow.nodes.find(n => n.name === 'Configuration');
  assert.equal(configuration.type, 'n8n-nodes-base.set');
  const values = Object.fromEntries(configuration.parameters.assignments.assignments.map(a => [a.name, a.value]));
  assert.equal(values.submitConfirmed, false); assert.equal(values.operation, 'prepare');
  assert.equal(flow.connections['Prepare deliveries'].main[0][0].node, 'Prepare · Read delivery queue');
  assert.equal(flow.connections['Prepare deliveries'].main[1][0].node, 'Submit reviewed job');
  assert.equal(flow.connections['Submit reviewed job'].main[0][0].node, 'Read queue for explicit submission');
  assert.equal(flow.connections['Submit reviewed job'].main[1][0].node, 'Sync · Read saved delivery queue');
  assert.equal(flow.connections['Submit saved job'].main[0][0].node, 'Sync · Read saved delivery queue');
  const submit = flow.nodes.find(n => n.name === 'Submit saved job');
  assert.equal(submit.onError, undefined); assert.equal(submit.parameters.options.response.response.neverError, false);
  const names = new Set(flow.nodes.map(n => n.name));
  for (const node of flow.nodes) {
    if (node.type.endsWith('.code')) new Function(node.parameters.jsCode);
    for (const match of JSON.stringify(node.parameters).matchAll(/\$\('([^']+)'\)/g)) assert.ok(names.has(match[1]), 'Unknown paired-item reference: ' + match[1]);
    assert.equal(node.credentials, undefined);
  }
  // Exercise namespaced embedded approval code, rather than only its source function.
  const code = flow.nodes.find(n => n.name === 'Bind explicit approval to saved task').parameters.jsCode;
  assert.equal(new Function('$input', '$', code)({ all: () => [{ json: row }] }, () => ({ first: () => ({ json: config }) }))[0].json.id, row.job_id);
});
