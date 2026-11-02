// Test-process-only adapter: real vendor nodes, fake credentials, local HTTP APIs.
// Never preload this bridge into an n8n instance with real service credentials.
const https=require('node:https');
const http=require('node:http');
const origin=new URL(process.env.N8N_LAB_PROVIDER_ORIGIN);
if(!['127.0.0.1','localhost'].includes(origin.hostname)||origin.protocol!=='http:')throw new Error('Provider simulation must bind to a loopback HTTP server.');
const request=https.request;
https.request=function(input,options,callback) {
  const originalArgs=[...arguments];
  if(typeof options==='function'){callback=options;options={};}
  let opts;
  if(typeof input==='string'||input instanceof URL){const u=new URL(input);opts={protocol:u.protocol,hostname:u.hostname,port:u.port,path:u.pathname+u.search,...options};}
  else opts={...input,...options};
  const host=String(opts.hostname||opts.host||'').split(':')[0].toLowerCase();
  const service=host==='sheets.googleapis.com'?'google':host==='slack.com'?'slack':null;
  if(!service)return request.apply(this,originalArgs);
  const headers={...opts.headers};const auth=Object.entries(headers).find(([k])=>k.toLowerCase()==='authorization')?.[1];
  if(auth!==(service==='google'?'Bearer mock-google-access-token':'Bearer xoxb-mock-slack-token'))throw new Error('Provider simulation refuses credentials other than the explicit mock tokens.');
  for(const key of Object.keys(headers))if(key.toLowerCase()==='host')delete headers[key];
  opts={...opts,protocol:'http:',hostname:origin.hostname,host:origin.hostname,port:origin.port,path:'/'+service+(opts.path||'/'),headers,agent:undefined,servername:undefined,createConnection:undefined};
  return http.request(opts,callback);
};
https.get=function(...args){const req=https.request(...args);req.end();return req;};
