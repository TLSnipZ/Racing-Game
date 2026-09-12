import { test, expect, type Page } from '@playwright/test';
import { RIVAL_CHALLENGES } from '../../src/data/rivals';
import { createNewGameState, createPlayerVehicle, purchaseStarter } from '../../src/domain/game';
import { carForEvent, preparedRivalWorld, qualifiedRivalWorld, defeatedRivalWorld, raceToEnd } from '../support/rivals';
import { getRaceBuildKey, startRace } from '../../src/domain/racing';
import { performEmpireAction, getEmpireQuote } from '../../src/domain/empire';
import { deserializeSave } from '../../src/domain/persistence';
import { tab, seed, seedRaw, stored, read, clock, T } from './helpers';
import v10 from '../fixtures/save-v10.json' with { type: 'json' };
const first = RIVAL_CHALLENGES[0];
const initial = () => purchaseStarter(createNewGameState(),'pico-rs','first');
async function board(page: Page) { await tab(page,'Races'); await page.getByRole('group',{name:'Race boards'}).getByRole('button',{name:'Rival Crews',exact:true}).click(); }
async function brief(page: Page, index=0) {
  await page.getByRole('button',{name:`Briefing ${RIVAL_CHALLENGES[index].event.name}`,exact:true}).click();
  await expect(page.getByRole('dialog')).toBeVisible();
}
async function finish(page: Page) {
  const race=(await read(page)).racing.activeRace!;await page.clock.runFor(Math.max(0,race.finishesAtMs-await page.evaluate(()=>Date.now())));
}
async function raceCar(page: Page, index=0) {
  const s=await read(page);await page.getByRole('combobox',{name:'Race vehicle',exact:true}).selectOption(carForEvent(s,RIVAL_CHALLENGES[index].event.id).instanceId);
}
function runningWorld() {
  const s=qualifiedRivalWorld(),car=carForEvent(s,first.event.id);
  return startRace(s,first.event.id,car.instanceId,getRaceBuildKey(car),T+1000);
}

