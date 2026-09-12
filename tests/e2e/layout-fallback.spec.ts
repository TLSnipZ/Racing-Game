import { test, expect } from '@playwright/test';
import { createNewGameState, purchaseStarter } from '../../src/domain/game';
import { seed, stored, tab } from './helpers';

test('blocked webfonts and high balances never overflow the 320px garage or shared HUD', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 780 });
  await page.route('https://fonts.googleapis.com/**', (route) => route.abort());
  await page.route('https://fonts.gstatic.com/**', (route) => route.abort());
  const game = { ...purchaseStarter(createNewGameState(), 'pico-rs', 'pico-1'),
    cashYen: Number.MAX_SAFE_INTEGER, reputation: Number.MAX_SAFE_INTEGER };
  await seed(page, game);
  const before = await stored(page);
  for (const section of ['Garage', 'Jobs', 'City', 'Races', 'Workshop', 'Market', 'Saves'] as const) {
    await tab(page, section);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.getByTestId('cash')).toBeInViewport();
    await expect(page.getByRole('progressbar', { name: 'Level XP progress', exact: true })).toBeInViewport();
  }
  expect(await stored(page)).toBe(before);
  await tab(page, 'Garage');
  await page.screenshot({ path: 'test-results/narrow-fallback-hud.png' });
});
