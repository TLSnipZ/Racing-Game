import { describe, expect, it } from 'vitest';
import { BODY_TYPES, MANUFACTURERS, USED_VEHICLE_CATALOG } from '../data/vehicles';
import { PARTS } from '../data/parts';
import { createNewGameState, createPlayerVehicle, purchaseStarter } from './game';
import { createMarketListings, createMarketState, GARAGE_CAPACITY, MARKET_REFRESH_MS } from './marketStock';
import { buyMarketVehicle, sellMarketVehicle, refreshMarket, getVehicleSaleKey, getBuyRequirement, getSellRequirement } from './market';
import { getVehicleValuation } from './marketValue';
import { createMarketFilters, filterMarketListings, getMarketFilterError } from './marketFilters';
import { isMarketState } from './marketValidation';
import { getVehicleBuildStats, installPart, removePart } from './tuning';
import { getRaceBuildKey, startRace, settleRace } from './racing';
import { startJob, claimJob } from './economy';
import { isGameState, serializeSave } from './persistence';
import type { GameState, PlayerVehicle } from './types';

const initial = () => purchaseStarter(createNewGameState(), 'pico-rs', 'starter');
const rich = (): GameState => ({ ...initial(), cashYen: 1000000, playerLevel: 6, reputation: 300 });
function buy(game: GameState, catalogId = 'tora-85') {
  const listing = game.market.listings.find((entry) => entry.vehicle.catalogId === catalogId)!;
  return buyMarketVehicle(game, listing.id, game.market.generation, listing.askingPriceYen);
}
function sell(game: GameState, id: string, replacement: string | null = null) {
  const car = game.ownedVehicles.find((vehicle) => vehicle.instanceId === id)!;
  return sellMarketVehicle(game, id, getVehicleSaleKey(car, game.activeVehicleId), getVehicleValuation(car).offerYen, replacement);
}

