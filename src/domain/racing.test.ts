import { describe, expect, it } from 'vitest';
import { findRaceEvent, RACE_EVENTS } from '../data/races';
import { PARTS } from '../data/parts';
import { createNewGameState, createPlayerVehicle, purchaseStarter } from './game';
import { cancelJob, startJob } from './economy';
import { selectActiveVehicle } from './garage';
import { installPart, removePart } from './tuning';
import { cancelRace, createRacingState, getRaceBuildKey, getRaceRequirement, getVehicleRaceBuild, settleRace, startRace } from './racing';
import { getPlayerPosition, getRaceProgress, getRaceStandings, isRaceReady, simulateSectors } from './raceModel';
import { isRacingState, isRaceSnapshot } from './racingValidation';
import { deserializeSave, exportSaveCode, importSaveCode, isGameState, serializeSave } from './persistence';
import type { GameState } from './types';
const initial = (id = 'pico-rs'): GameState => purchaseStarter(createNewGameState(), id, 'car-1');
const rich = (id = 'pico-rs'): GameState => ({ ...initial(id), cashYen: 1000000, playerLevel: 7, reputation: 420 });
const enter = (state = rich(), event = 'east-ward-shakedown', now = 1000, vehicle = 'car-1') => startRace(state, event, vehicle,
  getRaceBuildKey(state.ownedVehicles.find((v) => v.instanceId === vehicle)!), now);
const finish = (state: GameState) => settleRace(state, state.racing.activeRace!.runId, state.racing.activeRace!.finishesAtMs);
function maximum(id: string) {
  let state = rich(id);
  for (const part of PARTS.filter((p) => p.compatibleCatalogIds.includes(id))) {
    state = installPart(state, 'car-1', part.id, state.ownedVehicles[0].tuning.installedBySlot[part.slot] ?? null);
  }
  return state;
}

