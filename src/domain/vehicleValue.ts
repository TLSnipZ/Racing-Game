import { findVehicleModel } from '../data/vehicles';
import { findPart } from '../data/parts';
import { getVehicleBuildStats } from './tuning';
import type { PlayerVehicle } from './types';
const safe = (n: number) => { if (!Number.isSafeInteger(n) || n < 0) throw new Error('Vehicle value is outside its safe range.'); return n; };
const ratio = (value: number, bps: number): number => Number(BigInt(safe(value)) * BigInt(safe(bps)) / 10000n);
const roundHundred = (n: number) => Math.floor(n / 100) * 100;

/** Provisional dealer valuation, not real-world car pricing. No clock or random demand enters a sell quote. */
export function getVehicleValuation(car: PlayerVehicle) {
  const model = findVehicleModel(car.catalogId);
  if (!model) return null;
  const build = getVehicleBuildStats(car);
  const condition = Math.round((car.engineCondition + car.bodyCondition + car.transmissionCondition) / 3);
  const conditionBps = 3500 + condition * 65;
  const mileageBps = 10000 - Math.min(3500, Math.floor(car.odometerKm / 10000) * 100);
  const originalityBps = 9000 + Math.round(build.originality * 10);
  const ageBps = 10000 - Math.min(1500, Math.max(0, model.yearTo - car.year) * 150);
  let referenceYen = ratio(model.baseValueYen, conditionBps);
  referenceYen = ratio(referenceYen, mileageBps);
  referenceYen = ratio(referenceYen, originalityBps);
  referenceYen = ratio(referenceYen, ageBps);
  const partCostYen = car.tuning.purchasedPartIds.reduce((sum, id) => safe(sum + (findPart(id)?.priceYen ?? 0)), 0);
  const partsCreditYen = ratio(partCostYen, 2000);
  // All purchased parts, including stored replacements, leave with the car and receive 20% credit.
  const offerYen = Math.max(100, roundHundred(safe(ratio(referenceYen, 6500) + partsCreditYen)));
  return { referenceYen, offerYen, partsCreditYen, condition, conditionBps, mileageBps, originalityBps, ageBps };
}
export function calculateAskingPrice(car: PlayerVehicle, demandBps: number): number {
  const value = getVehicleValuation(car);
  if (!value) throw new Error('Unknown vehicle model.');
  return Math.max(100, roundHundred(ratio(value.referenceYen, demandBps)));
}