test('Rival Crews is a read-only subview of Races; nine tabs and eight open events remain',async({page})=>{
  await seed(page,initial());const before=await stored(page);await expect(page.getByRole('tab')).toHaveCount(9);
  await tab(page,'Races');await expect(page.getByRole('group',{name:'Race boards'}).getByRole('button',{name:'Open events'})).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('.raceEventCard:visible')).toHaveCount(8);await board(page);
  await expect(page.locator('.rivalCard:visible')).toHaveCount(5);await expect(page.locator('.raceEventCard:visible')).toHaveCount(0);
  await expect(page.getByRole('tabpanel')).toHaveCount(1);await expect(page.getByTestId('rival-title')).toHaveText('Challenger');
  await tab(page,'Garage');await tab(page,'Races');await expect(page.getByRole('heading',{name:'The city knows your name.'})).toBeVisible();expect(await stored(page)).toBe(before);
});
test('locked briefing exposes level, qualifying podium and distinct bonus before any payment',async({page})=>{
  await seed(page,initial());await board(page);const before=await stored(page);await brief(page);
  await expect(page.getByRole('dialog')).toContainText('NEEDED · Level 6');await expect(page.getByRole('dialog')).toContainText('Dockyard Redline');
  await expect(page.getByRole('dialog')).toContainText('¥20,000');await expect(page.getByRole('button',{name:'ENTER RACE',exact:true})).toBeDisabled();
  await expect(page.getByRole('radio',{name:'Underground stakes'})).toHaveCount(0);
  await page.getByRole('button',{name:'CANCEL',exact:true}).click();expect(await stored(page)).toBe(before);
});
test('qualifier shortcut uses the real dialog and only a settled podium opens the invitation',async({page})=>{
  await clock(page);await seed(page,preparedRivalWorld());await board(page);await raceCar(page);
  await expect(page.getByRole('list',{name:'Ironline invitation requirements'})).toContainText('NEEDED · Settle a podium');
  await page.getByRole('button',{name:'Qualifier for Ironline',exact:true}).click();await expect(page.getByRole('dialog')).toContainText('Dockyard Redline');
  await page.getByRole('button',{name:'ENTER RACE',exact:true}).click();await finish(page);
  await expect(page.getByRole('list',{name:'Ironline invitation requirements'})).toContainText('NEEDED · Settle a podium');
  await page.getByRole('button',{name:'SETTLE RESULT',exact:true}).click();
  await expect(page.getByRole('list',{name:'Ironline invitation requirements'})).toContainText('MET · Settle a podium');
});
test('boss entry charges once; replay survives reload and settlement unlocks but does not pay the title bonus',async({page})=>{
  await clock(page);await seed(page,qualifiedRivalWorld());await board(page);await raceCar(page);const before=await read(page);
  await brief(page);await page.getByRole('button',{name:'ENTER RACE',exact:true}).evaluate((b:HTMLButtonElement)=>{b.click();b.click();});
  const pending=await read(page);expect(pending.cashYen).toBe(before.cashYen-4000);expect(pending.racing.nextRunId).toBe(before.racing.nextRunId+1);
  await tab(page,'Empire');await finish(page);await expect(page.getByTestId('race-ready-badge')).toBeVisible();expect(await read(page)).toEqual(pending);
  await page.reload();await board(page);expect((await read(page)).racing.activeRace).toEqual(pending.racing.activeRace);
  await page.getByRole('button',{name:'SETTLE RESULT',exact:true}).evaluate((b:HTMLButtonElement)=>{b.click();b.click();});
  const won=await read(page);expect(won.racing.lastResult?.position).toBe(1);expect(won.cashYen).toBe(before.cashYen-4000+12000);
  await expect(page.getByTestId('rival-title')).toHaveText('Launch Authority');await expect(page.getByRole('button',{name:'Claim rival bonus Ironline',exact:true})).toBeEnabled();
});
test('claim in Rival Crews and Collection uses one ledger, never two payments',async({page})=>{
  await seed(page,raceToEnd(qualifiedRivalWorld(),first.event.id));await board(page);const before=await read(page);
  await page.getByRole('button',{name:'Claim rival bonus Ironline',exact:true}).evaluate((b:HTMLButtonElement)=>{b.click();b.click();});
  const claimed=await read(page);expect(claimed.cashYen).toBe(before.cashYen+20000);expect(claimed.racing).toEqual(before.racing);expect(claimed.reputation).toBe(before.reputation);
  await tab(page,'Collection');await page.getByRole('group',{name:'Collection sections',exact:true}).getByRole('button',{name:/^Achievements(?: \d+)?$/}).click();await page.getByRole('combobox',{name:'Achievement category',exact:true}).selectOption('rivals');
  await expect(page.locator('.achievementCard')).toHaveCount(5);await expect(page.getByRole('button',{name:'Claim Launch Authority',exact:true})).toBeDisabled();
  await page.reload();expect(await read(page)).toEqual(claimed);
});
test('a loss and a withdrawn challenge never grant the title bonus',async({page})=>{
  await clock(page);const s=qualifiedRivalWorld();s.ownedVehicles.push(createPlayerVehicle('pico-rs','slow'));await seed(page,s);await board(page);
  await page.getByRole('combobox',{name:'Race vehicle',exact:true}).selectOption('slow');await brief(page);await page.getByRole('button',{name:'ENTER RACE',exact:true}).click();
  await finish(page);await page.getByRole('button',{name:'SETTLE RESULT',exact:true}).click();expect((await read(page)).racing.lastResult?.position).toBe(4);
  await expect(page.getByRole('button',{name:'Claim rival bonus Ironline',exact:true})).toBeDisabled();await brief(page);await page.getByRole('button',{name:'ENTER RACE',exact:true}).click();
  const pending=await read(page);page.once('dialog',(d)=>d.accept());await page.getByRole('button',{name:'WITHDRAW',exact:true}).click();
  expect((await read(page)).cashYen).toBe(pending.cashYen);expect((await read(page)).collection.unlockedAchievementIds).not.toContain(first.achievementId);
});
test('all four crew wins open the finale and settlement earns a non-resetting champion title',async({page})=>{
  await clock(page);await seed(page,defeatedRivalWorld());await board(page);await raceCar(page,4);const before=await read(page);
  await brief(page,4);await expect(page.getByRole('button',{name:'ENTER RACE',exact:true})).toBeEnabled();await page.getByRole('button',{name:'ENTER RACE',exact:true}).click();
  await finish(page);await page.getByRole('button',{name:'SETTLE RESULT',exact:true}).click();await expect(page.getByTestId('rival-title')).toHaveText('Kagehama Night Champion');
  await expect(page.locator('.rivalChampion')).toBeVisible();const won=await read(page);
  expect(won.empire).toEqual(before.empire);expect(won.market).toEqual(before.market);expect(won.advanced).toEqual(before.advanced);expect(won.ownedVehicles).toHaveLength(before.ownedVehicles.length);
  expect(won.cashYen).toBe(before.cashYen+20000);await page.getByRole('button',{name:'Claim rival bonus Midnight Council',exact:true}).click();
  expect((await read(page)).cashYen).toBe(won.cashYen+125000);
});
test('three crews are not enough for the finale even at the level cap',async({page})=>{
  await seed(page,defeatedRivalWorld(3));await board(page);await brief(page,4);
  await expect(page.getByRole('dialog')).toContainText('NEEDED · Win and settle Zero Meridian');await expect(page.getByRole('button',{name:'ENTER RACE',exact:true})).toBeDisabled();
});
for(const stage of ['entry','settlement','bonus'] as const)test(`failed ${stage} writes keep cash, progress and pending entitlement unchanged`,async({page})=>{
  await clock(page);await seed(page,stage==='entry'?qualifiedRivalWorld():stage==='settlement'?runningWorld():raceToEnd(qualifiedRivalWorld(),first.event.id));await board(page);
  if(stage==='entry'){await raceCar(page);await brief(page);}else if(stage==='settlement')await finish(page);
  const before=await stored(page);await page.evaluate(()=>{Storage.prototype.setItem=()=>{throw new Error('Storage full');};});
  await page.getByRole('button',{name:stage==='entry'?'ENTER RACE':stage==='settlement'?'SETTLE RESULT':'Claim rival bonus Ironline',exact:true}).click();
  expect(await stored(page)).toBe(before);if(stage==='entry')await page.keyboard.press('Escape');await expect(page.locator('.recoveryPanel')).toBeVisible();
  await page.reload();await board(page);if(stage==='bonus')await expect(page.getByRole('button',{name:'Claim rival bonus Ironline',exact:true})).toBeEnabled();
});
test('challenges and rewards preserve running managers, incoming imports and unrelated state',async({page})=>{
  await clock(page);let s=qualifiedRivalWorld();const old=deserializeSave(JSON.stringify(v10)).state;s={...s,advanced:old.advanced};
  for(const action of ['buy','manager'] as const)s=performEmpireAction(s,getEmpireQuote(s,action,'ward-detail',T+1000).order,T+1000);
  await seed(page,s);await board(page);await raceCar(page);await brief(page);await page.getByRole('button',{name:'ENTER RACE',exact:true}).click();
  await tab(page,'Market');await finish(page);const before=await read(page);expect(before.empire).toEqual(s.empire);expect(before.advanced).toEqual(s.advanced);
  await board(page);await page.getByRole('button',{name:'SETTLE RESULT',exact:true}).click();await page.getByRole('button',{name:'Claim rival bonus Ironline',exact:true}).click();
  expect((await read(page)).empire).toEqual(s.empire);expect((await read(page)).advanced).toEqual(s.advanced);
});
test('a stale tab cannot claim a title already paid from another view',async({page,context})=>{
  await seed(page,raceToEnd(qualifiedRivalWorld(),first.event.id));await board(page);const other=await context.newPage();await other.goto('./');await board(other);
  await other.getByRole('button',{name:'Claim rival bonus Ironline',exact:true}).click();await expect(page.locator('.recoveryPanel')).toContainText('Another tab');
  await expect(page.getByRole('button',{name:'Claim rival bonus Ironline',exact:true})).toBeDisabled();
});
test('paid challenge below an imported level gate remains settleable without requalifying',async({page})=>{
  await clock(page);const s=runningWorld();s.playerLevel=1;s.reputation=0;await seed(page,s);await board(page);await finish(page);
  await page.getByRole('button',{name:'SETTLE RESULT',exact:true}).click();expect((await read(page)).racing.lastResult?.position).toBe(1);
});
test('old v10 world loads exactly; browsing does not reset tills or claim ordinary achievements',async({page})=>{
  await seedRaw(page,JSON.stringify(v10));const before=await stored(page);await board(page);await expect(page.getByTestId('rival-title')).toHaveText('Challenger');
  await expect(page.locator('.saveIndicator')).toContainText('SAVE V10');expect(await read(page)).toEqual(v10.state);expect(await stored(page)).toBe(before);
});
test('export reset import restores the paid boss while resetting only view preferences',async({page})=>{
  await clock(page);await seed(page,runningWorld());await board(page);const before=await read(page);await tab(page,'Saves');
  await page.getByRole('button',{name:'GENERATE SAVE CODE',exact:true}).click();const code=await page.getByRole('textbox',{name:'Exported save code'}).inputValue();
  page.once('dialog',(d)=>d.accept());await page.getByRole('button',{name:'RESET SAVEGAME',exact:true}).click();await tab(page,'Saves');
  await page.getByRole('textbox',{name:'Save code to import'}).fill(code);page.once('dialog',(d)=>d.accept());await page.getByRole('button',{name:'VALIDATE & IMPORT',exact:true}).click();
  expect(await read(page)).toEqual(before);await tab(page,'Races');await expect(page.getByRole('group',{name:'Race boards'}).getByRole('button',{name:'Open events'})).toHaveAttribute('aria-pressed','true');
  await expect(page.getByRole('article',{name:'Current race',exact:true})).toBeVisible();await finish(page);await page.getByRole('button',{name:'SETTLE RESULT',exact:true}).click();
});
test('City crew shortcut selects rivals; district shortcuts intentionally restore open events',async({page})=>{
  await seed(page,qualifiedRivalWorld());const before=await stored(page);await tab(page,'City');await page.getByRole('button',{name:'MEET RIVAL CREWS',exact:true}).click();
  await expect(page.getByRole('heading',{name:'The city knows your name.'})).toBeVisible();await expect(page.getByRole('tab',{name:'Races',exact:true})).toBeFocused();
  await tab(page,'City');await page.getByRole('button',{name:'BROWSE EAST WARD RACES',exact:true}).click();await expect(page.locator('.raceEventCard:visible')).toHaveCount(2);expect(await stored(page)).toBe(before);
});
for(const [name,width,height] of [['desktop',1440,1000],['mobile',390,844],['narrow',320,780]] as const)test(`${name} rival cards, finale and briefing fit below sticky XP and Heat`,async({page})=>{
  const errors:string[]=[];page.on('pageerror',(e)=>errors.push(e.message));await page.setViewportSize({width,height});await seed(page,qualifiedRivalWorld());await board(page);
  await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:`test-results/rivals-${name}.png`,fullPage:true});
  await page.evaluate(()=>window.scrollTo(0,900));await expect(page.getByTestId('cash')).toBeInViewport();await expect(page.getByRole('progressbar',{name:'Level XP progress',exact:true})).toBeInViewport();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await brief(page,4);
  await page.screenshot({path:`test-results/rival-briefing-${name}.png`});expect((await page.getByRole('dialog').boundingBox())!.width).toBeLessThanOrEqual(width);
  await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);expect(errors).toEqual([]);
});
test('320px fallback fonts and maximum cash do not clip rival headings or controls',async({page})=>{
  await page.setViewportSize({width:320,height:780});await page.route('https://fonts.googleapis.com/**',(r)=>r.abort());await page.route('https://fonts.gstatic.com/**',(r)=>r.abort());
  await seed(page,{...qualifiedRivalWorld(),cashYen:Number.MAX_SAFE_INTEGER});await board(page);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:'test-results/rivals-fallback-320.png',fullPage:true});
});
