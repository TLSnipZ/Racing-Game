import { findVehicleModel, type BodyType, type Manufacturer } from '../data/vehicles';
import { isVehicleBusy } from './tuning';
import { getVehicleValuation } from './vehicleValue';
import { GARAGE_CAPACITY, generateMarketStock, MARKET_REFRESH_FEE, MARKET_REFRESH_MS, MAX_MARKET_BATCH } from './marketStock';
import { isMarketState } from './marketValidation';
import type { MarketListing, MarketReceipt } from './marketTypes';
import type { GameState } from './types';
const int = (n: number) => Number.isSafeInteger(n) && n >= 0;
function add(a: number, b: number) { if (!int(a) || !int(b) || !int(a + b)) throw new Error('Market value exceeds its safe range.'); return a + b; }
function assertMarket(state: GameState) { if (!isMarketState(state.market)) throw new Error('Market save is invalid.'); }
export function getListingKey(listing: MarketListing): string { return JSON.stringify(listing); }
export function getPurchaseRequirement(state: GameState, listing: MarketListing): string | null {
  if (state.selectedStarterId === null) return 'Choose your starter first.';
  if (!state.market.listings.some((offer) => offer.id === listing.id)) return 'This listing is no longer available.';
  if (listing.purchased) return 'This listing has already been purchased.';
  if (state.playerLevel < listing.minLevel) return `Requires Level ${listing.minLevel}.`;
  if (state.ownedVehicles.length >= GARAGE_CAPACITY) return `Garage full: ${GARAGE_CAPACITY} spaces. Sell a spare car first.`;
  if (state.ownedVehicles.some((v) => v.instanceId === listing.vehicle.instanceId)) return 'This vehicle ID is already in your garage.';
  if (!int(state.cashYen) || state.cashYen < listing.askYen) return 'Not enough valid cash.';
  return null;
}
export function buyMarketVehicle(state: GameState, listingId: string, expectedKey: string): GameState {
  assertMarket(state);
  const listing = state.market.listings.find((offer) => offer.id === listingId);
  if (!listing || getListingKey(listing) !== expectedKey) throw new Error('This listing changed. Review the current offer again.');
  const reason = getPurchaseRequirement(state, listing); if (reason) throw new Error(reason);
  const vehicle = structuredClone(listing.vehicle);
  const receipt: MarketReceipt = { id: state.market.nextTradeId, kind: 'buy', vehicleId: vehicle.instanceId, vehicleName: vehicle.name, amountYen: listing.askYen };
  return { ...state, cashYen: state.cashYen - listing.askYen, ownedVehicles: [...state.ownedVehicles, vehicle],
    activeVehicleId: state.activeVehicleId ?? vehicle.instanceId,
    market: { ...state.market, listings: state.market.listings.map((item) => item.id === listingId ? { ...item, purchased: true } : item),
      purchases: add(state.market.purchases, 1), totalSpentYen: add(state.market.totalSpentYen, listing.askYen),
      nextTradeId: add(state.market.nextTradeId, 1), lastTrade: receipt } };
}
export function getSaleKey(state: GameState, vehicleId: string): string {
  return JSON.stringify({ vehicle: state.ownedVehicles.find((v) => v.instanceId === vehicleId) ?? null,
    active: state.activeVehicleId, garageIds: state.ownedVehicles.map((v) => v.instanceId) });
}
export function getSaleRequirement(state: GameState, vehicleId: string): string | null {
  const vehicle = state.ownedVehicles.find((v) => v.instanceId === vehicleId);
  if (!vehicle) return 'This vehicle is no longer owned.';
  if (state.selectedStarterId === null) return 'Choose your starter first.';
  if (state.ownedVehicles.length <= 1) return 'Keep at least one car. Your last ride cannot be sold.';
  if (isVehicleBusy(state, vehicleId)) return 'This car is assigned to a job or race. Claim, settle or cancel it before selling.';
  if (!findVehicleModel(vehicle.catalogId)) return 'No dealer quote for this legacy model. Your car is kept.';
  const quote = getVehicleValuation(vehicle);
  if (!quote || !int(state.cashYen) || !int(state.cashYen + quote.offerYen)) return 'Sale would exceed the safe cash range.';
  return null;
}
export function sellVehicle(state: GameState, vehicleId: string, expectedKey: string): GameState {
  assertMarket(state);
  if (getSaleKey(state, vehicleId) !== expectedKey) throw new Error('This garage or build changed. Review the sale again.');
  const reason = getSaleRequirement(state, vehicleId); if (reason) throw new Error(reason);
  const vehicle = state.ownedVehicles.find((v) => v.instanceId === vehicleId)!;
  const quote = getVehicleValuation(vehicle)!;
  const ownedVehicles = state.ownedVehicles.filter((v) => v.instanceId !== vehicleId);
  return { ...state, cashYen: add(state.cashYen, quote.offerYen), ownedVehicles,
    activeVehicleId: state.activeVehicleId === vehicleId ? ownedVehicles[0].instanceId : state.activeVehicleId,
    market: { ...state.market, sales: add(state.market.sales, 1), totalReceivedYen: add(state.market.totalReceivedYen, quote.offerYen),
      nextTradeId: add(state.market.nextTradeId, 1), lastTrade: { id: state.market.nextTradeId, kind: 'sell',
        vehicleId, vehicleName: vehicle.name, amountYen: quote.offerYen } } };
}
export function getRefreshRequirement(state: GameState, nowMs: number): string | null {
  if (state.selectedStarterId === null || state.playerLevel < 2) return 'Stock refresh requires a starter and Level 2.';
  if (!int(nowMs)) return 'Device clock is invalid.';
  if (state.market.refreshedAtMs !== null && nowMs < state.market.refreshedAtMs) return 'Device clock moved backwards. Restore it before refreshing stock.';
  if (nowMs < state.market.nextRefreshAtMs) return 'Stock refresh is cooling down.';
  if (!int(state.cashYen) || state.cashYen < MARKET_REFRESH_FEE) return 'Not enough cash for new listings.';
  if (state.market.batch >= MAX_MARKET_BATCH || !int(nowMs + MARKET_REFRESH_MS)) return 'Stock refresh exceeds its supported range.';
  return null;
}
export function refreshMarket(state: GameState, expectedBatch: number, nowMs: number): GameState {
  assertMarket(state);
  if (state.market.batch !== expectedBatch) throw new Error('The stock already changed. Review the new listings.');
  const reason = getRefreshRequirement(state, nowMs); if (reason) throw new Error(reason);
  const batch = state.market.batch + 1;
  return { ...state, cashYen: state.cashYen - MARKET_REFRESH_FEE,
    market: { ...state.market, batch, listings: generateMarketStock(batch), refreshedAtMs: nowMs, nextRefreshAtMs: nowMs + MARKET_REFRESH_MS } };
}