describe('Race catalog and deterministic sector model', () => {
  it('has eight unique events, four disciplines, valid increasing rewards and three rivals', () => {
    expect(new Set(RACE_EVENTS.map((e) => e.id)).size).toBe(8);
    expect(new Set(RACE_EVENTS.map((e) => e.discipline)).size).toBe(4);
    for (const event of RACE_EVENTS) {
      expect(event.rivals).toHaveLength(3); expect(event.prizes).toHaveLength(4);
      expect(event.prizes.map((p) => p.yen)).toEqual([...event.prizes.map((p) => p.yen)].sort((a, b) => b - a));
      expect(isRaceSnapshot(enter(rich(), event.id).racing.activeRace)).toBe(true);
    }
  });
  it('keeps one zero-cost event open at Level 1 for every starter even with no cash', () => {
    const event = findRaceEvent('east-ward-shakedown')!;
    for (const id of ['pico-rs', 'tora-85', 'rz-t']) expect(getRaceRequirement({ ...initial(id), cashYen: 0 }, event, 'car-1')).toBeNull();
  });
  it.each(RACE_EVENTS.map((e) => e.id))('all three starter builds produce valid results for %s', (event) => {
    for (const id of ['pico-rs', 'tora-85', 'rz-t']) {
      const pending = enter(rich(id), event); const paid = finish(pending);
      expect(isGameState(pending)).toBe(true); expect(isGameState(paid)).toBe(true);
      expect(paid.racing.lastResult!.position).toBeGreaterThanOrEqual(1); expect(paid.racing.lastResult!.position).toBeLessThanOrEqual(4);
    }
  });
  it('same build and rivals produce identical times independently of start time or run id', () => {
    const one = enter(); const two = enter(rich(), 'east-ward-shakedown', 9000000);
    expect(one.racing.activeRace!.entrants).toEqual(two.racing.activeRace!.entrants);
    const again = enter(finish(one)); expect(again.racing.activeRace!.entrants).toEqual(one.racing.activeRace!.entrants);
  });
  it('takes independent copies of rivals, prizes, sectors and build values', () => {
    const state = rich(); const event = RACE_EVENTS[0]; const pending = enter(state); const race = pending.racing.activeRace!;
    expect(race.sectors).not.toBe(event.sectors); expect(race.entrants[0].build).not.toBe(event.rivals[0].build);
    expect(race.prizes[0]).not.toBe(event.prizes[0]); const power = race.entrants[3].build.powerPs;
    state.ownedVehicles[0].hp += 10; expect(race.entrants[3].build.powerPs).toBe(power);
  });
  it('power tuning improves acceleration sectors without mutating factory horsepower', () => {
    const state = rich(); const improved = installPart(state, 'car-1', 'aoba-panel-filter', null);
    expect(enter(improved, 'dockyard-402').racing.activeRace!.entrants[3].totalTimeMs)
      .toBeLessThan(enter(state, 'dockyard-402').racing.activeRace!.entrants[3].totalTimeMs);
    expect(improved.ownedVehicles[0].hp).toBe(105);
  });
  it('tires and brakes help the pass without adding horsepower', () => {
    const state = rich('tora-85'); let improved = installPart(state, 'car-1', 'aoba-street-tires', null);
    improved = installPart(improved, 'car-1', 'aoba-sport-brakes', null);
    expect(getVehicleRaceBuild(improved.ownedVehicles[0]).powerPs).toBe(118);
    expect(enter(improved, 'hakuro-intro').racing.activeRace!.entrants[3].totalTimeMs)
      .toBeLessThan(enter(state, 'hakuro-intro').racing.activeRace!.entrants[3].totalTimeMs);
  });
  it('a fully tuned lighter Tora beats the higher-powered RZ-T on touge, not expressway', () => {
    const light = maximum('tora-85'); const turbo = maximum('rz-t');
    expect(getVehicleRaceBuild(light.ownedVehicles[0]).powerPs).toBeLessThan(getVehicleRaceBuild(turbo.ownedVehicles[0]).powerPs);
    expect(enter(light, 'hakuro-club').racing.activeRace!.entrants[3].totalTimeMs).toBeLessThan(enter(turbo, 'hakuro-club').racing.activeRace!.entrants[3].totalTimeMs);
    expect(enter(turbo, 'eastline-club').racing.activeRace!.entrants[3].totalTimeMs).toBeLessThan(enter(light, 'eastline-club').racing.activeRace!.entrants[3].totalTimeMs);
  });
  it('lower mechanical condition cannot improve a sector', () => {
    const car = getVehicleRaceBuild(initial().ownedVehicles[0]); const course = RACE_EVENTS[0].sectors;
    const good = simulateSectors(car, course); const worn = simulateSectors({ ...car, engineCondition: 20, transmissionCondition: 20 }, course);
    expect(worn.every((time, i) => time >= good[i])).toBe(true);
  });
  it('ties retain grid order without mutating the snapshot', () => {
    const race = enter().racing.activeRace!; const rows = race.entrants.map((e) => ({ ...e, totalTimeMs: 100 }));
    const before = JSON.stringify(rows); expect(getRaceStandings({ entrants: rows }).map((e) => e.id)).toEqual(rows.map((e) => e.id));
    expect(getPlayerPosition({ entrants: rows })).toBe(4); expect(JSON.stringify(rows)).toBe(before);
  });
});

