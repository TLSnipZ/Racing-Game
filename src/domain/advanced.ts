import { findAdvancedOffer, getAuctionClearingPrice, type AdvancedOffer } from '../data/advancedCars';
import { withCollectionProgress } from './collectionProgress';
import { createSpecialistVehicle, isSpecialistReady, isValidProxyBid } from './advancedRules';
import { isAdvancedLinked, isAdvancedState } from './advancedValidation';
import { getOccupiedGarageSpaces, getReservedVehicleIds } from './garageCapacity';
import { GARAGE_CAPACITY } from './marketStock';
import type { SpecialistReceipt, SpecialistContract } from './advancedTypes';
import type { GameState } from './types';

export function safeAdvancedAdd(a: number, b: number): number {
  if (!Number.isSafeInteger(a) || a < 0 || !Number.isSafeInteger(b) || b < 0 || !Number.isSafeInteger(a + b)) throw new Error('Amount exceeds the safe range. Spend some cash before claiming a refund.');
  return a + b;
}
function check(state: GameState) {
  if (!Number.isSafeInteger(state.cashYen) || state.cashYen < 0) throw new Error('Cash value is invalid.');
  if (!isAdvancedState(state.advanced) || !isAdvancedLinked(state.advanced, state)) throw new Error('Specialist data is invalid.');
  if (state.selectedStarterId === null) throw new Error('Choose your starter first.');
}
function clock(now: number) { if (!Number.isSafeInteger(now) || now < 0) throw new Error('Device clock is invalid.'); }
export function recordSpecialistAction(state: GameState, receipt: Omit<SpecialistReceipt, 'actionId'>): GameState {
  const a = state.advanced;
  return { ...state, advanced: { ...a, nextActionId: safeAdvancedAdd(a.nextActionId, 1),
    totalPaidYen: safeAdvancedAdd(a.totalPaidYen, receipt.chargedYen), totalRefundedYen: safeAdvancedAdd(a.totalRefundedYen, receipt.refundedYen),
    lastReceipt: { ...receipt, actionId: a.nextActionId } } };
}
export function createIncomingVehicle(state: GameState, offer: AdvancedOffer) {
  const taken = new Set([...state.ownedVehicles.map((v) => v.instanceId), ...state.market.listings.map((l) => l.vehicle.instanceId), ...getReservedVehicleIds(state)]);
  const stem = `specialist-v1:${offer.id}`;
  let id = stem;
  for (let i = 1; taken.has(id); i++) id = `${stem}:${i}`;
  return createSpecialistVehicle(offer, id);
}
export const getSpecialistQuoteKey = (state: GameState, offer: AdvancedOffer) => JSON.stringify([state.advanced.nextActionId, offer, createIncomingVehicle(state, offer)]);
export function getSpecialistRequirement(state: GameState, offer: AdvancedOffer, bidYen: number = 0): string | null {
  if (state.selectedStarterId === null) return 'Choose your starter first.';
  if (state.playerLevel < offer.minLevel) return `Requires Level ${offer.minLevel}.`;
  if (state.advanced.acquiredOfferIds.includes(offer.id)) return 'This one-time source has already been acquired. Selling its car does not renew it.';
  if (state.advanced.activeContract) return 'Finish or cancel your existing specialist contract first. Auction bids cannot be cancelled.';
  if (offer.kind === 'survey' && state.advanced.surveyedBarnIds.includes(offer.id)) return 'The survey is complete. Review the recovered car instead.';
  if (offer.kind !== 'survey' && getOccupiedGarageSpaces(state) >= GARAGE_CAPACITY) return 'Garage full: make space before reserving an incoming car.';
  if (offer.kind === 'auction' && !isValidProxyBid(offer, bidYen)) return `Bid in ¥${offer.bidStepYen.toLocaleString('en-US')} steps, from ¥${offer.minimumBidYen.toLocaleString('en-US')} to ¥1,000,000.`;
  const cost = offer.kind === 'import' ? offer.priceYen + offer.transportYen : offer.kind === 'auction' ? bidYen : offer.surveyYen;
  if (!Number.isSafeInteger(state.cashYen) || state.cashYen < cost) return 'Not enough valid cash.';
  return null;
}
export const startSpecialistContract = withCollectionProgress(function (state: GameState, offerId: string, expectedKey: string, now: number, bidYen: number = 0): GameState {
  check(state); clock(now);
  const offer = findAdvancedOffer(offerId);
  if (!offer) throw new Error('Unknown specialist offer.');
  if (getSpecialistQuoteKey(state, offer) !== expectedKey) throw new Error('Specialist quote changed. Review the offer again.');
  const reason = getSpecialistRequirement(state, offer, bidYen);
  if (reason) throw new Error(reason);
  const paidYen = offer.kind === 'import' ? offer.priceYen + offer.transportYen : offer.kind === 'auction' ? bidYen : offer.surveyYen;
  const vehicle = offer.kind === 'survey' ? null : createIncomingVehicle(state, offer);
  const activeContract: SpecialistContract = { version: 1, runId: state.advanced.nextActionId, offerId,
    kind: offer.kind, startedAtMs: now, finishesAtMs: safeAdvancedAdd(now, offer.durationMs),
    paidYen, escrowYen: offer.kind === 'survey' ? 0 : paidYen, vehicle };
  return recordSpecialistAction({ ...state, cashYen: state.cashYen - paidYen, advanced: { ...state.advanced, activeContract } },
    { kind: offer.kind === 'import' ? 'ordered' : offer.kind === 'auction' ? 'bid' : 'survey', offerId,
      vehicleId: vehicle?.instanceId ?? null, chargedYen: paidYen, refundedYen: 0 });
});
export const raiseProxyBid = withCollectionProgress(function (state: GameState, runId: number, expectedBid: number, bidYen: number, now: number): GameState {
  check(state); clock(now);
  const c = state.advanced.activeContract;
  if (!c || c.runId !== runId || c.kind !== 'auction' || c.escrowYen !== expectedBid) throw new Error('This auction or bid changed.');
  if (now < c.startedAtMs || now >= c.finishesAtMs) throw new Error('Bidding is closed or the clock moved backwards.');
  const offer = findAdvancedOffer(c.offerId)!;
  if (!isValidProxyBid(offer, bidYen) || bidYen <= c.escrowYen) throw new Error('Raise your maximum by at least one valid bid step.');
  const extra = bidYen - c.escrowYen;
  if (state.cashYen < extra) throw new Error('Not enough cash for the extra escrow.');
  return recordSpecialistAction({ ...state, cashYen: state.cashYen - extra,
    advanced: { ...state.advanced, activeContract: { ...c, paidYen: bidYen, escrowYen: bidYen } } },
    { kind: 'bid', offerId: offer.id, vehicleId: c.vehicle!.instanceId, chargedYen: extra, refundedYen: 0 });
});
export const finishSpecialistContract = withCollectionProgress(function (state: GameState, runId: number, now: number): GameState {
  check(state); clock(now);
  const c = state.advanced.activeContract;
  if (!c || c.runId !== runId) throw new Error('This specialist contract is no longer active.');
  if (!isSpecialistReady(c, now)) throw new Error('This specialist contract is not ready. Check the device clock.');
  const offer = findAdvancedOffer(c.offerId)!;
  const won = c.kind === 'auction' && c.escrowYen >= getAuctionClearingPrice(offer);
  const delivered = c.kind === 'import' || won;
  const refund = c.kind === 'auction' ? c.escrowYen - (won ? getAuctionClearingPrice(offer) : 0) : 0;
  const car = delivered ? c.vehicle! : null;
  if (car && (state.ownedVehicles.some((v) => v.instanceId === car.instanceId) || state.ownedVehicles.length >= 1000)) throw new Error('The incoming vehicle identity or safety capacity changed. Your paid contract is kept.');
  return recordSpecialistAction({ ...state, cashYen: safeAdvancedAdd(state.cashYen, refund),
    ownedVehicles: car ? [...state.ownedVehicles, structuredClone(car)] : state.ownedVehicles,
    activeVehicleId: state.activeVehicleId ?? car?.instanceId ?? null,
    advanced: { ...state.advanced, activeContract: null,
      acquiredOfferIds: delivered ? [...state.advanced.acquiredOfferIds, offer.id] : state.advanced.acquiredOfferIds,
      surveyedBarnIds: c.kind === 'survey' ? [...state.advanced.surveyedBarnIds, offer.id] : state.advanced.surveyedBarnIds } },
    { kind: c.kind === 'survey' ? 'discovered' : c.kind === 'import' ? 'delivered' : won ? 'won' : 'lost',
      offerId: offer.id, vehicleId: car?.instanceId ?? null, chargedYen: 0, refundedYen: refund });
});
/** Survey cancellation forfeits its quoted fee; an import refund is complete. Auction bids are binding. */
export const cancelSpecialistContract = withCollectionProgress(function (state: GameState, runId: number): GameState {
  check(state);
  const c = state.advanced.activeContract;
  if (!c || c.runId !== runId) throw new Error('This specialist contract is no longer active.');
  if (c.kind === 'auction') throw new Error('Auction bids are binding. Settle after the countdown to receive the car or your refund.');
  return recordSpecialistAction({ ...state, cashYen: safeAdvancedAdd(state.cashYen, c.escrowYen), advanced: { ...state.advanced, activeContract: null } },
    { kind: 'cancelled', offerId: c.offerId, vehicleId: null, chargedYen: 0, refundedYen: c.escrowYen });
});
export function getBarnBuyRequirement(state: GameState, offer: AdvancedOffer): string | null {
  if (state.selectedStarterId === null) return 'Choose your starter first.';
  if (offer.kind !== 'survey' || !state.advanced.surveyedBarnIds.includes(offer.id)) return 'Complete the survey first.';
  if (state.advanced.acquiredOfferIds.includes(offer.id)) return 'This project has already been recovered. Sale does not renew it.';
  if (state.playerLevel < offer.minLevel) return `Requires Level ${offer.minLevel}.`;
  if (getOccupiedGarageSpaces(state) >= GARAGE_CAPACITY) return 'Garage full, including reserved deliveries. Sell a spare first.';
  if (!Number.isSafeInteger(state.cashYen) || state.cashYen < offer.priceYen) return 'Not enough valid cash.';
  return null;
}
export const buyBarnVehicle = withCollectionProgress(function (state: GameState, id: string, expectedKey: string): GameState {
  check(state);
  const offer = findAdvancedOffer(id);
  if (!offer || getSpecialistQuoteKey(state, offer) !== expectedKey) throw new Error('The recovery quote changed. Review it again.');
  const reason = getBarnBuyRequirement(state, offer);
  if (reason) throw new Error(reason);
  const car = createIncomingVehicle(state, offer);
  return recordSpecialistAction({ ...state, cashYen: state.cashYen - offer.priceYen,
    ownedVehicles: [...state.ownedVehicles, car], activeVehicleId: state.activeVehicleId ?? car.instanceId,
    advanced: { ...state.advanced, acquiredOfferIds: [...state.advanced.acquiredOfferIds, id] } },
    { kind: 'recovered', offerId: id, vehicleId: car.instanceId, chargedYen: offer.priceYen, refundedYen: 0 });
});
