import type { HeatState } from './heatTypes';
import type { StarterCar } from '../data/starters';
import type { JobId } from '../data/jobs';
import type { VehicleTuning } from './tuningTypes';
import type { MarketState } from './marketTypes';
import type { RacingState } from './racingTypes';

/** Frozen vehicle shape from Save v1-v3. Never attach new required fields here. */
export type LegacyPlayerVehicle = {
  instanceId: string; catalogId: string; name: string; year: number; engine: string;
  drive: StarterCar['drive']; hp: number; weightKg: number; odometerKm: number;
  engineCondition: number; bodyCondition: number; transmissionCondition: number;
  originality: number; installedParts: string[];
};
export type PlayerVehicle = LegacyPlayerVehicle & { tuning: VehicleTuning };
export type LegacyGameStateV1 = {
  cashYen: number; playerLevel: number; reputation: number; selectedStarterId: string | null;
  ownedVehicles: LegacyPlayerVehicle[];
};
export type LegacyGameStateV2 = LegacyGameStateV1 & { activeVehicleId: string | null };
export type ActiveJob = {
  runId: number; jobId: JobId; vehicleId: string | null;
  startedAtMs: number; finishesAtMs: number; rewardYen: number; reputationReward: number; distanceKm: number;
};
export type JobReceipt = {
  runId: number; jobId: JobId; rewardYen: number; reputationReward: number; levelBefore: number; levelAfter: number;
};
export type EconomyState = {
  nextRunId: number; activeJob: ActiveJob | null; completedJobs: number; totalEarnedYen: number; lastReceipt: JobReceipt | null;
};
export type LegacyGameStateV3 = LegacyGameStateV2 & { economy: EconomyState };
export type LegacyGameStateV4 = Omit<LegacyGameStateV3, 'ownedVehicles'> & { ownedVehicles: PlayerVehicle[] };
export type LegacyGameStateV5 = LegacyGameStateV4 & { racing: RacingState };
export type LegacyGameStateV6 = LegacyGameStateV5 & { market: MarketState };
export type GameState = LegacyGameStateV6 & { heat: HeatState };
