import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StreamableHTTPClientTransport} from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import {createPublicGateway} from './server.mjs';
test('official SDK client discovers public templates over HTTP without private authority',async()=>{
  const upstream=[];
  const template = {id:'rt_test',slug:'business-automation',version:2,digest:'a'.repeat(64),template:{title:'ptag_public_label'}};
  const app=createPublicGateway({fetcher:async(url,options)=>{
    upstream.push({url,options});
    if(url.pathname==='/api/agents/v1/capabilities')return Response.json({apiVersion:'1',connection:{},mcpTransport:{},billing:{}});
    if(url.pathname==='/api/public/specifications')return Response.json({items:url.searchParams.get('q')==='unknown'?[]:[template]});
    if(url.pathname==='/api/public/specifications/'+template.id&&url.searchParams.get('version')==='2')return Response.json(template);
    return Response.json({error:'NOT_FOUND'},{status:404});
  }});
  const http=app.listen(0,'127.0.0.1');await once(http,'listening');
  const url=new URL('http://127.0.0.1:'+http.address().port+'/mcp');
  const client=new Client({name:'gateway-test',version:'1'});
  try{
    await client.connect(new StreamableHTTPClientTransport(url));
    const listed=await client.listTools();
    const health=await(await fetch(new URL('/health',url))).json();
    assert.deepEqual(health.tools.slice().sort(),listed.tools.map(t=>t.name).sort());
    assert.equal(health.tools.length,3);assert.equal(health.privateTools,false);
    assert.deepEqual(listed.tools.map(t=>t.name).sort(),['getAgentCapabilities','getPublicSpecification','searchPublicSpecifications']);
    const result=await client.callTool({name:'searchPublicSpecifications',arguments:{query:{q:'automation'}}});
    assert.equal(result.isError,undefined);assert.equal(result.structuredContent.httpStatus,200);
    assert.equal(result.structuredContent.data.items[0].template.title,'ptag_public_label');
    assert.equal(upstream[0].options.headers.authorization,undefined);
    assert.equal(upstream[0].options.method,'GET');
    for(const tool of listed.tools)assert.ok(tool.outputSchema,tool.name);
    assert.equal((await client.callTool({name:'getAgentCapabilities',arguments:{}})).structuredContent.data.apiVersion,'1');
    assert.deepEqual((await client.callTool({name:'searchPublicSpecifications',arguments:{query:{q:'unknown'}}})).structuredContent.data.items,[]);
    const read = version => client.callTool({name:'getPublicSpecification',arguments:{path:{id:template.id},query:{version}}});
    assert.equal((await read(2)).structuredContent.data.digest,template.digest);
    const missing = await read(3);
    assert.equal(missing.isError,true);
    assert.equal(missing.structuredContent.httpStatus,404);
    await assert.rejects(client.callTool({name:'getAgent',arguments:{}}));
    await assert.rejects(client.callTool({name:'getPublicSpecification',arguments:{path:{id:'business-automation'}}}));
    assert.equal(upstream.length,5);
    assert.equal((await fetch(url,{headers:{origin:'https://untrusted.example'}})).status,403);
    assert.equal((await fetch(url)).status,405);
    assert.equal((await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:'{'})).status,400);
  }finally{await client.close();await new Promise(resolve=>http.close(resolve));}
});
