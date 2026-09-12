import { test, expect, type Page } from '@playwright/test';
import { createNewGameState, purchaseStarter } from '../../src/domain/game';
import { buyMarketVehicle, getListingKey } from '../../src/domain/market';
import { MARKET_REFRESH_FEE, MARKET_REFRESH_MS } from '../../src/domain/marketStock';
import { getVehicleValuation } from '../../src/domain/vehicleValue';
import { installPart } from '../../src/domain/tuning';
import { getRaceBuildKey, startRace } from '../../src/domain/racing';
import { startJob } from '../../src/domain/economy';
import legacyV5 from '../fixtures/save-v5.json' with { type: 'json' };
import { tab, seed, seedRaw, stored, read, clock, T } from './helpers';
const initial = () => purchaseStarter(createNewGameState(), 'pico-rs', 'starter-1');
const rich = () => ({ ...initial(), cashYen: 2000000, playerLevel: 5, reputation: 200 });
const two = () => { const s = rich(); const l = s.market.listings[0]; return buyMarketVehicle(s, l.id, getListingKey(l)); };
async function inspect(page: Page, id = 'market-1-1') { await page.getByRole('button', { name: `Inspect listing ${id}`, exact: true }).click(); await expect(page.getByRole('dialog')).toBeVisible(); }
async function buy(page: Page, id = 'market-1-1') { await inspect(page, id); await page.getByRole('button', { name: 'CONFIRM PURCHASE', exact: true }).click(); await expect(page.getByRole('dialog')).toHaveCount(0); }
async function sale(page: Page, id: string) { await page.getByRole('button', { name: /^SELL CARS/ }).click(); await page.getByRole('button', { name: `Review sale ${id}`, exact: true }).click(); }

