import {createHash,timingSafeEqual} from 'node:crypto';
import {Store} from '../src/store.ts';
import {Game,GameError,checkSnowflake} from '../src/game.ts';
import {allowedGuild,secret,type Role} from '../src/secrets.ts';

const store=new Store(process.env.DATABASE_PATH||'/data/mohae.sqlite');
const game=new Game(store);
game.settleExpired();
setInterval(()=>{try{game.settleExpired();}catch(e){console.error('Season settlement failed',e);}},3600000);
const keys:Record<Role,Buffer>={
 mohae:createHash('sha256').update(secret('MOHAE_API_KEY')).digest(),
 collector:createHash('sha256').update(secret('COLLECTOR_API_KEY')).digest(),
 polly:createHash('sha256').update(secret('POLLY_API_KEY')).digest()
};
const permit:Record<Role,string[]>={
 mohae:['profile','public-profile','visibility','export','journal','journal-delete','attendance','daily','weekly','weekly-claim','draw','draw-history','cards','collection','lock','dismantle','representative','affinity','mini-start','mini-finish','buy','equip','season','season-claim','season-activate','event','event-enable','event-claim','coop','coop-enable','coop-contribute','coop-claim','privacy-delete'],
 collector:['chat','voice'],polly:['report','report-status','report-list','report-update']
};
function reply(result:unknown,status=200):Response{return Response.json(result,{status,headers:{'Cache-Control':'no-store'}});}
function requestIdentity(req:Request):Role {
 const role=req.headers.get('x-service-role') as Role;
 if(!Object.hasOwn(keys,role))throw new GameError('UNAUTHORIZED');
 const authorization=req.headers.get('authorization')||'';
 if(!authorization.startsWith('Bearer '))throw new GameError('UNAUTHORIZED');
 const sent=createHash('sha256').update(authorization.slice(7)).digest();
 if(!timingSafeEqual(sent,keys[role]))throw new GameError('UNAUTHORIZED');
 return role;
}
async function dispatch(req:Request):Promise<Response>{
 if(req.method==='GET'&&new URL(req.url).pathname==='/healthz')return reply({ok:true,service:'game-api'});
 if(req.method!=='POST'||new URL(req.url).pathname!=='/v1/action')return reply({ok:false,error:'NOT_FOUND'},404);
 try{
  const role=requestIdentity(req);
  if(Number(req.headers.get('content-length')||0)>16384)throw new GameError('PAYLOAD_TOO_LARGE');
  const raw=await req.text();if(raw.length>16384)throw new GameError('PAYLOAD_TOO_LARGE');
  const a=JSON.parse(raw) as Record<string,any>;
  if(!a||typeof a.action!=='string'||!permit[role].includes(a.action))throw new GameError('FORBIDDEN');
  checkSnowflake(a.guildId);
  if(!allowedGuild(a.guildId))throw new GameError('GUILD_NOT_ALLOWED');
  if(a.action!=='season-activate')checkSnowflake(a.userId);
  const g=a.guildId,u=a.userId,k=a.requestId;
  let result:unknown;
  switch(a.action){
   case 'profile':result=game.profile(g,u);break;
   case 'public-profile':result=game.publicProfile(g,u,a.target);break;
   case 'visibility':result=game.visibility(g,u,k,a.visible);break;
   case 'export':result=game.exportData(g,u);break;
   case 'journal':result=game.journal(g,u,a.day);break;
   case 'journal-delete':result=game.journalDelete(g,u,k,a.day);break;
   case 'attendance':result=game.attendance(g,u,k);break;
   case 'daily':result=game.daily(g,u,k,a.topic,a.note,a.save===true);break;
   case 'weekly':result=game.weekly(g,u);break;
   case 'weekly-claim':result=game.claimWeekly(g,u,k,a.week);break;
   case 'draw':result=game.draw(g,u,k,a.banner,a.quantity);break;
   case 'draw-history':result=game.drawHistory(g,u);break;
   case 'cards':result=game.cards(g,u);break;
   case 'collection':result=game.collection(g,u);break;
   case 'lock':result=game.lockCard(g,u,k,a.cardId,a.locked===true);break;
   case 'dismantle':result=game.dismantle(g,u,k,a.cardId,a.confirm===true);break;
   case 'representative':result=game.representative(g,u,k,a.character);break;
   case 'affinity':result=game.affinity(g,u,k,a.kind);break;
   case 'mini-start':result=game.miniStart(g,u,k,a.game);break;
   case 'mini-finish':result=game.miniFinish(g,u,k,a.sessionId,a.answer);break;
   case 'buy':result=game.buy(g,u,k,a.sku);break;
   case 'equip':result=game.equip(g,u,k,a.sku);break;
   case 'season':result=game.seasonStatus(g,u);break;
   case 'event':result=game.eventStatus(g,u);break;
   case 'coop':result=game.coopStatus(g,u);break;
   case 'coop-enable':result=game.enableCoop(g,a.target);break;
   case 'coop-contribute':result=game.contributeCoop(g,u,k);break;
   case 'coop-claim':result=game.claimCoop(g,u,k);break;
   case 'event-enable':result=game.enableEvent(g,a.eventId);break;
   case 'event-claim':result=game.claimEvent(g,u,k,a.eventId);break;
   case 'season-claim':result=game.claimSeason(g,u,k,a.tier);break;
   case 'season-activate':result=game.activateSeason(g,a.seasonId,a.start);break;
   case 'chat':result=game.chat(g,u,k,a.messageId);break;
   case 'voice':result=game.voice(g,u,k,a.seconds);break;
   case 'report':result=game.report(g,u,k,a.target||null,a.reason,a.details);break;
   case 'report-status':result=game.reportStatus(g,u,a.reportId);break;
   case 'report-list':result=game.moderationList(g);break;
   case 'report-update':result=game.moderationUpdate(g,u,k,a.reportId,a.status);break;
   case 'privacy-delete':result=game.privacyDelete(g,u,k);break;
   default:throw new GameError('FORBIDDEN');
  }
  return reply({ok:true,result});
 }catch(error){
  const code=error instanceof GameError?error.code:error instanceof SyntaxError?'BAD_JSON':'INTERNAL_ERROR';
  if(code==='INTERNAL_ERROR')console.error('Game API internal failure:',error);
  return reply({ok:false,error:code},code==='UNAUTHORIZED'?401:code==='FORBIDDEN'?403:code==='INTERNAL_ERROR'?500:400);
 }
}
const server=Bun.serve({port:Number(process.env.PORT||3000),hostname:'0.0.0.0',fetch:dispatch});
console.log('MOHAE game-api listening on port',server.port);
process.on('SIGTERM',()=>{server.stop();store.close();});
