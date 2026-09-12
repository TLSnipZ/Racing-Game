import { findPart } from '../data/parts';
import { findVehicleDefinition } from '../data/vehicles';
import { getVehicleBuildStats } from './tuning';
import type { PlayerVehicle } from './types';

/** Integer-yen valuation v1. No wall-clock inflation, horsepower revaluation or instant flipping profit. */
export function getVehicleValuation(vehicle: PlayerVehicle) {
  const model = findVehicleDefinition(vehicle.catalogId);
  if (!model) throw new Error('This historical model has no dealer valuation. Your car is kept.');
  const condition = (vehicle.engineCondition + vehicle.bodyCondition + vehicle.transmissionCondition) / 3;
  const conditionBps = 4000 + Math.round(condition * 60);
  const mileageBps = 10000 - Math.min(3500, Math.floor(vehicle.odometerKm / 100));
  const originalityBps = 9000 + Math.round(getVehicleBuildStats(vehicle).originality * 10);
  const yearBps = 10000 - Math.min(1200, Math.max(0, model.years[1] - vehicle.year) * 60);
  const scaled = BigInt(model.referenceYen) * BigInt(conditionBps) * BigInt(mileageBps) * BigInt(originalityBps) * BigInt(yearBps);
  const denominator = 10000n ** 4n;
  const fairYen = Math.max(100, Number((scaled + denominator * 50n) / (denominator * 100n)) * 100);
  const baseOfferYen = Math.floor(fairYen * 65 / 10000) * 100;
  const retailPartsYen = vehicle.tuning.purchasedPartIds.reduce((sum, id) => sum + (findPart(id)?.priceYen ?? 0), 0);
  const partsOfferYen = Math.floor(retailPartsYen / 5 / 100) * 100;
  const offerYen = Math.max(100, baseOfferYen + partsOfferYen);
  if (![fairYen, offerYen, retailPartsYen].every(Number.isSafeInteger)) throw new Error('Dealer value exceeds its safe range.');
  return { fairYen, baseOfferYen, partsOfferYen, offerYen, retailPartsYen,
    conditionBps, mileageBps, originalityBps, yearBps };
}
