import type { RacePrize } from './racingTypes';
export type RaceMode = 'standard' | 'underground';
/** Frozen at acceptance. Keep rules v1 available for old unpaid races. */
export type RaceHeatContract = {
  rulesVersion: 1; heatBefore: number; heatGain: number; heatAfter: number;
  policeFineYen: number; basePrizes: RacePrize[];
};
export type PoliceStop = {
  rulesVersion: 1; raceRunId: number; eventId: string; eventName: string;
  heatAtEntry: number; fineYen: number;
};
export type HeatCooldown = {
  runId: number; startedAtMs: number; finishesAtMs: number;
  heatBefore: number; heatAfter: number; policeRunId: number | null;
};
export type HeatResolution = {
  kind: 'fine' | 'lay-low'; heatBefore: number; heatAfter: number;
  paidYen: number; stop: PoliceStop | null;
};
export type HeatState = {
  value: number; nextCooldownId: number; cooldown: HeatCooldown | null;
  pendingStop: PoliceStop | null; totalFinesPaidYen: number; lastResolution: HeatResolution | null;
};
