import {Client,GatewayIntentBits,Events,SlashCommandBuilder,MessageFlags,ChannelType,PermissionFlagsBits} from 'discord.js';
import {call} from '../src/client.ts';
import {allowedGuild,secret} from '../src/secrets.ts';

const client=new Client({intents:[GatewayIntentBits.Guilds]});
const commands=[
 new SlashCommandBuilder().setName('신고').setDescription('운영진에게 비공개 신고')
  .addUserOption(o=>o.setName('대상').setDescription('신고 대상').setRequired(true))
  .addStringOption(o=>o.setName('사유').setDescription('유형').setRequired(true).addChoices(
    {name:'괴롭힘',value:'harassment'},{name:'도배',value:'spam'},{name:'사기 의심',value:'fraud'},{name:'기타',value:'other'}))
  .addStringOption(o=>o.setName('설명').setDescription('5~1500자').setRequired(true).setMinLength(5).setMaxLength(1500)),
 new SlashCommandBuilder().setName('신고상태').setDescription('내 신고 상태 확인')
  .addStringOption(o=>o.setName('번호').setDescription('접수번호').setRequired(true)),
 new SlashCommandBuilder().setName('신고목록').setDescription('관리자: 비공개 신고 목록')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
 new SlashCommandBuilder().setName('신고처리').setDescription('관리자: 신고 처리')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addStringOption(o=>o.setName('번호').setDescription('접수번호').setRequired(true))
  .addStringOption(o=>o.setName('상태').setDescription('처리 상태').setRequired(true)
   .addChoices({name:'열림',value:'open'},{name:'완료',value:'resolved'},{name:'기각',value:'dismissed'}))
];
type Report={id:string;reporter:string;target:string|null;reason:string;details:string;status:string;created:number};
const safe=(text:string)=>text.replace(/@/g,'＠').replace(/[\r\n]+/g,' ').slice(0,120);
function summaries(reports:Report[]):string{
 if(reports.length===0)return '접수된 신고가 없습니다.';
 const rows=reports.slice(0,10).map(r=>
  '['+r.status+'] #'+r.id+'\n신고자 '+r.reporter+' | 대상 '+(r.target??'-')+' | 사유 '+r.reason+'\n'+safe(r.details));
 return ('최근 신고 '+reports.length+'건 중 최대 10건\n\n'+rows.join('\n\n')).slice(0,1850);
}
async function register(g:{id:string;commands:{set:(commands:unknown[])=>Promise<unknown>}}){
 if(!allowedGuild(g.id))return;
 try{await g.commands.set(commands.map(c=>c.toJSON()));}
 catch(e){console.error('Polly command registration failed',e);}
}
client.on(Events.ClientReady,async()=>{
 for(const guild of client.guilds.cache.values())await register(guild);
 console.log('Polly READY',client.user?.id);
});
client.on(Events.GuildCreate,register);
client.on(Events.InteractionCreate,async i=>{
 if(!i.isChatInputCommand()||!i.guildId||!allowedGuild(i.guildId))return;
 await i.deferReply({flags:MessageFlags.Ephemeral}).catch(()=>{});
 if(!i.deferred)return;
 const base={guildId:i.guildId,userId:i.user.id,requestId:i.id};
 try{
  let message:string;
  switch(i.commandName){
   case '신고':{
    const target=i.options.getUser('대상',true),reason=i.options.getString('사유',true),details=i.options.getString('설명',true);
    const receipt=await call<{reportId:string}>('polly','report',{...base,target:target.id,reason,details});
    message='신고 접수 완료. 접수번호: '+receipt.reportId;
    const channelId=process.env.POLLY_REPORT_CHANNEL_ID?.trim();
    if(channelId){
     const channel=await client.channels.fetch(channelId).catch(()=>null);
     // Private staff channels only. Notifications contain no reporter, target or raw report text.
     if(channel?.type===ChannelType.GuildText&&channel.guildId===i.guildId&&
       channel.permissionsFor(channel.guild.roles.everyone)?.has(PermissionFlagsBits.ViewChannel)===false){
      await channel.send({content:'신규 비공개 신고 #'+receipt.reportId,allowedMentions:{parse:[]}}).catch(()=>{});
     }
    }
    break;
   }
   case '신고상태':{
    const report=await call<{id:string;reason:string;status:string;created:number}>('polly','report-status',{
     ...base,reportId:i.options.getString('번호',true)
    });
    message='접수번호: '+report.id+'\n상태: '+report.status+'\n사유: '+report.reason;
    break;
   }
   case '신고목록':{
    if(!i.memberPermissions?.has(PermissionFlagsBits.ManageGuild))throw Error('PERMISSION_DENIED');
    const reports=await call<Report[]>('polly','report-list',base);
    message=summaries(reports);
    break;
   }
   case '신고처리':{
    if(!i.memberPermissions?.has(PermissionFlagsBits.ManageGuild))throw Error('PERMISSION_DENIED');
    const report=await call<{reportId:string;status:string}>('polly','report-update',{
      ...base,reportId:i.options.getString('번호',true),status:i.options.getString('상태',true)
    });
    message='신고 #'+report.reportId+' 상태 변경: '+report.status;
    break;
   }
   default:
    message='알 수 없는 명령어입니다.';
  }
  await i.editReply({content:message,allowedMentions:{parse:[]}}).catch(console.error);
 }catch(e){
  const reason=e instanceof Error?e.message:'UNKNOWN';
  await i.editReply({content:'신고 처리 실패: '+safe(reason),allowedMentions:{parse:[]}}).catch(console.error);
 }
});
await client.login(secret('POLLY_BOT_TOKEN'));
