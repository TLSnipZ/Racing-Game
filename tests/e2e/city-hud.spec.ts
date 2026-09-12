import { test, expect, type Page } from '@playwright/test';
import { createNewGameState, purchaseStarter } from '../../src/domain/game';
import { startJob } from '../../src/domain/economy';
import { getRaceBuildKey, startRace } from '../../src/domain/racing';
import { getLevelProgress } from '../../src/domain/progression';
import { tab, seed, read, stored, clock, T } from './helpers';
const initial = () => purchaseStarter(createNewGameState(), 'pico-rs', 'pico-1');
const level3 = () => ({ ...initial(), playerLevel: 3, reputation: 60, cashYen: 100000 });
const xp = (page: Page) => page.getByRole('progressbar', { name: 'Level XP progress', exact: true });
async function inspect(page: Page, area: string) { await page.getByRole('button', { name: `Inspect ${area}`, exact: true }).click(); }
function pendingRace() { const game = level3(); const car = game.ownedVehicles[0]; return startRace(game, 'east-ward-shakedown', car.instanceId, getRaceBuildKey(car), T + 1000); }

test('HUD XP exists before the starter and City requires a purchased starter', async ({ page }) => {
  await page.goto('./'); await expect(xp(page)).toHaveJSProperty('value', 0);
  await expect(page.getByRole('tab', { name: 'City', exact: true })).toBeDisabled();
  await tab(page, 'Saves'); await expect(xp(page)).toBeInViewport();
  await tab(page, 'Garage'); await page.getByRole('button', { name: 'Choose Hoshino Pico RS' }).click();
  await page.getByRole('button', { name: 'BUY & ENTER KAGEHAMA' }).click();
  await tab(page, 'City'); await expect(page.getByRole('heading', { name: 'Know your streets.' })).toBeVisible();
  await expect(page.getByRole('tabpanel')).toHaveCount(1);
});
test('XP reflects claims and level boundaries instead of just filling a cosmetic bar', async ({ page }) => {
  await clock(page); await seed(page, { ...initial(), reputation: 16 });
  await expect(xp(page)).toHaveJSProperty('value', 80); await expect(page.getByTestId('hud-xp-label')).toContainText('4 REP left');
  await tab(page, 'Jobs'); await page.getByRole('button', { name: 'Start Garage Shift' }).click();
  await tab(page, 'City'); await page.clock.runFor(15000); await expect(xp(page)).toHaveJSProperty('value', 80);
  await page.getByRole('button', { name: 'OPEN CURRENT JOB' }).click();
  await page.getByRole('button', { name: 'CLAIM REWARD' }).click();
  await expect(page.getByTestId('player-level')).toHaveText('2'); await expect(xp(page)).toHaveJSProperty('value', 0);
  await expect(page.getByTestId('hud-xp-label')).toContainText('40 REP left');
  await tab(page, 'City'); await expect(page.getByTestId('district-hakuro-state')).toContainText('OPEN');
  await expect(page.getByTestId('district-dockside-state')).toContainText('OPEN');
  await page.reload(); await expect(xp(page)).toHaveJSProperty('value', 0);
});
test('the level cap displays MAX while allowing reputation to keep growing', async ({ page }) => {
  await seed(page, { ...initial(), playerLevel: 20, reputation: 4000 });
  await expect(xp(page)).toHaveJSProperty('value', 100); await expect(page.getByTestId('hud-xp-label')).toHaveText('XP · MAX');
  await expect(xp(page)).toHaveAttribute('aria-valuetext', /cap 20 reached/);
});
test('locked and future districts can be inspected without charging or starting anything', async ({ page }) => {
  await seed(page, { ...initial(), reputation: 4 }); const before = await stored(page); await tab(page, 'City');
  await inspect(page, 'Hakuro Pass'); await expect(page.locator('.districtGate')).toContainText('Requires Level 2');
  await expect(page.getByRole('button', { name: 'BROWSE HAKURO PASS RACES' })).toBeDisabled();
  await expect(page.getByRole('progressbar', { name: 'Hakuro Pass unlock progress' })).toHaveJSProperty('value', 20);
  await inspect(page, 'Industrial District'); await expect(page.locator('.districtGate')).toContainText('Phase 12');
  await expect(page.locator('.cityPrimary')).toHaveCount(0);
  await inspect(page, 'Outer Kagehama'); await expect(page.locator('.districtGate')).toContainText('Phase 11');
  expect(await stored(page)).toBe(before);
});
test('city links select matching race districts, clear conflicting discipline filters and never enter', async ({ page }) => {
  await seed(page, level3()); const before = await stored(page);
  await tab(page, 'Races'); await page.getByRole('group', { name: 'Filter races by discipline' }).getByRole('button', { name: /^Touge/ }).click();
  await tab(page, 'City'); await inspect(page, 'Dockside'); await page.getByRole('button', { name: 'BROWSE DOCKSIDE RACES' }).click();
  await expect(page.getByRole('tab', { name: 'Races', exact: true })).toBeFocused();
  await expect(page.getByRole('combobox', { name: 'Race district', exact: true })).toHaveValue('dockside');
  await expect(page.locator('.raceEventCard')).toHaveCount(2); await expect(page.locator('.raceEventCard').first()).toContainText('Dockyard 402');
  await page.getByRole('group', { name: 'Filter races by discipline' }).getByRole('button', { name: /^Touge/ }).click();
  await expect(page.locator('.raceEventCard')).toHaveCount(0); await page.getByRole('button', { name: 'Clear race filters' }).click();
  await expect(page.locator('.raceEventCard')).toHaveCount(8); expect(await stored(page)).toBe(before);
});
test('job district selection and city inspection survive ordinary tab switches', async ({ page }) => {
  await seed(page, level3()); const before = await stored(page); await tab(page, 'City'); await inspect(page, 'Dockside');
  await page.getByRole('button', { name: 'BROWSE DOCKSIDE JOBS' }).click();
  await expect(page.locator('.jobCard')).toHaveCount(1); await expect(page.locator('.jobCard')).toContainText('Dockside Delivery');
  await tab(page, 'City'); await expect(page.getByRole('button', { name: 'Inspect Dockside', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await tab(page, 'Jobs'); await expect(page.getByRole('combobox', { name: 'Job district', exact: true })).toHaveValue('dockside');
  await page.getByRole('button', { name: 'All job districts' }).click(); await expect(page.locator('.jobCard')).toHaveCount(3);
  await page.getByRole('combobox', { name: 'Job district', exact: true }).selectOption('hakuro');
  await expect(page.locator('.jobCard')).toHaveCount(0); await expect(page.locator('.districtEmpty')).toContainText('No job contacts');
  expect(await stored(page)).toBe(before);
});
test('Mercer shortcuts switch only the visible tab, not the active car or money', async ({ page }) => {
  await seed(page, initial()); const before = await stored(page); await tab(page, 'City');
  await page.getByRole('button', { name: 'OPEN MERCER WORKSHOP' }).click();
  await expect(page.getByRole('tabpanel')).toHaveAttribute('id', 'panel-workshop');
  await tab(page, 'City'); await page.getByRole('button', { name: 'OPEN YOUR GARAGE' }).click();
  await expect(page.getByRole('tabpanel')).toHaveAttribute('id', 'panel-garage'); expect(await stored(page)).toBe(before);
});
test('a pending job is visible even when its offer is filtered out', async ({ page }) => {
  await clock(page); await seed(page, startJob(level3(), 'garage-shift', T + 1000));
  await tab(page, 'Jobs'); await page.getByRole('combobox', { name: 'Job district', exact: true }).selectOption('dockside');
  await expect(page.getByRole('article', { name: 'Current job', exact: true })).toBeVisible();
  const before = await read(page); await tab(page, 'City'); await inspect(page, 'Outer Kagehama');
  await page.clock.runFor(15000); await expect(page.getByTestId('job-ready-badge')).toBeVisible();
  expect(await read(page)).toEqual(before); await page.getByRole('button', { name: 'OPEN CURRENT JOB' }).click();
  await page.getByRole('button', { name: 'CLAIM REWARD' }).click(); expect((await read(page)).cashYen).toBe(before.cashYen + 1500);
});
test('a paid race remains recoverable from City, even below its district gate, with no reroll', async ({ page }) => {
  const game = level3(); const car = game.ownedVehicles[0];
  const pending = startRace(game, 'hakuro-intro', car.instanceId, getRaceBuildKey(car), T + 1000);
  pending.playerLevel = 1; pending.reputation = 0; // Valid imported in-progress snapshot must remain settleable.
  await clock(page); await seed(page, pending); await tab(page, 'City'); await inspect(page, 'Hakuro Pass');
  await expect(page.getByRole('button', { name: 'BROWSE HAKURO PASS RACES' })).toBeDisabled();
  await page.clock.runFor(30000); expect(await read(page)).toEqual(pending);
  await page.getByRole('button', { name: 'OPEN CURRENT RACE' }).click();
  await expect(page.getByRole('button', { name: 'SETTLE RESULT', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'SETTLE RESULT', exact: true }).click();
  const after = await read(page); expect(after.racing.activeRace).toBeNull(); expect(after.racing.completedRaces).toBe(1);
  await expect(xp(page)).toHaveJSProperty('value', getLevelProgress(after.reputation, after.playerLevel).percent);
  await tab(page, 'City'); await expect(page.locator('.districtStats')).toContainText('1 / 2');
});
test('filters cannot hide an active race or change its saved build', async ({ page }) => {
  await clock(page); const pending = pendingRace(); await seed(page, pending); await tab(page, 'Races');
  await page.getByRole('combobox', { name: 'Race district', exact: true }).selectOption('hakuro');
  await expect(page.getByRole('article', { name: 'Current race', exact: true })).toBeVisible();
  expect(await read(page)).toEqual(pending);
});
test('city and filters are usable without a storage write and preserve normal save protection', async ({ page }) => {
  await seed(page, level3()); const before = await stored(page);
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new Error('Storage full'); }; });
  await tab(page, 'City'); await inspect(page, 'Eastline Expressway');
  await page.getByRole('button', { name: 'BROWSE EASTLINE EXPRESSWAY RACES' }).click();
  await expect(page.locator('.raceEventCard')).toHaveCount(2); expect(await stored(page)).toBe(before);
});
test('reset restores default city and filter views without changing the save schema', async ({ page }) => {
  await seed(page, level3()); await tab(page, 'City'); await inspect(page, 'Dockside');
  await page.getByRole('button', { name: 'BROWSE DOCKSIDE RACES' }).click();
  await tab(page, 'Saves'); page.once('dialog', (d) => d.accept()); await page.getByRole('button', { name: 'RESET SAVEGAME' }).click();
  await expect(page.getByRole('tab', { name: 'City', exact: true })).toBeDisabled(); await expect(xp(page)).toHaveJSProperty('value', 0);
  await page.getByRole('button', { name: 'Choose Hoshino Pico RS' }).click(); await page.getByRole('button', { name: 'BUY & ENTER KAGEHAMA' }).click();
  await tab(page, 'Races'); await expect(page.getByRole('combobox', { name: 'Race district', exact: true })).toHaveValue('all');
  await tab(page, 'City'); await expect(page.getByRole('button', { name: 'Inspect East Ward', exact: true })).toHaveAttribute('aria-pressed', 'true');
  expect(JSON.parse((await stored(page))!).version).toBe(7);
});
for (const [name, width, height] of [['desktop', 1440, 1000], ['mobile', 390, 844], ['narrow', 320, 780]] as const) {
  test(`${name} city and XP stay readable with sticky HUD in all seven tabs`, async ({ page }) => {
    const errors: string[] = []; page.on('pageerror', (error) => errors.push(error.message));
    await page.setViewportSize({ width, height }); await seed(page, { ...level3(), reputation: 72 });
    for (const section of ['Garage', 'Jobs', 'City', 'Races', 'Workshop', 'Market', 'Saves'] as const) {
      await tab(page, section); await page.evaluate(() => window.scrollTo(0, 650));
      await expect(xp(page)).toBeInViewport(); await expect(page.getByTestId('cash')).toBeInViewport();
      expect((await page.locator('.gameTopbar').boundingBox())!.y).toBe(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    await tab(page, 'City'); await page.screenshot({ path: `test-results/city-${name}.png`, fullPage: true });
    await page.evaluate(() => window.scrollTo(0, 650)); await page.screenshot({ path: `test-results/city-hud-${name}.png` });
    expect(errors).toEqual([]);
  });
}
