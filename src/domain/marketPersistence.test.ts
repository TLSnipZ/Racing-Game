import { Buffer } from 'node:buffer';
import { describe, expect, it } from 'vitest';
import v1 from '../../tests/fixtures/save-v1.json';
import v2 from '../../tests/fixtures/save-v2.json';
import v3 from '../../tests/fixtures/save-v3.json';
import v4 from '../../tests/fixtures/save-v4.json';
import v5 from '../../tests/fixtures/save-v5.json';
import { createNewGameState, purchaseStarter } from './game';
import { createMarketState } from './marketStock';
import { buyMarketVehicle, refreshMarket, sellMarketVehicle, getVehicleSaleKey } from './market';
import { getVehicleValuation } from './marketValue';
import { deserializeSave, exportSaveCode, importSaveCode, isGameState, SAVE_CODE_PREFIX, SAVE_VERSION, serializeSave, loadFromStorage } from './persistence';
import { installPart } from './tuning';
import { getRaceBuildKey, startRace } from './racing';
const rich = () => ({ ...purchaseStarter(createNewGameState(), 'pico-rs', 'first'), cashYen: 1000000, playerLevel: 5, reputation: 200 });
function traded() {
  let state = rich(); const listing = state.market.listings[1];
  state = buyMarketVehicle(state, listing.id, 0, listing.askingPriceYen);
  state = installPart(state, listing.id, 'aoba-panel-filter', null);
  state = refreshMarket(state, 0, 1000);
  state = sellMarketVehicle(state, 'first', getVehicleSaleKey(state.ownedVehicles[0], 'first'), getVehicleValuation(state.ownedVehicles[0]).offerYen, listing.id);
  return state;
}
const raw = (state: unknown, version = SAVE_VERSION) => JSON.stringify({ version, savedAt: 2000, state });

