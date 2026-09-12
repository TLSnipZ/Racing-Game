import { createHeatState } from '../../src/domain/heat';
import { expect, test, type Page } from '@playwright/test';
import legacyV4 from '../fixtures/save-v4.json' with { type: 'json' };
import { createNewGameState, createPlayerVehicle, purchaseStarter } from '../../src/domain/game';
import { startJob } from '../../src/domain/economy';
import { getRaceBuildKey, startRace } from '../../src/domain/racing';
import { getPlayerPosition } from '../../src/domain/raceModel';
import { SLOT_LABELS } from '../../src/data/parts';
import { SAVE_VERSION } from '../../src/domain/persistence';
import { tab, seed, seedRaw, stored, read, clock, T } from './helpers';
const initial = () => purchaseStarter(createNewGameState(), 'pico-rs', 'pico-1');
const rich = () => ({ ...initial(), cashYen: 100000, playerLevel: 6, reputation: 300 });
const pending = () => { const state = rich(); return startRace(state, 'dockyard-402', 'pico-1', getRaceBuildKey(state.ownedVehicles[0]), T + 1000); };
async function briefing(page: Page, name = 'East Ward Shakedown') {
  await page.getByRole('button', { name: `Briefing ${name}`, exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
}
async function enter(page: Page, name = 'East Ward Shakedown') {
  await briefing(page, name); await page.getByRole('button', { name: 'ENTER RACE', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
}
async function advanceRace(page: Page) {
  const race = (await read(page)).racing.activeRace!;
  await page.clock.runFor(race.finishesAtMs - await page.evaluate(() => Date.now()));
}

test('races unlock after a starter, retain four disciplines and show explicit level/fee gates', async ({ page }) => {
  await page.goto('./'); await expect(page.getByRole('tab', { name: 'Races', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Choose Akari RZ-T' }).click(); await page.getByRole('button', { name: 'BUY & ENTER KAGEHAMA' }).click();
  await tab(page, 'Races'); await expect(page.locator('.raceEventCard')).toHaveCount(8);
  await briefing(page, 'Eastline Midnight Club'); await expect(page.getByRole('dialog')).toContainText('Requires Level 6');
  await expect(page.getByRole('button', { name: 'ENTER RACE' })).toBeDisabled(); await page.keyboard.press('Escape');
  await briefing(page); await expect(page.getByRole('button', { name: 'ENTER RACE' })).toBeEnabled();
});
test('free race briefing/cancellation does not charge; live race settles once and saves the assigned car', async ({ page }) => {
  await clock(page); await seed(page, initial()); await tab(page, 'Races'); const before = await stored(page);
  await briefing(page); await page.getByRole('button', { name: 'CANCEL', exact: true }).click(); expect(await stored(page)).toBe(before);
  await enter(page); await expect(page.getByRole('button', { name: 'SETTLE RESULT' })).toBeDisabled();
  await expect(page.getByTestId('race-countdown')).toHaveText('3'); await expect(page.getByTestId('cash')).toHaveText('¥18,000');
  const frozen = (await read(page)).racing.activeRace!; await page.clock.runFor(5000);
  await expect(page.getByTestId('race-countdown')).toHaveText('RACING');
  await page.reload(); await tab(page, 'Races'); expect((await read(page)).racing.activeRace).toEqual(frozen);
  await advanceRace(page); const position = getPlayerPosition(frozen); const prize = frozen.prizes[position - 1];
  await expect(page.getByTestId('player-race-result')).toBeVisible(); await expect(page.getByTestId('cash')).toHaveText('¥18,000');
  await page.getByRole('button', { name: 'SETTLE RESULT' }).evaluate((b: HTMLButtonElement) => { b.click(); b.click(); });
  const paid = await read(page); expect(paid.cashYen).toBe(18000 + prize.yen); expect(paid.reputation).toBe(prize.reputation);
  expect(paid.racing.completedRaces).toBe(1); expect(paid.ownedVehicles[0].odometerKm).toBe(168423);
  await expect(page.getByTestId('race-receipt')).toBeVisible(); await page.reload(); expect(await read(page)).toEqual(paid);
});
test('race entry fee is explicit and double confirmation only charges once', async ({ page }) => {
  await clock(page); await seed(page, rich()); await tab(page, 'Races'); await briefing(page, 'Dockyard 402');
  await expect(page.getByRole('dialog')).toContainText('¥1,000 entry');
  await page.getByRole('button', { name: 'ENTER RACE' }).evaluate((b: HTMLButtonElement) => { b.click(); b.click(); });
  expect((await read(page)).cashYen).toBe(99000); expect((await read(page)).racing.nextRunId).toBe(2);
});
test('race completes in another tab without payout or writes, then shows READY and settles', async ({ page }) => {
  await clock(page); await seed(page, rich()); await tab(page, 'Races'); await enter(page); const before = await stored(page);
  await tab(page, 'Garage'); await advanceRace(page); await expect(page.getByTestId('race-ready-badge')).toHaveText('READY');
  expect(await stored(page)).toBe(before); await tab(page, 'Jobs'); await expect(page.getByRole('button', { name: 'Start Garage Shift' })).toBeDisabled();
  await tab(page, 'Races'); await page.getByRole('button', { name: 'SETTLE RESULT' }).click();
  await expect(page.getByTestId('race-ready-badge')).toHaveCount(0); await tab(page, 'Jobs'); await expect(page.getByRole('button', { name: 'Start Garage Shift' })).toBeEnabled();
});
test('jobs and races exclude each other without modifying the old job snapshot', async ({ page }) => {
  await clock(page); const game = startJob(rich(), 'parts-run', T + 1000); await seed(page, game); const before = await read(page);
  await tab(page, 'Races'); await briefing(page); await expect(page.getByRole('button', { name: 'ENTER RACE' })).toBeDisabled();
  await expect(page.getByRole('dialog')).toContainText('Claim or cancel your job'); expect(await read(page)).toEqual(before);
});
test('insufficient entry money blocks paid races but leaves the free event available', async ({ page }) => {
  await seed(page, { ...rich(), cashYen: 0 }); await tab(page, 'Races'); await briefing(page, 'Dockyard 402');
  await expect(page.getByRole('dialog')).toContainText('Not enough cash'); await expect(page.getByRole('button', { name: 'ENTER RACE' })).toBeDisabled();
  await page.keyboard.press('Escape'); await briefing(page); await expect(page.getByRole('button', { name: 'ENTER RACE' })).toBeEnabled();
});
test('withdrawal requires confirmation, keeps the paid entry and awards no prizes or mileage', async ({ page }) => {
  await clock(page); await seed(page, rich()); await tab(page, 'Races'); await enter(page, 'Dockyard 402'); const before = await read(page);
  page.once('dialog', (d) => d.dismiss()); await page.getByRole('button', { name: 'WITHDRAW' }).click(); expect(await read(page)).toEqual(before);
  page.once('dialog', (d) => d.accept()); await page.getByRole('button', { name: 'WITHDRAW' }).click();
  const after = await read(page); expect(after.cashYen).toBe(99000); expect(after.racing.cancelledRaces).toBe(1);
  expect(after.racing.completedRaces).toBe(0); expect(after.reputation).toBe(before.reputation); expect(after.ownedVehicles).toEqual(before.ownedVehicles);
});
test('a race locks only its assigned car, including when ready and another car becomes active', async ({ page }) => {
  await clock(page); const game = rich(); game.ownedVehicles.push(createPlayerVehicle('rz-t', 'akari-2')); await seed(page, game);
  await tab(page, 'Races'); await enter(page); const race = (await read(page)).racing.activeRace!;
  await tab(page, 'Garage'); await page.getByRole('button', { name: 'Inspect Akari RZ-T (akari-2)' }).click(); await page.getByRole('button', { name: 'SET AS ACTIVE VEHICLE' }).click();
  await tab(page, 'Workshop'); await page.getByRole('combobox', { name: 'Vehicle to tune' }).selectOption('pico-1');
  await page.getByRole('button', { name: 'Review Panel Filter', exact: true }).click(); await expect(page.getByRole('dialog')).toContainText('assigned to a race');
  await expect(page.getByRole('button', { name: 'BUY & INSTALL', exact: true })).toBeDisabled(); await page.keyboard.press('Escape');
  await page.getByRole('combobox', { name: 'Vehicle to tune' }).selectOption('akari-2'); await page.getByRole('button', { name: 'Review Panel Filter', exact: true }).click();
  await page.getByRole('button', { name: 'BUY & INSTALL', exact: true }).click(); await advanceRace(page);
  expect((await read(page)).racing.activeRace).toEqual(race); await tab(page, 'Races'); await page.getByRole('button', { name: 'SETTLE RESULT' }).click();
  const paid = await read(page); expect(paid.activeVehicleId).toBe('akari-2'); expect(paid.ownedVehicles[1].odometerKm).toBe(189340); expect(paid.ownedVehicles[0].odometerKm).toBe(168423);
});
test('failed entry writes preserve cash, the old save and an empty race slot', async ({ page }) => {
  await clock(page); await seed(page, rich()); await tab(page, 'Races'); const before = await stored(page);
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new Error('Storage full'); }; });
  await briefing(page, 'Dockyard 402'); await page.getByRole('button', { name: 'ENTER RACE' }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('not applied'); expect(await stored(page)).toBe(before);
  await page.keyboard.press('Escape'); await expect(page.locator('.recoveryPanel')).toBeVisible(); await expect(page.getByTestId('cash')).toHaveText('¥100,000');
});
test('failed settlement writes keep the entire unpaid result for a later retry', async ({ page }) => {
  await clock(page); await seed(page, pending()); await tab(page, 'Races'); await advanceRace(page); const before = await stored(page);
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new Error('Storage full'); }; });
  await page.getByRole('button', { name: 'SETTLE RESULT' }).click(); expect(await stored(page)).toBe(before);
  await expect(page.locator('.recoveryPanel')).toContainText('Could not save'); await page.reload(); await tab(page, 'Races');
  await page.getByRole('button', { name: 'SETTLE RESULT' }).click(); expect((await read(page)).racing.completedRaces).toBe(1);
});
test('pending race survives export, confirmed reset and import with the same deadline and outcome', async ({ page }) => {
  await clock(page); await seed(page, pending()); const before = await read(page); await tab(page, 'Saves');
  await page.getByRole('button', { name: 'GENERATE SAVE CODE' }).click(); const code = await page.getByRole('textbox', { name: 'Exported save code' }).inputValue();
  page.once('dialog', (d) => d.accept()); await page.getByRole('button', { name: 'RESET SAVEGAME' }).click(); expect(await read(page)).toEqual(createNewGameState());
  await tab(page, 'Saves'); await page.getByRole('textbox', { name: 'Save code to import' }).fill(code); page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'VALIDATE & IMPORT' }).click(); expect(await read(page)).toEqual(before);
  await tab(page, 'Races'); await advanceRace(page); await page.getByRole('button', { name: 'SETTLE RESULT' }).click(); expect((await read(page)).racing.completedRaces).toBe(1);
});
test('v4 tuned saves migrate without losing parts, balances, receipts or the pending delivery', async ({ page }) => {
  await seedRaw(page, JSON.stringify(legacyV4)); await expect(page.locator('.saveIndicator')).toContainText(`SAVE V${SAVE_VERSION}`);
  const next = await read(page); const { racing, heat, market, ...oldFields } = next;
  expect(oldFields).toEqual(legacyV4.state); expect(heat).toEqual(createHeatState()); expect(racing.nextRunId).toBe(1);
  expect(market.generation).toBe(0); expect(market.purchasedCount).toBe(0);
  expect(market.soldCount).toBe(0); expect(market.lastTrade).toBeNull(); expect(market.listings).toHaveLength(6);
  await expect(page.getByTestId('garage-power')).toContainText('110'); await tab(page, 'Races'); await briefing(page);
  await expect(page.getByRole('button', { name: 'ENTER RACE' })).toBeDisabled();
});
test('backwards clock blocks early settlement but withdrawal still works', async ({ page }) => {
  await clock(page); const state = rich(); await seed(page, startRace(state, 'dockyard-402', 'pico-1', getRaceBuildKey(state.ownedVehicles[0]), T + 10000));
  await tab(page, 'Races'); await expect(page.getByTestId('race-countdown')).toHaveText('CLOCK ERROR');
  await expect(page.getByRole('button', { name: 'SETTLE RESULT' })).toBeDisabled(); page.once('dialog', (d) => d.accept()); await page.getByRole('button', { name: 'WITHDRAW' }).click();
  expect((await read(page)).racing.cancelledRaces).toBe(1);
});
test('a stale browser tab cannot settle an already paid race twice', async ({ page, context }) => {
  const state = rich(); const old = startRace(state, 'dockyard-402', 'pico-1', getRaceBuildKey(state.ownedVehicles[0]), 1000);
  await seed(page, old); await tab(page, 'Races'); const other = await context.newPage(); await other.goto('./'); await tab(other, 'Races');
  await other.getByRole('button', { name: 'SETTLE RESULT' }).click(); await expect(page.locator('.recoveryPanel')).toContainText('Another tab changed this save');
  await expect(page.getByRole('button', { name: 'SETTLE RESULT' })).toBeDisabled(); expect((await read(other)).racing.completedRaces).toBe(1);
});
test('component category buttons and dropdown are linked, keep their state and do not touch saves', async ({ page }) => {
  await seed(page, rich()); await tab(page, 'Workshop'); const before = await stored(page);
  await page.getByRole('button', { name: 'Category Tires', exact: true }).click(); await expect(page.locator('.partCard')).toHaveCount(2);
  await expect(page.getByRole('combobox', { name: 'Filter parts by category' })).toHaveValue('tires'); await tab(page, 'Races'); await tab(page, 'Workshop');
  await expect(page.getByRole('button', { name: 'Category Tires', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('combobox', { name: 'Filter parts by category' }).selectOption('ecu');
  await expect(page.getByRole('button', { name: `Category ${SLOT_LABELS.ecu}`, exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'All part categories', exact: true }).click(); await expect(page.locator('.partCard')).toHaveCount(14); expect(await stored(page)).toBe(before);
});
test('races filter by discipline, keep the chosen filter across tabs and never charge for browsing', async ({ page }) => {
  await seed(page, rich()); await tab(page, 'Races'); const before = await stored(page);
  await page.getByRole('group', { name: 'Filter races by discipline' }).getByRole('button', { name: 'Touge 2', exact: true }).click();
  await expect(page.locator('.raceEventCard')).toHaveCount(2); await tab(page, 'Garage'); await tab(page, 'Races'); await expect(page.locator('.raceEventCard')).toHaveCount(2);
  expect(await stored(page)).toBe(before);
});
for (const [name, width, height] of [['desktop', 1440, 1000], ['mobile', 390, 844]] as const) {
  test(`${name} race briefing, playback, result and category controls fit beneath the persistent HUD`, async ({ page }) => {
    const errors: string[] = []; page.on('pageerror', (e) => errors.push(e.message)); await page.setViewportSize({ width, height }); await clock(page); await seed(page, rich());
    await tab(page, 'Races'); await page.screenshot({ path: `test-results/races-${name}.png`, fullPage: true });
    await page.evaluate(() => window.scrollTo(0, 650)); expect((await page.locator('.gameTopbar').boundingBox())!.y).toBe(0);
    await expect(page.getByTestId('cash')).toBeInViewport(); await expect(page.getByTestId('player-level')).toBeInViewport(); await expect(page.getByTestId('reputation')).toBeInViewport();
    await briefing(page, 'Dockyard 402'); await page.screenshot({ path: `test-results/race-briefing-${name}.png` });
    expect((await page.getByRole('dialog').boundingBox())!.width).toBeLessThanOrEqual(width);
    await page.getByRole('button', { name: 'ENTER RACE' }).click(); await page.clock.runFor(7000);
    await page.screenshot({ path: `test-results/race-running-${name}.png` }); await advanceRace(page);
    await page.getByRole('button', { name: 'SETTLE RESULT' }).click(); await page.evaluate(() => window.scrollTo(0, 0)); await page.screenshot({ path: `test-results/race-result-${name}.png` });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await tab(page, 'Workshop'); await page.getByRole('button', { name: 'Category Turbo', exact: true }).click(); await page.screenshot({ path: `test-results/part-categories-${name}.png` });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); expect(errors).toEqual([]);
  });
}
