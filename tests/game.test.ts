import {describe,test,expect} from 'bun:test';
import {Store} from '../src/store.ts';
import {Game,GameError} from '../src/game.ts';
import {gameDay,gameWeek,currentLevel,seasonTier,kstMondayFiveMs} from '../src/time.ts';
import {drawOne,p3Percent,type Pity} from '../src/gacha.ts';
import {characters,seasonRewards} from '../src/catalog.ts';
const G='123456789012345678',U='234567890123456789',V='345678901234567890';
const monday=Date.parse('2026-11-23T00:00:00Z');
function setup(at=Date.parse('2026-11-23T06:00:00Z')){
 let now=at;const store=new Store(':memory:');const game=new Game(store,()=>now);
 return {game,store,advance:(ms:number)=>{now+=ms},at:()=>now};
}
describe('Rules and time',()=>{
 test('KST 05:00 boundary including Monday week reset',()=>{
  const before=Date.parse('2026-11-22T19:59:59Z'),after=Date.parse('2026-11-22T20:00:00Z');
  expect(gameDay(before)).toBe('2026-11-22');expect(gameDay(after)).toBe('2026-11-23');
  expect(gameWeek(before)).toBe('2026-11-16');expect(gameWeek(after)).toBe('2026-11-23');
  expect(kstMondayFiveMs('2026-11-23')).toBe(after);
 });
 test('Permanent XP and pass tiers',()=>{
  expect(currentLevel(0)).toBe(1);expect(currentLevel(100)).toBe(2);
  expect(seasonTier(4999)).toBe(19);expect(seasonTier(5000)).toBe(20);
 });
 test('Dummy pack is complete without any narrative content',()=>{
  expect(characters.length).toBe(27);
  for(let i=1;i<=27;i++)expect(characters.some(x=>x.id==='person'+i)).toBe(true);
  expect(seasonRewards.length).toBe(20);
 });
});
describe('Gacha boundary semantics',()=>{
 const zero:Pity={two:0,three:0,pickup:0,guaranteed:false};
 test('Base 3-star 2%, 41st 5%, 59th 59%, 60th forced',()=>{
  expect([p3Percent(1),p3Percent(40),p3Percent(41),p3Percent(59),p3Percent(60)]).toEqual([2,2,5,59,100]);
  const r=drawOne('standard',{...zero,three:59},()=>999999);
  expect(r.rarity).toBe(3);expect(r.next.three).toBe(0);
 });
 test('2+ guaranteed on 10th unsuccessful pull',()=>{
  const r=drawOne('standard',{...zero,two:9},()=>999999);
  expect(r.rarity).toBe(2);expect(r.next.two).toBe(0);
 });
 test('70th limited pull overrides the 3-star calculation',()=>{
  const r=drawOne('limited',{...zero,pickup:69},()=>999999);
  expect(r.rarity).toBe(3);expect(r.characterId).toBe('person26');expect(r.next.pickup).toBe(0);
 });
 test('Lost 50/50 guarantees next 3-star and persists over failed rarity rolls',()=>{
  const loss=drawOne('limited',{...zero,three:59},()=>1);
  expect(loss.rarity).toBe(3);expect(loss.characterId).not.toBe('person26');
  expect(loss.next.guaranteed).toBe(true);
  const next=drawOne('limited',{...loss.next,three:59},()=>999999);
  expect(next.characterId).toBe('person26');
  expect(next.next.guaranteed).toBe(false);
 });
});
describe('Transactional gameplay',()=>{
 test('Attendance and daily rewards only once even with new interaction IDs',()=>{
  const {game,store}=setup();
  const a=game.attendance(G,U,'attendance123') as any;
  expect(a.claimed).toBe(true);
  expect(game.attendance(G,U,'attendance123')).toEqual(a);
  expect((game.attendance(G,U,'attendance124') as any).claimed).toBe(false);
  game.daily(G,U,'daily123','rest');game.daily(G,U,'daily124','rest');
  expect((game.profile(G,U) as any).balances.MOHAE).toBe(100);
  expect(store.get<{n:number}>('SELECT COUNT(*) n FROM ledger')?.n).toBe(2);
  store.close();
 });
 test('Daily 150 MOHAE funds one draw and never double-debits on retry',()=>{
  const {game,advance,store}=setup();
  game.attendance(G,U,'attendance1');game.daily(G,U,'daily1','praise');
  for(let i=0;i<4;i++){
   const s=game.miniStart(G,U,'mini-start'+i,'dice') as any;
   advance(2000);
   expect((game.miniFinish(G,U,'mini-finish'+i,s.id,'roll') as any).rewarded).toBe(true);
  }
  for(let i=0;i<10;i++){advance(60000);game.chat(G,U,'chat'+i,String(900000000000000000n+BigInt(i)));}
  expect((game.profile(G,U) as any).balances.MOHAE).toBe(150);
  const r=game.draw(G,U,'draw1','standard',1) as any;
  expect(r.results).toHaveLength(1);
  expect(game.draw(G,U,'draw1','standard',1)).toEqual(r);
  expect((game.profile(G,U) as any).balances.MOHAE).toBe(0);
  expect((game.cards(G,U) as any[]).length).toBe(1);
  expect(store.get<{n:number}>('SELECT COUNT(*) n FROM draws')?.n).toBe(1);
  store.close();
 });
 test('Insufficient funds causes atomic rollback of wallet, cards and pity',()=>{
  const {game,store}=setup();
  expect(()=>game.draw(G,U,'draw-without-funds','standard',10)).toThrow('INSUFFICIENT_MOHAE');
  expect(store.get<{n:number}>('SELECT COUNT(*) n FROM draws')?.n).toBe(0);
  expect(store.get<{n:number}>('SELECT COUNT(*) n FROM operations')?.n).toBe(0);
  store.close();
 });
 test('Chat dedup and 60-second spacing protect activity budget',()=>{
  const {game,advance}=setup();
  const id='111111111111111111';
  expect((game.chat(G,U,'chat1',id) as any).accepted).toBe(true);
  expect((game.chat(G,U,'chat2',id) as any).duplicate).toBe(true);
  expect((game.chat(G,U,'chat3','111111111111111112') as any).accepted).toBe(false);
  advance(60000);
  expect((game.chat(G,U,'chat4','111111111111111113') as any).accepted).toBe(true);
 });
 test('Season is manually activated and limited banner is unavailable before activation',()=>{
  const {game}=setup();
  expect(()=>game.draw(G,U,'limited1','limited',1)).toThrow('BANNER_INACTIVE');
  const start=kstMondayFiveMs('2026-11-23');
  const result=game.activateSeason(G,'dummy_season_01',start) as any;
  expect(result.seasonId.startsWith('dummy_season_01_')).toBe(true);
  expect((game.seasonStatus(G,U) as any).active).toBe(true);
 });
 test('Unowned or last-copy cards cannot be dismantled',()=>{
  const {game}=setup();
  expect(()=>game.dismantle(G,U,'dismantle1','random-id',true)).toThrow('CARD_NOT_FOUND');
 });
 test('Guilds are isolated even for the same Discord user',()=>{
  const {game}=setup();
  game.attendance(G,U,'att001');
  expect((game.profile(G,V) as any).balances.MOHAE).toBe(0);
  expect((game.profile('456789012345678901',U) as any).balances.MOHAE).toBe(0);
 });
});

