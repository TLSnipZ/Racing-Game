import { FINE_REDUCTION, LAY_LOW_MS, LAY_LOW_REDUCTION, LEGAL_JOB_REDUCTION, UNDERGROUND_ENTRY_LIMIT, UNDERGROUND_HEAT_V1, UNDERGROUND_MIN_LEVEL } from './heatRules';
import { isHeatLinked, isHeatState } from './heatValidation';
import type { HeatState, RaceMode } from './heatTypes';
import type { ActiveRace, RaceEvent } from './racingTypes';
import type { GameState } from './types';
export function createHeatState(): HeatState {
  return { value: 0, nextCooldownId: 1, cooldown: null, pendingStop: null, totalFinesPaidYen: 0, lastResolution: null };
}
export function assertHeatState(state: GameState): void {
  if (!isHeatState(state.heat) || !isHeatLinked(state.heat, state.racing, state.economy.activeJob, state.selectedStarterId !== null)) throw new Error('Heat state is invalid.');
}
export function getHeatActivityRequirement(state: GameState): string | null {
  if (state.heat.cooldown) return 'Finish or cancel Lay low in City first. One driver, one activity.';
  if (state.heat.pendingStop) return 'Resolve the patrol alert in City first: pay the shown fine or lay low for free.';
  return null;
}
export function getUndergroundRequirement(state: GameState, event: RaceEvent, mode: RaceMode): string | null {
  if (mode === 'standard') return null;
  if (mode !== 'underground') return 'Unknown race mode.';
  if (!Object.hasOwn(UNDERGROUND_HEAT_V1, event.id)) return 'This free practice event does not offer Underground stakes.';
  if (state.playerLevel < UNDERGROUND_MIN_LEVEL) return `Underground stakes require Level ${UNDERGROUND_MIN_LEVEL}.`;
  if (state.heat.value >= UNDERGROUND_ENTRY_LIMIT) return 'Heat is 85 or higher. Cool down before another Underground run.';
  return null;
}
/** Used by settlement AND withdrawal. The announced liability cannot be cancelled away. */
export function afterRaceHeat(heat: HeatState, race: ActiveRace): HeatState {
  const risk = race.heatRisk;
  if (!risk?.policeFineYen) return heat;
  return { ...heat, pendingStop: { rulesVersion: 1, raceRunId: race.runId, eventId: race.eventId, eventName: race.eventName,
    heatAtEntry: risk.heatAfter, fineYen: risk.policeFineYen } };
}
export function afterLegalJob(heat: HeatState): HeatState {
  return heat.value === 0 ? heat : { ...heat, value: Math.max(0, heat.value - LEGAL_JOB_REDUCTION) };
}
function safeAdd(a: number, b: number): number {
  if (!Number.isSafeInteger(a) || a < 0 || !Number.isSafeInteger(b) || b < 0 || !Number.isSafeInteger(a + b)) throw new Error('Heat value exceeds its safe range.');
  return a + b;
}
function clock(now: number): void { if (!Number.isSafeInteger(now) || now < 0) throw new Error('Device clock is invalid.'); }
export function getLayLowRequirement(state: GameState): string | null {
  if (state.selectedStarterId === null) return 'Choose your starter first.';
  if (state.economy.activeJob || state.racing.activeRace) return 'Claim or cancel your current job/race first.';
  if (state.heat.cooldown) return 'A Lay low pause is already pending.';
  if (state.heat.value === 0) return 'Heat is already clear.';
  return null;
}
export function startLayLow(state: GameState, expectedHeat: number, expectedNextId: number, now: number): GameState {
  assertHeatState(state); clock(now);
  const reason = getLayLowRequirement(state); if (reason) throw new Error(reason);
  if (expectedHeat !== state.heat.value || expectedNextId !== state.heat.nextCooldownId) throw new Error('Heat changed. Review the pause again.');
  return { ...state, heat: { ...state.heat, nextCooldownId: safeAdd(state.heat.nextCooldownId, 1), cooldown: {
    runId: state.heat.nextCooldownId, startedAtMs: now, finishesAtMs: safeAdd(now, LAY_LOW_MS),
    heatBefore: state.heat.value, heatAfter: Math.max(0, state.heat.value - LAY_LOW_REDUCTION),
    policeRunId: state.heat.pendingStop?.raceRunId ?? null,
  } } };
}
export function finishLayLow(state: GameState, runId: number, now: number): GameState {
  assertHeatState(state); clock(now);
  const pause = state.heat.cooldown;
  if (!pause || pause.runId !== runId) throw new Error('This Lay low pause is no longer active.');
  if (now < pause.startedAtMs) throw new Error('Device clock moved backwards. Restore it or cancel this pause.');
  if (now < pause.finishesAtMs) throw new Error('Lay low is not finished yet.');
  return { ...state, heat: { ...state.heat, value: pause.heatAfter, cooldown: null, pendingStop: null,
    lastResolution: { kind: 'lay-low', heatBefore: pause.heatBefore, heatAfter: pause.heatAfter, paidYen: 0, stop: state.heat.pendingStop } } };
}
export function cancelLayLow(state: GameState, runId: number): GameState {
  assertHeatState(state);
  if (!state.heat.cooldown || state.heat.cooldown.runId !== runId) throw new Error('This Lay low pause is no longer active.');
  return { ...state, heat: { ...state.heat, cooldown: null } };
}
export function payPoliceFine(state: GameState, expectedRaceId: number, expectedFine: number): GameState {
  assertHeatState(state);
  const stop = state.heat.pendingStop;
  if (!stop || stop.raceRunId !== expectedRaceId || stop.fineYen !== expectedFine) throw new Error('This patrol alert changed or was already resolved.');
  if (state.heat.cooldown) throw new Error('Finish or cancel Lay low before paying a fine.');
  if (!Number.isSafeInteger(state.cashYen) || state.cashYen < stop.fineYen) throw new Error('Not enough cash. Lay low is always free.');
  const value = Math.max(0, state.heat.value - FINE_REDUCTION);
  return { ...state, cashYen: state.cashYen - stop.fineYen, heat: { ...state.heat, value, pendingStop: null,
    totalFinesPaidYen: safeAdd(state.heat.totalFinesPaidYen, stop.fineYen),
    lastResolution: { kind: 'fine', heatBefore: state.heat.value, heatAfter: value, paidYen: stop.fineYen, stop } } };
}
