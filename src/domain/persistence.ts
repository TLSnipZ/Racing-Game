import { createAdvancedState } from './advancedState';
import { isAdvancedState, isAdvancedLinked } from './advancedValidation';
import { isCollectionState, migrateCollection } from './collectionProgress';
import { createHeatState } from './heat';
import { isHeatLinked, isHeatState } from './heatValidation';
import { createEconomyState, isEconomyState } from './economy';
import { createVehicleTuning } from './tuning';
import { isRecord, isText, isInteger, isLegacyVehicle, isPlayerVehicle } from './vehicleValidation';
import { createMarketState } from './marketStock';
import { isMarketState } from './marketValidation';
import { createRacingState } from './racing';
import { isRacingState } from './racingValidation';
import type { GameState, LegacyGameStateV1, LegacyGameStateV2, LegacyGameStateV3, LegacyGameStateV4, LegacyGameStateV5, LegacyGameStateV6, LegacyGameStateV7, LegacyGameStateV8 } from './types';

export const SAVE_VERSION = 9;
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
function isGameStateV6(value: unknown): value is LegacyGameStateV6 {
  if (!isGameStateV5(value) || !('market' in value) || !isMarketState(value.market, value.ownedVehicles)) return false;
  return value.selectedStarterId !== null || (value.market.nextTransactionId === 1 && value.market.generation === 0);
}
function isGameStateV7(value: unknown): value is LegacyGameStateV7 {
  return isGameStateV6(value) && 'heat' in value && isHeatState(value.heat)
    && isHeatLinked(value.heat, value.racing, value.economy.activeJob, value.selectedStarterId !== null);
}
function isGameStateV8(value: unknown): value is LegacyGameStateV8 {
  if (!isGameStateV7(value) || !('collection' in value) || !isCollectionState(value.collection)) return false;
  return value.selectedStarterId !== null || Object.values(value.collection).every((ids) => ids.length === 0);
}
export function isGameState(value: unknown): value is GameState {
  return isGameStateV8(value) && 'advanced' in value && isAdvancedState(value.advanced) && isAdvancedLinked(value.advanced, value);
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
  if (![1, 2, 3, 4, 5, 6, 7, 8, SAVE_VERSION].includes(parsed.version as number)) {
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
  if ([1, 2, 3, 4, 5].includes(parsed.version as number)) {
    if (!isGameStateV5(state)) throw new Error('Legacy v5 save game state is invalid.');
    state = { ...state, market: createMarketState(state.ownedVehicles.map((vehicle) => vehicle.instanceId)) };
  }
  if ([1, 2, 3, 4, 5, 6].includes(parsed.version as number)) {
    if (!isGameStateV6(state) || state.racing.activeRace?.heatRisk || state.racing.lastResult?.race.heatRisk) throw new Error('Legacy v6 save game state is invalid.');
    state = { ...state, heat: createHeatState() };
  }
  if ([1, 2, 3, 4, 5, 6, 7].includes(parsed.version as number)) {
    if (!isGameStateV7(state)) throw new Error('Legacy v7 save game state is invalid.');
    state = migrateCollection(state);
  }
  if (parsed.version !== SAVE_VERSION) {
    if (!isGameStateV8(state)) throw new Error('Legacy v8 save game state is invalid.');
    if ('advanced' in state && JSON.stringify(state.advanced) !== JSON.stringify(createAdvancedState())) throw new Error('Legacy save cannot carry a specialist contract or ledger.');
    state = { ...state, advanced: createAdvancedState() };
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