describe('Entry, settlement, cancellation and shared activity safety', () => {
  it('charges only the entry fee at acceptance and no reward, rep or mileage', () => {
    const state = rich(); const before = structuredClone(state); const pending = enter(state, 'dockyard-402');
    expect(pending.cashYen).toBe(state.cashYen - 1000); expect(pending.reputation).toBe(state.reputation);
    expect(pending.ownedVehicles).toEqual(state.ownedVehicles); expect(pending.racing.totalEntryFeesYen).toBe(1000);
    expect(pending.racing.completedRaces).toBe(0); expect(state).toEqual(before);
  });
  it('settles gross prize, rep, mileage, receipt and counters together exactly once', () => {
    const before = rich(); const pending = enter(before, 'dockyard-402'); const race = pending.racing.activeRace!;
    const position = getPlayerPosition(race); const prize = race.prizes[position - 1]; const paid = finish(pending);
    expect(paid.cashYen).toBe(before.cashYen - race.entryFeeYen + prize.yen); expect(paid.reputation).toBe(before.reputation + prize.reputation);
    expect(paid.ownedVehicles[0].odometerKm).toBe(before.ownedVehicles[0].odometerKm + race.distanceKm);
    expect(paid.ownedVehicles[0].engineCondition).toBe(before.ownedVehicles[0].engineCondition);
    expect(paid.racing.completedRaces).toBe(1); expect(paid.racing.lastResult?.position).toBe(position);
    expect(paid.racing.records[0].finishes).toBe(1); expect(paid.economy).toEqual(before.economy);
    expect(() => settleRace(paid, race.runId, race.finishesAtMs)).toThrow('no longer active');
  });
  it('grants race level-ups through the same reputation thresholds as jobs', () => {
    const state = { ...rich(), playerLevel: 1, reputation: 19 }; const paid = finish(enter(state));
    expect(paid.playerLevel).toBe(2); expect(paid.racing.lastResult?.levelBefore).toBe(1); expect(paid.racing.lastResult?.levelAfter).toBe(2);
  });
  it('retains legacy levels rather than downgrading them', () => expect(finish(enter({ ...rich(), playerLevel: 30 })).playerLevel).toBe(30));
  it('rejects duplicate starts and stale settlement/cancel ids', () => {
    const pending = enter(); expect(() => enter(pending)).toThrow('current race');
    expect(() => settleRace(pending, 2, 100000)).toThrow('no longer active'); expect(() => cancelRace(pending, 2)).toThrow('no longer active');
    const second = enter(finish(pending)); expect(() => settleRace(second, 1, 100000)).toThrow('no longer active');
  });
  it.each([-1, NaN, Infinity, 1.5])('rejects invalid clocks %s without fees', (time) => expect(() => enter(rich(), 'dockyard-402', time)).toThrow());
  it('rejects time overflow at entry', () => expect(() => enter(rich(), 'dockyard-402', Number.MAX_SAFE_INTEGER)).toThrow('safe range'));
  it('rejects early settlement and a backwards clock but can still cancel', () => {
    const pending = enter(); const race = pending.racing.activeRace!;
    expect(() => settleRace(pending, 1, race.finishesAtMs - 1)).toThrow('not finished');
    expect(() => settleRace(pending, 1, 0)).toThrow('backwards'); expect(isGameState(cancelRace(pending, 1))).toBe(true);
  });
  it('withdrawal keeps the fee and grants no money, rep, distance or record', () => {
    const state = rich(); const pending = enter(state, 'eastline-entry'); const cancelled = cancelRace(pending, 1);
    expect(cancelled.cashYen).toBe(state.cashYen - 1500); expect(cancelled.reputation).toBe(state.reputation);
    expect(cancelled.ownedVehicles).toEqual(state.ownedVehicles); expect(cancelled.racing.cancelledRaces).toBe(1);
    expect(cancelled.racing.records).toEqual([]); expect(isGameState(enter(cancelled))).toBe(true);
  });
  it.each(['garage-shift', 'parts-run', 'dockside-delivery'])('rejects race entry while %s is pending and vice versa', (jobId) => {
    const state = startJob(rich(), jobId, 0); expect(() => enter(state)).toThrow('job before entering');
    expect(() => startJob(enter(), jobId, 0)).toThrow('race before accepting');
    expect(isGameState(enter(cancelJob(state, 1)))).toBe(true);
  });
  it('rejects level gates, unowned vehicles, stale builds and unknown events', () => {
    expect(() => enter(initial(), 'eastline-club')).toThrow('Level 6');
    expect(() => startRace(rich(), 'east-ward-shakedown', 'ghost', 'bad', 0)).toThrow('own');
    expect(() => startRace(rich(), 'east-ward-shakedown', 'car-1', 'stale', 0)).toThrow('build changed');
    expect(() => enter(rich(), 'unknown')).toThrow('Unknown race');
  });
  it.each([-1, 1.5, NaN, 999])('rejects invalid or insufficient entry money %s', (cashYen) => expect(() => enter({ ...rich(), cashYen }, 'dockyard-402')).toThrow());
  it.each(['engineCondition', 'transmissionCondition'] as const)('rejects a non-driving car with zero %s', (key) => {
    const state = rich(); state.ownedVehicles[0][key] = 0; expect(() => enter(state)).toThrow('cannot drive');
  });
  it('does not overflow cash, rep or odometer on settlement', () => {
    const cash = enter({ ...rich(), cashYen: Number.MAX_SAFE_INTEGER }); expect(() => finish(cash)).toThrow('safe range');
    const rep = enter({ ...rich(), reputation: Number.MAX_SAFE_INTEGER }); expect(() => finish(rep)).toThrow('safe range');
    const state = rich(); state.ownedVehicles[0].odometerKm = Number.MAX_SAFE_INTEGER; expect(() => finish(enter(state))).toThrow('safe range');
  });
  it('locks only the assigned car through finish until settlement', () => {
    const state = rich(); state.ownedVehicles.push(createPlayerVehicle('rz-t', 'other')); const pending = enter(state);
    const switched = selectActiveVehicle(pending, 'other');
    expect(() => installPart(switched, 'car-1', 'aoba-panel-filter', null)).toThrow('assigned to a race');
    const tuned = installPart(switched, 'other', 'aoba-panel-filter', null); const paid = finish(tuned);
    expect(paid.activeVehicleId).toBe('other'); expect(paid.ownedVehicles[1].odometerKm).toBe(189340);
    expect(paid.ownedVehicles[0].odometerKm).toBe(168423); expect(paid.racing.lastResult!.race.entrants).toEqual(pending.racing.activeRace!.entrants);
  });
  it('prevents stock restoration on the assigned race car', () => {
    const state = installPart(rich(), 'car-1', 'aoba-panel-filter', null);
    expect(() => removePart(enter(state), 'car-1', 'intake', 'aoba-panel-filter')).toThrow('assigned to a race');
  });
  it('records repeated finishes while keeping the best time and place', () => {
    let state = finish(enter(rich())); const first = state.racing.records[0];
    state = installPart(state, 'car-1', 'aoba-panel-filter', null); state = finish(enter(state));
    expect(state.racing.records).toHaveLength(1); expect(state.racing.records[0].finishes).toBe(2);
    expect(state.racing.records[0].bestTimeMs).toBeLessThan(first.bestTimeMs); expect(isGameState(state)).toBe(true);
  });
});