describe('Vehicle catalog, stock v1 and valuation', () => {
  it('has six models, three explicit manufacturers and all four body types', () => {
    expect(USED_VEHICLE_CATALOG).toHaveLength(6); expect(new Set(USED_VEHICLE_CATALOG.map((car) => car.id)).size).toBe(6);
    expect(new Set(USED_VEHICLE_CATALOG.map((car) => car.manufacturer)).size).toBe(3);
    expect(new Set(USED_VEHICLE_CATALOG.map((car) => car.bodyType)).size).toBe(4);
  });
  it('keeps the original starter choice, prices and stats untouched', () => {
    for (const [id, cash] of [['pico-rs', 18000], ['tora-85', 8000], ['rz-t', 2000]] as const) {
      const state = purchaseStarter(createNewGameState(), id, 'first');
      expect(state.cashYen).toBe(cash); expect(state.ownedVehicles).toHaveLength(1);
    }
  });
  it('creates deterministic, independent stock without a clock or hidden purchase', () => {
    const a = createMarketState(); const b = createMarketState(); expect(a).toEqual(b);
    a.listings[0].vehicle.installedParts.push('test'); expect(b.listings[0].vehicle.installedParts).not.toContain('test');
    expect(createNewGameState().ownedVehicles).toHaveLength(0); expect(isMarketState(b, [])).toBe(true);
  });
  it('avoids reserved vehicle IDs without changing owned data or other listing stats', () => {
    const ordinary = createMarketListings(0); const reserved = [ordinary[0].id, ordinary[0].id + ':1'];
    const safe = createMarketListings(0, reserved); expect(safe[0].id).toBe(ordinary[0].id + ':2');
    expect(safe[0].vehicle.instanceId).toBe(safe[0].id); expect(safe[0].askingPriceYen).toBe(ordinary[0].askingPriceYen);
  });
  it.each(VEHICLE_IDS())('creates a valid, normally acquirable and tunable %s', (id) => {
    let state = buy(rich(), id); const car = state.ownedVehicles.at(-1)!;
    expect(isGameState(state)).toBe(true); expect(car.instanceId).not.toBe('starter');
    const base = getVehicleBuildStats(car).powerPs;
    state = installPart(state, car.instanceId, 'aoba-panel-filter', null);
    expect(getVehicleBuildStats(state.ownedVehicles.at(-1)!).powerPs).toBeGreaterThan(base);
    const race = startRace(state, 'east-ward-shakedown', car.instanceId, getRaceBuildKey(state.ownedVehicles.at(-1)!), 1000);
    expect(isGameState(race)).toBe(true);
  });
  it('keeps the stock ask above its trade-in for every generated offer across 100 batches', () => {
    for (let batch = 0; batch < 100; batch++) for (const listing of createMarketListings(batch)) {
      expect(getVehicleValuation(listing.vehicle).offerYen).toBeLessThan(listing.askingPriceYen);
      expect(Number.isSafeInteger(listing.askingPriceYen)).toBe(true);
    }
  });
  it('responds to mileage, condition, year and originality without a wall-clock price model', () => {
    const car = createMarketListings(0)[0].vehicle;
    const fresh = { ...car, year: 1996, odometerKm: 0, engineCondition: 100, bodyCondition: 100, transmissionCondition: 100, originality: 100 };
    const top = getVehicleValuation(fresh).fairYen; expect(top).toBe(50000);
    for (const changed of [{ ...fresh, odometerKm: 200000 }, { ...fresh, engineCondition: 0 }, { ...fresh, year: 1992 }, { ...fresh, originality: 0 }])
      expect(getVehicleValuation(changed).fairYen).toBeLessThan(top);
  });
  it('pays 65% of reference plus 20% for every purchased part, including stored upgrades, rounded to 100 yen', () => {
    let state = buy(rich()); const id = state.ownedVehicles[1].instanceId;
    state = installPart(state, id, 'aoba-panel-filter', null); state = removePart(state, id, 'intake', 'aoba-panel-filter');
    const quote = getVehicleValuation(state.ownedVehicles[1]); expect(quote.partsOfferYen).toBe(1200);
    expect(quote.offerYen).toBe(Math.floor(quote.fairYen * 65 / 10000) * 100 + 1200);
  });
  it('keeps RZ-T-only turbos restricted without adding or repricing parts', () => {
    expect(PARTS).toHaveLength(14); expect(PARTS.filter((p) => p.slot === 'turbo').every((p) => p.compatibleCatalogIds.join() === 'rz-t')).toBe(true);
    expect(() => installPart(buy(rich(), 'estate-gt'), 'market-v1:0:estate-gt', 'kurogane-big-turbo', null)).toThrow('compatible');
  });
});
function VEHICLE_IDS() { return USED_VEHICLE_CATALOG.map((car) => car.id); }

