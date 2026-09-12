import { describe, expect, it } from 'vitest';
import { BODY_TYPES, findVehicleModel, MANUFACTURERS, VEHICLE_MODELS } from '../data/vehicles';
import { PARTS } from '../data/parts';
import { createNewGameState, createPlayerVehicle, purchaseStarter } from './game';
import { buyMarketVehicle, EMPTY_MARKET_FILTERS, filterMarketListings, getListingKey, getMarketFilterError,
  getPurchaseRequirement, getRefreshRequirement, getSaleKey, getSaleRequirement, refreshMarket, sellVehicle } from './market';
import { createMarketState, GARAGE_CAPACITY, generateMarketStock, MARKET_REFRESH_FEE, MARKET_REFRESH_MS } from './marketStock';
import { isMarketState } from './marketValidation';
import { getVehicleValuation } from './vehicleValue';
import { getVehicleBuildStats, installPart, removePart } from './tuning';
import { startJob, claimJob } from './economy';
import { getRaceBuildKey, startRace, settleRace } from './racing';
import { deserializeSave, exportSaveCode, importSaveCode, isGameState, SAVE_VERSION, serializeSave } from './persistence';
import legacyV5 from '../../tests/fixtures/save-v5.json';
import type { GameState } from './types';
const initial = () => purchaseStarter(createNewGameState(), 'pico-rs', 'starter-1');
const rich = (): GameState => ({ ...initial(), cashYen: 2000000, playerLevel: 5, reputation: 200 });
const buy = (state: GameState, index = 0) => { const l = state.market.listings[index]; return buyMarketVehicle(state, l.id, getListingKey(l)); };
const sell = (state: GameState, id: string) => sellVehicle(state, id, getSaleKey(state, id));