export type MarketFilters = { search: string; manufacturer: Manufacturer | 'all'; bodyType: BodyType | 'all'; yearFrom: string; yearTo: string; showPurchased: boolean };
export type MarketSort = 'price-low' | 'price-high' | 'year-new' | 'year-old' | 'mileage' | 'condition';
export const EMPTY_MARKET_FILTERS: MarketFilters = { search: '', manufacturer: 'all', bodyType: 'all', yearFrom: '', yearTo: '', showPurchased: false };
export function getMarketFilterError(filters: MarketFilters): string | null {
  const validYear = (v: string) => v === '' || (/^\d{4}$/.test(v) && Number(v) >= 1900 && Number(v) <= 2100);
  if (!validYear(filters.yearFrom) || !validYear(filters.yearTo)) return 'Enter a four-digit year between 1900 and 2100, or leave it blank.';
  if (filters.yearFrom && filters.yearTo && Number(filters.yearFrom) > Number(filters.yearTo)) return 'From year must not be later than To year.';
  return null;
}
export function filterMarketListings(listings: readonly MarketListing[], filters: MarketFilters, sort: MarketSort): MarketListing[] {
  if (getMarketFilterError(filters)) return [];
  const query = filters.search.trim().toLowerCase();
  const output = listings.filter((listing) => {
    const model = findVehicleModel(listing.vehicle.catalogId);
    return !!model && (filters.showPurchased || !listing.purchased)
      && (filters.manufacturer === 'all' || model.manufacturer === filters.manufacturer)
      && (filters.bodyType === 'all' || model.bodyType === filters.bodyType)
      && (!filters.yearFrom || listing.vehicle.year >= Number(filters.yearFrom))
      && (!filters.yearTo || listing.vehicle.year <= Number(filters.yearTo))
      && (!query || `${listing.vehicle.name} ${listing.id} ${listing.seller}`.toLowerCase().includes(query));
  });
  const condition = (l: MarketListing) => l.vehicle.engineCondition + l.vehicle.bodyCondition + l.vehicle.transmissionCondition;
  return output.sort((a, b) => {
    const order = sort === 'price-high' ? b.askYen - a.askYen : sort === 'year-new' ? b.vehicle.year - a.vehicle.year
      : sort === 'year-old' ? a.vehicle.year - b.vehicle.year : sort === 'mileage' ? a.vehicle.odometerKm - b.vehicle.odometerKm
      : sort === 'condition' ? condition(b) - condition(a) : a.askYen - b.askYen;
    return order || a.id.localeCompare(b.id);
  });
}
