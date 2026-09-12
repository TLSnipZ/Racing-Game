import type { RaceHeatContract } from './heatTypes';
export const RACE_DISCIPLINES = ['sprint', 'drag', 'touge', 'expressway'] as const;
export type RaceDiscipline = typeof RACE_DISCIPLINES[number];
export const SECTOR_PROFILES = ['launch', 'technical', 'braking', 'flow', 'straight', 'highspeed'] as const;
export type SectorProfile = typeof SECTOR_PROFILES[number];
export type RaceSector = { name: string; profile: SectorProfile; baseTimeMs: number };
/** Bounded, copied performance inputs. No reference to a live vehicle or part catalog. */
export type RaceBuild = {
  powerPs: number; weightKg: number; grip: number; handling: number; braking: number;
  reliability: number; engineCondition: number; transmissionCondition: number;
};
export type RacePrize = { yen: number; reputation: number };
export type Rival = { name: string; vehicleName: string; catalogId: string; build: RaceBuild };
export type RaceEvent = {
  id: string; name: string; discipline: RaceDiscipline; tier: 'Rookie' | 'Club' | 'Boss';
  minLevel: number; entryFeeYen: number; playbackMs: number; distanceKm: number;
  description: string; focus: string; sectors: readonly RaceSector[]; prizes: readonly RacePrize[];
  rivals: readonly Rival[];
};
export type RaceEntrant = Rival & { id: string; sectorTimesMs: number[]; totalTimeMs: number };
/** Complete versioned simulation snapshot. Array order is starting-grid order; player starts fourth. */
export type ActiveRace = {
  heatRisk?: RaceHeatContract;
  modelVersion: 1; runId: number; eventId: string; eventName: string; discipline: RaceDiscipline;
  vehicleId: string; startedAtMs: number; finishesAtMs: number; countdownMs: number; playbackMs: number;
  entryFeeYen: number; distanceKm: number; sectors: RaceSector[]; prizes: RacePrize[]; entrants: RaceEntrant[];
};
export type RaceReceipt = {
  race: ActiveRace; position: number; rewardYen: number; reputationReward: number;
  levelBefore: number; levelAfter: number;
};
export type RaceRecord = { eventId: string; bestTimeMs: number; bestPosition: number; finishes: number; wins: number };
export type RacingState = {
  nextRunId: number; activeRace: ActiveRace | null; completedRaces: number; cancelledRaces: number;
  wins: number; podiums: number; totalEntryFeesYen: number; totalEarnedYen: number;
  records: RaceRecord[]; lastResult: RaceReceipt | null;
};
