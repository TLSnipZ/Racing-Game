import { test, expect, type Page } from '@playwright/test';
import v7 from '../fixtures/save-v7.json' with { type: 'json' };
import { createNewGameState, createPlayerVehicle, purchaseStarter } from '../../src/domain/game';
import { getVehicleSaleKey, buyMarketVehicle, sellMarketVehicle } from '../../src/domain/market';
import { getVehicleValuation } from '../../src/domain/marketValue';
import { claimAchievement, purchaseIcon } from '../../src/domain/collection';
import { deserializeSave, SAVE_VERSION } from '../../src/domain/persistence';
import { startJob, claimJob } from '../../src/domain/economy';
import { getRaceBuildKey, startRace, cancelRace } from '../../src/domain/racing';
import { startLayLow } from '../../src/domain/heat';
import { seed, seedRaw, stored, read, tab, clock, T } from './helpers';
import type { GameState } from '../../src/domain/types';
const initial = () => purchaseStarter(createNewGameState(),'pico-rs','first');
const rich = () => ({ ...initial(), playerLevel: 8, reputation: 560, cashYen: 1000000 });
function trio() { let state = rich(); for(const id of ['tora-85','rz-t']) { const l=state.market.listings.find(x=>x.vehicle.catalogId===id)!;state=buyMarketVehicle(state,l.id,0,l.askingPriceYen); } return state; }
const section = (page: Page, name: 'Collection Book' | 'Achievements' | 'Icon Showroom') => page.getByRole('group',{name:'Collection sections',exact:true}).getByRole('button',{name: new RegExp(`^${name}`)}).click();
async function icons(page: Page) { await tab(page,'Collection');await section(page,'Icon Showroom'); }
async function reviewIcon(page: Page) { await page.getByRole('button',{name:'Review Icon Hoshino Tora 85 Heritage',exact:true}).click(); await expect(page.getByRole('dialog')).toBeVisible(); }
async function claimFirst(page: Page) { await tab(page,'Collection');await section(page,'Achievements');await page.getByRole('button',{name:'Claim Financially Questionable',exact:true}).click(); }

