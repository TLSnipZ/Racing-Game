import { findVehicleDefinition } from '../data/vehicles';
import type { AdvancedOffer } from '../data/advancedCars';
import type { SpecialistContract } from './advancedTypes';
import type { PlayerVehicle } from './types';
export const MAX_PROXY_BID_YEN = 1_000_000;
export function createSpecialistVehicle(offer: AdvancedOffer, instanceId: string): PlayerVehicle {
  const model = findVehicleDefinition(offer.catalogId);
  if (!model) throw new Error('Unknown specialist model.');
  return { instanceId, catalogId: model.id, name: model.name, year: offer.year, engine: model.engine, drive: model.drive,
    hp: model.hp, weightKg: model.weightKg, odometerKm: offer.odometerKm,
    engineCondition: offer.condition[0], bodyCondition: offer.condition[1], transmissionCondition: offer.condition[2],
    originality: offer.originality, installedParts: [...model.stockParts], tuning: { purchasedPartIds: [], installedBySlot: {} } };
}
export const isSpecialistReady = (contract: SpecialistContract | null, now: number) => !!contract
  && Number.isSafeInteger(now) && now >= contract.startedAtMs && now >= contract.finishesAtMs;
export const isValidProxyBid = (offer: AdvancedOffer, bid: number) => Number.isSafeInteger(bid)
  && bid >= offer.minimumBidYen && bid <= MAX_PROXY_BID_YEN && bid % offer.bidStepYen === 0;
