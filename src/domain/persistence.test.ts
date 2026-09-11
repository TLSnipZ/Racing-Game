import { describe, expect, it } from 'vitest';
import { createNewGameState, purchaseStarter } from './game';
import {
  SAVE_CODE_PREFIX,
  SAVE_STORAGE_KEY,
  clearStorage,
  deserializeSave,
  exportSaveCode,
  importSaveCode,
  loadFromStorage,
  saveToStorage,
  serializeSave,
} from './persistence';

function createOwnedGame() {
  return purchaseStarter(createNewGameState(), 'tora-85', 'vehicle-test-1');
}

function memoryStorage() {
  const data = new Map<string, string>();
  return {
    getItem(key: string) {
      return data.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      data.set(key, value);
    },
    removeItem(key: string) {
      data.delete(key);
    },
  };
}

describe('persistence', () => {
  it('round-trips a version 1 save', () => {
    const state = createOwnedGame();
    const envelope = deserializeSave(serializeSave(state, 123456));

    expect(envelope.version).toBe(1);
    expect(envelope.savedAt).toBe(123456);
    expect(envelope.state).toEqual(state);
  });

  it('exports and imports a KAGEHAMA save code', () => {
    const state = createOwnedGame();
    const code = exportSaveCode(state, 777);

    expect(code.startsWith(SAVE_CODE_PREFIX)).toBe(true);
    expect(importSaveCode(code)).toEqual({ version: 1, savedAt: 777, state });
  });

  it('rejects invalid or unsupported save codes', () => {
    expect(() => importSaveCode('NOPE-123')).toThrow('not a KAGEHAMA');
    expect(() => deserializeSave('{"version":99,"savedAt":1,"state":{}}')).toThrow('Unsupported save version');
  });

  it('saves, loads and clears browser storage', () => {
    const storage = memoryStorage();
    const state = createOwnedGame();

    saveToStorage(storage, state);
    expect(storage.getItem(SAVE_STORAGE_KEY)).not.toBeNull();
    expect(loadFromStorage(storage)?.state).toEqual(state);

    clearStorage(storage);
    expect(loadFromStorage(storage)).toBeNull();
  });

  it('rejects corrupt stored game state', () => {
    const storage = memoryStorage();
    storage.setItem(SAVE_STORAGE_KEY, '{"version":1,"savedAt":1,"state":{"cashYen":-5}}');
    expect(() => loadFromStorage(storage)).toThrow('Save game state is invalid');
  });
});
