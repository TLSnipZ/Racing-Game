import { expect, type Page } from '@playwright/test';
import { SAVE_STORAGE_KEY, serializeSave } from '../../src/domain/persistence';
import type { GameState } from '../../src/domain/types';
export const T = Date.parse('2026-09-11T12:00:00Z');
export async function tab(page: Page, name: 'Garage' | 'Jobs' | 'City' | 'Races' | 'Workshop' | 'Market' | 'Collection' | 'Empire' | 'Saves') {
  await page.getByRole('tab', { name, exact: true }).click();
  await expect(page.getByRole('tab', { name, exact: true })).toHaveAttribute('aria-selected', 'true');
}
export const stored = (page: Page) => page.evaluate((key) => localStorage.getItem(key), SAVE_STORAGE_KEY);
export const read = async (page: Page): Promise<GameState> => JSON.parse((await stored(page))!).state;
export async function seedRaw(page: Page, raw: string) {
  await page.addInitScript(({ key, data }) => { if (localStorage.getItem(key) === null) localStorage.setItem(key, data); }, { key: SAVE_STORAGE_KEY, data: raw });
  await page.goto('./');
}
export async function seed(page: Page, state: GameState) {
  await seedRaw(page, serializeSave(state, T));
  await expect(page.getByTestId('cash')).toBeVisible(); await expect(page.locator('.saveIndicator')).toContainText('AUTOSAVED');
}
export async function clock(page: Page) { await page.clock.install({ time: new Date(T) }); await page.clock.pauseAt(new Date(T + 1000)); }
