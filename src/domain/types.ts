import type { StarterCar } from '../data/starters';
import type { JobId } from '../data/jobs';

export type PlayerVehicle = {
  instanceId: string;
  catalogId: string;
  name: string;
  year: number;
  engine: string;
  drive: StarterCar['drive'];
  hp: number;
  weightKg: number;
  odometerKm: number;
  engineCondition: number;
  bodyCondition: number;
  transmissionCondition: number;
  originality: number;
  installedParts: string[];
};

/** Frozen historical schemas: do not add new required fields to these. */
export type LegacyGameStateV1 = {
  cashYen: number;
  playerLevel: number;
  reputation: number;
  selectedStarterId: string | null;
  ownedVehicles: PlayerVehicle[];
};
export type LegacyGameStateV2 = LegacyGameStateV1 & { activeVehicleId: string | null };

/** Rewards, route and assigned vehicle are fixed at acceptance. */
export type ActiveJob = {
  runId: number;
  jobId: JobId;
  vehicleId: string | null;
  startedAtMs: number;
  finishesAtMs: number;
  rewardYen: number;
  reputationReward: number;
  distanceKm: number;
};
export type JobReceipt = {
  runId: number;
  jobId: JobId;
  rewardYen: number;
  reputationReward: number;
  levelBefore: number;
  levelAfter: number;
};
export type EconomyState = {
  nextRunId: number;
  activeJob: ActiveJob | null;
  completedJobs: number;
  totalEarnedYen: number;
  lastReceipt: JobReceipt | null;
};
export type GameState = LegacyGameStateV2 & { economy: EconomyState };
