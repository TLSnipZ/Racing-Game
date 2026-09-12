import { afterRaceHeat, assertHeatState, getHeatActivityRequirement, getUndergroundRequirement } from './heat';
import { boostedPrize, createRaceHeatContract } from './heatRules';
import type { RaceMode } from './heatTypes';
import { findRaceEvent } from '../data/races';
import { levelForReputation } from './progression';
import { getVehicleBuildStats } from './tuning';
import { getPlayerPosition, simulateSectors } from './raceModel';
import { isRaceBuild, isRacingState } from './racingValidation';
import type { ActiveRace, RaceBuild, RaceEvent, RacingState } from './racingTypes';
import type { GameState, PlayerVehicle } from './types';

export function createRacingState(): RacingState {
  return { nextRunId: 1, activeRace: null, completedRaces: 0, cancelledRaces: 0, wins: 0, podiums: 0,
    totalEntryFeesYen: 0, totalEarnedYen: 0, records: [], lastResult: null };
}
function add(a: number, b: number): number {
  if (!Number.isSafeInteger(a) || a < 0 || !Number.isSafeInteger(b) || b < 0 || !Number.isSafeInteger(a + b)) throw new Error('Racing value exceeds its safe range.');
  return a + b;
}
export function getVehicleRaceBuild(vehicle: PlayerVehicle): RaceBuild {
  const stats = getVehicleBuildStats(vehicle);
  const build = { powerPs: stats.powerPs, weightKg: stats.weightKg, grip: stats.grip, handling: stats.handling,
    braking: stats.braking, reliability: stats.reliability, engineCondition: vehicle.engineCondition,
    transmissionCondition: vehicle.transmissionCondition };
  if (!isRaceBuild(build)) throw new Error('This vehicle exceeds the supported race-build range.');
  return build;
}
export function getRaceBuildKey(vehicle: PlayerVehicle): string {
  return JSON.stringify({ id: vehicle.instanceId, catalogId: vehicle.catalogId, name: vehicle.name, build: getVehicleRaceBuild(vehicle) });
}
export function getRaceRequirement(state: GameState, event: RaceEvent, vehicleId: string, mode: RaceMode = 'standard'): string | null {
  if (state.selectedStarterId === null) return 'Choose your starter first.';
  if (state.racing.activeRace) return 'Settle or withdraw from your current race first.';
  if (state.economy.activeJob) return 'Claim or cancel your job before entering a race. One driver, one activity.';
  const heatReason = getHeatActivityRequirement(state); if (heatReason) return heatReason;
  if (state.playerLevel < event.minLevel) return `Requires Level ${event.minLevel}.`;
  const vehicle = state.ownedVehicles.find((v) => v.instanceId === vehicleId);
  if (!vehicle) return 'Choose a vehicle you own.';
  if (vehicle.engineCondition <= 0 || vehicle.transmissionCondition <= 0) return 'This vehicle cannot drive. Garage Shift remains available.';
  try { getVehicleRaceBuild(vehicle); } catch { return 'This vehicle exceeds the supported race-build range.'; }
  if (!Number.isSafeInteger(state.cashYen) || state.cashYen < 0) return 'Cash value is invalid.';
  if (state.cashYen < event.entryFeeYen) return 'Not enough cash for the entry fee.';
  return getUndergroundRequirement(state, event, mode);
}
function assertState(state: GameState) {
  assertHeatState(state);
  if (!isRacingState(state.racing, state.ownedVehicles)) throw new Error('Racing state is invalid.');
  if (state.racing.activeRace && state.economy.activeJob) throw new Error('A job and a race cannot run together.');
}
function assertClock(now: number) {
  if (!Number.isSafeInteger(now) || now < 0) throw new Error('Device clock is invalid. Restore it and retry.');
}
export function startRace(state: GameState, eventId: string, vehicleId: string, expectedBuildKey: string, nowMs: number, mode: RaceMode = 'standard', expectedHeat?: number): GameState {
  assertState(state); assertClock(nowMs);
  const event = findRaceEvent(eventId);
  if (!event) throw new Error('Unknown race event.');
  const reason = getRaceRequirement(state, event, vehicleId, mode);
  if (reason) throw new Error(reason);
  if (mode === 'underground' && expectedHeat !== state.heat.value) throw new Error('Heat changed. Reopen the race briefing.');
  const risk = mode === 'underground' ? createRaceHeatContract(event, state.heat.value) : undefined;
  const vehicle = state.ownedVehicles.find((v) => v.instanceId === vehicleId)!;
  if (getRaceBuildKey(vehicle) !== expectedBuildKey) throw new Error('This build changed. Reopen the race briefing.');
  const nextRunId = add(state.racing.nextRunId, 1);
  const sectors = event.sectors.map((sector) => ({ ...sector }));
  const racers = [...event.rivals, { name: 'YOU', vehicleName: vehicle.name, catalogId: vehicle.catalogId, build: getVehicleRaceBuild(vehicle) }];
  const entrants = racers.map((rival, i) => {
    const build = { ...rival.build };
    const sectorTimesMs = simulateSectors(build, sectors);
    return { ...rival, build, id: i === 3 ? 'player' : `rival-${i + 1}`, sectorTimesMs,
      totalTimeMs: sectorTimesMs.reduce((sum, time) => sum + time, 0) };
  });
  const activeRace: ActiveRace = { modelVersion: 1, runId: state.racing.nextRunId, eventId: event.id,
    eventName: event.name, discipline: event.discipline, vehicleId, startedAtMs: nowMs,
    countdownMs: 3000, playbackMs: event.playbackMs, finishesAtMs: add(add(nowMs, 3000), event.playbackMs),
    entryFeeYen: event.entryFeeYen, distanceKm: event.distanceKm, sectors, entrants,
    prizes: event.prizes.map((prize) => risk ? boostedPrize(prize) : { ...prize }),
    ...(risk ? { heatRisk: risk } : {}) };
  return { ...state, heat: risk ? { ...state.heat, value: risk.heatAfter } : state.heat, cashYen: state.cashYen - event.entryFeeYen, racing: { ...state.racing, nextRunId, activeRace,
    totalEntryFeesYen: add(state.racing.totalEntryFeesYen, event.entryFeeYen) } };
}
export function settleRace(state: GameState, runId: number, nowMs: number): GameState {
  assertState(state); assertClock(nowMs);
  const race = state.racing.activeRace;
  if (!race || race.runId !== runId) throw new Error('This race is no longer active.');
  if (nowMs < race.startedAtMs) throw new Error('Device clock moved backwards. Restore it or withdraw.');
  if (nowMs < race.finishesAtMs) throw new Error('This race has not finished yet.');
  const position = getPlayerPosition(race);
  const prize = race.prizes[position - 1];
  const reputation = add(state.reputation, prize.reputation);
  const playerLevel = Math.max(state.playerLevel, levelForReputation(reputation));
  const time = race.entrants[3].totalTimeMs;
  const old = state.racing.records.find((record) => record.eventId === race.eventId);
  const record = { eventId: race.eventId, bestTimeMs: Math.min(old?.bestTimeMs ?? time, time),
    bestPosition: Math.min(old?.bestPosition ?? position, position), finishes: add(old?.finishes ?? 0, 1),
    wins: add(old?.wins ?? 0, position === 1 ? 1 : 0) };
  return { ...state, heat: afterRaceHeat(state.heat, race), cashYen: add(state.cashYen, prize.yen), reputation, playerLevel,
    ownedVehicles: state.ownedVehicles.map((v) => v.instanceId === race.vehicleId ? { ...v, odometerKm: add(v.odometerKm, race.distanceKm) } : v),
    racing: { ...state.racing, activeRace: null, completedRaces: add(state.racing.completedRaces, 1),
      wins: add(state.racing.wins, position === 1 ? 1 : 0), podiums: add(state.racing.podiums, position <= 3 ? 1 : 0),
      totalEarnedYen: add(state.racing.totalEarnedYen, prize.yen),
      records: old ? state.racing.records.map((r) => r.eventId === race.eventId ? record : r) : [...state.racing.records, record],
      lastResult: { race, position, rewardYen: prize.yen, reputationReward: prize.reputation, levelBefore: state.playerLevel, levelAfter: playerLevel } } };
}
/** Withdrawal is usable even after a backwards clock jump. The paid entry fee is never refunded. */
export function cancelRace(state: GameState, runId: number): GameState {
  assertState(state);
  if (!state.racing.activeRace || state.racing.activeRace.runId !== runId) throw new Error('This race is no longer active.');
  return { ...state, heat: afterRaceHeat(state.heat, state.racing.activeRace), racing: { ...state.racing, activeRace: null, cancelledRaces: add(state.racing.cancelledRaces, 1) } };
}
