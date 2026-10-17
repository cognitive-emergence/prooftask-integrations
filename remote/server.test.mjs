import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StreamableHTTPClientTransport} from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import {createPublicGateway} from './server.mjs';
test('official SDK client discovers public templates over HTTP without private authority',async()=>{
  const upstream=[];
  const app=createPublicGateway({fetcher:async(url,options)=>{upstream.push({url,options});return Response.json({items:[{slug:'business-automation',version:2,digest:'a'.repeat(64)}]});}});
  const http=app.listen(0,'127.0.0.1');await once(http,'listening');
  const url=new URL('http://127.0.0.1:'+http.address().port+'/mcp');
  const client=new Client({name:'gateway-test',version:'1'});
  try{
    await client.connect(new StreamableHTTPClientTransport(url));
    const listed=await client.listTools();
    assert.deepEqual(listed.tools.map(t=>t.name).sort(),['getAgentCapabilities','getPublicSpecification','searchPublicSpecifications']);
    const result=await client.callTool({name:'searchPublicSpecifications',arguments:{query:{q:'automation'}}});
    assert.equal(result.isError,undefined);assert.equal(result.structuredContent.httpStatus,200);
    assert.equal(upstream[0].options.headers.authorization,undefined);
    assert.equal(upstream[0].options.method,'GET');
    await assert.rejects(client.callTool({name:'getAgent',arguments:{}}));
    await assert.rejects(client.callTool({name:'getPublicSpecification',arguments:{path:{id:'business-automation'}}}));
    assert.equal(upstream.length,1);
    assert.equal((await fetch(url,{headers:{origin:'https://untrusted.example'}})).status,403);
    assert.equal((await fetch(url)).status,405);
    assert.equal((await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:'{'})).status,400);
  }finally{await client.close();await new Promise(resolve=>http.close(resolve));}
});
