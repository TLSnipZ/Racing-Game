import { createMarketState } from './marketStock';
import { isMarketState } from './marketValidation';
import { createEconomyState, isEconomyState } from './economy';
import { createVehicleTuning, getVehicleBuildStats, isVehicleTuning } from './tuning';
import { createRacingState } from './racing';
import { isRacingState } from './racingValidation';
import type { GameState, LegacyGameStateV1, LegacyGameStateV2, LegacyGameStateV3, LegacyGameStateV4, LegacyGameStateV5, LegacyPlayerVehicle, PlayerVehicle } from './types';

export const SAVE_VERSION = 6;
export const SAVE_STORAGE_KEY = 'kagehama:save';
// The transport stays v1; the envelope inside it has its own schema version.
export const SAVE_CODE_PREFIX = 'KAGEHAMA1-';
export const MAX_SAVE_LENGTH = 2_000_000;
export type SaveEnvelope = { version: number; savedAt: number; state: GameState };
const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function encodeBase64Url(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let output = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const value = ((bytes[i] ?? 0) << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0);
    output += BASE64_ALPHABET[(value >> 18) & 63]; output += BASE64_ALPHABET[(value >> 12) & 63];
    if (i + 1 < bytes.length) output += BASE64_ALPHABET[(value >> 6) & 63];
    if (i + 2 < bytes.length) output += BASE64_ALPHABET[value & 63];
  }
  return output.replace(/\+/g, '-').replace(/\//g, '_');
}
function decodeBase64Url(input: string): string {
  if (!/^[A-Za-z0-9_-]+$/.test(input) || input.length % 4 === 1) throw new Error('Save code contains invalid characters or is incomplete.');
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
  const bytes: number[] = [];
  for (let i = 0; i < padded.length; i += 4) {
    const chars = padded.slice(i, i + 4);
    const v = chars.split('').map((char) => char === '=' ? 0 : BASE64_ALPHABET.indexOf(char));
    const value = (v[0] << 18) | (v[1] << 12) | (v[2] << 6) | v[3];
    bytes.push((value >> 16) & 255);
    if (chars[2] !== '=') bytes.push((value >> 8) & 255);
    if (chars[3] !== '=') bytes.push(value & 255);
  }
  return new TextDecoder('utf-8', { fatal: true }).decode(new Uint8Array(bytes));
}
const isRecord = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const isText = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0 && v.length <= 200;
const isInteger = (v: unknown, min = 0): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v >= min;
const isPercent = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 100;
function isLegacyVehicle(value: unknown): value is LegacyPlayerVehicle {
  if (!isRecord(value)) return false;
  return isText(value.instanceId) && isText(value.catalogId) && isText(value.name) && isText(value.engine)
    && (value.drive === 'FWD' || value.drive === 'RWD') && isInteger(value.year, 1) && isInteger(value.hp, 1)
    && isInteger(value.weightKg, 1) && isInteger(value.odometerKm) && isPercent(value.engineCondition)
    && isPercent(value.bodyCondition) && isPercent(value.transmissionCondition) && isPercent(value.originality)
    && Array.isArray(value.installedParts) && value.installedParts.length <= 100 && value.installedParts.every(isText);
}
function isPlayerVehicle(value: unknown): value is PlayerVehicle {
  if (!isLegacyVehicle(value) || !('tuning' in value) || !isVehicleTuning(value.tuning, value.catalogId)) return false;
  try { getVehicleBuildStats(value as PlayerVehicle); return true; } catch { return false; }
}
function isLegacyGameState(value: unknown): value is LegacyGameStateV1 {
  if (!isRecord(value)) return false;
  if (!(isInteger(value.cashYen) && isInteger(value.playerLevel, 1) && isInteger(value.reputation)
    && (value.selectedStarterId === null || isText(value.selectedStarterId))
    && Array.isArray(value.ownedVehicles) && value.ownedVehicles.length <= 1000 && value.ownedVehicles.every(isLegacyVehicle))) return false;
  const ids = value.ownedVehicles.map((vehicle) => vehicle.instanceId);
  return new Set(ids).size === ids.length && (ids.length === 0 || value.selectedStarterId !== null);
}
function isGameStateV2(value: unknown): value is LegacyGameStateV2 {
  if (!isLegacyGameState(value) || !('activeVehicleId' in value)) return false;
  return value.ownedVehicles.length === 0 ? value.activeVehicleId === null
    : isText(value.activeVehicleId) && value.ownedVehicles.some((v) => v.instanceId === value.activeVehicleId);
}
function isGameStateV3(value: unknown): value is LegacyGameStateV3 {
  if (!isGameStateV2(value) || !('economy' in value) || !isEconomyState(value.economy, value.ownedVehicles)) return false;
  return value.selectedStarterId !== null || (value.economy.activeJob === null && value.economy.completedJobs === 0);
}
function isGameStateV4(value: unknown): value is LegacyGameStateV4 {
  return isGameStateV3(value) && value.ownedVehicles.every(isPlayerVehicle);
}
function isGameStateV5(value: unknown): value is LegacyGameStateV5 {
  if (!isGameStateV4(value) || !('racing' in value) || !isRacingState(value.racing, value.ownedVehicles)) return false;
  if (value.racing.activeRace && value.economy.activeJob) return false;
  return value.selectedStarterId !== null || value.racing.nextRunId === 1;
}
export function isGameState(value: unknown): value is GameState {
  if (!isGameStateV5(value) || !('market' in value) || !isMarketState(value.market)) return false;
  return value.selectedStarterId !== null || (value.market.nextTradeId === 1 && value.market.batch === 1);
}
export function createSaveEnvelope(state: GameState, savedAt = Date.now()): SaveEnvelope {
  if (!isGameState(state)) throw new Error('Save game state is invalid.');
  if (!isInteger(savedAt)) throw new Error('Save timestamp is invalid.');
  return { version: SAVE_VERSION, savedAt, state };
}
export function serializeSave(state: GameState, savedAt = Date.now()): string {
  const raw = JSON.stringify(createSaveEnvelope(state, savedAt));
  if (raw.length > MAX_SAVE_LENGTH) throw new Error('Save data is too large.');
  return raw;
}
export function deserializeSave(raw: string): SaveEnvelope {
  if (raw.length > MAX_SAVE_LENGTH) throw new Error('Save data is too large.');
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { throw new Error('Save data is not valid JSON.'); }
  if (!isRecord(parsed)) throw new Error('Save data is invalid.');
  if (![1, 2, 3, 4, 5, SAVE_VERSION].includes(parsed.version as number)) {
    throw new Error(`Unsupported save version: ${String(parsed.version)}. Your stored data has not been deleted.`);
  }
  if (!isInteger(parsed.savedAt)) throw new Error('Save timestamp is invalid.');
  let state: unknown = parsed.state;
  if (parsed.version === 1) {
    if (!isLegacyGameState(state)) throw new Error('Legacy save game state is invalid.');
    state = { ...state, activeVehicleId: state.ownedVehicles[0]?.instanceId ?? null };
  }
  if (parsed.version === 1 || parsed.version === 2) {
    if (!isGameStateV2(state)) throw new Error('Legacy v2 save game state is invalid.');
    state = { ...state, economy: createEconomyState() };
  }
  if (parsed.version === 1 || parsed.version === 2 || parsed.version === 3) {
    if (!isGameStateV3(state)) throw new Error('Legacy v3 save game state is invalid.');
    state = { ...state, ownedVehicles: state.ownedVehicles.map((vehicle) => ({ ...vehicle, tuning: createVehicleTuning() })) };
  }
  if ([1, 2, 3, 4].includes(parsed.version as number)) {
    if (!isGameStateV4(state)) throw new Error('Legacy v4 save game state is invalid.');
    // Existing tuned builds, balances, pending jobs and receipts are untouched. No retrospective races or rewards.
    state = { ...state, racing: createRacingState() };
  }
  if (parsed.version !== SAVE_VERSION) {
    if (!isGameStateV5(state)) throw new Error('Legacy v5 save game state is invalid.');
    // Keep every prior vehicle, job and race snapshot intact. Add listings, not free owned cars.
    state = { ...state, market: createMarketState() };
  }
  if (!isGameState(state)) throw new Error('Save game state is invalid.');
  return { version: SAVE_VERSION, savedAt: parsed.savedAt, state };
}
export function exportSaveCode(state: GameState, savedAt = Date.now()): string {
  const code = `${SAVE_CODE_PREFIX}${encodeBase64Url(serializeSave(state, savedAt))}`;
  if (code.length > MAX_SAVE_LENGTH) throw new Error('Save code is too large.');
  return code;
}
export function importSaveCode(code: string): SaveEnvelope {
  if (code.length > MAX_SAVE_LENGTH) throw new Error('Save code is too large.');
  const trimmed = code.trim();
  if (!trimmed.startsWith(SAVE_CODE_PREFIX)) throw new Error('This is not a KAGEHAMA save code.');
  const payload = trimmed.slice(SAVE_CODE_PREFIX.length);
  if (!payload) throw new Error('Save code is empty.');
  return deserializeSave(decodeBase64Url(payload));
}
export function saveToStorage(storage: Pick<Storage, 'setItem'>, state: GameState): void { storage.setItem(SAVE_STORAGE_KEY, serializeSave(state)); }
export function loadFromStorage(storage: Pick<Storage, 'getItem'>): SaveEnvelope | null {
  const raw = storage.getItem(SAVE_STORAGE_KEY); return raw === null ? null : deserializeSave(raw);
}
export function clearStorage(storage: Pick<Storage, 'removeItem'>): void { storage.removeItem(SAVE_STORAGE_KEY); }
