import {randomUUID,randomBytes,createCipheriv,createDecipheriv} from 'node:crypto';
import {secret} from './secrets.ts';
import {Store} from './store.ts';
import {gameDay,gameWeek,currentLevel,seasonTier,kstMondayFiveMs} from './time.ts';
import {drawOne,type Pity} from './gacha.ts';
import {characterMap,cosmeticMap,questTopics,miniGames,seasonRewards,seasonalEvents} from './catalog.ts';

export class GameError extends Error {constructor(public code:string,message=code){super(message);}}
type Amount='MOHAE'|'SHARD'|'TICKET';
type Person={id:string;guild_id:string;user_id:string;xp:number;representative:string|null;deleted:number};
function bad(test:unknown,code:string):asserts test {if(!test)throw new GameError(code);}
export function checkSnowflake(id:string):void{bad(typeof id==='string'&&/^\d{15,22}$/.test(id),'INVALID_DISCORD_ID');}
export class Game {
 constructor(public store:Store, private clock:()=>number=Date.now) {}
 private now(){return this.clock();}
 private player(guild:string,user:string):Person {
  checkSnowflake(guild);checkSnowflake(user);
  let p=this.store.get<Person>('SELECT * FROM players WHERE guild_id=? AND user_id=? AND deleted=0',guild,user);
  if(!p){const id=randomUUID();this.store.run('INSERT INTO players(id,guild_id,user_id,joined_at) VALUES(?,?,?,?)',id,guild,user,this.now());p=this.store.get<Person>('SELECT * FROM players WHERE id=?',id)!;}
  return p;
 }
 private existing(guild:string,user:string):Person|undefined {
  checkSnowflake(guild);checkSnowflake(user);
  return this.store.get<Person>('SELECT * FROM players WHERE guild_id=? AND user_id=? AND deleted=0',guild,user);
 }
 /** A single authoritative transaction covers player creation, all rewards and the saved result. */
 private op<T>(guild:string,user:string,key:string,kind:string,action:(p:Person,now:number)=>T):T {
  bad(typeof key==='string'&&key.length>=4&&key.length<=160,'INVALID_REQUEST_ID');
  return this.store.tx(()=>{
   const p=this.player(guild,user),now=this.now();
   const old=this.store.get<{result:string;kind:string}>('SELECT result,kind FROM operations WHERE player_id=? AND request_id=?',p.id,key);
   if(old){bad(old.kind===kind,'IDEMPOTENCY_CONFLICT');return JSON.parse(old.result) as T;}
   const result=action(p,now);
   this.store.run('INSERT INTO operations(player_id,request_id,kind,result,at) VALUES(?,?,?,?,?)',p.id,key,kind,JSON.stringify(result),now);
   return result;
  });
 }
 private balance(p:string,c:Amount):number{return this.store.get<{balance:number}>('SELECT balance FROM wallets WHERE player_id=? AND currency=?',p,c)?.balance??0;}
 private credit(p:string,c:Amount,delta:number,source:string,now:number):void {
  bad(Number.isSafeInteger(delta)&&delta!==0,'INVALID_AMOUNT');
  this.store.run('INSERT OR IGNORE INTO wallets(player_id,currency,balance) VALUES(?,?,0)',p,c);
  if(delta<0)bad(this.balance(p,c)>=-delta,'INSUFFICIENT_'+c);
  this.store.run('UPDATE wallets SET balance=balance+? WHERE player_id=? AND currency=?',delta,p,c);
  this.store.run('INSERT INTO ledger(id,player_id,currency,delta,source,at) VALUES(?,?,?,?,?,?)',randomUUID(),p,c,delta,source,now);
 }
 private season(guild:string,at:number):{id:string;start_at:number;end_at:number}|undefined {
  const s=this.store.get<{id:string;start_at:number;end_at:number;enabled:number}>('SELECT * FROM season WHERE guild_id=? AND enabled=1 AND start_at<=? AND end_at>? ORDER BY start_at DESC LIMIT 1',guild,at,at);
  return s;
 }
 private addXp(p:Person,xp:number,seasonXp:number,at:number):void {
  this.store.run('UPDATE players SET xp=xp+? WHERE id=?',xp,p.id);
  const s=this.season(p.guild_id,at);
  if(s&&seasonXp)this.store.run('INSERT INTO season_progress(player_id,season,xp) VALUES(?,?,?) ON CONFLICT(player_id,season) DO UPDATE SET xp=xp+excluded.xp',p.id,s.id,seasonXp);
 }
 private giveCard(p:Person,characterId:string,source:string,at:number):string {
  const c=characterMap.get(characterId);bad(c,'INVALID_CHARACTER');
  const id=randomUUID();
  this.store.run('INSERT INTO cards(id,player_id,character,rarity,acquired,source) VALUES(?,?,?,?,?,?)',id,p.id,characterId,c.rarity,at,source);
  this.store.run('INSERT OR IGNORE INTO discoveries(player_id,character,at) VALUES(?,?,?)',p.id,characterId,at);
  return id;
 }
 profile(guild:string,user:string):unknown {
  return this.store.tx(()=>{
   const p=this.player(guild,user);
   const balances=Object.fromEntries((['MOHAE','SHARD','TICKET'] as Amount[]).map(c=>[c,this.balance(p.id,c)]));
   const day=gameDay(this.now()),week=gameWeek(this.now());
   const cards=this.store.get<{n:number}>('SELECT COUNT(*) n FROM cards WHERE player_id=?',p.id)?.n??0;
   const discovered=this.store.get<{n:number}>('SELECT COUNT(*) n FROM discoveries WHERE player_id=?',p.id)?.n??0;
   const season=this.season(guild,this.now());
   const xp=season?this.store.get<{xp:number}>('SELECT xp FROM season_progress WHERE player_id=? AND season=?',p.id,season.id)?.xp??0:0;
   return {level:currentLevel(p.xp),permanentXp:p.xp,balances,cardCount:cards,discovered,representative:p.representative,gameDay:day,gameWeek:week,season:season?{id:season.id,xp,tier:seasonTier(xp)}:null,equipped:this.store.all('SELECT slot,sku FROM equipped WHERE player_id=?',p.id),public:!!this.store.get('SELECT 1 FROM profile_visibility WHERE player_id=? AND public=1',p.id)};
  });
 }
 publicProfile(guild:string,viewer:string,target:string):unknown{return this.store.tx(()=>{
  checkSnowflake(viewer);checkSnowflake(target);
  const p=this.existing(guild,target);bad(p,'USER_NOT_REGISTERED');
  if(viewer!==target)bad(!!this.store.get('SELECT 1 FROM profile_visibility WHERE player_id=? AND public=1',p.id),'PROFILE_PRIVATE');
  const cardCount=this.store.get<{n:number}>('SELECT COUNT(*) n FROM cards WHERE player_id=?',p.id)?.n??0;
  const discovered=this.store.get<{n:number}>('SELECT COUNT(*) n FROM discoveries WHERE player_id=?',p.id)?.n??0;
  const equipped=this.store.all<{slot:string;sku:string}>('SELECT slot,sku FROM equipped WHERE player_id=?',p.id);
  return {discordUserId:target,level:currentLevel(p.xp),cardCount,discovered,representative:p.representative,equipped};
 });}
 visibility(guild:string,user:string,key:string,visible:boolean):unknown{return this.op(guild,user,key,'profile-visibility',(p)=>{
  bad(typeof visible==='boolean','INVALID_VISIBILITY');
  this.store.run('INSERT INTO profile_visibility(player_id,public) VALUES(?,?) ON CONFLICT(player_id) DO UPDATE SET public=excluded.public',p.id,visible?1:0);
  return {public:visible};
 });}
  attendance(guild:string,user:string,key:string):unknown {return this.op(guild,user,key,'attendance',(p,now)=>{
  const day=gameDay(now);
  if(this.store.get('SELECT 1 FROM attendance WHERE player_id=? AND day=?',p.id,day))return {claimed:false,day};
  this.store.run('INSERT INTO attendance(player_id,day) VALUES(?,?)',p.id,day);
  this.credit(p.id,'MOHAE',40,'attendance:'+day,now);this.addXp(p,20,0,now);
  return {claimed:true,day,mohae:40,xp:20};
 });}
 daily(guild:string,user:string,key:string,topic:string,note?:string,save=false):unknown {return this.op(guild,user,key,'daily',(p,now)=>{
  bad((questTopics as readonly string[]).includes(topic),'INVALID_QUEST');
  const day=gameDay(now);
  if(this.store.get('SELECT 1 FROM daily_quests WHERE player_id=? AND day=?',p.id,day)){if(save&&note)this.saveJournal(p,day,note);return {claimed:false,day,journalSaved:!!(save&&note)};}
  this.store.run('INSERT INTO daily_quests(player_id,day,topic) VALUES(?,?,?)',p.id,day,topic);
  if(save&&note)this.saveJournal(p,day,note);
  this.credit(p.id,'MOHAE',60,'daily:'+day,now);this.addXp(p,40,80,now);
  return {claimed:true,topic,day,mohae:60,xp:40,seasonXp:80,journalSaved:!!(save&&note)};
 });}
 private journalKey():Buffer {
  const key=secret('JOURNAL_KEY');
  bad(/^[a-fA-F0-9]{64}$/.test(key),'INVALID_JOURNAL_KEY');
  return Buffer.from(key,'hex');
 }
 private saveJournal(p:Person,day:string,note:string):void {
  bad(typeof note==='string'&&note.length>=1&&note.length<=1000,'INVALID_JOURNAL');
  const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',this.journalKey(),iv);
  const ciphertext=Buffer.concat([cipher.update(note,'utf8'),cipher.final()]).toString('hex');
  const tag=cipher.getAuthTag().toString('hex');
  this.store.run('INSERT INTO journals(player_id,day,ciphertext,iv,tag) VALUES(?,?,?,?,?) ON CONFLICT(player_id,day) DO UPDATE SET ciphertext=excluded.ciphertext,iv=excluded.iv,tag=excluded.tag',p.id,day,ciphertext,iv.toString('hex'),tag);
 }
 private journalFor(p:Person,day:string):string|null {
  const row=this.store.get<{ciphertext:string;iv:string;tag:string}>('SELECT ciphertext,iv,tag FROM journals WHERE player_id=? AND day=?',p.id,day);
  if(!row)return null;
  const decipher=createDecipheriv('aes-256-gcm',this.journalKey(),Buffer.from(row.iv,'hex'));
  decipher.setAuthTag(Buffer.from(row.tag,'hex'));
  return Buffer.concat([decipher.update(Buffer.from(row.ciphertext,'hex')),decipher.final()]).toString('utf8');
 }
 journal(guild:string,user:string,day?:string):unknown{return this.store.tx(()=>{
  const p=this.player(guild,user);const d=day||gameDay(this.now());
  bad(/^\d{4}-\d{2}-\d{2}$/.test(d),'INVALID_DAY');
  return {day:d,note:this.journalFor(p,d)};
 });}
 journalDelete(guild:string,user:string,key:string,day?:string):unknown{return this.op(guild,user,key,'journal-delete',(p)=>{
  const d=day||gameDay(this.now());bad(/^\d{4}-\d{2}-\d{2}$/.test(d),'INVALID_DAY');
  this.store.run('DELETE FROM journals WHERE player_id=? AND day=?',p.id,d);
  return {deleted:true,day:d};
 });}
 exportData(guild:string,user:string):unknown{
  const p=this.player(guild,user);
  const rows=this.store.all<{day:string}>('SELECT day FROM journals WHERE player_id=? ORDER BY day',p.id);
  return {format:'MOHAE-EXPORT-v1',profile:this.profile(guild,user),cards:this.cards(guild,user),discoveries:this.collection(guild,user),
   ledger:this.store.all('SELECT currency,delta,source,at FROM ledger WHERE player_id=? ORDER BY at DESC LIMIT 10000',p.id),
   attendance:this.store.all('SELECT day FROM attendance WHERE player_id=?',p.id),
   dailyQuests:this.store.all('SELECT day,topic FROM daily_quests WHERE player_id=?',p.id),
   journals:rows.map(row=>({day:row.day,note:this.journalFor(p,row.day)})),
   submittedReports:this.store.all('SELECT id,target,reason,details,status,created FROM reports WHERE reporter=? AND guild=? ORDER BY created DESC',user,guild)};
 }
 private weeklyStatus(p:Person,week:string):{completed:string[];stats:Record<string,number>} {
  const start=Date.parse(week+'T00:00:00Z');const end=new Date(start+7*86400_000).toISOString().slice(0,10);
  const dq=this.store.get<{n:number}>('SELECT COUNT(*) n FROM daily_quests WHERE player_id=? AND day>=? AND day<?',p.id,week,end)?.n??0;
  const chat=this.store.get<{n:number}>('SELECT COUNT(*) n FROM chats WHERE player_id=? AND week=? AND accepted=1',p.id,week)?.n??0;
  const voice=this.store.get<{n:number}>('SELECT COALESCE(SUM(seconds),0) n FROM voice_events WHERE player_id=? AND week=?',p.id,week)?.n??0;
  const mini=this.store.get<{n:number}>("SELECT COUNT(*) n FROM mini_sessions WHERE player_id=? AND day>=? AND day<? AND rewarded=1",p.id,week,end)?.n??0;
  const completed=[...(dq>=3?['daily_quest_3']:[]),...(dq>=5?['daily_quest_5']:[]),...(chat>=15?['chat_15']:[]),...(voice>=2700?['voice_45']:[]),...(mini>=8?['minigame_8']:[])];
  return {completed,stats:{dailyQuestDays:dq,recognizedChats:chat,voiceSeconds:voice,rewardedMinigames:mini}};
 }
 weekly(guild:string,user:string):unknown {
  return this.store.tx(()=>{const p=this.player(guild,user),now=this.now(),week=gameWeek(now);
   return {week,...this.weeklyStatus(p,week),claimed:!!this.store.get('SELECT 1 FROM weekly_claims WHERE player_id=? AND week=?',p.id,week)};
  });
 }
 claimWeekly(guild:string,user:string,key:string,week:string):unknown{return this.op(guild,user,key,'weekly',(p,now)=>{
   const current=gameWeek(now),prev=new Date(Date.parse(current+'T00:00:00Z')-7*86400_000).toISOString().slice(0,10);
   bad(week===current||(week===prev&&now<kstMondayFiveMs(current)+7*86400_000),'WEEK_NOT_CLAIMABLE');
   if(this.store.get('SELECT 1 FROM weekly_claims WHERE player_id=? AND week=?',p.id,week))return {claimed:false,week};
   const status=this.weeklyStatus(p,week);bad(status.completed.length>=3,'WEEKLY_NOT_COMPLETE');
   this.store.run('INSERT INTO weekly_claims(player_id,week) VALUES(?,?)',p.id,week);
   this.credit(p.id,'MOHAE',300,'weekly:'+week,now);this.addXp(p,200,300,now);
   return {claimed:true,week,completed:status.completed,mohae:300,xp:200,seasonXp:300};
 });}
 chat(guild:string,user:string,key:string,messageId:string):unknown{return this.op(guild,user,key,'chat',(p,now)=>{
  checkSnowflake(messageId);const day=gameDay(now),week=gameWeek(now);
  if(this.store.get('SELECT 1 FROM chats WHERE message_id=?',messageId))return {accepted:false,duplicate:true};
  const last=this.store.get<{last_at:number;count:number}>('SELECT * FROM chat_state WHERE player_id=? AND day=?',p.id,day);
  const accepted=!last||now-last.last_at>=60_000;
  this.store.run('INSERT INTO chats(message_id,player_id,day,week,at,accepted) VALUES(?,?,?,?,?,?)',messageId,p.id,day,week,now,accepted?1:0);
  if(!accepted)return {accepted:false,credited:0};
  const count=(last?.count??0)+1;
  this.store.run('INSERT INTO chat_state(player_id,day,last_at,count) VALUES(?,?,?,?) ON CONFLICT(player_id,day) DO UPDATE SET last_at=excluded.last_at,count=excluded.count',p.id,day,now,count);
  let credited=0;
  if(count%5===0){const state=this.store.get<{chat_claimed:number;voice_claimed:number}>('SELECT * FROM activity_rewards WHERE player_id=? AND day=?',p.id,day);
   credited=Math.min(5,10-(state?.chat_claimed??0)-(state?.voice_claimed??0));
   if(credited>0){this.store.run('INSERT INTO activity_rewards(player_id,day,chat_claimed) VALUES(?,?,?) ON CONFLICT(player_id,day) DO UPDATE SET chat_claimed=chat_claimed+excluded.chat_claimed',p.id,day,credited);this.credit(p.id,'MOHAE',credited,'chat:'+day+':'+count,now);}
  }
  return {accepted:true,count,credited};
 });}
 voice(guild:string,user:string,key:string,seconds:number):unknown{return this.op(guild,user,key,'voice',(p,now)=>{
  bad(Number.isSafeInteger(seconds)&&seconds>=1&&seconds<=60,'INVALID_VOICE_SEGMENT');
  const day=gameDay(now),week=gameWeek(now);
  const bucket=Math.floor(now/60_000);
  if(this.store.get('SELECT 1 FROM voice_events WHERE player_id=? AND bucket=?',p.id,bucket))return {duplicate:true,credited:0};
  this.store.run('INSERT INTO voice_events(id,player_id,day,week,seconds,bucket) VALUES(?,?,?,?,?,?)',key,p.id,day,week,seconds,bucket);
  const total=this.store.get<{n:number}>('SELECT SUM(seconds) n FROM voice_events WHERE player_id=? AND day=?',p.id,day)?.n??0;
  const state=this.store.get<{chat_claimed:number;voice_claimed:number}>('SELECT * FROM activity_rewards WHERE player_id=? AND day=?',p.id,day);
  let credited=0;
  if(total>=1200&&(state?.voice_claimed??0)===0){credited=Math.min(10,10-(state?.chat_claimed??0));
   if(credited>0){this.store.run('INSERT INTO activity_rewards(player_id,day,voice_claimed) VALUES(?,?,?) ON CONFLICT(player_id,day) DO UPDATE SET voice_claimed=voice_claimed+excluded.voice_claimed',p.id,day,credited);this.credit(p.id,'MOHAE',credited,'voice:'+day,now);}
  }
  return {seconds:total,credited};
 });}
 pityStatus(guild:string,user:string):unknown{return this.store.tx(()=>{
  const p=this.player(guild,user);
  const rows=this.store.all('SELECT pool,three,two,pickup,guaranteed FROM pity WHERE player_id=?',p.id);
  return {pity:rows,hardPity:{two:10,three:60,pickup:70},baseRates:{one:83,two:15,three:2},softPityFrom:41};
 });}
 autoSettings(guild:string,user:string):unknown{return this.store.tx(()=>{
  const p=this.player(guild,user);
  return this.store.get('SELECT one,two FROM auto_settings WHERE player_id=?',p.id)||{one:0,two:0};
 });}
 autoDismantle(guild:string,user:string,key:string,rarity:number,enabled:boolean):unknown{return this.op(guild,user,key,'auto-dismantle',(p)=>{
  bad(rarity===1||rarity===2,'INVALID_AUTO_RARITY');
  bad(typeof enabled==='boolean','INVALID_AUTO_SETTING');
  const column=rarity===1?'one':'two';
  this.store.run('INSERT OR IGNORE INTO auto_settings(player_id) VALUES(?)',p.id);
  this.store.run('UPDATE auto_settings SET '+column+'=? WHERE player_id=?',enabled?1:0,p.id);
  return {rarity,enabled};
 });}
  draw(guild:string,user:string,key:string,bannerId:string,quantity:number):unknown{return this.op(guild,user,key,'draw',(p,now)=>{
  bad(quantity===1||quantity===10,'INVALID_DRAW_COUNT');
  bad(bannerId==='standard'||bannerId==='limited','INVALID_BANNER');
  if(bannerId==='limited')bad(!!this.season(guild,now),'BANNER_INACTIVE');
  const tickets=Math.min(quantity,this.balance(p.id,'TICKET')),cost=(quantity-tickets)*150;
  bad(this.balance(p.id,'MOHAE')>=cost,'INSUFFICIENT_MOHAE');
  if(tickets)this.credit(p.id,'TICKET',-tickets,'draw:'+key,now);
  if(cost)this.credit(p.id,'MOHAE',-cost,'draw:'+key,now);
  const row=this.store.get<{three:number;two:number;pickup:number;guaranteed:number}>('SELECT * FROM pity WHERE player_id=? AND pool=?',p.id,bannerId);
  let pity:Pity=row?{three:row.three,two:row.two,pickup:row.pickup,guaranteed:!!row.guaranteed}:{three:0,two:0,pickup:0,guaranteed:false};
  const results=[];const auto=this.store.get<{one:number;two:number}>('SELECT one,two FROM auto_settings WHERE player_id=?',p.id);
  for(let n=0;n<quantity;n++){
   const r=drawOne(bannerId,pity);pity=r.next;
   const owned=this.store.get<{n:number}>('SELECT COUNT(*) n FROM cards WHERE player_id=? AND character=?',p.id,r.characterId)?.n??0;
   const dismantled=owned>=1&&r.rarity<3&&((r.rarity===1&&auto?.one===1)||(r.rarity===2&&auto?.two===1));
   let cardId:string|null=null,shards=0;
   if(dismantled){shards=r.rarity===2?5:1;this.credit(p.id,'SHARD',shards,'auto:'+key+':'+n,now);}
   else cardId=this.giveCard(p,r.characterId,'draw:'+key,now);
   results.push({cardId,character:r.characterId,rarity:r.rarity,reason:r.reason,dismantled,shards});
  }
  this.store.run('INSERT INTO pity(player_id,pool,three,two,pickup,guaranteed) VALUES(?,?,?,?,?,?) ON CONFLICT(player_id,pool) DO UPDATE SET three=excluded.three,two=excluded.two,pickup=excluded.pickup,guaranteed=excluded.guaranteed',p.id,bannerId,pity.three,pity.two,pity.pickup,pity.guaranteed?1:0);
  this.store.run('INSERT INTO draws(id,player_id,banner,quantity,results,at) VALUES(?,?,?,?,?,?)',key,p.id,bannerId,quantity,JSON.stringify(results),now);
  return {banner:bannerId,cost,tickets,results,pity};
 });}
 drawHistory(guild:string,user:string):unknown{return this.store.tx(()=>{const p=this.player(guild,user);
  return this.store.all('SELECT id,banner,quantity,results,at FROM draws WHERE player_id=? ORDER BY at DESC LIMIT 20',p.id).map((r:any)=>({...r,results:JSON.parse(r.results)}));});}
 cards(guild:string,user:string):unknown{return this.store.tx(()=>{const p=this.player(guild,user);
  return this.store.all('SELECT id,character,rarity,locked,acquired FROM cards WHERE player_id=? ORDER BY acquired DESC LIMIT 100',p.id);});}
 collection(guild:string,user:string):unknown{return this.store.tx(()=>{const p=this.player(guild,user);
 return this.store.all('SELECT d.character,d.at,COUNT(c.id) owned FROM discoveries d LEFT JOIN cards c ON c.player_id=d.player_id AND c.character=d.character WHERE d.player_id=? GROUP BY d.character ORDER BY d.character',p.id);});}
 lockCard(guild:string,user:string,key:string,cardId:string,locked:boolean):unknown{return this.op(guild,user,key,'lock-card',(p)=>{
  const c=this.store.get('SELECT id FROM cards WHERE id=? AND player_id=?',cardId,p.id);bad(c,'CARD_NOT_FOUND');
  this.store.run('UPDATE cards SET locked=? WHERE id=?',locked?1:0,cardId);return {cardId,locked};
 });}
 dismantle(guild:string,user:string,key:string,cardId:string,confirm:boolean):unknown{return this.op(guild,user,key,'dismantle',(p,now)=>{
  bad(confirm,'CONFIRM_REQUIRED');
  const c=this.store.get<{character:string;rarity:number;locked:number}>('SELECT character,rarity,locked FROM cards WHERE id=? AND player_id=?',cardId,p.id);
  bad(c,'CARD_NOT_FOUND');bad(!c.locked,'CARD_LOCKED');
  const owned=this.store.get<{n:number}>('SELECT COUNT(*) n FROM cards WHERE player_id=? AND character=?',p.id,c.character)?.n??0;
  bad(owned>1,'LAST_COPY_PROTECTED');
  const amount=c.rarity===3?40:c.rarity===2?5:1;
  this.store.run('DELETE FROM cards WHERE id=?',cardId);this.credit(p.id,'SHARD',amount,'dismantle:'+cardId,now);
  return {cardId,shards:amount};
 });}
 representative(guild:string,user:string,key:string,character:string):unknown{return this.op(guild,user,key,'representative',(p)=>{
  bad(!!this.store.get('SELECT 1 FROM cards WHERE player_id=? AND character=?',p.id,character),'NOT_OWNED');
  this.store.run('UPDATE players SET representative=? WHERE id=?',character,p.id);return {character};
 });}
 affinity(guild:string,user:string,key:string,kind:'talk'|'gift'):unknown{return this.op(guild,user,key,'affinity',(p,now)=>{
  bad(kind==='talk'||kind==='gift','INVALID_AFFINITY_KIND');
  const c=this.store.get<Person>('SELECT representative FROM players WHERE id=?',p.id);
  bad(c?.representative,'NO_REPRESENTATIVE');
  bad(!!this.store.get('SELECT 1 FROM cards WHERE player_id=? AND character=?',p.id,c.representative),'NOT_OWNED');
  const day=gameDay(now);
  if(this.store.get('SELECT 1 FROM affinity_claims WHERE player_id=? AND day=? AND kind=?',p.id,day,kind))return {claimed:false,kind};
  this.store.run('INSERT INTO affinity_claims(player_id,day,kind) VALUES(?,?,?)',p.id,day,kind);
  this.store.run('INSERT INTO affinity(player_id,character,points) VALUES(?,?,10) ON CONFLICT(player_id,character) DO UPDATE SET points=points+10',p.id,c.representative);
  const pts=this.store.get<{points:number}>('SELECT points FROM affinity WHERE player_id=? AND character=?',p.id,c.representative)?.points??10;
  return {claimed:true,character:c.representative,kind,points:pts};
 });}
 private challenge(game:string):{question:string;answer:string;choices:string[]} {
  switch(game){
   case 'deduction':return {question:'단서: 2, 4, 다음 수는?',answer:'6',choices:['5','6','7']};
   case 'memory':return {question:'카드 4쌍의 글자 순서 A B C D 를 기억하고 입력하세요.',answer:'ABCD',choices:['ABCD','DCBA','BACD']};
   case 'treasure':return {question:'보물이 숨은 장소를 골라 주세요.',answer:'B',choices:['A','B','C']};
   case 'quiz':return {question:'2 + 3 = ?',answer:'5',choices:['4','5','6']};
   case 'dice':return {question:'주사위 결과를 확인하려면 굴리기를 선택하세요.',answer:'roll',choices:['roll']};
   default:throw new GameError('INVALID_MINIGAME');
  }
 }
 miniStart(guild:string,user:string,key:string,game:string):unknown{return this.op(guild,user,key,'mini-start',(p,now)=>{
  bad((miniGames as readonly string[]).includes(game),'INVALID_MINIGAME');
  const open=this.store.get<{n:number}>('SELECT COUNT(*) n FROM mini_sessions WHERE player_id=? AND finished=0 AND expires>?',p.id,now)?.n??0;
  bad(open<3,'TOO_MANY_OPEN_GAMES');
  const id=randomUUID(),c=this.challenge(game);
  this.store.run('INSERT INTO mini_sessions(id,player_id,game,day,created,expires,answer) VALUES(?,?,?,?,?,?,?)',id,p.id,game,gameDay(now),now,now+600_000,c.answer);
  return {id,game,question:c.question,choices:c.choices,expires:now+600_000};
 });}
 miniFinish(guild:string,user:string,key:string,id:string,answer:string):unknown{return this.op(guild,user,key,'mini-finish',(p,now)=>{
  const s=this.store.get<{game:string;day:string;created:number;expires:number;answer:string;finished:number}>('SELECT * FROM mini_sessions WHERE id=? AND player_id=?',id,p.id);
  bad(s,'MINIGAME_NOT_FOUND');bad(!s.finished,'MINIGAME_ALREADY_FINISHED');bad(s.expires>now,'MINIGAME_EXPIRED');bad(now-s.created>=2_000,'MINIGAME_TOO_FAST');
  bad(typeof answer==='string'&&answer.length<=24,'INVALID_ANSWER');
  const allowed=this.challenge(s.game).choices;
  bad(allowed.includes(answer),'INVALID_ANSWER');
  const correct=answer===s.answer,day=gameDay(now);
  const rewarded=this.store.get<{n:number}>('SELECT COUNT(*) n FROM mini_sessions WHERE player_id=? AND day=? AND rewarded=1',p.id,day)?.n??0;
  const eligible=s.day===day&&rewarded<4;
  this.store.run('UPDATE mini_sessions SET finished=1,rewarded=? WHERE id=?',eligible?1:0,id);
  if(eligible){this.credit(p.id,'MOHAE',10,'mini:'+id,now);this.addXp(p,10,0,now);}
  return {correct,rewarded:eligible,mohae:eligible?10:0,xp:eligible?10:0};
 });}
 buy(guild:string,user:string,key:string,sku:string):unknown{return this.op(guild,user,key,'buy',(p,now)=>{
  const c=cosmeticMap.get(sku);bad(c&&c.price>0,'NOT_FOR_SALE');
  bad(!this.store.get('SELECT 1 FROM cosmetics WHERE player_id=? AND sku=?',p.id,sku),'ALREADY_OWNED');
  this.credit(p.id,c.currency,-c.price,'shop:'+key,now);
  this.store.run('INSERT INTO cosmetics(player_id,sku,created) VALUES(?,?,?)',p.id,sku,now);
  return {sku,price:c.price,currency:c.currency};
 });}
 equip(guild:string,user:string,key:string,sku:string):unknown{return this.op(guild,user,key,'equip',(p)=>{
  const c=cosmeticMap.get(sku);bad(c,'UNKNOWN_COSMETIC');
  bad(!!this.store.get('SELECT 1 FROM cosmetics WHERE player_id=? AND sku=?',p.id,sku),'NOT_OWNED');
  this.store.run('INSERT INTO equipped(player_id,slot,sku) VALUES(?,?,?) ON CONFLICT(player_id,slot) DO UPDATE SET sku=excluded.sku',p.id,c.kind,sku);
  return {slot:c.kind,sku};
 });}
 activateSeason(guild:string,seasonId:string,start:number):unknown {
  checkSnowflake(guild);bad(/^dummy_season_\d+$/.test(seasonId),'INVALID_SEASON');
  bad(Number.isSafeInteger(start)&&start>0,'INVALID_START');
  // At the requested Monday 05:00 KST exactly; never auto-publish.
  const d=gameDay(start);bad(kstMondayFiveMs(d)===start&&new Date(d+'T00:00:00Z').getUTCDay()===1,'SEASON_MUST_START_MONDAY_05');
  return this.store.tx(()=>{
   const current=this.store.get('SELECT 1 FROM season WHERE guild_id=? AND NOT (end_at<=? OR start_at>=?)',guild,start,start+56*86400_000);
   bad(!current,'SEASON_OVERLAP');
   const instanceId=seasonId+'_'+start;
   this.store.run('INSERT INTO season(guild_id,id,start_at,end_at,enabled) VALUES(?,?,?,?,1)',guild,instanceId,start,start+56*86400_000);
   return {seasonId:instanceId,start,end:start+56*86400_000};
  });
 }
 seasonStatus(guild:string,user:string):unknown{return this.store.tx(()=>{
  const p=this.player(guild,user),s=this.season(guild,this.now());
  if(!s)return {active:false};
  const xp=this.store.get<{xp:number}>('SELECT xp FROM season_progress WHERE player_id=? AND season=?',p.id,s.id)?.xp??0;
  const claims=this.store.all<{tier:number}>('SELECT tier FROM season_claims WHERE player_id=? AND season=?',p.id,s.id).map(x=>x.tier);
  return {active:true,id:s.id,xp,tier:seasonTier(xp),claims,start:s.start_at,end:s.end_at};
 });}
 private grantPass(p:Person,seasonId:string,tier:number,now:number):boolean {
  if(this.store.get('SELECT 1 FROM season_claims WHERE player_id=? AND season=? AND tier=?',p.id,seasonId,tier))return false;
  this.store.run('INSERT INTO season_claims(player_id,season,tier) VALUES(?,?,?)',p.id,seasonId,tier);
  const grant=seasonRewards[tier-1];
  if(grant.currency&&grant.amount)this.credit(p.id,grant.currency,grant.amount,'season:'+seasonId+':'+tier,now);
  if(grant.cosmetic)this.store.run('INSERT OR IGNORE INTO cosmetics(player_id,sku,created) VALUES(?,?,?)',p.id,grant.cosmetic,now);
  if(tier===20)this.giveCard(p,'person27','season:'+seasonId,now);
  return true;
 }
 /** At expiration, automatically and atomically grant every unlocked unclaimed tier. */
 settleExpired():{seasons:number;claims:number}{
  return this.store.tx(()=>{
   const now=this.now(),expired=this.store.all<{guild_id:string;id:string}>('SELECT guild_id,id FROM season WHERE end_at<=? AND settled=0',now);
   let claims=0;
   for(const s of expired){
    const eligible=this.store.all<{id:string;guild_id:string;user_id:string;xp:number;representative:string|null;deleted:number;season_xp:number}>(
      'SELECT p.*,sp.xp AS season_xp FROM season_progress sp JOIN players p ON sp.player_id=p.id WHERE p.guild_id=? AND p.deleted=0 AND sp.season=?',s.guild_id,s.id);
    for(const player of eligible)for(let tier=1;tier<=seasonTier(player.season_xp);tier++)if(this.grantPass(player,s.id,tier,now))claims++;
    this.store.run('UPDATE season SET settled=1 WHERE guild_id=? AND id=?',s.guild_id,s.id);
   }
   return {seasons:expired.length,claims};
  });
 }
 claimSeason(guild:string,user:string,key:string,tier:number):unknown{return this.op(guild,user,key,'season-claim',(p,now)=>{
  const s=this.season(guild,now);bad(s,'NO_ACTIVE_SEASON');
  bad(Number.isSafeInteger(tier)&&tier>=1&&tier<=20,'INVALID_TIER');
  const xp=this.store.get<{xp:number}>('SELECT xp FROM season_progress WHERE player_id=? AND season=?',p.id,s.id)?.xp??0;
  bad(seasonTier(xp)>=tier,'TIER_LOCKED');
  const claimed=this.grantPass(p,s.id,tier,now);
  return {claimed,tier,grant:claimed?seasonRewards[tier-1]:null,seasonCharacter:claimed&&tier===20?'person27':null};
 });}
 coopStatus(guild:string,user:string):unknown{return this.store.tx(()=>{
  const p=this.player(guild,user),s=this.season(guild,this.now());
  if(!s)return {active:false};
  const settings=this.store.get<{target:number}>('SELECT target FROM coop_settings WHERE guild=? AND season=?',guild,s.id);
  if(!settings)return {active:false};
  const total=this.store.get<{n:number}>('SELECT COALESCE(SUM(c.amount),0) n FROM coop_contributions c JOIN players p ON c.player_id=p.id WHERE p.guild_id=? AND c.season=?',guild,s.id)?.n??0;
  const contributed=this.store.get<{n:number}>('SELECT COALESCE(SUM(amount),0) n FROM coop_contributions WHERE player_id=? AND season=?',p.id,s.id)?.n??0;
  const dayAmount=this.store.get<{amount:number}>('SELECT amount FROM coop_contributions WHERE player_id=? AND season=? AND day=?',p.id,s.id,gameDay(this.now()))?.amount??0;
  const claimed=!!this.store.get('SELECT 1 FROM coop_claims WHERE player_id=? AND season=?',p.id,s.id);
  return {active:true,target:settings.target,total,contributed,dayAmount,claimed};
 });}
 enableCoop(guild:string,target:number):unknown{
  checkSnowflake(guild);bad(Number.isSafeInteger(target)&&target>=5&&target<=10000,'INVALID_COOP_TARGET');
  return this.store.tx(()=>{
   const s=this.season(guild,this.now());bad(s,'NO_ACTIVE_SEASON');
   bad(!this.store.get('SELECT 1 FROM coop_settings WHERE guild=? AND season=?',guild,s.id),'COOP_ALREADY_ENABLED');
   this.store.run('INSERT INTO coop_settings(guild,season,target) VALUES(?,?,?)',guild,s.id,target);
   return {enabled:true,target};
  });
 }
 contributeCoop(guild:string,user:string,key:string):unknown{return this.op(guild,user,key,'coop-contribute',(p,now)=>{
  const s=this.season(guild,now);bad(s,'NO_ACTIVE_SEASON');
  const settings=this.store.get<{target:number}>('SELECT target FROM coop_settings WHERE guild=? AND season=?',guild,s.id);bad(settings,'COOP_NOT_ENABLED');
  const total=this.store.get<{n:number}>('SELECT COALESCE(SUM(c.amount),0) n FROM coop_contributions c JOIN players p ON c.player_id=p.id WHERE p.guild_id=? AND c.season=?',guild,s.id)?.n??0;
  bad(total<settings.target,'COOP_ALREADY_COMPLETE');
  const day=gameDay(now),current=this.store.get<{amount:number}>('SELECT amount FROM coop_contributions WHERE player_id=? AND season=? AND day=?',p.id,s.id,day)?.amount??0;
  bad(current<3,'COOP_DAILY_LIMIT');
  this.store.run('INSERT INTO coop_contributions(player_id,season,day,amount) VALUES(?,?,?,1) ON CONFLICT(player_id,season,day) DO UPDATE SET amount=amount+1',p.id,s.id,day);
  return {contributed:true,dayAmount:current+1,total:total+1,target:settings.target};
 });}
 claimCoop(guild:string,user:string,key:string):unknown{return this.op(guild,user,key,'coop-claim',(p,now)=>{
  const s=this.season(guild,now);bad(s,'NO_ACTIVE_SEASON');
  const settings=this.store.get<{target:number}>('SELECT target FROM coop_settings WHERE guild=? AND season=?',guild,s.id);bad(settings,'COOP_NOT_ENABLED');
  const total=this.store.get<{n:number}>('SELECT COALESCE(SUM(c.amount),0) n FROM coop_contributions c JOIN players p ON c.player_id=p.id WHERE p.guild_id=? AND c.season=?',guild,s.id)?.n??0;
  bad(total>=settings.target,'COOP_NOT_COMPLETE');
  bad(!!this.store.get('SELECT 1 FROM coop_contributions WHERE player_id=? AND season=?',p.id,s.id),'COOP_NOT_PARTICIPANT');
  if(this.store.get('SELECT 1 FROM coop_claims WHERE player_id=? AND season=?',p.id,s.id))return {claimed:false};
  this.store.run('INSERT INTO coop_claims(player_id,season) VALUES(?,?)',p.id,s.id);
  this.store.run('INSERT OR IGNORE INTO cosmetics(player_id,sku,created) VALUES(?,?,?)',p.id,'dummy_coop_badge',now);
  return {claimed:true,cosmetic:'dummy_coop_badge'};
 });}
  eventStatus(guild:string,user:string):unknown{return this.store.tx(()=>{
  const p=this.player(guild,user),s=this.season(guild,this.now());
  if(!s)return {active:false,events:[]};
  const events=seasonalEvents.map(e=>{
   const week=new Date(s.start_at+7*(e.week-1)*86400_000+4*3600_000).toISOString().slice(0,10);
   const stat=this.weeklyStatus(p,week);
   const progress=e.kind==='mini'?stat.stats.rewardedMinigames:e.kind==='daily'?stat.stats.dailyQuestDays:
    this.store.get<{n:number}>('SELECT COUNT(*) n FROM weekly_claims WHERE player_id=? AND week=?',p.id,week)?.n??0;
   return {id:e.id,week:e.week,enabled:!!this.store.get('SELECT 1 FROM event_flags WHERE guild=? AND season=? AND event_id=? AND enabled=1',guild,s.id,e.id),
    claimed:!!this.store.get('SELECT 1 FROM event_claims WHERE player_id=? AND season=? AND event_id=?',p.id,s.id,e.id),
    progress,goal:e.goal,reward:e.reward};
  });
  return {active:true,season:s.id,events};
 });}
 enableEvent(guild:string,eventId:string):unknown{
  checkSnowflake(guild);bad(seasonalEvents.some(e=>e.id===eventId),'UNKNOWN_EVENT');
  return this.store.tx(()=>{
   const s=this.season(guild,this.now());bad(s,'NO_ACTIVE_SEASON');
   this.store.run('INSERT INTO event_flags(guild,season,event_id,enabled) VALUES(?,?,?,1) ON CONFLICT(guild,season,event_id) DO UPDATE SET enabled=1',guild,s.id,eventId);
   return {eventId,enabled:true};
  });
 }
 claimEvent(guild:string,user:string,key:string,eventId:string):unknown{return this.op(guild,user,key,'event-claim',(p,now)=>{
  const event=seasonalEvents.find(e=>e.id===eventId);bad(event,'UNKNOWN_EVENT');
  const s=this.season(guild,now);bad(s,'NO_ACTIVE_SEASON');
  bad(!!this.store.get('SELECT 1 FROM event_flags WHERE guild=? AND season=? AND event_id=? AND enabled=1',guild,s.id,eventId),'EVENT_NOT_ENABLED');
  const start=s.start_at+7*(event.week-1)*86400_000;bad(now>=start,'EVENT_NOT_STARTED');
  if(this.store.get('SELECT 1 FROM event_claims WHERE player_id=? AND season=? AND event_id=?',p.id,s.id,eventId))return {claimed:false,eventId};
  const week=new Date(start+4*3600_000).toISOString().slice(0,10);
  const progress=event.kind==='mini'?this.weeklyStatus(p,week).stats.rewardedMinigames:event.kind==='daily'?this.weeklyStatus(p,week).stats.dailyQuestDays:
    this.store.get<{n:number}>('SELECT COUNT(*) n FROM weekly_claims WHERE player_id=? AND week=?',p.id,week)?.n??0;
  bad(progress>=event.goal,'EVENT_NOT_COMPLETE');
  this.store.run('INSERT INTO event_claims(player_id,season,event_id) VALUES(?,?,?)',p.id,s.id,eventId);
  this.credit(p.id,'MOHAE',event.reward,'event:'+s.id+':'+eventId,now);
  return {claimed:true,eventId,mohae:event.reward};
 });}
  report(guild:string,user:string,key:string,target:string|null,reason:string,details:string):unknown{return this.op(guild,user,key,'report',(p,now)=>{
  bad(['harassment','spam','fraud','other'].includes(reason),'INVALID_REASON');
  bad(typeof details==='string'&&details.trim().length>=5&&details.length<=1500,'INVALID_DETAILS');
  if(target)checkSnowflake(target);
  const recent=this.store.get<{n:number}>('SELECT COUNT(*) n FROM reports WHERE reporter=? AND guild=? AND created>?',user,guild,now-300000)?.n??0;
  bad(recent<3,'REPORT_RATE_LIMIT');
  const id=randomUUID();this.store.run('INSERT INTO reports(id,guild,reporter,target,reason,details,created) VALUES(?,?,?,?,?,?,?)',id,guild,user,target,reason,details.trim(),now);
  return {reportId:id,status:'open'};
 });}
 reportStatus(guild:string,user:string,reportId:string):unknown{return this.store.tx(()=>{
  checkSnowflake(guild);checkSnowflake(user);
  const row=this.store.get<{id:string;reason:string;status:string;created:number}>('SELECT id,reason,status,created FROM reports WHERE id=? AND guild=? AND reporter=?',reportId,guild,user);
  bad(row,'REPORT_NOT_FOUND');
  return row;
 });}
 moderationList(guild:string):unknown{return this.store.tx(()=>{
  checkSnowflake(guild);
  return this.store.all('SELECT id,reporter,target,reason,details,status,created FROM reports WHERE guild=? ORDER BY created DESC LIMIT 30',guild);
 });}
 moderationUpdate(guild:string,actor:string,key:string,reportId:string,status:string):unknown{return this.op(guild,actor,key,'report-update',(_,now)=>{
  bad(['open','resolved','dismissed'].includes(status),'INVALID_REPORT_STATUS');
  const found=this.store.get('SELECT 1 FROM reports WHERE guild=? AND id=?',guild,reportId);bad(found,'REPORT_NOT_FOUND');
  this.store.run('UPDATE reports SET status=? WHERE guild=? AND id=?',status,guild,reportId);
  this.store.run('INSERT INTO audit(id,actor,action,details,at) VALUES(?,?,?,?,?)',randomUUID(),actor,'report-status',JSON.stringify({reportId,status}),now);
  return {reportId,status};
 });}
  privacyDelete(guild:string,user:string,key:string):unknown{return this.op(guild,user,key,'privacy-delete',(p,now)=>{
  this.store.run('DELETE FROM journals WHERE player_id=?',p.id);
  this.store.run('DELETE FROM profile_visibility WHERE player_id=?',p.id);
  this.store.run('UPDATE players SET user_id=?,deleted=1,representative=NULL WHERE id=?','deleted:'+randomUUID(),p.id);
  this.store.run('UPDATE reports SET reporter=? WHERE reporter=? AND guild=?','deleted',user,guild);
  this.store.run('UPDATE reports SET target=NULL WHERE target=? AND guild=?',user,guild);
  this.store.run('INSERT INTO audit(id,actor,action,details,at) VALUES(?,?,?,?,?)',randomUUID(),'system','account-anonymized',p.id,now);
  return {deleted:true};
 });}
}
