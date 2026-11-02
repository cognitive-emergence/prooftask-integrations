#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { randomBytes, createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync, chmodSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const home = resolve(root, '.local/n8n-lab');
mkdirSync(home, {recursive:true, mode:0o700}); chmodSync(home,0o700);
const keyFile = resolve(home,'encryption-key');
if (!existsSync(keyFile)) writeFileSync(keyFile,randomBytes(32).toString('hex'),{mode:0o600});
const durableCli=resolve(root,'.local/n8n-runtime/node_modules/n8n/bin/n8n');
const cli = process.env.N8N_CLI || (existsSync(durableCli)?durableCli:'/tmp/prooftask-n8n-engine/node_modules/n8n/bin/n8n');
if (!existsSync(cli)) throw new Error('Set N8N_CLI to an installed n8n 2.39.8 executable.');
const env = {...process.env,NODE_OPTIONS:[process.env.NODE_OPTIONS,'--no-node-snapshot'].filter(Boolean).join(' '),N8N_USER_FOLDER:home,N8N_ENCRYPTION_KEY:readFileSync(keyFile,'utf8'),N8N_HOST:'localhost',N8N_LISTEN_ADDRESS:'127.0.0.1',N8N_PORT:'5678',N8N_PROTOCOL:'http',N8N_DIAGNOSTICS_ENABLED:'false',N8N_VERSION_NOTIFICATIONS_ENABLED:'false',N8N_TEMPLATES_ENABLED:'false',N8N_RUNNERS_MODE:'internal',N8N_RUNNERS_BROKER_PORT:'5688'};
const bytes=readFileSync(resolve(root,'n8n/delivery-lifecycle.json'));
const workflow=JSON.parse(bytes);workflow.id='prooftask-delivery-lifecycle-review';
const workflows=[workflow];
const settingsPath=resolve(home,'lab-settings.json');
const settings=existsSync(settingsPath)?JSON.parse(readFileSync(settingsPath,'utf8')):{};
const source=process.env.PROOFTASK_SOURCE_ROOT||settings.prooftaskSourceRoot;
let provider, server;
process.on('exit',()=>{server?.kill();provider?.kill();});
if(source){
  writeFileSync(settingsPath,JSON.stringify({prooftaskSourceRoot:source},null,2)+'\n',{mode:0o600});
  provider=spawn(process.execPath,[resolve(root,'scripts/n8n-lab/start-provider-lab.mjs')],{env:{...process.env,PROOFTASK_SOURCE_ROOT:source,N8N_LAB_HOME:home},stdio:'inherit'});
  let providerReady=false;
  for(let i=0;i<60;i++){if(provider.exitCode!==null)throw new Error('Local provider fixture failed to start.');try{const response=await fetch('http://127.0.0.1:5680/lab/state');if(response.ok){const state=JSON.parse(readFileSync(resolve(home,'provider-config.json'),'utf8'));if(state.pid===provider.pid){providerReady=true;break;}}}catch{}await new Promise(r=>setTimeout(r,1000));}
  if(!providerReady){provider.kill();throw new Error('Local provider fixture did not become ready.');}
  const fixture=JSON.parse(readFileSync(resolve(home,'provider-config.json'),'utf8'));
  env.N8N_LAB_PROVIDER_ORIGIN=fixture.providerOrigin;
  env.NODE_OPTIONS+=' --require='+JSON.stringify(resolve(root,'scripts/n8n-lab/provider-redirect.cjs'));
  const credentials=[{id:'local-lab-google',name:'SIMULATION ONLY — Google Sheets',type:'googleSheetsOAuth2Api',data:{clientId:'mock-client-id',clientSecret:'mock-client-secret',oauthTokenData:{access_token:'mock-google-access-token',token_type:'Bearer',expires_in:86400,expiry_date:Date.now()+86400000}}},{id:'local-lab-slack',name:'SIMULATION ONLY — Slack',type:'slackApi',data:{accessToken:'xoxb-mock-slack-token'}},{id:'local-lab-prooftask',name:'SIMULATION ONLY — Prooftask',type:'httpHeaderAuth',data:{name:'Authorization',value:'Bearer '+fixture.agentToken}}];
  const credentialsPath=resolve(home,'mock-credentials.json');writeFileSync(credentialsPath,JSON.stringify(credentials),{mode:0o600});
  await new Promise((resolveRun,reject)=>{const child=spawn(cli,['import:credentials','--input='+credentialsPath],{env,stdio:'inherit'});child.on('error',reject);child.on('exit',code=>code===0?resolveRun():reject(new Error('Mock credential import failed.')));});
  const demo=structuredClone(workflow);demo.id='prooftask-delivery-lifecycle-lab';demo.name='SIMULATION — Client delivery reviews (local mock services)';
  Object.assign(demo.settings,{saveDataSuccessExecution:'all',saveDataErrorExecution:'all',saveManualExecutions:true});
  for(const assignment of demo.nodes.find(n=>n.name==='Configuration').parameters.assignments.assignments){if(assignment.name==='spreadsheetId')assignment.value='synthetic-sheet-id-123456789';if(assignment.name==='slackChannelId')assignment.value='CSYNTHETIC';}
  for(const node of demo.nodes){if(node.type.endsWith('googleSheets'))node.credentials={googleSheetsOAuth2Api:{id:'local-lab-google',name:credentials[0].name}};if(node.type.endsWith('slack'))node.credentials={slackApi:{id:'local-lab-slack',name:credentials[1].name}};if(node.type.endsWith('httpRequest')){node.parameters.url=node.parameters.url.replace('https://prooftask.com',fixture.prooftaskOrigin);node.credentials={httpHeaderAuth:{id:'local-lab-prooftask',name:credentials[2].name}};}if(node.name==='Start here')node.parameters.content='## SIMULATION ONLY\nThis local workflow uses fake Google/Slack credentials and local service fixtures. No real workspace is connected.\n\nRun prepare, inspect http://127.0.0.1:5680/lab/state, then deliberately configure the exact saved job for submit. Simulate buyer actions with scripts/n8n-lab/action.mjs. Restarting the lab resets the synthetic project.\n\n'+node.parameters.content;}
  workflows.push(demo);
}
const importedFile=resolve(home,'review-workflow.json');writeFileSync(importedFile,JSON.stringify(workflows),{mode:0o600});
const run = args => new Promise((resolveRun,reject)=>{const child=spawn(cli,args,{env,stdio:'inherit'});child.on('error',reject);child.on('exit',code=>code===0?resolveRun():reject(new Error('n8n CLI exited '+code)));});
await run(['import:workflow','--input='+importedFile]);
server=spawn(cli,['start'],{env,stdio:'inherit'});
for (const sig of ['SIGINT','SIGTERM']) process.on(sig,()=>{server.kill(sig);provider?.kill(sig);});
server.on('error',error=>{throw error;});
let ready=false;
for(let i=0;i<90;i++) {
  try {const response=await fetch('http://localhost:5678/rest/settings');if(response.ok){ready=true;break;}}catch{}
  if(server.exitCode!==null)throw new Error('n8n server stopped before readiness.');
  await new Promise(r=>setTimeout(r,1000));
}
if(!ready){server.kill();throw new Error('Local n8n did not become ready.');}
const credentialsFile=resolve(home,'owner.json');
if(!existsSync(credentialsFile)) {
  const owner={email:'local-n8n@example.test',firstName:'Local',lastName:'Workflow Lab',password:randomBytes(24).toString('base64url')+'aA1!'};
  const response=await fetch('http://localhost:5678/rest/owner/setup',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(owner)});
  if(!response.ok){server.kill();throw new Error('Local owner initialization failed: HTTP '+response.status);}
  writeFileSync(credentialsFile,JSON.stringify({url:'http://localhost:5678',email:owner.email,password:owner.password},null,2)+'\n',{mode:0o600});
  writeFileSync(resolve(home,'login-password.txt'),owner.password,{mode:0o600});
}
writeFileSync(resolve(home,'instance.json'),JSON.stringify({url:'http://localhost:5678',pid:server.pid,workflowId:workflow.id,workflowSourceSha256:createHash('sha256').update(bytes).digest('hex'),credentialsFile,simulationWorkflowId:provider?'prooftask-delivery-lifecycle-lab':null,simulationStateUrl:provider?'http://127.0.0.1:5680/lab/state':null,loopbackOnly:true,productionCredentialsConfigured:false},null,2)+'\n',{mode:0o600});
console.log('LOCAL_N8N_READY http://localhost:5678');
console.log('Local-only owner login saved in '+credentialsFile);
await new Promise((resolveExit,reject)=>server.on('exit',code=>{provider?.kill();code===0||code===null?resolveExit():reject(new Error('n8n server exited '+code));}));
