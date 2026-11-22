import {Client,GatewayIntentBits,Events} from 'discord.js';
import {call} from '../src/client.ts';
import {secret,allowedGuild} from '../src/secrets.ts';
const client=new Client({intents:[GatewayIntentBits.Guilds,GatewayIntentBits.GuildMessages,GatewayIntentBits.GuildVoiceStates]});
const channels=(process.env.COLLECTOR_CHANNEL_IDS||'').split(',').map(x=>x.trim()).filter(Boolean);
const inChannel=(id:string)=>channels.includes(id);
const idFor=(guildId:string,userId:string)=>guildId+':'+userId;
const invalidated=new Set<string>();
let previousEligible=new Map<string,string>(); 
let previousTick=Date.now(),processing=false;
/** Eligible means 2 or more non-bot users in an allowed non-AFK voice channel. */
function eligible():Map<string,string>{
 const found=new Map<string,string>();
 for(const guild of client.guilds.cache.values()){
  if(!allowedGuild(guild.id))continue;
  for(const channel of guild.channels.cache.values()){
   if(!channel.isVoiceBased()||!inChannel(channel.id)||channel.id===guild.afkChannelId)continue;
   const humans=channel.members.filter(m=>!m.user.bot);
   if(humans.size<2)continue;
   for(const member of humans.values())found.set(idFor(guild.id,member.id),channel.id);
  }
 }
 return found;
}
client.on(Events.ClientReady,()=>console.log('Collector READY',client.user?.id));
client.on(Events.MessageCreate,async msg=>{
 if(!msg.guild||!allowedGuild(msg.guild.id)||msg.author.bot||msg.webhookId||!inChannel(msg.channelId))return;
 // Never read, forward or store text content, attachments, embeds or audio.
 try{await call('collector','chat',{guildId:msg.guild.id,userId:msg.author.id,requestId:'chat:'+msg.id,messageId:msg.id});}
 catch(e){console.error('Collector chat submission failed',e instanceof Error?e.message:'unknown');}
});
client.on(Events.VoiceStateUpdate,(before,after)=>{
 const guild=after.guild;
 if(!allowedGuild(guild.id))return;
 // Any membership change invalidates credit for the affected channel for this tick.
 for(const channelId of [before.channelId,after.channelId]){
  if(!channelId)continue;
  const channel=guild.channels.cache.get(channelId);
  if(channel?.isVoiceBased())for(const member of channel.members.values())invalidated.add(idFor(guild.id,member.id));
 }
 invalidated.add(idFor(guild.id,after.id));
});
setInterval(async()=>{
 if(processing)return;
 const now=Date.now(),elapsed=now-previousTick;
 previousTick=now;
 const current=eligible();
 if(elapsed<1000||elapsed>70000){
  previousEligible=current;invalidated.clear();return;
 }
 const seconds=Math.min(60,Math.floor(elapsed/1000));
 const credit:{guildId:string;userId:string;requestId:string;seconds:number}[]=[];
 for(const [key,channelId] of current){
  if(previousEligible.get(key)!==channelId||invalidated.has(key))continue;
  const [guildId,userId]=key.split(':');
  credit.push({guildId,userId,requestId:'voice:'+guildId+':'+userId+':'+Math.floor(now/60000),seconds});
 }
 previousEligible=current;invalidated.clear();
 processing=true;
 try{await Promise.allSettled(credit.map(entry=>call('collector','voice',entry)));}
 finally{processing=false;}
},60000);
await client.login(secret('COLLECTOR_BOT_TOKEN'));
