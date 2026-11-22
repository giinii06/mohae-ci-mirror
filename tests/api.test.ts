import {test,expect} from 'bun:test';
const G='123456789012345678',U='234567890123456789';
test('Three-service API authentication and request replay',async()=>{
 const port=40000+Math.floor(Math.random()*10000);
 const proc=Bun.spawn(['bun','apps/api.ts'],{stdout:'pipe',stderr:'pipe',env:{
  ...process.env,PORT:String(port),DATABASE_PATH:':memory:',ALLOWED_GUILD_IDS:G,
  MOHAE_API_KEY:'a'.repeat(32),COLLECTOR_API_KEY:'b'.repeat(32),POLLY_API_KEY:'c'.repeat(32)
 }});
 const address='http://127.0.0.1:'+port;
 try{
  let online=false;
  for(let n=0;n<40;n++){await Bun.sleep(100);try{const r=await fetch(address+'/healthz');if(r.ok){online=true;break;}}catch{}}
  expect(online).toBe(true);
  const post=async(role:string,key:string,action:string,requestId:string,extra:Record<string,unknown>={})=>{
   const response=await fetch(address+'/v1/action',{method:'POST',headers:{
    'Content-Type':'application/json','X-Service-Role':role,'Authorization':'Bearer '+key
   },body:JSON.stringify({guildId:G,userId:U,requestId,action,...extra})});
   return {status:response.status,data:await response.json() as any};
  };
  const blocked=await post('collector','b'.repeat(32),'attendance','deny-collector');
  expect(blocked.status).toBe(403);
  expect((await post('mohae','bad','attendance','bad-key')).status).toBe(401);
  const earned=await post('mohae','a'.repeat(32),'attendance','claim-once');
  expect(earned.data.result.claimed).toBe(true);
  const repeat=await post('mohae','a'.repeat(32),'attendance','claim-once');
  expect(repeat.data).toEqual(earned.data);
  const report=await post('polly','c'.repeat(32),'report','report-id',{target:null,reason:'other',details:'a valid private report'});
  expect(report.status).toBe(200);
  expect(typeof report.data.result.reportId).toBe('string');

  const reportId=report.data.result.reportId as string;
  const status=await post('polly','c'.repeat(32),'report-status','owner-check',{reportId});
  expect(status.status).toBe(200);
  expect(status.data.result.status).toBe('open');
  const unrelated=await post('polly','c'.repeat(32),'report-status','nonowner-check',{
    reportId,userId:'345678901234567890'
  });
  expect(unrelated.data.error).toBe('REPORT_NOT_FOUND');
  const staffList=await post('polly','c'.repeat(32),'report-list','staff-list');
  expect(staffList.status).toBe(200);
  expect(staffList.data.result.some((r:any)=>r.id===reportId)).toBe(true);
  expect((await post('mohae','a'.repeat(32),'report-list','wrong-role')).status).toBe(403);
  const changed=await post('polly','c'.repeat(32),'report-update','staff-update',{
    reportId,status:'resolved'
  });
  expect(changed.status).toBe(200);
  expect(changed.data.result.status).toBe('resolved');
  const afterUpdate=await post('polly','c'.repeat(32),'report-status','check-update',{reportId});
  expect(afterUpdate.data.result.status).toBe('resolved');
  const invalid=await post('polly','c'.repeat(32),'report-update','staff-invalid',{
    reportId,status:'arbitrary'
  });
  expect(invalid.data.error).toBe('INVALID_REPORT_STATUS');
  expect((await post('mohae','a'.repeat(32),'report','not-allowed',{reason:'other',details:'some report'})).status).toBe(403);
  const chat=await post('collector','b'.repeat(32),'chat','test-chat',{messageId:'987654321098765432'});
  expect(chat.data.result.accepted).toBe(true);
  const wrongGuild=await post('mohae','a'.repeat(32),'attendance','guild-deny',{guildId:'444444444444444444'});
  expect(wrongGuild.data.error).toBe('GUILD_NOT_ALLOWED');
 }finally{
  proc.kill();await proc.exited;
 }
},20000);
