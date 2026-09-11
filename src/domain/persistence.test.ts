import { Buffer } from 'node:buffer';
import { describe, expect, it } from 'vitest';
import legacy from '../../tests/fixtures/save-v1.json';
import legacyV2 from '../../tests/fixtures/save-v2.json';
import legacyV3 from '../../tests/fixtures/save-v3.json';
import { createNewGameState, createPlayerVehicle, purchaseStarter } from './game';
import { claimJob, createEconomyState, startJob } from './economy';
import { createVehicleTuning, getVehicleBuildStats, installPart } from './tuning';
import { clearStorage, deserializeSave, exportSaveCode, importSaveCode, isGameState, loadFromStorage, MAX_SAVE_LENGTH,
  SAVE_CODE_PREFIX, SAVE_STORAGE_KEY, SAVE_VERSION, saveToStorage, serializeSave } from './persistence';
const purchased = () => purchaseStarter(createNewGameState(), 'pico-rs', 'first');
const raw = (state: unknown, version: number = SAVE_VERSION) => JSON.stringify({ version, savedAt: 1234, state });
const storage = () => {
  const values = new Map<string, string>();
  return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } };
};
describe('Save v4 and historical compatibility', () => {
  it('round-trips a new game', () => expect(deserializeSave(serializeSave(createNewGameState(), 1234)).state).toEqual(createNewGameState()));
  it('round-trips the active second vehicle and all per-instance data', () => {
    const state = purchased(); state.ownedVehicles.push(createPlayerVehicle('rz-t', 'second')); state.activeVehicleId = 'second';
    expect(importSaveCode(exportSaveCode(state, 1234))).toEqual({ version: SAVE_VERSION, savedAt: 1234, state });
  });
  it('keeps the portable transport prefix unchanged', () => expect(exportSaveCode(purchased())).toMatch(/^KAGEHAMA1-/));
  it('migrates the actual Phase 2 shape without losing any original field', () => {
    const before = JSON.stringify(legacy); const result = deserializeSave(before);
    expect(result).toEqual({ ...legacy, version: SAVE_VERSION, state: { ...legacy.state, activeVehicleId: 'legacy-pico-001', economy: createEconomyState(),
      ownedVehicles: legacy.state.ownedVehicles.map((car) => ({ ...car, tuning: createVehicleTuning() })) } });
    expect(JSON.stringify(legacy)).toBe(before);
  });
  it('migrates a fixed v2 fixture without a reward, reset or changed active car', () => {
    const before = JSON.stringify(legacyV2); const result = deserializeSave(before);
    expect(result).toEqual({ ...legacyV2, version: SAVE_VERSION, state: { ...legacyV2.state, economy: createEconomyState(),
      ownedVehicles: legacyV2.state.ownedVehicles.map((car) => ({ ...car, tuning: createVehicleTuning() })) } });
    expect(JSON.stringify(legacyV2)).toBe(before);
  });
  it('preserves a second active car and valid legacy levels in v2', () => {
    const state = purchased(); state.ownedVehicles.push(createPlayerVehicle('rz-t', 'second')); state.activeVehicleId = 'second'; state.playerLevel = 7; state.reputation = 100;
    const { economy: _economy, ...old } = state; expect(deserializeSave(raw(old, 2)).state).toEqual(state);
  });
  it.each([legacy, legacyV2])('imports old schema $version codes without a new prefix', (fixture) => {
    const code = SAVE_CODE_PREFIX + Buffer.from(JSON.stringify(fixture), 'utf8').toString('base64url');
    expect(importSaveCode(code).state.economy).toEqual(createEconomyState()); expect(importSaveCode(code).state.cashYen).toBe(fixture.state.cashYen);
  });
  it('migrates an empty v1 save to a null active ID and empty economy', () => {
    const { activeVehicleId: _id, economy: _economy, ...old } = createNewGameState(); expect(deserializeSave(raw(old, 1)).state).toEqual(createNewGameState());
  });
  it('keeps Unicode names in codes', () => {
    const state = purchased(); state.ownedVehicles[0].name = '影浜 • ナイト 🏎️'; expect(importSaveCode(exportSaveCode(state)).state).toEqual(state);
  });
  it('accepts whitespace outside a copied code', () => expect(importSaveCode(` \n${exportSaveCode(purchased())}\n `).state).toEqual(purchased()));
  it.each(['', 'wrong', 'KAGEHAMA1-', 'KAGEHAMA1-!', 'KAGEHAMA1-A'])('rejects malformed code %s', (code) => expect(() => importSaveCode(code)).toThrow());
  it('rejects oversized input before decoding', () => expect(() => importSaveCode('x'.repeat(MAX_SAVE_LENGTH + 1))).toThrow('too large'));
  it('rejects a future version rather than silently downgrading it', () => expect(() => deserializeSave(raw(purchased(), 99))).toThrow('Unsupported save version'));
  it('rejects broken JSON', () => expect(() => deserializeSave('{broken')).toThrow('valid JSON'));
  it.each([-1, 1.5, Number.MAX_SAFE_INTEGER + 1])('rejects invalid yen %s', (cashYen) => expect(() => deserializeSave(raw({ ...purchased(), cashYen }))).toThrow());
  it('rejects an active ID not owned by the player', () => expect(isGameState({ ...purchased(), activeVehicleId: 'not-owned' })).toBe(false));
  it('rejects a missing v2 active ID instead of silently migrating v2', () => {
    const { activeVehicleId: _id, economy: _economy, ...state } = purchased(); expect(() => deserializeSave(raw(state, 2))).toThrow();
  });
  it('rejects missing v3 economy rather than inventing it', () => {
    const { economy: _economy, ...state } = purchased(); expect(() => deserializeSave(raw(state, 3))).toThrow();
  });
  it('requires null active ID for an empty garage', () => expect(isGameState({ ...createNewGameState(), activeVehicleId: 'ghost' })).toBe(false));
  it('rejects duplicate instance IDs', () => {
    const state = purchased(); state.ownedVehicles.push({ ...state.ownedVehicles[0] }); expect(() => deserializeSave(raw(state))).toThrow();
  });
  it.each(['engineCondition', 'bodyCondition', 'transmissionCondition', 'originality'] as const)('rejects impossible %s', (key) => {
    const state = purchased(); state.ownedVehicles[0][key] = 101; expect(isGameState(state)).toBe(false);
  });
  it('rejects zero vehicle weight', () => {
    const state = purchased(); state.ownedVehicles[0].weightKg = 0; expect(isGameState(state)).toBe(false);
  });
  it('does not leak mutable objects between independent decoded saves', () => {
    const code = exportSaveCode(purchased()); const first = importSaveCode(code); first.state.ownedVehicles[0].installedParts.push('X');
    expect(importSaveCode(code).state.ownedVehicles[0].installedParts).not.toContain('X');
  });
  it('round-trips pending and completed jobs including deadlines and receipts', () => {
    const pending = startJob(purchased(), 'garage-shift', 1000); expect(importSaveCode(exportSaveCode(pending, 1234)).state).toEqual(pending);
    const paid = claimJob(pending, 1, 16000); expect(deserializeSave(serializeSave(paid, 17000)).state).toEqual(paid);
  });
  it('migration and decoding do not claim a completed wall-clock timer', () => {
    const pending = startJob(purchased(), 'garage-shift', 1000); const result = deserializeSave(serializeSave(pending, 2_000_000));
    expect(result.state.cashYen).toBe(18000); expect(result.state.economy.activeJob?.runId).toBe(1);
  });
  it.each([{ runId: 99 }, { jobId: 'unknown' }, { startedAtMs: -1 }, { finishesAtMs: 1000 }, { rewardYen: -1 }, { reputationReward: 1.5 }, { distanceKm: -1 }, { vehicleId: 'ghost' }])('rejects malformed active job %j', (patch) => {
    const state = startJob(purchased(), 'garage-shift', 1000);
    expect(() => deserializeSave(raw({ ...state, economy: { ...state.economy, activeJob: { ...state.economy.activeJob, ...patch } } }))).toThrow();
  });
  it('rejects an unowned delivery vehicle', () => {
    const state = startJob({ ...purchased(), playerLevel: 2, reputation: 20 }, 'parts-run', 1000); state.economy.activeJob!.vehicleId = 'ghost'; expect(isGameState(state)).toBe(false);
  });
  it.each([{ nextRunId: 0 }, { completedJobs: -1 }, { totalEarnedYen: 1.5 }, { completedJobs: 1 }, { activeJob: undefined }])('rejects invalid economy counters %j', (patch) => {
    expect(isGameState({ ...purchased(), economy: { ...createEconomyState(), ...patch } })).toBe(false);
  });
  it('rejects malformed receipts and replayed active run IDs', () => {
    const paid = claimJob(startJob(purchased(), 'garage-shift', 1000), 1, 16000); const state = startJob(paid, 'garage-shift', 20000);
    state.economy.lastReceipt!.runId = 2; expect(isGameState(state)).toBe(false); paid.economy.lastReceipt!.levelAfter = 0; expect(isGameState(paid)).toBe(false);
  });
});
describe('Save v4 tuning migration and invalid imports', () => {
  it('preserves a fixed v3 pending delivery, previous receipt, car and balance exactly', () => {
    const before = JSON.stringify(legacyV3); const result = deserializeSave(before);
    expect(result.version).toBe(4); expect(result.savedAt).toBe(legacyV3.savedAt);
    expect(result.state).toEqual({ ...legacyV3.state, ownedVehicles: legacyV3.state.ownedVehicles.map((v) => ({ ...v, tuning: createVehicleTuning() })) });
    expect(JSON.stringify(legacyV3)).toBe(before);
  });
  it('keeps v3 portable codes and jobs without claiming rewards', () => {
    const code = SAVE_CODE_PREFIX + Buffer.from(JSON.stringify(legacyV3)).toString('base64url');
    const state = importSaveCode(code).state; expect(state.economy).toEqual(legacyV3.state.economy); expect(state.cashYen).toBe(15500);
  });
  it('round-trips purchased and installed parts without compounding power', () => {
    const state = installPart(purchased(), 'first', 'aoba-panel-filter', null);
    let restored = state;
    for (let i = 0; i < 20; i++) restored = importSaveCode(exportSaveCode(restored)).state;
    expect(restored).toEqual(state); expect(restored.ownedVehicles[0].hp).toBe(105); expect(getVehicleBuildStats(restored.ownedVehicles[0]).powerPs).toBe(110);
  });
  it.each([undefined, null, {}, { purchasedPartIds: [], installedBySlot: { intake: 'aoba-panel-filter' } },
    { purchasedPartIds: ['unknown'], installedBySlot: {} }, { purchasedPartIds: ['aoba-panel-filter'], installedBySlot: { tires: 'aoba-panel-filter' } },
    { purchasedPartIds: ['kurogane-big-turbo'], installedBySlot: { turbo: 'kurogane-big-turbo' } }])('rejects bad v4 tuning instead of resetting it %j', (tuning) => {
    const state = purchased(); expect(() => deserializeSave(raw({ ...state, ownedVehicles: [{ ...state.ownedVehicles[0], tuning }] }))).toThrow();
  });
  it('migrates empty saves from v1, v2 and v3 with no phantom purchases', () => {
    for (const version of [1, 2, 3]) expect(deserializeSave(raw(createNewGameState(), version)).state).toEqual(createNewGameState());
  });
  it('preserves unfamiliar historical factory parts without treating them as purchased upgrades', () => {
    const old = structuredClone(legacyV3); old.state.ownedVehicles[0].installedParts.push('Historical custom label');
    const v = deserializeSave(JSON.stringify(old)).state.ownedVehicles[0]; expect(v.installedParts).toContain('Historical custom label'); expect(v.tuning).toEqual(createVehicleTuning());
  });
});
describe('Browser storage contract', () => {
  it('loads null only when there is no save', () => expect(loadFromStorage(storage())).toBeNull());
  it('writes and loads a saved state', () => { const s = storage(); saveToStorage(s, purchased()); expect(loadFromStorage(s)?.state).toEqual(purchased()); });
  it.each([legacy, legacyV2])('reads schema $version without overwriting it during loading', (fixture) => {
    const s = storage(); const old = JSON.stringify(fixture); s.setItem(SAVE_STORAGE_KEY, old);
    expect(loadFromStorage(s)?.state.economy).toEqual(createEconomyState()); expect(s.getItem(SAVE_STORAGE_KEY)).toBe(old);
  });
  it('reads v3 without overwriting the source data', () => { const s = storage(); const old = JSON.stringify(legacyV3); s.setItem(SAVE_STORAGE_KEY, old); loadFromStorage(s); expect(s.getItem(SAVE_STORAGE_KEY)).toBe(old); });
  it.each(['', '{broken', raw(purchased(), 99)])('never deletes unreadable data %s', (invalid) => {
    const s = storage(); s.setItem(SAVE_STORAGE_KEY, invalid); expect(() => loadFromStorage(s)).toThrow(); expect(s.getItem(SAVE_STORAGE_KEY)).toBe(invalid);
  });
  it('surfaces a failed write instead of claiming it saved', () => { expect(() => saveToStorage({ setItem() { throw new Error('Quota exceeded'); } }, purchased())).toThrow('Quota'); });
  it('clears only the game key', () => {
    const s = storage(); s.setItem('unrelated', 'keep'); saveToStorage(s, purchased()); clearStorage(s);
    expect(loadFromStorage(s)).toBeNull(); expect(s.getItem('unrelated')).toBe('keep');
  });
});
