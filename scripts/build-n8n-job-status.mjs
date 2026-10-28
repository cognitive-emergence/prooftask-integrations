import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { selectSavedJobs, savedJobStatus } from './n8n-job-status.mjs';

export function jobStatusWorkflow() {
  const nodes = [], connections = {};
  const add = (name, type, version, position, parameters, extra = {}) => nodes.push({ id: 'pt-status-' + nodes.length, name, type: 'n8n-nodes-base.' + type, typeVersion: version, position, parameters, ...extra });
  const edge = (from, to, output = 0) => { const main = (connections[from] ||= { main: [] }).main; (main[output] ||= []).push({ node: to, type: 'main', index: 0 }); };
  const config = "$('Configuration').first().json";
  const sheet = { resource: 'sheet', authentication: 'oAuth2', documentId: { __rl: true, value: `={{ ${config}.spreadsheetId }}`, mode: 'id' }, sheetName: { __rl: true, value: `={{ ${config}.sheetId }}`, mode: 'id' } };
  const fields = ['task_id', 'review_job_id', 'review_state', 'review_decision', 'review_accepted', 'review_next_action', 'review_observed_at', 'review_url', 'review_note'];
  add('Run status sync', 'manualTrigger', 1, [0, 300], {});
  add('Configuration', 'code', 2, [220, 300], { jsCode: "const configuration={spreadsheetId:'REPLACE_SPREADSHEET_ID',sheetId:'0'};if(!/^[a-zA-Z0-9_-]{20,}$/.test(configuration.spreadsheetId)||configuration.spreadsheetId.startsWith('REPLACE')||!/^\\d+$/.test(configuration.sheetId))throw new Error('Set the same spreadsheetId and numeric sheetId as the delivery queue.');return [{json:configuration}];" });
  add('Read saved delivery queue', 'googleSheets', 4.7, [440, 300], { ...sheet, operation: 'read', options: {} });
  add('Select saved jobs', 'code', 2, [660, 300], { jsCode: 'const run=' + selectSavedJobs.toString() + ';return run($input.all());' });
  add('One saved job at a time', 'splitInBatches', 3, [880, 300], { batchSize: 1, options: {} });
  add('Read current saved job', 'httpRequest', 4.2, [1100, 440], { method: 'GET', url: "={{ 'https://prooftask.com/api/agents/v1/jobs/' + $json.job_id }}", authentication: 'genericCredentialType', genericAuthType: 'httpHeaderAuth',
    options: { timeout: 20000, allowUnauthorizedCerts: false, redirect: { redirect: { followRedirects: false, maxRedirects: 0 } }, response: { response: { fullResponse: true, neverError: true, responseFormat: 'json' } } } },
    { onError: 'continueRegularOutput', retryOnFail: true, maxTries: 2, waitBetweenTries: 1000, notes: 'Use Header Auth with the same Agent grant that prepared these saved jobs. Renewal preserves ownership; a new grant cannot read the old jobs. This request only reads status.', notesInFlow: true });
  add('Map exact saved status', 'code', 2, [1320, 440], { jsCode: 'const run=' + savedJobStatus.toString() + ";return [{json:run($('One saved job at a time').item.json,$input.first().json),pairedItem:{item:0}}];" });
  add('Update original queue status', 'googleSheets', 4.7, [1540, 440], { ...sheet, operation: 'update', columns: { mappingMode: 'defineBelow', value: Object.fromEntries(fields.map(k => [k, `={{ $json.${k} }}`])), matchingColumns: ['task_id'], schema: fields.map(k => ({ id: k, displayName: k, type: 'string', required: false, defaultMatch: k === 'task_id', canBeUsedToMatch: k === 'task_id' })), attemptToConvertTypes: false, convertFieldsToString: false }, options: { cellFormat: 'RAW', handlingExtraData: 'ignoreIt' } },
    { notes: 'Add all review_* columns before running. Select the same Google Sheets credential on both Sheet nodes. Update existing unique task_id rows only. This does not overwrite request, job, material or preparation fields.', notesInFlow: true });
  add('Status sync complete', 'noOp', 1, [1100, 140], {});
  edge('Run status sync', 'Configuration'); edge('Configuration', 'Read saved delivery queue'); edge('Read saved delivery queue', 'Select saved jobs'); edge('Select saved jobs', 'One saved job at a time');
  edge('One saved job at a time', 'Status sync complete', 0); edge('One saved job at a time', 'Read current saved job', 1); edge('Read current saved job', 'Map exact saved status'); edge('Map exact saved status', 'Update original queue status'); edge('Update original queue status', 'One saved job at a time');
  add('Status sync setup', 'stickyNote', 1, [-650, 80], { width: 580, height: 760, color: 1, content: '## Sync saved delivery status to the original queue\n\nThis companion is separate from published template #21159. It reads current Prooftask jobs and updates existing Sheet rows, including jobs already notified. It never submits, accepts, signs or pays.\n\n1. Read n8n/DELIVERY_LOOP.md and add every review_* column listed there.\n2. Set the same spreadsheetId and numeric sheetId in Configuration.\n3. Use the same Google Sheets credential on both Sheet nodes.\n4. On the HTTP node, select Header Auth for the original Agent grant that created these jobs.\n5. Run manually, one execution per queue at a time. Keep request_id and job_id unchanged.\n\nA failed or mismatched read writes UNKNOWN, never an acceptance. Status observations may change after corrections or concerns. This example has no schedule, webhook receiver or notification.' });
  return { name: 'Sync Prooftask saved delivery status to Google Sheets', nodes, connections, active: false, pinData: {}, settings: { executionOrder: 'v1', saveDataSuccessExecution: 'none', saveDataErrorExecution: 'none', saveManualExecutions: false }, tags: [] };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeFileSync(new URL('../n8n/sync-job-status.json', import.meta.url), JSON.stringify(jobStatusWorkflow(), null, 2) + '\n');
  console.log('Built inactive saved-job status sync workflow.');
}
