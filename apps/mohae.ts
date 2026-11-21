import {Client,GatewayIntentBits,Events,SlashCommandBuilder,MessageFlags,ActionRowBuilder,ButtonBuilder,ButtonStyle,PermissionFlagsBits,AttachmentBuilder} from 'discord.js';
import {call} from '../src/client.ts';
import {allowedGuild,secret} from '../src/secrets.ts';
import {kstMondayFiveMs} from '../src/time.ts';
import {cosmetics,miniGames,questTopics} from '../src/catalog.ts';
const client=new Client({intents:[GatewayIntentBits.Guilds]});
const simple=(name:string,description:string)=>new SlashCommandBuilder().setName(name).setDescription(description);
const withText=(name:string,description:string,opt:string)=>simple(name,description).addStringOption(o=>o.setName(opt).setDescription(opt).setRequired(true));
const commands=[
 simple('ÃÂªÃÂ²ÃÂÃÂ¬ÃÂÃÂ','ÃÂªÃÂ²ÃÂÃÂ¬ÃÂÃÂ ÃÂ«ÃÂ©ÃÂÃÂ¬ÃÂÃÂ¸ ÃÂ­ÃÂÃÂÃÂ«ÃÂ©ÃÂ´'),simple('ÃÂ¬ÃÂ¶ÃÂÃÂ¬ÃÂÃÂ','ÃÂ¬ÃÂ¶ÃÂÃÂ¬ÃÂÃÂ ÃÂ«ÃÂ³ÃÂ´ÃÂ¬ÃÂÃÂ'),
 withText('ÃÂ¬ÃÂÃÂ¼ÃÂ­ÃÂÃÂ','ÃÂ¬ÃÂÃÂ¤ÃÂ«ÃÂÃÂÃÂ¬ÃÂÃÂ ÃÂ­ÃÂÃÂÃÂ¬ÃÂÃÂ¤ÃÂ­ÃÂÃÂ¸','ÃÂ¬ÃÂ£ÃÂ¼ÃÂ¬ÃÂ ÃÂ'),
 simple('ÃÂ¬ÃÂ£ÃÂ¼ÃÂªÃÂ°ÃÂÃÂ­ÃÂÃÂ','ÃÂ¬ÃÂ£ÃÂ¼ÃÂªÃÂ°ÃÂ ÃÂ«ÃÂªÃÂ©ÃÂ­ÃÂÃÂÃÂ¬ÃÂÃÂ ÃÂ«ÃÂ³ÃÂ´ÃÂ¬ÃÂÃÂ').addBooleanOption(o=>o.setName('ÃÂ¬ÃÂÃÂÃÂ«ÃÂ ÃÂ¹').setDescription('ÃÂ«ÃÂ³ÃÂ´ÃÂ¬ÃÂÃÂ ÃÂ¬ÃÂÃÂÃÂ«ÃÂ ÃÂ¹').setRequired(false)),
 withText('ÃÂ«ÃÂ½ÃÂÃÂªÃÂ¸ÃÂ°','ÃÂ¬ÃÂºÃÂÃÂ«ÃÂ¦ÃÂ­ÃÂ­ÃÂÃÂ° ÃÂ«ÃÂ½ÃÂÃÂªÃÂ¸ÃÂ°','ÃÂ«ÃÂ°ÃÂ°ÃÂ«ÃÂÃÂ').addIntegerOption(o=>o.setName('ÃÂ­ÃÂÃÂÃÂ¬ÃÂÃÂ').setDescription('1 ÃÂ«ÃÂÃÂÃÂ«ÃÂÃÂ 10').setRequired(true).addChoices({name:'1',value:1},{name:'10',value:10})),
 simple('ÃÂ«ÃÂ½ÃÂÃÂªÃÂ¸ÃÂ°ÃÂªÃÂ¸ÃÂ°ÃÂ«ÃÂ¡ÃÂ','ÃÂ«ÃÂ½ÃÂÃÂªÃÂ¸ÃÂ° ÃÂªÃÂ¸ÃÂ°ÃÂ«ÃÂ¡ÃÂ'),simple('ÃÂ«ÃÂÃÂÃÂªÃÂ°ÃÂ','ÃÂ¬ÃÂºÃÂÃÂ«ÃÂ¦ÃÂ­ÃÂ­ÃÂÃÂ° ÃÂ«ÃÂÃÂÃÂªÃÂ°ÃÂ'),simple('ÃÂ¬ÃÂ¹ÃÂ´ÃÂ«ÃÂÃÂ','ÃÂ«ÃÂ³ÃÂ´ÃÂ¬ÃÂÃÂ  ÃÂ¬ÃÂ¹ÃÂ´ÃÂ«ÃÂÃÂ'),
 withText('ÃÂ¬ÃÂ¹ÃÂ´ÃÂ«ÃÂÃÂÃÂ¬ÃÂÃÂ ÃÂªÃÂ¸ÃÂ','ÃÂ¬ÃÂ¹ÃÂ´ÃÂ«ÃÂÃÂ ÃÂ¬ÃÂÃÂ ÃÂªÃÂ¸ÃÂ ÃÂ«ÃÂ³ÃÂÃÂªÃÂ²ÃÂ½','ÃÂ¬ÃÂ¹ÃÂ´ÃÂ«ÃÂÃÂid').addBooleanOption(o=>o.setName('ÃÂ¬ÃÂÃÂ ÃÂªÃÂ¸ÃÂ').setDescription('ÃÂ¬ÃÂÃÂ ÃÂªÃÂ·ÃÂ¸ÃÂªÃÂ¸ÃÂ°').setRequired(true)),
 withText('ÃÂ«ÃÂ¶ÃÂÃÂ­ÃÂÃÂ´','ÃÂ¬ÃÂ¤ÃÂÃÂ«ÃÂ³ÃÂµ ÃÂ¬ÃÂ¹ÃÂ´ÃÂ«ÃÂÃÂ ÃÂ«ÃÂ¶ÃÂÃÂ­ÃÂÃÂ´','ÃÂ¬ÃÂ¹ÃÂ´ÃÂ«ÃÂÃÂid').addBooleanOption(o=>o.setName('ÃÂ­ÃÂÃÂÃÂ¬ÃÂÃÂ¸').setDescription('ÃÂ«ÃÂ³ÃÂµÃÂªÃÂµÃÂ¬ ÃÂ«ÃÂ¶ÃÂÃÂªÃÂ°ÃÂÃÂ«ÃÂÃÂ¥ÃÂ­ÃÂÃÂ¨ÃÂ¬ÃÂÃÂ ÃÂ­ÃÂÃÂÃÂ¬ÃÂÃÂ¸').setRequired(true)),
 withText('ÃÂ«ÃÂÃÂÃÂ­ÃÂÃÂ','ÃÂ«ÃÂÃÂÃÂ­ÃÂÃÂ ÃÂ¬ÃÂºÃÂÃÂ«ÃÂ¦ÃÂ­ÃÂ­ÃÂÃÂ° ÃÂ¬ÃÂÃÂ¤ÃÂ¬ÃÂ ÃÂ','ÃÂ¬ÃÂºÃÂÃÂ«ÃÂ¦ÃÂ­ÃÂ­ÃÂÃÂ°'),withText('ÃÂ­ÃÂÃÂ¸ÃÂªÃÂ°ÃÂÃÂ«ÃÂÃÂ','ÃÂ«ÃÂÃÂÃÂ­ÃÂÃÂ ÃÂ¬ÃÂºÃÂÃÂ«ÃÂ¦ÃÂ­ÃÂ­ÃÂÃÂ° ÃÂ­ÃÂÃÂ¸ÃÂªÃÂ°ÃÂÃÂ«ÃÂÃÂ','ÃÂ­ÃÂÃÂÃÂ«ÃÂÃÂ'),
 withText('ÃÂ«ÃÂ¯ÃÂ¸ÃÂ«ÃÂÃÂÃÂªÃÂ²ÃÂÃÂ¬ÃÂÃÂ','ÃÂ«ÃÂÃÂÃÂ«ÃÂ¯ÃÂ¸ ÃÂ«ÃÂ¯ÃÂ¸ÃÂ«ÃÂÃÂÃÂªÃÂ²ÃÂÃÂ¬ÃÂÃÂ','ÃÂªÃÂ²ÃÂÃÂ¬ÃÂÃÂ'),
 simple('ÃÂ¬ÃÂÃÂÃÂ¬ÃÂ ÃÂ','ÃÂ¬ÃÂÃÂÃÂ­ÃÂÃÂ ÃÂ«ÃÂªÃÂ©ÃÂ«ÃÂ¡ÃÂ'),withText('ÃÂªÃÂµÃÂ¬ÃÂ«ÃÂ§ÃÂ¤','ÃÂ¬ÃÂÃÂÃÂ¬ÃÂÃÂ´ÃÂ­ÃÂÃÂ ÃÂªÃÂµÃÂ¬ÃÂ«ÃÂ§ÃÂ¤','ÃÂ¬ÃÂÃÂÃÂ­ÃÂÃÂ'),withText('ÃÂªÃÂ¾ÃÂ¸ÃÂ«ÃÂ¯ÃÂ¸ÃÂªÃÂ¸ÃÂ°','ÃÂ¬ÃÂÃÂÃÂ¬ÃÂÃÂ´ÃÂ­ÃÂÃÂ ÃÂ¬ÃÂÃÂ¥ÃÂ¬ÃÂ°ÃÂ©','ÃÂ¬ÃÂÃÂÃÂ­ÃÂÃÂ'),
 simple('ÃÂ­ÃÂÃÂÃÂ«ÃÂ¡ÃÂÃÂ­ÃÂÃÂ','ÃÂ«ÃÂÃÂ´ ÃÂªÃÂ²ÃÂÃÂ¬ÃÂÃÂ ÃÂ­ÃÂÃÂÃÂ«ÃÂ¡ÃÂÃÂ­ÃÂÃÂ'),simple('ÃÂ¬ÃÂÃÂÃÂ¬ÃÂ¦ÃÂ','ÃÂ¬ÃÂÃÂÃÂ¬ÃÂ¦ÃÂ ÃÂ¬ÃÂÃÂÃÂ­ÃÂÃÂ'),
 simple('ÃÂ¬ÃÂÃÂÃÂ¬ÃÂ¦ÃÂÃÂ«ÃÂ³ÃÂ´ÃÂ¬ÃÂÃÂ','ÃÂ¬ÃÂÃÂÃÂ¬ÃÂ¦ÃÂÃÂ­ÃÂÃÂ¨ÃÂ¬ÃÂÃÂ¤ ÃÂ¬ÃÂÃÂÃÂ«ÃÂ ÃÂ¹').addIntegerOption(o=>o.setName('ÃÂ«ÃÂÃÂ¨ÃÂªÃÂ³ÃÂ').setDescription('1~20').setRequired(true).setMinValue(1).setMaxValue(20)),
 withText('ÃÂ¬ÃÂÃÂÃÂ¬ÃÂ¦ÃÂÃÂ¬ÃÂÃÂÃÂ¬ÃÂÃÂ','ÃÂªÃÂ´ÃÂÃÂ«ÃÂ¦ÃÂ¬ÃÂ¬ÃÂÃÂ: 56ÃÂ¬ÃÂÃÂ¼ ÃÂ¬ÃÂÃÂÃÂ¬ÃÂ¦ÃÂ ÃÂ¬ÃÂÃÂÃÂ¬ÃÂÃÂ½','ÃÂ¬ÃÂÃÂÃÂ¬ÃÂÃÂÃÂ¬ÃÂÃÂ¼').setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
 withText('ÃÂªÃÂ³ÃÂÃÂ¬ÃÂ ÃÂÃÂ¬ÃÂÃÂ­ÃÂ¬ÃÂ ÃÂ','ÃÂªÃÂ³ÃÂÃÂ¬ÃÂ ÃÂ ÃÂ¬ÃÂÃÂµÃÂ«ÃÂªÃÂÃÂ­ÃÂÃÂ','ÃÂ­ÃÂÃÂÃÂ¬ÃÂÃÂ¸'),simple('ÃÂ«ÃÂÃÂÃÂ¬ÃÂÃÂÃÂ«ÃÂ§ÃÂ','ÃÂ«ÃÂªÃÂÃÂ«ÃÂ ÃÂ¹ÃÂ¬ÃÂÃÂ´ ÃÂ¬ÃÂÃÂÃÂ«ÃÂÃÂ´')
];
function show(value:unknown):string {const s=JSON.stringify(value,null,2);return '[ÃÂ«ÃÂÃÂÃÂ«ÃÂ¯ÃÂ¸ MOHAE]\n'+(s.length>1800?s.slice(0,1790)+'...':s);}
async function register(g:any){if(!allowedGuild(g.id))return;try{await g.commands.set(commands.map(x=>x.toJSON()));}catch(e){console.error('command registration failed',e);}}
client.on(Events.ClientReady,async()=>{for(const g of client.guilds.cache.values())await register(g);console.log('MOHAE READY',client.user?.id);});
client.on(Events.GuildCreate,register);
client.on(Events.InteractionCreate,async i=>{
 if(!i.inGuild()||!i.guildId||!allowedGuild(i.guildId)||(!i.isChatInputCommand()&&!i.isButton()))return;
 await i.deferReply({flags:MessageFlags.Ephemeral}).catch(()=>{});
 try{
  const base={guildId:i.guildId,userId:i.user.id,requestId:i.id};
  if(i.isButton()){
   const [tag,sessionId,answer]=i.customId.split(':');
   if(tag!=='mini'||!sessionId||!answer)throw Error('INVALID_BUTTON');
   const r=await call('mohae','mini-finish',{...base,sessionId,answer});
   await i.editReply({content:show(r),components:[]});return;
  }
  const opt=(n:string)=>i.options.getString(n,true);
  let r:unknown;
  switch(i.commandName){
   case 'ÃÂªÃÂ²ÃÂÃÂ¬ÃÂÃÂ':case 'ÃÂ­ÃÂÃÂÃÂ«ÃÂ¡ÃÂÃÂ­ÃÂÃÂ':r=await call('mohae','profile',base);break;
   case 'ÃÂ¬ÃÂ¶ÃÂÃÂ¬ÃÂÃÂ':r=await call('mohae','attendance',base);break;
   case 'ÃÂ¬ÃÂÃÂ¼ÃÂ­ÃÂÃÂ':{const topic=opt('ÃÂ¬ÃÂ£ÃÂ¼ÃÂ¬ÃÂ ÃÂ');if(!(questTopics as readonly string[]).includes(topic))throw Error('INVALID_TOPIC');r=await call('mohae','daily',{...base,topic});break;}
   case 'ÃÂ¬ÃÂ£ÃÂ¼ÃÂªÃÂ°ÃÂÃÂ­ÃÂÃÂ':{const w=await call<{week:string}>('mohae','weekly',base);r=i.options.getBoolean('ÃÂ¬ÃÂÃÂÃÂ«ÃÂ ÃÂ¹')?await call('mohae','weekly-claim',{...base,week:w.week}):w;break;}
   case 'ÃÂ«ÃÂ½ÃÂÃÂªÃÂ¸ÃÂ°':r=await call('mohae','draw',{...base,banner:opt('ÃÂ«ÃÂ°ÃÂ°ÃÂ«ÃÂÃÂ'),quantity:i.options.getInteger('ÃÂ­ÃÂÃÂÃÂ¬ÃÂÃÂ',true)});break;
   case 'ÃÂ«ÃÂ½ÃÂÃÂªÃÂ¸ÃÂ°ÃÂªÃÂ¸ÃÂ°ÃÂ«ÃÂ¡ÃÂ':r=await call('mohae','draw-history',base);break;
   case 'ÃÂ«ÃÂÃÂÃÂªÃÂ°ÃÂ':r=await call('mohae','collection',base);break;
   case 'ÃÂ¬ÃÂ¹ÃÂ´ÃÂ«ÃÂÃÂ':r=await call('mohae','cards',base);break;
   case 'ÃÂ¬ÃÂ¹ÃÂ´ÃÂ«ÃÂÃÂÃÂ¬ÃÂÃÂ ÃÂªÃÂ¸ÃÂ':r=await call('mohae','lock',{...base,cardId:opt('ÃÂ¬ÃÂ¹ÃÂ´ÃÂ«ÃÂÃÂid'),locked:i.options.getBoolean('ÃÂ¬ÃÂÃÂ ÃÂªÃÂ¸ÃÂ',true)});break;
   case 'ÃÂ«ÃÂ¶ÃÂÃÂ­ÃÂÃÂ´':r=await call('mohae','dismantle',{...base,cardId:opt('ÃÂ¬ÃÂ¹ÃÂ´ÃÂ«ÃÂÃÂid'),confirm:i.options.getBoolean('ÃÂ­ÃÂÃÂÃÂ¬ÃÂÃÂ¸',true)});break;
   case 'ÃÂ«ÃÂÃÂÃÂ­ÃÂÃÂ':r=await call('mohae','representative',{...base,character:opt('ÃÂ¬ÃÂºÃÂÃÂ«ÃÂ¦ÃÂ­ÃÂ­ÃÂÃÂ°')});break;
   case 'ÃÂ­ÃÂÃÂ¸ÃÂªÃÂ°ÃÂÃÂ«ÃÂÃÂ':r=await call('mohae','affinity',{...base,kind:opt('ÃÂ­ÃÂÃÂÃÂ«ÃÂÃÂ')});break;
   case 'ÃÂ«ÃÂ¯ÃÂ¸ÃÂ«ÃÂÃÂÃÂªÃÂ²ÃÂÃÂ¬ÃÂÃÂ':{
    const game=opt('ÃÂªÃÂ²ÃÂÃÂ¬ÃÂÃÂ');if(!(miniGames as readonly string[]).includes(game))throw Error('INVALID_MINIGAME');
    const s=await call<{id:string;question:string;choices:string[]}>('mohae','mini-start',{...base,game});
    const row=new ActionRowBuilder<ButtonBuilder>();
    for(const choice of s.choices)row.addComponents(new ButtonBuilder().setCustomId('mini:'+s.id+':'+choice).setLabel(choice).setStyle(ButtonStyle.Primary));
    await i.editReply({content:'[ÃÂ«ÃÂÃÂÃÂ«ÃÂ¯ÃÂ¸] '+s.question,components:[row]});return;
   }
   case 'ÃÂ¬ÃÂÃÂÃÂ¬ÃÂ ÃÂ':r=cosmetics.filter(x=>x.price>0);break;
   case 'ÃÂªÃÂµÃÂ¬ÃÂ«ÃÂ§ÃÂ¤':r=await call('mohae','buy',{...base,sku:opt('ÃÂ¬ÃÂÃÂÃÂ­ÃÂÃÂ')});break;
   case 'ÃÂªÃÂ¾ÃÂ¸ÃÂ«ÃÂ¯ÃÂ¸ÃÂªÃÂ¸ÃÂ°':r=await call('mohae','equip',{...base,sku:opt('ÃÂ¬ÃÂÃÂÃÂ­ÃÂÃÂ')});break;
   case 'ÃÂ¬ÃÂÃÂÃÂ¬ÃÂ¦ÃÂ':r=await call('mohae','season',base);break;
   case 'ÃÂ¬ÃÂÃÂÃÂ¬ÃÂ¦ÃÂÃÂ«ÃÂ³ÃÂ´ÃÂ¬ÃÂÃÂ':r=await call('mohae','season-claim',{...base,tier:i.options.getInteger('ÃÂ«ÃÂÃÂ¨ÃÂªÃÂ³ÃÂ',true)});break;
   case 'ÃÂ¬ÃÂÃÂÃÂ¬ÃÂ¦ÃÂÃÂ¬ÃÂÃÂÃÂ¬ÃÂÃÂ':{
    if(!i.memberPermissions?.has(PermissionFlagsBits.ManageGuild))throw Error('PERMISSION_DENIED');
    const d=opt('ÃÂ¬ÃÂÃÂÃÂ¬ÃÂÃÂÃÂ¬ÃÂÃÂ¼');if(!/^\d{4}-\d{2}-\d{2}$/.test(d))throw Error('INVALID_DATE');
    r=await call('mohae','season-activate',{...base,seasonId:'dummy_season_01',start:kstMondayFiveMs(d)});break;
   }
   case 'ÃÂªÃÂ³ÃÂÃÂ¬ÃÂ ÃÂÃÂ¬ÃÂÃÂ­ÃÂ¬ÃÂ ÃÂ':if(opt('ÃÂ­ÃÂÃÂÃÂ¬ÃÂÃÂ¸')!=='DELETE')throw Error('CONFIRM_REQUIRED');r=await call('mohae','privacy-delete',base);break;
   case 'ÃÂ«ÃÂÃÂÃÂ¬ÃÂÃÂÃÂ«ÃÂ§ÃÂ':r=commands.map(c=>'/'+c.name);break;
   default:throw Error('UNKNOWN_COMMAND');
  }
  await i.editReply({content:show(r)});
 }catch(e){await i.editReply({content:'ÃÂ¬ÃÂ²ÃÂÃÂ«ÃÂ¦ÃÂ¬ ÃÂ¬ÃÂÃÂ¤ÃÂ­ÃÂÃÂ¨: '+(e instanceof Error?e.message:'UNKNOWN').slice(0,140)}).catch(()=>{});}
});
await client.login(secret('MOHAE_BOT_TOKEN'));
