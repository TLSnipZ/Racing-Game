import { createHeatState } from '../../src/domain/heat';
import { test, expect, type Page } from '@playwright/test';
import legacyV5 from '../fixtures/save-v5.json' with { type: 'json' };
import { createNewGameState, createPlayerVehicle, purchaseStarter } from '../../src/domain/game';
import { buyMarketVehicle, refreshMarket } from '../../src/domain/market';
import { MARKET_REFRESH_MS } from '../../src/domain/marketStock';
import { getVehicleValuation } from '../../src/domain/marketValue';
import { getRaceBuildKey, startRace } from '../../src/domain/racing';
import { startJob } from '../../src/domain/economy';
import { installPart } from '../../src/domain/tuning';
import { SAVE_VERSION } from '../../src/domain/persistence';
import { seed, seedRaw, tab, stored, read, clock, T } from './helpers';

const initial = () => purchaseStarter(createNewGameState(), 'pico-rs', 'starter');
const rich = () => ({ ...initial(), cashYen: 1000000, playerLevel: 6, reputation: 300 });
function twoCars() { const game = rich(); const l = game.market.listings[1]; return buyMarketVehicle(game, l.id, 0, l.askingPriceYen); }
const stockCard = (page: Page, name: string) => page.getByRole('article', { name: `${name} listing`, exact: true });
async function inspect(page: Page, name: string) {
  await page.getByRole('button', { name: `Inspect listing ${name}`, exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Confirm vehicle purchase' })).toBeVisible();
}
async function buy(page: Page, name = 'Hoshino Tora 85') { await inspect(page, name); await page.getByRole('button', { name: 'BUY VEHICLE', exact: true }).click(); await expect(page.getByRole('dialog')).toHaveCount(0); }
async function saleMode(page: Page) { await page.getByRole('button', { name: /^SELL A CAR/ }).click(); }
async function reviewSale(page: Page, id: string) { await page.getByRole('button', { name: `Review sale ${id}`, exact: true }).click(); await expect(page.getByRole('dialog', { name: 'Confirm vehicle sale' })).toBeVisible(); }

test('Market unlocks after exactly one starter choice; city and garage links open the same section', async ({ page }) => {
  await page.goto('./'); await expect(page.getByRole('tab', { name: 'Market', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Choose Hoshino Pico RS' }).click(); await page.getByRole('button', { name: 'BUY & ENTER KAGEHAMA' }).click();
  await page.getByRole('button', { name: 'OPEN VEHICLE MARKET', exact: true }).click();
  await expect(page.getByRole('tabpanel')).toHaveAttribute('id', 'panel-market'); await expect(page.getByRole('heading', { name: 'Find your next mistake.' })).toBeVisible();
  expect((await read(page)).ownedVehicles).toHaveLength(1); const before = await stored(page);
  await tab(page, 'City'); await page.getByRole('button', { name: 'OPEN USED CAR MARKET', exact: true }).click();
  await expect(page.getByRole('tab', { name: 'Market', exact: true })).toBeFocused(); expect(await stored(page)).toBe(before);
});
test('brand, body type and inclusive year filters combine; reset restores all six offers', async ({ page }) => {
  await seed(page, rich()); const before = await stored(page); await tab(page, 'Market');
  await expect(page.locator('.marketCard')).toHaveCount(6);
  await page.getByRole('combobox', { name: 'Market manufacturer' }).selectOption('hoshino');
  await page.getByRole('group', { name: 'Market body types' }).getByRole('button', { name: 'Hatchback', exact: true }).click();
  await expect(page.locator('.marketCard')).toHaveCount(2);
  const year = String((await read(page)).market.listings[0].vehicle.year);
  await page.getByRole('textbox', { name: 'Market year from' }).fill(year); await page.getByRole('textbox', { name: 'Market year to' }).fill(year);
  await expect(page.locator('.marketCard')).toHaveCount(1); await expect(stockCard(page, 'Hoshino Pico RS')).toBeVisible();
  await page.getByRole('combobox', { name: 'Market manufacturer' }).selectOption('akari'); await expect(page.locator('.marketCard')).toHaveCount(0);
  await expect(page.locator('.marketEmpty')).toContainText('No cars match'); await page.getByRole('button', { name: 'RESET MARKET FILTERS' }).click();
  await expect(page.locator('.marketCard')).toHaveCount(6); expect(await stored(page)).toBe(before);
});
test('sorting and search persist across tabs without buying, rerolling stock or altering job deadlines', async ({ page }) => {
  await seed(page, startJob(rich(), 'garage-shift', T)); await tab(page, 'Market'); const before = await stored(page);
  await page.getByRole('combobox', { name: 'Sort market vehicles' }).selectOption('price-desc');
  await page.getByRole('searchbox', { name: 'Search market vehicles' }).fill('Akari'); await expect(page.locator('.marketCard')).toHaveCount(2);
  await tab(page, 'Garage'); await tab(page, 'Market'); await expect(page.getByRole('combobox', { name: 'Sort market vehicles' })).toHaveValue('price-desc');
  await expect(page.getByRole('searchbox', { name: 'Search market vehicles' })).toHaveValue('Akari'); expect(await stored(page)).toBe(before);
  await page.reload(); await tab(page, 'Market'); await expect(page.getByRole('searchbox', { name: 'Search market vehicles' })).toHaveValue('');
  expect((await read(page)).economy.activeJob?.startedAtMs).toBe(T);
});
test('invalid and inverted year ranges explain the empty result instead of changing inventory', async ({ page }) => {
  await seed(page, rich()); await tab(page, 'Market'); const before = await stored(page);
  await page.getByRole('textbox', { name: 'Market year from' }).fill('19'); await expect(page.getByRole('alert')).toContainText('four-digit');
  await page.getByRole('textbox', { name: 'Market year from' }).fill('2001'); await page.getByRole('textbox', { name: 'Market year to' }).fill('1985');
  await expect(page.getByRole('alert')).toContainText('earliest'); expect(await stored(page)).toBe(before);
});
test('purchase preview and cancel are read-only; confirmed purchase saves the exact advertised car without activation', async ({ page }) => {
  const game = rich(); const listing = game.market.listings[1]; await seed(page, game); await tab(page, 'Market'); const before = await stored(page);
  await inspect(page, listing.vehicle.name); await expect(page.getByRole('dialog')).toContainText(String(listing.vehicle.engineCondition) + '%');
  await page.getByRole('button', { name: 'CANCEL', exact: true }).click(); expect(await stored(page)).toBe(before);
  await buy(page); const after = await read(page); expect(after.ownedVehicles[1]).toEqual(listing.vehicle);
  expect(after.cashYen).toBe(game.cashYen - listing.askingPriceYen); expect(after.activeVehicleId).toBe('starter');
  await expect(stockCard(page, 'Hoshino Tora 85')).toHaveCount(0); await expect(page.getByTestId('garage-capacity')).toHaveText('2 / 12');
  await tab(page, 'Garage'); await expect(page.getByRole('button', { name: `Inspect Hoshino Tora 85 (${listing.id})` })).toBeVisible();
  await page.reload(); expect(await read(page)).toEqual(after);
});
test('duplicate confirmation charges for only one car and leaves no error', async ({ page }) => {
  await seed(page, rich()); await tab(page, 'Market'); await inspect(page, 'Hoshino Tora 85');
  await page.getByRole('button', { name: 'BUY VEHICLE', exact: true }).evaluate((b: HTMLButtonElement) => { b.click(); b.click(); });
  const after = await read(page); expect(after.market.purchasedCount).toBe(1); expect(after.ownedVehicles).toHaveLength(2);
  await expect(page.locator('.recoveryPanel')).toHaveCount(0);
});
test('cash and level gates are visible in the listing preview', async ({ page }) => {
  await seed(page, { ...initial(), cashYen: 0 }); await tab(page, 'Market'); await inspect(page, 'Hoshino Tora 85');
  await expect(page.getByRole('dialog')).toContainText('Not enough cash'); await expect(page.getByRole('button', { name: 'BUY VEHICLE', exact: true })).toBeDisabled();
  await page.keyboard.press('Escape'); await inspect(page, 'Akari Senda S'); await expect(page.getByRole('dialog')).toContainText('Requires Level 3');
  await expect(page.getByRole('button', { name: 'BUY VEHICLE', exact: true })).toBeDisabled();
});
test('the current 12-space limit blocks new purchases but retains imported extra cars', async ({ page }) => {
  const game = rich(); for (let i = 0; i < 12; i++) game.ownedVehicles.push(createPlayerVehicle('tora-85', `legacy-extra-${i}`));
  await seed(page, game); await tab(page, 'Market'); await inspect(page, 'Akari RZ-T');
  await expect(page.getByRole('dialog')).toContainText('Garage full'); await expect(page.getByRole('button', { name: 'BUY VEHICLE', exact: true })).toBeDisabled();
  expect((await read(page)).ownedVehicles).toHaveLength(13);
});
test('active-car sale requires an explicit replacement and includes the selected car parts', async ({ page }) => {
  let game = twoCars(); game = installPart(game, 'starter', 'aoba-panel-filter', null); const quote = getVehicleValuation(game.ownedVehicles[0]);
  await seed(page, game); await tab(page, 'Market'); await saleMode(page); await reviewSale(page, 'starter');
  await expect(page.getByRole('button', { name: 'SELL VEHICLE', exact: true })).toBeDisabled();
  await expect(page.getByRole('dialog')).toContainText('all 1 purchased parts');
  await page.getByRole('combobox', { name: 'Replacement active vehicle' }).selectOption(game.ownedVehicles[1].instanceId);
  await page.getByRole('button', { name: 'SELL VEHICLE', exact: true }).click();
  const after = await read(page); expect(after.ownedVehicles).toHaveLength(1); expect(after.cashYen).toBe(game.cashYen + quote.offerYen);
  expect(after.activeVehicleId).toBe(game.ownedVehicles[1].instanceId); expect(after.ownedVehicles[0].tuning.purchasedPartIds).toHaveLength(0);
  await expect(page.getByRole('button', { name: `Review sale ${after.activeVehicleId}`, exact: true })).toBeDisabled();
  await page.reload(); expect(await read(page)).toEqual(after);
});
test('sale cancellation preserves the car, parts and money; inactive sale does not switch the active car', async ({ page }) => {
  const game = twoCars(); const car = game.ownedVehicles[1]; await seed(page, game); await tab(page, 'Market'); await saleMode(page); const before = await stored(page);
  await reviewSale(page, car.instanceId); await page.keyboard.press('Escape'); expect(await stored(page)).toBe(before);
  await reviewSale(page, car.instanceId); await page.getByRole('button', { name: 'SELL VEHICLE', exact: true }).evaluate((b: HTMLButtonElement) => { b.click(); b.click(); });
  expect((await read(page)).activeVehicleId).toBe('starter'); expect((await read(page)).market.soldCount).toBe(1);
  await expect(page.locator('.recoveryPanel')).toHaveCount(0);
});
test('new sedan can be purchased, selected, tuned and used in a race through the real interface', async ({ page }) => {
  await clock(page); await seed(page, rich()); await tab(page, 'Market'); await buy(page, 'Akari Senda S');
  const car = (await read(page)).ownedVehicles.find((v) => v.catalogId === 'senda-s')!;
  await tab(page, 'Workshop'); await page.getByRole('combobox', { name: 'Vehicle to tune' }).selectOption(car.instanceId);
  await page.getByRole('button', { name: 'Review Panel Filter', exact: true }).click(); await page.getByRole('button', { name: 'BUY & INSTALL', exact: true }).click();
  expect((await read(page)).ownedVehicles.find((v) => v.instanceId === car.instanceId)!.tuning.purchasedPartIds).toContain('aoba-panel-filter');
  await tab(page, 'Races'); await page.getByRole('combobox', { name: 'Race vehicle' }).selectOption(car.instanceId);
  await page.getByRole('button', { name: 'Briefing East Ward Shakedown', exact: true }).click(); await page.getByRole('button', { name: 'ENTER RACE', exact: true }).click();
  expect((await read(page)).racing.activeRace?.vehicleId).toBe(car.instanceId);
});
test('assigned delivery car cannot be sold; another parked car can be sold without changing its job', async ({ page }) => {
  const game = startJob(twoCars(), 'parts-run', T + 1000); await clock(page); await seed(page, game); await tab(page, 'Market'); await saleMode(page);
  await expect(page.getByRole('button', { name: 'Review sale starter', exact: true })).toBeDisabled();
  await reviewSale(page, game.ownedVehicles[1].instanceId); await page.getByRole('button', { name: 'SELL VEHICLE', exact: true }).click();
  expect((await read(page)).economy).toEqual(game.economy); await page.clock.runFor(30000); await tab(page, 'Jobs');
  await page.getByRole('button', { name: 'CLAIM REWARD', exact: true }).click(); expect((await read(page)).economy.completedJobs).toBe(1);
});
test('buying while a race runs preserves its paid snapshot; assigned car remains protected even after finishing', async ({ page }) => {
  const base = rich(); const running = startRace(base, 'hakuro-intro', 'starter', getRaceBuildKey(base.ownedVehicles[0]), T + 1000);
  await clock(page); await seed(page, running); await tab(page, 'Market'); await buy(page); await saleMode(page);
  await expect(page.getByRole('button', { name: 'Review sale starter', exact: true })).toBeDisabled();
  await page.clock.runFor(60000); await expect(page.getByTestId('race-ready-badge')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Review sale starter', exact: true })).toBeDisabled();
  expect((await read(page)).racing).toEqual(running.racing); await tab(page, 'Races');
  await page.getByRole('button', { name: 'SETTLE RESULT', exact: true }).click(); expect((await read(page)).racing.completedRaces).toBe(1);
});
test('confirmed refresh replaces only unsold stock and cooldown survives reload and absence', async ({ page }) => {
  await clock(page); await seed(page, twoCars()); await tab(page, 'Market'); const before = await read(page);
  await page.getByRole('button', { name: 'REQUEST NEW STOCK', exact: true }).click(); await page.getByRole('button', { name: 'CANCEL', exact: true }).click();
  expect(await read(page)).toEqual(before);
  await page.getByRole('button', { name: 'REQUEST NEW STOCK', exact: true }).click(); await page.getByRole('button', { name: 'CONFIRM STOCK REFRESH', exact: true }).click();
  const after = await read(page); expect(after.market.generation).toBe(1); expect(after.ownedVehicles).toEqual(before.ownedVehicles); expect(after.cashYen).toBe(before.cashYen);
  await expect(page.getByRole('button', { name: 'REQUEST NEW STOCK', exact: true })).toBeDisabled();
  await page.reload(); await tab(page, 'Market'); expect((await read(page)).market).toEqual(after.market);
  await tab(page, 'City'); await page.clock.runFor(MARKET_REFRESH_MS); await tab(page, 'Market');
  await expect(page.getByRole('button', { name: 'REQUEST NEW STOCK', exact: true })).toBeEnabled(); expect((await read(page)).market.generation).toBe(1);
});
for (const operation of ['buy', 'sell', 'refresh'] as const) {
  test(`failed ${operation} storage write preserves all cars, stock and money and offers global recovery`, async ({ page }) => {
    await seed(page, twoCars()); await tab(page, 'Market'); const before = await stored(page);
    if (operation === 'buy') await inspect(page, 'Akari RZ-T');
    if (operation === 'sell') { await saleMode(page); await reviewSale(page, (await read(page)).ownedVehicles[1].instanceId); }
    if (operation === 'refresh') await page.getByRole('button', { name: 'REQUEST NEW STOCK', exact: true }).click();
    await page.evaluate(() => { Storage.prototype.setItem = () => { throw new Error('Storage full'); }; });
    await page.getByRole('button', { name: operation === 'buy' ? 'BUY VEHICLE' : operation === 'sell' ? 'SELL VEHICLE' : 'CONFIRM STOCK REFRESH', exact: true }).click();
    await expect(page.getByRole('dialog').getByRole('alert')).toContainText('not applied'); expect(await stored(page)).toBe(before);
    await page.keyboard.press('Escape'); await tab(page, 'Garage'); await expect(page.locator('.recoveryPanel')).toContainText('Could not save');
  });
}
test('export, reset and import restore trades, exact stock, cooldown, cars and filters start clean', async ({ page }) => {
  await clock(page); await seed(page, refreshMarket(twoCars(), 0, T)); await tab(page, 'Market');
  await page.getByRole('combobox', { name: 'Market manufacturer' }).selectOption('kazuma'); const before = await read(page);
  await tab(page, 'Saves'); await page.getByRole('button', { name: 'GENERATE SAVE CODE', exact: true }).click();
  const code = await page.getByRole('textbox', { name: 'Exported save code' }).inputValue();
  page.once('dialog', (d) => d.accept()); await page.getByRole('button', { name: 'RESET SAVEGAME', exact: true }).click();
  await expect(page.getByRole('tab', { name: 'Market', exact: true })).toBeDisabled(); expect((await read(page)).market.generation).toBe(0);
  await tab(page, 'Saves'); await page.getByRole('textbox', { name: 'Save code to import' }).fill(code);
  page.once('dialog', (d) => d.accept()); await page.getByRole('button', { name: 'VALIDATE & IMPORT', exact: true }).click();
  expect(await read(page)).toEqual(before); await tab(page, 'Market');
  await expect(page.getByRole('combobox', { name: 'Market manufacturer' })).toHaveValue('all');
  await expect(page.getByRole('button', { name: 'REQUEST NEW STOCK', exact: true })).toBeDisabled();
});
test('a frozen v5 save migrates without losing tuned parts, money or its unsettled paid race', async ({ page }) => {
  await seedRaw(page, JSON.stringify(legacyV5)); await expect(page.locator('.saveIndicator')).toContainText(`SAVE V${SAVE_VERSION}`);
  const { heat, market, ...old } = await read(page); expect(old).toEqual(legacyV5.state); expect(heat).toEqual(createHeatState()); expect(market.listings).toHaveLength(6); expect(market.purchasedCount).toBe(0);
  await tab(page, 'Market'); expect((await read(page)).racing).toEqual(legacyV5.state.racing);
});
test('a malformed current market stays protected and is never auto-deleted or silently rerolled', async ({ page }) => {
  const raw = JSON.stringify({ version: 6, savedAt: T, state: { ...rich(), market: { broken: true } } });
  await seedRaw(page, raw); await expect(page.locator('.recoveryPanel')).toContainText('protected'); expect(await stored(page)).toBe(raw);
  await tab(page, 'Saves'); await expect(page.getByRole('button', { name: 'RESET SAVEGAME', exact: true })).toBeVisible();
  await page.reload(); expect(await stored(page)).toBe(raw);
});
test('another browser tab buying the same listing blocks a stale purchase preview', async ({ page, context }) => {
  await seed(page, rich()); await tab(page, 'Market'); await inspect(page, 'Hoshino Tora 85');
  const other = await context.newPage(); await other.goto('./'); await tab(other, 'Market'); await buy(other);
  await expect(page.getByRole('button', { name: 'BUY VEHICLE', exact: true })).toBeDisabled();
  await page.keyboard.press('Escape'); await expect(page.locator('.recoveryPanel')).toContainText('Another tab');
  expect((await read(page)).market.purchasedCount).toBe(1); expect((await read(page)).ownedVehicles).toHaveLength(2);
});
for (const [name, width, height] of [['desktop', 1440, 1000], ['mobile', 390, 844], ['narrow', 320, 780]] as const) {
  test(`${name} market filters, cards, preview and sale stay usable below the fixed XP HUD`, async ({ page }) => {
    const errors: string[] = []; page.on('pageerror', (e) => errors.push(e.message)); await page.setViewportSize({ width, height });
    await page.route('https://fonts.googleapis.com/**', (route) => route.abort());
    await seed(page, twoCars()); await tab(page, 'Market');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `test-results/market-${name}.png`, fullPage: true });
    await page.evaluate(() => window.scrollTo(0, 600)); await expect(page.getByTestId('cash')).toBeInViewport();
    await expect(page.getByRole('progressbar', { name: 'Level XP progress', exact: true })).toBeInViewport();
    await page.screenshot({ path: `test-results/market-hud-${name}.png` });
    await inspect(page, 'Akari Senda S'); await page.screenshot({ path: `test-results/market-preview-${name}.png` });
    expect((await page.getByRole('dialog').boundingBox())!.width).toBeLessThanOrEqual(width);
    await expect(page.getByRole('button', { name: 'BUY VEHICLE', exact: true })).toBeEnabled(); await page.keyboard.press('Escape');
    await saleMode(page); await reviewSale(page, 'starter'); await page.getByRole('combobox', { name: 'Replacement active vehicle' }).selectOption('market-v1:0:tora-85');
    await page.screenshot({ path: `test-results/market-sale-${name}.png` });
    await page.getByRole('button', { name: 'SELL VEHICLE', exact: true }).click(); expect((await read(page)).ownedVehicles).toHaveLength(1);
    expect(errors).toEqual([]);
  });
}
