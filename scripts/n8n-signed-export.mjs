// Embed the same response checks in the downloadable workflow and in regression tests.
export function assessSignedExport(response, selection) {
  const { projectId, agreementDigest, headEventHash, reviewId, jobId, nonce } = selection;
  const result = state => ({ jobId, projectId, exportState: state });
  if (response.statusCode !== 200) return result('EXPORT_FAILED');
  let file;
  try { file = JSON.parse(response.body); } catch { return result('INVALID_RESPONSE'); }
  const status = file?.status?.body;
  const issuance = file?.status?.record?.body?.resultRecord;
  if (file?.schema !== 'prooftask.result-review/v1' || !Array.isArray(file.record?.files) ||
      !file.record.files.some(entry => entry?.path === 'record.sd-jwt') || !file.status?.signature?.value ||
      status?.state !== 'BUYER_CONFIRMED' || status.taskId !== projectId || status.agreementDigest !== agreementDigest ||
      status.headEventHash !== headEventHash || status.nonce !== nonce) return result('INVALID_RESPONSE');
  if (issuance?.state === 'NOT_ISSUED') return result('NOT_ISSUED');
  if (issuance?.state !== 'ISSUED' || !reviewId || issuance.confirmationId !== reviewId) return result('INVALID_RESPONSE');
  return { ...result('EXPORTED'), content: response.body };
}

export function addSignedExport(add, edge) {
  function gate(name, expression, position) {
    add(name, 'if', { conditions: { options: { typeValidation: 'strict', version: 2 },
      conditions: [{ id: name, leftValue: expression, rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }],
      combinator: 'and' }, options: {} }, position, 2.2);
  }
  const loop = 'Sync · One saved job at a time';
  gate('Export this accepted revision', "={{ $('Configuration').first().json.exportSignedRecord === true && $('Configuration').first().json.operation === 'sync' && $('Sync · Map exact saved status').item.json.review_accepted === 'YES' }}", [2480, 2240]);
  edge('Sync · Update original queue status', 'Export this accepted revision');
  edge('Export this accepted revision', loop, 1);
  add('Generate export nonce', 'crypto', { action: 'generate', encodingType: 'uuid', dataPropertyName: 'nonce' }, [2700, 2120], 2);
  edge('Export this accepted revision', 'Generate export nonce');
  add('Bind signed export to saved revision', 'code', { jsCode: `const job = $('Sync · Read current saved job').item.json.body;
const { projectId, agreementDigest, headEventHash, reviewId } = job.current;
return [{ json: { projectId, agreementDigest, headEventHash, reviewId, jobId: job.id, nonce: $input.first().json.nonce }, pairedItem: { item: 0 } }];` }, [2920, 2120]);
  edge('Generate export nonce', 'Bind signed export to saved revision');
  add('Read signed result file', 'httpRequest', {
    method: 'POST', url: "={{ 'https://prooftask.com/api/agents/v1/projects/' + encodeURIComponent($json.projectId) + '/exports/record' }}",
    authentication: 'genericCredentialType', genericAuthType: 'httpHeaderAuth', sendBody: true, specifyBody: 'json',
    jsonBody: '={{ JSON.stringify({expectedAgreementDigest:$json.agreementDigest,expectedEventHash:$json.headEventHash,nonce:$json.nonce}) }}',
    options: { timeout: 20000, redirect: { redirect: { followRedirects: false, maxRedirects: 0 } },
      response: { response: { fullResponse: true, neverError: true, responseFormat: 'text', outputPropertyName: 'body' } } }
  }, [3140, 2120], 4.2);
  edge('Bind signed export to saved revision', 'Read signed result file');
  add('Check export response', 'code', { jsCode: 'const assess=' + assessSignedExport.toString() +
    ";return [{json:assess($input.first().json,$('Bind signed export to saved revision').item.json),pairedItem:{item:0}}];" }, [3360, 2120]);
  edge('Read signed result file', 'Check export response');
  gate('Issued file available', "={{ $json.exportState === 'EXPORTED' }}", [3580, 2120]);
  edge('Check export response', 'Issued file available');
  edge('Issued file available', loop, 1);
  add('Download signed record', 'convertToFile', { operation: 'toBinary', sourceProperty: 'content', binaryPropertyName: 'record',
    options: { dataIsBase64: false, encoding: 'utf8', mimeType: 'application/json', fileName: "={{ 'prooftask-record-' + $json.jobId + '.json' }}" } }, [3800, 2010], 1);
  edge('Issued file available', 'Download signed record');
  edge('Download signed record', loop);
}
