import type { AdvancedState } from './advancedTypes';
export function createAdvancedState(): AdvancedState {
  return { version: 1, nextActionId: 1, activeContract: null, surveyedBarnIds: [], acquiredOfferIds: [],
    totalPaidYen: 0, totalRefundedYen: 0, restorationCount: 0, restorationSpentYen: 0, lastReceipt: null };
}
