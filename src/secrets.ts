import {readFileSync} from 'node:fs';
export type Role='mohae'|'collector'|'polly';
export function secret(name:string):string {
 const file=process.env[name+'_FILE']||'/run/secrets/'+name.toLowerCase();
 let value:string|undefined;
 try{value=readFileSync(file,'utf8').trim();}catch{}
 value||=process.env[name]?.trim();
 if(!value||value.length<12)throw Error('Missing secret '+name);
 return value;
}
export function required(name:string):string{const v=process.env[name]?.trim();if(!v)throw Error('Missing config '+name);return v;}
export function allowedGuild(id:string):boolean{const all=(process.env.ALLOWED_GUILD_IDS||'').split(',').map(x=>x.trim()).filter(Boolean);return all.length>0&&all.includes(id);}
