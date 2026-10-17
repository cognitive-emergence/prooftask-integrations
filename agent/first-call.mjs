#!/usr/bin/env node
// Public-only onboarding check. Never loads Agent credentials or enables writes.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { discover } from './discover.mjs';
const adapter = process.argv[2] || fileURLToPath(new URL('../mcp/agent-mcp.mjs', import.meta.url));
const messages = [
  {jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:'2025-11-25',capabilities:{},clientInfo:{name:'prooftask-first-call',version:'1.0.0'}}},
  {jsonrpc:'2.0',method:'notifications/initialized'},
  {jsonrpc:'2.0',id:2,method:'tools/list',params:{}},
  {jsonrpc:'2.0',id:3,method:'tools/call',params:{name:'getAgentCapabilities',arguments:{}}},
  {jsonrpc:'2.0',id:4,method:'tools/call',params:{name:'getAgent',arguments:{}}}
];
try {
  const child = spawn(process.execPath,[adapter],{env:Object.fromEntries(['PATH','SystemRoot','HTTP_PROXY','HTTPS_PROXY','ALL_PROXY','NO_PROXY','http_proxy','https_proxy','all_proxy','no_proxy','NODE_USE_ENV_PROXY','NODE_EXTRA_CA_CERTS'].filter(k=>process.env[k]!==undefined).map(k=>[k,process.env[k]])),stdio:['pipe','pipe','pipe']});
  let stdout='', stderr='';
  const timer=setTimeout(()=>child.kill(),45000);
  child.stdout.on('data',chunk=>{stdout+=chunk;if(stdout.length>2000000)child.kill();});
  child.stderr.on('data',chunk=>{stderr+=chunk;if(stderr.length>10000)child.kill();});
  const done=new Promise((resolve,reject)=>{child.on('error',reject);child.on('close',code=>code===0?resolve():reject(new Error('MCP process failed or timed out')));});
  child.stdin.end(messages.map(x=>JSON.stringify(x)).join('\n')+'\n');
  try {await done;} finally {clearTimeout(timer);}
  const rows=stdout.trim().split('\n').map(x=>JSON.parse(x));
  const get=id=>rows.find(x=>x.id===id)?.result;
  assert.ok(get(1)?.serverInfo,'MCP initialization failed');
  assert.ok(get(2)?.tools?.some(x=>x.name==='getAgentCapabilities'),'Capability tool missing');
  assert.equal(get(3)?.isError,undefined,'Public capability call failed');
  assert.equal(get(3)?.structuredContent?.httpStatus,200,'Capabilities did not return HTTP 200');
  assert.equal(get(4)?.isError,true,'Private reads must require credentials');
  const denied=JSON.parse(get(4).content[0].text);
  assert.equal(denied.error,'AGENT_CREDENTIAL_REQUIRED');
  const publicResult=await discover('automation');
  assert.ok(publicResult&&typeof publicResult==='object','Public discovery did not return JSON');
  console.log(JSON.stringify({checkedAt:new Date().toISOString(),mcpInitialization:'PASS',listedTools:get(2).tools.length,publicCapabilities:'HTTP_200',privateReadWithoutCredential:'BLOCKED',publicTemplateDiscovery:'JSON_OK',businessWrites:0,credentialsLoaded:false},null,2));
} catch(error) {console.error('First-call check failed: '+error.message);process.exitCode=1;}
