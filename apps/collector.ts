import {Client,GatewayIntentBits,Events} from 'discord.js';
import {randomUUID} from 'node:crypto';
import {call} from '../src/client.ts';
import {secret,allowedGuild} from '../src/secrets.ts';
const client=new Client({intents:[GatewayIntentBits.Guilds,GatewayIntentBits.GuildMessages,GatewayIntentBits.GuildVoiceStates]});
const channels=(process.env.COLLECTOR_CHANNEL_IDS||'').split(',').map(x=>x.trim()).filter(Boolean);
const inChannel=(id:string)=>channels.includes(id);
client.on(Events.ClientReady,()=>console.log('Collector READY',client.user?.id));
client.on(Events.MessageCreate,async msg=>{
 if(!msg.guild||!allowedGuild(msg.guild.id)||msg.author.bot||msg.webhookId||!inChannel(msg.channelId))return;
 // Counts message identity/timing only, never reads its content.
 try{await call('collector','chat',{guildId:msg.guild.id,userId:msg.author.id,requestId:'chat:'+msg.id,messageId:msg.id});}
 catch(e){console.error('Collector chat failed',e instanceof Error?e.message:'unknown');}
});
let previous=Date.now();
setInterval(async()=>{
 const now=Date.now(),elapsed=now-previous;previous=now;
 if(elapsed<1000||elapsed>70_000)return;
 const seconds=Math.min(60,Math.floor(elapsed/1000));
 for(const g of client.guilds.cache.values()){
  if(!allowedGuild(g.id))continue;
  for(const channel of g.channels.cache.values()){
   if(!channel.isVoiceBased()||!inChannel(channel.id)||channel.id===g.afkChannelId)continue;
   const people=channel.members.filter(m=>!m.user.bot);
   if(people.size<2)continue;
   await Promise.allSettled([...people.values()].map(m=>call('collector','voice',{
    guildId:g.id,userId:m.id,requestId:'voice:'+randomUUID(),seconds
   })));
  }
 }
},60_000);
await client.login(secret('COLLECTOR_BOT_TOKEN'));
