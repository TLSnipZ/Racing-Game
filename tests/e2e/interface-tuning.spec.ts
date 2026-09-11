import { test, expect, type Page } from '@playwright/test';
import legacyV3 from '../fixtures/save-v3.json' with { type: 'json' };
import { createNewGameState, createPlayerVehicle, purchaseStarter } from '../../src/domain/game';
import { startJob } from '../../src/domain/economy';
import { createVehicleTuning } from '../../src/domain/tuning';
import { tab, seed, seedRaw, stored, read, clock, T } from './helpers';
const initial = () => purchaseStarter(createNewGameState(), 'pico-rs', 'pico-1');
const rich = () => ({ ...initial(), cashYen: 100000, playerLevel: 5, reputation: 200 });
async function review(page: Page, name: string) {
  await page.getByRole('button', { name: `Review ${name}`, exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
}
async function buy(page: Page, name: string, owned = false) {
  await review(page, name);
  await page.getByRole('button', { name: owned ? 'INSTALL OWNED PART' : 'BUY & INSTALL', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
}

test('real tabs expose exactly one panel and never mutate the session', async ({ page }) => {
  await seed(page, initial()); const before = await stored(page);
  for (const name of ['Jobs', 'Races', 'Workshop', 'Saves', 'Garage'] as const) {
    await tab(page, name); await expect(page.getByRole('tabpanel')).toHaveCount(1);
    await expect(page.getByRole('tabpanel')).toHaveAttribute('id', `panel-${name.toLowerCase()}`);
    await expect(page.getByTestId('cash')).toHaveText('¥18,000'); expect(await stored(page)).toBe(before);
  }
  await expect(page.getByRole('button', { name: 'Start Garage Shift' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'RESET SAVEGAME' })).toHaveCount(0);
  await expect(page.getByRole('tab', { name: 'City', exact: true })).toBeDisabled(); await expect(page.getByRole('tab', { name: 'Races', exact: true })).toBeEnabled();
});
test('arrow, Home and End keys operate the tabs and skip unavailable systems', async ({ page }) => {
  await seed(page, initial()); await page.getByRole('tab', { name: 'Garage', exact: true }).focus();
  await page.keyboard.press('ArrowRight'); await expect(page.getByRole('tab', { name: 'Jobs', exact: true })).toBeFocused();
  await page.keyboard.press('ArrowRight'); await expect(page.getByRole('tab', { name: 'Races', exact: true })).toBeFocused();
  await expect(page.getByRole('tabpanel')).toHaveAttribute('id', 'panel-races');
  await page.keyboard.press('ArrowRight'); await expect(page.getByRole('tab', { name: 'Workshop', exact: true })).toBeFocused();
  await expect(page.getByRole('tabpanel')).toHaveAttribute('id', 'panel-workshop');
  await page.keyboard.press('End'); await expect(page.getByRole('tab', { name: 'Saves', exact: true })).toBeFocused();
  await page.keyboard.press('Home'); await expect(page.getByRole('tab', { name: 'Garage', exact: true })).toBeFocused();
  await page.keyboard.press('ArrowLeft'); await expect(page.getByRole('tab', { name: 'Saves', exact: true })).toBeFocused();
});
test('inspection, search and sorting survive section switches without activation', async ({ page }) => {
  const game = initial(); game.ownedVehicles.push(createPlayerVehicle('rz-t', 'akari-1')); await seed(page, game);
  await page.getByRole('button', { name: 'Inspect Akari RZ-T (akari-1)' }).click();
  await page.getByRole('searchbox', { name: 'Search owned vehicles' }).fill('Akari');
  await page.getByRole('combobox', { name: 'Sort owned vehicles' }).selectOption('power'); const before = await stored(page);
  await tab(page, 'Jobs'); await tab(page, 'Garage');
  await expect(page.getByRole('searchbox', { name: 'Search owned vehicles' })).toHaveValue('Akari');
  await expect(page.getByRole('combobox', { name: 'Sort owned vehicles' })).toHaveValue('power');
  await expect(page.locator('.showcaseCopy h3')).toHaveText('Akari RZ-T'); await expect(page.locator('.activeSummary strong')).toHaveText('Hoshino Pico RS'); expect(await stored(page)).toBe(before);
});
test('a job finishes in another section with a badge, no automatic payout and one claim', async ({ page }) => {
  await clock(page); await seed(page, initial()); await tab(page, 'Jobs'); await page.getByRole('button', { name: 'Start Garage Shift' }).click();
  const pending = await read(page); await tab(page, 'Workshop'); await page.clock.runFor(15000);
  await expect(page.getByTestId('job-ready-badge')).toHaveText('READY'); await expect(page.getByTestId('cash')).toHaveText('¥18,000'); expect(await read(page)).toEqual(pending);
  await tab(page, 'Saves'); await tab(page, 'Jobs');
  await page.getByRole('button', { name: 'CLAIM REWARD' }).click(); await expect(page.getByTestId('cash')).toHaveText('¥19,500');
  await expect(page.getByTestId('job-ready-badge')).toHaveCount(0); expect((await read(page)).economy.completedJobs).toBe(1);
});
test('purchase preview, cancel and fit update HUD and garage without changing factory baseline', async ({ page }) => {
  await seed(page, initial()); await tab(page, 'Workshop'); const before = await stored(page);
  await review(page, 'Panel Filter'); await expect(page.getByRole('dialog')).toContainText('110');
  await page.getByRole('button', { name: 'CANCEL', exact: true }).click(); expect(await stored(page)).toBe(before);
  await buy(page, 'Panel Filter'); await expect(page.getByTestId('cash')).toHaveText('¥12,000'); await expect(page.getByTestId('build-powerPs')).toHaveText('110PS');
  expect((await read(page)).ownedVehicles[0].hp).toBe(105); await tab(page, 'Garage'); await expect(page.getByTestId('garage-power')).toContainText('110');
  await expect(page.locator('.installedList')).toContainText('Panel Filter'); await page.reload(); await expect(page.getByTestId('garage-power')).toContainText('110');
});
test('slot replacement, stock restoration and refit keep ownership without repurchase', async ({ page }) => {
  await seed(page, rich()); await tab(page, 'Workshop');
  await buy(page, 'Balanced ECU'); await buy(page, 'Attack ECU'); const paid = (await read(page)).cashYen; expect(paid).toBe(75000);
  await page.getByRole('button', { name: 'Remove Attack ECU' }).click(); await expect(page.getByTestId('build-powerPs')).toHaveText('105PS');
  await buy(page, 'Balanced ECU', true); expect((await read(page)).cashYen).toBe(paid); await expect(page.getByTestId('build-powerPs')).toHaveText('111PS');
  expect((await read(page)).ownedVehicles[0].tuning.purchasedPartIds).toHaveLength(2);
});
test('insufficient cash and level gates disable confirmation; incompatible turbos cannot be reviewed', async ({ page }) => {
  await seed(page, { ...initial(), cashYen: 2000 }); await tab(page, 'Workshop');
  await review(page, 'Panel Filter'); await expect(page.getByRole('dialog')).toContainText('Not enough cash'); await expect(page.getByRole('button', { name: 'BUY & INSTALL', exact: true })).toBeDisabled();
  await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).toHaveCount(0);
  await review(page, 'Street Cat-Back'); await expect(page.getByRole('dialog')).toContainText('Requires Level 2');
  await expect(page.getByRole('button', { name: 'BUY & INSTALL', exact: true })).toBeDisabled(); await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Review Big-Frame Turbo', exact: true })).toBeDisabled(); await expect(page.getByTestId('cash')).toHaveText('¥2,000');
});
test('double confirmation can only charge once', async ({ page }) => {
  await seed(page, initial()); await tab(page, 'Workshop'); await review(page, 'Panel Filter');
  await page.getByRole('button', { name: 'BUY & INSTALL', exact: true }).evaluate((button: HTMLButtonElement) => { button.click(); button.click(); });
  await expect(page.getByTestId('cash')).toHaveText('¥12,000'); expect((await read(page)).ownedVehicles[0].tuning.purchasedPartIds).toEqual(['aoba-panel-filter']);
});
test('parts stay with the explicitly chosen vehicle and do not activate it', async ({ page }) => {
  const game = rich(); game.ownedVehicles.push(createPlayerVehicle('rz-t', 'akari-1')); await seed(page, game); await tab(page, 'Workshop');
  await page.getByRole('combobox', { name: 'Vehicle to tune' }).selectOption('akari-1'); await buy(page, 'Big-Frame Turbo');
  const after = await read(page); expect(after.activeVehicleId).toBe('pico-1'); expect(after.ownedVehicles[0].tuning).toEqual(createVehicleTuning());
  expect(after.ownedVehicles[1].tuning.installedBySlot.turbo).toBe('kurogane-big-turbo');
  await tab(page, 'Garage'); await expect(page.locator('.activeSummary strong')).toHaveText('Hoshino Pico RS');
});
test('delivery locks only its assigned car until claim, without blocking an unrelated build', async ({ page }) => {
  const game = rich(); game.ownedVehicles.push(createPlayerVehicle('rz-t', 'akari-1'));
  await clock(page); await seed(page, startJob(game, 'parts-run', T + 1000)); await tab(page, 'Workshop');
  await review(page, 'Panel Filter'); await expect(page.getByRole('dialog')).toContainText('assigned to a job');
  await expect(page.getByRole('button', { name: 'BUY & INSTALL', exact: true })).toBeDisabled(); await page.keyboard.press('Escape');
  await page.getByRole('combobox', { name: 'Vehicle to tune' }).selectOption('akari-1'); await buy(page, 'Panel Filter');
  expect((await read(page)).economy.activeJob?.vehicleId).toBe('pico-1'); await page.clock.runFor(30000); await tab(page, 'Jobs'); await page.getByRole('button', { name: 'CLAIM REWARD' }).click();
  await tab(page, 'Workshop'); await page.getByRole('combobox', { name: 'Vehicle to tune' }).selectOption('pico-1'); await buy(page, 'Panel Filter');
});
test('failed purchase writes preserve cash and parts and expose recovery globally', async ({ page }) => {
  await seed(page, initial()); await tab(page, 'Workshop'); const before = await stored(page);
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new Error('Storage full'); }; });
  await review(page, 'Panel Filter'); await page.getByRole('button', { name: 'BUY & INSTALL', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('not applied'); await page.keyboard.press('Escape');
  await expect(page.locator('.recoveryPanel')).toContainText('Could not save this change'); expect(await stored(page)).toBe(before); await expect(page.getByTestId('cash')).toHaveText('¥18,000');
  await tab(page, 'Garage'); await expect(page.locator('.recoveryPanel')).toBeVisible(); await page.getByRole('button', { name: 'OPEN SAVE TOOLS' }).click(); await expect(page.getByRole('tabpanel')).toHaveAttribute('id', 'panel-saves');
});
test('export reset import keeps the complete tuned build and pending on-foot job', async ({ page }) => {
  await clock(page); await seed(page, initial()); await tab(page, 'Jobs'); await page.getByRole('button', { name: 'Start Garage Shift' }).click(); await tab(page, 'Workshop'); await buy(page, 'Panel Filter');
  const before = await read(page); await tab(page, 'Saves'); await page.getByRole('button', { name: 'GENERATE SAVE CODE' }).click(); const code = await page.getByRole('textbox', { name: 'Exported save code' }).inputValue();
  page.once('dialog', (d) => d.accept()); await page.getByRole('button', { name: 'RESET SAVEGAME' }).click(); await expect(page.getByRole('tab', { name: 'Workshop', exact: true })).toBeDisabled();
  await tab(page, 'Saves'); await page.getByRole('textbox', { name: 'Save code to import' }).fill(code); page.once('dialog', (d) => d.accept()); await page.getByRole('button', { name: 'VALIDATE & IMPORT' }).click();
  expect(await read(page)).toEqual(before); await expect(page.getByTestId('garage-power')).toContainText('110'); await page.reload(); expect(await read(page)).toEqual(before);
});
test('v3 migration adds empty tuning without touching pending work, receipts or money', async ({ page }) => {
  await clock(page); await seedRaw(page, JSON.stringify(legacyV3)); await expect(page.getByTestId('cash')).toHaveText('¥15,500');
  const migrated = await read(page); expect(migrated.economy).toEqual(legacyV3.state.economy);
  expect(migrated.ownedVehicles.map(({ tuning: _tuning, ...v }) => v)).toEqual(legacyV3.state.ownedVehicles);
  expect(migrated.ownedVehicles[0].tuning).toEqual(createVehicleTuning()); await tab(page, 'Jobs'); await expect(page.getByRole('article', { name: 'Current job' })).toBeVisible();
});
test('stale browser tab cannot overwrite a newly purchased build', async ({ page, context }) => {
  await seed(page, initial()); await tab(page, 'Workshop'); const other = await context.newPage(); await other.goto('./'); await tab(other, 'Workshop');
  await buy(other, 'Panel Filter'); await expect(page.locator('.recoveryPanel')).toContainText('Another tab changed this save');
  await expect(page.getByRole('button', { name: 'Review Panel Filter', exact: true })).toBeDisabled(); expect((await read(page)).cashYen).toBe(12000);
});
for (const [name, width, height] of [['desktop', 1440, 1000], ['mobile', 390, 844]] as const) {
  test(`${name} persistent HUD, separate tabs, scroll layout and workshop preview`, async ({ page }) => {
    const errors: string[] = []; page.on('pageerror', (error) => errors.push(error.message)); await page.setViewportSize({ width, height }); await seed(page, rich());
    await tab(page, 'Workshop'); await page.evaluate(() => window.scrollTo(0, 800));
    const header = await page.locator('.gameTopbar').boundingBox(); expect(header?.y).toBe(0);
    await expect(page.getByTestId('cash')).toBeInViewport(); await expect(page.getByTestId('player-level')).toBeInViewport(); await expect(page.getByTestId('reputation')).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `test-results/workshop-${name}-scrolled.png` });
    await page.evaluate(() => window.scrollTo(0, 0)); await page.screenshot({ path: `test-results/workshop-${name}.png`, fullPage: true });
    await review(page, 'Attack ECU'); await page.screenshot({ path: `test-results/part-preview-${name}.png` });
    const box = await page.getByRole('dialog').boundingBox(); expect(box!.width).toBeLessThanOrEqual(width); await page.keyboard.press('Escape');
    await tab(page, 'Jobs'); await expect(page.getByRole('tabpanel')).toHaveAttribute('id', 'panel-jobs'); await expect(page.getByTestId('cash')).toBeInViewport(); expect(errors).toEqual([]);
  });
}
test('very narrow viewport and high balances keep the HUD within the screen', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 780 }); await seed(page, { ...initial(), cashYen: Number.MAX_SAFE_INTEGER, reputation: Number.MAX_SAFE_INTEGER });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await tab(page, 'Saves'); await expect(page.getByTestId('cash')).toBeInViewport(); await expect(page.getByTestId('reputation')).toBeInViewport();
});
