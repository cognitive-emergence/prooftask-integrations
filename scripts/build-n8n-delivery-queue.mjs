import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { selectQueue, inspectDelivery, checkProject, confirmSnapshot, assessJob, notificationText } from './n8n-delivery-queue.mjs';

export function deliveryQueueWorkflow() {
  const nodes = [], connections = {};
  function add(name, type, version, position, parameters, extra = {}) {
    nodes.push({ id: 'pt-queue-' + nodes.length, name, type: 'n8n-nodes-base.' + type, typeVersion: version, position, parameters, ...extra });
  }
  const code = (name, position, fn, body) => add(name, 'code', 2, position, { jsCode: 'const run = ' + fn.toString() + ';\n' + body });
  const edge = (from, to, output = 0) => { const main = (connections[from] ||= { main: [] }).main; (main[output] ||= []).push({ node: to, type: 'main', index: 0 }); };
  const pair = 'pairedItem: {item:0}';
  const config = "$('Configuration').first().json";
  const projectRow = "$('Check agreed criteria').item.json";
  const sheet = { resource: 'sheet', authentication: 'oAuth2', documentId: { __rl: true, value: `={{ ${config}.spreadsheetId }}`, mode: 'id' }, sheetName: { __rl: true, value: `={{ ${config}.sheetId }}`, mode: 'id' } };
  function update(name, position, fields) {
    add(name, 'googleSheets', 4.7, position, { ...sheet, operation: 'update', columns: { mappingMode: 'defineBelow', value: Object.fromEntries(fields.map(k => [k, `={{ $json.${k} }}`])), matchingColumns: ['task_id'], schema: fields.map(k => ({ id: k, displayName: k, type: 'string', required: false, defaultMatch: k === 'task_id', canBeUsedToMatch: k === 'task_id' })), attemptToConvertTypes: false, convertFieldsToString: false }, options: { cellFormat: 'RAW', handlingExtraData: 'ignoreIt' } }, { notes: 'Select the same Google Sheets credential. Update an existing unique task_id; do not append new rows.', notesInFlow: true });
  }
  function condition(name, position, left, right, operation = 'equals') {
    add(name, 'if', 2.2, position, { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 }, conditions: [{ id: name.replaceAll(' ', '-'), leftValue: left, rightValue: right, operator: { type: 'string', operation } }], combinator: 'and' }, options: {} });
  }
  function request(name, position, method, url, jsonBody) {
    add(name, 'httpRequest', 4.2, position, { authentication: 'genericCredentialType', genericAuthType: 'httpHeaderAuth', method, url,
      ...(jsonBody ? { sendBody: true, contentType: 'json', specifyBody: 'json', jsonBody } : {}),
      options: { timeout: 20000, allowUnauthorizedCerts: false, redirect: { redirect: { followRedirects: false, maxRedirects: 0 } }, response: { response: { fullResponse: true, neverError: true, responseFormat: 'json' } } } },
      { onError: 'continueRegularOutput', retryOnFail: true, maxTries: 2, waitBetweenTries: 1000, notes: 'Select Header Auth: Authorization = Bearer <project-scoped Agent token>. Errors are handled explicitly; never paste credentials into inputs.', notesInFlow: true });
  }
  add('Run delivery handover', 'manualTrigger', 1, [0, 220], {});
  add('Configuration', 'code', 2, [220, 220], { jsCode: "// Only non-secret configuration. Configure credentials on their respective nodes.\nconst configuration = {spreadsheetId:'REPLACE_SPREADSHEET_ID',sheetId:'0',slackChannelId:'REPLACE_SLACK_CHANNEL_ID'};\nif (!/^[a-zA-Z0-9_-]{20,}$/.test(configuration.spreadsheetId) || configuration.spreadsheetId.startsWith('REPLACE') || !/^\\d+$/.test(configuration.sheetId) || !/^[CG][A-Z0-9]+$/.test(configuration.slackChannelId)) throw new Error('Set spreadsheetId, numeric sheetId and the authorized Slack channel ID in Configuration.');\nreturn [{json:configuration}];" });
  add('Read delivery queue', 'googleSheets', 4.7, [440, 220], { ...sheet, operation: 'read', options: {} });
  code('Select queued deliveries', [660, 220], selectQueue, 'return run($input.all());');
  add('One delivery at a time', 'splitInBatches', 3, [880, 220], { batchSize: 1, options: {} });
  add('Candidate request ID', 'crypto', 2, [1100, 320], { action: 'generate', encodingType: 'uuid', dataPropertyName: 'candidate_request_id' });
  code('Inspect delivery', [1320, 320], inspectDelivery, `return [{json:run($input.first().json),${pair}}];`);
  condition('Input is complete', [1540, 320], '={{ $json.kind }}', 'invalid', 'notEquals');
  request('Read agreed project', [1760, 220], 'GET', "={{ 'https://prooftask.com/api/agents/v1/projects/' + encodeURIComponent($json.project_id) }}");
  code('Check agreed criteria', [1980, 220], checkProject, `return [{json:run($('Inspect delivery').item.json,$input.first().json),${pair}}];`);
  condition('Project permits handover', [2200, 220], '={{ $json.kind }}', 'invalid', 'notEquals');
  condition('Saved job exists', [2420, 120], '={{ $json.kind }}', 'resume');
  request('Read saved job', [2640, -60], 'GET', "={{ 'https://prooftask.com/api/agents/v1/jobs/' + $json.job_id }}");
  code('Assess saved job', [2860, -60], assessJob, `return [{json:run(${projectRow},$input.first().json,'resume',new Date().toISOString()),${pair}}];`);
  update('Persist retry identity', [2640, 340], ['task_id', 'request_id', 'request_json', 'handover_state', 'handover_note']);
  add('Read persisted request', 'googleSheets', 4.7, [2860, 340], { ...sheet, operation: 'read', filtersUI: { values: [{ lookupColumn: 'task_id', lookupValue: '={{ $json.task_id }}' }] }, options: {} });
  code('Confirm persisted request', [3080, 340], confirmSnapshot, `return [{json:run(${projectRow},$input.all()),${pair}}];`);
  request('Prepare saved delivery', [3300, 340], 'POST', 'https://prooftask.com/api/agents/v1/jobs', '={{ $json.request_json }}');
  code('Assess preparation', [3520, 340], assessJob, `return [{json:run(${projectRow},$input.first().json,'prepare',new Date().toISOString()),${pair}}];`);
  update('Write handover result', [3740, 120], ['task_id', 'job_id', 'prepared_at', 'handover_state', 'handover_note']);
  // The sheet only receives operational fields; notification metadata is restored from the current paired result.
  add('Restore review context', 'code', 2, [3960, 120], { jsCode: `const source = ${projectRow}; const saved=$input.first().json;\nif(saved.task_id!==source.task_id)throw new Error('Sheet write returned a different task.');\nreturn [{json:{...saved,request_id:source.request_id,notified_job_id:source.notified_job_id,human_url:source.human_url||''},${pair}}];` });
  condition('Ready for owner reminder', [4180, 120], "={{ $json.handover_state === 'PREPARED' && $json.notified_job_id !== $json.job_id ? 'YES' : 'NO' }}", 'YES');
  code('Build owner reminder', [4400, 20], notificationText, `return [{json:{...$input.first().json,text:run($input.first().json,${config})},${pair}}];`);
  add('Notify responsible team', 'slack', 2.3, [4620, 20], { authentication: 'accessToken', resource: 'message', operation: 'post', select: 'channel', channelId: { __rl: true, value: `={{ ${config}.slackChannelId }}`, mode: 'id' }, messageType: 'text', text: '={{ $json.text }}', otherOptions: { includeLinkToWorkflow: false, mrkdwn: false, link_names: false, unfurl_links: false, unfurl_media: false } }, { notes: 'Select a Slack credential authorized for this channel. Only task/job IDs and review links are sent, never original material contents. A failed reminder stops here; a rerun resumes the saved job.', notesInFlow: true });
  add('Remember successful reminder', 'code', 2, [4840, 20], { jsCode: `const reminder=$('Build owner reminder').item.json; const response=$input.first().json; if(!response.ts || response.error || response.ok===false)throw new Error('Slack did not confirm the reminder. Preserve the saved job and reconcile notification delivery.');return [{json:{task_id:reminder.task_id,notified_job_id:reminder.job_id,handover_note:'Owner reminder delivered. Await deliberate submission; buyer acceptance is separate.'},${pair}}];` });
  update('Mark reminder delivered', [5060, 20], ['task_id', 'notified_job_id', 'handover_note']);
  update('Write actionable feedback', [2420, 640], ['task_id', 'handover_state', 'handover_note']);
  add('Queue run complete', 'noOp', 1, [1100, 60], {});

  edge('Run delivery handover','Configuration'); edge('Configuration','Read delivery queue'); edge('Read delivery queue','Select queued deliveries'); edge('Select queued deliveries','One delivery at a time');
  edge('One delivery at a time','Queue run complete',0); edge('One delivery at a time','Candidate request ID',1); edge('Candidate request ID','Inspect delivery'); edge('Inspect delivery','Input is complete');
  edge('Input is complete','Read agreed project',0); edge('Input is complete','Write actionable feedback',1); edge('Read agreed project','Check agreed criteria'); edge('Check agreed criteria','Project permits handover');
  edge('Project permits handover','Saved job exists',0); edge('Project permits handover','Write actionable feedback',1); edge('Saved job exists','Read saved job',0); edge('Read saved job','Assess saved job'); edge('Assess saved job','Write handover result');
  edge('Saved job exists','Persist retry identity',1); edge('Persist retry identity','Read persisted request'); edge('Read persisted request','Confirm persisted request'); edge('Confirm persisted request','Prepare saved delivery'); edge('Prepare saved delivery','Assess preparation'); edge('Assess preparation','Write handover result');
  edge('Write handover result','Restore review context'); edge('Restore review context','Ready for owner reminder'); edge('Ready for owner reminder','Build owner reminder',0); edge('Ready for owner reminder','One delivery at a time',1);
  edge('Build owner reminder','Notify responsible team'); edge('Notify responsible team','Remember successful reminder'); edge('Remember successful reminder','Mark reminder delivered'); edge('Mark reminder delivered','One delivery at a time'); edge('Write actionable feedback','One delivery at a time');
  // Notes follow the n8n Creator Hub standard: one yellow overview, then short
  // white sections behind their nodes. Keep implementation/recovery detail in
  // DELIVERY_QUEUE.md and node notes instead of turning the canvas into a manual.
  const positions = {
    'Run delivery handover': [0, 300], 'Configuration': [220, 300],
    'Read delivery queue': [440, 300], 'Select queued deliveries': [660, 300],
    'One delivery at a time': [880, 300], 'Queue run complete': [880, 580],
    'Candidate request ID': [1100, 400], 'Inspect delivery': [1320, 400],
    'Input is complete': [1540, 400], 'Read agreed project': [1760, 300],
    'Check agreed criteria': [1980, 300], 'Project permits handover': [2200, 300],
    'Write actionable feedback': [1980, 760], 'Saved job exists': [2420, 300],
    'Read saved job': [2640, 240], 'Assess saved job': [2860, 240],
    'Persist retry identity': [2640, 640], 'Read persisted request': [2860, 640],
    'Confirm persisted request': [3080, 640], 'Prepare saved delivery': [3300, 640],
    'Assess preparation': [3520, 640], 'Write handover result': [3740, 300],
    'Restore review context': [3960, 300], 'Ready for owner reminder': [4180, 300],
    'Build owner reminder': [4400, 300], 'Notify responsible team': [4620, 300],
    'Remember successful reminder': [4840, 300], 'Mark reminder delivered': [5060, 300],
  };
  for (const node of nodes) node.position = positions[node.name];
  const note = (name, position, width, height, content, color) =>
    add(name, 'stickyNote', 1, position, { width, height, content, color });
  note('Overview and setup', [-680, -80], 600, 1140, `## Prepare client deliveries for review

For automation consultants who track completed client work in Google Sheets and need a clear handoff to their reviewer.

### How it works
1. Read rows marked \`ready_for_review=YES\` and process one delivery at a time.
2. Check material references, file metadata and the current Prooftask agreement.
3. Save the request before preparing a delivery job, so retries reuse its identity.
4. Write the result back and send the responsible team a Slack reminder.

A prepared job is ready for internal review. Submission requires a separate deliberate step; buyer acceptance, signing and payment remain separate.

### Setup
1. Import the [sample queue](https://github.com/cognitive-emergence/prooftask-integrations/blob/main/n8n/delivery-queue-example.csv) into Google Sheets. Replace fictional IDs and materials with your actual project data.
2. In **Configuration**, set \`spreadsheetId\`, numeric \`sheetId\` and \`slackChannelId\`.
3. Select the same Google Sheets OAuth2 credential on all Sheet nodes.
4. On all three HTTP nodes, select Header Auth: \`Authorization: Bearer …\`. Use an existing project-scoped Agent grant with \`SUBMIT_MATERIALS\`.
5. Select a Slack credential with \`chat:write\` and add its bot to the review channel.
6. Mark a ready row **YES** and run manually. Allow only one execution per queue at a time.

Requires an agreed Prooftask project, Google Sheets and Slack; service pricing applies. No community nodes are needed. See the [setup and recovery guide](https://github.com/cognitive-emergence/prooftask-integrations/blob/main/n8n/DELIVERY_QUEUE.md).`, 1);
  note('Section 1 — delivery queue', [-40, 0], 1060, 800, `## 1. Load the delivery queue

Read ready rows and skip jobs already notified. Duplicate task IDs stop the run before writes.`, 7);
  note('Section 2 — material checks', [1040, 0], 620, 800, `## 2. Check delivery materials

Require actual references and matching file metadata for every agreed criterion. Incomplete rows go to actionable feedback.`, 7);
  note('Section 3 — agreement and feedback', [1700, 0], 660, 1060, `## 3. Check access and agreement

Read the authorized project and compare its current criteria. Write missing-input or owner-action feedback to the queue.`, 7);
  note('Section 4 — save or resume', [2380, 0], 1260, 1060, `## 4. Resume a job or prepare one

Top: verify an existing saved job. Bottom: persist and read back the exact request before preparing. Preserve saved IDs and request data when retrying.`, 7);
  note('Section 5 — result', [3680, 0], 660, 800, `## 5. Save the handover result

Write the verified job ID and operational state back to the same task row. Only a prepared, unnotified job continues.`, 7);
  note('Section 6 — reviewer reminder', [4380, 0], 860, 800, `## 6. Remind the responsible team

Send internal review references, then mark the confirmed reminder. Normal reruns skip it; an uncertain Slack result may duplicate the reminder.`, 7);
  return { name: 'Prepare client delivery reviews from Google Sheets with Prooftask and Slack', nodes, connections, active: false, pinData: {}, settings: { executionOrder: 'v1', saveDataSuccessExecution: 'none', saveDataErrorExecution: 'none', saveManualExecutions: false }, tags: [] };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const path = new URL('../channels/n8n-prepare-client-delivery.json', import.meta.url);
  writeFileSync(path, JSON.stringify(deliveryQueueWorkflow(), null, 2) + '\n');
  console.log('Built annotated Google Sheets delivery handover template.');
}
