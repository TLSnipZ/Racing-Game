import { describe, expect, it } from 'vitest';
import { JOBS } from '../data/jobs';
import { STARTER_CARS } from '../data/starters';
import { createNewGameState, createPlayerVehicle, purchaseStarter } from './game';
import { cancelJob, claimJob, createEconomyState, getJobRequirement, isEconomyState, startJob } from './economy';
import { selectActiveVehicle } from './garage';
import { getLevelProgress, LEVEL_CAP, levelForReputation, reputationForLevel } from './progression';

const initial = () => purchaseStarter(createNewGameState(), 'pico-rs', 'pico-1');
const unlocked = () => ({ ...initial(), playerLevel: 3, reputation: 60 });

describe('Economy commands', () => {
  it('starts with fresh independent empty job state', () => {
    expect(initial().economy).toEqual({ nextRunId: 1, activeJob: null, completedJobs: 0, totalEarnedYen: 0, lastReceipt: null });
    expect(createEconomyState()).not.toBe(createEconomyState());
  });
  it('requires a starter before accepting a job', () => expect(() => startJob(createNewGameState(), 'garage-shift', 1000)).toThrow('starter'));
  it('rejects unknown jobs', () => expect(() => startJob(initial(), 'ghost', 1000)).toThrow('Unknown job'));
  it.each(['parts-run', 'dock-delivery'])('enforces the level gate for %s', (id) => expect(() => startJob(initial(), id, 1000)).toThrow('Level'));
  it('accepts work without an entry fee or advance payment', () => {
    const before = initial(); const next = startJob(before, 'garage-shift', 1000);
    expect(next.cashYen).toBe(18000); expect(next.reputation).toBe(0);
    expect(next.economy.activeJob).toEqual({ runId: 1, jobId: 'garage-shift', vehicleId: null,
      startedAtMs: 1000, finishesAtMs: 16000, rewardYen: 1500, reputationReward: 4, distanceKm: 0 });
    expect(before).toEqual(initial());
  });
  it('rejects accepting a second job while one is active', () => {
    const state = startJob(unlocked(), 'garage-shift', 1000);
    expect(() => startJob(state, 'parts-run', 1000)).toThrow('current job');
  });
  it('requires an owned active car for delivery work', () => {
    expect(() => startJob({ ...unlocked(), activeVehicleId: null }, 'parts-run', 1000)).toThrow('active vehicle');
  });
  it.each(STARTER_CARS)('allows delivery work for the stock $id', (car) => {
    const state = { ...purchaseStarter(createNewGameState(), car.id, 'car'), playerLevel: 3, reputation: 60 };
    expect(getJobRequirement(state, JOBS[2])).toBeNull();
    expect(startJob(state, 'dock-delivery', 1000).economy.activeJob?.vehicleId).toBe('car');
  });
  it('keeps no-car work available even with a broken engine', () => {
    const state = unlocked(); state.ownedVehicles[0].engineCondition = 0;
    expect(() => startJob(state, 'parts-run', 1000)).toThrow('cannot drive');
    expect(startJob(state, 'garage-shift', 1000).economy.activeJob).not.toBeNull();
  });
  it('allows earning from a zero cash balance', () => {
    const state = startJob({ ...initial(), cashYen: 0 }, 'garage-shift', 1000);
    expect(claimJob(state, 1, 16000).cashYen).toBe(1500);
  });
  it('rejects an early claim and pays exactly at the deadline', () => {
    const state = startJob(initial(), 'garage-shift', 1000);
    expect(() => claimJob(state, 1, 15999)).toThrow('not ready');
    const result = claimJob(state, 1, 16000);
    expect(result.cashYen).toBe(19500); expect(result.reputation).toBe(4);
    expect(result.economy).toMatchObject({ activeJob: null, nextRunId: 2, completedJobs: 1, totalEarnedYen: 1500 });
    expect(state.cashYen).toBe(18000); expect(state.economy.activeJob).not.toBeNull();
  });
  it('rejects a second claim and stale run IDs', () => {
    const first = startJob(initial(), 'garage-shift', 1000);
    expect(() => claimJob(first, 999, 20000)).toThrow('no longer active');
    const paid = claimJob(first, 1, 16000);
    expect(() => claimJob(paid, 1, 20000)).toThrow('no longer active');
    const second = startJob(paid, 'garage-shift', 20000);
    expect(() => claimJob(second, 1, 60000)).toThrow('no longer active');
    expect(claimJob(second, 2, 60000).cashYen).toBe(21000);
  });
  it('never auto-repeats during a very long absence', () => {
    const state = startJob(initial(), 'garage-shift', 1000);
    const paid = claimJob(state, 1, 1_000_000_000);
    expect(paid.economy.completedJobs).toBe(1); expect(paid.cashYen).toBe(19500);
    expect(paid.economy.activeJob).toBeNull();
  });
  it('uses the accepted reward snapshot, not a recalculation at payout', () => {
    const state = startJob(initial(), 'garage-shift', 1000);
    state.economy.activeJob!.rewardYen = 1725;
    expect(claimJob(state, 1, 16000).cashYen).toBe(19725);
  });
  it('adds route mileage to the assigned vehicle, not a newly active one', () => {
    let state = unlocked(); state.ownedVehicles.push(createPlayerVehicle('rz-t', 'akari-1'));
    state = startJob(state, 'parts-run', 1000);
    state = selectActiveVehicle(state, 'akari-1');
    const before = JSON.stringify(state);
    const result = claimJob(state, 1, 31000);
    expect(result.ownedVehicles[0].odometerKm).toBe(168426);
    expect(result.ownedVehicles[1].odometerKm).toBe(189340);
    expect(result.ownedVehicles[0].engineCondition).toBe(88);
    expect(result.activeVehicleId).toBe('akari-1');
    expect(JSON.stringify(state)).toBe(before);
  });
  it('cancels without rewards, mileage or resetting the sequence', () => {
    const state = startJob(unlocked(), 'parts-run', 1000);
    const next = cancelJob(state, 1);
    expect(next.economy.activeJob).toBeNull(); expect(next.economy.nextRunId).toBe(2);
    expect(next.cashYen).toBe(state.cashYen); expect(next.reputation).toBe(state.reputation);
    expect(next.ownedVehicles).toEqual(state.ownedVehicles);
    expect(startJob(next, 'garage-shift', 1000).economy.activeJob?.runId).toBe(2);
  });
  it('rejects cancellation of a stale or absent job', () => {
    expect(() => cancelJob(initial(), 1)).toThrow();
    expect(() => cancelJob(startJob(initial(), 'garage-shift', 1000), 2)).toThrow();
  });
  it.each([-1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])('rejects invalid time %s without changing state', (now) => {
    const state = initial(); const before = JSON.stringify(state);
    expect(() => startJob(state, 'garage-shift', now)).toThrow();
    expect(() => claimJob(startJob(state, 'garage-shift', 1000), 1, now)).toThrow();
    expect(JSON.stringify(state)).toBe(before);
  });
  it('offers cancellation after a backwards clock jump', () => {
    const state = startJob(initial(), 'garage-shift', 1000);
    expect(() => claimJob(state, 1, 999)).toThrow('backwards');
    expect(cancelJob(state, 1).economy.activeJob).toBeNull();
  });
  it('rejects unsafe timestamp arithmetic', () => expect(() => startJob(initial(), 'garage-shift', Number.MAX_SAFE_INTEGER)).toThrow('safe range'));
  it.each(['cashYen', 'reputation'] as const)('rejects %s overflow atomically', (key) => {
    const state = startJob(initial(), 'garage-shift', 1000); state[key] = Number.MAX_SAFE_INTEGER;
    const before = JSON.stringify(state);
    expect(() => claimJob(state, 1, 16000)).toThrow('safe range'); expect(JSON.stringify(state)).toBe(before);
  });
  it('rejects mileage overflow before paying', () => {
    const state = startJob(unlocked(), 'parts-run', 1000); state.ownedVehicles[0].odometerKm = Number.MAX_SAFE_INTEGER;
    expect(() => claimJob(state, 1, 31000)).toThrow('safe range'); expect(state.cashYen).toBe(18000);
  });
  it('rejects unsafe run ID arithmetic', () => {
    const state = initial(); state.economy.nextRunId = Number.MAX_SAFE_INTEGER;
    expect(() => startJob(state, 'garage-shift', 1000)).toThrow('safe range');
  });
  it('keeps earned totals and receipt across a later cancellation', () => {
    const paid = claimJob(startJob(initial(), 'garage-shift', 1000), 1, 16000);
    const cancelled = cancelJob(startJob(paid, 'garage-shift', 20000), 2);
    expect(cancelled.economy.lastReceipt).toEqual(paid.economy.lastReceipt);
    expect(cancelled.economy.totalEarnedYen).toBe(1500);
    expect(isEconomyState(cancelled.economy, cancelled.ownedVehicles)).toBe(true);
  });
});

