import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { selectQueue, inspectDelivery, checkProject, confirmSnapshot, assessJob, notificationText } from '../scripts/n8n-delivery-queue.mjs';
import { deliveryQueueWorkflow } from '../scripts/build-n8n-delivery-queue.mjs';

const project = 'delivery_' + randomUUID(), request = randomUUID(), job = 'job_' + 'a'.repeat(64);
const sample = () => ({ task_id: 'client-42-v1', ready_for_review: 'YES', project_id: project, summary: 'Configured workflow delivery for client review.', materials_json: JSON.stringify([{ criterionId: 'workflow', summary: 'The exact original workflow export.', references: ['https://example.com/workflow.json'], files: [{reference:'https://example.com/workflow.json',name:'workflow.json',size:2,sha256:'44136fa355b3678a1146ad16f7e8649e94fb4fc21fe77e8310c060f61caaff8a'}] }]), candidate_request_id: request });
const view = () => ({ statusCode: 200, body: { project: { taskId: project, agreement: { criteria: [{ id: 'workflow' }] } }, automation: { mode: 'AGENT' }, availableActions: ['SUBMIT_MATERIALS'], humanUrl: '/authorized-project' } });
const prepared = row => ({ statusCode: 201, body: { id: job, workflowReference: 'sheet:' + row.task_id, submitted: false, prepared: { projectId: project, envelope: { input: { requestId: row.request_id } } } } });

