import { BUSINESS_STORAGE_MS, businessPayout, businessStorageCap, findBusiness } from '../data/businesses';
import type { BusinessState, EmpireState } from './empireTypes';

export const isEmpireTime = (now: number) => Number.isSafeInteger(now) && now >= 0 && now <= Number.MAX_SAFE_INTEGER - BUSINESS_STORAGE_MS;
/** Lazy, read-only production. Reloading/other commands never reset these anchors or award cash. */
export function getBusinessProduction(business: BusinessState, now: number) {
  const item = findBusiness(business.id);
  if (!item) throw new Error('Unknown business.');
  const payout = businessPayout(item, business.level);
  const capacityYen = businessStorageCap(item, business.level, business.managerHired);
  const started = business.startedAtMs;
  const clockError = started !== null && (!isEmpireTime(now) || now < started);
  const elapsed = started === null || clockError ? 0 : now - started;
  // Bound arithmetic by the storage limit, not by arbitrary offline gaps. No per-cycle loops.
  const batches = Math.min(Math.floor(elapsed / item.cycleMs), business.managerHired ? BUSINESS_STORAGE_MS / item.cycleMs : 1);
  const amountYen = Math.min(capacityYen, business.bankedYen + batches * payout);
  const full = amountYen >= capacityYen;
  const running = started !== null;
  const progressMs = running && !clockError && !full ? elapsed % item.cycleMs : 0;
  return { amountYen, capacityYen, full, clockError, running,
    percent: full ? 100 : progressMs / item.cycleMs * 100,
    remainingMs: !running || full || clockError ? 0 : item.cycleMs - progressMs,
    // While not full, preserve the partly finished next batch on every collection.
    nextAnchorMs: started === null || clockError ? started : full ? now : now - progressMs };
}
export function getEmpireProduction(empire: EmpireState, now: number) {
  const rows = empire.businesses.map((business) => ({ business, production: getBusinessProduction(business, now) }));
  return { rows, totalYen: rows.reduce((sum, row) => sum + row.production.amountYen, 0),
    clockError: rows.some((row) => row.production.clockError),
    fullCount: rows.filter((row) => row.production.full).length,
    managedCount: rows.filter((row) => row.business.managerHired).length };
}
