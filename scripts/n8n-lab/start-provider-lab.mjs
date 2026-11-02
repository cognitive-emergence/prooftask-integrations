#!/usr/bin/env node
// Synthetic local project and vendor API fixture. All business state is disposable.
import { generateKeyPairSync, randomUUID, createHash } from 'node:crypto';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createServer } from 'node:http';
import { createProviderFixture, queueColumns } from './provider-fixture.mjs';
const source=process.env.PROOFTASK_SOURCE_ROOT, home=process.env.N8N_LAB_HOME;
if(!source||!home)throw new Error('Set PROOFTASK_SOURCE_ROOT and N8N_LAB_HOME.');
mkdirSync(home,{recursive:true,mode:0o700});
const load=p=>import(pathToFileURL(resolve(source,p)).href);
const [{PilotStore,PilotService,authorityScopesForRole,createPilotServer},{AgentWorkflows},{supplierDesignation},{testTerms}]=await Promise.all([load('src/runtime/index.ts'),load('src/runtime/agents.ts'),load('tests/supplier-identity-fixture.ts'),load('tests/explicit-terms-fixture.ts')]);
const at=new Date().toISOString(), keys=generateKeyPairSync('ed25519'),store=new PilotStore(':memory:');
const runtime=new PilotService({store,signer:{keyId:'local-n8n-simulation',privateKey:keys.privateKey.export({type:'pkcs8',format:'pem'}).toString()}});
const service=runtime.acceptance,agents=new AgentWorkflows(store,service);
const principal=id=>store.createPrincipalToken({tenantId:id,organizationId:id,actorId:id+'@example.test',verifiedEmail:{email:id+'@example.test',verifiedAt:at},role:'TECHNICAL_OWNER',organizationRelationship:'EMPLOYEE',authorityStatus:'ADMIN_APPROVED',authorityReference:'urn:local-simulation:'+id,authorityScopes:authorityScopesForRole('TECHNICAL_OWNER')},at,new Date(Date.now()+86400000).toISOString()).principal;
const buyer=principal('local-n8n-buyer'),supplier=principal('local-n8n-supplier');
const deadline=new Date(Date.now()+86400000).toISOString();
const project=service.create(buyer,{requestId:randomUUID(),title:'SIMULATION — n8n delivery review',scope:'Synthetic local workflow demonstration only.',buyerName:'Local simulated buyer',providerName:'Local simulated supplier',deadline,termsPolicy:testTerms(deadline),materialPolicy:'FILE_DIGESTS',baselineStatement:'No real customer delivery or payment.',criteria:[{id:'workflow',title:'Workflow export',requirement:'Provide the original workflow.',evidenceRequired:'Original workflow reference.'}]});
const capability=service.rotateLink(buyer,project.taskId,project.agreement.digest,supplierDesignation(service,buyer,project.taskId,supplier.actorId));
store.putSelfServiceRecord('supplier-recipient',project.taskId,{email:supplier.actorId,capabilityId:capability.capabilityId});service.linkSupplierWorkspace(supplier,capability.token,true);service.respond(capability.token,{requestId:randomUUID(),agreementDigest:project.agreement.digest,action:'ACCEPT',actorId:supplier.actorId,actorRole:supplier.role,authorityAttested:true,reason:'Accept the synthetic local test agreement.'},supplier);
const grant=agents.create(supplier,{requestId:randomUUID(),name:'Local n8n simulation only',projectIds:[project.taskId],actions:['SUBMIT_MATERIALS'],expiresAt:new Date(Date.now()+23*3600000).toISOString(),confirmed:true,completionConfirmed:false});
const api=createPilotServer({service:runtime});await new Promise(r=>api.listen(5681,'127.0.0.1',r));
const row=id=>({task_id:id,ready_for_review:'YES',project_id:project.taskId,summary:'Configured synthetic workflow ready for client review.',materials_json:JSON.stringify([{criterionId:'workflow',summary:'Original synthetic workflow and setup guide.',references:['https://example.test/workflow.json'],files:[{reference:'https://example.test/workflow.json',name:'workflow.json',size:2,sha256:createHash('sha256').update('{}').digest('hex')}]}]),request_id:'',request_json:'',job_id:'',handover_state:'',handover_note:'',prepared_at:'',notified_job_id:''});
let rows=[row('local-client-v1'),{...row('local-missing-materials'),materials_json:'[]'}];const messages=[];
const provider=createProviderFixture({getRows:()=>rows,setRows:value=>{rows=value;persist();},reminders:messages});
const csvCell=v=>'"'+String(v??'').replaceAll('"','""')+'"';
function persist(){writeFileSync(join(home,'provider-state.json'),JSON.stringify({mode:'SIMULATION',projectId:project.taskId,...provider.snapshot()},null,2)+'\n',{mode:0o600});writeFileSync(join(home,'slack-messages.txt'),messages.map(m=>'[SIMULATION] '+m.ts+' '+m.channel+'\n'+m.text).join('\n\n')+'\n',{mode:0o600});writeFileSync(join(home,'queue.csv'),[queueColumns.join(','),...rows.map(r=>queueColumns.map(k=>csvCell(r[k])).join(','))].join('\n')+'\n',{mode:0o600});}
async function buyerAction(action){const current=service.get(buyer,project.taskId);if(action==='revoke'){agents.revoke(supplier,grant.grant.id);return;}
 if(!['accept','request-changes'].includes(action)||!current.submission)throw new Error('Submit a saved job before choosing accept or request-changes.');
 let target;
 for(const candidate of [...rows].reverse().filter(r=>r.job_id)){const response=await fetch('http://127.0.0.1:5681/api/agents/v1/jobs/'+candidate.job_id,{headers:{authorization:'Bearer '+grant.token}});const value=await response.json();if(value.appliesToSavedSubmission){target=candidate;break;}}
 if(!target)throw new Error('No exact saved submission is available to review.');
 const checkedFiles=JSON.parse(target.materials_json)[0].files;
 service.review(buyer,project.taskId,{requestId:randomUUID(),agreementDigest:current.agreement.digest,submissionId:current.submission.id,expectedEventHash:current.headEventHash,action:action==='accept'?'ACCEPT':'REQUEST_CHANGES',reason:action==='accept'?'Synthetic buyer checked the exact original.':'Synthetic buyer requests a corrected workflow.',nextAction:action==='accept'?'NEXT_STEP':'WAIT_FOR_CORRECTION',criteria:[{criterionId:'workflow',verdict:action==='accept'?'MET':'NOT_MET',materialAccess:'AVAILABLE',note:'Synthetic local review.',checkedFiles}]});
 if(action==='request-changes'){const revision=row('local-client-v'+(rows.filter(r=>r.task_id.startsWith('local-client-v')).length+1));const materials=JSON.parse(revision.materials_json);materials[0].references=['https://example.test/workflow-v2.json'];materials[0].files=[{reference:materials[0].references[0],name:'workflow-v2.json',size:4,sha256:createHash('sha256').update('[{}]').digest('hex')}];revision.materials_json=JSON.stringify(materials);rows.push(revision);}
}
const fixture=createServer(async(req,res)=>{const send=(status,value)=>{res.writeHead(status,{'content-type':'application/json'});res.end(JSON.stringify(value));};try{
 if(req.url==='/lab/state'&&req.method==='GET'){persist();return send(200,{mode:'SIMULATION',projectId:project.taskId,...provider.snapshot()});}
 if(req.url==='/lab/action'&&req.method==='POST'){let raw='';for await(const b of req)raw+=b;await buyerAction(JSON.parse(raw).action);persist();return send(200,{ok:true,mode:'SIMULATION'});}
 if(await provider.handler(req,res)){persist();return;}send(404,{error:'Unknown local simulation endpoint'});
 }catch(error){send(400,{error:error.message});}});
await new Promise(r=>fixture.listen(5680,'127.0.0.1',r));
persist();writeFileSync(join(home,'provider-config.json'),JSON.stringify({mode:'SIMULATION',pid:process.pid,providerOrigin:'http://127.0.0.1:5680',prooftaskOrigin:'http://127.0.0.1:5681',projectId:project.taskId,agentToken:grant.token},null,2)+'\n',{mode:0o600});console.log('LOCAL_PROVIDER_SIMULATION_READY http://127.0.0.1:5680/lab/state');
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,async()=>{await new Promise(r=>api.close(r));await new Promise(r=>fixture.close(r));store.close();process.exit(0);});
