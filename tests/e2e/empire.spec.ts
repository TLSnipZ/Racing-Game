import { test, expect, type Page } from '@playwright/test';
import { createNewGameState, purchaseStarter } from '../../src/domain/game';
import { getEmpireQuote, performEmpireAction } from '../../src/domain/empire';
import { createEmpireState } from '../../src/domain/empireState';
import { SAVE_VERSION } from '../../src/domain/persistence';
import v9 from '../fixtures/save-v9.json' with { type: 'json' };
import { seed, seedRaw, read, stored, tab, clock, T } from './helpers';
import type { GameState } from '../../src/domain/types';
import type { EmpireAction } from '../../src/domain/empireTypes';
const ID='ward-detail', NAME='East Ward Detail';
const rich=()=>({...purchaseStarter(createNewGameState(),'pico-rs','first'),playerLevel:12,reputation:1320,cashYen:5_000_000});
function act(s:GameState,a:EmpireAction,id:string|null=ID,now=T+1000){return performEmpireAction(s,getEmpireQuote(s,a,id,now).order,now);}
const owned=()=>act(rich(),'buy');
const automated=()=>act(owned(),'manager');
const section=async(page:Page,name:string)=>page.getByRole('group',{name:'Empire sections'}).getByRole('button',{name,exact:true}).click();
async function review(page:Page,name:string){await page.getByRole('button',{name,exact:true}).click();await expect(page.getByRole('dialog')).toBeVisible();}
async function confirm(page:Page,label:string){await page.getByRole('dialog').getByRole('button',{name:label,exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(0);}

test('Empire is a ninth isolated section gated by starter purchase with explicit low-level requirements',async({page})=>{
 await page.goto('./');await expect(page.getByRole('tab',{name:'Empire',exact:true})).toBeDisabled();
 await page.getByRole('button',{name:'Choose Hoshino Pico RS'}).click();await page.getByRole('button',{name:'BUY & ENTER KAGEHAMA'}).click();
 await tab(page,'Empire');await expect(page.getByRole('tabpanel')).toHaveCount(1);await expect(page.getByRole('heading',{name:'Let the bays pay.'})).toBeVisible();
 await expect(page.locator('.businessCard')).toHaveCount(3);await expect(page.getByRole('button',{name:`Buy business ${NAME}`})).toBeDisabled();
 await expect(page.getByRole('article',{name:NAME,exact:true})).toContainText('Requires Level 3');await expect(page.getByRole('tab')).toHaveCount(9);
});
test('business preview cancellation changes nothing; duplicate confirmation only charges once',async({page})=>{
 await clock(page);await seed(page,rich());await tab(page,'Empire');const before=await stored(page);
 await review(page,`Buy business ${NAME}`);await expect(page.getByRole('dialog')).toContainText('¥60,000');await page.keyboard.press('Escape');expect(await stored(page)).toBe(before);
 await review(page,`Buy business ${NAME}`);await page.getByRole('dialog').getByRole('button',{name:'CONFIRM BUY BUSINESS',exact:true}).evaluate((b:HTMLButtonElement)=>{b.click();b.click();});
 const s=await read(page);expect(s.cashYen).toBe(4_940_000);expect(s.empire.businesses).toHaveLength(1);expect(s.empire.businesses[0].startedAtMs).toBeNull();
 await expect(page.getByTestId('empire-pending')).toHaveText('¥0');await page.reload();expect((await read(page)).empire).toEqual(s.empire);
});
test('manual staff finish only one batch without taking the driver slot or paying before collection',async({page})=>{
 await clock(page);await seed(page,owned());await tab(page,'Empire');await page.getByRole('button',{name:`Start production ${NAME}`} ).click();
 await tab(page,'Jobs');await page.getByRole('button',{name:'Start Garage Shift'}).click();const before=await read(page);
 await page.clock.runFor(60000);await expect(page.getByTestId('empire-ready-badge')).toHaveText('CASH');await expect(page.getByTestId('job-ready-badge')).toBeVisible();
 expect(await read(page)).toEqual(before);await tab(page,'Empire');await expect(page.getByTestId('empire-pending')).toHaveText('¥300');
 await page.getByRole('button',{name:`Collect earnings ${NAME}`} ).click();const after=await read(page);
 expect(after.cashYen).toBe(before.cashYen+300);expect(after.economy).toEqual(before.economy);expect(after.empire.businesses[0].startedAtMs).toBeNull();
 await page.clock.runFor(60000);await expect(page.getByTestId('empire-pending')).toHaveText('¥0');
});
test('hire once in Staff starts repeat production with no auto-cash or hidden wage deduction',async({page})=>{
 await clock(page);await seed(page,owned());await tab(page,'Empire');await section(page,'Staff & Managers');
 await review(page,`Hire & automate ${NAME}`);await expect(page.getByRole('dialog')).toContainText('start automatic production now');
 await confirm(page,'CONFIRM HIRE & AUTOMATE');const before=await read(page);expect(before.cashYen).toBe(4_905_000);
 await page.clock.runFor(90000);await expect(page.getByTestId('empire-pending')).toHaveText('¥900');expect(await read(page)).toEqual(before);
 await page.getByRole('button',{name:'Collect all earnings',exact:true}).click();const s=await read(page);expect(s.cashYen).toBe(before.cashYen+900);expect(s.reputation).toBe(before.reputation);
 await expect(page.getByRole('button',{name:`Hire & automate ${NAME}`})).toBeDisabled();await page.clock.runFor(30000);await expect(page.getByTestId('empire-pending')).toHaveText('¥300');
});
test('reload after absence caps at eight hours and cannot repeat the payout on a second reload',async({page})=>{
 await clock(page);await seed(page,automated());await page.clock.fastForward(12*60*60*1000);await page.reload();await tab(page,'Empire');
 await expect(page.getByTestId('empire-pending')).toHaveText('¥288,000');const before=await read(page);
 await page.getByRole('button',{name:'Collect all earnings',exact:true}).click();const after=await read(page);expect(after.cashYen).toBe(before.cashYen+288000);
 await page.reload();await tab(page,'Empire');await expect(page.getByTestId('empire-pending')).toHaveText('¥0');expect((await read(page)).cashYen).toBe(after.cashYen);
 await page.clock.runFor(30000);await expect(page.getByTestId('empire-pending')).toHaveText('¥300');
});
test('collecting preserves the remaining time of a partially completed batch',async({page})=>{
 await clock(page);await seed(page,automated());await tab(page,'Empire');await page.clock.runFor(45000);
 await page.getByRole('button',{name:`Collect earnings ${NAME}`} ).click();await page.clock.runFor(15000);await expect(page.getByTestId('empire-pending')).toHaveText('¥300');
});
test('pause retains completed earnings; upgrade preserves old yen and resume applies new payout',async({page})=>{
 await clock(page);await seed(page,automated());await tab(page,'Empire');await page.clock.runFor(45000);
 await expect(page.getByRole('button',{name:`Upgrade business ${NAME}`})).toBeDisabled();
 await review(page,`Pause production ${NAME}`);await expect(page.getByRole('dialog')).toContainText('unfinished batch time is discarded');await confirm(page,'CONFIRM PAUSE PRODUCTION');
 await page.clock.runFor(60000);await expect(page.getByTestId('empire-pending')).toHaveText('¥300');
 await review(page,`Upgrade business ${NAME}`);await expect(page.getByRole('dialog')).toContainText('¥300 → ¥600');await confirm(page,'CONFIRM UPGRADE BUSINESS');
 expect((await read(page)).empire.businesses[0].startedAtMs).toBeNull();await expect(page.getByTestId('empire-pending')).toHaveText('¥300');
 await page.getByRole('button',{name:`Start production ${NAME}`} ).click();await page.clock.runFor(30000);await expect(page.getByTestId('empire-pending')).toHaveText('¥900');
});
test('garage shortcut shows expansion terms and all acquisition screens reflect new capacity',async({page})=>{
 await clock(page);await seed(page,rich());await page.getByRole('button',{name:'EXPAND GARAGE',exact:true}).click();
 await expect(page.getByRole('tabpanel')).toHaveAttribute('id','panel-empire');await expect(page.getByRole('group',{name:'Empire sections'}).getByRole('button',{name:'Garage Expansion'})).toHaveAttribute('aria-pressed','true');
 const before=await stored(page);await review(page,'Expand garage');await expect(page.getByRole('dialog')).toContainText('12 → 18');await page.keyboard.press('Escape');expect(await stored(page)).toBe(before);
 await review(page,'Expand garage');await confirm(page,'CONFIRM EXPAND GARAGE');expect((await read(page)).empire.garageExpansionLevel).toBe(1);
 await tab(page,'Market');await expect(page.getByTestId('garage-capacity')).toHaveText('1 / 18');await tab(page,'Garage');await expect(page.locator('.futureCard')).toContainText('1 / 18');
});
test('industrial district connects to business operations at its explicit level',async({page})=>{
 await seed(page,{...rich(),playerLevel:3,reputation:60});const before=await stored(page);await tab(page,'City');await page.getByRole('button',{name:'Inspect Industrial District',exact:true}).click();
 await expect(page.getByTestId('district-industrial-state')).toContainText('OPEN');await page.getByRole('button',{name:'OPEN BUSINESS DISTRICT'}).click();
 await expect(page.getByRole('tab',{name:'Empire',exact:true})).toBeFocused();await expect(page.locator('.businessCard')).toHaveCount(3);expect(await stored(page)).toBe(before);
});
test('navigating subviews and all nine main sections is read-only and keeps useful preferences',async({page})=>{
 await clock(page);await seed(page,automated());const before=await stored(page);await tab(page,'Empire');await section(page,'Staff & Managers');
 for(const name of ['Garage','Jobs','City','Races','Workshop','Market','Collection','Saves','Empire'] as const)await tab(page,name);
 await expect(page.getByRole('group',{name:'Empire sections'}).getByRole('button',{name:'Staff & Managers'})).toHaveAttribute('aria-pressed','true');expect(await stored(page)).toBe(before);
});
for(const [kind,factory,button,confirmation] of [
 ['purchase',rich,`Buy business ${NAME}`,'CONFIRM BUY BUSINESS'],
 ['manager',owned,`Hire & automate ${NAME}`,'CONFIRM HIRE & AUTOMATE'],
 ['expansion',rich,'Expand garage','CONFIRM EXPAND GARAGE'],
] as const){
 test(`failed ${kind} write cannot take money or start production`,async({page})=>{
  await clock(page);await seed(page,factory());await tab(page,'Empire');if(kind==='expansion')await section(page,'Garage Expansion');
  const before=await stored(page);await page.evaluate(()=>{Storage.prototype.setItem=()=>{throw new Error('full');};});
  await review(page,button);await page.getByRole('dialog').getByRole('button',{name:confirmation,exact:true}).click();await expect(page.getByRole('dialog').getByRole('alert')).toContainText('not applied');expect(await stored(page)).toBe(before);
 });
}
test('failed till collection preserves the anchor and can be retried after reload',async({page})=>{
 await clock(page);await seed(page,automated());await tab(page,'Empire');await page.clock.runFor(30000);const before=await stored(page);await page.evaluate(()=>{Storage.prototype.setItem=()=>{throw new Error('full');};});
 await page.getByRole('button',{name:'Collect all earnings',exact:true}).click();expect(await stored(page)).toBe(before);await expect(page.locator('.recoveryPanel')).toBeVisible();
 await page.reload();await tab(page,'Empire');await page.getByRole('button',{name:'Collect all earnings',exact:true}).click();expect((await read(page)).empire.totalCollectedYen).toBe(300);
});
test('a stale browser tab cannot collect completed batches twice',async({page,context})=>{
 const old=act(act(rich(),'buy',ID,1000),'manager',ID,1000);await seed(page,old);await tab(page,'Empire');const other=await context.newPage();await other.goto('./');await tab(other,'Empire');
 await other.getByRole('button',{name:'Collect all earnings',exact:true}).click();await expect(page.locator('.recoveryPanel')).toContainText('Another tab changed');
 await expect(page.getByRole('button',{name:'Collect all earnings',exact:true})).toBeDisabled();expect((await read(other)).empire.totalCollectedYen).toBe(288000);
});
test('export reset and import preserve production anchors, claimed totals and expansions',async({page})=>{
 await clock(page);await seed(page,act(automated(),'expand',null));await page.clock.runFor(45000);await tab(page,'Saves');await page.getByRole('button',{name:'GENERATE SAVE CODE'}).click();
 const code=await page.getByRole('textbox',{name:'Exported save code'}).inputValue(),before=await read(page);page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'RESET SAVEGAME'}).click();
 expect((await read(page)).empire).toEqual(createEmpireState());await expect(page.getByRole('tab',{name:'Empire'})).toBeDisabled();
 await tab(page,'Saves');await page.getByRole('textbox',{name:'Save code to import'}).fill(code);page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'VALIDATE & IMPORT'}).click();
 expect(await read(page)).toEqual(before);await tab(page,'Empire');await expect(page.getByTestId('empire-pending')).toHaveText('¥300');await expect(page.locator('.businessCard')).toHaveCount(3);
});
test('frozen v9 world retains driver risk, specialist escrow and every prior field',async({page})=>{
 await seedRaw(page,JSON.stringify(v9));const {empire,...old}=await read(page);expect(old).toEqual(v9.state);expect(empire).toEqual(createEmpireState());
 await expect(page.locator('.saveIndicator')).toContainText(`SAVE V${SAVE_VERSION}`);await tab(page,'Empire');const before=await read(page);
 await review(page,`Buy business ${NAME}`);await confirm(page,'CONFIRM BUY BUSINESS');const after=await read(page);expect(after.advanced).toEqual(before.advanced);expect(after.racing).toEqual(before.racing);expect(after.heat).toEqual(before.heat);
});
test('malformed current empire is protected rather than reset to renew income',async({page})=>{
 const s=automated();await seedRaw(page,JSON.stringify({version:SAVE_VERSION,savedAt:T,state:{...s,empire:{...s.empire,totalSpentYen:0}}}));
 await expect(page.locator('.recoveryPanel')).toContainText('protected');const before=await stored(page);await tab(page,'Saves');expect(await stored(page)).toBe(before);
});
test('backwards device clock blocks early collection without erasing the business',async({page})=>{
 await clock(page);await seed(page,act(owned(),'manager',ID,T+60000));await tab(page,'Empire');await expect(page.getByRole('article',{name:NAME,exact:true})).toContainText('CLOCK ERROR');
 await expect(page.getByRole('button',{name:`Collect earnings ${NAME}`})).toBeDisabled();await page.clock.runFor(89000);await expect(page.getByTestId('empire-pending')).toHaveText('¥300');
});
for(const [name,width,height] of [['desktop',1440,1000],['mobile',390,844],['narrow',320,780]] as const){
 test(`${name} business staff expansion and purchase previews fit below sticky XP/Heat HUD`,async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width,height});await clock(page);
  let s=automated();s=act(s,'buy','bayline-parts');s=act(s,'manager','bayline-parts');await seed(page,s);await tab(page,'Empire');await page.clock.runFor(90000);
  for(const view of ['Businesses','Staff & Managers','Garage Expansion']){
   await section(page,view);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
   await page.screenshot({path:`test-results/empire-${view.split(' ')[0].toLowerCase()}-${name}.png`,fullPage:true});
   await page.evaluate(()=>window.scrollTo(0,600));await expect(page.getByTestId('cash')).toBeInViewport();await expect(page.getByRole('progressbar',{name:'Level XP progress',exact:true})).toBeInViewport();expect((await page.locator('.gameTopbar').boundingBox())!.y).toBe(0);
  }
  await review(page,'Expand garage');await page.screenshot({path:`test-results/empire-expansion-preview-${name}.png`});expect((await page.getByRole('dialog').boundingBox())!.width).toBeLessThanOrEqual(width);await page.keyboard.press('Escape');expect(errors).toEqual([]);
 });
}
test('320px fallback fonts keep large balances and all empire controls inside the viewport',async({page})=>{
 await page.setViewportSize({width:320,height:780});await page.route('https://fonts.googleapis.com/**',r=>r.abort());await page.route('https://fonts.gstatic.com/**',r=>r.abort());
 await clock(page);await seed(page,{...automated(),cashYen:Number.MAX_SAFE_INTEGER,reputation:Number.MAX_SAFE_INTEGER});await tab(page,'Empire');
 for(const view of ['Businesses','Staff & Managers','Garage Expansion']){await section(page,view);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await expect(page.getByTestId('cash')).toBeInViewport();}
 await page.screenshot({path:'test-results/empire-fallback-320.png',fullPage:true});
});
