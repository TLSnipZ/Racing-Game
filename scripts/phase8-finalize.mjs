// Temporary preparation helper; it and its workflow are removed in the materialized commit.
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
function replace(path, from, to) {
  const source = readFileSync(path, 'utf8');
  if (source.split(from).length !== 2) throw new Error(`Expected one anchor in ${path}: ${from.slice(0, 80)}`);
  writeFileSync(path, source.replace(from, to));
}
const tests = 'tests/e2e/racing.spec.ts';
replace(tests, "import { expect, test, type Page }", "import { createMarketState } from '../../src/domain/marketStock';\nimport { expect, test, type Page }");
replace(tests, 'const { racing, ...oldFields } = next; expect(oldFields).toEqual(legacyV4.state); expect(racing.nextRunId).toBe(1);', 'const { racing, market, ...oldFields } = next; expect(oldFields).toEqual(legacyV4.state); expect(racing.nextRunId).toBe(1);\n  expect(market).toEqual(createMarketState());');
const saves = 'src/components/SaveManagement.tsx';
replace(saves, '\\nRace finishes: ${state.racing.completedRaces}\\n\\nYour current save, including parts, race records and any pending job or race, will be replaced.', '\\nRace finishes: ${state.racing.completedRaces}\\nMarket batch: ${state.market.batch}\\nMarket purchases / sales: ${state.market.purchases} / ${state.market.sales}\\n\\nYour current save, including market stock, trade history, parts, race records and any pending job or race, will be replaced.');
replace(saves, 'Cars, parts, money, progress, race records and any pending job or race will be reset.', 'Cars, parts, money, progress, market stock/trades, race records and any pending job or race will be reset.');
replace(saves, 'Back up cars, tuning, progress, race records and your pending activity, or move your save to another device.', 'Back up cars, tuning, market stock and trades, progress, race records and your pending activity, or move your save to another device.');
const changelog = readFileSync('CHANGELOG.md', 'utf8');
const entry = `## Phase 8 — Used-car market (2026-09-12)

- Added a seventh Market section and Garage shortcut, retaining the sticky cash/level/REP/XP HUD and activity-ready indicators.
- Added nine persisted individual listings across six fictional models, including all three original starters plus Hoshino Mira S, Akari Nami GT and Mikado Riku Tourer. Initial starter choice remains three cars at unchanged prices.
- Added explicit manufacturer/body/year metadata, combinable brand/body/year-range filters, search, counts, purchased-listing toggle, sorting and clear-filter controls.
- Added confirmed atomic purchase and dealer sale with per-instance ownership, persistent purchased flags, receipts/counters and safe integer accounting. Buying never silently replaces an existing active car.
- Added a 12-car purchase capacity while retaining larger valid legacy garages. Prevented selling the last car or any car assigned to an unsettled job/race. Active-car sale previews the first remaining replacement; settled history survives sales.
- Added a documented condition/mileage/model-year/originality valuation with a dealer spread and 20% purchased-part credit. All per-car parts leave with a sold vehicle; instant unmodified flips are a loss.
- Added deterministic stock batches that never regenerate during browsing/reload. Confirmed refresh costs ¥1,000, requires Level 2 and sets a five-minute cooldown; it never affects owned vehicles or runs automatically.
- Extended existing non-turbo part compatibility to the new market models and provided their build ratings. Existing starter/job/part balances and race model v1 are unchanged.
- Migrated valid Save v1-v5 data to v6 by adding initial market data without resetting old cars, tuned builds, money, jobs or paid race snapshots. Retained KAGEHAMA1 and the browser key; malformed v6 markets are protected, not silently regenerated.
- Added market command, valuation, filter, migration, overflow, capacity, busy-car, duplicate-action and stock tests plus desktop/mobile/320px browser trading, recovery, round-trip and keyboard checks. Retained prior regressions, adapting only expectations for the new schema field.
- Updated README, roadmap, save-tool summaries and the Phase 8 contract. Graphics & Audio I remains explicitly open; the next numbered system is Phase 9 — Heat.

`;
if (!changelog.startsWith('# Changelog\n\n')) throw new Error('Unexpected changelog header');
writeFileSync('CHANGELOG.md', '# Changelog\n\n' + entry + changelog.slice('# Changelog\n\n'.length));
unlinkSync('scripts/phase8-finalize.mjs');
unlinkSync('.github/workflows/phase8-finalize.yml');
