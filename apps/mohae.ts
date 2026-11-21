import {Client,GatewayIntentBits,Events,SlashCommandBuilder,MessageFlags,ActionRowBuilder,ButtonBuilder,ButtonStyle,PermissionFlagsBits,AttachmentBuilder} from 'discord.js';
import {call} from '../src/client.ts';
import {allowedGuild,secret} from '../src/secrets.ts';
import {kstMondayFiveMs} from '../src/time.ts';
import {cosmetics,miniGames,questTopics} from '../src/catalog.ts';
const client=new Client({intents:[GatewayIntentBits.Guilds]});
const simple=(name:string,description:string)=>new SlashCommandBuilder().setName(name).setDescription(description);
const withText=(name:string,description:string,opt:string)=>simple(name,description).addStringOption(o=>o.setName(opt).setDescription(opt).setRequired(true));
const commands=[
 simple('ê²ì','ê²ì ë©ì¸ íë©´'),simple('ì¶ì','ì¶ì ë³´ì'),
 withText('ì¼í','ì¤ëì íì¤í¸','ì£¼ì '),
 simple('ì£¼ê°í','ì£¼ê° ëª©íì ë³´ì').addBooleanOption(o=>o.setName('ìë ¹').setDescription('ë³´ì ìë ¹').setRequired(false)),
 withText('ë½ê¸°','ìºë¦­í° ë½ê¸°','ë°°ë').addIntegerOption(o=>o.setName('íì').setDescription('1 ëë 10').setRequired(true).addChoices({name:'1',value:1},{name:'10',value:10})),
 simple('ë½ê¸°ê¸°ë¡','ë½ê¸° ê¸°ë¡'),simple('ëê°','ìºë¦­í° ëê°'),simple('ì¹´ë','ë³´ì  ì¹´ë'),
 withText('ì¹´ëì ê¸','ì¹´ë ì ê¸ ë³ê²½','ì¹´ëid').addBooleanOption(o=>o.setName('ì ê¸').setDescription('ì ê·¸ê¸°').setRequired(true)),
 withText('ë¶í´','ì¤ë³µ ì¹´ë ë¶í´','ì¹´ëid').addBooleanOption(o=>o.setName('íì¸').setDescription('ë³µêµ¬ ë¶ê°ë¥í¨ì íì¸').setRequired(true)),
 withText('ëí','ëí ìºë¦­í° ì¤ì ','ìºë¦­í°'),withText('í¸ê°ë','ëí ìºë¦­í° í¸ê°ë','íë'),
 withText('ë¯¸ëê²ì','ëë¯¸ ë¯¸ëê²ì','ê²ì'),
 simple('ìì ','ìí ëª©ë¡'),withText('êµ¬ë§¤','ìì´í êµ¬ë§¤','ìí'),withText('ê¾¸ë¯¸ê¸°','ìì´í ì¥ì°©','ìí'),
 simple('íë¡í','ë´ ê²ì íë¡í'),simple('ìì¦','ìì¦ ìí'),
 simple('ìì¦ë³´ì','ìì¦í¨ì¤ ìë ¹').addIntegerOption(o=>o.setName('ë¨ê³').setDescription('1~20').setRequired(true).setMinValue(1).setMaxValue(20)),
 withText('ìì¦ìì','ê´ë¦¬ì: 56ì¼ ìì¦ ìì½','ììì¼').setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
 withText('ê³ì ì­ì ','ê³ì  ìµëªí','íì¸'),simple('ëìë§','ëªë ¹ì´ ìë´')
];
function show(value:unknown):string {const s=JSON.stringify(value,null,2);return '[ëë¯¸ MOHAE]\n'+(s.length>1800?s.slice(0,1790)+'...':s);}
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
   case 'ê²ì':case 'íë¡í':r=await call('mohae','profile',base);break;
   case 'ì¶ì':r=await call('mohae','attendance',base);break;
   case 'ì¼í':{const topic=opt('ì£¼ì ');if(!(questTopics as readonly string[]).includes(topic))throw Error('INVALID_TOPIC');r=await call('mohae','daily',{...base,topic});break;}
   case 'ì£¼ê°í':{const w=await call<{week:string}>('mohae','weekly',base);r=i.options.getBoolean('ìë ¹')?await call('mohae','weekly-claim',{...base,week:w.week}):w;break;}
   case 'ë½ê¸°':r=await call('mohae','draw',{...base,banner:opt('ë°°ë'),quantity:i.options.getInteger('íì',true)});break;
   case 'ë½ê¸°ê¸°ë¡':r=await call('mohae','draw-history',base);break;
   case 'ëê°':r=await call('mohae','collection',base);break;
   case 'ì¹´ë':r=await call('mohae','cards',base);break;
   case 'ì¹´ëì ê¸':r=await call('mohae','lock',{...base,cardId:opt('ì¹´ëid'),locked:i.options.getBoolean('ì ê¸',true)});break;
   case 'ë¶í´':r=await call('mohae','dismantle',{...base,cardId:opt('ì¹´ëid'),confirm:i.options.getBoolean('íì¸',true)});break;
   case 'ëí':r=await call('mohae','representative',{...base,character:opt('ìºë¦­í°')});break;
   case 'í¸ê°ë':r=await call('mohae','affinity',{...base,kind:opt('íë')});break;
   case 'ë¯¸ëê²ì':{
    const game=opt('ê²ì');if(!(miniGames as readonly string[]).includes(game))throw Error('INVALID_MINIGAME');
    const s=await call<{id:string;question:string;choices:string[]}>('mohae','mini-start',{...base,game});
    const row=new ActionRowBuilder<ButtonBuilder>();
    for(const choice of s.choices)row.addComponents(new ButtonBuilder().setCustomId('mini:'+s.id+':'+choice).setLabel(choice).setStyle(ButtonStyle.Primary));
    await i.editReply({content:'[ëë¯¸] '+s.question,components:[row]});return;
   }
   case 'ìì ':r=cosmetics.filter(x=>x.price>0);break;
   case 'êµ¬ë§¤':r=await call('mohae','buy',{...base,sku:opt('ìí')});break;
   case 'ê¾¸ë¯¸ê¸°':r=await call('mohae','equip',{...base,sku:opt('ìí')});break;
   case 'ìì¦':r=await call('mohae','season',base);break;
   case 'ìì¦ë³´ì':r=await call('mohae','season-claim',{...base,tier:i.options.getInteger('ë¨ê³',true)});break;
   case 'ìì¦ìì':{
    if(!i.memberPermissions?.has(PermissionFlagsBits.ManageGuild))throw Error('PERMISSION_DENIED');
    const d=opt('ììì¼');if(!/^\d{4}-\d{2}-\d{2}$/.test(d))throw Error('INVALID_DATE');
    r=await call('mohae','season-activate',{...base,seasonId:'dummy_season_01',start:kstMondayFiveMs(d)});break;
   }
   case 'ê³ì ì­ì ':if(opt('íì¸')!=='DELETE')throw Error('CONFIRM_REQUIRED');r=await call('mohae','privacy-delete',base);break;
   case 'ëìë§':r=commands.map(c=>'/'+c.name);break;
   default:throw Error('UNKNOWN_COMMAND');
  }
  await i.editReply({content:show(r)});
 }catch(e){await i.editReply({content:'ì²ë¦¬ ì¤í¨: '+(e instanceof Error?e.message:'UNKNOWN').slice(0,140)}).catch(()=>{});}
});
await client.login(secret('MOHAE_BOT_TOKEN'));