test('Market requires a starter, is a seventh real tab and participates in keyboard navigation', async ({ page }) => {
  await page.goto('./'); await expect(page.getByRole('tab', { name: 'Market', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Choose Hoshino Pico RS' }).click(); await page.getByRole('button', { name: 'BUY & ENTER KAGEHAMA' }).click();
  await tab(page, 'Workshop'); await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Market', exact: true })).toBeFocused();
  await expect(page.getByRole('tabpanel')).toHaveCount(1); await expect(page.getByRole('tabpanel')).toHaveAttribute('id', 'panel-market');
  await expect(page.locator('.marketGrid .marketCard')).toHaveCount(9); await expect(page.getByRole('progressbar', { name: 'Level XP progress', exact: true })).toBeInViewport();
  await page.keyboard.press('ArrowRight'); await expect(page.getByRole('tab', { name: 'Saves', exact: true })).toBeFocused();
});
test('brand/body/year filters combine, persist across tabs and clear without a save write', async ({ page }) => {
  const state = rich(); const year = state.market.listings[3].vehicle.year; await seed(page, state); const before = await stored(page); await tab(page, 'Market');
  await page.getByRole('combobox', { name: 'Market manufacturer' }).selectOption('hoshino');
  await page.getByRole('combobox', { name: 'Market body type' }).selectOption('sedan');
  await page.getByRole('textbox', { name: 'Market year from' }).fill(String(year)); await page.getByRole('textbox', { name: 'Market year to' }).fill(String(year));
  await expect(page.locator('.marketGrid .marketCard')).toHaveCount(1); await expect(page.locator('.marketGrid')).toContainText('Hoshino Mira S');
  await tab(page, 'City'); await tab(page, 'Market'); await expect(page.getByRole('textbox', { name: 'Market year from' })).toHaveValue(String(year));
  await page.getByRole('combobox', { name: 'Market manufacturer' }).selectOption('mikado'); await expect(page.getByRole('heading', { name: 'No matching cars.' })).toBeVisible();
  await page.getByRole('button', { name: 'CLEAR FILTERS', exact: true }).click(); await expect(page.locator('.marketGrid .marketCard')).toHaveCount(9);
  await page.getByRole('combobox', { name: 'Sort market listings' }).selectOption('price-high'); expect(await stored(page)).toBe(before);
});
test('invalid year bounds are explained and do not mutate listings', async ({ page }) => {
  await seed(page, rich()); const before = await stored(page); await tab(page, 'Market');
  await page.getByRole('textbox', { name: 'Market year from' }).fill('2000'); await page.getByRole('textbox', { name: 'Market year to' }).fill('1990');
  await expect(page.locator('.marketPanel')).toContainText('From year must not be later'); expect(await stored(page)).toBe(before);
});
test('cancel is free; confirmed purchase charges once, survives reload and appears in Garage', async ({ page }) => {
  const state = rich(); await seed(page, state); await tab(page, 'Market'); const before = await stored(page);
  await inspect(page); await page.getByRole('button', { name: 'CANCEL', exact: true }).click(); expect(await stored(page)).toBe(before);
  await buy(page); await expect(page.getByTestId('cash')).toHaveText(`¥${(state.cashYen - state.market.listings[0].askYen).toLocaleString('en-US')}`);
  expect((await read(page)).market.purchases).toBe(1); expect((await read(page)).activeVehicleId).toBe('starter-1');
  await page.getByRole('checkbox', { name: 'Include purchased listings' }).check(); await expect(page.getByRole('article', { name: 'Listing market-1-1', exact: true })).toContainText('PURCHASED');
  await expect(page.getByRole('button', { name: 'Inspect listing market-1-1', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'OPEN GARAGE', exact: true }).click(); await expect(page.locator('.ownedCard')).toHaveCount(2);
  await page.reload(); await expect(page.locator('.ownedCard')).toHaveCount(2); await tab(page, 'Market'); await expect(page.getByTestId('market-capacity')).toHaveText('2 / 12');
});
test('double purchase confirmation cannot duplicate an instance or charge twice', async ({ page }) => {
  const s = rich(); await seed(page, s); await tab(page, 'Market'); await inspect(page);
  await page.getByRole('button', { name: 'CONFIRM PURCHASE', exact: true }).evaluate((b: HTMLButtonElement) => { b.click(); b.click(); });
  const state = await read(page); expect(state.ownedVehicles).toHaveLength(2); expect(state.cashYen).toBe(s.cashYen - s.market.listings[0].askYen);
});
test('level and money requirements disable purchase confirmation', async ({ page }) => {
  await seed(page, initial()); await tab(page, 'Market'); await inspect(page);
  await expect(page.getByRole('dialog')).toContainText('Requires Level 2'); await expect(page.getByRole('button', { name: 'CONFIRM PURCHASE' })).toBeDisabled();
  await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).toHaveCount(0);
});
test('selling the active car clearly identifies its replacement and retains old records', async ({ page }) => {
  const s = two(); await seed(page, s); await tab(page, 'Market'); await sale(page, 'starter-1');
  await expect(page.getByRole('dialog')).toContainText('market-1-1');
  const expected = getVehicleValuation(s.ownedVehicles[0])!.offerYen;
  await page.getByRole('button', { name: 'CONFIRM SALE', exact: true }).click();
  expect((await read(page)).activeVehicleId).toBe('market-1-1'); expect((await read(page)).cashYen).toBe(s.cashYen + expected);
  await tab(page, 'Garage'); await expect(page.locator('.ownedCard')).toHaveCount(1); await expect(page.locator('.dossier')).toContainText('market-1-1');
});
test('last car sale is blocked and a cancelled sale does not remove anything', async ({ page }) => {
  const s = two(); await seed(page, s); await tab(page, 'Market'); const before = await stored(page); await sale(page, 'market-1-1');
  await page.getByRole('button', { name: 'CANCEL', exact: true }).click(); expect(await stored(page)).toBe(before);
  await sale(page, 'market-1-1'); await page.getByRole('button', { name: 'CONFIRM SALE', exact: true }).click();
  await sale(page, 'starter-1'); await expect(page.getByRole('dialog')).toContainText('last ride cannot be sold'); await expect(page.getByRole('button', { name: 'CONFIRM SALE' })).toBeDisabled();
});
test('selling a tuned car includes stored parts and cannot apply twice', async ({ page }) => {
  const s = installPart(two(), 'market-1-1', 'aoba-panel-filter', null); await seed(page, s); await tab(page, 'Market'); await sale(page, 'market-1-1');
  await expect(page.getByRole('dialog')).toContainText('1 purchased parts'); const quote = getVehicleValuation(s.ownedVehicles[1])!.offerYen;
  await page.getByRole('button', { name: 'CONFIRM SALE', exact: true }).evaluate((b: HTMLButtonElement) => { b.click(); b.click(); });
  expect((await read(page)).market.sales).toBe(1); expect((await read(page)).cashYen).toBe(s.cashYen + quote);
});
for (const activity of ['job', 'race'] as const) {
  test(`assigned ${activity} car cannot be sold, including when ready; other trading preserves its snapshot`, async ({ page }) => {
    const s = two(); const car = s.ownedVehicles[0]; const pending = activity === 'job' ? startJob(s, 'parts-run', T + 1000)
      : startRace(s, 'dockyard-402', car.instanceId, getRaceBuildKey(car), T + 1000);
    await clock(page); await seed(page, pending); await tab(page, 'Market'); await sale(page, 'starter-1');
    await expect(page.getByRole('dialog')).toContainText('assigned to a job or race'); await expect(page.getByRole('button', { name: 'CONFIRM SALE' })).toBeDisabled();
    await page.keyboard.press('Escape'); await page.getByRole('button', { name: /^BUY CARS/ }).click(); await buy(page, 'market-1-2');
    await page.clock.runFor(60000); await sale(page, 'starter-1'); await expect(page.getByRole('button', { name: 'CONFIRM SALE' })).toBeDisabled();
    expect((await read(page)).economy).toEqual(pending.economy); expect((await read(page)).racing).toEqual(pending.racing);
  });
}
test('new market models can be activated, tuned and entered into a race through real UI', async ({ page }) => {
  await seed(page, rich()); await tab(page, 'Market'); await buy(page, 'market-1-4'); await tab(page, 'Garage');
  await page.getByRole('button', { name: 'Inspect Hoshino Mira S (market-1-4)', exact: true }).click();
  await page.getByRole('button', { name: 'SET AS ACTIVE VEHICLE', exact: true }).click(); await tab(page, 'Workshop');
  await page.getByRole('combobox', { name: 'Vehicle to tune' }).selectOption('market-1-4'); await page.getByRole('button', { name: 'Review Panel Filter', exact: true }).click();
  await page.getByRole('button', { name: 'BUY & INSTALL', exact: true }).click(); await expect(page.getByTestId('build-powerPs')).toHaveText('147PS');
  await tab(page, 'Races'); await expect(page.locator('#panel-races')).toContainText('Hoshino Mira S');
});
test('refresh requires explicit payment and confirmation, persists its cooldown and never happens on reload', async ({ page }) => {
  await clock(page); await seed(page, rich()); await tab(page, 'Market'); const s = await read(page);
  await page.getByRole('button', { name: 'REVIEW NEW STOCK' }).click(); await page.getByRole('button', { name: 'CANCEL', exact: true }).click(); expect(await read(page)).toEqual(s);
  await page.getByRole('button', { name: 'REVIEW NEW STOCK' }).click(); await page.getByRole('button', { name: 'CONFIRM NEW STOCK' }).click();
  const after = await read(page); expect(after.cashYen).toBe(s.cashYen - MARKET_REFRESH_FEE); expect(after.market.batch).toBe(2);
  await expect(page.getByRole('button', { name: 'REVIEW NEW STOCK' })).toBeDisabled(); await page.reload(); await tab(page, 'Market');
  expect((await read(page)).market).toEqual(after.market); await page.clock.runFor(MARKET_REFRESH_MS);
  await expect(page.getByRole('button', { name: 'REVIEW NEW STOCK' })).toBeEnabled(); expect((await read(page)).market.batch).toBe(2);
});
for (const kind of ['purchase', 'sale', 'refresh'] as const) {
  test(`failed ${kind} storage write leaves cash, cars and stock intact with global recovery`, async ({ page }) => {
    await seed(page, two()); await tab(page, 'Market'); const before = await stored(page);
    await page.evaluate(() => { Storage.prototype.setItem = () => { throw new Error('Storage full'); }; });
    if (kind === 'purchase') await inspect(page, 'market-1-2');
    else if (kind === 'sale') await sale(page, 'market-1-1');
    else await page.getByRole('button', { name: 'REVIEW NEW STOCK' }).click();
    await page.getByRole('button', { name: kind === 'purchase' ? 'CONFIRM PURCHASE' : kind === 'sale' ? 'CONFIRM SALE' : 'CONFIRM NEW STOCK', exact: true }).click();
    await expect(page.getByRole('dialog').getByRole('alert')).toContainText('not applied'); expect(await stored(page)).toBe(before);
    await page.keyboard.press('Escape'); await tab(page, 'Garage'); await expect(page.locator('.recoveryPanel')).toContainText('Could not save this change');
  });
}
test('full export reset import restores purchases, sold flags, cooldown and pending job', async ({ page }) => {
  await clock(page); await seed(page, startJob(two(), 'parts-run', T + 1000)); await tab(page, 'Market'); await buy(page, 'market-1-2');
  const before = await read(page); await tab(page, 'Saves'); await page.getByRole('button', { name: 'GENERATE SAVE CODE' }).click();
  const code = await page.getByRole('textbox', { name: 'Exported save code' }).inputValue(); page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'RESET SAVEGAME' }).click(); expect(await read(page)).toEqual(createNewGameState());
  await tab(page, 'Saves'); await page.getByRole('textbox', { name: 'Save code to import' }).fill(code); page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'VALIDATE & IMPORT' }).click(); expect(await read(page)).toEqual(before); await tab(page, 'Market');
  await expect(page.getByRole('combobox', { name: 'Market manufacturer' })).toHaveValue('all');
});
test('v5 migration keeps tuned car and pending work and adds stock without free owned cars', async ({ page }) => {
  await seedRaw(page, JSON.stringify(legacyV5)); await expect(page.locator('.saveIndicator')).toContainText('SAVE V6');
  const state = await read(page); const { market, ...old } = state; expect(old).toEqual(legacyV5.state); expect(market.listings).toHaveLength(9);
  await tab(page, 'Market'); await expect(page.getByTestId('market-capacity')).toHaveText('1 / 12');
});
test('a stale browser tab cannot duplicate a purchase', async ({ page, context }) => {
  await seed(page, rich()); await tab(page, 'Market'); const other = await context.newPage(); await other.goto('./'); await tab(other, 'Market');
  await buy(other); await expect(page.locator('.recoveryPanel')).toContainText('Another tab changed this save');
  await expect(page.getByRole('button', { name: 'Inspect listing market-1-1', exact: true })).toBeDisabled(); expect((await read(other)).market.purchases).toBe(1);
});
for (const [name, width, height] of [['desktop', 1440, 1000], ['mobile', 390, 844], ['narrow', 320, 780]] as const) {
  test(`${name} market cards, filters, preview and sticky XP HUD fit the screen`, async ({ page }) => {
    const errors: string[] = []; page.on('pageerror', (error) => errors.push(error.message));
    await page.setViewportSize({ width, height }); await seed(page, rich()); await tab(page, 'Market');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `test-results/market-${name}.png`, fullPage: true });
    await page.evaluate(() => window.scrollTo(0, 900)); await expect(page.getByTestId('cash')).toBeInViewport();
    await expect(page.getByRole('progressbar', { name: 'Level XP progress', exact: true })).toBeInViewport();
    await page.screenshot({ path: `test-results/market-hud-${name}.png` });
    await inspect(page); expect((await page.getByRole('dialog').boundingBox())!.width).toBeLessThanOrEqual(width);
    await page.screenshot({ path: `test-results/market-preview-${name}.png` }); await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Inspect listing market-1-1', exact: true })).toBeFocused(); expect(errors).toEqual([]);
  });
}