describe('Market catalog, stock snapshots and filters', () => {
  it('keeps three starters but has six explicit market models across four body types and three brands', () => {
    expect(VEHICLE_MODELS).toHaveLength(6); expect(new Set(VEHICLE_MODELS.map((m) => m.id)).size).toBe(6);
    expect(new Set(VEHICLE_MODELS.map((m) => m.bodyType)).size).toBe(Object.keys(BODY_TYPES).length);
    expect(new Set(VEHICLE_MODELS.map((m) => m.manufacturer)).size).toBe(Object.keys(MANUFACTURERS).length);
    expect(initial().ownedVehicles).toHaveLength(1); expect(() => createPlayerVehicle('nami-gt', 'not-a-starter')).toThrow();
  });
  it('creates nine independent, reproducible listings without using clock or RNG globals', () => {
    const a = generateMarketStock(1); const b = generateMarketStock(1);
    expect(a).toHaveLength(9); expect(a).toEqual(b); expect(new Set(a.map((l) => l.id)).size).toBe(9);
    expect(new Set(a.map((l) => l.vehicle.catalogId)).size).toBe(6);
    expect(a.filter((l) => l.vehicle.catalogId === 'pico-rs')).toHaveLength(2);
    a[0].vehicle.installedParts.push('Edited'); expect(b[0].vehicle.installedParts).not.toContain('Edited');
    expect(generateMarketStock(2)).not.toEqual(b);
  });
  it.each(VEHICLE_MODELS.map((m) => m.id))('supports trading, tuning and racing %s', (id) => {
    let game = rich(); const i = game.market.listings.findIndex((l) => l.vehicle.catalogId === id); game = buy(game, i);
    const car = game.ownedVehicles[1]; const model = findVehicleModel(id)!;
    expect(car.year).toBeGreaterThanOrEqual(model.yearFrom); expect(car.year).toBeLessThanOrEqual(model.yearTo);
    game = installPart(game, car.instanceId, 'aoba-panel-filter', null);
    expect(getVehicleBuildStats(game.ownedVehicles[1]).powerPs).toBeGreaterThan(car.hp);
    const raced = startRace(game, 'east-ward-shakedown', car.instanceId, getRaceBuildKey(game.ownedVehicles[1]), 1000);
    expect(isGameState(raced)).toBe(true);
    const paid = settleRace(raced, raced.racing.activeRace!.runId, raced.racing.activeRace!.finishesAtMs);
    expect(isGameState(sell(paid, car.instanceId))).toBe(true);
  });
  it.each([-1, 0, 1.5, NaN, Infinity, 1000001])('rejects invalid batch %s', (batch) => expect(() => generateMarketStock(batch)).toThrow());
  it('combines brand, body and year bounds with exact-year support and preserves source order', () => {
    const listings = generateMarketStock(1); const before = JSON.stringify(listings);
    const car = listings[3].vehicle;
    const filters = { ...EMPTY_MARKET_FILTERS, manufacturer: 'hoshino' as const, bodyType: 'sedan' as const, yearFrom: String(car.year), yearTo: String(car.year) };
    expect(filterMarketListings(listings, filters, 'price-low')).toEqual([listings[3]]);
    expect(filterMarketListings(listings, { ...filters, manufacturer: 'mikado' }, 'price-low')).toHaveLength(0);
    expect(JSON.stringify(listings)).toBe(before);
  });
  it('searches model, ID and seller without parsing manufacturer from a name', () => {
    const list = generateMarketStock(1); list[0].vehicle.name = 'Totally renamed';
    expect(filterMarketListings(list, { ...EMPTY_MARKET_FILTERS, manufacturer: 'hoshino' }, 'price-low')).toContain(list[0]);
    expect(filterMarketListings(list, { ...EMPTY_MARKET_FILTERS, search: ' market-1-1 ' }, 'price-low')).toEqual([list[0]]);
  });
  it.each(['price-low', 'price-high', 'year-new', 'year-old', 'mileage', 'condition'] as const)('sorts by %s without writing data', (sort) => {
    const list = generateMarketStock(1); const before = JSON.stringify(list); const sorted = filterMarketListings(list, EMPTY_MARKET_FILTERS, sort);
    const values = sorted.map((l) => sort.startsWith('price') ? l.askYen : sort.startsWith('year') ? l.vehicle.year
      : sort === 'mileage' ? l.vehicle.odometerKm : l.vehicle.engineCondition + l.vehicle.bodyCondition + l.vehicle.transmissionCondition);
    expect(values).toEqual([...values].sort((a, b) => ['price-high', 'year-new', 'condition'].includes(sort) ? b - a : a - b));
    expect(JSON.stringify(list)).toBe(before);
  });
  it.each([{ yearFrom: 'abc' }, { yearTo: '2200' }, { yearFrom: '199' }, { yearFrom: '2000', yearTo: '1990' }])('rejects invalid year bounds %j', (patch) => {
    expect(getMarketFilterError({ ...EMPTY_MARKET_FILTERS, ...patch })).not.toBeNull();
    expect(filterMarketListings(generateMarketStock(1), { ...EMPTY_MARKET_FILTERS, ...patch }, 'price-low')).toHaveLength(0);
  });
});

