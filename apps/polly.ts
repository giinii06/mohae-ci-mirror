import {Client,GatewayIntentBits,Events,SlashCommandBuilder,MessageFlags,ChannelType,PermissionFlagsBits} from 'discord.js';
import {call} from '../src/client.ts';
import {allowedGuild,secret} from '../src/secrets.ts';
const client=new Client({intents:[GatewayIntentBits.Guilds]});
const reportCommand=new SlashCommandBuilder().setName('신고').setDescription('운영진에게 비공개 신고')
 .addUserOption(o=>o.setName('대상').setDescription('신고 대상').setRequired(true))
 .addStringOption(o=>o.setName('사유').setDescription('유형').setRequired(true).addChoices(
  {name:'괴롭힘',value:'harassment'},{name:'도배',value:'spam'},{name:'사기 의심',value:'fraud'},{name:'기타',value:'other'}))
 .addStringOption(o=>o.setName('설명').setDescription('5~1500자').setRequired(true).setMinLength(5).setMaxLength(1500));
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
 if(!i.isChatInputCommand()||i.commandName!=='신고'||!i.guildId||!allowedGuild(i.guildId))return;
 await i.deferReply({flags:MessageFlags.Ephemeral});
 try{
  const target=i.options.getUser('대상',true),reason=i.options.getString('사유',true),details=i.options.getString('설명',true);
  const r=await call<{reportId:string}>('polly','report',{guildId:i.guildId,userId:i.user.id,requestId:i.id,target:target.id,reason,details});
  const channelId=process.env.POLLY_REPORT_CHANNEL_ID?.trim();
  if(channelId){
   const channel=await client.channels.fetch(channelId).catch(()=>null);
   if(channel?.type===ChannelType.GuildText&&channel.guildId===i.guildId&&!channel.permissionsFor(channel.guild.roles.everyone)?.has(PermissionFlagsBits.ViewChannel))
    await channel.send({content:'비공개 신고 #'+r.reportId+'\n신고자 '+i.user.id+' | 대상 '+target.id+' | 사유 '+reason+'\n'+details.replace(/@/g,'＠').slice(0,1500),allowedMentions:{parse:[]}}).catch(()=>{});
  }
  await i.editReply('신고 접수 완료. 접수번호: '+r.reportId);
 }catch(e){await i.editReply('신고 접수 실패: '+(e instanceof Error?e.message:'UNKNOWN').slice(0,200));}
});
await client.login(secret('POLLY_BOT_TOKEN'));
