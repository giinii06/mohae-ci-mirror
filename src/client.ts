import {secret,required,type Role} from './secrets.ts';
export async function call<T=any>(role:Role,action:string,args:Record<string,unknown>):Promise<T>{
 const response=await fetch(required('GAME_API_URL')+'/v1/action',{
  method:'POST',signal:AbortSignal.timeout(7000),
  headers:{'Content-Type':'application/json','X-Service-Role':role,'Authorization':'Bearer '+secret(role.toUpperCase()+'_API_KEY')},
  body:JSON.stringify({action,...args})
 });
 const data=await response.json() as {ok:boolean;result?:T;error?:string};
 if(!response.ok||!data.ok)throw Error(data.error||'SERVICE_UNAVAILABLE');
 return data.result as T;
}
