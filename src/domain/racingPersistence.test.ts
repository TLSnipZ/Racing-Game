import { createMarketState } from './marketStock';
import { Buffer } from 'node:buffer';
import { describe, expect, it } from 'vitest';
import legacyV4 from '../../tests/fixtures/save-v4.json';
import { createNewGameState, purchaseStarter } from './game';
import { createRacingState, getRaceBuildKey, settleRace, startRace } from './racing';
import { startJob } from './economy';
import { deserializeSave, exportSaveCode, importSaveCode, isGameState, SAVE_CODE_PREFIX, SAVE_VERSION, serializeSave } from './persistence';
import type { ActiveRace } from './racingTypes';
const initial = () => ({ ...purchaseStarter(createNewGameState(), 'pico-rs', 'car-1'), playerLevel: 5, cashYen: 100000 });
const pending = () => { const state = initial(); return startRace(state, 'dockyard-402', 'car-1', getRaceBuildKey(state.ownedVehicles[0]), 1000); };
const raw = (state: unknown, version = SAVE_VERSION) => JSON.stringify({ version, savedAt: 1000, state });
const finished = () => { const state = pending(); return settleRace(state, 1, state.racing.activeRace!.finishesAtMs); };

describe('Save v5 race contract and frozen v4 fixture', () => {
  it('migrates a tuned v4 car and pending delivery without changing any prior field', () => {
    const before = JSON.stringify(legacyV4); const save = deserializeSave(before);
    expect(save.version).toBe(SAVE_VERSION); expect(save.savedAt).toBe(legacyV4.savedAt);
    expect(save.state).toEqual({ ...legacyV4.state, market: createMarketState(), racing: createRacingState() }); expect(JSON.stringify(legacyV4)).toBe(before);
  });
  it('accepts a v4 KAGEHAMA1 code without resetting tuning or paying a pending job', () => {
    const code = SAVE_CODE_PREFIX + Buffer.from(JSON.stringify(legacyV4)).toString('base64url');
    const state = importSaveCode(code).state;
    expect(state.cashYen).toBe(9500); expect(state.economy.activeJob).toEqual(legacyV4.state.economy.activeJob);
    expect(state.ownedVehicles[0].tuning).toEqual(legacyV4.state.ownedVehicles[0].tuning);
  });
  it('rejects missing v5 racing, rather than interpreting current data as v4', () => {
    const { racing: _racing, ...state } = initial(); expect(() => deserializeSave(raw(state))).toThrow('invalid');
  });
  it('still rejects missing required tuning in a v4 envelope', () => {
    const source = structuredClone(legacyV4); delete (source.state.ownedVehicles[0] as Partial<typeof source.state.ownedVehicles[0]>).tuning;
    expect(() => deserializeSave(JSON.stringify(source))).toThrow('v4');
  });
  it('preserves all results and snapshots through repeated serialization', () => {
    for (const state of [pending(), finished()]) {
      let next = state;
      for (let i = 0; i < 10; i++) next = importSaveCode(exportSaveCode(next)).state;
      expect(next).toEqual(state);
    }
  });
  it('does not auto-settle a race when savedAt or device time is far past the deadline', () => {
    const state = pending(); expect(deserializeSave(serializeSave(state, 9000000000000)).state).toEqual(state);
  });
  it('does not accept simultaneous saved jobs and races', () => {
    const state = pending(); const job = startJob(initial(), 'garage-shift', 0);
    expect(isGameState({ ...state, economy: job.economy })).toBe(false);
  });
  it.each([
    { modelVersion: 2 }, { eventId: 'missing' }, { discipline: 'drift' }, { discipline: 'touge' }, { vehicleId: 'ghost' },
    { runId: 4 }, { startedAtMs: -1 }, { finishesAtMs: 1 }, { countdownMs: -1 }, { playbackMs: 0 },
    { entryFeeYen: -1 }, { distanceKm: 0 }, { prizes: [] }, { entrants: [] }, { sectors: [] },
  ])('rejects a malformed active-race snapshot %j', (patch) => {
    const state = pending(); const malformed = { ...state, racing: { ...state.racing, activeRace: { ...state.racing.activeRace, ...patch } } };
    expect(() => deserializeSave(raw(malformed))).toThrow();
  });
  it.each(['totalTimeMs', 'powerPs', 'profile', 'sectorTime', 'rivalId', 'reward', 'tooManySectors'])('rejects inconsistent or unbounded race %s', (field) => {
    const state = pending(); const race = state.racing.activeRace!;
    if (field === 'totalTimeMs') race.entrants[0].totalTimeMs++;
    if (field === 'powerPs') race.entrants[0].build.powerPs = Number.MAX_SAFE_INTEGER;
    if (field === 'profile') race.sectors[0].profile = 'invalid' as ActiveRace['sectors'][0]['profile'];
    if (field === 'sectorTime') race.entrants[0].sectorTimesMs[0]++;
    if (field === 'rivalId') race.entrants[0].id = 'player';
    if (field === 'reward') race.prizes[0].yen = -1;
    if (field === 'tooManySectors') race.sectors = Array(9).fill(race.sectors[0]);
    expect(isGameState(state)).toBe(false);
  });
  it.each([{ wins: 1 }, { podiums: 2 }, { completedRaces: 1 }, { cancelledRaces: 1 }, { nextRunId: 0 },
    { totalEarnedYen: -1 }, { totalEntryFeesYen: 0 }, { records: [{}] }, { activeRace: undefined }])('rejects bad racing accounting %j', (patch) => {
    expect(isGameState({ ...pending(), racing: { ...pending().racing, ...patch } })).toBe(false);
  });
  it('rejects a replayed receipt, altered payout, missing records and duplicate records', () => {
    let state = finished(); state.racing.lastResult!.rewardYen++; expect(isGameState(state)).toBe(false);
    state = finished(); state.racing.lastResult!.race.runId = 3; expect(isGameState(state)).toBe(false);
    state = finished(); state.racing.records = []; expect(isGameState(state)).toBe(false);
    state = finished(); state.racing.records.push({ ...state.racing.records[0] }); expect(isGameState(state)).toBe(false);
  });
  it('does not leak mutable race results into a separately imported save', () => {
    const code = exportSaveCode(pending()); const first = importSaveCode(code); first.state.racing.activeRace!.eventName = 'Edited';
    expect(importSaveCode(code).state.racing.activeRace!.eventName).toBe('Dockyard 402');
  });
});
