import { findPart, isPartCompatible, PARTS, type PartDefinition } from '../data/parts';
import { TUNING_SLOTS, type TuningSlot, type VehicleBuildStats, type VehicleTuning } from './tuningTypes';
import type { GameState, PlayerVehicle } from './types';

export function createVehicleTuning(): VehicleTuning {
  return { purchasedPartIds: [], installedBySlot: {} };
}
const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

/** Structural validation only, not anti-cheat. Never trust an imported part ID or slot. */
export function isVehicleTuning(value: unknown, catalogId: string): value is VehicleTuning {
  if (!record(value) || !Array.isArray(value.purchasedPartIds) || value.purchasedPartIds.length > PARTS.length
    || !record(value.installedBySlot)) return false;
  const owned = value.purchasedPartIds;
  if (new Set(owned).size !== owned.length || !owned.every((id) => {
    if (typeof id !== 'string') return false;
    const part = findPart(id);
    return !!part && isPartCompatible(part, catalogId);
  })) return false;
  return Object.entries(value.installedBySlot).every(([slot, id]) => {
    if (!TUNING_SLOTS.includes(slot as TuningSlot) || typeof id !== 'string' || !owned.includes(id)) return false;
    const part = findPart(id);
    return !!part && part.slot === slot && isPartCompatible(part, catalogId);
  });
}
const BASE_RATINGS: Record<string, { grip: number; handling: number; braking: number; reliability: number }> = {
  'mira-s': { grip: 54, handling: 58, braking: 55, reliability: 86 },
  'nami-gt': { grip: 61, handling: 67, braking: 59, reliability: 82 },
  'riku-tourer': { grip: 54, handling: 47, braking: 57, reliability: 89 },
  'pico-rs': { grip: 48, handling: 62, braking: 45, reliability: 88 },
  'tora-85': { grip: 50, handling: 66, braking: 47, reliability: 78 },
  'rz-t': { grip: 51, handling: 52, braking: 49, reliability: 68 },
};
const clampRating = (value: number) => Math.max(0, Math.min(100, value));
export function getInstalledUpgrades(vehicle: PlayerVehicle): PartDefinition[] {
  return TUNING_SLOTS.flatMap((slot) => {
    const id = vehicle.tuning.installedBySlot[slot]; const part = id ? findPart(id) : undefined;
    return part ? [part] : [];
  });
}
/** Always derive from the saved factory baseline, never from previously boosted numbers. */
export function getVehicleBuildStats(vehicle: PlayerVehicle): VehicleBuildStats {
  const base = BASE_RATINGS[vehicle.catalogId] ?? { grip: 50, handling: 50, braking: 50, reliability: 70 };
  const mods = getInstalledUpgrades(vehicle).reduce((sum, part) => ({
    powerBps: sum.powerBps + (part.modifiers.powerBps ?? 0), weightKg: sum.weightKg + (part.modifiers.weightKg ?? 0),
    grip: sum.grip + (part.modifiers.grip ?? 0), handling: sum.handling + (part.modifiers.handling ?? 0),
    braking: sum.braking + (part.modifiers.braking ?? 0), reliability: sum.reliability + (part.modifiers.reliability ?? 0),
    originalityPenalty: sum.originalityPenalty + (part.modifiers.originalityPenalty ?? 0),
  }), { powerBps: 0, weightKg: 0, grip: 0, handling: 0, braking: 0, reliability: 0, originalityPenalty: 0 });
  const rounded = (BigInt(vehicle.hp) * BigInt(10000 + mods.powerBps) + 5000n) / 10000n;
  if (rounded > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('Build power exceeds its safe range.');
  const powerPs = Number(rounded); const weightKg = Math.max(250, vehicle.weightKg + mods.weightKg);
  if (!Number.isSafeInteger(weightKg)) throw new Error('Build weight exceeds its safe range.');
  return { powerPs, weightKg, powerToWeight: Math.round(powerPs / weightKg * 10000) / 10,
    grip: clampRating(base.grip + mods.grip), handling: clampRating(base.handling + mods.handling),
    braking: clampRating(base.braking + mods.braking), reliability: clampRating(base.reliability + mods.reliability),
    originality: clampRating(vehicle.originality - mods.originalityPenalty) };
}
export function getFittedPartNames(vehicle: PlayerVehicle): string[] {
  const installed = getInstalledUpgrades(vehicle);
  const words: Record<TuningSlot, RegExp> = { intake: /intake|filter/i, exhaust: /exhaust/i, ecu: /ecu/i,
    tires: /tires/i, suspension: /suspension/i, brakes: /brake/i, weight: /interior/i, turbo: /turbo/i };
  return [...vehicle.installedParts.filter((name) => !installed.some((part) => words[part.slot].test(name))), ...installed.map((part) => part.name)];
}
export function previewPart(vehicle: PlayerVehicle, part: PartDefinition): VehicleBuildStats {
  return getVehicleBuildStats({ ...vehicle, tuning: { ...vehicle.tuning,
    installedBySlot: { ...vehicle.tuning.installedBySlot, [part.slot]: part.id } } });
}
export function isVehicleBusy(state: GameState, instanceId: string): boolean {
  return state.economy.activeJob?.vehicleId === instanceId || state.racing.activeRace?.vehicleId === instanceId;
}
export function getVehicleBusyReason(state: GameState, instanceId: string): string | null {
  if (state.racing.activeRace?.vehicleId === instanceId) return 'Vehicle assigned to a race. Settle or withdraw before tuning.';
  if (state.economy.activeJob?.vehicleId === instanceId) return 'Vehicle assigned to a job. Claim or cancel it before tuning.';
  return null;
}
export function getPartRequirement(state: GameState, vehicle: PlayerVehicle, part: PartDefinition): string | null {
  if (state.selectedStarterId === null) return 'Choose your starter first.';
  if (!isPartCompatible(part, vehicle.catalogId)) return 'Not compatible with this vehicle. Turbo upgrades require an Akari RZ-T.';
  const busy = getVehicleBusyReason(state, vehicle.instanceId);
  if (busy) return busy;
  if (vehicle.tuning.installedBySlot[part.slot] === part.id) return 'Already installed.';
  if (state.playerLevel < part.minLevel) return `Requires Level ${part.minLevel}.`;
  if (!Number.isSafeInteger(state.cashYen) || state.cashYen < 0) return 'Cash value is invalid.';
  if (!vehicle.tuning.purchasedPartIds.includes(part.id) && state.cashYen < part.priceYen) return 'Not enough cash.';
  return null;
}
function requireVehicle(state: GameState, id: string): PlayerVehicle {
  const vehicle = state.ownedVehicles.find((v) => v.instanceId === id);
  if (!vehicle) throw new Error('You can only tune a vehicle you own.');
  if (!isVehicleTuning(vehicle.tuning, vehicle.catalogId)) throw new Error('Vehicle tuning data is invalid.');
  return vehicle;
}
export function installPart(state: GameState, instanceId: string, partId: string, expectedInstalledId: string | null): GameState {
  const vehicle = requireVehicle(state, instanceId); const part = findPart(partId);
  if (!part) throw new Error('Unknown performance part.');
  if ((vehicle.tuning.installedBySlot[part.slot] ?? null) !== expectedInstalledId) throw new Error('This build changed. Review the current slot and try again.');
  const reason = getPartRequirement(state, vehicle, part);
  if (reason) throw new Error(reason);
  const alreadyOwned = vehicle.tuning.purchasedPartIds.includes(part.id);
  const updated: PlayerVehicle = { ...vehicle, tuning: {
    purchasedPartIds: alreadyOwned ? [...vehicle.tuning.purchasedPartIds] : [...vehicle.tuning.purchasedPartIds, part.id],
    installedBySlot: { ...vehicle.tuning.installedBySlot, [part.slot]: part.id },
  } };
  getVehicleBuildStats(updated);
  return { ...state, cashYen: state.cashYen - (alreadyOwned ? 0 : part.priceYen),
    ownedVehicles: state.ownedVehicles.map((v) => v.instanceId === instanceId ? updated : v) };
}
export function removePart(state: GameState, instanceId: string, slot: TuningSlot, expectedPartId: string): GameState {
  const vehicle = requireVehicle(state, instanceId);
  if (!TUNING_SLOTS.includes(slot) || vehicle.tuning.installedBySlot[slot] !== expectedPartId) throw new Error('This part is no longer installed.');
  const busy = getVehicleBusyReason(state, instanceId);
  if (busy) throw new Error(busy);
  const installedBySlot = { ...vehicle.tuning.installedBySlot }; delete installedBySlot[slot];
  const updated = { ...vehicle, tuning: { purchasedPartIds: [...vehicle.tuning.purchasedPartIds], installedBySlot } };
  getVehicleBuildStats(updated);
  return { ...state, ownedVehicles: state.ownedVehicles.map((v) => v.instanceId === instanceId ? updated : v) };
}
