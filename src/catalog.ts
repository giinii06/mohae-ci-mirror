export type Rarity=1|2|3;
export type Character={id:string;rarity:Rarity;name:string;kind:'standard'|'limited'|'season'};
export type Banner={id:string;kind:'standard'|'limited';one:string[];two:string[];three:string[];joker:string;pickup?:string};
export type Cosmetic={id:string;kind:string;price:number;currency:'SHARD'|'MOHAE';name:string};
export const characters:Character[]=Array.from({length:27},(_,i)=>({
  id:'person'+(i+1),name:'person'+(i+1),
  rarity:i<12?1:i<20?2:3,kind:i===25?'limited':i===26?'season':'standard'
}));
export const characterMap=new Map(characters.map(x=>[x.id,x]));
const one=characters.filter(x=>x.kind==='standard'&&x.rarity===1).map(x=>x.id);
const two=characters.filter(x=>x.kind==='standard'&&x.rarity===2).map(x=>x.id);
const three=characters.filter(x=>x.kind==='standard'&&x.rarity===3&&x.id!=='person25').map(x=>x.id);
export const banners:Banner[]=[
  {id:'standard',kind:'standard',one,two,three,joker:'person25'},
  {id:'limited',kind:'limited',one,two,three,joker:'person25',pickup:'person26'}
];
export const bannerMap=new Map(banners.map(x=>[x.id,x]));
export const questTopics=['praise','good_day','thanks','self_comfort','rest'] as const;
export const miniGames=['deduction','memory','treasure','quiz','dice'] as const;
export const cosmetics:Cosmetic[]=[
  ...([10,15,25,40,60,80,120].map((p,i)=>({id:'shop_'+['expression','sticker','badge','frame','pose','background','theme'][i],name:'[더미] 꾸미기 '+(i+1),kind:['expression','sticker','badge','frame','pose','background','theme'][i],price:p,currency:'SHARD' as const}))),
  ...Array.from({length:20},(_,i)=>({id:'season_reward_'+(i+1),name:'[더미] 시즌 보상 '+(i+1),kind:'season',price:0,currency:'SHARD' as const}))
];
cosmetics.push({id:'dummy_coop_badge',name:'[더미] 협동 완료 배지',kind:'badge',price:0,currency:'SHARD'});
export const cosmeticMap=new Map(cosmetics.map(x=>[x.id,x]));
export type Grant={currency?:'MOHAE'|'SHARD'|'TICKET';amount?:number;cosmetic?:string;character?:string};
export const seasonRewards:Grant[]=Array.from({length:20},(_,i)=>{
 const tier=i+1;
 if([3,10,15,20].includes(tier))return {currency:'TICKET',amount:tier===3||tier===10?2:3};
 if(tier===2||tier===6||tier===9||tier===13||tier===17)return {currency:'SHARD',amount:{2:10,6:15,9:20,13:25,17:30}[tier as 2|6|9|13|17]};
 return tier===20?{character:'person27'}:{cosmetic:'season_reward_'+tier};
});
/** Tier 20 has 3 tickets AND the season character; the second grant is handled by season claim. */
export const seasonalEvents=[
 {id:'dummy_event_02',week:2,kind:'mini',goal:8,reward:200},
 {id:'dummy_event_04',week:4,kind:'daily',goal:5,reward:200},
 {id:'dummy_event_06',week:6,kind:'weekly',goal:1,reward:200}
] as const;
export const roleColorPresets=['#64748B','#EF4444','#F97316','#EAB308','#84CC16','#22C55E','#06B6D4','#3B82F6','#6366F1','#A855F7','#EC4899','#F43F5E'];
export function assertCatalog():void {
 if(characters.length!==27||new Set(characters.map(x=>x.id)).size!==27)throw Error('INVALID_CATALOG');
 if(characters.some((x,i)=>x.id!=='person'+(i+1)))throw Error('INVALID_CHARACTER_IDS');
 if(characters.filter(c=>c.kind==='standard'&&c.rarity===1).length!==12)throw Error('INVALID_STANDARD_ONES');
 if(characters.filter(c=>c.kind==='standard'&&c.rarity===2).length!==8)throw Error('INVALID_STANDARD_TWOS');
 if(characters.filter(c=>c.kind==='standard'&&c.rarity===3).length!==5)throw Error('INVALID_STANDARD_THREES');
 for(const b of banners)for(const id of [...b.one,...b.two,...b.three,b.joker,...(b.pickup?[b.pickup]:[])])if(!characterMap.has(id))throw Error('BROKEN_BANNER');
 if(seasonRewards.length!==20)throw Error('INVALID_SEASON');
 if(seasonRewards.reduce((acc,x)=>acc+(x.currency==='TICKET'?x.amount??0:0),0)!==10)throw Error('INVALID_TICKET_REWARDS');
 if(seasonRewards.reduce((acc,x)=>acc+(x.currency==='SHARD'?x.amount??0:0),0)!==100)throw Error('INVALID_SHARD_REWARDS');
}
assertCatalog();