describe('Atomic purchase, dealer sale and garage safeguards', () => {
  it('charges exactly the ask, adds the exact instance, records a receipt and leaves the active car selected', () => {
    const state = rich(); const before = structuredClone(state); const l = state.market.listings[0]; const after = buy(state);
    expect(after.cashYen).toBe(state.cashYen - l.askYen); expect(after.ownedVehicles[1]).toEqual(l.vehicle);
    expect(after.activeVehicleId).toBe('starter-1'); expect(after.market.purchases).toBe(1); expect(after.market.listings[0].purchased).toBe(true);
    expect(after.market.lastTrade).toMatchObject({ kind: 'buy', amountYen: l.askYen }); expect(state).toEqual(before); expect(isGameState(after)).toBe(true);
  });
  it('cannot buy the same offer twice or reuse a stale quote after refresh', () => {
    const s = rich(); const l = s.market.listings[0]; const paid = buy(s);
    expect(() => buyMarketVehicle(paid, l.id, getListingKey(l))).toThrow();
    const refreshed = refreshMarket(s, 1, 1000); expect(() => buyMarketVehicle(refreshed, l.id, getListingKey(l))).toThrow();
    expect(() => buyMarketVehicle(s, 'missing', 'x')).toThrow();
  });
  it.each([0, -1, 1.5, NaN, Infinity])('rejects invalid or insufficient purchase cash %s', (cashYen) => {
    const s = { ...rich(), cashYen }; expect(() => buy(s)).toThrow(); expect(s.market.purchases).toBe(0);
  });
  it('supports exact cash and enforces level plus starter gates', () => {
    const s = rich(); s.cashYen = s.market.listings[0].askYen; expect(buy(s).cashYen).toBe(0);
    expect(() => buy({ ...s, playerLevel: 1 })).toThrow('Level 2'); expect(() => buy(createNewGameState())).toThrow('starter');
  });
  it('rejects duplicate vehicle IDs and full garages without deleting grandfathered cars', () => {
    const s = rich(); s.ownedVehicles.push(structuredClone(s.market.listings[0].vehicle)); expect(() => buy(s)).toThrow('ID');
    const full = rich(); for (let i = 1; i < GARAGE_CAPACITY + 2; i++) full.ownedVehicles.push(createPlayerVehicle('pico-rs', `old-${i}`));
    expect(isGameState(full)).toBe(true); expect(() => buy(full)).toThrow('full'); expect(full.ownedVehicles).toHaveLength(14);
  });
  it('activates a purchased vehicle only when recovering a valid empty legacy garage', () => {
    const s = { ...rich(), ownedVehicles: [], activeVehicleId: null }; const after = buy(s);
    expect(after.activeVehicleId).toBe(after.ownedVehicles[0].instanceId); expect(isGameState(after)).toBe(true);
  });
  it('cannot sell the last car or an unowned instance', () => {
    expect(() => sell(initial(), 'starter-1')).toThrow('last ride'); expect(() => sell(initial(), 'ghost')).toThrow('owned');
  });
  it('sale removes precisely one tuned car, credits once and preserves other vehicles', () => {
    let s = buy(rich()); const id = s.ownedVehicles[1].instanceId; s = installPart(s, id, 'aoba-panel-filter', null);
    const expected = getVehicleValuation(s.ownedVehicles[1])!.offerYen; const key = getSaleKey(s, id); const after = sellVehicle(s, id, key);
    expect(after.cashYen).toBe(s.cashYen + expected); expect(after.ownedVehicles).toEqual([s.ownedVehicles[0]]);
    expect(after.market.listings[0].purchased).toBe(true); expect(after.market.sales).toBe(1);
    expect(() => sellVehicle(after, id, key)).toThrow(); expect(isGameState(after)).toBe(true);
  });
  it('selling the active car deterministically selects the first remaining car', () => {
    const s = buy(rich()); const after = sell(s, 'starter-1'); expect(after.selectedStarterId).toBe('pico-rs');
    expect(after.activeVehicleId).toBe(s.ownedVehicles[1].instanceId); expect(isGameState(after)).toBe(true);
  });
  it('rejects stale sales after garage, mileage or tuning changes', () => {
    const s = buy(rich()); const id = s.ownedVehicles[1].instanceId; const key = getSaleKey(s, id);
    const tuned = installPart(s, id, 'aoba-panel-filter', null); expect(() => sellVehicle(tuned, id, key)).toThrow('changed');
    expect(() => sellVehicle({ ...s, activeVehicleId: id }, id, key)).toThrow('changed');
    const moved = structuredClone(s); moved.ownedVehicles[1].odometerKm++; expect(() => sellVehicle(moved, id, key)).toThrow('changed');
  });
  it.each(['job', 'race'] as const)('never sells a car assigned to an unsettled %s, but permits unrelated trades', (activity) => {
    let s = buy(rich()); const car = s.ownedVehicles[0];
    s = activity === 'job' ? startJob(s, 'parts-run', 1000) : startRace(s, 'east-ward-shakedown', car.instanceId, getRaceBuildKey(car), 1000);
    expect(getSaleRequirement(s, car.instanceId)).toContain('assigned'); expect(() => sell(s, car.instanceId)).toThrow('assigned');
    const extra = buy(s, 1); const after = sell(extra, s.ownedVehicles[1].instanceId);
    expect(after.economy).toEqual(s.economy); expect(after.racing).toEqual(s.racing); expect(isGameState(after)).toBe(true);
  });
  it('keeps past race receipts and records after selling the formerly assigned car', () => {
    const s = buy(rich()); const car = s.ownedVehicles[0]; const pending = startRace(s, 'east-ward-shakedown', car.instanceId, getRaceBuildKey(car), 1000);
    const paid = settleRace(pending, 1, pending.racing.activeRace!.finishesAtMs); const after = sell(paid, car.instanceId);
    expect(after.racing).toEqual(paid.racing); expect(isGameState(after)).toBe(true);
  });
  it('sale fails safely at cash overflow, and legacy unknown models remain kept', () => {
    const s = buy(rich()); const id = s.ownedVehicles[1].instanceId; expect(() => sell({ ...s, cashYen: Number.MAX_SAFE_INTEGER }, id)).toThrow('range');
    s.ownedVehicles[1].catalogId = 'unfamiliar-legacy'; expect(getSaleRequirement(s, id)).toContain('legacy');
  });
  it('does not write a trade if counters would overflow', () => {
    const s = buy(rich()); s.market.totalReceivedYen = Number.MAX_SAFE_INTEGER; s.market.sales = 1;
    s.market.nextTradeId++; s.market.lastTrade = { id: 2, kind: 'sell', amountYen: 100, vehicleId: 'past', vehicleName: 'Past' };
    expect(isMarketState(s.market)).toBe(true); expect(() => sell(s, s.ownedVehicles[1].instanceId)).toThrow('range');
  });
});

