import { VEHICLE_CATALOG, type VehicleDefinition } from '../data/vehicles';
import { createVehicleTuning } from './tuning';
import { getVehicleValuation } from './marketValue';
import type { MarketListing, MarketState } from './marketTypes';
import type { PlayerVehicle } from './types';

export const GARAGE_CAPACITY = 12;
export const MARKET_REFRESH_MS = 5 * 60 * 1000;
export const MARKET_STOCK_VERSION = 1;
export const MAX_MARKET_GENERATION = 1_000_000;
const SELLERS = ['Mercer Used Motors', 'East Ward Trade Counter', 'Bayline Auto Exchange'];

/** Versioned deterministic samples: reloads, filters and clock edits never reroll the same stock batch. */
function sample(key: string, minimum: number, maximum: number): number {
  let value = 2166136261;
  for (const character of key) value = Math.imul(value ^ character.charCodeAt(0), 16777619) >>> 0;
  return minimum + value % (maximum - minimum + 1);
}
function stockVehicle(model: VehicleDefinition, id: string, generation: number): PlayerVehicle {
  const key = `market-v1:${generation}:${model.id}:`;
  const state = sample(key + 'state', 55, 93);
  return { instanceId: id, catalogId: model.id, name: model.name,
    year: sample(key + 'year', model.years[0], model.years[1]), engine: model.engine, drive: model.drive,
    hp: model.hp, weightKg: model.weightKg, odometerKm: sample(key + 'km', 620, 2420) * 100,
    engineCondition: Math.min(98, state + sample(key + 'engine', -5, 5)),
    bodyCondition: Math.min(98, state + sample(key + 'body', -5, 5)),
    transmissionCondition: Math.min(98, state + sample(key + 'gear', -5, 5)),
    originality: sample(key + 'originality', 82, 100), installedParts: [...model.stockParts], tuning: createVehicleTuning() };
}
export function createMarketListings(generation: number, reservedIds: readonly string[] = []): MarketListing[] {
  if (!Number.isSafeInteger(generation) || generation < 0 || generation > MAX_MARKET_GENERATION) throw new Error('Invalid market generation.');
  const reserved = new Set(reservedIds);
  return VEHICLE_CATALOG.map((model, index) => {
    const stem = `market-v1:${generation}:${model.id}`;
    let id = stem;
    // Avoid colliding with valid legacy/user-export vehicle IDs without rewriting the existing car.
    for (let suffix = 1; reserved.has(id); suffix++) id = `${stem}:${suffix}`;
    reserved.add(id);
    const vehicle = stockVehicle(model, id, generation);
    const fairYen = getVehicleValuation(vehicle).fairYen;
    const sellerBps = sample(`market-v1:${generation}:${model.id}:premium`, 10000, 10400);
    const askingPriceYen = Math.ceil(fairYen * sellerBps / 10000 / 100) * 100;
    return { id, vehicle, askingPriceYen, minLevel: model.marketLevel, seller: SELLERS[index % SELLERS.length] };
  });
}
export function createMarketState(reservedIds: readonly string[] = []): MarketState {
  return { stockVersion: 1, generation: 0, refreshedAtMs: null, listings: createMarketListings(0, reservedIds),
    nextTransactionId: 1, purchasedCount: 0, soldCount: 0, totalSpentYen: 0, totalReceivedYen: 0, lastTrade: null };
}
export function getRefreshRemainingMs(market: MarketState, nowMs: number): number {
  return market.refreshedAtMs === null ? 0 : Math.max(0, market.refreshedAtMs + MARKET_REFRESH_MS - nowMs);
}
