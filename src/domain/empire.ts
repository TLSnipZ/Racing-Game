import { BUSINESS_LEVEL_CAP, GARAGE_EXPANSIONS, businessUpgradeCost, findBusiness } from '../data/businesses';
import { getBusinessProduction, getEmpireProduction, isEmpireTime } from './empireProduction';
import { isEmpireState } from './empireValidation';
import type { BusinessState, EmpireAction, EmpireOrder } from './empireTypes';
import type { GameState } from './types';

const safe = (n: number) => Number.isSafeInteger(n) && n >= 0;
function add(a: number, b: number) {
  if (!safe(a) || !safe(b) || !Number.isSafeInteger(a + b)) throw new Error('Empire amount exceeds its safe range. Your uncollected earnings are kept.');
  return a + b;
}
export function getEmpireQuote(state: GameState, action: EmpireAction, businessId: string | null, now: number) {
  const empire = state.empire;
  const item = businessId === null ? undefined : findBusiness(businessId);
  const owned = empire.businesses.find((b) => b.id === businessId);
  const nextExpansion = GARAGE_EXPANSIONS.find((e) => e.level === empire.garageExpansionLevel + 1);
  let cost = 0, reason: string | null = null;
  if (state.selectedStarterId === null) reason = 'Choose your starter first.';
  else if (!isEmpireTime(now)) reason = 'Device clock is invalid. Restore it before changing your empire.';
  else if (action === 'expand') {
    if (businessId !== null) reason = 'Invalid garage expansion.';
    else if (!nextExpansion) reason = 'Garage expansion is already at its current maximum.';
    else { cost = nextExpansion.priceYen; if (state.playerLevel < nextExpansion.minLevel) reason = `Requires Level ${nextExpansion.minLevel}.`; }
  } else if (action === 'collect-all') {
    const output = getEmpireProduction(empire, now);
    if (businessId !== null) reason = 'Invalid collection request.';
    else if (output.clockError) reason = 'Device clock moved backwards. Restore it; your earnings are kept.';
    else if (output.totalYen === 0) reason = 'No completed batches to collect yet.';
  } else if (!item) reason = 'Unknown business.';
  else if (action === 'buy') {
    cost = item.priceYen;
    if (owned) reason = 'This business is already owned.';
    else if (state.playerLevel < item.minLevel) reason = `Requires Level ${item.minLevel}.`;
  } else if (!owned) reason = 'Buy this business first.';
  else {
    const output = getBusinessProduction(owned, now);
    if (output.clockError) reason = 'Device clock moved backwards. Restore it; your earnings are kept.';
    else switch (action) {
      case 'upgrade':
        cost = businessUpgradeCost(item, owned.level);
        if (owned.level >= BUSINESS_LEVEL_CAP) reason = 'Maximum business level reached.';
        else if (owned.startedAtMs !== null) reason = 'Pause this business before upgrading. Completed earnings stay in its till.';
        else if (state.playerLevel < item.minLevel + owned.level) reason = `Requires Level ${item.minLevel + owned.level}.`;
        break;
      case 'manager':
        cost = item.managerPriceYen;
        if (owned.managerHired) reason = 'This manager is already hired.';
        else if (owned.startedAtMs !== null) reason = 'Finish or pause your manual batch before hiring.';
        break;
      case 'start':
        if (owned.startedAtMs !== null) reason = 'This business is already running.';
        else if (output.full || !owned.managerHired && owned.bankedYen > 0) reason = 'Collect stored earnings before starting another batch.';
        break;
      case 'pause': if (owned.startedAtMs === null) reason = 'This business is already stopped.'; break;
      case 'collect': if (output.amountYen === 0) reason = 'No completed batches to collect yet.'; break;
      default: reason = 'Unknown business action.';
    }
  }
  if (!reason && (!safe(state.cashYen) || state.cashYen < cost)) reason = 'Not enough valid cash.';
  return { order: { action, businessId, revision: empire.revision, priceYen: cost } satisfies EmpireOrder, reason };
}
/** Commands never touch driver/broker activities or old race snapshots. No wall-clock side effects during load. */
export function performEmpireAction(state: GameState, order: EmpireOrder, now: number): GameState {
  if (!isEmpireState(state.empire)) throw new Error('Empire data is invalid.');
  if (order.revision !== state.empire.revision) throw new Error('Your empire changed. Review this action again.');
  const quoted = getEmpireQuote(state, order.action, order.businessId, now);
  if (quoted.reason) throw new Error(quoted.reason);
  if (order.priceYen !== quoted.order.priceYen) throw new Error('The price changed. Review this action again.');
  const item = order.businessId === null ? undefined : findBusiness(order.businessId);
  let businesses = state.empire.businesses;
  let amount = order.priceYen;
  let credited = 0;
  if (order.action === 'buy') businesses = [...businesses, { id: item!.id, level: 1, managerHired: false, startedAtMs: null, bankedYen: 0 }];
  else if (order.action !== 'expand') businesses = businesses.map((business): BusinessState => {
    if (order.action !== 'collect-all' && business.id !== order.businessId) return business;
    const output = getBusinessProduction(business, now);
    switch (order.action) {
      case 'collect': case 'collect-all':
        if (output.amountYen === 0) return business;
        credited = add(credited, output.amountYen);
        return { ...business, bankedYen: 0, startedAtMs: business.managerHired ? output.nextAnchorMs : null };
      case 'pause': return { ...business, bankedYen: output.amountYen, startedAtMs: null };
      case 'start': return { ...business, startedAtMs: now };
      case 'manager': return { ...business, managerHired: true, startedAtMs: now };
      case 'upgrade': return { ...business, level: business.level + 1 };
      default: throw new Error('Unknown business action.');
    }
  });
  const collecting = order.action === 'collect' || order.action === 'collect-all';
  if (collecting) amount = credited;
  const revision = add(state.empire.revision, 1);
  const result: GameState = { ...state, cashYen: add(state.cashYen - order.priceYen, credited),
    empire: { ...state.empire, businesses, revision,
      garageExpansionLevel: state.empire.garageExpansionLevel + (order.action === 'expand' ? 1 : 0),
      totalSpentYen: add(state.empire.totalSpentYen, order.priceYen), totalCollectedYen: add(state.empire.totalCollectedYen, credited),
      lastReceipt: { revision, action: order.action, businessId: order.businessId, amountYen: amount, atMs: now } } };
  if (!isEmpireState(result.empire)) throw new Error('This business transition is invalid. No changes applied.');
  return result;
}
