import { describe, expect, it } from 'vitest';
import { CITY_DISTRICTS, DISTRICT_IDS, findDistrict, isDistrictFilter, JOB_DISTRICTS, RACE_DISTRICTS } from '../data/city';
import { JOBS } from '../data/jobs';
import { RACE_EVENTS } from '../data/races';
import { getDistrictAccess, getDistrictJobs, getDistrictRaces, getDistrictRecords, getUnlockedDistricts } from './city';
import { createNewGameState, purchaseStarter } from './game';
import { getLevelProgress, reputationForLevel, LEVEL_CAP } from './progression';
import { getRaceBuildKey, startRace, settleRace } from './racing';
import { deserializeSave, exportSaveCode, importSaveCode, SAVE_VERSION, serializeSave } from './persistence';
import legacy from '../../tests/fixtures/save-v4.json';
const initial = () => purchaseStarter(createNewGameState(), 'pico-rs', 'pico-1');

 describe('City membership and access', () => {
  it('has six distinct previews and four implemented districts', () => {
    expect(new Set(CITY_DISTRICTS.map((d) => d.id)).size).toBe(6);
    expect(CITY_DISTRICTS.filter((d) => d.minLevel !== null)).toHaveLength(4);
    expect(CITY_DISTRICTS.map((d) => d.id)).toEqual([...DISTRICT_IDS]);
  });
  it('explicitly assigns every existing event exactly once without name parsing', () => {
    expect(Object.keys(RACE_DISTRICTS).sort()).toEqual(RACE_EVENTS.map((e) => e.id).sort());
    for (const event of RACE_EVENTS) {
      const area = findDistrict(RACE_DISTRICTS[event.id]);
      expect(area).toBeDefined(); expect(area!.minLevel).not.toBeNull();
      expect(area!.minLevel!).toBeLessThanOrEqual(event.minLevel);
    }
  });
  it('explicitly assigns every job and never raises an existing job gate', () => {
    expect(Object.keys(JOB_DISTRICTS).sort()).toEqual(JOBS.map((j) => j.id).sort());
    for (const job of JOBS) expect(findDistrict(JOB_DISTRICTS[job.id])!.minLevel!).toBeLessThanOrEqual(job.minLevel);
    expect(getDistrictJobs('east-ward').map((j) => j.id)).toEqual(['garage-shift', 'parts-run']);
    expect(getDistrictJobs('dockside').map((j) => j.id)).toEqual(['dock-delivery']);
  });
  it.each([[1, 1], [2, 3], [3, 4], [20, 4]] as const)('opens the expected districts at Level %s', (level, count) => {
    expect(getUnlockedDistricts({ ...initial(), playerLevel: level, reputation: reputationForLevel(level) })).toHaveLength(count);
  });
  it('opens nothing before the starter choice even at a high imported level', () => {
    expect(getUnlockedDistricts({ ...createNewGameState(), playerLevel: 20, reputation: 3800 })).toHaveLength(0);
  });
  it('keeps previews locked until their future implementation, including at the cap', () => {
    for (const id of ['industrial', 'outskirts']) {
      const access = getDistrictAccess({ ...initial(), playerLevel: 20, reputation: Number.MAX_SAFE_INTEGER }, id);
      expect(access.unlocked).toBe(false); expect(access.reason).toContain('planned');
      expect(access.percent).toBe(0); expect(getDistrictRaces(id as 'industrial')).toHaveLength(0);
    }
  });
  it('shows level and cumulative REP to a locked district without charging', () => {
    expect(getDistrictAccess({ ...initial(), reputation: 4 }, 'hakuro')).toMatchObject({ unlocked: false, reason: 'Requires Level 2.', remainingRep: 16, percent: 20 });
    expect(getDistrictAccess(initial(), 'not-a-district').unlocked).toBe(false);
  });
  it('combines district and discipline filters and leaves catalogs intact', () => {
    const before = JSON.stringify(RACE_EVENTS);
    expect(getDistrictRaces('all')).toHaveLength(8);
    expect(getDistrictRaces('dockside', 'drag')).toHaveLength(2);
    expect(getDistrictRaces('dockside', 'touge')).toHaveLength(0);
    expect(getDistrictRaces('all', 'touge')).toHaveLength(2);
    expect(getDistrictJobs('hakuro')).toHaveLength(0);
    expect(getDistrictJobs('all')).toHaveLength(3);
    getDistrictRaces('east-ward').reverse();
    expect(JSON.stringify(RACE_EVENTS)).toBe(before);
  });
  it.each(['all', ...DISTRICT_IDS])('accepts the explicit filter %s', (filter) => expect(isDistrictFilter(filter)).toBe(true));
  it.each(['', 'elsewhere', '__proto__', 'EAST WARD'])('rejects unsupported filter %s', (filter) => expect(isDistrictFilter(filter)).toBe(false));
  it('returns only settled records for the requested district', () => {
    const game = initial(); const car = game.ownedVehicles[0];
    const racing = startRace(game, 'east-ward-shakedown', car.instanceId, getRaceBuildKey(car), 1000);
    expect(getDistrictRecords(racing, 'east-ward')).toHaveLength(0);
    const paid = settleRace(racing, racing.racing.activeRace!.runId, racing.racing.activeRace!.finishesAtMs);
    expect(getDistrictRecords(paid, 'east-ward')).toHaveLength(1);
    expect(getDistrictRecords(paid, 'dockside')).toHaveLength(0);
  });
  it('does not write, claim, move vehicles or change the Save v5 contract when browsing', () => {
    const game = initial(); const car = game.ownedVehicles[0];
    const pending = startRace(game, 'east-ward-shakedown', car.instanceId, getRaceBuildKey(car), 1000);
    const before = serializeSave(pending, 2000);
    for (const id of DISTRICT_IDS) { getDistrictAccess(pending, id); getDistrictRaces(id); getDistrictJobs(id); getDistrictRecords(pending, id); }
    getLevelProgress(pending.reputation, pending.playerLevel);
    expect(serializeSave(pending, 2000)).toBe(before); expect(SAVE_VERSION).toBe(6);
    expect(importSaveCode(exportSaveCode(pending)).state).toEqual(pending);
  });
  it('loads the frozen old tuned save with the same access without adding fake city rewards', () => {
    const state = deserializeSave(JSON.stringify(legacy)).state;
    const before = structuredClone(state); getUnlockedDistricts(state);
    expect(state).toEqual(before); expect(state.cashYen).toBe(legacy.state.cashYen);
    expect(state.ownedVehicles).toEqual(legacy.state.ownedVehicles);
  });
});

describe('HUD XP uses the existing reputation progression', () => {
  it.each([[0, 1, 0, 20], [4, 1, 20, 16], [20, 2, 0, 40], [28, 2, 20, 32], [60, 3, 0, 60]] as const)(
    'shows REP %s at Level %s without a second XP counter', (rep, level, percent, remainingRep) => {
      expect(getLevelProgress(rep, level)).toMatchObject({ percent, remainingRep, nextLevel: level + 1 });
    });
  it('shows a full capped bar and never divides by zero', () => {
    for (const rep of [reputationForLevel(LEVEL_CAP), Number.MAX_SAFE_INTEGER]) {
      expect(getLevelProgress(rep, LEVEL_CAP)).toMatchObject({ nextLevel: null, remainingRep: 0, percent: 100 });
    }
  });
  it('preserves a valid grandfathered higher level with a clamped bar', () => {
    expect(getLevelProgress(100, 7)).toMatchObject({ level: 7, nextLevel: 8, percent: 0, remainingRep: 460 });
  });
});
