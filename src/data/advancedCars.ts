import type { SpecialistKind } from '../domain/advancedTypes';

export type AdvancedOffer = {
  readonly id: string; readonly kind: SpecialistKind; readonly name: string;
  readonly catalogId: string; readonly minLevel: number; readonly durationMs: number;
  readonly priceYen: number; readonly transportYen: number; readonly surveyYen: number;
  readonly minimumBidYen: number; readonly rivalBidYen: number; readonly bidStepYen: number;
  readonly year: number; readonly odometerKm: number;
  readonly condition: readonly [number, number, number]; readonly originality: number;
  readonly description: string;
};
/** Version 1 fixed contracts. Keep these terms stable for accepted snapshots. No wall-clock stock RNG. */
export const ADVANCED_OFFERS: readonly AdvancedOffer[] = [
  { id: 'sora-import', kind: 'import', name: 'Bayline Import Desk', catalogId: 'sora-s', minLevel: 5, durationMs: 90000,
    priceYen: 165000, transportYen: 15000, surveyYen: 0, minimumBidYen: 0, rivalBidYen: 0, bidStepYen: 0,
    year: 1994, odometerKm: 45000, condition: [92, 90, 91], originality: 99,
    description: 'A lightweight roadster sourced by a specialist broker. The invoice includes transport; no surprise bill on arrival.' },
  { id: 'crest-auction', kind: 'auction', name: 'East Ward Proxy Auction', catalogId: 'crest-rs', minLevel: 6, durationMs: 60000,
    priceYen: 0, transportYen: 0, surveyYen: 0, minimumBidYen: 190000, rivalBidYen: 220000, bidStepYen: 5000,
    year: 1998, odometerKm: 91000, condition: [85, 80, 84], originality: 94,
    description: 'A single-player proxy auction with a disclosed rival ceiling. Your maximum is reserved now; a win costs only the clearing price.' },
  { id: 'orchard-barn', kind: 'survey', name: 'Old Orchard Lead', catalogId: 'hachi-gt', minLevel: 5, durationMs: 45000,
    priceYen: 55000, transportYen: 0, surveyYen: 5000, minimumBidYen: 0, rivalBidYen: 0, bidStepYen: 0,
    year: 1974, odometerKm: 246000, condition: [35, 28, 32], originality: 86,
    description: 'A surveyor follows a documented lead outside Kagehama. Pay for the inspection first, then choose whether to buy and recover the known project car.' },
];
export const findAdvancedOffer = (id: string) => ADVANCED_OFFERS.find((offer) => offer.id === id);
export const getAuctionClearingPrice = (offer: AdvancedOffer) => Math.max(offer.minimumBidYen, offer.rivalBidYen + offer.bidStepYen);
export const RESTORATION_SERVICES = [
  { id: 'engine', name: 'Engine rebuild', field: 'engineCondition', rateBps: 60 },
  { id: 'body', name: 'Body restoration', field: 'bodyCondition', rateBps: 40 },
  { id: 'transmission', name: 'Transmission rebuild', field: 'transmissionCondition', rateBps: 50 },
] as const;
