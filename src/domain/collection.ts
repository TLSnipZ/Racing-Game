import { findAchievement } from '../data/achievements';
import { findIconOffer, type IconOffer } from '../data/collection';
import { findVehicleDefinition } from '../data/vehicles';
import { getAchievementProgress, recordCollectionProgress, withCollectionProgress } from './collectionProgress';
import { GARAGE_CAPACITY } from './marketStock';
import { createVehicleTuning } from './tuning';
import type { GameState, PlayerVehicle } from './types';

export const claimAchievement = withCollectionProgress(function claimAchievement(state: GameState, id: string): GameState {
  const item = findAchievement(id);
  if (!item) throw new Error('Unknown achievement.');
  if (state.selectedStarterId === null) throw new Error('Choose your starter first.');
  const progress = getAchievementProgress(state, item);
  if (progress.claimed) throw new Error('This reward has already been claimed.');
  if (!progress.unlocked) throw new Error('This achievement is not earned yet.');
  if (!Number.isSafeInteger(state.cashYen) || state.cashYen < 0 || !Number.isSafeInteger(state.cashYen + item.rewardYen)) throw new Error('Reward exceeds the safe cash range.');
  return { ...state, cashYen: state.cashYen + item.rewardYen,
    collection: { ...state.collection, claimedAchievementIds: [...state.collection.claimedAchievementIds, id] } };
});
export function getIconRequirement(state: GameState, offer: IconOffer): string | null {
  if (state.selectedStarterId === null) return 'Choose your starter first.';
  if (state.collection.purchasedIconIds.includes(offer.id)) return 'This one-time offer has already been purchased, even if its car was sold.';
  if (state.playerLevel < offer.minLevel) return `Requires Level ${offer.minLevel}.`;
  const achievement = findAchievement(offer.achievementId)!;
  if (!getAchievementProgress(state, achievement).unlocked) return `Earn “${achievement.name}” first. Claiming its yen is optional.`;
  if (state.ownedVehicles.length >= GARAGE_CAPACITY) return `Garage full: ${GARAGE_CAPACITY} spaces. Sell a spare car first.`;
  if (!Number.isSafeInteger(state.cashYen) || state.cashYen < 0) return 'Cash value is invalid.';
  if (state.cashYen < offer.priceYen) return 'Not enough cash.';
  return null;
}
/** A fixed fully specified car, never a rerolled dealer listing. */
export function createIconVehicle(state: GameState, offer: IconOffer): PlayerVehicle {
  const model = findVehicleDefinition(offer.catalogId)!;
  const taken = new Set([...state.ownedVehicles.map((car) => car.instanceId), ...state.market.listings.map((listing) => listing.id)]);
  const stem = `icon-v1:${offer.id}`;
  let instanceId = stem;
  for (let index = 1; taken.has(instanceId); index++) instanceId = `${stem}:${index}`;
  return { instanceId, catalogId: model.id, name: model.name, year: offer.year, engine: model.engine, drive: model.drive,
    hp: model.hp, weightKg: model.weightKg, odometerKm: offer.odometerKm, engineCondition: offer.condition,
    bodyCondition: offer.condition, transmissionCondition: offer.condition, originality: 100,
    installedParts: [...model.stockParts], tuning: createVehicleTuning() };
}
export const purchaseIcon = withCollectionProgress(function purchaseIcon(state: GameState, id: string, expectedPrice: number): GameState {
  const offer = findIconOffer(id);
  if (!offer) throw new Error('Unknown Icon offer.');
  if (offer.priceYen !== expectedPrice) throw new Error('The Icon offer changed. Reopen its preview.');
  const reason = getIconRequirement(state, offer);
  if (reason) throw new Error(reason);
  const car = createIconVehicle(state, offer);
  // Observe acquisition before recording the purchase, so the claimed-offer invariants remain valid.
  const collected = recordCollectionProgress({ ...state, cashYen: state.cashYen - offer.priceYen,
    ownedVehicles: [...state.ownedVehicles, car], activeVehicleId: state.activeVehicleId ?? car.instanceId });
  return { ...collected, collection: { ...collected.collection, purchasedIconIds: [...collected.collection.purchasedIconIds, id] } };
});
