import {Client,GatewayIntentBits,Events,SlashCommandBuilder,MessageFlags,ActionRowBuilder,ButtonBuilder,ButtonStyle,PermissionFlagsBits,AttachmentBuilder} from 'discord.js';
import {call} from '../src/client.ts';
import {allowedGuild,secret} from '../src/secrets.ts';
import {kstMondayFiveMs} from '../src/time.ts';
import {cosmetics,miniGames,questTopics} from '../src/catalog.ts';
const client=new Client({intents:[GatewayIntentBits.Guilds]});
const simple=(name:string,description:string)=>new SlashCommandBuilder().setName(name).setDescription(description);
const withText=(name:string,description:string,opt:string)=>simple(name,description).addStringOption(o=>o.setName(opt).setDescription(opt).setRequired(true));
const commands=[
 simple('ÃªÂ²ÂÃ¬ÂÂ','ÃªÂ²ÂÃ¬ÂÂ Ã«Â©ÂÃ¬ÂÂ¸ Ã­ÂÂÃ«Â©Â´'),simple('Ã¬Â¶ÂÃ¬ÂÂ','Ã¬Â¶ÂÃ¬ÂÂ Ã«Â³Â´Ã¬ÂÂ'),
 withText('Ã¬ÂÂ¼Ã­ÂÂ','Ã¬ÂÂ¤Ã«ÂÂÃ¬ÂÂ Ã­ÂÂÃ¬ÂÂ¤Ã­ÂÂ¸','Ã¬Â£Â¼Ã¬Â Â'),
 simple('Ã¬Â£Â¼ÃªÂ°ÂÃ­ÂÂ','Ã¬Â£Â¼ÃªÂ°Â Ã«ÂªÂ©Ã­ÂÂÃ¬ÂÂ Ã«Â³Â´Ã¬ÂÂ').addBooleanOption(o=>o.setName('Ã¬ÂÂÃ«Â Â¹').setDescription('Ã«Â³Â´Ã¬ÂÂ Ã¬ÂÂÃ«Â Â¹').setRequired(false)),
 withText('Ã«Â½ÂÃªÂ¸Â°','Ã¬ÂºÂÃ«Â¦Â­Ã­ÂÂ° Ã«Â½ÂÃªÂ¸Â°','Ã«Â°Â°Ã«ÂÂ').addIntegerOption(o=>o.setName('Ã­ÂÂÃ¬ÂÂ').setDescription('1 Ã«ÂÂÃ«ÂÂ 10').setRequired(true).addChoices({name:'1',value:1},{name:'10',value:10})),
 simple('Ã«Â½ÂÃªÂ¸Â°ÃªÂ¸Â°Ã«Â¡Â','Ã«Â½ÂÃªÂ¸Â° ÃªÂ¸Â°Ã«Â¡Â'),simple('Ã«ÂÂÃªÂ°Â','Ã¬ÂºÂÃ«Â¦Â­Ã­ÂÂ° Ã«ÂÂÃªÂ°Â'),simple('Ã¬Â¹Â´Ã«ÂÂ','Ã«Â³Â´Ã¬ÂÂ  Ã¬Â¹Â´Ã«ÂÂ'),
 withText('Ã¬Â¹Â´Ã«ÂÂÃ¬ÂÂ ÃªÂ¸Â','Ã¬Â¹Â´Ã«ÂÂ Ã¬ÂÂ ÃªÂ¸Â Ã«Â³ÂÃªÂ²Â½','Ã¬Â¹Â´Ã«ÂÂid').addBooleanOption(o=>o.setName('Ã¬ÂÂ ÃªÂ¸Â').setDescription('Ã¬ÂÂ ÃªÂ·Â¸ÃªÂ¸Â°').setRequired(true)),
 withText('Ã«Â¶ÂÃ­ÂÂ´','Ã¬Â¤ÂÃ«Â³Âµ Ã¬Â¹Â´Ã«ÂÂ Ã«Â¶ÂÃ­ÂÂ´','Ã¬Â¹Â´Ã«ÂÂid').addBooleanOption(o=>o.setName('Ã­ÂÂÃ¬ÂÂ¸').setDescription('Ã«Â³ÂµÃªÂµÂ¬ Ã«Â¶ÂÃªÂ°ÂÃ«ÂÂ¥Ã­ÂÂ¨Ã¬ÂÂ Ã­ÂÂÃ¬ÂÂ¸').setRequired(true)),
 withText('Ã«ÂÂÃ­ÂÂ','Ã«ÂÂÃ­ÂÂ Ã¬ÂºÂÃ«Â¦Â­Ã­ÂÂ° Ã¬ÂÂ¤Ã¬Â Â','Ã¬ÂºÂÃ«Â¦Â­Ã­ÂÂ°'),withText('Ã­ÂÂ¸ÃªÂ°ÂÃ«ÂÂ','Ã«ÂÂÃ­ÂÂ Ã¬ÂºÂÃ«Â¦Â­Ã­ÂÂ° Ã­ÂÂ¸ÃªÂ°ÂÃ«ÂÂ','Ã­ÂÂÃ«ÂÂ'),
 withText('Ã«Â¯Â¸Ã«ÂÂÃªÂ²ÂÃ¬ÂÂ','Ã«ÂÂÃ«Â¯Â¸ Ã«Â¯Â¸Ã«ÂÂÃªÂ²ÂÃ¬ÂÂ','ÃªÂ²ÂÃ¬ÂÂ'),
 simple('Ã¬ÂÂÃ¬Â Â','Ã¬ÂÂÃ­ÂÂ Ã«ÂªÂ©Ã«Â¡Â'),withText('ÃªÂµÂ¬Ã«Â§Â¤','Ã¬ÂÂÃ¬ÂÂ´Ã­ÂÂ ÃªÂµÂ¬Ã«Â§Â¤','Ã¬ÂÂÃ­ÂÂ'),withText('ÃªÂ¾Â¸Ã«Â¯Â¸ÃªÂ¸Â°','Ã¬ÂÂÃ¬ÂÂ´Ã­ÂÂ Ã¬ÂÂ¥Ã¬Â°Â©','Ã¬ÂÂÃ­ÂÂ'),
 simple('Ã­ÂÂÃ«Â¡ÂÃ­ÂÂ','Ã«ÂÂ´ ÃªÂ²ÂÃ¬ÂÂ Ã­ÂÂÃ«Â¡ÂÃ­ÂÂ'),simple('Ã¬ÂÂÃ¬Â¦Â','Ã¬ÂÂÃ¬Â¦Â Ã¬ÂÂÃ­ÂÂ'),
 simple('Ã¬ÂÂÃ¬Â¦ÂÃ«Â³Â´Ã¬ÂÂ','Ã¬ÂÂÃ¬Â¦ÂÃ­ÂÂ¨Ã¬ÂÂ¤ Ã¬ÂÂÃ«Â Â¹').addIntegerOption(o=>o.setName('Ã«ÂÂ¨ÃªÂ³Â').setDescription('1~20').setRequired(true).setMinValue(1).setMaxValue(20)),
 withText('Ã¬ÂÂÃ¬Â¦ÂÃ¬ÂÂÃ¬ÂÂ','ÃªÂ´ÂÃ«Â¦Â¬Ã¬ÂÂ: 56Ã¬ÂÂ¼ Ã¬ÂÂÃ¬Â¦Â Ã¬ÂÂÃ¬ÂÂ½','Ã¬ÂÂÃ¬ÂÂÃ¬ÂÂ¼').setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
 withText('ÃªÂ³ÂÃ¬Â ÂÃ¬ÂÂ­Ã¬Â Â','ÃªÂ³ÂÃ¬Â Â Ã¬ÂÂµÃ«ÂªÂÃ­ÂÂ','Ã­ÂÂÃ¬ÂÂ¸'),simple('Ã«ÂÂÃ¬ÂÂÃ«Â§Â','Ã«ÂªÂÃ«Â Â¹Ã¬ÂÂ´ Ã¬ÂÂÃ«ÂÂ´')
];
function show(value:unknown):string {const s=JSON.stringify(value,null,2);return '[Ã«ÂÂÃ«Â¯Â¸ MOHAE]\n'+(s.length>1800?s.slice(0,1790)+'...':s);}
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
   case 'ÃªÂ²ÂÃ¬ÂÂ':case 'Ã­ÂÂÃ«Â¡ÂÃ­ÂÂ':r=await call('mohae','profile',base);break;
   case 'Ã¬Â¶ÂÃ¬ÂÂ':r=await call('mohae','attendance',base);break;
   case 'Ã¬ÂÂ¼Ã­ÂÂ':{const topic=opt('Ã¬Â£Â¼Ã¬Â Â');if(!(questTopics as readonly string[]).includes(topic))throw Error('INVALID_TOPIC');r=await call('mohae','daily',{...base,topic});break;}
   case 'Ã¬Â£Â¼ÃªÂ°ÂÃ­ÂÂ':{const w=await call<{week:string}>('mohae','weekly',base);r=i.options.getBoolean('Ã¬ÂÂÃ«Â Â¹')?await call('mohae','weekly-claim',{...base,week:w.week}):w;break;}
   case 'Ã«Â½ÂÃªÂ¸Â°':r=await call('mohae','draw',{...base,banner:opt('Ã«Â°Â°Ã«ÂÂ'),quantity:i.options.getInteger('Ã­ÂÂÃ¬ÂÂ',true)});break;
   case 'Ã«Â½ÂÃªÂ¸Â°ÃªÂ¸Â°Ã«Â¡Â':r=await call('mohae','draw-history',base);break;
   case 'Ã«ÂÂÃªÂ°Â':r=await call('mohae','collection',base);break;
   case 'Ã¬Â¹Â´Ã«ÂÂ':r=await call('mohae','cards',base);break;
   case 'Ã¬Â¹Â´Ã«ÂÂÃ¬ÂÂ ÃªÂ¸Â':r=await call('mohae','lock',{...base,cardId:opt('Ã¬Â¹Â´Ã«ÂÂid'),locked:i.options.getBoolean('Ã¬ÂÂ ÃªÂ¸Â',true)});break;
   case 'Ã«Â¶ÂÃ­ÂÂ´':r=await call('mohae','dismantle',{...base,cardId:opt('Ã¬Â¹Â´Ã«ÂÂid'),confirm:i.options.getBoolean('Ã­ÂÂÃ¬ÂÂ¸',true)});break;
   case 'Ã«ÂÂÃ­ÂÂ':r=await call('mohae','representative',{...base,character:opt('Ã¬ÂºÂÃ«Â¦Â­Ã­ÂÂ°')});break;
   case 'Ã­ÂÂ¸ÃªÂ°ÂÃ«ÂÂ':r=await call('mohae','affinity',{...base,kind:opt('Ã­ÂÂÃ«ÂÂ')});break;
   case 'Ã«Â¯Â¸Ã«ÂÂÃªÂ²ÂÃ¬ÂÂ':{
    const game=opt('ÃªÂ²ÂÃ¬ÂÂ');if(!(miniGames as readonly string[]).includes(game))throw Error('INVALID_MINIGAME');
    const s=await call<{id:string;question:string;choices:string[]}>('mohae','mini-start',{...base,game});
    const row=new ActionRowBuilder<ButtonBuilder>();
    for(const choice of s.choices)row.addComponents(new ButtonBuilder().setCustomId('mini:'+s.id+':'+choice).setLabel(choice).setStyle(ButtonStyle.Primary));
    await i.editReply({content:'[Ã«ÂÂÃ«Â¯Â¸] '+s.question,components:[row]});return;
   }
   case 'Ã¬ÂÂÃ¬Â Â':r=cosmetics.filter(x=>x.price>0);break;
   case 'ÃªÂµÂ¬Ã«Â§Â¤':r=await call('mohae','buy',{...base,sku:opt('Ã¬ÂÂÃ­ÂÂ')});break;
   case 'ÃªÂ¾Â¸Ã«Â¯Â¸ÃªÂ¸Â°':r=await call('mohae','equip',{...base,sku:opt('Ã¬ÂÂÃ­ÂÂ')});break;
   case 'Ã¬ÂÂÃ¬Â¦Â':r=await call('mohae','season',base);break;
   case 'Ã¬ÂÂÃ¬Â¦ÂÃ«Â³Â´Ã¬ÂÂ':r=await call('mohae','season-claim',{...base,tier:i.options.getInteger('Ã«ÂÂ¨ÃªÂ³Â',true)});break;
   case 'Ã¬ÂÂÃ¬Â¦ÂÃ¬ÂÂÃ¬ÂÂ':{
    if(!i.memberPermissions?.has(PermissionFlagsBits.ManageGuild))throw Error('PERMISSION_DENIED');
    const d=opt('Ã¬ÂÂÃ¬ÂÂÃ¬ÂÂ¼');if(!/^\d{4}-\d{2}-\d{2}$/.test(d))throw Error('INVALID_DATE');
    r=await call('mohae','season-activate',{...base,seasonId:'dummy_season_01',start:kstMondayFiveMs(d)});break;
   }
   case 'ÃªÂ³ÂÃ¬Â ÂÃ¬ÂÂ­Ã¬Â Â':if(opt('Ã­ÂÂÃ¬ÂÂ¸')!=='DELETE')throw Error('CONFIRM_REQUIRED');r=await call('mohae','privacy-delete',base);break;
   case 'Ã«ÂÂÃ¬ÂÂÃ«Â§Â':r=commands.map(c=>'/'+c.name);break;
   default:throw Error('UNKNOWN_COMMAND');
  }
  await i.editReply({content:show(r)});
 }catch(e){await i.editReply({content:'Ã¬Â²ÂÃ«Â¦Â¬ Ã¬ÂÂ¤Ã­ÂÂ¨: '+(e instanceof Error?e.message:'UNKNOWN').slice(0,140)}).catch(()=>{});}
});
await client.login(secret('MOHAE_BOT_TOKEN'));
