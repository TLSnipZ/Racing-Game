// Temporary staging-only integration. All production anchors must match exactly once.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
const files = new Map();
const read = (p) => files.get(p) ?? readFileSync(p, 'utf8');
function patch(p, from, to) { const s = read(p); if (s.split(from).length !== 2) throw new Error(`One anchor required in ${p}: ${from.slice(0,100)}`); files.set(p, s.replace(from, to)); }
const app = 'src/App.tsx';
patch(app, "import { City }", "import { Market } from './components/Market';\nimport { buyMarketVehicle, sellVehicle, refreshMarket } from './domain/market';\nimport { City }");
patch(app, "import './styles/phase7.css';", "import './styles/phase7.css';\nimport './styles/phase8.css';");
patch(app, "next === 'races' || next === 'city'", "next === 'races' || next === 'city' || next === 'market'");
patch(app, 'className="shell phase3 phase4 phase5 phase6 phase7"', 'className="shell phase3 phase4 phase5 phase6 phase7 phase8"');
patch(app, '<Garage key={viewEpoch} game={game} blocked={blocked} onActivate=', '<Garage key={viewEpoch} game={game} blocked={blocked} onMarket={() => selectTab(\'market\')} onActivate=');
patch(app, 'The other two are planned for the used market later.', 'The other two are available later in Market.');
patch(app, '    <footer>PHASE 7 // KAGEHAMA CITY', '    <div id="panel-market" role="tabpanel" aria-labelledby="tab-market" tabIndex={0} hidden={tab !== \'market\'} className="sectionPanel">\n      {hasStarted && <Market key={viewEpoch} game={game} blocked={blocked} visible={tab === \'market\'}\n        onBuy={(id, key) => session.command((current) => buyMarketVehicle(current, id, key))}\n        onSell={(id, key) => session.command((current) => sellVehicle(current, id, key))}\n        onRefresh={(batch) => session.command((current) => refreshMarket(current, batch, Date.now()))}\n        onGarage={() => selectTab(\'garage\')} />}\n    </div>\n    <footer>PHASE 8 // CAR MARKET');
const header = 'src/components/GameHeader.tsx';
patch(header, 'Database, Gauge, Map, Warehouse, Wrench', 'Database, Gauge, Map, ShoppingBag, Warehouse, Wrench');
patch(header, "'workshop' | 'saves';", "'workshop' | 'market' | 'saves';");
patch(header, "  { id: 'saves', label: 'Saves', Icon: Database },", "  { id: 'market', label: 'Market', Icon: ShoppingBag },\n  { id: 'saves', label: 'Saves', Icon: Database },");
patch(header, 'PRE-ALPHA / 07', 'PRE-ALPHA / 08');
const types = 'src/domain/types.ts';
patch(types, "import type { RacingState }", "import type { MarketState } from './marketTypes';\nimport type { RacingState }");
patch(types, 'export type GameState = LegacyGameStateV4 & { racing: RacingState };', 'export type LegacyGameStateV5 = LegacyGameStateV4 & { racing: RacingState };\nexport type GameState = LegacyGameStateV5 & { market: MarketState };');
const game = 'src/domain/game.ts';
patch(game, "import { STARTER_CARS }", "import { createMarketState } from './marketStock';\nimport { STARTER_CARS }");
patch(game, 'racing: createRacingState()', 'racing: createRacingState(), market: createMarketState()');
const persistence = 'src/domain/persistence.ts';
patch(persistence, "import { createEconomyState", "import { createMarketState } from './marketStock';\nimport { isMarketState } from './marketValidation';\nimport { createEconomyState");
patch(persistence, 'LegacyGameStateV4, LegacyPlayerVehicle', 'LegacyGameStateV4, LegacyGameStateV5, LegacyPlayerVehicle');
patch(persistence, 'export const SAVE_VERSION = 5;', 'export const SAVE_VERSION = 6;');
patch(persistence, 'export function isGameState(value: unknown): value is GameState {', 'function isGameStateV5(value: unknown): value is LegacyGameStateV5 {');
patch(persistence, 'export function createSaveEnvelope(', 'export function isGameState(value: unknown): value is GameState {\n  if (!isGameStateV5(value) || !(\'market\' in value) || !isMarketState(value.market)) return false;\n  return value.selectedStarterId !== null || (value.market.nextTradeId === 1 && value.market.batch === 1);\n}\nexport function createSaveEnvelope(');
patch(persistence, '[1, 2, 3, 4, SAVE_VERSION]', '[1, 2, 3, 4, 5, SAVE_VERSION]');
patch(persistence, '  if (parsed.version !== SAVE_VERSION) {', '  if ([1, 2, 3, 4].includes(parsed.version as number)) {');
patch(persistence, "  if (!isGameState(state)) throw new Error('Save game state is invalid.');\n  return { version: SAVE_VERSION, savedAt: parsed.savedAt, state };", "  if (parsed.version !== SAVE_VERSION) {\n    if (!isGameStateV5(state)) throw new Error('Legacy v5 save game state is invalid.');\n    // Keep every prior vehicle, job and race snapshot intact. Add listings, not free owned cars.\n    state = { ...state, market: createMarketState() };\n  }\n  if (!isGameState(state)) throw new Error('Save game state is invalid.');\n  return { version: SAVE_VERSION, savedAt: parsed.savedAt, state };");
const tuning = 'src/domain/tuning.ts';
patch(tuning, "  'pico-rs': { grip: 48", "  'mira-s': { grip: 54, handling: 58, braking: 55, reliability: 86 },\n  'nami-gt': { grip: 61, handling: 67, braking: 59, reliability: 82 },\n  'riku-tourer': { grip: 54, handling: 47, braking: 57, reliability: 89 },\n  'pico-rs': { grip: 48");
patch('src/data/parts.ts', "const ALL = ['pico-rs', 'tora-85', 'rz-t'] as const;", "const ALL = ['pico-rs', 'tora-85', 'rz-t', 'mira-s', 'nami-gt', 'riku-tourer'] as const;");
const garage = 'src/components/Garage.tsx';
patch(garage, "import { STARTER_CARS } from '../data/starters';", "import { findVehicleModel, MANUFACTURERS, BODY_TYPES } from '../data/vehicles';");
patch(garage, 'export function Garage({ game, blocked, onActivate }: { game: GameState; blocked: boolean; onActivate: (id: string) => void })', 'export function Garage({ game, blocked, onActivate, onMarket }: { game: GameState; blocked: boolean; onActivate: (id: string) => void; onMarket: () => void })');
patch(garage, 'const catalog = STARTER_CARS.find((car) => car.id === inspected.catalogId);', 'const catalog = findVehicleModel(inspected.catalogId);');
patch(garage, '<div><dt>Build year</dt><dd>{inspected.year}</dd></div>', '<div><dt>Build year</dt><dd>{inspected.year}</dd></div>{catalog && <><div><dt>Manufacturer</dt><dd>{MANUFACTURERS[catalog.manufacturer]}</dd></div><div><dt>Body type</dt><dd>{BODY_TYPES[catalog.bodyType]}</dd></div></>}');
patch(garage, '<p>Keep your first ride. Additional cars become available with the used market in Phase 8.</p><span>MARKET PLANNED · NO EXTRA CARS GRANTED</span>', '<p>Find individual used cars in Market. Keep at least one ride; your garage currently supports 12 spaces.</p><button type="button" className="secondaryButton" onClick={onMarket}>BROWSE CAR MARKET</button>');
patch('tests/e2e/helpers.ts', "'Workshop' | 'Saves'", "'Workshop' | 'Market' | 'Saves'");