describe('Extended gameplay and privacy',()=>{
 test('Opt-in diary is encrypted at rest, exportable only through player identity, and deletable',()=>{
  process.env.JOURNAL_KEY='ab'.repeat(32);
  const {game,store}=setup();
  const response=game.daily(G,U,'daily-note-1','good_day','private personal note',true) as any;
  expect(response.journalSaved).toBe(true);
  const raw=store.get<{ciphertext:string}>('SELECT ciphertext FROM journals')!;
  expect(raw.ciphertext).not.toContain('private personal note');
  expect((game.journal(G,U) as any).note).toBe('private personal note');
  expect((game.exportData(G,U) as any).journals[0].note).toBe('private personal note');
  expect((game.journal(G,V) as any).note).toBe(null);
  game.journalDelete(G,U,'journal-delete-1');
  expect((game.journal(G,U) as any).note).toBe(null);
  delete process.env.JOURNAL_KEY;store.close();
 });
 test('Diary text is not retained without explicit consent',()=>{
  const {game,store}=setup();
  game.daily(G,U,'daily-private-1','rest','should be discarded',false);
  expect(store.get<{n:number}>('SELECT COUNT(*) n FROM journals')?.n).toBe(0);
  store.close();
 });
 test('Post-season auto-settlement grants all unlocked tiers once; a new season can start',()=>{
  const {game,store,advance}=setup();
  const start=kstMondayFiveMs('2026-11-23');
  const first=game.activateSeason(G,'dummy_season_01',start) as any;
  game.profile(G,U);
  const player=store.get<{id:string}>('SELECT id FROM players WHERE user_id=?',U)!.id;
  store.run('INSERT INTO season_progress(player_id,season,xp) VALUES(?,?,5000)',player,first.seasonId);
  advance(56*86400_000);
  const end=game.settleExpired();
  expect(end.seasons).toBe(1);expect(end.claims).toBe(20);
  expect(game.settleExpired().claims).toBe(0);
  const profile=game.profile(G,U) as any;
  expect(profile.balances.TICKET).toBe(10);
  expect(profile.balances.SHARD).toBe(100);
  expect((game.collection(G,U) as any[]).some(x=>x.character==='person27')).toBe(true);
  const next=game.activateSeason(G,'dummy_season_01',start+56*86400_000) as any;
  expect(next.seasonId).not.toBe(first.seasonId);
  store.close();
 });
 test('Server cooperative goal enforces 3-per-day and grants only contributing users',()=>{
  const {game,advance}=setup();
  game.activateSeason(G,'dummy_season_01',kstMondayFiveMs('2026-11-23'));
  game.enableCoop(G,5);
  for(let i=0;i<3;i++)game.contributeCoop(G,U,'coop-a-'+i);
  expect(()=>game.contributeCoop(G,U,'coop-a-4')).toThrow('COOP_DAILY_LIMIT');
  expect(()=>game.claimCoop(G,U,'coop-claim-early')).toThrow('COOP_NOT_COMPLETE');
  for(let i=0;i<2;i++)game.contributeCoop(G,V,'coop-b-'+i);
  expect((game.coopStatus(G,U) as any).total).toBe(5);
  expect((game.claimCoop(G,U,'coop-claim-a') as any).claimed).toBe(true);
  expect((game.claimCoop(G,V,'coop-claim-b') as any).claimed).toBe(true);
  expect((game.claimCoop(G,V,'coop-claim-c') as any).claimed).toBe(false);
 });
 test('Week-4 opt-in dummy event pays once when 5 daily quests are completed',()=>{
  const {game,advance}=setup();
  game.activateSeason(G,'dummy_season_01',kstMondayFiveMs('2026-11-23'));
  advance(21*86400_000);
  game.enableEvent(G,'dummy_event_04');
  for(let i=0;i<5;i++){game.daily(G,U,'event-daily-'+i,'rest');advance(86400_000);}
  const status=game.eventStatus(G,U) as any;
  expect(status.events.find((e:any)=>e.id==='dummy_event_04').progress).toBe(5);
  expect((game.claimEvent(G,U,'event-claim-1','dummy_event_04') as any).mohae).toBe(200);
  expect((game.claimEvent(G,U,'event-claim-2','dummy_event_04') as any).claimed).toBe(false);
 });
 test('20 eligible voice minutes pays at most the shared daily 10 MOHAE',()=>{
  const {game,advance}=setup();
  for(let i=0;i<5;i++){game.chat(G,U,'voice-chat-'+i,String(800000000000000000n+BigInt(i)));advance(60000);}
  expect((game.profile(G,U) as any).balances.MOHAE).toBe(5);
  for(let i=0;i<20;i++){game.voice(G,U,'voice-piece-'+i,60);advance(60000);}
  expect((game.profile(G,U) as any).balances.MOHAE).toBe(10);
 });
 test('10-pull is one economic operation that generates exactly ten distinct card instances',()=>{
  const {game,store}=setup();
  game.profile(G,U);
  const player=store.get<{id:string}>('SELECT id FROM players WHERE user_id=?',U)!.id;
  store.run('INSERT INTO wallets(player_id,currency,balance) VALUES(?,?,?)',player,'MOHAE',1500);
  const result=game.draw(G,U,'ten-pull-1','standard',10) as any;
  expect(result.results).toHaveLength(10);
  expect(new Set(result.results.map((x:any)=>x.cardId)).size).toBe(10);
  expect((game.profile(G,U) as any).balances.MOHAE).toBe(0);
  expect(game.draw(G,U,'ten-pull-1','standard',10)).toEqual(result);
  expect((game.cards(G,U) as any[]).length).toBe(10);
  store.close();
 });
 test('Privacy delete anonymizes account, removes encrypted journal, and permits fresh account',()=>{
  process.env.JOURNAL_KEY='cd'.repeat(32);
  const {game,store}=setup();
  game.daily(G,U,'privacy-daily','rest','sensitive information',true);
  const old=store.get<{id:string}>('SELECT id FROM players WHERE user_id=?',U)!.id;
  expect((game.privacyDelete(G,U,'privacy-delete') as any).deleted).toBe(true);
  expect(store.get<{n:number}>('SELECT COUNT(*) n FROM journals')?.n).toBe(0);
  game.profile(G,U);
  const fresh=store.get<{id:string}>('SELECT id FROM players WHERE user_id=?',U)!.id;
  expect(fresh).not.toBe(old);
  delete process.env.JOURNAL_KEY;store.close();
 });
});
