import { expect, test, type Page } from '@playwright/test';
import v8 from '../fixtures/save-v8.json' with { type: 'json' };
import { createNewGameState, createPlayerVehicle, purchaseStarter } from '../../src/domain/game';
import { startSpecialistContract, getSpecialistQuoteKey, finishSpecialistContract } from '../../src/domain/advanced';
import { findAdvancedOffer } from '../../src/data/advancedCars';
import { createAdvancedState } from '../../src/domain/advancedState';
import { getRestorationQuote } from '../../src/domain/restoration';
import { getVehicleBuildStats, installPart } from '../../src/domain/tuning';
import { startRace, getRaceBuildKey } from '../../src/domain/racing';
import { startJob } from '../../src/domain/economy';
import { seed, seedRaw, read, stored, tab, clock, T } from './helpers';
const rich=()=>({...purchaseStarter(createNewGameState(),'pico-rs','first'),cashYen:2000000,playerLevel:8,reputation:560});
const start=(id='sora-import',bid=225000)=>{const s=rich();return startSpecialistContract(s,id,getSpecialistQuoteKey(s,findAdvancedOffer(id)!),T+1000,bid);};
async function market(page:Page,section:'Used dealer'|'Imports'|'Auctions'|'Barn Finds'){
 await tab(page,'Market');await page.getByRole('group',{name:'Market sections',exact:true}).getByRole('button',{name:section,exact:true}).click();
}
async function restoration(page:Page){await tab(page,'Workshop');await page.getByRole('group',{name:'Workshop services',exact:true}).getByRole('button',{name:'Restoration',exact:true}).click();}
async function review(page:Page,car='Mizuno Sora S'){await page.getByRole('button',{name:`Review specialist ${car}`,exact:true}).click();await expect(page.getByRole('dialog')).toBeVisible();}
async function ready(page:Page){const s=await read(page);await page.clock.runFor(Math.max(0,s.advanced.activeContract!.finishesAtMs-await page.evaluate(()=>Date.now())));}

