import { ACHIEVEMENTS, type AchievementDefinition } from '../data/achievements';
import { ICON_OFFERS } from '../data/collection';
import { STARTER_CARS } from '../data/starters';
import { findVehicleDefinition, VEHICLE_CATALOG, USED_VEHICLE_CATALOG } from '../data/vehicles';
import { findRaceEvent } from '../data/races';
import type { CollectionState } from './collectionTypes';
import type { GameState, LegacyGameStateV7, LegacyGameStateV8 } from './types';

export function createEmptyCollectionState(): CollectionState {
  return { collectedModelIds: [], unlockedAchievementIds: [], claimedAchievementIds: [], purchasedIconIds: [] };
}
const unique = (ids: readonly string[]) => [...new Set(ids)];
const known = (id: string | null | undefined): id is string => typeof id === 'string' && !!findVehicleDefinition(id);
/** Only evidence of PLAYER ownership counts. Dealer stock and rival models are not collected. */
function provenModels(state: LegacyGameStateV7): string[] {
  return unique([...state.ownedVehicles.map((car) => car.catalogId), state.selectedStarterId,
    state.racing.lastResult?.race.entrants.find((entrant) => entrant.id === 'player')?.catalogId].filter(known));
}
export function getCollectedModelIds(state: LegacyGameStateV8): string[] {
  return unique([...state.collection.collectedModelIds, ...provenModels(state)]);
}
export function getAchievementValue(state: LegacyGameStateV8, achievement: AchievementDefinition): number {
  const models = getCollectedModelIds(state);
  switch (achievement.metric) {
    case 'starter': return state.selectedStarterId === null ? 0 : 1;
    case 'starter-trio': return STARTER_CARS.filter((car) => models.includes(car.id)).length;
    case 'original-six': return USED_VEHICLE_CATALOG.filter((car) => models.includes(car.id)).length;
    case 'garage-size': return state.ownedVehicles.length;
    case 'body-types': return new Set(models.map((id) => findVehicleDefinition(id)!.bodyType).filter((body) => ['hatchback', 'coupe', 'sedan', 'wagon'].includes(body))).size;
    case 'icons': return models.filter((id) => findVehicleDefinition(id)?.rarity === 'icon').length;
    case 'jobs': return state.economy.completedJobs;
    case 'parts': return state.ownedVehicles.reduce((count, car) => count + car.tuning.purchasedPartIds.length, 0);
    case 'fitted-slots': return state.ownedVehicles.reduce((count, car) => Math.max(count, Object.keys(car.tuning.installedBySlot).length), 0);
    case 'races': return state.racing.completedRaces;
    case 'podiums': return state.racing.podiums;
    case 'wins': return state.racing.wins;
    case 'disciplines': return new Set(state.racing.records.filter((record) => record.finishes > 0).map((record) => findRaceEvent(record.eventId)?.discipline).filter(Boolean)).size;
    case 'bought': return state.market.purchasedCount;
    case 'sold': return state.market.soldCount;
    case 'lay-low': return state.heat.lastResolution?.kind === 'lay-low' ? 1 : 0;
  }
}
export function getAchievementProgress(state: LegacyGameStateV8, item: AchievementDefinition) {
  const value = Math.min(item.target, Math.max(0, getAchievementValue(state, item)));
  const unlocked = state.collection.unlockedAchievementIds.includes(item.id) || value >= item.target;
  const claimed = state.collection.claimedAchievementIds.includes(item.id);
  return { value: unlocked ? item.target : value, target: item.target, unlocked, claimed,
    claimable: unlocked && !claimed, percent: unlocked ? 100 : value / item.target * 100 };
}
export const getClaimableAchievements = (state: LegacyGameStateV8) => ACHIEVEMENTS.filter((item) => getAchievementProgress(state, item).claimable);
export const getTotalCollectionRewards = (state: LegacyGameStateV8) => ACHIEVEMENTS.filter((item) => state.collection.claimedAchievementIds.includes(item.id)).reduce((sum, item) => sum + item.rewardYen, 0);

export function isCollectionState(value: unknown): value is CollectionState {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const v = value as Record<string, unknown>;
  const ids = (x: unknown, allowed: readonly string[]): x is string[] => Array.isArray(x) && x.length <= allowed.length
    && new Set(x).size === x.length && x.every((id) => typeof id === 'string' && allowed.includes(id));
  if (!ids(v.collectedModelIds, VEHICLE_CATALOG.map((car) => car.id))
    || !ids(v.unlockedAchievementIds, ACHIEVEMENTS.map((item) => item.id))
    || !ids(v.claimedAchievementIds, ACHIEVEMENTS.map((item) => item.id))
    || !ids(v.purchasedIconIds, ICON_OFFERS.map((offer) => offer.id))) return false;
  const earned = v.unlockedAchievementIds, models = v.collectedModelIds;
  return v.claimedAchievementIds.every((id) => earned.includes(id))
    && v.purchasedIconIds.every((id) => {
      const offer = ICON_OFFERS.find((item) => item.id === id)!;
      return models.includes(offer.catalogId) && earned.includes(offer.achievementId);
    });
}
/** Pure monotonic observation; this never pays a reward, awards XP, changes old records or calls a clock. */
export function recordCollectionProgress<T extends LegacyGameStateV8>(state: T): T {
  if (!isCollectionState(state.collection)) throw new Error('Collection data is invalid.');
  const collectedModelIds = getCollectedModelIds(state);
  const observed = { ...state, collection: { ...state.collection, collectedModelIds } };
  const unlockedAchievementIds = unique([...state.collection.unlockedAchievementIds,
    ...ACHIEVEMENTS.filter((item) => getAchievementValue(observed, item) >= item.target).map((item) => item.id)]);
  if (JSON.stringify(collectedModelIds) === JSON.stringify(state.collection.collectedModelIds)
    && JSON.stringify(unlockedAchievementIds) === JSON.stringify(state.collection.unlockedAchievementIds)) return state;
  return { ...observed, collection: { ...observed.collection, unlockedAchievementIds } };
}
/** Observe before destructive operations (sale/refit) and afterwards; thrown/unsaved commands grant nothing. */
export function withCollectionProgress<Args extends unknown[]>(command: (state: GameState, ...args: Args) => GameState) {
  return (state: GameState, ...args: Args): GameState => recordCollectionProgress(command(recordCollectionProgress(state), ...args));
}
/** Migration recognises only provable history; no guessed sold models, dates, rewards or Icon purchases. */
export function migrateCollection(state: LegacyGameStateV7): LegacyGameStateV8 {
  return recordCollectionProgress({ ...state, collection: createEmptyCollectionState() });
}