test('Collection is an eighth real tab, unlocks after the starter, and participates in keyboard navigation',async({page})=>{
  await page.goto('./');await expect(page.getByRole('tab',{name:'Collection',exact:true})).toBeDisabled();
  await page.getByRole('button',{name:'Choose Hoshino Pico RS'}).click();await page.getByRole('button',{name:'BUY & ENTER KAGEHAMA'}).click();
  await expect(page.getByTestId('collection-ready-badge')).toHaveText('1');
  await page.getByRole('button',{name:'OPEN COLLECTION BOOK'}).click();await expect(page.getByRole('tab',{name:'Collection',exact:true})).toBeFocused();
  await expect(page.getByRole('tabpanel')).toHaveAttribute('id','panel-collection');await expect(page.getByRole('tabpanel')).toHaveCount(1);
  await expect(page.getByTestId('collected-count')).toHaveText('1 / 8');await page.keyboard.press('ArrowLeft');await expect(page.getByRole('tab',{name:'Market',exact:true})).toBeFocused();
  await page.keyboard.press('ArrowRight');await expect(page.getByRole('tab',{name:'Collection',exact:true})).toBeFocused();
  await page.keyboard.press('End');await expect(page.getByRole('tab',{name:'Saves',exact:true})).toBeFocused();
});
test('viewing, subviews, categories and tabs do not write, reveal rewards automatically or collect dealer stock',async({page})=>{
  await seed(page,initial());const before=await stored(page);await tab(page,'Collection');
  await expect(page.locator('.bookCard')).toHaveCount(8);await expect(page.locator('.bookCollected')).toHaveCount(1);
  await section(page,'Achievements');await section(page,'Icon Showroom');await tab(page,'Market');await tab(page,'Collection');
  expect(await stored(page)).toBe(before);await expect(page.getByTestId('cash')).toHaveText('¥18,000');
});
test('combined book filters distinguish ever collected, currently owned and missing; reset and tab persistence work',async({page})=>{
  let state=trio();const car=state.ownedVehicles.find(c=>c.catalogId==='tora-85')!;state=sellMarketVehicle(state,car.instanceId,getVehicleSaleKey(car,state.activeVehicleId),getVehicleValuation(car).offerYen,null);
  await seed(page,state);const before=await stored(page);await tab(page,'Collection');
  await page.getByRole('combobox',{name:'Collection manufacturer'}).selectOption('hoshino');await page.getByRole('group',{name:'Collection rarity',exact:true}).getByRole('button',{name:'Legendary',exact:true}).click();
  await page.getByRole('combobox',{name:'Collection ownership'}).selectOption('collected');await expect(page.locator('.bookCard')).toHaveCount(1);await expect(page.locator('.bookCard')).toContainText('no longer parked');
  await tab(page,'Jobs');await tab(page,'Collection');await expect(page.getByRole('combobox',{name:'Collection manufacturer'})).toHaveValue('hoshino');
  await page.getByRole('combobox',{name:'Collection ownership'}).selectOption('owned');await expect(page.locator('.bookCard')).toHaveCount(0);await expect(page.locator('.collectorEmpty')).toContainText('No models match');
  await page.getByRole('button',{name:'RESET COLLECTION FILTERS'}).click();await expect(page.locator('.bookCard')).toHaveCount(8);expect(await stored(page)).toBe(before);
});
test('one manual achievement claim updates cash once, not XP or activity income, and remains claimed on reload',async({page})=>{
  await seed(page,initial());await tab(page,'Collection');await section(page,'Achievements');
  await page.getByRole('button',{name:'Claim Financially Questionable',exact:true}).evaluate((b: HTMLButtonElement)=>{b.click();b.click();});
  await expect(page.getByTestId('cash')).toHaveText('¥19,000');await expect(page.getByRole('button',{name:'Claim Financially Questionable',exact:true})).toBeDisabled();
  const state=await read(page);expect(state.collection.claimedAchievementIds).toEqual(['first-ride']);expect(state.reputation).toBe(0);expect(state.economy.totalEarnedYen).toBe(0);expect(state.racing.totalEarnedYen).toBe(0);
  await expect(page.getByTestId('collection-ready-badge')).toHaveCount(0);await page.reload();await tab(page,'Collection');await section(page,'Achievements');await expect(page.getByRole('button',{name:'Claim Financially Questionable',exact:true})).toBeDisabled();
});
test('achievement filters show locked, claimed and ready states without claiming',async({page})=>{
  await seed(page,claimAchievement(initial(),'first-ride'));const before=await stored(page);await tab(page,'Collection');await section(page,'Achievements');
  await page.getByRole('combobox',{name:'Achievement status'}).selectOption('claimed');await expect(page.locator('.achievementCard')).toHaveCount(1);
  await page.getByRole('combobox',{name:'Achievement category'}).selectOption('racing');await expect(page.locator('.achievementCard')).toHaveCount(0);
  await page.getByRole('button',{name:'RESET ACHIEVEMENT FILTERS'}).click();await expect(page.locator('.achievementCard')).toHaveCount(18);expect(await stored(page)).toBe(before);
});
test('a fifth job only earns its badge on claim; the reward is still manual and the timer can finish in Collection',async({page})=>{
  await clock(page);let state=initial();for(let i=0;i<4;i++){state=startJob(state,'garage-shift',T-100000);state=claimJob(state,state.economy.activeJob!.runId,T-85000);}
  await seed(page,state);await tab(page,'Jobs');await page.getByRole('button',{name:'Start Garage Shift'}).click();await tab(page,'Collection');await section(page,'Achievements');
  await expect(page.getByRole('button',{name:'Claim Will Work for Wheels'})).toBeDisabled();const before=await stored(page);await page.clock.runFor(15000);
  expect(await stored(page)).toBe(before);await tab(page,'Jobs');await page.getByRole('button',{name:'CLAIM REWARD'}).click();await tab(page,'Collection');
  await expect(page.getByRole('button',{name:'Claim Will Work for Wheels'})).toBeEnabled();expect((await read(page)).cashYen).toBe(state.cashYen+1500);
});
test('Icon preview shows unmet goals, actual price and a disabled confirmation',async({page})=>{
  await seed(page,initial());const before=await stored(page);await icons(page);await reviewIcon(page);
  await expect(page.getByRole('dialog')).toContainText('Requires Level 6');await expect(page.getByRole('button',{name:'BUY ICON VEHICLE'})).toBeDisabled();
  await expect(page.getByRole('dialog')).toContainText('¥180,000');await page.keyboard.press('Escape');expect(await stored(page)).toBe(before);
});
test('an eligible Icon can be cancelled for free, bought exactly once and found in the garage with its own badge',async({page})=>{
  const state=trio();await seed(page,state);await icons(page);const before=await stored(page);await reviewIcon(page);await page.getByRole('button',{name:'CANCEL',exact:true}).click();expect(await stored(page)).toBe(before);
  await reviewIcon(page);await page.getByRole('button',{name:'BUY ICON VEHICLE'}).evaluate((b: HTMLButtonElement)=>{b.click();b.click();});await expect(page.getByRole('dialog')).toHaveCount(0);
  const after=await read(page);expect(after.cashYen).toBe(state.cashYen-180000);expect(after.ownedVehicles).toHaveLength(4);expect(after.activeVehicleId).toBe(state.activeVehicleId);expect(after.market).toEqual(state.market);
  await expect(page.getByRole('button',{name:'Review Icon Hoshino Tora 85 Heritage'})).toBeDisabled();await tab(page,'Garage');
  await page.getByRole('button',{name:`Inspect Hoshino Tora 85 Heritage (${after.ownedVehicles.at(-1)!.instanceId})`}).click();await expect(page.locator('.showcaseCopy .rarityBadge')).toHaveText('Icon');
  await page.reload();await icons(page);await expect(page.getByRole('button',{name:'Review Icon Hoshino Tora 85 Heritage'})).toBeDisabled();
});
test('selling the Icon retains its book credit and permanently uses its one-time offer',async({page})=>{
  const state=purchaseIcon(trio(),'heritage-commission',180000);const car=state.ownedVehicles.at(-1)!;await seed(page,state);await tab(page,'Market');
  await page.getByRole('button',{name:/^SELL A CAR/}).click();await page.getByRole('button',{name:`Review sale ${car.instanceId}`}).click();
  await page.getByRole('button',{name:'SELL VEHICLE',exact:true}).click();await tab(page,'Collection');
  await expect(page.getByRole('article',{name:'Collection Hoshino Tora 85 Heritage',exact:true})).toContainText('no longer parked');await section(page,'Icon Showroom');
  await expect(page.getByRole('button',{name:'Review Icon Hoshino Tora 85 Heritage'})).toBeDisabled();
});
test('full garage and low funds do not consume eligible Icon offers',async({page})=>{
  const state=trio();while(state.ownedVehicles.length<12)state.ownedVehicles.push(createPlayerVehicle('pico-rs',`copy-${state.ownedVehicles.length}`));
  await seed(page,state);await icons(page);const before=await stored(page);await reviewIcon(page);await expect(page.getByRole('dialog')).toContainText('Garage full');await expect(page.getByRole('button',{name:'BUY ICON VEHICLE'})).toBeDisabled();expect(await stored(page)).toBe(before);
});
test('new Icon cars can be activated, tuned and raced with the original systems',async({page})=>{
  const state=purchaseIcon(trio(),'heritage-commission',180000);const id=state.ownedVehicles.at(-1)!.instanceId;await seed(page,state);
  await page.getByRole('button',{name:`Inspect Hoshino Tora 85 Heritage (${id})`}).click();await page.getByRole('button',{name:'SET AS ACTIVE VEHICLE'}).click();
  await tab(page,'Workshop');await page.getByRole('combobox',{name:'Vehicle to tune'}).selectOption(id);await page.getByRole('button',{name:'Review Panel Filter',exact:true}).click();await page.getByRole('button',{name:'BUY & INSTALL',exact:true}).click();
  await tab(page,'Races');await page.getByRole('combobox',{name:'Race vehicle'}).selectOption(id);await page.getByRole('button',{name:'Briefing East Ward Shakedown',exact:true}).click();await page.getByRole('button',{name:'ENTER RACE',exact:true}).click();
  expect((await read(page)).racing.activeRace!.vehicleId).toBe(id);
});
for(const kind of ['claim','icon'] as const){test(`failed ${kind} writes keep cash, the collection ledger and offer available`,async({page})=>{
  await seed(page,trio());await tab(page,'Collection');if(kind==='icon'){await section(page,'Icon Showroom');await reviewIcon(page);}else await section(page,'Achievements');
  const before=await stored(page);await page.evaluate(()=>{Storage.prototype.setItem=()=>{throw new Error('Storage full');};});
  await page.getByRole('button',{name:kind==='icon'?'BUY ICON VEHICLE':'Claim Financially Questionable',exact:true}).click();
  expect(await stored(page)).toBe(before);if(kind==='icon')await page.keyboard.press('Escape');await expect(page.locator('.recoveryPanel')).toContainText('Could not save');
  await page.reload();await tab(page,'Collection');if(kind==='icon'){await section(page,'Icon Showroom');await reviewIcon(page);await expect(page.getByRole('button',{name:'BUY ICON VEHICLE'})).toBeEnabled();}else{await section(page,'Achievements');await expect(page.getByRole('button',{name:'Claim Financially Questionable',exact:true})).toBeEnabled();}
});}
test('a stale second tab cannot claim the same achievement twice',async({page,context})=>{
  await seed(page,initial());await tab(page,'Collection');await section(page,'Achievements');const other=await context.newPage();await other.goto('./');await claimFirst(other);
  await expect(page.locator('.recoveryPanel')).toContainText('Another tab');await expect(page.getByRole('button',{name:'Claim Financially Questionable',exact:true})).toBeDisabled();expect((await read(other)).cashYen).toBe(19000);
});
test('v7 migration preserves every old field and recognises only provable achievements without money or free cars',async({page})=>{
  await seedRaw(page,JSON.stringify(v7));const state=await read(page);const {collection,...old}=state;
  expect(old).toEqual(v7.state);expect(collection.claimedAchievementIds).toEqual([]);expect(collection.purchasedIconIds).toEqual([]);expect(collection.collectedModelIds).toEqual(['tora-85','pico-rs']);
  await expect(page.locator('.saveIndicator')).toContainText(`SAVE V${SAVE_VERSION}`);await tab(page,'Collection');await section(page,'Achievements');await expect(page.getByRole('button',{name:'Claim Overtime, Overtake'})).toBeEnabled();
});
test('portable codes retain earned and claimed rewards, one-time offers, sold models and a pending race',async({page})=>{
  await clock(page);let state=purchaseIcon(trio(),'heritage-commission',180000);state=claimAchievement(state,'first-ride');state=startRace(state,'dockyard-402','first',getRaceBuildKey(state.ownedVehicles[0]),T+1000,'underground',0);
  await seed(page,state);await tab(page,'Saves');await page.getByRole('button',{name:'GENERATE SAVE CODE'}).click();const code=await page.getByRole('textbox',{name:'Exported save code'}).inputValue();
  page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'RESET SAVEGAME'}).click();expect(await read(page)).toEqual(createNewGameState());
  await tab(page,'Saves');await page.getByRole('textbox',{name:'Save code to import'}).fill(code);page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'VALIDATE & IMPORT'}).click();
  expect(await read(page)).toEqual(state);await icons(page);await expect(page.getByRole('button',{name:'Review Icon Hoshino Tora 85 Heritage'})).toBeDisabled();
});
test('missing or malformed current collection data is protected, never deleted or patched to grant a reward again',async({page})=>{
  const raw=JSON.stringify({version:8,savedAt:T,state:{...initial(),collection:{collectedModelIds:['ghost']}}});await seedRaw(page,raw);
  await expect(page.locator('.recoveryPanel')).toContainText('protected');expect(await stored(page)).toBe(raw);
});
test('claims and collection browsing do not pause or resolve a patrol cooldown',async({page})=>{
  await clock(page);let state=trio();state=startRace({...state,heat:{...state.heat,value:40}},'dockyard-402','first',getRaceBuildKey(state.ownedVehicles[0]),T-100000,'underground',40);
  state=cancelRace(state,state.racing.activeRace!.runId);state=startLayLow(state,state.heat.value,state.heat.nextCooldownId,T+1000);
  await seed(page,state);await claimFirst(page);await page.clock.runFor(60000);const after=await read(page);expect(after.heat).toEqual(state.heat);expect(after.cashYen).toBe(state.cashYen+1000);
  await expect(page.getByTestId('heat-ready-badge')).toHaveText('READY');
});
for(const [name,width,height] of [['desktop',1440,1000],['mobile',390,844],['narrow',320,780]] as const){
 test(`${name} book, achievements, Icons and previews fit underneath the persistent XP and Heat HUD`,async({page})=>{
  const errors: string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width,height});await seed(page,trio());await tab(page,'Collection');
  for(const [mode,filename] of [['Collection Book','book'],['Achievements','achievements'],['Icon Showroom','icons']] as const){
    await section(page,mode);await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:`test-results/collection-${filename}-${name}.png`,fullPage:true});
    await page.evaluate(()=>window.scrollTo(0,600));await expect(page.getByTestId('cash')).toBeInViewport();await expect(page.getByRole('progressbar',{name:'Level XP progress',exact:true})).toBeInViewport();
    expect((await page.locator('.gameTopbar').boundingBox())!.y).toBe(0);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
  await reviewIcon(page);await page.screenshot({path:`test-results/icon-preview-${name}.png`});expect((await page.getByRole('dialog').boundingBox())!.width).toBeLessThanOrEqual(width);
  await page.keyboard.press('Escape');expect(errors).toEqual([]);
 });
}
