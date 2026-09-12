import type { RaceHeatContract } from './heatTypes';
import type { RaceEvent, RacePrize } from './racingTypes';
export const HEAT_CAP = 100;
export const UNDERGROUND_MIN_LEVEL = 3;
export const UNDERGROUND_ENTRY_LIMIT = 85;
export const LAY_LOW_MS = 60_000;
export const LAY_LOW_REDUCTION = 40;
export const FINE_REDUCTION = 30;
export const LEGAL_JOB_REDUCTION = 6;
/** Version-1 terms are frozen. Use a new rules version for future changes to accepted terms. */
export const UNDERGROUND_HEAT_V1: Readonly<Record<string, number>> = {
  'dockyard-402': 12, 'hakuro-intro': 14, 'eastline-entry': 18,
  'ward-club': 16, 'dockyard-club': 16, 'hakuro-club': 18, 'eastline-club': 22,
};
export function heatStatus(value: number): 'CLEAR' | 'NOTICED' | 'WATCHED' | 'CRACKDOWN' {
  return value >= 75 ? 'CRACKDOWN' : value >= 50 ? 'WATCHED' : value >= 25 ? 'NOTICED' : 'CLEAR';
}
export function policeFineForHeat(value: number): number { return value >= 75 ? 3000 : value >= 50 ? 1500 : 0; }
export function boostedPrize(prize: RacePrize): RacePrize {
  return { yen: Math.floor(prize.yen * 3 / 2), reputation: Math.floor(prize.reputation * 5 / 4) };
}
export function createRaceHeatContract(event: RaceEvent, value: number): RaceHeatContract {
  const gain = Object.hasOwn(UNDERGROUND_HEAT_V1, event.id) ? UNDERGROUND_HEAT_V1[event.id] : undefined;
  if (!gain || !Number.isSafeInteger(value) || value < 0 || value >= UNDERGROUND_ENTRY_LIMIT) throw new Error('Underground terms are unavailable.');
  const after = Math.min(HEAT_CAP, value + gain);
  return { rulesVersion: 1, heatBefore: value, heatGain: gain, heatAfter: after,
    policeFineYen: policeFineForHeat(after), basePrizes: event.prizes.map((prize) => ({ ...prize })) };
}
