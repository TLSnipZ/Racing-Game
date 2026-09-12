import { isRaceHeatContract } from './heatValidation';
import { findRaceEvent, ALL_RACE_EVENTS } from '../data/races';
import { getPlayerPosition, simulateSectors } from './raceModel';
import { RACE_DISCIPLINES, SECTOR_PROFILES, type ActiveRace, type RaceBuild, type RaceReceipt, type RacingState } from './racingTypes';

const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const text = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0 && v.length <= 200;
const int = (v: unknown, min = 0, max = Number.MAX_SAFE_INTEGER): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v >= min && v <= max;
const percent = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 100;
export function isRaceBuild(value: unknown): value is RaceBuild {
  return record(value) && int(value.powerPs, 1, 1000000) && int(value.weightKg, 250, 1000000)
    && ['grip', 'handling', 'braking', 'reliability', 'engineCondition', 'transmissionCondition'].every((key) => percent(value[key]));
}
/** Bounded structural and mathematical validation. This is not server-authoritative anti-cheat. */
export function isRaceSnapshot(value: unknown): value is ActiveRace {
  if (!record(value) || value.modelVersion !== 1 || !int(value.runId, 1) || !text(value.eventId)
    || !findRaceEvent(value.eventId) || !text(value.eventName) || !RACE_DISCIPLINES.includes(value.discipline as never)
    || findRaceEvent(value.eventId)?.discipline !== value.discipline || !text(value.vehicleId)
    || !int(value.startedAtMs) || !int(value.finishesAtMs) || !int(value.countdownMs, 0, 10000)
    || !int(value.playbackMs, 1, 300000) || value.finishesAtMs !== value.startedAtMs + value.countdownMs + value.playbackMs
    || !int(value.entryFeeYen, 0, 1000000000) || !int(value.distanceKm, 1, 10000)) return false;
  if (!Array.isArray(value.sectors) || value.sectors.length < 1 || value.sectors.length > 8
    || !value.sectors.every((s) => record(s) && text(s.name) && SECTOR_PROFILES.includes(s.profile as never) && int(s.baseTimeMs, 1, 60000))) return false;
  if (!Array.isArray(value.prizes) || value.prizes.length !== 4 || !value.prizes.every((p) => record(p)
    && int(p.yen, 0, 1000000000) && int(p.reputation, 0, 1000000000))) return false;
  if ('heatRisk' in value && !isRaceHeatContract(value.heatRisk, value.eventId, value.prizes as ActiveRace['prizes'])) return false;
  if (!Array.isArray(value.entrants) || value.entrants.length !== 4) return false;
  const sectors = value.sectors as ActiveRace['sectors'];
  return value.entrants.every((entrant, i) => {
    if (!record(entrant) || entrant.id !== (i === 3 ? 'player' : `rival-${i + 1}`)
      || !text(entrant.name) || !text(entrant.vehicleName) || !text(entrant.catalogId) || !isRaceBuild(entrant.build)
      || !Array.isArray(entrant.sectorTimesMs) || entrant.sectorTimesMs.length !== sectors.length
      || !entrant.sectorTimesMs.every((time) => int(time, 1, 1000000)) || !int(entrant.totalTimeMs, 1, 8000000)) return false;
    // Retain the validated array narrowing across the comparison callback.
    const savedTimes = entrant.sectorTimesMs;
    const times = simulateSectors(entrant.build, sectors);
    return times.every((time, index) => time === savedTimes[index])
      && entrant.totalTimeMs === times.reduce((sum, time) => sum + time, 0);
  });
}
function isReceipt(value: unknown): value is RaceReceipt {
  if (!record(value) || !isRaceSnapshot(value.race) || !int(value.position, 1, 4)
    || value.position !== getPlayerPosition(value.race) || !int(value.levelBefore, 1) || !int(value.levelAfter, value.levelBefore)) return false;
  const prize = value.race.prizes[value.position - 1];
  return value.rewardYen === prize.yen && value.reputationReward === prize.reputation;
}
export function isRacingState(value: unknown, vehicles: readonly { instanceId: string }[]): value is RacingState {
  if (!record(value) || !int(value.nextRunId, 1) || !int(value.completedRaces) || !int(value.cancelledRaces)
    || !int(value.wins, 0, value.completedRaces) || !int(value.podiums, value.wins, value.completedRaces)
    || !int(value.totalEntryFeesYen) || !int(value.totalEarnedYen)) return false;
  const active = value.activeRace;
  const last = value.lastResult;
  if (active !== null && (!isRaceSnapshot(active) || active.runId !== value.nextRunId - 1
    || !vehicles.some((v) => v.instanceId === active.vehicleId))) return false;
  if (value.completedRaces + value.cancelledRaces !== value.nextRunId - 1 - (active === null ? 0 : 1)) return false;
  if (last === null) {
    if (value.completedRaces !== 0 || value.totalEarnedYen !== 0) return false;
  } else if (!isReceipt(last) || value.completedRaces === 0 || last.race.runId >= value.nextRunId
    || (active !== null && last.race.runId >= active.runId) || value.totalEarnedYen < last.rewardYen) return false;
  const minimumFees = (active?.entryFeeYen ?? 0) + (last?.race.entryFeeYen ?? 0);
  if (value.totalEntryFeesYen < minimumFees) return false;
  if (!Array.isArray(value.records) || value.records.length > ALL_RACE_EVENTS.length) return false;
  const ids = new Set<string>(); let finishes = 0; let wins = 0;
  for (const item of value.records) {
    if (!record(item) || !text(item.eventId) || !findRaceEvent(item.eventId) || ids.has(item.eventId)
      || !int(item.bestTimeMs, 1, 8000000) || !int(item.bestPosition, 1, 4) || !int(item.finishes, 1)
      || !int(item.wins, 0, item.finishes) || ((item.wins > 0) !== (item.bestPosition === 1))) return false;
    ids.add(item.eventId); finishes += item.finishes; wins += item.wins;
  }
  if (!Number.isSafeInteger(finishes) || !Number.isSafeInteger(wins) || finishes !== value.completedRaces || wins !== value.wins) return false;
  if (last !== null && !ids.has(last.race.eventId)) return false;
  return true;
}
