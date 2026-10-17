// Public-only Streamable HTTP gateway. Private credentials are never loaded.
import express from 'express';
import {Server} from '@modelcontextprotocol/sdk/server/index.js';
import {StreamableHTTPServerTransport} from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {CallToolRequestSchema,ListToolsRequestSchema,McpError,ErrorCode} from '@modelcontextprotocol/sdk/types.js';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {createAdapter} from '../mcp/agent-mcp.mjs';
const catalog=JSON.parse(readFileSync(new URL('../mcp/agent-mcp-tools.json',import.meta.url)));
const names=new Set(['getAgentCapabilities','searchPublicSpecifications','getPublicSpecification']);
const publicCatalog={...catalog,tools:catalog.tools.filter(t=>names.has(t.name)&&!t.route.authenticated&&!t.route.mutating&&t.route.method==='GET')};

export function createPublicGateway({fetcher=fetch,allowedOrigins=[],allowedHosts=['localhost','127.0.0.1'],concurrencyLimit=8}={}) {
  const app=express();
  app.disable('x-powered-by');
  // Explicit Host and Origin allowlists. Reverse proxies must preserve Host.
  app.use((req,res,next)=>{
    if(!allowedHosts.includes(req.hostname))return res.status(403).json({error:'HOST_NOT_ALLOWED'});
    if(req.headers.origin&&!allowedOrigins.includes(req.headers.origin))return res.status(403).json({error:'ORIGIN_NOT_ALLOWED'});
    res.set('Cache-Control','no-store');
    next();
  });
  app.get('/health',(_req,res)=>res.json({schema:'prooftask.public-mcp-health/v1',status:'ok',commitSha:process.env.RAILWAY_GIT_COMMIT_SHA||null,deploymentId:process.env.RAILWAY_DEPLOYMENT_ID||null,tools:[...names],privateTools:false}));
  let active=0;
  app.post('/mcp',(req,res,next)=>{
    if(active>=concurrencyLimit)return res.status(429).set('Retry-After','5').json({error:'BUSY'});
    active++;
    let released=false;
    const release=()=>{if(!released){released=true;active--;}};
    res.once('finish',release);res.once('close',release);
    next();
  },express.json({limit:'32kb',strict:true}),async(req,res)=>{
    // Never copy incoming Authorization headers or user cookies upstream.
    const handler=createAdapter({catalog:publicCatalog,fetcher});
    await handler({jsonrpc:'2.0',id:0,method:'initialize',params:{protocolVersion:'2025-11-25',capabilities:{},clientInfo:{name:'public-gateway',version:'0.1.0'}}});
    await handler({jsonrpc:'2.0',method:'notifications/initialized'});
    const server=new Server({name:'prooftask-public-discovery',version:'0.1.0'},{capabilities:{tools:{}}});
    server.setRequestHandler(ListToolsRequestSchema,async()=>({tools:publicCatalog.tools.map(({route,...tool})=>tool)}));
    server.setRequestHandler(CallToolRequestSchema,async request=>{
      const reply=await handler({jsonrpc:'2.0',id:1,method:'tools/call',params:request.params});
      if(reply.error)throw new McpError(ErrorCode.InvalidParams,reply.error.message);
      return reply.result;
    });
    const transport=new StreamableHTTPServerTransport({sessionIdGenerator:undefined,enableJsonResponse:true});
    res.once('close',()=>{void transport.close();void server.close();});
    try{await server.connect(transport);await transport.handleRequest(req,res,req.body);}
    catch{if(!res.headersSent)res.status(500).json({jsonrpc:'2.0',id:null,error:{code:-32603,message:'Public MCP request failed'}});}
  });
  app.all('/mcp',(_req,res)=>res.status(405).set('Allow','POST').json({error:'METHOD_NOT_ALLOWED'}));
  app.use((error,_req,res,_next)=>res.status(error.status===413?413:400).json({error:'INVALID_REQUEST'}));
  return app;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const origins=(process.env.PUBLIC_MCP_ALLOWED_ORIGINS||'').split(',').filter(Boolean);
  const hosts=(process.env.PUBLIC_MCP_ALLOWED_HOSTS||'localhost,127.0.0.1').split(',').filter(Boolean);
  createPublicGateway({allowedOrigins:origins,allowedHosts:hosts}).listen(Number(process.env.PORT||3000),process.env.HOST||'127.0.0.1',()=>console.log('Public discovery gateway listening. No private Agent tools.'));
}
