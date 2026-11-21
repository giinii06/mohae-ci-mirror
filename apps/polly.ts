import {Client,GatewayIntentBits,Events,SlashCommandBuilder,MessageFlags,ChannelType,PermissionFlagsBits} from 'discord.js';
import {call} from '../src/client.ts';
import {allowedGuild,secret} from '../src/secrets.ts';
const client=new Client({intents:[GatewayIntentBits.Guilds]});
const reportCommand=new SlashCommandBuilder().setName('ì ê³ ').setDescription('ì´ìì§ìê² ë¹ê³µê° ì ê³ ')
 .addUserOption(o=>o.setName('ëì').setDescription('ì ê³  ëì').setRequired(true))
 .addStringOption(o=>o.setName('ì¬ì ').setDescription('ì í').setRequired(true).addChoices(
  {name:'ê´´ë¡­í',value:'harassment'},{name:'ëë°°',value:'spam'},{name:'ì¬ê¸° ìì¬',value:'fraud'},{name:'ê¸°í',value:'other'}))
 .addStringOption(o=>o.setName('ì¤ëª').setDescription('5~1500ì').setRequired(true).setMinLength(5).setMaxLength(1500));
const commands=[reportCommand,
 new SlashCommandBuilder().setName('신고상태').setDescription('내 신고 상태 확인').addStringOption(o=>o.setName('번호').setDescription('접수번호').setRequired(true)),
 new SlashCommandBuilder().setName('신고목록').setDescription('관리자: 비공개 신고 목록').setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
 new SlashCommandBuilder().setName('신고처리').setDescription('관리자: 신고 처리').setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addStringOption(o=>o.setName('번호').setDescription('접수번호').setRequired(true))
  .addStringOption(o=>o.setName('상태').setDescription('처리 상태').setRequired(true).addChoices({name:'열림',value:'open'},{name:'완료',value:'resolved'},{name:'기각',value:'dismissed'}))
];
async function register(g:any){if(allowedGuild(g.id))await g.commands.set(commands.map(c=>c.toJSON())).catch(console.error);}
client.on(Events.ClientReady,async()=>{for(const g of client.guilds.cache.values())await register(g);console.log('Polly READY',client.user?.id);});
client.on(Events.GuildCreate,register);
client.on(Events.InteractionCreate,async i=>{
 if(!i.isChatInputCommand()||i.commandName!=='ì ê³ '||!i.guildId||!allowedGuild(i.guildId))return;
 await i.deferReply({flags:MessageFlags.Ephemeral});
 try{
  const target=i.options.getUser('ëì',true),reason=i.options.getString('ì¬ì ',true),details=i.options.getString('ì¤ëª',true);
  const r=await call<{reportId:string}>('polly','report',{guildId:i.guildId,userId:i.user.id,requestId:i.id,target:target.id,reason,details});
  const channelId=process.env.POLLY_REPORT_CHANNEL_ID?.trim();
  if(channelId){
   const channel=await client.channels.fetch(channelId).catch(()=>null);
   if(channel?.type===ChannelType.GuildText&&channel.guildId===i.guildId&&!channel.permissionsFor(channel.guild.roles.everyone)?.has(PermissionFlagsBits.ViewChannel))
    await channel.send({content:'ë¹ê³µê° ì ê³  #'+r.reportId+'\nì ê³ ì '+i.user.id+' | ëì '+target.id+' | ì¬ì  '+reason+'\n'+details.replace(/@/g,'ï¼ ').slice(0,1500),allowedMentions:{parse:[]}}).catch(()=>{});
  }
  await i.editReply('ì ê³  ì ì ìë£. ì ìë²í¸: '+r.reportId);
 }catch(e){await i.editReply('ì ê³  ì ì ì¤í¨: '+(e instanceof Error?e.message:'UNKNOWN').slice(0,200));}
});
await client.login(secret('POLLY_BOT_TOKEN'));
