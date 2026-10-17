import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { discover } from '../agent/discover.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const read = path => readFileSync(root + path, 'utf8');
const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
for (const name of readdirSync(root + 'n8n').filter(name => name.endsWith('.json'))) {
  const workflow = JSON.parse(read('n8n/' + name));
  assert.equal(workflow.active, false);
  assert.deepEqual(workflow.pinData, {});
  assert.equal(workflow.settings.saveDataSuccessExecution, 'none');
  assert.equal(workflow.settings.saveDataErrorExecution, 'none');
  const names = new Set(workflow.nodes.map(node => node.name));
  for (const node of workflow.nodes) {
    assert.equal(node.credentials, undefined);
    if (node.type === 'n8n-nodes-base.code') new AsyncFunction(node.parameters.jsCode);
  }
  for (const connection of Object.values(workflow.connections)) for (const outputs of connection.main) for (const edge of outputs) assert.ok(names.has(edge.node));
}
const messages = [
  {jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:'2025-11-25',capabilities:{},clientInfo:{name:'distribution-check',version:'0.1'}}},
  {jsonrpc:'2.0',method:'notifications/initialized'},
  {jsonrpc:'2.0',id:2,method:'tools/list',params:{}}
];
const process = spawnSync('node', ['mcp/agent-mcp.mjs'], {cwd:root,input:messages.map(value=>JSON.stringify(value)).join('\n')+'\n',encoding:'utf8',timeout:10000,env:{PATH:globalThis.process.env.PATH}});
assert.equal(process.status, 0, process.stderr);
const output = process.stdout.trim().split('\n').map(line=>JSON.parse(line));
assert.ok(output.find(value=>value.id===1)?.result?.serverInfo);
const tools = output.find(value=>value.id===2)?.result?.tools;
assert.ok(Array.isArray(tools) && tools.length > 0);
const catalog = JSON.parse(read('mcp/agent-mcp-tools.json'));
for (const tool of tools) assert.equal(catalog.tools.find(entry=>entry.name===tool.name).route.mutating, false);
const manifest = JSON.parse(read('ASSET_PROVENANCE.json'));
for (const entry of manifest.assets) assert.equal(createHash('sha256').update(readFileSync(root+entry.path)).digest('hex'),entry.sha256,entry.path);
if (globalThis.process.argv.includes('--live')) {
  const response = await discover('automation');
  assert.ok(response && typeof response==='object');
  console.log('Live anonymous discovery returned JSON. No business write was made.');
}
console.log(`Checked 4 inactive n8n workflows, public asset hashes and MCP stdio initialization with ${tools.length} read-only tools.`);
