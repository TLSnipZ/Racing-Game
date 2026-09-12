import { VEHICLE_MODELS } from '../data/vehicles';
import { calculateAskingPrice } from './vehicleValue';
import type { MarketListing, MarketState } from './marketTypes';
import type { PlayerVehicle } from './types';
export const GARAGE_CAPACITY = 12;
export const MARKET_REFRESH_FEE = 1000;
export const MARKET_REFRESH_MS = 300000;
export const MAX_MARKET_BATCH = 1000000;
export const MARKET_SIZE = 9;
const SELLERS = ['Mercer Used Imports', 'East Ward Motors', 'Bayline Trade', 'Nightshift Auto'];
const MODEL_ORDER = [0, 1, 2, 3, 4, 5, 0, 1, 2];
/** Versioned deterministic batch generator. Materialize snapshots once; browsing never calls refresh. */
export function generateMarketStock(batch: number): MarketListing[] {
  if (!Number.isSafeInteger(batch) || batch < 1 || batch > MAX_MARKET_BATCH) throw new Error('Market batch is outside its supported range.');
  return MODEL_ORDER.map((modelIndex, slot) => {
    const model = VEHICLE_MODELS[modelIndex];
    let seed = (Math.imul(batch, 2654435761) ^ Math.imul(slot + 1, 1597334677)) >>> 0;
    const next = (min: number, max: number) => {
      seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; seed >>>= 0;
      return min + seed % (max - min + 1);
    };
    const id = `market-${batch}-${slot + 1}`;
    const vehicle: PlayerVehicle = {
      instanceId: id, catalogId: model.id, name: model.name, year: next(model.yearFrom, model.yearTo),
      engine: model.engine, drive: model.drive, hp: model.hp, weightKg: model.weightKg,
      odometerKm: next(65000, 245000), engineCondition: next(55, 95), bodyCondition: next(50, 96),
      transmissionCondition: next(55, 96), originality: next(80, 100), installedParts: [...model.stockParts],
      tuning: { purchasedPartIds: [], installedBySlot: {} },
    };
    const demandBps = next(9500, 10500);
    return { id, vehicle, demandBps, askYen: calculateAskingPrice(vehicle, demandBps),
      minLevel: model.minLevel, seller: SELLERS[slot % SELLERS.length], purchased: false };
  });
}
export function createMarketState(): MarketState {
  return { stockVersion: 1, batch: 1, refreshedAtMs: null, nextRefreshAtMs: 0, listings: generateMarketStock(1),
    purchases: 0, sales: 0, totalSpentYen: 0, totalReceivedYen: 0, nextTradeId: 1, lastTrade: null };
}
