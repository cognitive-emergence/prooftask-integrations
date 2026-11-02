#!/usr/bin/env node
// Actual n8n engine + actual isolated Prooftask API. Google Sheets/Slack transport
// is replaced only in temporary test copies. No external business writes.
import assert from 'node:assert/strict';
import { generateKeyPairSync, randomUUID } from 'node:crypto';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createProviderFixture } from './n8n-lab/provider-fixture.mjs';
const nativeProviders = process.env.N8N_PROVIDER_TRANSPORT === 'native';

const source = process.env.PROOFTASK_SOURCE_ROOT;
const cli = process.env.N8N_CLI;
if (!source || !cli) throw new Error('Set PROOFTASK_SOURCE_ROOT to a Prooftask checkout and N8N_CLI to the n8n 2.39.8 executable.');
const load = path => import(pathToFileURL(resolve(source, path)).href);
const [{ PilotStore, PilotService, authorityScopesForRole, createPilotServer }, { AgentWorkflows }, { supplierDesignation }, { testTerms }] = await Promise.all([
  load('src/runtime/index.ts'), load('src/runtime/agents.ts'), load('tests/supplier-identity-fixture.ts'), load('tests/explicit-terms-fixture.ts'),
]);
const at = new Date().toISOString(), home = mkdtempSync(join(tmpdir(), 'pt-n8n-queue-'));
const keys = generateKeyPairSync('ed25519');
const store = new PilotStore(':memory:');
const runtime = new PilotService({ store, signer: { keyId: 'synthetic-n8n-queue', privateKey: keys.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString() } });
const service = runtime.acceptance, agents = new AgentWorkflows(store, service);
const principal = id => store.createPrincipalToken({ tenantId: id, organizationId: id, actorId: id + '@example.test', verifiedEmail: { email: id + '@example.test', verifiedAt: at }, role: 'TECHNICAL_OWNER', organizationRelationship: 'EMPLOYEE', authorityStatus: 'ADMIN_APPROVED', authorityReference: 'urn:test:' + id, authorityScopes: authorityScopesForRole('TECHNICAL_OWNER') }, at, new Date(Date.now() + 86400000).toISOString()).principal;
const buyer = principal('queue-buyer'), supplier = principal('queue-supplier');
const deadline = new Date(Date.now() + 86400000).toISOString();
const project = service.create(buyer, { requestId: randomUUID(), title: 'Synthetic queue delivery', scope: 'Validate actual n8n handover preparation and recovery.', buyerName: 'Synthetic Buyer', providerName: 'Synthetic Supplier', deadline, termsPolicy: testTerms(deadline), materialPolicy: 'FILE_DIGESTS', baselineStatement: 'No delivery has been submitted.', criteria: [{ id: 'workflow', title: 'Workflow export', requirement: 'Provide the original configured workflow.', evidenceRequired: 'Original workflow reference.' }] });
const capability = service.rotateLink(buyer, project.taskId, project.agreement.digest, supplierDesignation(service, buyer, project.taskId, supplier.actorId));
store.putSelfServiceRecord('supplier-recipient', project.taskId, { email: supplier.actorId, capabilityId: capability.capabilityId });
service.linkSupplierWorkspace(supplier, capability.token, true);
service.respond(capability.token, { requestId: randomUUID(), agreementDigest: project.agreement.digest, action: 'ACCEPT', actorId: supplier.actorId, actorRole: supplier.role, authorityAttested: true, reason: 'Accept the exact synthetic agreement.' }, supplier);
const grant = agents.create(supplier, { requestId: randomUUID(), name: 'Synthetic delivery queue', projectIds: [project.taskId], actions: ['SUBMIT_MATERIALS'], expiresAt: new Date(Date.now() + 3600000).toISOString(), confirmed: true, completionConfirmed: false });
const api = createPilotServer({ service: runtime });
await new Promise(r => api.listen(0, '127.0.0.1', r));
const origin = 'http://127.0.0.1:' + api.address().port;
let preparationCalls = 0;
api.on('request', (request) => { if (request.method === 'POST' && request.url === '/api/agents/v1/jobs') preparationCalls++; });
let queue = [], reminders = [], failWrite = false, failReminder = false;
const providers=createProviderFixture({getRows:()=>queue,setRows:rows=>queue=rows,reminders,shouldFailWrite:()=>{if(!failWrite)return false;failWrite=false;return true;},shouldFailReminder:()=>{if(!failReminder)return false;failReminder=false;return true;}});
const body = async req => { let s = ''; for await (const b of req) s += b; return s ? JSON.parse(s) : {}; };
const fixture = createServer(async (req, res) => {
  const send = (status, value) => { res.writeHead(status, { 'content-type': 'application/json' }); res.end(JSON.stringify(value)); };
  try {
    if(nativeProviders && await providers.handler(req,res))return;
    if (req.url === '/queue' && req.method === 'GET') return send(200, queue);
    const value = await body(req);
    if (req.url === '/queue/read') return send(200, queue.filter(r => r.task_id === value.task_id));
    if (req.url === '/queue/update') {
      if (failWrite && value.job_id) { failWrite = false; return send(503, { error: 'synthetic_writeback_failure' }); }
      const index = queue.findIndex(r => r.task_id === value.task_id); if (index < 0) return send(404, {});
      queue[index] = { ...queue[index], ...value }; return send(200, value);
    }
    if (req.url === '/notify') {
      if (failReminder) { failReminder = false; return send(503, { error: 'synthetic_reminder_failure' }); }
      reminders.push(value); return send(200, { ok: true, ts: String(Date.now()) + '.001' });
    }
    send(404, {});
  } catch { send(500, { error: 'synthetic_fixture_error' }); }
});
await new Promise(r => fixture.listen(0, '127.0.0.1', r));
const fixtureOrigin = 'http://127.0.0.1:' + fixture.address().port;
// isolated-vm requires this Node 20+ runtime flag; keep it in the disposable test process only.
const env = { ...process.env, NODE_OPTIONS: [process.env.NODE_OPTIONS, '--no-node-snapshot', ...(nativeProviders ? ['--require='+JSON.stringify(fileURLToPath(new URL('./n8n-lab/provider-redirect.cjs',import.meta.url)))] : [])].filter(Boolean).join(' '), ...(nativeProviders ? {N8N_LAB_PROVIDER_ORIGIN:fixtureOrigin} : {}), N8N_USER_FOLDER: home, N8N_ENCRYPTION_KEY: 'synthetic-queue-engine-test', N8N_DIAGNOSTICS_ENABLED: 'false', N8N_VERSION_NOTIFICATIONS_ENABLED: 'false', N8N_TEMPLATES_ENABLED: 'false', N8N_RUNNERS_MODE: 'internal', N8N_RUNNERS_BROKER_PORT: '5689', N8N_LOG_LEVEL: 'error' };
async function run(args, expectSuccess = true) {
  const output = await new Promise((resolveRun, reject) => {
    const child = spawn(cli, args, { env, stdio: ['ignore', 'pipe', 'pipe'] }); let out = '';
    child.stdout.on('data', b => out += b); child.stderr.on('data', b => out += b);
    const timer = setTimeout(() => child.kill('SIGKILL'), 120000);
    child.on('error', error => { clearTimeout(timer); reject(error); });
    child.on('close', status => { clearTimeout(timer); resolveRun({ status, out: out.replaceAll(grant.token, '[synthetic credential]') }); });
  });
  if (expectSuccess && output.status !== 0) throw new Error(output.out);
  if (!expectSuccess) assert.notEqual(output.status, 0, 'The injected transport failure must stop the workflow.');
  return output;
}
const row = task_id => ({ task_id, ready_for_review: 'YES', project_id: project.taskId, summary: 'Configured workflow ready for internal review.', materials_json: JSON.stringify([{ criterionId: 'workflow', summary: 'Original workflow export and setup instructions.', references: ['https://example.test/original-workflow.json'], files: [{reference:'https://example.test/original-workflow.json',name:'workflow.json',size:2,sha256:'44136fa355b3678a1146ad16f7e8649e94fb4fc21fe77e8310c060f61caaff8a'}] }]), request_id: '', request_json: '', job_id: '', handover_state: '', handover_note: '', prepared_at: '', notified_job_id: '' });
const exportBytes = readFileSync(new URL('../n8n/delivery-lifecycle.json', import.meta.url));
const exportSha256 = createHash('sha256').update(exportBytes).digest('hex');
const flow = JSON.parse(exportBytes); flow.id = 'synthetic-delivery-lifecycle';
function configure(values) {
  const node = flow.nodes.find(n => n.name === 'Configuration');
  for (const assignment of node.parameters.assignments.assignments) if (Object.hasOwn(values, assignment.name)) assignment.value = values[assignment.name];
}
configure({operation:'prepare', spreadsheetId:'synthetic-sheet-id-123456789',sheetId:'0',slackChannelId:'CSYNTHETIC'});
const googleCredentialId='11111111-2222-4333-8444-555555555555', slackCredentialId='11111111-2222-4333-8444-666666666666';
for (const node of flow.nodes) {
  if(nativeProviders && node.type.endsWith('googleSheets')) {node.credentials={googleSheetsOAuth2Api:{id:googleCredentialId,name:'Simulation only: Google Sheets'}};continue;}
  if(nativeProviders && node.type.endsWith('slack')) {node.credentials={slackApi:{id:slackCredentialId,name:'Simulation only: Slack'}};continue;}
  if (node.type.endsWith('googleSheets')) {
    const fields = Object.keys(node.parameters.columns?.value || {});
    const endpoint = node.parameters.operation === 'read' ? (node.parameters.filtersUI ? '/queue/read' : '/queue') : '/queue/update';
    node.type = 'n8n-nodes-base.httpRequest'; node.typeVersion = 4.2;
    node.parameters = { method: endpoint === '/queue' ? 'GET' : 'POST', url: fixtureOrigin + endpoint, options: {} };
    if (endpoint !== '/queue') Object.assign(node.parameters, { sendBody: true, specifyBody: 'json', jsonBody: endpoint === '/queue/read' ? '={{ JSON.stringify({task_id:$json.task_id}) }}' : '={{ JSON.stringify({' + fields.map(k => JSON.stringify(k) + ':$json.' + k).join(',') + '}) }}' });
  } else if (node.type.endsWith('slack')) {
    node.type = 'n8n-nodes-base.httpRequest'; node.typeVersion = 4.2;
    node.parameters = { method: 'POST', url: fixtureOrigin + '/notify', sendBody: true, specifyBody: 'json', jsonBody: '={{ JSON.stringify({text:$json.text}) }}', options: {} };
  } else if (node.type.endsWith('httpRequest')) {
    node.parameters.url = node.parameters.url.replace('https://prooftask.com', origin);
    delete node.parameters.authentication; delete node.parameters.genericAuthType;
    node.parameters.sendHeaders = true;
    node.parameters.headerParameters = { parameters: [{ name: 'Authorization', value: 'Bearer ' + grant.token }] };
  }
}
writeFileSync(join(home, 'workflow.json'), JSON.stringify(flow), { mode: 0o600 });
try {
  if(nativeProviders) {
    const credentials=[{id:googleCredentialId,name:'Simulation only: Google Sheets',type:'googleSheetsOAuth2Api',data:{clientId:'mock-client-id',clientSecret:'mock-client-secret',oauthTokenData:{access_token:'mock-google-access-token',token_type:'Bearer',expires_in:86400,expiry_date:Date.now()+86400000}}},{id:slackCredentialId,name:'Simulation only: Slack',type:'slackApi',data:{accessToken:'xoxb-mock-slack-token'}}];
    const credentialPath=join(home,'mock-credentials.json');writeFileSync(credentialPath,JSON.stringify(credentials),{mode:0o600});await run(['import:credentials','--input='+credentialPath]);
  }
  await run(['import:workflow', '--input=' + join(home, 'workflow.json')]);
  queue = [row('valid-v1'), { ...row('missing-v1'), materials_json: '[]' }];
  const initialEvents = service.get(buyer, project.taskId).events.length;
  await run(['execute', '--id=' + flow.id, '--rawOutput']);
  if(queue[0].handover_state !== 'PREPARED') {
    const response=await fetch(origin+'/api/agents/v1/jobs',{method:'POST',headers:{authorization:'Bearer '+grant.token,'content-type':'application/json'},body:queue[0].request_json});
    console.error(JSON.stringify({queueState:queue[0].handover_state,note:queue[0].handover_note,status:response.status,body:await response.json()}));
  }
  assert.equal(queue[0].handover_state, 'PREPARED',queue[0].handover_note); assert.equal(queue[1].handover_state, 'NEEDS_INPUT');
  assert.match(queue[0].job_id, /^job_[a-f0-9]{64}$/); assert.equal(reminders.length, 1);
  assert.equal(service.get(buyer, project.taskId).events.length, initialEvents, 'Preparation never submits or accepts.');
  await run(['execute', '--id=' + flow.id, '--rawOutput']);
  assert.equal(preparationCalls, 1); assert.equal(reminders.length, 1);
  console.log('PASS actual engine: real preparation, missing-row feedback, normal rerun skips the notified job.');

  queue = [row('writeback-v1')]; failWrite = true;
  await run(['execute', '--id=' + flow.id, '--rawOutput'], false);
  const frozen = queue[0].request_json, beforeReplay = store.listSelfServiceRecords('automation-job').length;
  assert.ok(frozen); assert.equal(queue[0].job_id, '');
  await run(['execute', '--id=' + flow.id, '--rawOutput']);
  assert.equal(queue[0].request_json, frozen); assert.equal(queue[0].handover_state, 'PREPARED');
  assert.equal(store.listSelfServiceRecords('automation-job').length, beforeReplay);
  console.log('PASS actual engine: lost sheet writeback recovers the same server job and frozen request.');

  queue = [row('reminder-v1')]; failReminder = true;
  await run(['execute', '--id=' + flow.id, '--rawOutput'], false);
  assert.ok(queue[0].job_id); const callsBeforeReminder = preparationCalls;
  await run(['execute', '--id=' + flow.id, '--rawOutput']);
  assert.equal(preparationCalls, callsBeforeReminder); assert.equal(queue[0].notified_job_id, queue[0].job_id);
  assert.equal(service.get(buyer, project.taskId).events.length, initialEvents);
  console.log('PASS actual engine: failed reminder resumes by saved job ID without preparing again.');

  const savedJob = queue[0].job_id, preparationCount = preparationCalls, reminderCount = reminders.length;
  const executeMode = async (operation, confirmed = false, overrides = {}) => {
    const configuration = {operation, spreadsheetId:'synthetic-sheet-id-123456789', sheetId:'0', slackChannelId:'CSYNTHETIC', reviewedTaskId:queue[0].task_id, reviewedJobId:savedJob, reviewedRequestId:queue[0].request_id, submitConfirmed:confirmed, ...overrides};
    configure(configuration);
    writeFileSync(join(home, 'workflow.json'), JSON.stringify(flow), {mode:0o600});
    await run(['import:workflow', '--input=' + join(home, 'workflow.json')]);
    return run(['execute', '--id=' + flow.id, '--rawOutput'], operation !== 'submit' || confirmed);
  };
  await executeMode('sync'); assert.equal(queue[0].review_accepted, 'NO'); assert.equal(queue[0].review_next_action, 'REVIEW_SAVED_REQUEST');
  await executeMode('submit', false);
  assert.equal(service.get(buyer, project.taskId).events.length, initialEvents, 'No submission without explicit approval.');
  await executeMode('submit', true);
  assert.equal(queue[0].review_accepted, 'NO'); assert.equal(queue[0].review_next_action, 'WAIT_FOR_BUYER', 'Submission automatically refreshes original queue status.');
  const submittedEvents = service.get(buyer, project.taskId).events.length;
  await executeMode('submit', true);
  assert.equal(service.get(buyer, project.taskId).events.length, submittedEvents, 'Replay must not create another delivery.');
  const firstSubmitted = service.get(buyer, project.taskId), checkedFiles = JSON.parse(queue[0].materials_json)[0].files;
  service.review(buyer, project.taskId, {requestId:randomUUID(),agreementDigest:firstSubmitted.agreement.digest,submissionId:firstSubmitted.submission.id,expectedEventHash:firstSubmitted.headEventHash,action:'REQUEST_CHANGES',reason:'The synthetic buyer requests a corrected original workflow.',nextAction:'WAIT_FOR_CORRECTION',criteria:[{criterionId:'workflow',verdict:'NOT_MET',materialAccess:'AVAILABLE',note:'The original requires a correction.',checkedFiles}]});
  await executeMode('sync'); assert.equal(queue[0].review_accepted,'NO'); assert.equal(queue[0].review_next_action,'PREPARE_CORRECTION');
  const correction = row('reminder-v2'), revisedMaterials = JSON.parse(correction.materials_json);
  revisedMaterials[0].references = ['https://example.test/corrected-workflow.json'];
  revisedMaterials[0].files = [{reference:revisedMaterials[0].references[0],name:'workflow-v2.json',size:4,sha256:createHash('sha256').update('[{}]').digest('hex')}];
  correction.materials_json = JSON.stringify(revisedMaterials); correction.summary = 'Corrected workflow ready for the buyer to review.';
  queue.push(correction);
  await executeMode('prepare');
  const correctedJob = queue[1].job_id;
  assert.match(correctedJob,/^job_[a-f0-9]{64}$/); assert.notEqual(correctedJob,savedJob); assert.equal(queue[0].job_id,savedJob);
  await executeMode('submit',true,{reviewedTaskId:queue[1].task_id,reviewedRequestId:queue[1].request_id,reviewedJobId:correctedJob});
  assert.equal(queue[1].review_accepted,'NO'); assert.equal(queue[1].review_next_action,'WAIT_FOR_BUYER');
  const current = service.get(buyer, project.taskId), revisedFiles = JSON.parse(queue[1].materials_json)[0].files;
  service.review(buyer, project.taskId, { requestId: randomUUID(), agreementDigest: current.agreement.digest, submissionId: current.submission.id, expectedEventHash: current.headEventHash, action: 'ACCEPT', reason: 'The synthetic buyer checked the exact corrected original workflow.', nextAction: 'NEXT_STEP', criteria: [{ criterionId: 'workflow', verdict: 'MET', materialAccess: 'AVAILABLE', note: 'Checked the exact synthetic corrected file.', checkedFiles:revisedFiles }] });
  await executeMode('sync'); assert.equal(queue[1].review_accepted, 'YES'); assert.equal(queue[1].review_decision, 'ACCEPT'); assert.equal(queue[1].review_job_id, correctedJob);
  assert.equal(queue[0].review_accepted,'NO','The earlier job cannot inherit the corrected version acceptance.');
  assert.equal(queue[0].job_id, savedJob); assert.equal(queue.length, 2); assert.equal(preparationCalls, preparationCount+1); assert.equal(reminders.length, reminderCount+1);
  agents.revoke(supplier, grant.grant.id);
  await executeMode('sync'); assert.equal(queue[0].review_accepted, 'UNKNOWN'); assert.equal(queue[0].review_state, 'UNKNOWN'); assert.equal(queue[1].review_accepted, 'UNKNOWN');
  console.log('PASS unified actual engine: approval guard, deliberate submission/replay, automatic pending readback, correction/new delivery identity, exact acceptance and revoked readback.');
  if(nativeProviders) {
    assert.ok(providers.audit.some(r=>r.provider==='googleSheets'&&r.method==='POST'));assert.ok(providers.audit.some(r=>r.provider==='slack'));
    const evidencePath=process.env.N8N_PROVIDER_EVIDENCE;
    if(evidencePath)writeFileSync(evidencePath,JSON.stringify({ok:true,nativeGoogleSheetsAndSlackNodes:true,exportSha256,...providers.snapshot()},null,2)+'\n');
  }
  console.log(JSON.stringify({ ok: true, nativeGoogleSheetsAndSlackNodes:nativeProviders, providerRequests:nativeProviders?providers.audit.length:undefined, engine: 'n8n 2.39.8', combinedWorkflow: true, exportSha256, actualProoftaskAPI: true, syntheticGoogleSheetsAndSlack: true, productionWrites: 0, savedJobs: store.listSelfServiceRecords('automation-job').length }));
} finally {
  await new Promise(r => api.close(r)); await new Promise(r => fixture.close(r)); store.close(); rmSync(home, { recursive: true, force: true });
}
