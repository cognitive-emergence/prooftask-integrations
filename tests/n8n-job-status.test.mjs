import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { selectSavedJobs, savedJobStatus } from '../scripts/n8n-job-status.mjs';
import { jobStatusWorkflow } from '../scripts/build-n8n-job-status.mjs';

const row = { task_id: 'client-42-v1', project_id: 'delivery_' + randomUUID(), request_id: randomUUID(), job_id: 'job_' + 'a'.repeat(64), notified_job_id: 'job_' + 'a'.repeat(64), ready_for_review: 'NO', request_json: 'original frozen request', materials_json: 'original material references' };
const response = () => ({ statusCode: 200, body: { id: row.job_id, requestId: row.request_id, workflowReference: 'sheet:' + row.task_id, submitted: true, appliesToSavedSubmission: true, decisionForSavedSubmission: 'ACCEPT',
  current: { projectId: row.project_id, agreementDigest: 'b'.repeat(64), headEventHash: 'sha256:' + 'c'.repeat(64), state: 'BUYER_CONFIRMED', observedAt: '2026-10-28T09:00:00.000Z', humanUrl: '/provider?delivery=' + row.project_id },
  continuation: { schema: 'prooftask.automation-continuation/v1', nextAction: 'RECORD_ACCEPTANCE', acceptedForSavedSubmission: true } } });

test('status sync includes notified jobs even when no new preparation is requested; ambiguous rows stop before writes', () => {
  assert.equal(selectSavedJobs([{ json: row }, { json: { task_id: 'not-prepared' } }]).length, 1);
  assert.throws(() => selectSavedJobs([{ json: row }, { json: row }]), /unique/);
  assert.throws(() => selectSavedJobs([{ json: { ...row, request_id: '' } }]), /exact/);
});

test('fresh exact acceptance becomes a status observation without overwriting preparation or claiming payment', () => {
  const result = savedJobStatus(row, response());
  assert.equal(result.review_accepted, 'YES'); assert.equal(result.review_job_id, row.job_id); assert.equal(result.review_decision, 'ACCEPT');
  for (const key of ['request_id', 'request_json', 'job_id', 'materials_json', 'handover_state', 'notified_job_id', 'paymentVerified']) assert.equal(Object.hasOwn(result, key), false);
  assert.match(result.review_url, /^https:\/\/prooftask.com\/provider/);
});

test('changed submission, correction and concern cannot inherit an old project acceptance', () => {
  for (const [state, action, decision] of [['SUBMITTED', 'WAIT_FOR_BUYER', null], ['CORRECTION_REQUIRED', 'PREPARE_CORRECTION', 'REQUEST_CHANGES'], ['CONCERN_RAISED', 'REVIEW_CURRENT_PROJECT', 'ACCEPT']]) {
    const value = response(); Object.assign(value.body.current, { state }); Object.assign(value.body.continuation, { nextAction: action, acceptedForSavedSubmission: false }); value.body.decisionForSavedSubmission = decision;
    assert.equal(savedJobStatus(row, value).review_accepted, 'NO');
  }
  const replaced = response(); replaced.body.appliesToSavedSubmission = false; replaced.body.continuation = { schema: 'prooftask.automation-continuation/v1', nextAction: 'RECONCILE_SUBMISSION', acceptedForSavedSubmission: false };
  const result = savedJobStatus(row, replaced); assert.equal(result.review_accepted, 'NO'); assert.equal(result.review_decision, '');
});

test('revoked, uncertain or mismatching reads clear any prior acceptance observation to UNKNOWN', () => {
  for (const value of [{}, { statusCode: 401 }, { statusCode: 503 }]) assert.equal(savedJobStatus(row, value).review_accepted, 'UNKNOWN');
  for (const change of [v => v.body.id = 'job_' + 'd'.repeat(64), v => v.body.requestId = randomUUID(), v => v.body.current.projectId = 'delivery_' + randomUUID(), v => v.body.workflowReference = 'sheet:other-task', v => v.body.appliesToSavedSubmission = false]) {
    const value = response(); change(value); assert.equal(savedJobStatus(row, value).review_accepted, 'UNKNOWN');
  }
  const unsafe = response(); unsafe.body.current.humanUrl = 'https://unrelated.example/project'; assert.equal(savedJobStatus(row, unsafe).review_url, '');
});

test('exported mapping node enforces the same exact-task checks; workflow only reads Prooftask and updates status columns', () => {
  const flow = jobStatusWorkflow();
  assert.deepEqual(JSON.parse(readFileSync(new URL('../n8n/sync-job-status.json', import.meta.url))), flow);
  const code = flow.nodes.find(n => n.name === 'Map exact saved status').parameters.jsCode;
  const input = { first: () => ({ json: response() }) }, lookup = () => ({ item: { json: row } });
  const result = new Function('$input', '$', code)(input, lookup);
  assert.equal(result[0].json.review_accepted, 'YES');
  for (const node of flow.nodes) {
    assert.equal(node.credentials, undefined);
    if (node.type.endsWith('.httpRequest')) { assert.equal(node.parameters.method, 'GET'); assert.equal(node.parameters.options.redirect.redirect.followRedirects, false); }
    if (node.type.endsWith('.googleSheets') && node.parameters.operation === 'update') {
      assert.deepEqual(node.parameters.columns.matchingColumns, ['task_id']);
      assert.ok(Object.keys(node.parameters.columns.value).every(k => k === 'task_id' || k.startsWith('review_')));
      assert.equal(node.parameters.options.cellFormat, 'RAW');
    }
  }
  assert.equal(flow.active, false); assert.deepEqual(flow.pinData, {});
  assert.equal(flow.connections['Update original queue status'].main[0][0].node, 'One saved job at a time');
});