describe('Atomic purchases, capacity and listing identity', () => {
  it('charges once, keeps exact advertised data and parks the new car without activating it', () => {
    const before = rich(); const raw = serializeSave(before, 1000); const listing = before.market.listings[1];
    const after = buyMarketVehicle(before, listing.id, 0, listing.askingPriceYen);
    expect(after.cashYen).toBe(before.cashYen - listing.askingPriceYen); expect(after.activeVehicleId).toBe('starter');
    expect(after.ownedVehicles[1]).toEqual(listing.vehicle); expect(after.market.listings).toHaveLength(5);
    expect(after.market.purchasedCount).toBe(1); expect(after.market.totalSpentYen).toBe(listing.askingPriceYen);
    expect(serializeSave(before, 1000)).toBe(raw); expect(isGameState(after)).toBe(true);
    after.ownedVehicles[1].installedParts.push('test'); expect(listing.vehicle.installedParts).not.toContain('test');
  });
  it('rejects double/stale/unknown purchases rather than buying a replacement listing', () => {
    const game = rich(); const l = game.market.listings[0]; const after = buyMarketVehicle(game, l.id, 0, l.askingPriceYen);
    expect(() => buyMarketVehicle(after, l.id, 0, l.askingPriceYen)).toThrow('no longer');
    expect(() => buyMarketVehicle(game, l.id, 1, l.askingPriceYen)).toThrow('Stock changed');
    expect(() => buyMarketVehicle(game, l.id, 0, 1)).toThrow('asking price');
    expect(() => buyMarketVehicle(game, 'unknown', 0, 1)).toThrow('no longer');
  });
  it.each([-1, 0, 1.5, NaN, Infinity])('rejects invalid or insufficient cash %s without mutating stock', (cashYen) => {
    const game = { ...rich(), cashYen }; const before = JSON.stringify(game); expect(() => buy(game)).toThrow(); expect(JSON.stringify(game)).toBe(before);
  });
  it('requires the actual catalog level and starter choice', () => {
    expect(() => buy({ ...rich(), playerLevel: 1 }, 'senda-s')).toThrow('Level 3');
    expect(() => buy(createNewGameState())).toThrow('starter');
  });
  it('keeps an imported over-capacity garage intact and blocks additional purchases', () => {
    const game = rich();
    for (let i = 1; i < GARAGE_CAPACITY + 1; i++) game.ownedVehicles.push(createPlayerVehicle('pico-rs', `old-${i}`));
    const before = structuredClone(game); expect(isGameState(game)).toBe(true);
    expect(() => buy(game)).toThrow('Garage full'); expect(game).toEqual(before);
  });
  it('checks safe accounting before changing cash or cars', () => {
    const game = buy(rich()); game.market.totalSpentYen = Number.MAX_SAFE_INTEGER;
    expect(() => buy(game, 'rz-t')).toThrow('safe range'); expect(game.ownedVehicles).toHaveLength(2);
  });
  it('can buy during a job/race without restarting or paying that activity', () => {
    const job = startJob(rich(), 'parts-run', 1000); const after = buy(job);
    expect(after.economy).toEqual(job.economy); expect(after.racing).toEqual(job.racing); expect(after.activeVehicleId).toBe('starter');
    const race = startRace(rich(), 'hakuro-intro', 'starter', getRaceBuildKey(rich().ownedVehicles[0]), 1000);
    expect(buy(race).racing).toEqual(race.racing);
  });
});