// Adapt only exact expected migration/new-game shapes and current-version assertions.
// Historical fixtures and negative validators are retained, not weakened or deleted.
const list = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? list(`${dir}/${entry.name}`) : [`${dir}/${entry.name}`]);
for (const path of [...list('src/domain'), ...list('tests/e2e')].filter((p) => /\.(test|spec)\.ts$/.test(p))) {
  let source = read(path); const original = source;
  const marker = 'racing: createRacingState()';
  if (source.includes(marker)) {
    source = source.replaceAll(marker, 'market: createMarketState(), racing: createRacingState()');
    const location = path.startsWith('src/') ? './marketStock' : '../../src/domain/marketStock';
    source = `import { createMarketState } from '${location}';\n${source}`;
  }
  source = source.replace('expect(SAVE_VERSION).toBe(5)', 'expect(SAVE_VERSION).toBe(6)')
    .replace('expect(save.version).toBe(5)', 'expect(save.version).toBe(SAVE_VERSION)')
    .replace('expect(JSON.parse((await stored(page))!).version).toBe(5)', 'expect(JSON.parse((await stored(page))!).version).toBe(6)');
  if (source !== original) files.set(path, source);
}

// Freeze the previous schema as a compatibility fixture; keep all original v1-v4 bytes unchanged.
const previous = JSON.parse(readFileSync('tests/fixtures/save-v4.json', 'utf8'));
const legacyV5 = { ...previous, version: 5, state: { ...previous.state, racing: {
  nextRunId: 1, activeRace: null, completedRaces: 0, cancelledRaces: 0, wins: 0, podiums: 0,
  totalEntryFeesYen: 0, totalEarnedYen: 0, lastResult: null, records: [],
} } };
files.set('tests/fixtures/save-v5.json', JSON.stringify(legacyV5, null, 2) + '\n');
for (const [path, content] of files) { writeFileSync(path, content); console.log(`Integrated ${path}`); }