describe('Reputation and levels', () => {
  it.each([[0,1], [19,1], [20,2], [59,2], [60,3], [119,3], [120,4], [3800,20]] as const)('%i reputation gives level %i', (rep, level) => expect(levelForReputation(rep)).toBe(level));
  it('caps levels, not reputation or earnings', () => expect(levelForReputation(Number.MAX_SAFE_INTEGER)).toBe(LEVEL_CAP));
  it('levels up after five starter shifts without inventing a level-up cash bonus', () => {
    let state = initial();
    for (let i = 0; i < 5; i++) { state = startJob(state, 'garage-shift', i * 15000); state = claimJob(state, i + 1, (i + 1) * 15000); }
    expect(state.playerLevel).toBe(2); expect(state.reputation).toBe(20); expect(state.cashYen).toBe(25500);
    expect(state.economy.lastReceipt).toMatchObject({ levelBefore: 1, levelAfter: 2 });
    expect(getJobRequirement(state, JOBS[1])).toBeNull();
  });
  it('preserves valid legacy high levels on the first new reward', () => {
    const state = startJob({ ...initial(), playerLevel: 7 }, 'garage-shift', 1000);
    expect(claimJob(state, 1, 16000).playerLevel).toBe(7);
  });
  it('reports exact remaining reputation', () => expect(getLevelProgress(12, 1)).toMatchObject({ nextLevel: 2, remainingRep: 8, percent: 60 }));
  it('handles cap and valid legacy levels above the cap', () => {
    expect(getLevelProgress(3800, 20).nextLevel).toBeNull();
    expect(getLevelProgress(0, 30).percent).toBe(100);
  });
  it.each([-1, NaN, 1.5])('rejects invalid rep %s', (rep) => expect(() => levelForReputation(rep)).toThrow());
  it.each([0, 21, 1.5])('rejects invalid level %s', (level) => expect(() => reputationForLevel(level)).toThrow());
});
