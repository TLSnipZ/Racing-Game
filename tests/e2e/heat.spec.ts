import { test, expect, type Page } from '@playwright/test';
import v6 from '../fixtures/save-v6.json' with { type: 'json' };
import { createNewGameState, purchaseStarter } from '../../src/domain/game';
import { createHeatState, startLayLow } from '../../src/domain/heat';
import { getRaceBuildKey, startRace, settleRace } from '../../src/domain/racing';
import { SAVE_VERSION } from '../../src/domain/persistence';
import { seed, seedRaw, read, stored, clock, tab, T } from './helpers';
const initial = (heat = 0) => {
  const game = purchaseStarter(createNewGameState(), 'pico-rs', 'pico-1');
  return { ...game, cashYen: 100000, playerLevel: 6, reputation: 300, heat: { ...game.heat, value: heat } };
};
const running = (heat=40) => { const game=initial(heat); return startRace(game,'dockyard-402','pico-1',getRaceBuildKey(game.ownedVehicles[0]),T+1000,'underground',heat); };
const incident = (heat=40) => { const game=running(heat); return settleRace(game,game.racing.activeRace!.runId,game.racing.activeRace!.finishesAtMs); };
const waiting = () => { const game=incident(); return startLayLow(game,game.heat.value,game.heat.nextCooldownId,T+1000); };
async function briefing(page:Page,name='Dockyard 402') { await tab(page,'Races');await page.getByRole('button',{name:`Briefing ${name}`,exact:true}).click();await expect(page.getByRole('dialog')).toBeVisible(); }
async function chooseRisk(page:Page) { await page.getByRole('radio',{name:'Underground stakes',exact:true}).check(); }
async function acceptPause(page:Page) { page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'LAY LOW · FREE',exact:true}).click(); }
const attention=(page:Page)=>page.getByTestId('heat-value');

