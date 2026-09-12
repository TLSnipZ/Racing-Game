import { findVehicleDefinition } from '../data/vehicles';
import { createMarketListings, GARAGE_CAPACITY, MARKET_REFRESH_MS, MAX_MARKET_GENERATION, getRefreshRemainingMs } from './marketStock';
import { getVehicleValuation } from './marketValue';
import { isMarketState } from './marketValidation';
import { isVehicleBusy } from './tuning';
import type { MarketListing, MarketState } from './marketTypes';
import type { GameState, PlayerVehicle } from './types';

const integer = (value: number) => Number.isSafeInteger(value) && value >= 0;
function add(a: number, b: number): number {
  if (!integer(a) || !integer(b) || !Number.isSafeInteger(a + b)) throw new Error('Market amount exceeds its safe range.');
  return a + b;
}
function assertMarket(state: GameState) {
  if (!isMarketState(state.market, state.ownedVehicles)) throw new Error('Market data is invalid.');
}
export function getBuyRequirement(state: GameState, listing: MarketListing): string | null {
  if (state.selectedStarterId === null) return 'Choose your starter first.';
  if (!state.market.listings.some((entry) => entry.id === listing.id)) return 'This listing is no longer available.';
  if (state.playerLevel < listing.minLevel) return `Requires Level ${listing.minLevel}.`;
  if (state.ownedVehicles.length >= GARAGE_CAPACITY) return `Garage full: ${GARAGE_CAPACITY} spaces. Sell a spare car first.`;
  if (state.ownedVehicles.some((car) => car.instanceId === listing.vehicle.instanceId)) return 'This vehicle is already owned.';
  if (!integer(state.cashYen)) return 'Cash value is invalid.';
  if (state.cashYen < listing.askingPriceYen) return 'Not enough cash.';
  return null;
}
export function buyMarketVehicle(state: GameState, listingId: string, expectedGeneration: number, expectedPriceYen: number): GameState {
  assertMarket(state);
  if (state.market.generation !== expectedGeneration) throw new Error('Stock changed. Review this listing again.');
  const listing = state.market.listings.find((entry) => entry.id === listingId);
  if (!listing) throw new Error('This listing is no longer available.');
  if (listing.askingPriceYen !== expectedPriceYen) throw new Error('The asking price changed. Review the listing again.');
  const reason = getBuyRequirement(state, listing);
  if (reason) throw new Error(reason);
  const vehicle: PlayerVehicle = { ...listing.vehicle, installedParts: [...listing.vehicle.installedParts],
    tuning: { purchasedPartIds: [...listing.vehicle.tuning.purchasedPartIds], installedBySlot: { ...listing.vehicle.tuning.installedBySlot } } };
  const market: MarketState = { ...state.market, listings: state.market.listings.filter((entry) => entry.id !== listingId),
    nextTransactionId: add(state.market.nextTransactionId, 1), purchasedCount: add(state.market.purchasedCount, 1),
    totalSpentYen: add(state.market.totalSpentYen, listing.askingPriceYen),
    lastTrade: { transactionId: state.market.nextTransactionId, kind: 'buy', vehicleId: vehicle.instanceId,
      vehicleName: vehicle.name, amountYen: listing.askingPriceYen } };
  return { ...state, cashYen: state.cashYen - listing.askingPriceYen, market,
    ownedVehicles: [...state.ownedVehicles, vehicle], activeVehicleId: state.activeVehicleId ?? vehicle.instanceId };
}

export function getSellRequirement(state: GameState, instanceId: string): string | null {
  const vehicle = state.ownedVehicles.find((car) => car.instanceId === instanceId);
  if (!vehicle) return 'This vehicle is no longer owned.';
  if (state.ownedVehicles.length <= 1) return 'Keep at least one car. Your last vehicle cannot be sold.';
  if (isVehicleBusy(state, instanceId)) return 'This car is assigned to a job or race. Settle or cancel it before selling.';
  if (!findVehicleDefinition(vehicle.catalogId)) return 'This historical model has no dealer valuation. Your car is kept.';
  if (!integer(state.cashYen)) return 'Cash value is invalid.';
  return null;
}
/** Captures the whole target, including stored parts/mileage, plus the active choice shown in the preview. */
export const getVehicleSaleKey = (vehicle: PlayerVehicle, activeVehicleId: string | null) => JSON.stringify([vehicle, activeVehicleId]);
export function sellMarketVehicle(state: GameState, instanceId: string, expectedKey: string, expectedOfferYen: number, replacementId: string | null): GameState {
  assertMarket(state);
  const reason = getSellRequirement(state, instanceId);
  if (reason) throw new Error(reason);
  const vehicle = state.ownedVehicles.find((car) => car.instanceId === instanceId)!;
  if (getVehicleSaleKey(vehicle, state.activeVehicleId) !== expectedKey) throw new Error('Your car or active selection changed. Review the sale again.');
  const valuation = getVehicleValuation(vehicle);
  if (valuation.offerYen !== expectedOfferYen) throw new Error('The dealer offer changed. Review the sale again.');
  const remaining = state.ownedVehicles.filter((car) => car.instanceId !== instanceId);
  const activeSale = instanceId === state.activeVehicleId;
  if (activeSale ? !replacementId || !remaining.some((car) => car.instanceId === replacementId) : replacementId !== null) {
    throw new Error('Choose a valid remaining active vehicle before selling your active car.');
  }
  const market: MarketState = { ...state.market, nextTransactionId: add(state.market.nextTransactionId, 1),
    soldCount: add(state.market.soldCount, 1), totalReceivedYen: add(state.market.totalReceivedYen, valuation.offerYen),
    lastTrade: { transactionId: state.market.nextTransactionId, kind: 'sell', vehicleId: vehicle.instanceId,
      vehicleName: vehicle.name, amountYen: valuation.offerYen } };
  return { ...state, cashYen: add(state.cashYen, valuation.offerYen), market, ownedVehicles: remaining,
    activeVehicleId: activeSale ? replacementId : state.activeVehicleId };
}
export function getRefreshRequirement(state: GameState, nowMs: number): string | null {
  if (state.selectedStarterId === null) return 'Choose your starter first.';
  if (!integer(nowMs) || nowMs > Number.MAX_SAFE_INTEGER - MARKET_REFRESH_MS) return 'Device clock is invalid.';
  if (state.market.generation >= MAX_MARKET_GENERATION) return 'Stock generation limit reached.';
  if (state.market.refreshedAtMs !== null && nowMs < state.market.refreshedAtMs) return 'Device clock moved backwards. Restore it before refreshing stock.';
  if (getRefreshRemainingMs(state.market, nowMs) > 0) return 'Stock refresh is not ready yet.';
  return null;
}
export function refreshMarket(state: GameState, expectedGeneration: number, nowMs: number): GameState {
  assertMarket(state);
  if (state.market.generation !== expectedGeneration) throw new Error('Stock changed. Review the current batch first.');
  const reason = getRefreshRequirement(state, nowMs);
  if (reason) throw new Error(reason);
  const generation = state.market.generation + 1;
  return { ...state, market: { ...state.market, generation, refreshedAtMs: nowMs,
    listings: createMarketListings(generation, state.ownedVehicles.map((car) => car.instanceId)) } };
}