describe('Save v6 market and historical compatibility', () => {
  it.each([v1, v2, v3, v4, v5])('reads the frozen v$version snapshot without losing previous fields or inventing purchases', (old) => {
    const before = JSON.stringify(old); const result = deserializeSave(before);
    expect(result.version).toBe(6); expect(result.savedAt).toBe(old.savedAt);
    expect(result.state.cashYen).toBe(old.state.cashYen); expect(result.state.playerLevel).toBe(old.state.playerLevel); expect(result.state.reputation).toBe(old.state.reputation);
    expect(result.state.market).toEqual(createMarketState(old.state.ownedVehicles.map((v) => v.instanceId)));
    expect(result.state.ownedVehicles.map(({ tuning: _tuning, ...car }) => car)).toEqual(old.state.ownedVehicles.map((car) => { const { tuning: _tuning, ...base } = car as typeof car & { tuning?: unknown }; return base; }));
    if ('economy' in old.state) expect(result.state.economy).toEqual(old.state.economy);
    if ('racing' in old.state) expect(result.state.racing).toEqual(old.state.racing);
    expect(JSON.stringify(old)).toBe(before);
    expect(importSaveCode(SAVE_CODE_PREFIX + Buffer.from(before).toString('base64url')).state).toEqual(result.state);
  });
  it('preserves every v5 field, including a paid race, tuned parts, fee and exact sector results', () => {
    const { market, ...result } = deserializeSave(JSON.stringify(v5)).state;
    expect(result).toEqual(v5.state); expect(market.purchasedCount).toBe(0); expect(market.soldCount).toBe(0);
  });
  it('round-trips traded stock, car tuning and a pending race without recalculating or awarding it', () => {
    let state = traded(); const car = state.ownedVehicles[0];
    state = startRace(state, 'hakuro-intro', car.instanceId, getRaceBuildKey(car), 1000);
    let copy = state;
    for (let i = 0; i < 10; i++) copy = importSaveCode(exportSaveCode(copy, 999999999999)).state;
    expect(copy).toEqual(state); expect(copy.market.listings).toEqual(state.market.listings); expect(copy.racing.activeRace).toEqual(state.racing.activeRace);
  });
  it('does not regenerate empty stock, remove the cooldown or forget sold cars on reload', () => {
    let state = rich();
    for (const entry of [...state.market.listings]) state = buyMarketVehicle(state, entry.id, 0, entry.askingPriceYen);
    expect(state.market.listings).toHaveLength(0); expect(deserializeSave(serializeSave(state)).state).toEqual(state);
    const after = traded(); expect(deserializeSave(serializeSave(after)).state).toEqual(after);
  });
  it('reset creates stock v1 with no owned cars, parts, transactions or clock anchor', () => {
    const empty = createNewGameState(); expect(empty.market).toEqual(createMarketState()); expect(empty.ownedVehicles).toHaveLength(0);
    expect(isGameState(empty)).toBe(true); expect(exportSaveCode(empty)).toMatch(/^KAGEHAMA1-/);
  });
  it('valid legacy IDs matching market IDs are retained and do not collide with the generated lot', () => {
    const old = structuredClone(v4); old.state.ownedVehicles[0].instanceId = 'market-v1:0:pico-rs'; old.state.activeVehicleId = 'market-v1:0:pico-rs';
    if (old.state.economy.activeJob) old.state.economy.activeJob.vehicleId = 'market-v1:0:pico-rs';
    const state = deserializeSave(JSON.stringify(old)).state;
    expect(state.ownedVehicles[0].instanceId).toBe('market-v1:0:pico-rs');
    expect(state.market.listings[0].id).toBe('market-v1:0:pico-rs:1'); expect(isGameState(state)).toBe(true);
  });
  it.each([undefined, null, {}, { ...createMarketState(), stockVersion: 99 }, { ...createMarketState(), generation: -1 },
    { ...createMarketState(), generation: 1 }, { ...createMarketState(), refreshedAtMs: 1000 }, { ...createMarketState(), listings: null },
    { ...createMarketState(), purchasedCount: 1 }, { ...createMarketState(), soldCount: 1 }, { ...createMarketState(), totalSpentYen: 1 },
    { ...createMarketState(), totalReceivedYen: 1 }, { ...createMarketState(), nextTransactionId: 0 },
    { ...createMarketState(), lastTrade: {} }])('rejects missing or malformed current market data without resetting it: %j', (market) => {
    expect(() => deserializeSave(raw({ ...rich(), market }))).toThrow();
  });
  it.each(['price', 'fractional-price', 'unknown-model', 'duplicate', 'owned-collision', 'instance-mismatch', 'empty-seller', 'level', 'year', 'power', 'tuning', 'oversized'])('rejects bad listing %s', (field) => {
    const state = rich(); const listing = state.market.listings[0];
    if (field === 'price') listing.askingPriceYen = -1;
    if (field === 'fractional-price') listing.askingPriceYen = 1.2;
    if (field === 'unknown-model') listing.vehicle.catalogId = 'unknown';
    if (field === 'duplicate') state.market.listings[1] = structuredClone(listing);
    if (field === 'owned-collision') { listing.id = 'first'; listing.vehicle.instanceId = 'first'; }
    if (field === 'instance-mismatch') listing.vehicle.instanceId = 'other';
    if (field === 'empty-seller') listing.seller = '';
    if (field === 'level') listing.minLevel = 0;
    if (field === 'year') listing.vehicle.year = 1950;
    if (field === 'power') listing.vehicle.hp += 1;
    if (field === 'tuning') listing.vehicle.tuning.purchasedPartIds = ['aoba-panel-filter'];
    if (field === 'oversized') state.market.listings.push(structuredClone(listing));
    expect(isGameState(state)).toBe(false); expect(() => deserializeSave(raw(state))).toThrow();
  });
  it.each(['transaction', 'kind', 'amount', 'counters', 'refresh-clock', 'refresh-overflow'])('rejects invalid completed accounting %s', (field) => {
    const state = traded();
    if (field === 'transaction') state.market.lastTrade!.transactionId = 99;
    if (field === 'kind') state.market.lastTrade!.kind = 'other' as never;
    if (field === 'amount') state.market.lastTrade!.amountYen = -1;
    if (field === 'counters') state.market.nextTransactionId++;
    if (field === 'refresh-clock') state.market.refreshedAtMs = -1;
    if (field === 'refresh-overflow') state.market.refreshedAtMs = Number.MAX_SAFE_INTEGER;
    expect(isGameState(state)).toBe(false);
  });
  it('does not let a missing v5 racing field be silently replaced with an empty race history', () => {
    const { racing: _race, ...old } = v5.state; expect(() => deserializeSave(raw(old, 5))).toThrow('v5');
  });
  it('keeps corrupt source storage protected without deleting it', () => {
    const source = raw({ ...traded(), market: null }); const storage = { getItem: () => source };
    expect(() => loadFromStorage(storage)).toThrow(); expect(storage.getItem()).toBe(source);
  });
  it('decodes independent market objects rather than shared mutable stock', () => {
    const code = exportSaveCode(traded()); const a = importSaveCode(code); const b = importSaveCode(code);
    a.state.market.listings[0].vehicle.engineCondition = 0; expect(a.state.market).not.toEqual(b.state.market);
    expect(importSaveCode(code).state).toEqual(b.state);
  });
});
