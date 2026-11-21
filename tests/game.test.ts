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
  for(let i=0;i<10;i++){advance(60000);game.chat(G,U,'chat'+i,('900000000000000000'+i).slice(0,18));}
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
  expect(result.seasonId).toBe('dummy_season_01');
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
