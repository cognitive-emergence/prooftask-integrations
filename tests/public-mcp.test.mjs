import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createAdapter} from '../mcp/agent-mcp.mjs';
const catalog=JSON.parse(readFileSync(new URL('../mcp/agent-mcp-tools.json',import.meta.url)));
async function setup(fetcher) {
  const handler=createAdapter({catalog,token:'ptag_test_private',fetcher});
  await handler({jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:'2025-11-25',capabilities:{},clientInfo:{name:'test',version:'1'}}});
  await handler({jsonrpc:'2.0',method:'notifications/initialized'});
  return (name,args)=>handler({jsonrpc:'2.0',id:2,method:'tools/call',params:{name,arguments:args}});
}
test('public discovery is credential-free, encoded and version pinned',async()=>{
  const calls=[];
  const call=await setup(async(url,options)=>{calls.push({url:new URL(url),options});return Response.json({items:[]});});
  assert.equal((await call('searchPublicSpecifications',{query:{q:'客户 & automation'}})).result.structuredContent.httpStatus,200);
  await call('getPublicSpecification',{path:{id:'business-automation'},query:{version:2}});
  assert.equal(calls[0].url.pathname,'/api/public/specifications');
  assert.equal(calls[0].url.searchParams.get('q'),'客户 & automation');
  assert.equal(calls[1].url.pathname,'/api/public/specifications/business-automation');
  assert.equal(calls[1].url.searchParams.get('version'),'2');
  for(const {options} of calls){assert.equal(options.headers.authorization,undefined);assert.equal(options.method,'GET');assert.equal(options.redirect,'error');assert.equal(options.body,undefined);}
});
test('invalid queries, unpinned reads and private mutation cannot reach the network',async()=>{
  let requests=0;
  const call=await setup(async()=>{requests++;return Response.json({});});
  for(const [name,args] of [
    ['searchPublicSpecifications',{query:{q:'x'.repeat(201)}}],
    ['searchPublicSpecifications',{query:{token:'secret'}}],
    ['getPublicSpecification',{path:{id:'../private'},query:{version:2}}],
    ['getPublicSpecification',{path:{id:'business-automation'}}],
    ['getPublicSpecification',{path:{id:'business-automation'},query:{version:0}}],
  ])assert.equal((await call(name,args)).error.code,-32602);
  assert.equal(requests,0);
});
test('public errors stay errors and reflected credentials are redacted',async()=>{
  const call=await setup(async()=>Response.json({error:'not found',debug:'ptag_test_private'},{status:404}));
  const result=(await call('getPublicSpecification',{path:{id:'missing'},query:{version:2}})).result;
  assert.equal(result.isError,true);
  assert.equal(result.structuredContent.httpStatus,404);
  assert.ok(!JSON.stringify(result).includes('ptag_test_private'));
});