test('the HUD explains driver Heat and routes to City without changing gameplay',async({page})=>{
  await seed(page,initial(24)); const before=await stored(page);
  await page.getByRole('button',{name:'Open Heat controls',exact:true}).click();
  await expect(page.getByRole('tabpanel')).toHaveAttribute('id','panel-city');await expect(page.locator('#heat-controls')).toBeFocused();
  await expect(attention(page)).toHaveText('24/100');expect(await stored(page)).toBe(before);
});
test('low-level and free-race Underground options are explicitly unavailable',async({page})=>{
  await seed(page,{...initial(),playerLevel:2,reputation:20});await briefing(page);
  await expect(page.getByRole('radio',{name:'Underground stakes',exact:true})).toBeDisabled();await expect(page.getByRole('dialog')).toContainText('Level 3');
  await page.keyboard.press('Escape');await briefing(page,'East Ward Shakedown');await expect(page.getByRole('dialog')).toContainText('free practice');
  await expect(page.getByRole('button',{name:'ENTER RACE',exact:true})).toBeEnabled();
});
test('briefing shows both police choices and net payouts before accepting, cancel is free',async({page})=>{
  await seed(page,initial(40));const before=await stored(page);await briefing(page);await chooseRisk(page);
  await expect(page.getByTestId('race-risk-preview')).toContainText('Heat 40 → 52');await expect(page.getByTestId('race-risk-preview')).toContainText('¥1,500');
  await expect(page.getByTestId('race-risk-preview')).toContainText('free 60s');await expect(page.getByRole('dialog')).toContainText('¥8,250');
  await expect(page.getByRole('columnheader',{name:'Net / fine',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'CANCEL',exact:true}).click();expect(await stored(page)).toBe(before);
  await briefing(page);await expect(page.getByRole('radio',{name:'Standard stakes',exact:true})).toBeChecked();
});
test('Underground entry applies heat and fee once; another section never pays it',async({page})=>{
  await clock(page);await seed(page,initial(40));await briefing(page);await chooseRisk(page);
  await page.getByRole('button',{name:'ENTER RACE',exact:true}).evaluate((b:HTMLButtonElement)=>{b.click();b.click();});
  await expect(attention(page)).toHaveText('52/100');await expect(page.getByTestId('cash')).toHaveText('¥99,000');
  const before=await read(page);expect(before.racing.nextRunId).toBe(2);expect(before.heat.pendingStop).toBeNull();
  await tab(page,'Market');await page.clock.runFor(18000);await expect(page.getByTestId('race-ready-badge')).toBeVisible();
  expect(await read(page)).toEqual(before);await page.reload();expect(await read(page)).toEqual(before);
  await tab(page,'Races');await page.getByRole('button',{name:'SETTLE RESULT',exact:true}).click();
  expect((await read(page)).heat.pendingStop?.fineYen).toBe(1500);await expect(page.getByRole('complementary',{name:'Heat activity notice'})).toBeVisible();
  await expect(page.getByTestId('heat-ready-badge')).toHaveText('ALERT');
});
test('standard races remain opt-out by default and create neither Heat nor a ticket',async({page})=>{
  await clock(page);await seed(page,initial(80));await briefing(page);
  await page.getByRole('button',{name:'ENTER RACE',exact:true}).click();await page.clock.runFor(18000);
  await page.getByRole('button',{name:'SETTLE RESULT',exact:true}).click();
  expect((await read(page)).heat.value).toBe(80);expect((await read(page)).heat.pendingStop).toBeNull();
});
test('the fine needs confirmation, pays exactly once and changes no cars or race records',async({page})=>{
  await seed(page,incident());await page.getByRole('button',{name:'OPEN HEAT CONTROLS',exact:true}).click();const before=await read(page);
  page.once('dialog',d=>d.dismiss());await page.getByRole('button',{name:'PAY ¥1,500 FINE',exact:true}).click();expect(await read(page)).toEqual(before);
  page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'PAY ¥1,500 FINE',exact:true}).evaluate((b:HTMLButtonElement)=>{b.click();b.click();});
  const after=await read(page);expect(after.cashYen).toBe(before.cashYen-1500);expect(after.heat.value).toBe(22);expect(after.heat.pendingStop).toBeNull();
  expect(after.ownedVehicles).toEqual(before.ownedVehicles);expect(after.racing).toEqual(before.racing);await expect(page.getByTestId('heat-receipt')).toContainText('Fine paid');
});
test('zero-cash recovery is free, manual, persistent and allows shopping during the pause',async({page})=>{
  await clock(page);const game={...incident(65),cashYen:0};await seed(page,game);await tab(page,'City');
  await expect(page.getByRole('button',{name:'PAY ¥3,000 FINE',exact:true})).toBeDisabled();await acceptPause(page);const before=await read(page);
  await tab(page,'Jobs');await expect(page.getByRole('button',{name:'Start Garage Shift',exact:true})).toBeDisabled();
  await tab(page,'Market');await expect(page.getByRole('tabpanel')).toHaveAttribute('id','panel-market');
  await page.clock.runFor(60000);await expect(page.getByTestId('heat-ready-badge')).toHaveText('READY');expect(await read(page)).toEqual(before);
  await page.reload();await page.getByRole('button',{name:'OPEN HEAT CONTROLS',exact:true}).click();
  await page.getByRole('button',{name:'FINISH LAY LOW',exact:true}).evaluate((b:HTMLButtonElement)=>{b.click();b.click();});
  expect((await read(page)).heat.value).toBe(37);expect((await read(page)).cashYen).toBe(0);expect((await read(page)).heat.pendingStop).toBeNull();
  await tab(page,'Jobs');await expect(page.getByRole('button',{name:'Start Garage Shift',exact:true})).toBeEnabled();
});
test('each legal job reduces Heat only when its reward is claimed',async({page})=>{
  await clock(page);await seed(page,initial(12));await tab(page,'Jobs');await page.getByRole('button',{name:'Start Garage Shift',exact:true}).click();
  await tab(page,'City');await page.clock.runFor(15000);await expect(attention(page)).toHaveText('12/100');
  await tab(page,'Jobs');await page.getByRole('button',{name:'CLAIM REWARD',exact:true}).click();await expect(attention(page)).toHaveText('6/100');
});
test('withdrawal keeps entry Heat and still presents the announced patrol choice',async({page})=>{
  await seed(page,running());await tab(page,'Races');page.once('dialog',async d=>{expect(d.message()).toContain('Heat remains');await d.accept();});
  await page.getByRole('button',{name:'WITHDRAW',exact:true}).click();expect((await read(page)).heat.value).toBe(52);expect((await read(page)).heat.pendingStop?.fineYen).toBe(1500);
});
test('85+ Heat blocks new Underground mode but standard events stay accessible',async({page})=>{
  await seed(page,initial(85));await briefing(page);await expect(page.getByRole('radio',{name:'Underground stakes',exact:true})).toBeDisabled();
  await expect(page.getByRole('dialog')).toContainText('85');await expect(page.getByRole('button',{name:'ENTER RACE',exact:true})).toBeEnabled();
});
test('clock rollback blocks finishing but cancelling does not erase the alert or Heat',async({page})=>{
  await clock(page);const game=incident();await seed(page,startLayLow(game,game.heat.value,game.heat.nextCooldownId,T+10000));await tab(page,'City');
  await expect(page.getByRole('article',{name:'Current Lay low pause',exact:true})).toContainText('CLOCK ERROR');
  await expect(page.getByRole('button',{name:'FINISH LAY LOW',exact:true})).toBeDisabled();
  page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'CANCEL LAY LOW',exact:true}).click();
  expect((await read(page)).heat.pendingStop).toEqual(game.heat.pendingStop);expect((await read(page)).heat.value).toBe(game.heat.value);
});
for(const action of ['entry','fine','pause','finish'] as const){
  test(`failed ${action} write cannot consume cash, Heat, alert, prize or recovery`,async({page})=>{
    await clock(page);await seed(page,action==='entry'?initial(40):action==='finish'?waiting():incident());
    if(action==='entry'){await briefing(page);await chooseRisk(page);}else await tab(page,'City');
    if(action==='finish')await page.clock.runFor(60000);
    const before=await stored(page);await page.evaluate(()=>{Storage.prototype.setItem=()=>{throw new Error('Storage full');};});
    if(action==='entry')await page.getByRole('button',{name:'ENTER RACE',exact:true}).click();
    if(action==='fine'){page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'PAY ¥1,500 FINE',exact:true}).click();}
    if(action==='pause')await acceptPause(page);
    if(action==='finish')await page.getByRole('button',{name:'FINISH LAY LOW',exact:true}).click();
    expect(await stored(page)).toBe(before);if(action==='entry')await page.keyboard.press('Escape');await expect(page.locator('.recoveryPanel')).toContainText('Could not save');
  });
}
for(const kind of ['race','alert','pause'] as const){
  test(`full export reset import preserves the ${kind} and all prior systems`,async({page})=>{
    await clock(page);await seed(page,kind==='race'?running():kind==='alert'?incident():waiting());const before=await read(page);await tab(page,'Saves');
    await page.getByRole('button',{name:'GENERATE SAVE CODE',exact:true}).click();const code=await page.getByRole('textbox',{name:'Exported save code',exact:true}).inputValue();
    page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'RESET SAVEGAME',exact:true}).click();await expect(attention(page)).toHaveText('0/100');
    await tab(page,'Saves');await page.getByRole('textbox',{name:'Save code to import',exact:true}).fill(code);
    page.once('dialog',async d=>{expect(d.message()).toContain('Heat:');await d.accept();});await page.getByRole('button',{name:'VALIDATE & IMPORT',exact:true}).click();
    expect(await read(page)).toEqual(before);await page.reload();expect(await read(page)).toEqual(before);
  });
}
test('a stale browser tab cannot pay the same patrol fine twice',async({page,context})=>{
  await seed(page,incident());await tab(page,'City');const other=await context.newPage();await other.goto('./');await tab(other,'City');
  const before=await read(page);other.once('dialog',d=>d.accept());await other.getByRole('button',{name:'PAY ¥1,500 FINE',exact:true}).click();
  await expect(page.locator('.recoveryPanel')).toContainText('Another tab changed');await expect(page.getByRole('button',{name:'PAY ¥1,500 FINE',exact:true})).toBeDisabled();
  expect((await read(page)).cashYen).toBe(before.cashYen-1500);
});
test('released v6 market and paid race migrate unchanged, without retrospective police',async({page})=>{
  await seedRaw(page,JSON.stringify(v6));await expect(page.locator('.saveIndicator')).toContainText(`SAVE V${SAVE_VERSION}`);
  const {collection,heat,...old}=await read(page);expect(old).toEqual(v6.state);expect(heat).toEqual(createHeatState());
  await tab(page,'Races');await page.getByRole('button',{name:'SETTLE RESULT',exact:true}).click();expect((await read(page)).heat).toEqual(createHeatState());
});
test('malformed current Heat is protected, not replaced by a clean record',async({page})=>{
  const raw=JSON.stringify({version:7,savedAt:T,state:{...initial(),heat:{value:0}}});await seedRaw(page,raw);
  await expect(page.locator('.recoveryPanel')).toContainText('stored save is protected');expect(await stored(page)).toBe(raw);
});
for(const [name,width,height] of [['desktop',1440,1000],['mobile',390,844],['narrow',320,780]] as const){
  test(`${name} Heat, XP, stakes and recovery fit within the persistent seven-tab shell`,async({page})=>{
    const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width,height});await clock(page);await seed(page,initial(40));
    for(const section of ['Garage','Jobs','City','Races','Workshop','Market','Saves'] as const){await tab(page,section);await page.evaluate(()=>window.scrollTo(0,650));
      await expect(attention(page)).toBeInViewport();await expect(page.getByTestId('cash')).toBeInViewport();await expect(page.getByRole('progressbar',{name:'Level XP progress',exact:true})).toBeInViewport();
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
    await briefing(page);await chooseRisk(page);await page.screenshot({path:`test-results/heat-briefing-${name}.png`});
    expect((await page.getByRole('dialog').boundingBox())!.width).toBeLessThanOrEqual(width);
    await page.getByRole('button',{name:'ENTER RACE',exact:true}).click();await page.clock.runFor(18000);await page.getByRole('button',{name:'SETTLE RESULT',exact:true}).click();
    await page.getByRole('button',{name:'OPEN HEAT CONTROLS',exact:true}).click();await page.screenshot({path:`test-results/heat-patrol-${name}.png`,fullPage:true});
    await acceptPause(page);await page.clock.runFor(20000);await page.screenshot({path:`test-results/heat-cooldown-${name}.png`});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);
  });
}
