import type { PlayerVehicle } from './types';
export type SpecialistKind = 'import' | 'auction' | 'survey';
export type SpecialistView = 'imports' | 'auctions' | 'barns';
export type RestorationService = 'engine' | 'body' | 'transmission' | 'full';
export type SpecialistContract = {
  version: 1; runId: number; offerId: string; kind: SpecialistKind;
  startedAtMs: number; finishesAtMs: number; paidYen: number;
  /** Refundable escrow only; the survey fee is explicitly non-refundable. */
  escrowYen: number; vehicle: PlayerVehicle | null;
};
export type SpecialistReceiptKind = 'ordered' | 'bid' | 'survey' | 'delivered' | 'won' | 'lost' | 'discovered' | 'cancelled' | 'recovered' | 'restored';
export type SpecialistReceipt = {
  actionId: number; kind: SpecialistReceiptKind; offerId: string | null;
  vehicleId: string | null; chargedYen: number; refundedYen: number;
};
export type AdvancedState = {
  version: 1; nextActionId: number; activeContract: SpecialistContract | null;
  surveyedBarnIds: string[]; acquiredOfferIds: string[];
  totalPaidYen: number; totalRefundedYen: number;
  restorationCount: number; restorationSpentYen: number;
  lastReceipt: SpecialistReceipt | null;
};
