// Local API-contract simulation for the real Google Sheets and Slack n8n nodes.
// No OAuth authority, workspace permission or real vendor delivery is claimed.
export const queueColumns = ['task_id','ready_for_review','project_id','summary','materials_json','request_id','request_json','job_id','handover_state','handover_note','prepared_at','notified_job_id','review_job_id','review_state','review_decision','review_accepted','review_next_action','review_observed_at','review_url','review_note'];
const columnNumber = value => [...value.toUpperCase()].reduce((n,c)=>n*26+c.charCodeAt(0)-64,0)-1;
export function a1Bounds(range, rowCount, columnCount) {
  const cells=range.includes('!')?range.slice(range.lastIndexOf('!')+1):(/^[A-Z]+\d*(?::[A-Z]*\d*)?$|^\d+:\d+$/.test(range)?range:'');
  if(!cells)return {r:0,c:0,endR:rowCount-1,endC:columnCount-1};
  const [start,end=start]=cells.replaceAll('$','').split(':');
  const part=s=>{const m=/^([A-Z]*)(\d*)$/i.exec(s);if(!m||!s)throw new Error('Unsupported A1 range: '+range);return {c:m[1]?columnNumber(m[1]):undefined,r:m[2]?Number(m[2])-1:undefined};};
  const a=part(start), b=part(end);
  return {r:a.r??0,c:a.c??0,endR:b.r??rowCount-1,endC:b.c??columnCount-1};
}
export function createProviderFixture({getRows,setRows,reminders,shouldFailWrite=()=>false,shouldFailReminder=()=>false,spreadsheetId='synthetic-sheet-id-123456789'}) {
  const audit=[], writes=[];
  const jsonBody=async req=>{let raw='';for await(const b of req)raw+=b;return raw?(String(req.headers['content-type']).includes('json')?JSON.parse(raw):Object.fromEntries(new URLSearchParams(raw))):{};};
  const metadata=id=>({spreadsheetId:id,spreadsheetUrl:'https://docs.google.com/spreadsheets/d/'+id,sheets:[{properties:{sheetId:0,title:'Delivery queue',gridProperties:{rowCount:1000,columnCount:queueColumns.length}}}]});
  const readRange=range=>{const grid=[queueColumns,...getRows().map(row=>queueColumns.map(k=>row[k]??''))];const {r,c,endR,endC}=a1Bounds(range,grid.length,queueColumns.length);const values=grid.slice(r,Math.min(endR+1,grid.length)).map(row=>row.slice(c,endC+1));for(const row of values)while(row.length&&row.at(-1)==='')row.pop();while(values.length&&!values.at(-1).length)values.pop();return {range,majorDimension:'ROWS',values};};
  const apply=(range,values)=>{const rows=structuredClone(getRows());const {r,c}=a1Bounds(range,rows.length+1,queueColumns.length);let changed=0;const changedFields=new Set();for(let i=0;i<values.length;i++){if(r+i===0)throw new Error('Simulation rejects changes to the queue header.');if(!rows[r+i-1])throw new Error('Simulation updates existing rows only.');for(let j=0;j<values[i].length;j++){if(values[i][j]===null||values[i][j]===undefined)continue;const key=queueColumns[c+j];if(!key)throw new Error('Column outside queue schema.');rows[r+i-1][key]=values[i][j];changed++;changedFields.add(key);}}setRows(rows);writes.push({range,rows:values.length,fields:[...changedFields],valueInputOption:'RAW'});return {updatedRange:range,updatedRows:values.length,updatedColumns:Math.max(0,...values.map(v=>v.length)),updatedCells:changed};};
  const handler=async(req,res)=>{
    const url=new URL(req.url,'http://fixture.local'), path=decodeURIComponent(url.pathname);
    if(!path.startsWith('/google/')&&!path.startsWith('/slack/'))return false;
    const send=(status,value)=>{res.writeHead(status,{'content-type':'application/json'});res.end(JSON.stringify(value));return true;};
    const provider=path.startsWith('/google/')?'googleSheets':'slack';
    const token=provider==='googleSheets'?'Bearer mock-google-access-token':'Bearer xoxb-mock-slack-token';
    if(req.headers.authorization!==token)return send(401,{error:{message:'Expected local simulation credential.'}});
    audit.push({provider,method:req.method,path,authorizedWithMockCredential:true});
    try {
      if(provider==='slack') {
        if(path!=='/slack/api/chat.postMessage'||req.method!=='POST')return send(404,{ok:false,error:'unsupported_mock_method'});
        const value=await jsonBody(req);
        if(value.channel!=='CSYNTHETIC'||typeof value.text!=='string')return send(200,{ok:false,error:'invalid_arguments'});
        if(shouldFailReminder())return send(200,{ok:false,error:'channel_not_found'});
        const ts=String(reminders.length+1)+'.000001';reminders.push({...value,ts});return send(200,{ok:true,channel:value.channel,ts,message:{text:value.text}});
      }
      const match=/^\/google\/v4\/spreadsheets\/([^/:]+)(.*)$/.exec(path);
      if(!match)return send(404,{error:{message:'Unsupported mock Sheets URL'}});
      const [,id,suffix]=match;
      if(id!==spreadsheetId)return send(404,{error:{message:'Synthetic spreadsheet not found.'}});
      if(req.method==='GET'&&!suffix)return send(200,metadata(id));
      if(req.method==='GET'&&suffix.startsWith('/values/'))return send(200,readRange(suffix.slice('/values/'.length)));
      if(req.method==='GET'&&suffix==='/values:batchGet')return send(200,{spreadsheetId:id,valueRanges:url.searchParams.getAll('ranges').map(readRange)});
      if(req.method==='POST'&&suffix==='/values:batchUpdate') {
        const body=await jsonBody(req);
        if(body.valueInputOption!=='RAW')return send(400,{error:{message:'Queue writes must use RAW.'}});
        const hasJob=body.data?.some(d=>{const {c}=a1Bounds(d.range,1000,queueColumns.length);return d.values?.some(row=>row.some((v,j)=>queueColumns[c+j]==='job_id'&&v));});
        if(hasJob&&shouldFailWrite())return send(403,{error:{code:403,status:'PERMISSION_DENIED',message:'Injected simulated write failure.'}});
        const rows=new Set(),columns=new Set();for(const d of body.data){const start=a1Bounds(d.range,1000,queueColumns.length);for(let i=0;i<d.values.length;i++)for(let j=0;j<d.values[i].length;j++)if(d.values[i][j]!==null&&d.values[i][j]!==undefined){rows.add(start.r+i);columns.add(start.c+j);}}
        const responses=body.data.map(d=>apply(d.range,d.values));return send(200,{spreadsheetId:id,totalUpdatedCells:responses.reduce((s,r)=>s+r.updatedCells,0),totalUpdatedRows:rows.size,totalUpdatedColumns:columns.size,totalUpdatedSheets:1,responses});
      }
      if(req.method==='PUT'&&suffix.startsWith('/values/')) {
        if(url.searchParams.get('valueInputOption')!=='RAW')return send(400,{error:{message:'Queue writes must use RAW.'}});
        const body=await jsonBody(req);return send(200,{spreadsheetId:id,...apply(suffix.slice('/values/'.length),body.values)});
      }
      return send(404,{error:{message:'Unsupported mock Sheets operation: '+req.method+' '+suffix}});
    } catch(error) {return send(400,{error:{message:error.message}});}
  };
  return {handler,audit,writes,snapshot:()=>({rows:structuredClone(getRows()),messages:structuredClone(reminders),requests:structuredClone(audit),writes:structuredClone(writes)})};
}