describe('Safe sales and complete vehicle ownership', () => {
  it('protects the last car, but permits selling the original starter after choosing a replacement', () => {
    expect(() => sell(initial(), 'starter')).toThrow('last vehicle');
    const two = buy(rich()); const replacement = two.ownedVehicles[1].instanceId;
    const after = sell(two, 'starter', replacement); expect(after.ownedVehicles.map((v) => v.instanceId)).toEqual([replacement]);
    expect(after.selectedStarterId).toBe('pico-rs'); expect(after.activeVehicleId).toBe(replacement); expect(isGameState(after)).toBe(true);
  });
  it.each([null, 'starter', 'ghost'])('rejects a missing or invalid active replacement %s', (replacement) => {
    const game = buy(rich()); expect(() => sell(game, 'starter', replacement)).toThrow('remaining active');
  });
  it('sells an inactive vehicle with all its parts and only one payment', () => {
    let game = buy(rich()); const id = game.ownedVehicles[1].instanceId;
    game = installPart(game, id, 'aoba-panel-filter', null); game = removePart(game, id, 'intake', 'aoba-panel-filter');
    const raw = serializeSave(game, 1000); const vehicle = game.ownedVehicles[1]; const quote = getVehicleValuation(vehicle);
    const result = sell(game, id); expect(result.cashYen).toBe(game.cashYen + quote.offerYen);
    expect(result.ownedVehicles).toHaveLength(1); expect(result.ownedVehicles[0].tuning.purchasedPartIds).toHaveLength(0);
    expect(result.activeVehicleId).toBe('starter'); expect(result.market.soldCount).toBe(1);
    expect(result.market.lastTrade).toMatchObject({ kind: 'sell', transactionId: 2, amountYen: quote.offerYen });
    expect(result.market.listings).toEqual(game.market.listings); expect(serializeSave(game, 1000)).toBe(raw);
    expect(() => sellMarketVehicle(result, id, getVehicleSaleKey(vehicle, game.activeVehicleId), quote.offerYen, null)).toThrow('no longer owned');
  });
  it('rejects changed car data, inventory, quote or active selection at confirmation', () => {
    const game = buy(rich()); const vehicle = game.ownedVehicles[1]; const key = getVehicleSaleKey(vehicle, 'starter'); const quote = getVehicleValuation(vehicle).offerYen;
    const tuned = installPart(game, vehicle.instanceId, 'aoba-panel-filter', null);
    expect(() => sellMarketVehicle(tuned, vehicle.instanceId, key, quote, null)).toThrow('changed');
    expect(() => sellMarketVehicle({ ...game, activeVehicleId: vehicle.instanceId }, vehicle.instanceId, key, quote, 'starter')).toThrow('changed');
    expect(() => sellMarketVehicle(game, vehicle.instanceId, key, quote + 100, null)).toThrow('offer changed');
  });
  it('does not assign an arbitrary replacement when selling an inactive car', () => {
    const game = buy(rich()); expect(() => sell(game, game.ownedVehicles[1].instanceId, 'starter')).toThrow('remaining active');
  });
  it('blocks an assigned delivery vehicle until claim, even when it is not active', () => {
    const game = startJob(buy(rich()), 'parts-run', 1000); game.activeVehicleId = game.ownedVehicles[1].instanceId;
    expect(() => sell(game, 'starter')).toThrow('assigned');
    const claimed = claimJob(game, game.economy.activeJob!.runId, game.economy.activeJob!.finishesAtMs);
    expect(isGameState(sell(claimed, 'starter'))).toBe(true);
  });
  it('blocks the assigned race car through finish, but keeps sold-car race history after settlement', () => {
    const game = buy(rich()); const id = game.ownedVehicles[1].instanceId;
    const running = startRace(game, 'hakuro-intro', id, getRaceBuildKey(game.ownedVehicles[1]), 1000);
    expect(() => sell(running, id)).toThrow('assigned');
    const settled = settleRace(running, 1, running.racing.activeRace!.finishesAtMs);
    const sold = sell(settled, id); expect(sold.racing).toEqual(settled.racing); expect(isGameState(sold)).toBe(true);
  });
  it('can sell an unrelated spare while a different car is assigned', () => {
    const game = startJob(buy(rich()), 'parts-run', 1000); const sold = sell(game, game.ownedVehicles[1].instanceId);
    expect(sold.economy).toEqual(game.economy); expect(sold.activeVehicleId).toBe('starter'); expect(isGameState(sold)).toBe(true);
  });
  it('rejects sale overflow without losing the car', () => {
    const game = { ...buy(rich()), cashYen: Number.MAX_SAFE_INTEGER }; const before = structuredClone(game);
    expect(() => sell(game, game.ownedVehicles[1].instanceId)).toThrow('safe range'); expect(game).toEqual(before);
  });
  it('keeps unfamiliar historical vehicles, refusing an invented dealer value', () => {
    const game = buy(rich()); game.ownedVehicles[1].catalogId = 'historical-import';
    expect(isGameState(game)).toBe(true); expect(getSellRequirement(game, game.ownedVehicles[1].instanceId)).toContain('no dealer valuation');
  });
});