describe('Replay and save safety', () => {
  it('presentation, tab-like repeated reads and long absences never mutate or pay', () => {
    const state = enter(); const raw = serializeSave(state, 0); const race = state.racing.activeRace!;
    for (const time of [0, 1000, 2000, 4000, 5000, race.finishesAtMs, Number.MAX_SAFE_INTEGER]) {
      const view = getRaceProgress(race, time); expect(view.rows.every((r) => r.progress >= 0 && r.progress <= 100)).toBe(true);
      expect(serializeSave(state, 0)).toBe(raw);
    }
    expect(getRaceProgress(race, 0).phase).toBe('clock-error'); expect(getRaceProgress(race, 1000).countdown).toBe(3);
    expect(isRaceReady(race, race.finishesAtMs - 1)).toBe(false); expect(isRaceReady(race, race.finishesAtMs)).toBe(true);
    expect(getRaceProgress(race, race.finishesAtMs).rows.every((r) => r.progress === 100)).toBe(true);
  });
  it('round-trips unclaimed and settled races without rerolling or paying again', () => {
    const state = enter(); const again = importSaveCode(exportSaveCode(state)).state; expect(again).toEqual(state);
    expect(finish(again)).toEqual(finish(state)); const paid = finish(state);
    expect(deserializeSave(serializeSave(paid)).state).toEqual(paid);
  });
  it('all completed/cancelled states keep their accounting invariant over repeated play', () => {
    let state = rich();
    for (let i = 0; i < 24; i++) { state = enter(state, RACE_EVENTS[i % RACE_EVENTS.length].id, i * 100000);
      state = i % 3 === 0 ? cancelRace(state, state.racing.activeRace!.runId) : finish(state); expect(isRacingState(state.racing, state.ownedVehicles)).toBe(true); }
    expect(state.racing.completedRaces).toBe(16); expect(state.racing.cancelledRaces).toBe(8); expect(state.racing.nextRunId).toBe(25);
  });
});
