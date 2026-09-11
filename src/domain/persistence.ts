import type { GameState, PlayerVehicle } from './types';

export const SAVE_VERSION = 1;
export const SAVE_STORAGE_KEY = 'kagehama:save';
export const SAVE_CODE_PREFIX = 'KAGEHAMA1-';

export type SaveEnvelope = {
  version: number;
  savedAt: number;
  state: GameState;
};

const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function encodeBase64Url(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let output = '';

  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i] ?? 0;
    const b = bytes[i + 1] ?? 0;
    const c = bytes[i + 2] ?? 0;
    const value = (a << 16) | (b << 8) | c;

    output += BASE64_ALPHABET[(value >> 18) & 63];
    output += BASE64_ALPHABET[(value >> 12) & 63];
    output += i + 1 < bytes.length ? BASE64_ALPHABET[(value >> 6) & 63] : '=';
    output += i + 2 < bytes.length ? BASE64_ALPHABET[value & 63] : '=';
  }

  return output.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function decodeBase64Url(input: string): string {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  const bytes: number[] = [];

  for (let i = 0; i < padded.length; i += 4) {
    const chars = padded.slice(i, i + 4);
    const values = chars.split('').map((char) => (char === '=' ? 0 : BASE64_ALPHABET.indexOf(char)));
    if (values.some((value, index) => value < 0 && chars[index] !== '=')) throw new Error('Save code contains invalid characters.');

    const value = (values[0] << 18) | (values[1] << 12) | (values[2] << 6) | values[3];
    bytes.push((value >> 16) & 255);
    if (chars[2] !== '=') bytes.push((value >> 8) & 255);
    if (chars[3] !== '=') bytes.push(value & 255);
  }

  return new TextDecoder().decode(new Uint8Array(bytes));
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isPlayerVehicle(value: unknown): value is PlayerVehicle {
  if (!value || typeof value !== 'object') return false;
  const vehicle = value as Partial<PlayerVehicle>;
  return (
    typeof vehicle.instanceId === 'string' &&
    typeof vehicle.catalogId === 'string' &&
    typeof vehicle.name === 'string' &&
    typeof vehicle.engine === 'string' &&
    (vehicle.drive === 'FWD' || vehicle.drive === 'RWD') &&
    isFiniteNumber(vehicle.year) &&
    isFiniteNumber(vehicle.hp) &&
    isFiniteNumber(vehicle.weightKg) &&
    isFiniteNumber(vehicle.odometerKm) &&
    isFiniteNumber(vehicle.engineCondition) &&
    isFiniteNumber(vehicle.bodyCondition) &&
    isFiniteNumber(vehicle.transmissionCondition) &&
    isFiniteNumber(vehicle.originality) &&
    Array.isArray(vehicle.installedParts) &&
    vehicle.installedParts.every((part) => typeof part === 'string')
  );
}

export function isGameState(value: unknown): value is GameState {
  if (!value || typeof value !== 'object') return false;
  const state = value as Partial<GameState>;
  return (
    isFiniteNumber(state.cashYen) &&
    state.cashYen >= 0 &&
    isFiniteNumber(state.playerLevel) &&
    state.playerLevel >= 1 &&
    isFiniteNumber(state.reputation) &&
    state.reputation >= 0 &&
    (state.selectedStarterId === null || typeof state.selectedStarterId === 'string') &&
    Array.isArray(state.ownedVehicles) &&
    state.ownedVehicles.every(isPlayerVehicle)
  );
}

export function createSaveEnvelope(state: GameState, savedAt = Date.now()): SaveEnvelope {
  return { version: SAVE_VERSION, savedAt, state };
}

export function serializeSave(state: GameState, savedAt = Date.now()): string {
  return JSON.stringify(createSaveEnvelope(state, savedAt));
}

export function deserializeSave(raw: string): SaveEnvelope {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Save data is not valid JSON.');
  }

  if (!parsed || typeof parsed !== 'object') throw new Error('Save data is invalid.');
  const envelope = parsed as Partial<SaveEnvelope>;
  if (envelope.version !== SAVE_VERSION) throw new Error(`Unsupported save version: ${String(envelope.version)}.`);
  if (!isFiniteNumber(envelope.savedAt)) throw new Error('Save timestamp is invalid.');
  if (!isGameState(envelope.state)) throw new Error('Save game state is invalid.');

  return envelope as SaveEnvelope;
}

export function exportSaveCode(state: GameState, savedAt = Date.now()): string {
  return `${SAVE_CODE_PREFIX}${encodeBase64Url(serializeSave(state, savedAt))}`;
}

export function importSaveCode(code: string): SaveEnvelope {
  const trimmed = code.trim();
  if (!trimmed.startsWith(SAVE_CODE_PREFIX)) throw new Error('This is not a KAGEHAMA v1 save code.');
  const payload = trimmed.slice(SAVE_CODE_PREFIX.length);
  if (!payload) throw new Error('Save code is empty.');

  try {
    return deserializeSave(decodeBase64Url(payload));
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error('Save code could not be decoded.');
  }
}

export function saveToStorage(storage: Pick<Storage, 'setItem'>, state: GameState): void {
  storage.setItem(SAVE_STORAGE_KEY, serializeSave(state));
}

export function loadFromStorage(storage: Pick<Storage, 'getItem'>): SaveEnvelope | null {
  const raw = storage.getItem(SAVE_STORAGE_KEY);
  if (!raw) return null;
  return deserializeSave(raw);
}

export function clearStorage(storage: Pick<Storage, 'removeItem'>): void {
  storage.removeItem(SAVE_STORAGE_KEY);
}
