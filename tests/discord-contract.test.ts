import {test,expect} from 'bun:test';

// Static contract proof: these literals are what Discord's command registrar receives.
// A successful TypeScript build does not validate Discord's slash-command name rules.
for (const file of ['apps/mohae.ts','apps/polly.ts','src/catalog.ts','src/game.ts']) {
  test(file+' contains no broken UTF-8 literals',async()=>{
    const source=await Bun.file(new URL('../'+file,import.meta.url)).text();
    expect(source).not.toMatch(/[\u0080-\u009f]/u);
    expect(source).not.toContain('Ã');
    expect(source).not.toContain('Ã');
  });
}
for (const file of ['apps/mohae.ts','apps/polly.ts']) {
  test(file+' slash command names are valid Discord names',async()=>{
    const source=await Bun.file(new URL('../'+file,import.meta.url)).text();
    const names=[...source.matchAll(/(?:\.setName|\bsimple|\bwithText)\('([^']+)'/gu)].map(m=>m[1]);
    expect(names.length).toBeGreaterThan(4);
    for(const name of names) {
      expect(name).toMatch(/^[\p{Ll}\p{Lm}\p{Lo}\p{N}_-]{1,32}$/u);
    }
  });
}
test('Polly handles every declared moderation command',async()=>{
  const source=await Bun.file(new URL('../apps/polly.ts',import.meta.url)).text();
  for(const name of ['신고','신고상태','신고목록','신고처리']){
    expect(source).toContain("case '"+name+"'");
  }
  for(const action of ['report-status','report-list','report-update']) {
    expect(source).toContain("'"+action+"'");
  }
});


test('MOHAE exposes the approved player and manager actions',async()=>{
  const source=await Bun.file(new URL('../apps/mohae.ts',import.meta.url)).text();
  for(const command of ['천장','자동분해설정','자동분해','공개설정','다른프로필',
    '일지','일지삭제','내보내기','이벤트','이벤트보상','이벤트시작',
    '협동','협동참여','협동보상','협동시작','닉네임색']){
    expect(source).toContain("case '"+command+"'");
  }
  for(const action of ['pity','auto-settings','auto-dismantle','visibility',
    'public-profile','journal','journal-delete','export','event',
    'event-claim','event-enable','coop','coop-contribute',
    'coop-claim','coop-enable']){
    expect(source).toContain("'"+action+"'");
  }
});
