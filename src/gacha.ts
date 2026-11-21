import {randomInt} from 'node:crypto';
import {bannerMap,type Rarity} from './catalog.ts';
export type Pity={three:number;two:number;pickup:number;guaranteed:boolean};
export type DrawResult={rarity:Rarity;characterId:string;reason:string;next:Pity};
export function p3Percent(index:number):number{return index>=60?100:index<=40?2:2+(index-40)*3;}
export function drawOne(bannerId:string,pity:Pity,rng:(max:number)=>number=randomInt):DrawResult {
 const banner=bannerMap.get(bannerId);if(!banner)throw Error('INVALID_BANNER');
 const limited=banner.kind==='limited';const nth3=pity.three+1,nth2=pity.two+1,nthP=pity.pickup+1;
 let rarity:Rarity=1,reason='base';
 if(limited&&nthP>=70){rarity=3;reason='pickup70';}
 else if(nth3>=60){rarity=3;reason='three60';}
 else { const random=rng(1_000_000);const chance=p3Percent(nth3)*10_000;
   if(random<chance){rarity=3;reason=nth3>40?'soft-pity':'base';}
   else if(nth2>=10){rarity=2;reason='two10';}
   else if(random<(p3Percent(nth3)+15)*10_000)rarity=2;
 }
 const pick=(arr:string[]):string=>{if(!arr.length)throw Error('EMPTY_POOL');return arr[rng(arr.length)];};
 let characterId:string;let guaranteed=pity.guaranteed;
 if(rarity===1)characterId=pick(banner.one);
 else if(rarity===2)characterId=pick(banner.two);
 else {
  const pickup=limited&&(reason==='pickup70'||pity.guaranteed||rng(2)===0);
  if(pickup){characterId=banner.pickup!;guaranteed=false;}
  else {characterId=rng(10)===0?banner.joker:pick(banner.three);if(limited)guaranteed=true;}
 }
 return {rarity,characterId,reason,next:{
  three:rarity===3?0:pity.three+1,
  two:rarity>=2?0:pity.two+1,
  pickup:limited?(characterId===banner.pickup?0:pity.pickup+1):0,
  guaranteed:limited?guaranteed:false
 }};
}
