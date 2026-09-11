import { Buffer } from 'node:buffer';
import { test, expect } from '@playwright/test';
import legacy from '../fixtures/save-v1.json' with { type: 'json' };
import { createNewGameState, createPlayerVehicle, purchaseStarter } from '../../src/domain/game';
import { createEconomyState } from '../../src/domain/economy';
import { createVehicleTuning } from '../../src/domain/tuning';
import { createRacingState } from '../../src/domain/racing';
import { SAVE_VERSION, serializeSave } from '../../src/domain/persistence';
import { seedRaw, stored, tab } from './helpers';
const twoCars = () => { const game = purchaseStarter(createNewGameState(), 'pico-rs', 'pico-1'); game.ownedVehicles.push(createPlayerVehicle('rz-t', 'akari-1')); return game; };
test('three starters, real purchase, active vehicle and reload', async ({ page }) => {
  await page.goto('./'); await expect(page.getByRole('heading', { name: 'Choose your starter' })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Choose (Hoshino|Akari)/ })).toHaveCount(3);
  await page.getByRole('button', { name: 'Choose Hoshino Pico RS' }).click(); await page.getByRole('button', { name: 'BUY & ENTER KAGEHAMA' }).click();
  await expect(page.getByTestId('cash')).toHaveText('¥18,000'); await expect(page.locator('.activeSummary strong')).toHaveText('Hoshino Pico RS');
  const before = JSON.parse((await stored(page))!); await page.reload(); await expect(page.locator('.activeSummary strong')).toHaveText('Hoshino Pico RS');
  const after = JSON.parse((await stored(page))!); expect(after.state).toEqual(before.state); expect(after.version).toBe(SAVE_VERSION);
});
test('migrates a v1 browser save with its original instance and balance', async ({ page }) => {
  await seedRaw(page, JSON.stringify(legacy)); await expect(page.locator('.activeSummary strong')).toHaveText('Hoshino Pico RS');
  await expect(page.getByTestId('cash')).toHaveText('¥18,000'); await expect.poll(async () => JSON.parse((await stored(page))!).version).toBe(SAVE_VERSION);
  expect(JSON.parse((await stored(page))!).state).toEqual({ ...legacy.state, activeVehicleId: 'legacy-pico-001', economy: createEconomyState(), racing: createRacingState(), ownedVehicles: legacy.state.ownedVehicles.map((car) => ({ ...car, tuning: createVehicleTuning() })) });
});
test('inspection is free and does not change active ride; explicit activation persists', async ({ page }) => {
  await seedRaw(page, serializeSave(twoCars())); await page.getByRole('button', { name: 'Inspect Akari RZ-T (akari-1)' }).click();
  await expect(page.locator('.showcaseCopy h3')).toHaveText('Akari RZ-T'); await expect(page.locator('.activeSummary strong')).toHaveText('Hoshino Pico RS');
  await page.getByRole('button', { name: 'SET AS ACTIVE VEHICLE' }).click(); await expect(page.locator('.activeSummary strong')).toHaveText('Akari RZ-T');
  await expect(page.getByTestId('cash')).toHaveText('¥18,000'); await page.reload(); await expect(page.locator('.showcaseCopy h3')).toHaveText('Akari RZ-T');
  expect(JSON.parse((await stored(page))!).state.activeVehicleId).toBe('akari-1');
});
test('export, confirmed reset and import restore the entire multi-car garage', async ({ page }) => {
  const game = { ...twoCars(), activeVehicleId: 'akari-1' }; await seedRaw(page, serializeSave(game)); await tab(page, 'Saves');
  await page.getByRole('button', { name: 'GENERATE SAVE CODE' }).click(); const code = await page.getByRole('textbox', { name: 'Exported save code' }).inputValue(); expect(code).toMatch(/^KAGEHAMA1-/);
  page.once('dialog', (dialog) => dialog.dismiss()); await page.getByRole('button', { name: 'RESET SAVEGAME' }).click(); expect(JSON.parse((await stored(page))!).state).toEqual(game);
  page.once('dialog', (dialog) => dialog.accept()); await page.getByRole('button', { name: 'RESET SAVEGAME' }).click();
  await expect(page.getByRole('heading', { name: 'Choose your starter' })).toBeVisible(); await expect(page.getByTestId('cash')).toHaveText('¥50,000');
  await page.reload(); await expect(page.getByRole('heading', { name: 'Choose your starter' })).toBeVisible(); await tab(page, 'Saves');
  await page.getByRole('textbox', { name: 'Save code to import' }).fill(code); page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'VALIDATE & IMPORT' }).click(); await expect(page.locator('.activeSummary strong')).toHaveText('Akari RZ-T');
  expect(JSON.parse((await stored(page))!).state).toEqual(game);
});
test('imports a Phase 2 KAGEHAMA1 code after confirmation', async ({ page }) => {
  await page.goto('./'); await tab(page, 'Saves'); const code = 'KAGEHAMA1-' + Buffer.from(JSON.stringify(legacy)).toString('base64url');
  await page.getByRole('textbox', { name: 'Save code to import' }).fill(code); page.once('dialog', (dialog) => dialog.dismiss());
  await page.getByRole('button', { name: 'VALIDATE & IMPORT' }).click(); expect(JSON.parse((await stored(page))!).state.selectedStarterId).toBeNull();
  page.once('dialog', (dialog) => dialog.accept()); await page.getByRole('button', { name: 'VALIDATE & IMPORT' }).click();
  await expect(page.locator('.activeSummary strong')).toHaveText('Hoshino Pico RS'); expect(JSON.parse((await stored(page))!).state.activeVehicleId).toBe('legacy-pico-001');
});
test('invalid imports leave the current save untouched', async ({ page }) => {
  await seedRaw(page, serializeSave(twoCars())); await tab(page, 'Saves'); const before = await stored(page);
  await page.getByRole('textbox', { name: 'Save code to import' }).fill('not-a-save'); await page.getByRole('button', { name: 'VALIDATE & IMPORT' }).click();
  await expect(page.getByRole('alert')).toContainText('not a KAGEHAMA'); expect(await stored(page)).toBe(before);
});
for (const [name, data] of [['corrupt', '{broken'], ['future', JSON.stringify({ ...legacy, version: 99 })]]) {
  test(`${name} stored data is protected, not deleted or overwritten`, async ({ page }) => {
    await seedRaw(page, data); await expect(page.getByRole('alert')).toContainText('stored save is protected'); expect(await stored(page)).toBe(data);
    await expect(page.getByRole('heading', { name: 'Choose your starter' })).toHaveCount(0);
    await tab(page, 'Saves'); await expect(page.getByRole('button', { name: 'RESET SAVEGAME' })).toBeVisible();
    await page.reload(); expect(await stored(page)).toBe(data);
  });
}
test('storage failure cannot change the active car or reset the visible garage', async ({ page }) => {
  await seedRaw(page, serializeSave(twoCars())); await expect(page.locator('.activeSummary strong')).toBeVisible(); const before = await stored(page);
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new DOMException('Storage full', 'QuotaExceededError'); }; });
  await page.getByRole('button', { name: 'Inspect Akari RZ-T (akari-1)' }).click(); await page.getByRole('button', { name: 'SET AS ACTIVE VEHICLE' }).click();
  await expect(page.getByRole('alert')).toContainText('Could not save this change'); await expect(page.locator('.activeSummary strong')).toHaveText('Hoshino Pico RS');
  await tab(page, 'Saves'); page.once('dialog', (dialog) => dialog.accept()); await page.getByRole('button', { name: 'RESET SAVEGAME' }).click();
  await tab(page, 'Garage'); await expect(page.locator('.activeSummary strong')).toHaveText('Hoshino Pico RS'); expect(await stored(page)).toBe(before);
});
test('search, sorting and mobile layout do not mutate or overflow the garage', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await seedRaw(page, serializeSave(twoCars())); await expect(page.locator('.activeSummary strong')).toBeVisible();
  const before = await stored(page); await page.getByRole('searchbox', { name: 'Search owned vehicles' }).fill('Akari'); await expect(page.locator('.ownedCard')).toHaveCount(1);
  await page.getByRole('searchbox', { name: 'Search owned vehicles' }).fill(''); await page.getByRole('combobox', { name: 'Sort owned vehicles' }).selectOption('power');
  await expect(page.locator('.ownedCard').first()).toContainText('Akari RZ-T'); expect(await stored(page)).toBe(before);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true); await page.screenshot({ path: 'test-results/garage-mobile.png', fullPage: true });
});
test('desktop visual smoke test has no page errors', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', (error) => errors.push(error.message)); await page.setViewportSize({ width: 1440, height: 1000 }); await seedRaw(page, serializeSave(twoCars()));
  await expect(page.getByRole('heading', { name: 'Your garage.' })).toBeVisible(); await expect(page.getByRole('meter', { name: 'Engine', exact: true })).toHaveAttribute('aria-valuenow', '88');
  await page.screenshot({ path: 'test-results/garage-desktop.png', fullPage: true }); expect(errors).toEqual([]);
});
test('a second tab cannot silently overwrite a newly selected active car', async ({ page, context }) => {
  await seedRaw(page, serializeSave(twoCars())); await expect(page.locator('.activeSummary strong')).toBeVisible(); const other = await context.newPage(); await other.goto('./');
  await other.getByRole('button', { name: 'Inspect Akari RZ-T (akari-1)' }).click(); await other.getByRole('button', { name: 'SET AS ACTIVE VEHICLE' }).click();
  await expect(page.getByRole('alert')).toContainText('Another tab changed this save'); expect(JSON.parse((await stored(page))!).state.activeVehicleId).toBe('akari-1');
  await page.reload(); await expect(page.locator('.activeSummary strong')).toHaveText('Akari RZ-T');
});
