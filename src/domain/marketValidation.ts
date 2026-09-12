import { findVehicleModel } from '../data/vehicles';
import { MARKET_REFRESH_MS, MARKET_SIZE, MAX_MARKET_BATCH } from './marketStock';
import type { MarketState } from './marketTypes';
const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const int = (v: unknown, min = 0, max = Number.MAX_SAFE_INTEGER): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v >= min && v <= max;
const text = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0 && v.length <= 200;
/** Validate stored snapshots without regenerating prices/stock from possibly newer catalog balance. */
export function isMarketState(value: unknown): value is MarketState {
  if (!record(value) || value.stockVersion !== 1 || !int(value.batch, 1, MAX_MARKET_BATCH)
    || !int(value.nextRefreshAtMs) || !int(value.purchases) || !int(value.sales)
    || !int(value.totalSpentYen) || !int(value.totalReceivedYen) || !int(value.nextTradeId, 1)
    || !Number.isSafeInteger(value.purchases + value.sales) || value.purchases + value.sales !== value.nextTradeId - 1) return false;
  if (value.batch === 1) { if (value.refreshedAtMs !== null || value.nextRefreshAtMs !== 0) return false; }
  else if (!int(value.refreshedAtMs) || value.nextRefreshAtMs !== value.refreshedAtMs + MARKET_REFRESH_MS) return false;
  if (!Array.isArray(value.listings) || value.listings.length !== MARKET_SIZE) return false;
  const batch = value.batch;
  if (!value.listings.every((listing, index) => {
    if (!record(listing) || listing.id !== `market-${batch}-${index + 1}` || !record(listing.vehicle)
      || !int(listing.askYen, 100, 1000000000) || !int(listing.minLevel, 1, 100)
      || !int(listing.demandBps, 5000, 20000) || !text(listing.seller) || typeof listing.purchased !== 'boolean') return false;
    const v = listing.vehicle;
    if (!text(v.catalogId) || !findVehicleModel(v.catalogId) || v.instanceId !== listing.id
      || !text(v.name) || !text(v.engine) || !['FWD', 'RWD'].includes(v.drive as string)
      || !int(v.year, 1900, 2100) || !int(v.hp, 1, 1000000) || !int(v.weightKg, 250, 1000000) || !int(v.odometerKm)
      || !['engineCondition', 'bodyCondition', 'transmissionCondition', 'originality'].every((key) => int(v[key], 0, 100))
      || !Array.isArray(v.installedParts) || v.installedParts.length > 100 || !v.installedParts.every(text)
      || !record(v.tuning) || !Array.isArray(v.tuning.purchasedPartIds) || v.tuning.purchasedPartIds.length !== 0
      || !record(v.tuning.installedBySlot) || Object.keys(v.tuning.installedBySlot).length !== 0) return false;
    return true;
  })) return false;
  const boughtInBatch = value.listings.filter((listing) => (listing as { purchased: boolean }).purchased).length;
  if (boughtInBatch > value.purchases || (value.batch === 1 && boughtInBatch !== value.purchases)) return false;
  if ((value.purchases === 0 && value.totalSpentYen !== 0) || (value.sales === 0 && value.totalReceivedYen !== 0)) return false;
  const last = value.lastTrade;
  if (last === null) return value.nextTradeId === 1;
  return record(last) && int(last.id, 1) && last.id === value.nextTradeId - 1
    && (last.kind === 'buy' || last.kind === 'sell') && text(last.vehicleId) && text(last.vehicleName)
    && int(last.amountYen, 100) && (last.kind === 'buy'
      ? value.purchases > 0 && value.totalSpentYen >= last.amountYen
      : value.sales > 0 && value.totalReceivedYen >= last.amountYen);
}
