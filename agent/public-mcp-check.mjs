#!/usr/bin/env node
// Explicit live, anonymous read-only smoke check; never loads credentials.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createAdapter} from '../mcp/agent-mcp.mjs';
const catalog=JSON.parse(readFileSync(new URL('../mcp/agent-mcp-tools.json',import.meta.url)));
const handler=createAdapter({catalog});
await handler({jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:'2025-11-25',capabilities:{},clientInfo:{name:'public-discovery-check',version:'1'}}});
await handler({jsonrpc:'2.0',method:'notifications/initialized'});
const call=async(name,args)=>{
  const r=await handler({jsonrpc:'2.0',id:2,method:'tools/call',params:{name,arguments:args}});
  assert.ok(!r.error&&!r.result.isError,JSON.stringify(r));
  assert.equal(r.result.structuredContent.httpStatus,200);
  return r.result.structuredContent.data;
};
const found=await call('searchPublicSpecifications',{query:{q:'automation'}});
assert.ok(found.items.length>0,'No automation template found');
const selected=found.items[0];
const pinned=await call('getPublicSpecification',{path:{id:selected.slug},query:{version:selected.version}});
assert.equal(pinned.digest,selected.digest);
assert.equal(pinned.version,selected.version);
const denied=await handler({jsonrpc:'2.0',id:3,method:'tools/call',params:{name:'getAgent',arguments:{}}});
assert.equal(JSON.parse(denied.result.content[0].text).error,'AGENT_CREDENTIAL_REQUIRED');
console.log(JSON.stringify({checkedAt:new Date().toISOString(),search:'PASS',pinnedVersion:'PASS',digestMatches:true,privateRead:'BLOCKED',credentialsLoaded:false,businessWrites:0,slug:pinned.slug,version:pinned.version},null,2));
