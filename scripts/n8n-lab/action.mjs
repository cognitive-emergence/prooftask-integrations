#!/usr/bin/env node
const action=process.argv[2];
if(!['accept','request-changes','revoke'].includes(action))throw new Error('Use accept, request-changes or revoke for the synthetic local project only.');
const response=await fetch('http://127.0.0.1:5680/lab/action',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action})});
const value=await response.json();if(!response.ok)throw new Error(value.error);console.log(JSON.stringify(value));
