import { getVehicleBuildStats, isVehicleTuning } from './tuning';
import type { LegacyPlayerVehicle, PlayerVehicle } from './types';

export const isRecord = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
export const isText = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0 && v.length <= 200;
export const isInteger = (v: unknown, min = 0): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v >= min;
export const isPercent = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 100;
export function isLegacyVehicle(value: unknown): value is LegacyPlayerVehicle {
  if (!isRecord(value)) return false;
  return isText(value.instanceId) && isText(value.catalogId) && isText(value.name) && isText(value.engine)
    && (value.drive === 'FWD' || value.drive === 'RWD') && isInteger(value.year, 1) && isInteger(value.hp, 1)
    && isInteger(value.weightKg, 1) && isInteger(value.odometerKm) && isPercent(value.engineCondition)
    && isPercent(value.bodyCondition) && isPercent(value.transmissionCondition) && isPercent(value.originality)
    && Array.isArray(value.installedParts) && value.installedParts.length <= 100 && value.installedParts.every(isText);
}
export function isPlayerVehicle(value: unknown): value is PlayerVehicle {
  if (!isLegacyVehicle(value) || !('tuning' in value) || !isVehicleTuning(value.tuning, value.catalogId)) return false;
  try { getVehicleBuildStats(value as PlayerVehicle); return true; } catch { return false; }
}
