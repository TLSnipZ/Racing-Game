import { BUSINESSES, BUSINESS_LEVEL_CAP, GARAGE_EXPANSIONS, businessStorageCap, findBusiness } from '../data/businesses';
import { isInteger, isRecord } from './vehicleValidation';
import { isEmpireTime } from './empireProduction';
import type { EmpireState } from './empireTypes';

export function isEmpireState(value: unknown): value is EmpireState {
  if (!isRecord(value) || value.version !== 1 || !isInteger(value.revision)
    || !isInteger(value.garageExpansionLevel) || value.garageExpansionLevel > GARAGE_EXPANSIONS.length
    || !isInteger(value.totalSpentYen) || !isInteger(value.totalCollectedYen)
    || !Array.isArray(value.businesses) || value.businesses.length > BUSINESSES.length) return false;
  const expansionLevel = value.garageExpansionLevel;
  const seen = new Set<string>();
  let spending = GARAGE_EXPANSIONS.filter((e) => e.level <= expansionLevel).reduce((sum, e) => sum + e.priceYen, 0);
  let minimumActions = value.garageExpansionLevel;
  for (const b of value.businesses) {
    if (!isRecord(b) || typeof b.id !== 'string' || seen.has(b.id) || !isInteger(b.level, 1)
      || b.level > BUSINESS_LEVEL_CAP || typeof b.managerHired !== 'boolean' || !isInteger(b.bankedYen)
      || !(b.startedAtMs === null || typeof b.startedAtMs === 'number' && isEmpireTime(b.startedAtMs))) return false;
    const item = findBusiness(b.id);
    if (!item || b.bankedYen % item.payoutYen !== 0 || b.bankedYen > businessStorageCap(item, b.level, b.managerHired)) return false;
    // An unmanaged completed batch is either awaiting collection or parked, never duplicated by a second dispatch.
    if (!b.managerHired && b.bankedYen > 0 && b.startedAtMs !== null) return false;
    seen.add(b.id);
    spending += item.priceYen * (1 + b.level * (b.level - 1) / 2) + (b.managerHired ? item.managerPriceYen : 0);
    minimumActions += b.level + (b.managerHired ? 1 : 0);
  }
  if (spending !== value.totalSpentYen || value.revision < minimumActions
    || value.businesses.length === 0 && value.totalCollectedYen !== 0) return false;
  if (value.revision === 0) return value.lastReceipt === null && value.businesses.length === 0
    && value.garageExpansionLevel === 0 && value.totalSpentYen === 0 && value.totalCollectedYen === 0;
  const receipt = value.lastReceipt;
  if (!isRecord(receipt) || receipt.revision !== value.revision || !isInteger(receipt.amountYen)
    || typeof receipt.atMs !== 'number' || !isEmpireTime(receipt.atMs)) return false;
  if (receipt.action === 'expand') {
    const expansion = GARAGE_EXPANSIONS.find((e) => e.level === value.garageExpansionLevel);
    return receipt.businessId === null && !!expansion && receipt.amountYen === expansion.priceYen;
  }
  if (receipt.action === 'collect-all') return receipt.businessId === null && receipt.amountYen > 0 && receipt.amountYen <= value.totalCollectedYen;
  if (typeof receipt.businessId !== 'string' || !seen.has(receipt.businessId)) return false;
  const b = value.businesses.find((item) => item.id === receipt.businessId)!;
  const item = findBusiness(receipt.businessId)!;
  switch (receipt.action) {
    case 'buy': return b.level === 1 && receipt.amountYen === item.priceYen;
    case 'manager': return b.managerHired && receipt.amountYen === item.managerPriceYen;
    case 'upgrade': return b.level > 1 && receipt.amountYen === item.priceYen * (b.level - 1);
    case 'start': return b.startedAtMs === receipt.atMs && receipt.amountYen === 0;
    case 'pause': return b.startedAtMs === null && receipt.amountYen === 0;
    case 'collect': return receipt.amountYen > 0 && receipt.amountYen <= value.totalCollectedYen && b.bankedYen === 0;
    default: return false;
  }
}
