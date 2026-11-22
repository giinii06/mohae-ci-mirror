const dateFmt = new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'});
/** KST calendar date anchored at 05:00, independent from host timezone. */
export function gameDay(at:number):string { return dateFmt.format(new Date(at-5*3600_000)); }
export function gameWeek(at:number):string {
  const day=gameDay(at); const d=new Date(day+'T00:00:00.000Z');
  const dow=(d.getUTCDay()+6)%7; d.setUTCDate(d.getUTCDate()-dow); return d.toISOString().slice(0,10);
}
export function currentLevel(xp:number):number { let level=1; while(xp>=(level+9)**2 && level<1000){xp-=(level+9)**2;level++;} return level; }
export function seasonTier(xp:number):number { return Math.max(0,Math.min(20,Math.floor(xp/250))); }
export function kstMondayFiveMs(isoDate:string):number {return Date.parse(isoDate+'T00:00:00Z')-4*3600_000;}
export function kstNextReset(at:number):number {const d=gameDay(at);return Date.parse(d+'T00:00:00Z')+20*3600_000;}
