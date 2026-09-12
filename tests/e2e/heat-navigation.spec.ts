import { expect, test } from '@playwright/test';
import { createNewGameState, purchaseStarter } from '../../src/domain/game';
import { seed, stored, tab } from './helpers';

for (const width of [320, 390]) {
  test(`${width}px Heat shortcut reveals the active City tab without changing the save`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    const game = purchaseStarter(createNewGameState(), 'pico-rs', 'pico-1');
    await seed(page, { ...game, heat: { ...game.heat, value: 25 } });
    await tab(page, 'Saves');
    await page.locator('.sectionTabs').evaluate((row) => { row.scrollLeft = row.scrollWidth; });
    const before = await stored(page);
    await page.getByRole('button', { name: 'Open Heat controls', exact: true }).click();
    await expect(page.getByRole('tabpanel')).toHaveAttribute('id', 'panel-city');
    await expect(page.locator('#heat-controls')).toBeFocused();
    const city = page.getByRole('tab', { name: 'City', exact: true });
    await expect(city).toHaveAttribute('aria-selected', 'true');
    const selected = (await city.boundingBox())!;
    const row = (await page.locator('.sectionTabs').boundingBox())!;
    expect(selected.x).toBeGreaterThanOrEqual(row.x - 1);
    expect(selected.x + selected.width).toBeLessThanOrEqual(row.x + row.width + 1);
    expect((await page.locator('.gameTopbar').boundingBox())!.y).toBe(0);
    await expect(page.getByTestId('heat-value')).toBeInViewport();
    expect(await stored(page)).toBe(before);
    await page.screenshot({ path: `test-results/heat-shortcut-${width}.png` });
  });
}
