import { ADVANCED_OFFERS, findAdvancedOffer } from '../data/advancedCars';
import { isInteger, isPlayerVehicle, isRecord, isText } from './vehicleValidation';
import { createSpecialistVehicle, isValidProxyBid } from './advancedRules';
import type { AdvancedState } from './advancedTypes';
import type { LegacyGameStateV8 } from './types';

const idSet = (v: unknown, allowed: readonly string[]): v is string[] => Array.isArray(v)
  && v.length <= allowed.length && new Set(v).size === v.length && v.every((id) => typeof id === 'string' && allowed.includes(id));
/** Rules v1 validates accepted quotes rather than silently repairing/refunding malformed current saves. */
export function isAdvancedState(value: unknown): value is AdvancedState {
  if (!isRecord(value) || value.version !== 1 || !isInteger(value.nextActionId, 1)
    || !idSet(value.surveyedBarnIds, ADVANCED_OFFERS.filter((o) => o.kind === 'survey').map((o) => o.id))
    || !idSet(value.acquiredOfferIds, ADVANCED_OFFERS.map((o) => o.id))
    || ![value.totalPaidYen, value.totalRefundedYen, value.restorationCount, value.restorationSpentYen].every((n) => isInteger(n))) return false;
  const paid = value.totalPaidYen as number, refunded = value.totalRefundedYen as number;
  if (refunded > paid || (value.restorationSpentYen as number) > paid - refunded
    || (value.restorationCount as number) >= value.nextActionId) return false;
  const surveyed = value.surveyedBarnIds;
  if (!value.acquiredOfferIds.every((id) => findAdvancedOffer(id)!.kind !== 'survey' || surveyed.includes(id))) return false;
  if (value.activeContract !== null) {
    const c = value.activeContract;
    if (!isRecord(c) || c.version !== 1 || !isInteger(c.runId, 1) || c.runId >= value.nextActionId
      || !isText(c.offerId) || !isInteger(c.startedAtMs) || !isInteger(c.finishesAtMs)
      || !isInteger(c.paidYen) || !isInteger(c.escrowYen)) return false;
    const offer = findAdvancedOffer(c.offerId);
    if (!offer || c.kind !== offer.kind || value.acquiredOfferIds.includes(offer.id)
      || c.finishesAtMs - c.startedAtMs !== offer.durationMs || c.escrowYen > paid - refunded) return false;
    if (offer.kind === 'survey') {
      if (c.vehicle !== null || c.escrowYen !== 0 || c.paidYen !== offer.surveyYen || value.surveyedBarnIds.includes(offer.id)) return false;
    } else {
      if (!isPlayerVehicle(c.vehicle) || c.paidYen !== c.escrowYen) return false;
      const vehicle = c.vehicle;
      const expected = createSpecialistVehicle(offer, vehicle.instanceId);
      // Explicit fields, not object-key order, distinguish an immutable stock delivery from a tuned forgery.
      if (!Object.entries(expected).every(([key, v]) => JSON.stringify(vehicle[key as keyof typeof expected]) === JSON.stringify(v))) return false;
      if (offer.kind === 'import' ? c.paidYen !== offer.priceYen + offer.transportYen : !isValidProxyBid(offer, c.paidYen)) return false;
    }
  }
  const r = value.lastReceipt;
  if (value.nextActionId === 1) return r === null && value.activeContract === null && paid === 0 && refunded === 0
    && value.restorationCount === 0 && value.restorationSpentYen === 0 && value.acquiredOfferIds.length === 0 && value.surveyedBarnIds.length === 0;
  if (!isRecord(r) || r.actionId !== value.nextActionId - 1 || !isInteger(r.chargedYen) || !isInteger(r.refundedYen)
    || r.chargedYen > paid || r.refundedYen > refunded || !(r.vehicleId === null || isText(r.vehicleId))) return false;
  if (r.kind === 'restored') return r.offerId === null && isText(r.vehicleId) && r.chargedYen > 0 && r.refundedYen === 0 && (value.restorationCount as number) > 0;
  if (!isText(r.offerId)) return false;
  const offer = findAdvancedOffer(r.offerId);
  if (!offer) return false;
  const allowed = offer.kind === 'import' ? ['ordered', 'delivered', 'cancelled'] : offer.kind === 'auction' ? ['bid', 'won', 'lost'] : ['survey', 'discovered', 'cancelled', 'recovered'];
  return typeof r.kind === 'string' && allowed.includes(r.kind);
}
export function isAdvancedLinked(a: AdvancedState, game: LegacyGameStateV8): boolean {
  if (game.selectedStarterId === null) return a.nextActionId === 1;
  const car = a.activeContract?.vehicle;
  if (car && (game.ownedVehicles.length >= 1000 || game.ownedVehicles.some((v) => v.instanceId === car.instanceId)
    || game.market.listings.some((l) => l.vehicle.instanceId === car.instanceId))) return false;
  return a.acquiredOfferIds.every((id) => game.collection.collectedModelIds.includes(findAdvancedOffer(id)!.catalogId));
}
