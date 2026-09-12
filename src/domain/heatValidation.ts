import { findRaceEvent } from '../data/races';
import { boostedPrize, FINE_REDUCTION, HEAT_CAP, LAY_LOW_MS, LAY_LOW_REDUCTION, policeFineForHeat, UNDERGROUND_ENTRY_LIMIT, UNDERGROUND_HEAT_V1 } from './heatRules';
import type { HeatState, PoliceStop, RaceHeatContract } from './heatTypes';
import type { RacePrize, RacingState } from './racingTypes';
const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const int = (v: unknown, min = 0, max = Number.MAX_SAFE_INTEGER): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v >= min && v <= max;
const heat = (v: unknown): v is number => int(v, 0, HEAT_CAP);
const text = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0 && v.length <= 200;
const prize = (v: unknown): v is RacePrize => record(v) && int(v.yen, 0, 600_000_000) && int(v.reputation, 0, 600_000_000);
export function isRaceHeatContract(value: unknown, eventId: string, prizes: readonly RacePrize[]): value is RaceHeatContract {
  if (!record(value) || value.rulesVersion !== 1 || !Object.hasOwn(UNDERGROUND_HEAT_V1, eventId)
    || !int(value.heatBefore, 0, UNDERGROUND_ENTRY_LIMIT - 1) || value.heatGain !== UNDERGROUND_HEAT_V1[eventId]
    || value.heatAfter !== Math.min(HEAT_CAP, value.heatBefore + UNDERGROUND_HEAT_V1[eventId])
    || !heat(value.heatAfter) || value.policeFineYen !== policeFineForHeat(value.heatAfter)
    || !Array.isArray(value.basePrizes) || value.basePrizes.length !== 4 || !value.basePrizes.every(prize) || prizes.length !== 4) return false;
  return value.basePrizes.every((base, i) => {
    const boosted = boostedPrize(base);
    return boosted.yen === prizes[i].yen && boosted.reputation === prizes[i].reputation;
  });
}
function isStop(value: unknown): value is PoliceStop {
  return record(value) && value.rulesVersion === 1 && int(value.raceRunId, 1)
    && text(value.eventId) && !!findRaceEvent(value.eventId) && Object.hasOwn(UNDERGROUND_HEAT_V1, value.eventId)
    && text(value.eventName) && int(value.heatAtEntry, 50, HEAT_CAP)
    && value.fineYen === policeFineForHeat(value.heatAtEntry);
}
export function isHeatState(value: unknown): value is HeatState {
  if (!record(value) || !heat(value.value) || !int(value.nextCooldownId, 1) || !int(value.totalFinesPaidYen)
    || value.totalFinesPaidYen % 1500 !== 0) return false;
  const stop = value.pendingStop;
  if (stop !== null && (!isStop(stop) || stop.heatAtEntry !== value.value)) return false;
  const cooldown = value.cooldown;
  if (cooldown !== null && (!record(cooldown) || !int(cooldown.runId, 1) || cooldown.runId !== value.nextCooldownId - 1
    || !int(cooldown.startedAtMs) || !int(cooldown.finishesAtMs) || cooldown.finishesAtMs - cooldown.startedAtMs !== LAY_LOW_MS
    || !heat(cooldown.heatBefore) || cooldown.heatBefore !== value.value || cooldown.heatBefore === 0
    || cooldown.heatAfter !== Math.max(0, cooldown.heatBefore - LAY_LOW_REDUCTION)
    || cooldown.policeRunId !== (stop === null ? null : (stop as PoliceStop).raceRunId))) return false;
  const receipt = value.lastResolution;
  if (receipt === null) return value.totalFinesPaidYen === 0;
  if (!record(receipt) || !heat(receipt.heatBefore) || !heat(receipt.heatAfter) || receipt.heatBefore === 0
    || (receipt.stop !== null && !isStop(receipt.stop))) return false;
  if (receipt.stop !== null && (receipt.stop as PoliceStop).heatAtEntry !== receipt.heatBefore) return false;
  if (receipt.kind === 'fine') return receipt.stop !== null && receipt.paidYen === (receipt.stop as PoliceStop).fineYen
    && value.totalFinesPaidYen >= receipt.paidYen && receipt.heatAfter === Math.max(0, receipt.heatBefore - FINE_REDUCTION);
  return receipt.kind === 'lay-low' && receipt.paidYen === 0 && value.nextCooldownId > 1
    && receipt.heatAfter === Math.max(0, receipt.heatBefore - LAY_LOW_REDUCTION);
}
/** Cross-system associations, including withdrawn runs for which no race receipt exists. */
export function isHeatLinked(value: HeatState, racing: RacingState, activeJob: unknown, started: boolean): boolean {
  if (!started && (value.value !== 0 || value.cooldown || value.pendingStop || value.lastResolution || value.nextCooldownId !== 1 || value.totalFinesPaidYen !== 0)) return false;
  if ((value.cooldown || value.pendingStop) && (racing.activeRace || activeJob)) return false;
  if (racing.activeRace?.heatRisk && racing.activeRace.heatRisk.heatAfter !== value.value) return false;
  if (value.pendingStop && value.pendingStop.raceRunId !== racing.nextRunId - 1) return false;
  if (value.pendingStop && racing.lastResult?.race.runId === value.pendingStop.raceRunId) {
    const accepted = racing.lastResult.race;
    if (!accepted.heatRisk || accepted.eventId !== value.pendingStop.eventId || accepted.eventName !== value.pendingStop.eventName
      || accepted.heatRisk.heatAfter !== value.pendingStop.heatAtEntry || accepted.heatRisk.policeFineYen !== value.pendingStop.fineYen) return false;
  }
  if (value.lastResolution?.stop && value.lastResolution.stop.raceRunId >= racing.nextRunId) return false;
  return true;
}