describe('Valuation, refresh and save compatibility', () => {
  it('condition, mileage, year and originality affect dealer offers in the documented direction', () => {
    const car = rich().market.listings[3].vehicle; const q = (patch: Partial<typeof car>) => getVehicleValuation({ ...car, ...patch })!.offerYen;
    expect(q({ engineCondition: 100, bodyCondition: 100, transmissionCondition: 100 })).toBeGreaterThan(q({ engineCondition: 20, bodyCondition: 20, transmissionCondition: 20 }));
    expect(q({ odometerKm: 0 })).toBeGreaterThan(q({ odometerKm: 400000 }));
    expect(q({ year: 1999 })).toBeGreaterThan(q({ year: 1996 })); expect(q({ originality: 100 })).toBeGreaterThan(q({ originality: 30 }));
  });
  it('immediate stock flips cannot generate profit across 100 deterministic batches', () => {
    for (let batch = 1; batch <= 100; batch++) for (const l of generateMarketStock(batch)) expect(getVehicleValuation(l.vehicle)!.offerYen).toBeLessThan(l.askYen);
  });
  it('credits each purchased part once, including removed parts; refitting cannot compound value', () => {
    let s = buy(rich()); const id = s.ownedVehicles[1].instanceId; s = installPart(s, id, 'aoba-panel-filter', null);
    expect(getVehicleValuation(s.ownedVehicles[1])!.partsCreditYen).toBe(1200);
    s = removePart(s, id, 'intake', 'aoba-panel-filter'); const old = getVehicleValuation(s.ownedVehicles[1])!;
    s = installPart(s, id, 'aoba-panel-filter', null); expect(getVehicleValuation(s.ownedVehicles[1])!.partsCreditYen).toBe(old.partsCreditYen);
    expect(PARTS.find((p) => p.id === 'aoba-panel-filter')!.priceYen).toBe(6000);
  });
  it('explicit refresh charges once, replaces listings and preserves cars and all activity data', () => {
    const s = buy(rich()); const pending = startJob(s, 'parts-run', 1000); const after = refreshMarket(pending, 1, 1000);
    expect(after.cashYen).toBe(pending.cashYen - MARKET_REFRESH_FEE); expect(after.market.batch).toBe(2);
    expect(after.market.nextRefreshAtMs).toBe(1000 + MARKET_REFRESH_MS); expect(after.market.listings).toEqual(generateMarketStock(2));
    expect(after.ownedVehicles).toEqual(pending.ownedVehicles); expect(after.economy).toEqual(pending.economy); expect(isGameState(after)).toBe(true);
    expect(() => refreshMarket(after, 1, 1000)).toThrow('changed'); expect(() => refreshMarket(after, 2, 2000)).toThrow('cooling');
    expect(() => refreshMarket(after, 2, 999)).toThrow('backwards'); expect(refreshMarket(after, 2, after.market.nextRefreshAtMs).market.batch).toBe(3);
  });
  it.each([-1, NaN, Infinity, 1.5, Number.MAX_SAFE_INTEGER])('cannot refresh at invalid or overflowing time %s', (now) => expect(() => refreshMarket(rich(), 1, now)).toThrow());
  it('refresh requires Level 2 and fee, not just an expired timer', () => {
    expect(getRefreshRequirement(initial(), 1000)).toContain('Level 2'); expect(() => refreshMarket({ ...rich(), cashYen: 999 }, 1, 1000)).toThrow('cash');
  });
  it('migrates frozen v5 tuned cars and pending jobs without changing any old field', () => {
    const raw = JSON.stringify(legacyV5); const migrated = deserializeSave(raw);
    expect(migrated.version).toBe(6); const { market, ...old } = migrated.state;
    expect(old).toEqual(legacyV5.state); expect(market).toEqual(createMarketState()); expect(JSON.stringify(legacyV5)).toBe(raw);
  });
  it('migrates a paid pending v5 race and leaves its fee, grid and outcome intact', () => {
    const s = rich(); const car = s.ownedVehicles[0]; const pending = startRace(s, 'dockyard-402', car.instanceId, getRaceBuildKey(car), 1000);
    const { market: _market, ...old } = pending; const migrated = deserializeSave(JSON.stringify({ version: 5, savedAt: 1000, state: old })).state;
    expect(migrated.racing).toEqual(pending.racing); expect(migrated.cashYen).toBe(pending.cashYen);
  });
  it('round-trips sold flags, owned cars, trades, fees and deadlines without regeneration', () => {
    let s = buy(rich()); s = sell(s, 'starter-1'); s = refreshMarket(s, 1, 1000); s = buy(s);
    for (let i = 0; i < 10; i++) { const code = exportSaveCode(s); expect(code).toMatch(/^KAGEHAMA1-/); expect(importSaveCode(code).state).toEqual(s); }
    expect(SAVE_VERSION).toBe(6);
  });
  it.each([undefined, null, {}, { ...createMarketState(), batch: 0 }, { ...createMarketState(), nextTradeId: 2 },
    { ...createMarketState(), nextRefreshAtMs: 10 }, { ...createMarketState(), listings: [] }, { ...createMarketState(), stockVersion: 99 }])('rejects malformed v6 market instead of recreating stock %j', (market) => {
    expect(() => deserializeSave(JSON.stringify({ version: 6, savedAt: 1000, state: { ...rich(), market } }))).toThrow();
  });
  it.each(['price', 'id', 'vehicle-id', 'model', 'condition', 'parts', 'sold', 'year', 'level'])('rejects malformed stored listing %s', (kind) => {
    const s = rich(); const l = s.market.listings[0];
    if (kind === 'price') l.askYen = -1; if (kind === 'id') l.id = s.market.listings[1].id;
    if (kind === 'vehicle-id') l.vehicle.instanceId = 'different'; if (kind === 'model') l.vehicle.catalogId = 'unknown';
    if (kind === 'condition') l.vehicle.bodyCondition = 101; if (kind === 'parts') l.vehicle.tuning.purchasedPartIds.push('aoba-panel-filter');
    if (kind === 'sold') l.purchased = true; if (kind === 'year') l.vehicle.year = Infinity; if (kind === 'level') l.minLevel = 0;
    expect(isGameState(s)).toBe(false);
  });
  it('cannot trade from a fresh starterless save by supplying forged market history', () => {
    const s = buy(rich()); expect(isGameState({ ...createNewGameState(), market: s.market })).toBe(false);
  });
});
