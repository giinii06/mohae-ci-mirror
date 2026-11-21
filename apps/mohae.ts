import {Client,GatewayIntentBits,Events,SlashCommandBuilder,MessageFlags,ActionRowBuilder,ButtonBuilder,ButtonStyle,PermissionFlagsBits} from 'discord.js';
import {call} from '../src/client.ts';
import {allowedGuild,secret} from '../src/secrets.ts';
import {kstMondayFiveMs} from '../src/time.ts';
import {cosmetics,miniGames,questTopics} from '../src/catalog.ts';
const client=new Client({intents:[GatewayIntentBits.Guilds]});
const simple=(name:string,description:string)=>new SlashCommandBuilder().setName(name).setDescription(description);
const withText=(name:string,description:string,opt:string)=>simple(name,description).addStringOption(o=>o.setName(opt).setDescription(opt).setRequired(true));
const commands=[
 simple('게임','게임 메인 화면'),simple('출석','출석 보상'),
 withText('일퀘','오늘의 퀘스트','주제'),
 simple('주간퀘','주간 목표와 보상').addBooleanOption(o=>o.setName('수령').setDescription('보상 수령').setRequired(false)),
 withText('뽑기','캐릭터 뽑기','배너').addIntegerOption(o=>o.setName('횟수').setDescription('1 또는 10').setRequired(true).addChoices({name:'1',value:1},{name:'10',value:10})),
 simple('뽑기기록','뽑기 기록'),simple('도감','캐릭터 도감'),simple('카드','보유 카드'),
 withText('카드잠금','카드 잠금 변경','카드id').addBooleanOption(o=>o.setName('잠금').setDescription('잠그기').setRequired(true)),
 withText('분해','중복 카드 분해','카드id').addBooleanOption(o=>o.setName('확인').setDescription('복구 불가능함을 확인').setRequired(true)),
 withText('대표','대표 캐릭터 설정','캐릭터'),withText('호감도','대표 캐릭터 호감도','행동'),
 withText('미니게임','더미 미니게임','게임'),
 simple('상점','상품 목록'),withText('구매','아이템 구매','상품'),withText('꾸미기','아이템 장착','상품'),
 simple('프로필','내 게임 프로필'),simple('시즌','시즌 상태'),
 simple('시즌보상','시즌패스 수령').addIntegerOption(o=>o.setName('단계').setDescription('1~20').setRequired(true).setMinValue(1).setMaxValue(20)),
 withText('시즌시작','관리자: 56일 시즌 예약','시작일').setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
 withText('계정삭제','계정 익명화','확인'),simple('도움말','명령어 안내')
];
function show(value:unknown):string {const s=JSON.stringify(value,null,2);return '[더미 MOHAE]\n'+(s.length>1800?s.slice(0,1790)+'...':s);}
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
   case '게임':case '프로필':r=await call('mohae','profile',base);break;
   case '출석':r=await call('mohae','attendance',base);break;
   case '일퀘':{const topic=opt('주제');if(!(questTopics as readonly string[]).includes(topic))throw Error('INVALID_TOPIC');r=await call('mohae','daily',{...base,topic});break;}
   case '주간퀘':{const w=await call<{week:string}>('mohae','weekly',base);r=i.options.getBoolean('수령')?await call('mohae','weekly-claim',{...base,week:w.week}):w;break;}
   case '뽑기':r=await call('mohae','draw',{...base,banner:opt('배너'),quantity:i.options.getInteger('횟수',true)});break;
   case '뽑기기록':r=await call('mohae','draw-history',base);break;
   case '도감':r=await call('mohae','collection',base);break;
   case '카드':r=await call('mohae','cards',base);break;
   case '카드잠금':r=await call('mohae','lock',{...base,cardId:opt('카드id'),locked:i.options.getBoolean('잠금',true)});break;
   case '분해':r=await call('mohae','dismantle',{...base,cardId:opt('카드id'),confirm:i.options.getBoolean('확인',true)});break;
   case '대표':r=await call('mohae','representative',{...base,character:opt('캐릭터')});break;
   case '호감도':r=await call('mohae','affinity',{...base,kind:opt('행동')});break;
   case '미니게임':{
    const game=opt('게임');if(!(miniGames as readonly string[]).includes(game))throw Error('INVALID_MINIGAME');
    const s=await call<{id:string;question:string;choices:string[]}>('mohae','mini-start',{...base,game});
    const row=new ActionRowBuilder<ButtonBuilder>();
    for(const choice of s.choices)row.addComponents(new ButtonBuilder().setCustomId('mini:'+s.id+':'+choice).setLabel(choice).setStyle(ButtonStyle.Primary));
    await i.editReply({content:'[더미] '+s.question,components:[row]});return;
   }
   case '상점':r=cosmetics.filter(x=>x.price>0);break;
   case '구매':r=await call('mohae','buy',{...base,sku:opt('상품')});break;
   case '꾸미기':r=await call('mohae','equip',{...base,sku:opt('상품')});break;
   case '시즌':r=await call('mohae','season',base);break;
   case '시즌보상':r=await call('mohae','season-claim',{...base,tier:i.options.getInteger('단계',true)});break;
   case '시즌시작':{
    if(!i.memberPermissions?.has(PermissionFlagsBits.ManageGuild))throw Error('PERMISSION_DENIED');
    const d=opt('시작일');if(!/^\d{4}-\d{2}-\d{2}$/.test(d))throw Error('INVALID_DATE');
    r=await call('mohae','season-activate',{...base,seasonId:'dummy_season_01',start:kstMondayFiveMs(d)});break;
   }
   case '계정삭제':if(opt('확인')!=='DELETE')throw Error('CONFIRM_REQUIRED');r=await call('mohae','privacy-delete',base);break;
   case '도움말':r=commands.map(c=>'/'+c.name);break;
   default:throw Error('UNKNOWN_COMMAND');
  }
  await i.editReply({content:show(r)});
 }catch(e){await i.editReply({content:'처리 실패: '+(e instanceof Error?e.message:'UNKNOWN').slice(0,140)}).catch(()=>{});}
});
await client.login(secret('MOHAE_BOT_TOKEN'));
