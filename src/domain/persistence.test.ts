import { describe, expect, it } from 'vitest';
import legacy from '../../tests/fixtures/save-v1.json';
import { createNewGameState, createPlayerVehicle, purchaseStarter } from './game';
import { clearStorage, deserializeSave, exportSaveCode, importSaveCode, isGameState, loadFromStorage, MAX_SAVE_LENGTH,
  SAVE_CODE_PREFIX, SAVE_STORAGE_KEY, SAVE_VERSION, saveToStorage, serializeSave } from './persistence';

const purchased = () => purchaseStarter(createNewGameState(), 'pico-rs', 'first');
const raw = (state: unknown, version = 2) => JSON.stringify({ version, savedAt: 1234, state });
const storage = () => {
  const values = new Map<string, string>();
  return { getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); } };
};

describe('Save v2 and v1 compatibility', () => {
  it('round-trips a new game', () => expect(deserializeSave(serializeSave(createNewGameState(), 1234)).state).toEqual(createNewGameState()));
  it('round-trips the active second vehicle and all per-instance data', () => {
    const state = purchased();
    state.ownedVehicles.push(createPlayerVehicle('rz-t', 'second'));
    state.activeVehicleId = 'second';
    expect(importSaveCode(exportSaveCode(state, 1234))).toEqual({ version: SAVE_VERSION, savedAt: 1234, state });
  });
  it('keeps the portable transport prefix unchanged', () => expect(exportSaveCode(purchased())).toMatch(/^KAGEHAMA1-/));
  it('migrates the actual Phase 2 shape without losing any original field', () => {
    const before = JSON.stringify(legacy);
    const result = deserializeSave(before);
    expect(result).toEqual({ ...legacy, version: 2, state: { ...legacy.state, activeVehicleId: 'legacy-pico-001' } });
    expect(JSON.stringify(legacy)).toBe(before);
  });
  it('imports an old v1 code without requiring a new prefix', () => {
    const code = SAVE_CODE_PREFIX + Buffer.from(JSON.stringify(legacy), 'utf8').toString('base64url');
    expect(importSaveCode(code).state.activeVehicleId).toBe('legacy-pico-001');
  });
  it('migrates an empty v1 save to a null active ID', () => {
    const { activeVehicleId: _id, ...old } = createNewGameState();
    expect(deserializeSave(raw(old, 1)).state).toEqual(createNewGameState());
  });
  it('keeps Unicode names in codes', () => {
    const state = purchased(); state.ownedVehicles[0].name = '影浜 • ナイト 🏎️';
    expect(importSaveCode(exportSaveCode(state)).state).toEqual(state);
  });
  it('accepts whitespace outside a copied code', () => expect(importSaveCode(` \n${exportSaveCode(purchased())}\n `).state).toEqual(purchased()));
  it.each(['', 'wrong', 'KAGEHAMA1-', 'KAGEHAMA1-!', 'KAGEHAMA1-A'])('rejects malformed code %s', (code) => expect(() => importSaveCode(code)).toThrow());
  it('rejects oversized input before decoding', () => expect(() => importSaveCode('x'.repeat(MAX_SAVE_LENGTH + 1))).toThrow('too large'));
  it('rejects a future version rather than silently downgrading it', () => expect(() => deserializeSave(raw(purchased(), 99))).toThrow('Unsupported save version'));
  it('rejects broken JSON', () => expect(() => deserializeSave('{broken')).toThrow('valid JSON'));
  it.each([-1, 1.5, Number.MAX_SAFE_INTEGER + 1])('rejects invalid yen %s', (cashYen) => {
    expect(() => deserializeSave(raw({ ...purchased(), cashYen }))).toThrow();
  });
  it('rejects an active ID not owned by the player', () => expect(isGameState({ ...purchased(), activeVehicleId: 'not-owned' })).toBe(false));
  it('rejects a missing v2 active ID instead of silently migrating v2', () => {
    const { activeVehicleId: _id, ...state } = purchased();
    expect(() => deserializeSave(raw(state))).toThrow();
  });
  it('requires null active ID for an empty garage', () => expect(isGameState({ ...createNewGameState(), activeVehicleId: 'ghost' })).toBe(false));
  it('rejects duplicate instance IDs', () => {
    const state = purchased(); state.ownedVehicles.push({ ...state.ownedVehicles[0] });
    expect(() => deserializeSave(raw(state))).toThrow();
  });
  it.each(['engineCondition', 'bodyCondition', 'transmissionCondition', 'originality'] as const)('rejects impossible %s', (key) => {
    const state = purchased(); state.ownedVehicles[0][key] = 101;
    expect(isGameState(state)).toBe(false);
  });
  it('rejects zero vehicle weight', () => {
    const state = purchased(); state.ownedVehicles[0].weightKg = 0; expect(isGameState(state)).toBe(false);
  });
  it('does not leak mutable objects between independent decoded saves', () => {
    const code = exportSaveCode(purchased()); const first = importSaveCode(code); first.state.ownedVehicles[0].installedParts.push('X');
    expect(importSaveCode(code).state.ownedVehicles[0].installedParts).not.toContain('X');
  });
});

describe('Browser storage contract', () => {
  it('loads null only when there is no save', () => expect(loadFromStorage(storage())).toBeNull());
  it('writes and loads a saved state', () => {
    const s = storage(); saveToStorage(s, purchased()); expect(loadFromStorage(s)?.state).toEqual(purchased());
  });
  it('reads and migrates v1 without overwriting it during loading', () => {
    const s = storage(); const old = JSON.stringify(legacy); s.setItem(SAVE_STORAGE_KEY, old);
    expect(loadFromStorage(s)?.state.activeVehicleId).toBe('legacy-pico-001');
    expect(s.getItem(SAVE_STORAGE_KEY)).toBe(old);
  });
  it.each(['', '{broken', raw(purchased(), 99)])('never deletes unreadable data %s', (invalid) => {
    const s = storage(); s.setItem(SAVE_STORAGE_KEY, invalid); expect(() => loadFromStorage(s)).toThrow();
    expect(s.getItem(SAVE_STORAGE_KEY)).toBe(invalid);
  });
  it('surfaces a failed write instead of claiming it saved', () => {
    expect(() => saveToStorage({ setItem() { throw new Error('Quota exceeded'); } }, purchased())).toThrow('Quota');
  });
  it('clears only the game key', () => {
    const s = storage(); s.setItem('unrelated', 'keep'); saveToStorage(s, purchased()); clearStorage(s);
    expect(loadFromStorage(s)).toBeNull(); expect(s.getItem('unrelated')).toBe('keep');
  });
});
