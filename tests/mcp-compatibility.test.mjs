import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,rmSync,mkdirSync,symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {execFileSync,spawnSync} from 'node:child_process';
import {createHash,verify} from 'node:crypto';
import {createAdapter,validate} from '../mcp/agent-mcp.mjs';
const catalog=JSON.parse(readFileSync(new URL('../mcp/agent-mcp-tools.json',import.meta.url)));
const fixtures=JSON.parse(readFileSync(new URL('./fixtures/mcp-export-artifacts.json',import.meta.url)));
const credential='ptag_active_credential_for_synthetic_adapter_tests';
test('committed synthetic fixtures retain only public keys and deliberate lookalike labels',()=>{
 const serialized=JSON.stringify(fixtures);
 assert.equal(serialized.includes('BEGIN PRIVATE KEY'),false);
 const allowed=new Set(['ptag_public_label','ptag_public_data']);
 assert.ok((serialized.match(/ptag_[A-Za-z0-9_-]+/g)||[]).every(value=>allowed.has(value)),'fixture contains an unexpected credential-like value');
});

test('v1 tool names, routes, annotations and top-level argument requirements stay unchanged',()=>{
 const baseline=JSON.parse(readFileSync(new URL('./fixtures/mcp-v1-contract.json',import.meta.url)));
 assert.deepEqual(catalog.tools.map(t=>({name:t.name,route:t.route,annotations:t.annotations,required:t.inputSchema.required})),baseline.tools);
});
const rpc=(name,args)=>({jsonrpc:'2.0',id:2,method:'tools/call',params:{name,arguments:args}});
async function handlerFor(fetcher,allowWrites=false){
 const handler=createAdapter({catalog,token:credential,fetcher,allowWrites});
 await handler({jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:'2025-11-25',capabilities:{},clientInfo:{name:'compatibility-test',version:'1'}}});
 await handler({jsonrpc:'2.0',method:'notifications/initialized'});return handler;
}
function signedArtifacts(value,fixture){
 if(fixture.format==='conformity'){
  for(const file of value.files)assert.equal('sha256:'+createHash('sha256').update(Buffer.from(file.data,'base64url')).digest('hex'),file.sha256);
  const token=Buffer.from(value.files.find(f=>f.path==='record.sd-jwt').data,'base64url').toString().split('~')[0],parts=token.split('.');
  assert.equal(verify(null,Buffer.from(parts[0]+'.'+parts[1]),fixture.publicKeyPem,Buffer.from(parts[2],'base64url')),true);
 }else{
  assert.equal(verify(null,Buffer.from(value.record.protected+'.'+value.record.payload),fixture.publicKeyPem,Buffer.from(value.record.signature,'base64url')),true);
 }
}
for(const fixture of fixtures.cases)test(`${fixture.format} artifacts retain signed bytes and token lookalikes, while the active credential is refused`,async()=>{
 signedArtifacts(fixture.artifact,fixture);
 let response=fixture.artifact;
 const handler=await handlerFor(async()=>Response.json(response));
 const paths={path:{id:fixture.projectId}},body={expectedAgreementDigest:fixture.agreementDigest,expectedEventHash:fixture.headEventHash,nonce:fixtures.nonce};
 const result=(await handler(rpc('exportResultPackage',{...paths,body}))).result;
 assert.equal(result.isError,undefined);assert.equal(result.structuredContent.httpStatus,200);
 assert.equal(result.content[0].text,JSON.stringify(fixture.artifact));
 assert.deepEqual(result.structuredContent.data,fixture.artifact);signedArtifacts(result.structuredContent.data,fixture);
 // The other record/status reads also carry signatures and must not rewrite them.
 const native=fixture.format==='conformity'?fixture.artifact:fixture.artifact.status.record;
 const status=fixture.status||fixture.artifact.status;
 for(const [name,value]of [['getRecord',native],['getStatus',status],['exportLegacyRecord',native]]){
  response=structuredClone(value);
  // Optional unsigned transport labels are still data and must remain intact.
  response.transportLabel='ptag_public_label';
  const arguments_=name==='getStatus'?{...paths,body:{nonce:fixtures.nonce}}:paths;
  const returned=(await handler(rpc(name,arguments_))).result;
  assert.equal(returned.content[0].text,JSON.stringify(response),name);
  assert.deepEqual(returned.structuredContent.data,response,name);
 }
 response=structuredClone(fixture.artifact);
 if(fixture.format==='conformity')response.files.push({path:'attachments/'+credential+'.bin',mediaType:'application/octet-stream',sha256:'sha256:'+createHash('sha256').update('').digest('hex'),encoding:'base64url',data:''});
 else response.trust.keys[0].publicLabel=credential;
 const refused=(await handler(rpc('exportResultPackage',{...paths,body}))).result;
 assert.equal(refused.isError,true);assert.equal(JSON.parse(refused.content[0].text).error,'RESPONSE_CONTAINS_CREDENTIAL');
 assert.ok(!JSON.stringify(refused).includes(credential));assert.equal(refused.structuredContent,undefined);
 response={error:'synthetic',debug:credential};
 const errorHandler=await handlerFor(async()=>Response.json(response,{status:400}));
 const error=(await errorHandler(rpc('exportResultPackage',{...paths,body}))).result;
 assert.equal(error.isError,true);assert.equal(error.structuredContent.httpStatus,400);assert.ok(!JSON.stringify(error).includes(credential));
});
test('all successful structured template, binding and project data retains exact digests and labels',async()=>{
 const template={title:'ptag_public_label',scope:'Retain evidence in ptag_public_folder',criteria:[{id:'report',evidenceRequired:'ptag_public_evidence'}]};
 const digest=createHash('sha256').update(JSON.stringify(template)).digest('hex');
 const payload={template,digest,project:{title:template.title,agreement:{digest,scope:template.scope},headEventHash:'sha256:'+digest,materials:[{name:'ptag_public_file.txt',sha256:digest}]}};
 let data=payload;
 const handler=await handlerFor(async()=>Response.json(data));
 for(const [name,args]of [['searchPublicSpecifications',{query:{q:'automation'}}],['getPublicSpecification',{path:{id:'business-automation'},query:{version:2}}],['listUsableTemplates',{}],['getUsableTemplate',{path:{id:'rt_'+'a'.repeat(32)},query:{version:2}}],['getProject',{path:{id:fixtures.cases[0].projectId}}]]){
  const r=(await handler(rpc(name,args))).result;assert.equal(r.isError,undefined,name);
  assert.deepEqual(r.structuredContent.data,payload,name);
  assert.equal(createHash('sha256').update(JSON.stringify(r.structuredContent.data.template)).digest('hex'),r.structuredContent.data.digest,name+' digest');
 }
 const use=catalog.tools.find(t=>t.name==='useTemplate').inputSchema;
 const prepare=catalog.tools.find(t=>t.name==='prepareTemplate').inputSchema;
 const id='rt_'+'a'.repeat(32),selection={version:2,digest:'b'.repeat(64),values:{}};
 for(const [name,args]of [['useTemplate',{path:{id},body:selection}],['prepareTemplate',{path:{id},body:{...selection,work:{title:'Template output',scope:'Deliver and retain the agreed files.',criteria:[{id:'report',title:'Report',requirement:'The report covers the agreed scope.',evidenceRequired:'Retained original report file'}]}}}]]){
  assert.equal(validate(name==='useTemplate'?use:prepare,args),true,name+' fixture');
  const r=(await handler(rpc(name,args))).result;assert.deepEqual(r.structuredContent.data,payload,name);
 }
 data={project:{title:credential,agreement:{digest},headEventHash:'sha256:'+digest}};
 const refused=(await handler(rpc('getProject',{path:{id:fixtures.cases[0].projectId}}))).result;
 assert.equal(refused.isError,true);assert.equal(JSON.parse(refused.content[0].text).error,'RESPONSE_CONTAINS_CREDENTIAL');assert.ok(!JSON.stringify(refused).includes(credential));
});
test('withholding a credential-bearing write response preserves unknown-result recovery without retry',async()=>{
 let calls=0;const handler=await handlerFor(async()=>{calls++;return Response.json({debug:credential});},true);
 const args={path:{id:fixtures.cases[0].projectId},body:{expectedEventHash:fixtures.cases[0].headEventHash,automationRevision:0,input:{requestId:fixtures.nonce,reason:'Synthetic handoff for response recovery.'}},approved:true};
 const result=(await handler(rpc('handoffToHuman',args))).result;
 assert.equal(result.isError,true);const error=JSON.parse(result.content[0].text);
 assert.equal(error.error,'RESPONSE_CONTAINS_CREDENTIAL');assert.match(error.nextAction,/Preserve the exact request/);assert.match(error.nextAction,/reconcile before retrying/);assert.equal(calls,1);assert.ok(!JSON.stringify(result).includes(credential));
});
const v2={schema:'prooftask.result-template/v2',templateId:'rt_'+'a'.repeat(32),version:2,digest:'b'.repeat(64),title:'Current template',scope:'Deliver the agreed report and evidence.',criteria:[{id:'report',title:'Report',requirement:'The agreed report is available.',evidenceRequired:'Retained report file',check:{schema:'prooftask.check-rule/v1',kind:'NUMBER',onMissing:'INSUFFICIENT_EVIDENCE',input:{fileName:'report.json',pointer:'/count'},operator:'GTE',threshold:1,unit:'items'}}],resultType:'recurring-delivery',industries:['Software'],parameters:[],provenance:{publicationId:'public-template',author:'Synthetic publisher',permission:'FREE_WITH_ATTRIBUTION',licenseVersion:'prooftask.free-attribution/v1',credits:[]}};
test('v2 template/check backports preserve strict required fields and historical v1 snapshots',()=>{
 const binding={schema:'prooftask.result-template-binding/v1',template:v2,values:{},workDigest:'c'.repeat(64),customized:true};
 for(const toolName of ['createProject','createProposal','prepareExternalDraft','updateProposal']){
  const root=catalog.tools.find(t=>t.name===toolName).inputSchema;
  const definition=Object.values(root.$defs).find(d=>d.properties?.templateBinding)?.properties.templateBinding;
  assert.ok(definition,toolName);assert.equal(validate(definition,binding,root),true,toolName);
  for(const mutate of [b=>delete b.template.title,b=>b.template.extra=true,b=>delete b.template.criteria[0].check.threshold,b=>b.template.provenance.credits=[{}],b=>b.template.schema='unsupported/v3']){
   const bad=structuredClone(binding);mutate(bad);assert.equal(validate(definition,bad,root),false,toolName);
  }
  const historical=structuredClone(binding);historical.template.schema='prooftask.result-template/v1';delete historical.template.provenance;delete historical.template.criteria[0].check;historical.template.resultType='business-automation';
  assert.equal(validate(definition,historical,root),true,toolName+' historical');
 }
 const prepare=catalog.tools.find(t=>t.name==='prepareTemplate').inputSchema;
 const input={path:{id:v2.templateId},body:{version:2,digest:v2.digest,values:{},work:{title:v2.title,scope:v2.scope,criteria:v2.criteria}}};
 assert.equal(validate(prepare,input),true);delete input.body.work.criteria[0].check.unit;assert.equal(validate(prepare,input),false);
 const draft=catalog.tools.find(t=>t.name==='prepareExternalDraft').inputSchema;
 assert.equal(validate(draft,{body:{requestId:fixtures.nonce},approved:true}),false);
 assert.equal(validate(draft,{body:{requestId:fixtures.nonce,role:'BUYER'},approved:true}),true);
 const review=catalog.tools.find(t=>t.name==='reviewDelivery').inputSchema;
 const checkRun=review.$defs.Review.properties.checkRun;
 assert.equal(validate(checkRun,{id:'check_'+'a'.repeat(64),digest:'b'.repeat(64)}),true);
 for(const bad of [{id:'check_'+'a'.repeat(64)},{id:'wrong',digest:'b'.repeat(64)},{id:'check_'+'a'.repeat(64),digest:'b'.repeat(64),extra:true}])assert.equal(validate(checkRun,bad),false);
});
test('packed unpublished 0.1.2 contains its runtime and starts from extracted files',()=>{
 const directory=mkdtempSync(join(tmpdir(),'prooftask-mcp-pack-'));
 try{
  const cwd=resolve('mcp');
  const packed=JSON.parse(execFileSync('npm',['pack','--ignore-scripts','--json','--pack-destination',directory],{cwd,encoding:'utf8'}))[0];
  assert.equal(packed.version,'0.1.2');
  assert.deepEqual(packed.files.map(f=>f.path).sort(),['CHANGELOG.md','README.md','agent-mcp-tools.json','agent-mcp.mjs','package.json'].sort());
  execFileSync('tar',['-xzf',join(directory,packed.filename),'-C',directory]);
  const messages=[{jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:'2025-11-25',capabilities:{},clientInfo:{name:'packed-test',version:'1'}}},{jsonrpc:'2.0',method:'notifications/initialized'},{jsonrpc:'2.0',id:2,method:'tools/list'}];
  mkdirSync(join(directory,'bin'));symlinkSync('../package/agent-mcp.mjs',join(directory,'bin/prooftask-mcp'));
  for(const entry of ['package/agent-mcp.mjs','bin/prooftask-mcp']){
   const run=spawnSync(process.execPath,[join(directory,entry)],{input:messages.map(m=>JSON.stringify(m)).join('\n')+'\n',encoding:'utf8',env:{PATH:process.env.PATH},timeout:10000});
   assert.equal(run.status,0,run.stderr);assert.equal(run.stderr,'');
   assert.ok(run.stdout.trim(),entry+' must actually start');
   const listed=run.stdout.trim().split('\n').map(s=>JSON.parse(s)).find(m=>m.id===2).result.tools;
   assert.equal(listed.length,23);assert.ok(listed.some(t=>t.name==='exportResultPackage'));assert.equal(catalog.tools.length,45);
  }
 }finally{rmSync(directory,{recursive:true,force:true});}
});
