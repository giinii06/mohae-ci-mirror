import {Client,GatewayIntentBits,Events,SlashCommandBuilder,MessageFlags,ActionRowBuilder,ButtonBuilder,ButtonStyle,PermissionFlagsBits,AttachmentBuilder} from 'discord.js';
import {call} from '../src/client.ts';
import {allowedGuild,secret} from '../src/secrets.ts';
import {kstMondayFiveMs} from '../src/time.ts';
import {cosmetics,miniGames,questTopics} from '../src/catalog.ts';
import {parseColorRoleIds} from '../src/roles.ts';
const roleLocks=new Set<string>();
const client=new Client({intents:[GatewayIntentBits.Guilds]});
const simple=(name:string,description:string)=>new SlashCommandBuilder().setName(name).setDescription(description);
const withText=(name:string,description:string,opt:string)=>simple(name,description).addStringOption(o=>o.setName(opt).setDescription(opt).setRequired(true));
const commands=[
 simple('게임','게임 메인 화면'),simple('출석','출석 보상'),
 simple('일퀘','오늘의 퀘스트')
  .addStringOption(o=>o.setName('주제').setDescription('퀘스트 주제').setRequired(true).addChoices(
   {name:'칭찬',value:'praise'},{name:'좋은 하루',value:'good_day'},{name:'감사',value:'thanks'},
   {name:'스스로 위로',value:'self_comfort'},{name:'휴식',value:'rest'}))
  .addStringOption(o=>o.setName('기록').setDescription('선택 사항: 1~1000자').setMaxLength(1000))
  .addBooleanOption(o=>o.setName('저장').setDescription('기록을 암호화해서 보관 (기본값: 저장 안 함)')),
 simple('주간퀘','주간 목표와 보상').addBooleanOption(o=>o.setName('수령').setDescription('보상 수령').setRequired(false)),
 simple('뽑기','캐릭터 뽑기')
  .addStringOption(o=>o.setName('배너').setDescription('뽑기 배너').setRequired(true).addChoices(
   {name:'상시',value:'standard'},{name:'한정',value:'limited'}))
  .addIntegerOption(o=>o.setName('횟수').setDescription('1 또는 10').setRequired(true).addChoices({name:'1',value:1},{name:'10',value:10})),
 simple('뽑기기록','뽑기 기록'),simple('도감','캐릭터 도감'),simple('카드','보유 카드'),
 withText('카드잠금','카드 잠금 변경','카드id').addBooleanOption(o=>o.setName('잠금').setDescription('잠그기').setRequired(true)),
 withText('분해','중복 카드 분해','카드id').addBooleanOption(o=>o.setName('확인').setDescription('복구 불가능함을 확인').setRequired(true)),
 withText('대표','대표 캐릭터 설정','캐릭터'),withText('호감도','대표 캐릭터 호감도','행동'),
 withText('미니게임','더미 미니게임','게임'),
 simple('상점','상품 목록'),withText('구매','아이템 구매','상품'),withText('꾸미기','아이템 장착','상품'),
 simple('프로필','내 게임 프로필'),simple('시즌','시즌 상태'),
 simple('천장','뽑기 천장·확정 상태'),
 simple('자동분해설정','중복 자동분해 설정 확인'),
 simple('자동분해','중복 자동분해 ON/OFF')
  .addIntegerOption(o=>o.setName('등급').setDescription('1성 또는 2성').setRequired(true).addChoices({name:'1성',value:1},{name:'2성',value:2}))
  .addBooleanOption(o=>o.setName('사용').setDescription('자동분해 활성화 여부').setRequired(true)),
 simple('공개설정','다른 사용자에게 프로필 공개 여부')
  .addBooleanOption(o=>o.setName('공개').setDescription('공개 여부').setRequired(true)),
 simple('다른프로필','공개된 다른 사람의 프로필 보기')
  .addUserOption(o=>o.setName('대상').setDescription('조회할 사용자').setRequired(true)),
 simple('일지','개인 암호화 일지 조회')
  .addStringOption(o=>o.setName('날짜').setDescription('YYYY-MM-DD (기본 오늘)').setRequired(false)),
 simple('일지삭제','개인 암호화 일지 삭제')
  .addBooleanOption(o=>o.setName('확인').setDescription('복원할 수 없음').setRequired(true))
  .addStringOption(o=>o.setName('날짜').setDescription('YYYY-MM-DD (기본 오늘)').setRequired(false)),
 simple('내보내기','내 데이터 JSON 내보내기'),
 simple('이벤트','이벤트 상태'),
 simple('이벤트보상','이벤트 보상 청구')
  .addStringOption(o=>o.setName('이벤트').setDescription('이벤트').setRequired(true).addChoices(
   {name:'2주차',value:'dummy_event_02'},{name:'4주차',value:'dummy_event_04'},{name:'6주차',value:'dummy_event_06'})),
 simple('이벤트시작','관리자: 이벤트 활성화').setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addStringOption(o=>o.setName('이벤트').setDescription('이벤트').setRequired(true).addChoices(
   {name:'2주차',value:'dummy_event_02'},{name:'4주차',value:'dummy_event_04'},{name:'6주차',value:'dummy_event_06'})),
 simple('협동','서버 협동 목표 상태'),simple('협동참여','협동 목표 기여'),simple('협동보상','협동 보상 수령'),
 simple('협동시작','관리자: 서버 협동 목표 생성').setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addIntegerOption(o=>o.setName('목표').setDescription('5~10000').setRequired(true).setMinValue(5).setMaxValue(10000)),
 simple('닉네임색','미리 설정된 12가지 색상 역할 선택')
  .addIntegerOption(o=>o.setName('번호').setDescription('0은 색상 해제, 1~12 선택').setRequired(true).setMinValue(0).setMaxValue(12)),
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
 if(!i.deferred)return;
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
   case '일퀘':{const topic=opt('주제');if(!(questTopics as readonly string[]).includes(topic))throw Error('INVALID_TOPIC');r=await call('mohae','daily',{...base,topic,note:i.options.getString('기록')??undefined,save:i.options.getBoolean('저장')===true});break;}
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
   case '천장':r=await call('mohae','pity',base);break;
   case '자동분해설정':r=await call('mohae','auto-settings',base);break;
   case '자동분해':r=await call('mohae','auto-dismantle',{...base,
     rarity:i.options.getInteger('등급',true),enabled:i.options.getBoolean('사용',true)});break;
   case '공개설정':r=await call('mohae','visibility',{...base,visible:i.options.getBoolean('공개',true)});break;
   case '다른프로필':r=await call('mohae','public-profile',{...base,target:i.options.getUser('대상',true).id});break;
   case '일지':r=await call('mohae','journal',{...base,day:i.options.getString('날짜')??undefined});break;
   case '일지삭제':{
     if(i.options.getBoolean('확인',true)!==true)throw Error('CONFIRM_REQUIRED');
     r=await call('mohae','journal-delete',{...base,day:i.options.getString('날짜')??undefined});break;
   }
   case '내보내기':{
     const data=await call('mohae','export',base);
     const bytes=Buffer.from(JSON.stringify(data,null,2),'utf8');
     if(bytes.byteLength>8*1024*1024)throw Error('EXPORT_TOO_LARGE');
     await i.editReply({content:'내 데이터 내보내기 (본인에게만 공개)',
       files:[new AttachmentBuilder(bytes,{name:'mohae-export.json'})]});return;
   }
   case '이벤트':r=await call('mohae','event',base);break;
   case '이벤트보상':r=await call('mohae','event-claim',{...base,eventId:opt('이벤트')});break;
   case '이벤트시작':{
     if(!i.memberPermissions?.has(PermissionFlagsBits.ManageGuild))throw Error('PERMISSION_DENIED');
     r=await call('mohae','event-enable',{...base,eventId:opt('이벤트')});break;
   }
   case '협동':r=await call('mohae','coop',base);break;
   case '협동참여':r=await call('mohae','coop-contribute',base);break;
   case '협동보상':r=await call('mohae','coop-claim',base);break;
   case '협동시작':{
     if(!i.memberPermissions?.has(PermissionFlagsBits.ManageGuild))throw Error('PERMISSION_DENIED');
     r=await call('mohae','coop-enable',{...base,target:i.options.getInteger('목표',true)});break;
   }
   case '닉네임색':{
     const key=i.guildId+':'+i.user.id;
     if(roleLocks.has(key))throw Error('COLOR_CHANGE_BUSY');
     roleLocks.add(key);
     try{
       const ids=parseColorRoleIds(process.env.MOHAE_COLOR_ROLE_IDS??'');
       const color=i.options.getInteger('번호',true);
       const guild=i.guild;if(!guild)throw Error('GUILD_REQUIRED');
       const member=await guild.members.fetch(i.user.id);
       const next=color===0?null:ids[color-1];
       if(next&&!guild.roles.cache.has(next))throw Error('COLOR_ROLE_NOT_FOUND');
       if(next&&!member.roles.cache.has(next))await member.roles.add(next);
       const old=ids.filter(id=>id!==next&&member.roles.cache.has(id));
       if(old.length)await member.roles.remove(old);
       r={changed:true,color};
     }finally{roleLocks.delete(key)}
     break;
   }
   case '도움말':r=commands.map(c=>'/'+c.name);break;
   default:throw Error('UNKNOWN_COMMAND');
  }
  await i.editReply({content:show(r)});
 }catch(e){await i.editReply({content:'처리 실패: '+(e instanceof Error?e.message:'UNKNOWN').slice(0,140)}).catch(()=>{});}
});
await client.login(secret('MOHAE_BOT_TOKEN'));
