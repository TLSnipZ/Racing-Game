import { findVehicleDefinition, VEHICLE_CATALOG } from '../data/vehicles';
import { MARKET_REFRESH_MS, MAX_MARKET_GENERATION } from './marketStock';
import { isInteger, isPlayerVehicle, isRecord, isText } from './vehicleValidation';
import type { MarketState } from './marketTypes';

/** Bounded structural validation. Save codes are snapshots, not an anti-cheat boundary. */
export function isMarketState(value: unknown, ownedVehicles: readonly { instanceId: string }[]): value is MarketState {
  if (!isRecord(value) || value.stockVersion !== 1 || !isInteger(value.generation) || value.generation > MAX_MARKET_GENERATION
    || !isInteger(value.nextTransactionId, 1) || !isInteger(value.purchasedCount) || !isInteger(value.soldCount)
    || !isInteger(value.totalSpentYen) || !isInteger(value.totalReceivedYen)) return false;
  const totalTrades = value.purchasedCount + value.soldCount;
  if (!Number.isSafeInteger(totalTrades + 1) || value.nextTransactionId !== totalTrades + 1) return false;
  if (value.generation === 0 ? value.refreshedAtMs !== null
    : !isInteger(value.refreshedAtMs) || value.refreshedAtMs > Number.MAX_SAFE_INTEGER - MARKET_REFRESH_MS) return false;
  if ((value.purchasedCount === 0) !== (value.totalSpentYen === 0)
    || (value.soldCount === 0) !== (value.totalReceivedYen === 0)) return false;
  const last = value.lastTrade;
  if (totalTrades === 0 ? last !== null : !isRecord(last)) return false;
  if (isRecord(last)) {
    if (last.transactionId !== totalTrades || (last.kind !== 'buy' && last.kind !== 'sell')
      || !isText(last.vehicleId) || !isText(last.vehicleName) || !isInteger(last.amountYen, 1)) return false;
    if (last.kind === 'buy' ? value.purchasedCount === 0 || value.totalSpentYen < last.amountYen
      : value.soldCount === 0 || value.totalReceivedYen < last.amountYen) return false;
  }
  if (!Array.isArray(value.listings) || value.listings.length > VEHICLE_CATALOG.length) return false;
  const ids = new Set(ownedVehicles.map((vehicle) => vehicle.instanceId));
  const catalogs = new Set<string>();
  for (const listing of value.listings) {
    if (!isRecord(listing) || !isText(listing.id) || !isText(listing.seller)
      || !isInteger(listing.askingPriceYen, 1) || listing.askingPriceYen > 1_000_000_000
      || !isInteger(listing.minLevel, 1) || listing.minLevel > 20 || !isPlayerVehicle(listing.vehicle)) return false;
    const vehicle = listing.vehicle;
    const definition = findVehicleDefinition(vehicle.catalogId);
    if (!definition || vehicle.instanceId !== listing.id || ids.has(listing.id) || catalogs.has(vehicle.catalogId)
      || vehicle.name !== definition.name || vehicle.engine !== definition.engine || vehicle.drive !== definition.drive
      || vehicle.hp !== definition.hp || vehicle.weightKg !== definition.weightKg
      || vehicle.year < definition.years[0] || vehicle.year > definition.years[1]
      || vehicle.tuning.purchasedPartIds.length !== 0 || Object.keys(vehicle.tuning.installedBySlot).length !== 0
      || JSON.stringify(vehicle.installedParts) !== JSON.stringify(definition.stockParts)) return false;
    ids.add(listing.id); catalogs.add(vehicle.catalogId);
  }
  return true;
}
