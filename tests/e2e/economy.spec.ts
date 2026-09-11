import { test, expect, type Page } from '@playwright/test';
import legacyV2 from '../fixtures/save-v2.json' with { type: 'json' };
import { createNewGameState, createPlayerVehicle, purchaseStarter } from '../../src/domain/game';
import { startJob } from '../../src/domain/economy';
import { createVehicleTuning } from '../../src/domain/tuning';
import { SAVE_VERSION } from '../../src/domain/persistence';
import { T, tab, seed as seedGame, seedRaw, stored, read, clock } from './helpers';
import type { GameState } from '../../src/domain/types';
const initial = () => purchaseStarter(createNewGameState(), 'pico-rs', 'pico-1');
async function seed(page: Page, game: GameState) { await seedGame(page, game); await tab(page, 'Jobs'); await expect(page.getByRole('heading', { name: 'Earn your place.' })).toBeVisible(); }
async function shift(page: Page) { await page.getByRole('button', { name: 'Start Garage Shift' }).click(); await page.clock.runFor(15_000); await page.getByRole('button', { name: 'CLAIM REWARD' }).click(); }
test('jobs require a purchased starter and show explicit level gates', async ({ page }) => {
  await page.goto('./'); await expect(page.getByRole('button', { name: 'Start Garage Shift' })).toHaveCount(0); await expect(page.getByRole('tab', { name: 'Jobs', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Choose Akari RZ-T' }).click(); await page.getByRole('button', { name: 'BUY & ENTER KAGEHAMA' }).click(); await tab(page, 'Jobs');
  await expect(page.getByTestId('cash')).toHaveText('¥2,000'); await expect(page.getByRole('button', { name: 'Start Garage Shift' })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Start Parts Run' })).toBeDisabled(); await expect(page.getByRole('button', { name: 'Start Dockside Delivery' })).toBeDisabled();
});
test('start, countdown, exact-once claim and reload persist all rewards', async ({ page }) => {
  await clock(page); await seed(page, initial()); await page.getByRole('button', { name: 'Start Garage Shift' }).click();
  await expect(page.getByRole('button', { name: 'CLAIM REWARD' })).toBeDisabled(); await expect(page.getByRole('button', { name: 'Start Garage Shift' })).toBeDisabled();
  await expect(page.getByTestId('cash')).toHaveText('¥18,000'); const pending = (await read(page)).economy.activeJob; const unchanged = await stored(page);
  await page.clock.runFor(5000); expect(await stored(page)).toBe(unchanged); await page.reload(); await tab(page, 'Jobs'); expect((await read(page)).economy.activeJob).toEqual(pending);
  await page.clock.runFor(10000); await expect(page.getByRole('button', { name: 'CLAIM REWARD' })).toBeEnabled();
  await page.getByRole('button', { name: 'CLAIM REWARD' }).evaluate((button: HTMLButtonElement) => { button.click(); button.click(); });
  await expect(page.getByTestId('cash')).toHaveText('¥19,500'); await expect(page.getByTestId('reputation')).toHaveText('4');
  expect((await read(page)).economy.completedJobs).toBe(1); expect((await read(page)).economy.activeJob).toBeNull(); await page.reload(); await expect(page.getByTestId('cash')).toHaveText('¥19,500');
});
test('five shifts unlock Parts Run and persist the level-up', async ({ page }) => {
  await clock(page); await seed(page, initial()); for (let i = 0; i < 5; i++) await shift(page);
  await expect(page.getByTestId('player-level')).toHaveText('2'); await expect(page.getByTestId('reputation')).toHaveText('20'); await expect(page.getByTestId('job-receipt')).toContainText('LEVEL UP');
  await expect(page.getByRole('button', { name: 'Start Parts Run' })).toBeEnabled(); await expect(page.getByRole('button', { name: 'Start Dockside Delivery' })).toBeDisabled();
  await page.reload(); await expect(page.getByTestId('cash')).toHaveText('¥25,500'); await expect(page.getByTestId('player-level')).toHaveText('2');
});
test('delivery mileage stays assigned to the original car after activation changes', async ({ page }) => {
  await clock(page); const game = { ...initial(), playerLevel: 2, reputation: 20 }; game.ownedVehicles.push(createPlayerVehicle('rz-t', 'akari-1'));
  await seed(page, game); await page.getByRole('button', { name: 'Start Parts Run' }).click(); await tab(page, 'Garage');
  await page.getByRole('button', { name: 'Inspect Akari RZ-T (akari-1)' }).click(); await page.getByRole('button', { name: 'SET AS ACTIVE VEHICLE' }).click(); await page.clock.runFor(30000); await tab(page, 'Jobs');
  await page.getByRole('button', { name: 'CLAIM REWARD' }).click(); const state = await read(page);
  expect(state.cashYen).toBe(21000); expect(state.ownedVehicles[0].odometerKm).toBe(168426); expect(state.ownedVehicles[1].odometerKm).toBe(189340); expect(state.activeVehicleId).toBe('akari-1');
});
test('a long absence only readies one job, without passive payouts', async ({ page }) => {
  await seed(page, startJob(initial(), 'garage-shift', 1000)); await expect(page.getByRole('button', { name: 'CLAIM REWARD' })).toBeEnabled(); await expect(page.getByTestId('cash')).toHaveText('¥18,000');
  await page.reload(); await tab(page, 'Jobs'); await expect(page.getByTestId('cash')).toHaveText('¥18,000'); await page.getByRole('button', { name: 'CLAIM REWARD' }).click();
  await page.reload(); expect((await read(page)).economy.completedJobs).toBe(1); await expect(page.getByTestId('cash')).toHaveText('¥19,500');
});
test('export, reset and import preserve a pending job and its original deadline', async ({ page }) => {
  await clock(page); await seed(page, initial()); await page.getByRole('button', { name: 'Start Garage Shift' }).click(); const pending = await read(page); await tab(page, 'Saves');
  await page.getByRole('button', { name: 'GENERATE SAVE CODE' }).click(); const code = await page.getByRole('textbox', { name: 'Exported save code' }).inputValue();
  page.once('dialog', (dialog) => dialog.accept()); await page.getByRole('button', { name: 'RESET SAVEGAME' }).click(); expect(await read(page)).toEqual(createNewGameState());
  await tab(page, 'Saves'); await page.getByRole('textbox', { name: 'Save code to import' }).fill(code); page.once('dialog', (dialog) => dialog.accept()); await page.getByRole('button', { name: 'VALIDATE & IMPORT' }).click();
  expect(await read(page)).toEqual(pending); await page.clock.runFor(15000); await tab(page, 'Jobs'); await page.getByRole('button', { name: 'CLAIM REWARD' }).click(); expect((await read(page)).cashYen).toBe(19500);
});
test('cancel confirmation awards nothing and permits another contract', async ({ page }) => {
  await clock(page); await seed(page, initial()); await page.getByRole('button', { name: 'Start Garage Shift' }).click(); const pending = await read(page);
  page.once('dialog', (dialog) => dialog.dismiss()); await page.getByRole('button', { name: 'CANCEL JOB' }).click(); expect(await read(page)).toEqual(pending);
  page.once('dialog', (dialog) => dialog.accept()); await page.getByRole('button', { name: 'CANCEL JOB' }).click(); expect((await read(page)).economy.activeJob).toBeNull();
  await expect(page.getByTestId('cash')).toHaveText('¥18,000'); await page.reload(); await tab(page, 'Jobs'); await expect(page.getByRole('button', { name: 'Start Garage Shift' })).toBeEnabled();
});
test('a failed storage write cannot start a job', async ({ page }) => {
  await seed(page, initial()); const before = await stored(page); await page.evaluate(() => { Storage.prototype.setItem = () => { throw new Error('Storage full'); }; });
  await page.getByRole('button', { name: 'Start Garage Shift' }).click(); await expect(page.getByRole('alert')).toContainText('Could not save this change'); expect(await stored(page)).toBe(before);
  await expect(page.getByRole('button', { name: 'CLAIM REWARD' })).toHaveCount(0);
});
test('a failed claim write keeps the pending reward for a safe retry', async ({ page }) => {
  await seed(page, startJob(initial(), 'garage-shift', 1000)); await expect(page.getByRole('button', { name: 'CLAIM REWARD' })).toBeEnabled(); const before = await stored(page);
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new Error('Storage full'); }; }); await page.getByRole('button', { name: 'CLAIM REWARD' }).click();
  await expect(page.getByRole('alert')).toContainText('Could not save this change'); expect(await stored(page)).toBe(before); await expect(page.getByTestId('cash')).toHaveText('¥18,000');
  await page.reload(); await tab(page, 'Jobs'); await page.getByRole('button', { name: 'CLAIM REWARD' }).click(); await expect(page.getByTestId('cash')).toHaveText('¥19,500');
});
test('a backwards clock cannot finish work, and cancellation remains usable', async ({ page }) => {
  await clock(page); await seed(page, startJob(initial(), 'garage-shift', T + 10000)); await expect(page.getByRole('alert')).toContainText('clock moved backwards');
  await expect(page.getByRole('button', { name: 'CLAIM REWARD' })).toBeDisabled(); page.once('dialog', (dialog) => dialog.accept()); await page.getByRole('button', { name: 'CANCEL JOB' }).click(); await expect(page.getByRole('button', { name: 'Start Garage Shift' })).toBeEnabled();
});
test('a v2 browser save migrates without losing the car or inventing income', async ({ page }) => {
  await seedRaw(page, JSON.stringify(legacyV2)); await expect(page.getByTestId('cash')).toHaveText('¥2,000'); await expect(page.locator('.activeSummary strong')).toHaveText('Akari RZ-T');
  await expect.poll(async () => JSON.parse((await stored(page))!).version).toBe(SAVE_VERSION); const state = await read(page);
  expect(state.ownedVehicles).toEqual(legacyV2.state.ownedVehicles.map((car) => ({ ...car, tuning: createVehicleTuning() }))); expect(state.economy.completedJobs).toBe(0); expect(state.economy.totalEarnedYen).toBe(0);
});
test('a stale second tab cannot claim the same job twice', async ({ page, context }) => {
  await seed(page, startJob(initial(), 'garage-shift', 1000)); await expect(page.getByRole('button', { name: 'CLAIM REWARD' })).toBeEnabled(); const other = await context.newPage(); await other.goto('./'); await tab(other, 'Jobs');
  await other.getByRole('button', { name: 'CLAIM REWARD' }).click(); await expect(page.getByRole('alert')).toContainText('Another tab changed this save'); await expect(page.getByRole('button', { name: 'CLAIM REWARD' })).toBeDisabled();
  expect((await read(other)).economy.completedJobs).toBe(1); expect((await read(other)).cashYen).toBe(19500);
});
for (const [name, width, height] of [['desktop', 1440, 1000], ['mobile', 390, 844]] as const) {
  test(`job board ${name} layout, real controls and no page errors`, async ({ page }) => {
    const errors: string[] = []; page.on('pageerror', (error) => errors.push(error.message)); await page.setViewportSize({ width, height }); await clock(page); await seed(page, initial());
    await page.getByRole('button', { name: 'Start Garage Shift' }).click(); expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: `test-results/jobs-${name}.png`, fullPage: true }); await page.clock.runFor(15000); await page.getByRole('button', { name: 'CLAIM REWARD' }).click();
    await expect(page.getByTestId('cash')).toHaveText('¥19,500'); expect(errors).toEqual([]);
  });
}