test('only explicit queue choices are selected; duplicate IDs stop before any work', () => {
  assert.equal(selectQueue([{ json: sample() }, { json: { ...sample(), task_id: 'not-ready', ready_for_review: 'NO' } }]).length, 1);
  assert.equal(selectQueue([{ json: { ...sample(), job_id: job, notified_job_id: job } }]).length, 0);
  assert.throws(() => selectQueue([{ json: sample() }, { json: sample() }]), /unique task_id/);
});
test('missing evidence receives actionable feedback without a prepared body', () => {
  const row = inspectDelivery({ ...sample(), materials_json: '[{"criterionId":"workflow","summary":"The original evidence is missing.","references":[]}]' });
  assert.equal(row.kind, 'invalid'); assert.equal(row.handover_state, 'NEEDS_INPUT'); assert.match(row.handover_note, /original material/);
});
test('original references require actual matching file versions before any API call', () => {
  const input=sample(), materials=JSON.parse(input.materials_json);
  materials[0].files=[];
  assert.match(inspectDelivery({...input,materials_json:JSON.stringify(materials)}).handover_note,/matching actual file metadata/);
  materials[0].files=[{reference:'https://different.example/file',name:'workflow.json',size:2,sha256:'a'.repeat(64)}];
  assert.equal(inspectDelivery({...input,materials_json:JSON.stringify(materials)}).kind,'invalid');
});
test('frozen identity survives a new run and rejects changed input or incomplete recovery', () => {
  const first = inspectDelivery(sample());
  const next = inspectDelivery({ ...sample(), request_id: first.request_id, request_json: first.request_json, candidate_request_id: randomUUID() });
  assert.equal(next.request_id, first.request_id); assert.equal(next.request_json, first.request_json);
  assert.equal(inspectDelivery({ ...sample(), request_id: first.request_id }).kind, 'invalid');
  assert.match(inspectDelivery({ ...sample(), summary: 'Changed intended delivery description.', request_id: first.request_id, request_json: first.request_json }).handover_note, /differs/);
});
test('current agreement, project identity, permission and safe review links are enforced', () => {
  const row = inspectDelivery(sample());
  assert.equal(checkProject(row, view()).kind, 'prepare');
  const missing = view(); missing.body.project.agreement.criteria.push({ id: 'instructions' });
  assert.equal(checkProject(row, missing).kind, 'invalid');
  const paused = view(); paused.body.automation.mode = 'HUMAN'; assert.equal(checkProject(row, paused).kind, 'invalid');
  const other = view(); other.body.project.taskId = 'delivery_' + randomUUID(); assert.equal(checkProject(row, other).kind, 'invalid');
  const redirect = view(); redirect.body.humanUrl = '//other.example/private'; assert.equal(checkProject(row, redirect).human_url, '');
});
test('preparation requires an exact durable readback before the HTTP step', () => {
  const row = inspectDelivery(sample());
  assert.equal(confirmSnapshot(row, [{ json: row }]), row);
  assert.throws(() => confirmSnapshot(row, []), /exactly one/);
  assert.throws(() => confirmSnapshot(row, [{ json: { ...row, request_id: randomUUID() } }]), /did not match/);
  assert.throws(() => confirmSnapshot(row, [{ json: { ...row, job_id: job } }]), /already exists/);
});
test('uncertain and invalid responses never become prepared, accepted or payable', () => {
  const row = inspectDelivery(sample());
  for (const response of [{ error: 'timeout' }, { statusCode: 403 }, { statusCode: 500 }, { statusCode: 200, body: { id: job, submitted: false, workflowReference: 'sheet:another-task' } }]) {
    const result = assessJob(row, response, 'prepare', '2026-10-19T13:00:00Z');
    assert.equal(result.handover_state, 'RETRY_SAME_REQUEST'); assert.equal(result.notify, false); assert.equal(result.job_id, '');
  }
  const response = prepared(row); response.body.prepared.envelope.input.requestId = randomUUID();
  assert.equal(assessJob(row, response, 'prepare', '').notify, false);
});
test('valid preparation only enables an internal reminder; submitted jobs remain separate', () => {
  const row = inspectDelivery(sample()), response = prepared(row);
  const result = assessJob(row, response, 'prepare', '2026-10-19T13:00:00Z');
  assert.equal(result.handover_state, 'PREPARED'); assert.equal(result.notify, true);
  const message = notificationText(result, { spreadsheetId: 'fictional-sheet', sheetId: '0' });
  assert.match(message, /PREPARED only/); assert.doesNotMatch(message, /example.com\/workflow/);
  response.body.submitted = true; assert.equal(assessJob(row, response, 'prepare', '').handover_state, 'ALREADY_SUBMITTED');
  const saved = { statusCode: 200, body: { id: job, workflowReference: 'sheet:' + row.task_id, requestId: request, submitted: false, current: { projectId: project } } };
  assert.equal(assessJob({ ...row, job_id: job }, saved, 'resume', '').notify, true);
  saved.body.requestId = randomUUID(); assert.equal(assessJob({ ...row, job_id: job }, saved, 'resume', '').notify, false);
});
test('export is reproducible, inactive and scoped; source snapshots remain intact', () => {
  const flow = deliveryQueueWorkflow();
  assert.deepEqual(JSON.parse(readFileSync(new URL('../channels/n8n-prepare-client-delivery.json', import.meta.url))), flow);
  assert.equal(flow.active, false); assert.deepEqual(flow.pinData, {});
  assert.ok(flow.nodes.filter(n => n.type.endsWith('stickyNote')).length >= 3);
  const names = new Set(flow.nodes.map(n => n.name));
  for (const n of flow.nodes) {
    assert.equal(n.credentials, undefined);
    if (n.type.endsWith('.code')) assert.doesNotThrow(() => new Function('$input', '$', n.parameters.jsCode));
    if (n.type.endsWith('httpRequest')) {
      assert.ok(n.parameters.url.includes('https://prooftask.com/api/agents/v1/'));
      assert.equal(n.parameters.options.redirect.redirect.followRedirects, false);
      assert.doesNotMatch(n.parameters.url, /\/submit|acceptance|payments/);
    }
  }
  for (const connection of Object.values(flow.connections)) for (const branch of connection.main) for (const edge of branch || []) assert.ok(names.has(edge.node));
  assert.equal(flow.connections['Persist retry identity'].main[0][0].node, 'Read persisted request');
  assert.equal(flow.connections['Confirm persisted request'].main[0][0].node, 'Prepare saved delivery');
  assert.equal(flow.connections['Notify responsible team'].main[0][0].node, 'Remember successful reminder');
});
