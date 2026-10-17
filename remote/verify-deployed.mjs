import assert from 'node:assert/strict';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StreamableHTTPClientTransport} from '@modelcontextprotocol/sdk/client/streamableHttp.js';
const endpoint=new URL(process.argv[2]);
assert.equal(endpoint.protocol,'https:');
assert.equal(endpoint.pathname,'/mcp');
assert.match(process.argv[3]||'',/^[a-f0-9]{40}$/);
const health=await fetch(new URL('/health',endpoint),{signal:AbortSignal.timeout(20000)});
assert.equal(health.status,200);const release=await health.json();
assert.equal(release.commitSha,process.argv[3]);
assert.equal(release.privateTools,false);
const client=new Client({name:'prooftask-external-read-check',version:'1'});
try{
  await client.connect(new StreamableHTTPClientTransport(endpoint));
  const tools=await client.listTools();
  assert.deepEqual(tools.tools.map(t=>t.name).sort(),['getAgentCapabilities','getPublicSpecification','searchPublicSpecifications']);
  const call=async(name,args)=>{const r=await client.callTool({name,arguments:args});assert.ok(!r.isError,JSON.stringify(r));assert.equal(r.structuredContent.httpStatus,200);return r.structuredContent.data;};
  await call('getAgentCapabilities',{});
  const found=await call('searchPublicSpecifications',{query:{q:'automation'}});
  assert.ok(found.items.length>0);
  const s=found.items[0],pinned=await call('getPublicSpecification',{path:{id:s.slug},query:{version:s.version}});
  assert.equal(pinned.digest,s.digest);
  await assert.rejects(client.callTool({name:'getAgent',arguments:{}}));
  console.log(JSON.stringify({checkedAt:new Date().toISOString(),endpoint:endpoint.href,commitSha:release.commitSha,deploymentId:release.deploymentId,toolCount:3,initialization:'PASS',publicCapabilities:'PASS',anonymousSearch:'PASS',pinnedDigest:'PASS',privateTool:'BLOCKED',credentialsLoaded:false,businessWrites:0},null,2));
}finally{await client.close();}