describe('Explicit stock refresh and read-only filter composition', () => {
  it('refreshes only on a command, retaining owned cars, balances, parts, trades and activities', () => {
    const game = startJob(buy(rich()), 'garage-shift', 1000); const before = structuredClone(game);
    const next = refreshMarket(game, 0, 2000);
    expect(next.market.listings).toHaveLength(6); expect(next.market.generation).toBe(1); expect(next.market.refreshedAtMs).toBe(2000);
    const { market: _a, ...rest } = game; const { market: _b, ...newRest } = next; expect(newRest).toEqual(rest);
    expect(next.market.purchasedCount).toBe(1); expect(next.market.totalSpentYen).toBe(game.market.totalSpentYen);
    expect(next.market.listings.every((l) => !next.ownedVehicles.some((v) => v.instanceId === l.id))).toBe(true); expect(game).toEqual(before);
  });
  it('enforces the 5-minute cooldown, stale batch guard and backward-clock protection', () => {
    const first = refreshMarket(rich(), 0, 1000);
    expect(() => refreshMarket(first, 0, 1000)).toThrow('Stock changed');
    expect(() => refreshMarket(first, 1, 1001)).toThrow('not ready');
    expect(() => refreshMarket(first, 1, 999)).toThrow('backwards');
    expect(refreshMarket(first, 1, 1000 + MARKET_REFRESH_MS).market.generation).toBe(2);
  });
  it.each([-1, 0.1, NaN, Infinity, Number.MAX_SAFE_INTEGER])('rejects invalid/overflowing stock clocks %s', (now) => {
    expect(() => refreshMarket(rich(), 0, now)).toThrow('clock');
  });
  it('does not refresh before starter choice', () => expect(() => refreshMarket(createNewGameState(), 0, 1000)).toThrow('starter'));
  it('combines manufacturer, body type, inclusive year range and text without mutating stock', () => {
    const game = rich(); const before = serializeSave(game, 1000); const filters = createMarketFilters();
    expect(filterMarketListings(game.market.listings, { ...filters, manufacturer: 'hoshino', bodyType: 'hatchback' })).toHaveLength(2);
    expect(filterMarketListings(game.market.listings, { ...filters, manufacturer: 'akari', bodyType: 'hatchback' })).toHaveLength(0);
    const year = String(game.market.listings[0].vehicle.year);
    expect(filterMarketListings(game.market.listings, { ...filters, yearFrom: year, yearTo: year, query: 'Pico RS' })).toHaveLength(1);
    expect(serializeSave(game, 1000)).toBe(before);
  });
  it.each(['abc', '199', '0', '2101', '-100'])('rejects invalid year input %s without silently widening the range', (yearFrom) => {
    const filters = { ...createMarketFilters(), yearFrom }; expect(getMarketFilterError(filters)).not.toBeNull();
    expect(filterMarketListings(createMarketListings(0), filters)).toHaveLength(0);
  });
  it('reports an inverted range and can reset to all listings', () => {
    expect(getMarketFilterError({ ...createMarketFilters(), yearFrom: '2000', yearTo: '1990' })).toContain('earliest');
    expect(filterMarketListings(createMarketListings(0), createMarketFilters())).toHaveLength(6);
  });
  it.each(['price-asc', 'price-desc', 'year-asc', 'year-desc', 'mileage', 'condition'] as const)('has stable %s sorting and no lost or duplicated cars', (sort) => {
    const source = createMarketListings(0); const before = structuredClone(source); const result = filterMarketListings(source, { ...createMarketFilters(), sort });
    expect(new Set(result.map((l) => l.id)).size).toBe(6); expect(source).toEqual(before);
    const values = result.map((l) => sort.startsWith('price') ? l.askingPriceYen : sort.startsWith('year') ? l.vehicle.year : sort === 'mileage' ? l.vehicle.odometerKm : l.vehicle.engineCondition + l.vehicle.bodyCondition + l.vehicle.transmissionCondition);
    expect(values).toEqual([...values].sort((a, b) => sort.endsWith('desc') || sort === 'condition' ? b - a : a - b));
  });
  it('maintains valid accounting over repeated buys, sales, refreshes and serialization', () => {
    let game = rich(); let now = 1000;
    for (let i = 0; i < 25; i++) {
      game = buy(game); const car = game.ownedVehicles.at(-1)!; game = sell(game, car.instanceId);
      now += MARKET_REFRESH_MS; game = refreshMarket(game, game.market.generation, now);
      expect(isGameState(game)).toBe(true); expect(game.market.nextTransactionId).toBe(game.market.purchasedCount + game.market.soldCount + 1);
      expect(game.cashYen).toBe(1000000 - game.market.totalSpentYen + game.market.totalReceivedYen);
    }
  });
});