test('specialist and restoration sections are read-only real subviews of the existing tabs',async({page})=>{
 await seed(page,rich());const before=await stored(page);await expect(page.getByRole('tab')).toHaveCount(8);
 for(const section of ['Imports','Auctions','Barn Finds'] as const){await market(page,section);await expect(page.getByRole('heading',{level:2})).toHaveCount(1);await expect(page.getByRole('tabpanel')).toHaveCount(1);}
 await tab(page,'Garage');await tab(page,'Market');await expect(page.getByRole('group',{name:'Market sections'}).getByRole('button',{name:'Barn Finds'})).toHaveAttribute('aria-pressed','true');
 await restoration(page);await expect(page.getByRole('heading',{name:'Bring it back.'})).toBeVisible();expect(await stored(page)).toBe(before);
});
test('import invoice preview is explicit, cancellation is free and confirmation purchases exactly once',async({page})=>{
 await clock(page);await seed(page,rich());await market(page,'Imports');const before=await stored(page);await review(page);
 await expect(page.getByRole('dialog')).toContainText('¥180,000');await expect(page.getByRole('dialog')).toContainText('No later fees');
 await page.keyboard.press('Escape');expect(await stored(page)).toBe(before);await review(page);
 await page.getByRole('button',{name:'PAY & ORDER IMPORT',exact:true}).evaluate((b:HTMLButtonElement)=>{b.click();b.click();});
 const s=await read(page);expect(s.cashYen).toBe(1820000);expect(s.advanced.nextActionId).toBe(2);expect(s.ownedVehicles).toHaveLength(1);
 await expect(page.getByRole('article',{name:'Current specialist contract',exact:true})).toContainText('1 garage space reserved');
});
test('import readiness from another tab does not grant a car until manual collection, with unchanged deadline after reload',async({page})=>{
 await clock(page);await seed(page,start());const before=await read(page);await tab(page,'Collection');await ready(page);
 await expect(page.getByTestId('specialist-ready-badge')).toBeVisible();expect(await read(page)).toEqual(before);
 await page.getByRole('button',{name:'OPEN SPECIALIST CONTRACT',exact:true}).click();await page.reload();await market(page,'Imports');
 expect((await read(page)).advanced.activeContract).toEqual(before.advanced.activeContract);
 await page.getByRole('button',{name:'COMPLETE CONTRACT',exact:true}).evaluate((b:HTMLButtonElement)=>{b.click();b.click();});
 const after=await read(page);expect(after.ownedVehicles).toHaveLength(2);expect(after.ownedVehicles[1]).toEqual(before.advanced.activeContract!.vehicle);expect(after.activeVehicleId).toBe('first');
 await expect(page.getByRole('button',{name:'Review specialist Mizuno Sora S',exact:true})).toBeDisabled();
});
test('cancelling an import refunds the full invoice but requires a separate confirmation',async({page})=>{
 await clock(page);await seed(page,start());await market(page,'Imports');const before=await stored(page);
 await page.getByRole('button',{name:'CANCEL CONTRACT',exact:true}).click();await page.keyboard.press('Escape');expect(await stored(page)).toBe(before);
 await page.getByRole('button',{name:'CANCEL CONTRACT',exact:true}).click();await expect(page.getByRole('dialog')).toContainText('¥180,000');await page.getByRole('button',{name:'CONFIRM CANCELLATION'}).click();
 const s=await read(page);expect(s.cashYen).toBe(2000000);expect(s.advanced.activeContract).toBeNull();expect(s.advanced.acquiredOfferIds).toEqual([]);
});
test('proxy auction reserves a maximum, raises only the difference, refunds surplus and saves the actual win',async({page})=>{
 await clock(page);await seed(page,rich());await market(page,'Auctions');await review(page,'Akari Crest RS');
 await expect(page.getByRole('dialog')).toContainText('binding');await page.getByRole('textbox',{name:'Maximum auction bid'}).fill('190000');await page.getByRole('button',{name:'PLACE BINDING BID'}).click();
 expect((await read(page)).cashYen).toBe(1810000);await expect(page.getByRole('button',{name:'CANCEL CONTRACT',exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:'RAISE MAXIMUM BID'}).click();await page.getByRole('textbox',{name:'Maximum auction bid'}).fill('300000');await expect(page.getByRole('dialog')).toContainText('Escrow charged now: ¥110,000');
 await page.getByRole('button',{name:'CONFIRM HIGHER BID'}).click();expect((await read(page)).cashYen).toBe(1700000);await ready(page);await page.getByRole('button',{name:'COMPLETE CONTRACT'}).click();
 const s=await read(page);expect(s.cashYen).toBe(1775000);expect(s.ownedVehicles[1].catalogId).toBe('crest-rs');await expect(page.getByTestId('specialist-receipt')).toContainText('WON');
});
test('a losing auction gives a complete escrow refund, no car and a retryable fixed offer',async({page})=>{
 await clock(page);await seed(page,start('crest-auction',220000));await market(page,'Auctions');await ready(page);await page.getByRole('button',{name:'COMPLETE CONTRACT'}).click();
 const s=await read(page);expect(s.cashYen).toBe(2000000);expect(s.ownedVehicles).toHaveLength(1);expect(s.advanced.acquiredOfferIds).toEqual([]);await expect(page.getByTestId('specialist-receipt')).toContainText('LOST');
 await expect(page.getByRole('button',{name:'Review specialist Akari Crest RS'})).toBeEnabled();
});
test('auction input rejects invalid amounts and binding-bid confirmation checks cash and level',async({page})=>{
 await clock(page);await seed(page,rich());await market(page,'Auctions');await review(page,'Akari Crest RS');
 for(const bid of ['','not a number','190001','1005000']){await page.getByRole('textbox',{name:'Maximum auction bid'}).fill(bid);await expect(page.getByRole('button',{name:'PLACE BINDING BID'})).toBeDisabled();}
 expect((await read(page)).cashYen).toBe(2000000);
});
test('survey, discovery and project purchase are separate paid stages with no car granted from browsing',async({page})=>{
 await clock(page);await seed(page,rich());await market(page,'Barn Finds');await review(page,'Hoshino Hachi GT');
 await expect(page.getByRole('dialog')).toContainText('non-refundable');await page.getByRole('button',{name:'PAY & START SURVEY'}).click();
 expect((await read(page)).cashYen).toBe(1995000);await ready(page);await page.getByRole('button',{name:'COMPLETE CONTRACT'}).click();
 const discovered=await read(page);expect(discovered.ownedVehicles).toHaveLength(1);expect(discovered.collection.collectedModelIds).not.toContain('hachi-gt');expect(discovered.advanced.surveyedBarnIds).toEqual(['orchard-barn']);
 await review(page,'Hoshino Hachi GT');await expect(page.getByRole('dialog')).toContainText('¥55,000');await page.getByRole('button',{name:'BUY & RECOVER PROJECT'}).click();
 const s=await read(page);expect(s.cashYen).toBe(1940000);expect(s.ownedVehicles[1].engineCondition).toBe(35);expect(s.collection.collectedModelIds).toContain('hachi-gt');
});
test('survey cancellation gives no refund or discovery, including after clock rollback',async({page})=>{
 await clock(page);const s=start('orchard-barn');s.advanced.activeContract!.startedAtMs+=60000;s.advanced.activeContract!.finishesAtMs+=60000;
 await seed(page,s);await market(page,'Barn Finds');await expect(page.getByTestId('specialist-timer')).toHaveText('CLOCK ERROR');
 await page.getByRole('button',{name:'CANCEL CONTRACT'}).click();await page.getByRole('button',{name:'CONFIRM CANCELLATION'}).click();
 expect((await read(page)).cashYen).toBe(1995000);expect((await read(page)).advanced.surveyedBarnIds).toEqual([]);
});
test('the last incoming space blocks both ordinary stock purchases and Icon purchases but delivery always fits',async({page})=>{
 await clock(page);let s=rich();while(s.ownedVehicles.length<11)s.ownedVehicles.push(createPlayerVehicle('pico-rs',`spare-${s.ownedVehicles.length}`));
 s.collection.unlockedAchievementIds.push('starter-trio');s=startSpecialistContract(s,'sora-import',getSpecialistQuoteKey(s,findAdvancedOffer('sora-import')!),T+1000);await seed(page,s);
 await market(page,'Used dealer');await page.locator('.marketCard').first().getByRole('button').click();await expect(page.getByRole('button',{name:'BUY VEHICLE',exact:true})).toBeDisabled();await expect(page.getByRole('dialog')).toContainText('Garage full');await page.keyboard.press('Escape');
 await tab(page,'Collection');await page.getByRole('group',{name:'Collection sections'}).getByRole('button',{name:'Icon Showroom'}).click();await page.getByRole('button',{name:'Review Icon Hoshino Tora 85 Heritage'}).click();await expect(page.getByRole('button',{name:'BUY ICON VEHICLE'})).toBeDisabled();await page.keyboard.press('Escape');
 await market(page,'Imports');await ready(page);await page.getByRole('button',{name:'COMPLETE CONTRACT'}).click();expect((await read(page)).ownedVehicles).toHaveLength(12);
});
test('restoration previews exact condition and cash changes, keeps upgrades and cannot double-pay',async({page})=>{
 let s=installPart(rich(),'first','aoba-panel-filter',null);await seed(page,s);await restoration(page);const quote=getRestorationQuote(s.ownedVehicles[0],'full');const before=await stored(page);
 await page.getByRole('button',{name:'Review Full restoration',exact:true}).click();await page.keyboard.press('Escape');expect(await stored(page)).toBe(before);
 await page.getByRole('button',{name:'Review Full restoration',exact:true}).click();await page.getByRole('button',{name:'PAY & RESTORE'}).evaluate((b:HTMLButtonElement)=>{b.click();b.click();});
 const after=await read(page);expect(after.cashYen).toBe(s.cashYen-quote.costYen);expect(after.advanced.restorationCount).toBe(1);expect(after.ownedVehicles[0].tuning).toEqual(s.ownedVehicles[0].tuning);expect(after.ownedVehicles[0].engineCondition).toBe(100);
 expect(getVehicleBuildStats(after.ownedVehicles[0]).powerPs).toBe(110);await page.reload();expect(await read(page)).toEqual(after);
});
test('a recovered classic can be restored, activated, tuned and raced through the actual UI',async({page})=>{
 await clock(page);let s=finishSpecialistContract(start('orchard-barn'),1,T+46000);await seed(page,s);await market(page,'Barn Finds');await review(page,'Hoshino Hachi GT');await page.getByRole('button',{name:'BUY & RECOVER PROJECT'}).click();
 const id=(await read(page)).ownedVehicles[1].instanceId;await restoration(page);await page.getByRole('combobox',{name:'Vehicle to restore',exact:true}).selectOption(id);await page.getByRole('button',{name:'Review Full restoration'}).click();await page.getByRole('button',{name:'PAY & RESTORE'}).click();
 await tab(page,'Garage');await page.getByRole('button',{name:`Inspect Hoshino Hachi GT (${id})`,exact:true}).click();await page.getByRole('button',{name:'SET AS ACTIVE VEHICLE'}).click();
 await tab(page,'Workshop');await page.getByRole('group',{name:'Workshop services'}).getByRole('button',{name:'Tuning parts'}).click();await page.getByRole('combobox',{name:'Vehicle to tune'}).selectOption(id);await page.getByRole('button',{name:'Review Panel Filter',exact:true}).click();await page.getByRole('button',{name:'BUY & INSTALL',exact:true}).click();
 await tab(page,'Races');await page.getByRole('button',{name:'Briefing East Ward Shakedown',exact:true}).click();await page.getByRole('button',{name:'ENTER RACE',exact:true}).click();expect((await read(page)).racing.activeRace!.vehicleId).toBe(id);
});
for(const kind of ['job','race'] as const)test(`${kind} assigned car restoration stays locked; broker work leaves the driver snapshot untouched`,async({page})=>{
 await clock(page);let s=rich();s.ownedVehicles.push(createPlayerVehicle('tora-85','spare'));
 s=kind==='job'?startJob(s,'parts-run',T+1000):startRace(s,'dockyard-402','first',getRaceBuildKey(s.ownedVehicles[0]),T+1000);
 await seed(page,s);await market(page,'Imports');await review(page);await page.getByRole('button',{name:'PAY & ORDER IMPORT'}).click();await restoration(page);
 await page.getByRole('button',{name:'Review Engine rebuild'}).click();await expect(page.getByRole('button',{name:'PAY & RESTORE'})).toBeDisabled();await expect(page.getByRole('dialog')).toContainText('assigned');await page.keyboard.press('Escape');
 await page.getByRole('combobox',{name:'Vehicle to restore'}).selectOption('spare');await page.getByRole('button',{name:'Review Engine rebuild'}).click();await page.getByRole('button',{name:'PAY & RESTORE'}).click();
 const after=await read(page);expect(after.economy).toEqual(s.economy);expect(after.racing).toEqual(s.racing);expect(after.heat).toEqual(s.heat);
});
for(const action of ['order','bid','survey','restore'] as const)test(`failed ${action} write preserves cash and every gameplay field`,async({page})=>{
 await clock(page);await seed(page,rich());
 if(action==='restore'){await restoration(page);await page.getByRole('button',{name:'Review Full restoration'}).click();}
 else{await market(page,action==='order'?'Imports':action==='bid'?'Auctions':'Barn Finds');await review(page,action==='order'?'Mizuno Sora S':action==='bid'?'Akari Crest RS':'Hoshino Hachi GT');}
 const before=await stored(page);await page.evaluate(()=>{Storage.prototype.setItem=()=>{throw new Error('Storage full');};});
 await page.getByRole('button',{name:action==='order'?'PAY & ORDER IMPORT':action==='bid'?'PLACE BINDING BID':action==='survey'?'PAY & START SURVEY':'PAY & RESTORE',exact:true}).click();
 await expect(page.getByRole('dialog').getByRole('alert')).toContainText('not applied');expect(await stored(page)).toBe(before);
});
test('failed incoming delivery leaves the full paid contract for a successful later retry',async({page})=>{
 await clock(page);await seed(page,start());await market(page,'Imports');await ready(page);const before=await stored(page);
 await page.evaluate(()=>{Storage.prototype.setItem=()=>{throw new Error('Storage full');};});await page.getByRole('button',{name:'COMPLETE CONTRACT'}).click();expect(await stored(page)).toBe(before);
 await page.reload();await market(page,'Imports');await page.getByRole('button',{name:'COMPLETE CONTRACT'}).click();expect((await read(page)).ownedVehicles).toHaveLength(2);
});
test('old v8 collection rewards, Heat, paid races and stock survive migration with only empty new fields',async({page})=>{
 await seedRaw(page,JSON.stringify(v8));const s=await read(page),{advanced,...old}=s;
 expect(old).toEqual(v8.state);expect(advanced).toEqual(createAdvancedState());await expect(page.locator('.saveIndicator')).toContainText('SAVE V9');
});
test('export reset and import preserve exact escrow, reserved car, deadline and model/reward history',async({page})=>{
 await clock(page);await seed(page,start('crest-auction',300000));const before=await read(page);await tab(page,'Saves');await page.getByRole('button',{name:'GENERATE SAVE CODE'}).click();const code=await page.getByRole('textbox',{name:'Exported save code'}).inputValue();
 page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'RESET SAVEGAME'}).click();expect(await read(page)).toEqual(createNewGameState());
 await tab(page,'Saves');await page.getByRole('textbox',{name:'Save code to import'}).fill(code);page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'VALIDATE & IMPORT'}).click();expect(await read(page)).toEqual(before);
 await market(page,'Auctions');await ready(page);await page.getByRole('button',{name:'COMPLETE CONTRACT'}).click();expect((await read(page)).cashYen).toBe(1775000);
});
test('outer city access and Collection Book source links open the correct specialist section without charges',async({page})=>{
 await seed(page,rich());const before=await stored(page);await tab(page,'City');await page.getByRole('button',{name:'Inspect Outer Kagehama',exact:true}).click();await expect(page.getByTestId('district-outskirts-state')).toContainText('OPEN');await page.getByRole('button',{name:'EXPLORE BARN FINDS'}).click();await expect(page.getByRole('heading',{name:'Some stories need saving.'})).toBeVisible();
 await tab(page,'Collection');await page.getByRole('article',{name:'Collection Mizuno Sora S',exact:true}).getByRole('button',{name:'VIEW IMPORT SOURCE'}).click();await expect(page.getByRole('heading',{name:'Across the water.'})).toBeVisible();expect(await stored(page)).toBe(before);
});
test('a stale browser tab cannot duplicate delivery or refund an already settled contract',async({page,context})=>{
 let s=start();s.advanced.activeContract!.startedAtMs=1000;s.advanced.activeContract!.finishesAtMs=91000;await seed(page,s);await market(page,'Imports');const other=await context.newPage();await other.goto('./');await market(other,'Imports');await other.getByRole('button',{name:'COMPLETE CONTRACT'}).click();
 await expect(page.locator('.recoveryPanel')).toContainText('Another tab');await expect(page.getByRole('button',{name:'COMPLETE CONTRACT'})).toBeDisabled();expect((await read(other)).ownedVehicles).toHaveLength(2);
});
for(const [name,width,height] of [['desktop',1440,1000],['mobile',390,844],['narrow',320,780]] as const)test(`${name} specialist and restoration subviews, dialog and persistent HUD fit the screen`,async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width,height});await clock(page);await seed(page,rich());
 for(const [section,car] of [['Imports','Mizuno Sora S'],['Auctions','Akari Crest RS'],['Barn Finds','Hoshino Hachi GT']] as const){
  await market(page,section);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:`test-results/specialist-${section}-${name}.png`,fullPage:true});
  await review(page,car);expect((await page.getByRole('dialog').boundingBox())!.width).toBeLessThanOrEqual(width);await page.screenshot({path:`test-results/specialist-preview-${section}-${name}.png`});await page.keyboard.press('Escape');
 }
 await restoration(page);await page.getByRole('button',{name:'Review Full restoration'}).click();await page.screenshot({path:`test-results/restoration-preview-${name}.png`});await page.keyboard.press('Escape');
 await page.evaluate(()=>window.scrollTo(0,700));await expect(page.getByTestId('cash')).toBeInViewport();await expect(page.getByRole('progressbar',{name:'Level XP progress',exact:true})).toBeInViewport();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);
});
test('blocked webfonts leave all new subviews readable at 320px without hiding horizontal overflow',async({page})=>{
 await page.setViewportSize({width:320,height:780});await page.route('https://fonts.googleapis.com/**',r=>r.abort());await page.route('https://fonts.gstatic.com/**',r=>r.abort());await seed(page,rich());
 for(const s of ['Imports','Auctions','Barn Finds'] as const){await market(page,s);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await restoration(page);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:'test-results/restoration-fallback-320.png',fullPage:true});
});

test('a pending contract stays directly reachable from the ordinary dealer view',async({page})=>{
 await clock(page);await seed(page,start());await market(page,'Used dealer');
 await expect(page.getByRole('complementary',{name:'Specialist activity notice',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'OPEN SPECIALIST CONTRACT',exact:true}).click();
 await expect(page.getByRole('article',{name:'Current specialist contract',exact:true})).toBeVisible();
 await expect(page.getByRole('group',{name:'Market sections',exact:true}).getByRole('button',{name:'Imports',exact:true})).toHaveAttribute('aria-pressed','true');
});
