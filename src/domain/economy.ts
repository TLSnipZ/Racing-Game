import { findJob, type JobDefinition } from '../data/jobs';
import { getActiveVehicle } from './garage';
import { levelForReputation } from './progression';
import type { EconomyState, GameState, PlayerVehicle } from './types';

export function createEconomyState(): EconomyState {
  return { nextRunId: 1, activeJob: null, completedJobs: 0, totalEarnedYen: 0, lastReceipt: null };
}
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const integer = (value: unknown, min = 0): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= min;
const reward = (value: unknown): value is number => integer(value, 1) && value <= 1_000_000_000;

/** Only vehicle identity is needed, including while validating historical schemas. */
export function isEconomyState(value: unknown, vehicles: readonly Pick<PlayerVehicle, 'instanceId'>[]): value is EconomyState {
  if (!record(value) || !integer(value.nextRunId, 1) || !integer(value.completedJobs)
    || !integer(value.totalEarnedYen) || value.completedJobs >= value.nextRunId) return false;
  const last = value.lastReceipt;
  if (last === null) {
    if (value.completedJobs !== 0 || value.totalEarnedYen !== 0) return false;
  } else {
    if (!record(last) || !integer(last.runId, 1) || last.runId >= value.nextRunId
      || typeof last.jobId !== 'string' || !findJob(last.jobId) || !reward(last.rewardYen) || !reward(last.reputationReward)
      || !integer(last.levelBefore, 1) || !integer(last.levelAfter, last.levelBefore)
      || value.completedJobs === 0 || value.totalEarnedYen < last.rewardYen) return false;
  }
  const active = value.activeJob;
  if (active === null) return true;
  if (!record(active) || !integer(active.runId, 1) || active.runId !== value.nextRunId - 1
    || typeof active.jobId !== 'string' || !integer(active.startedAtMs) || !integer(active.finishesAtMs)
    || active.finishesAtMs <= active.startedAtMs || active.finishesAtMs - active.startedAtMs > 86_400_000
    || !reward(active.rewardYen) || !reward(active.reputationReward)
    || !integer(active.distanceKm) || active.distanceKm > 10_000) return false;
  const definition = findJob(active.jobId);
  if (!definition || (record(last) && typeof last.runId === 'number' && active.runId <= last.runId)) return false;
  return definition.requiresVehicle ? typeof active.vehicleId === 'string' && vehicles.some((v) => v.instanceId === active.vehicleId)
    : active.vehicleId === null && active.distanceKm === 0;
}
export function getJobRequirement(state: GameState, job: JobDefinition): string | null {
  if (state.selectedStarterId === null) return 'Choose your starter first.';
  if (state.playerLevel < job.minLevel) return `Requires Level ${job.minLevel}.`;
  if (state.economy.activeJob) return 'Finish or cancel your current job first.';
  if (job.requiresVehicle) {
    const vehicle = getActiveVehicle(state);
    if (!vehicle) return 'Choose an active vehicle in your garage.';
    if (vehicle.engineCondition <= 0 || vehicle.transmissionCondition <= 0) return 'This vehicle cannot drive. Garage Shift remains available.';
  }
  return null;
}
function add(left: number, right: number): number {
  if (!integer(left) || !integer(right) || !Number.isSafeInteger(left + right)) throw new Error('Economy value exceeds its safe range.');
  return left + right;
}
function assertClock(nowMs: number) { if (!integer(nowMs)) throw new Error('Device clock is invalid. Restore your clock and retry.'); }
function assertEconomy(state: GameState) { if (!isEconomyState(state.economy, state.ownedVehicles)) throw new Error('Economy state is invalid.'); }
export function startJob(state: GameState, jobId: string, nowMs: number): GameState {
  assertClock(nowMs); assertEconomy(state);
  const job = findJob(jobId);
  if (!job) throw new Error('Unknown job.');
  const reason = getJobRequirement(state, job);
  if (reason) throw new Error(reason);
  const nextRunId = add(state.economy.nextRunId, 1);
  const finishesAtMs = add(nowMs, job.durationMs);
  return { ...state, economy: { ...state.economy, nextRunId, activeJob: {
    runId: state.economy.nextRunId, jobId: job.id, vehicleId: job.requiresVehicle ? state.activeVehicleId : null,
    startedAtMs: nowMs, finishesAtMs, rewardYen: job.rewardYen, reputationReward: job.reputationReward, distanceKm: job.distanceKm,
  } } };
}
export function claimJob(state: GameState, runId: number, nowMs: number): GameState {
  assertClock(nowMs); assertEconomy(state);
  const job = state.economy.activeJob;
  if (!job || job.runId !== runId) throw new Error('This job is no longer active.');
  if (nowMs < job.startedAtMs) throw new Error('Device clock moved backwards. Restore your clock or cancel the job.');
  if (nowMs < job.finishesAtMs) throw new Error('This job is not ready yet.');
  const cashYen = add(state.cashYen, job.rewardYen);
  const reputation = add(state.reputation, job.reputationReward);
  const playerLevel = Math.max(state.playerLevel, levelForReputation(reputation));
  const completedJobs = add(state.economy.completedJobs, 1);
  const totalEarnedYen = add(state.economy.totalEarnedYen, job.rewardYen);
  const ownedVehicles = job.vehicleId === null ? state.ownedVehicles : state.ownedVehicles.map((vehicle) =>
    vehicle.instanceId === job.vehicleId ? { ...vehicle, odometerKm: add(vehicle.odometerKm, job.distanceKm) } : vehicle);
  return { ...state, cashYen, reputation, playerLevel, ownedVehicles, economy: {
    ...state.economy, activeJob: null, completedJobs, totalEarnedYen,
    lastReceipt: { runId: job.runId, jobId: job.jobId, rewardYen: job.rewardYen,
      reputationReward: job.reputationReward, levelBefore: state.playerLevel, levelAfter: playerLevel },
  } };
}
export function cancelJob(state: GameState, runId: number): GameState {
  assertEconomy(state);
  if (!state.economy.activeJob || state.economy.activeJob.runId !== runId) throw new Error('This job is no longer active.');
  return { ...state, economy: { ...state.economy, activeJob: null } };
}
