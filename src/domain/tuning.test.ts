import { describe, expect, it } from 'vitest';
import { findPart, isPartCompatible, PARTS } from '../data/parts';
import { STARTER_CARS } from '../data/starters';
import { createNewGameState, createPlayerVehicle, purchaseStarter } from './game';
import { claimJob, startJob } from './economy';
import { listGarageVehicles } from './garage';
import { createVehicleTuning, getFittedPartNames, getPartRequirement, getVehicleBuildStats, installPart, isVehicleTuning, previewPart, removePart } from './tuning';
import { TUNING_SLOTS } from './tuningTypes';
import type { GameState } from './types';
const rich = (id = 'pico-rs'): GameState => ({ ...purchaseStarter(createNewGameState(), id, 'car-1'), playerLevel: 5, reputation: 200, cashYen: 500000 });
const fit = (state: GameState, id: string) => installPart(state, 'car-1', id, state.ownedVehicles[0].tuning.installedBySlot[findPart(id)!.slot] ?? null);

describe('Part catalog and independent vehicle inventory', () => {
  it('has fourteen unique parts across eight slots with safe prices and levels', () => {
    expect(PARTS).toHaveLength(14); expect(new Set(PARTS.map((p) => p.id)).size).toBe(14);
    expect(new Set(PARTS.map((p) => p.slot)).size).toBe(8);
    for (const part of PARTS) { expect(Number.isSafeInteger(part.priceYen)).toBe(true); expect(part.priceYen).toBeGreaterThan(0); expect(part.minLevel).toBeGreaterThanOrEqual(1); expect(TUNING_SLOTS).toContain(part.slot); }
  });
  it('keeps factory catalog and per-car tuning arrays independent', () => {
    const a = createPlayerVehicle('pico-rs', 'a'); const b = createPlayerVehicle('pico-rs', 'b');
    a.tuning.purchasedPartIds.push('aoba-panel-filter'); expect(b.tuning).toEqual(createVehicleTuning()); expect(STARTER_CARS[0].hp).toBe(105);
  });
  it.each(PARTS)('installs $id for its exact price, independently of stored base stats', (part) => {
    const before = rich(part.compatibleCatalogIds[0]); const snapshot = structuredClone(before);
    const after = fit(before, part.id);
    expect(after.cashYen).toBe(before.cashYen - part.priceYen);
    expect(after.ownedVehicles[0].tuning.installedBySlot[part.slot]).toBe(part.id);
    expect(after.ownedVehicles[0].tuning.purchasedPartIds).toEqual([part.id]);
    const { tuning: _tuning, ...base } = after.ownedVehicles[0]; const { tuning: _old, ...original } = before.ownedVehicles[0];
    expect(base).toEqual(original); expect(before).toEqual(snapshot); expect(after.economy).toEqual(before.economy);
  });
});
describe('Derived stats and reversible builds', () => {
  it.each(STARTER_CARS)('preserves $id factory power and weight with no fitted upgrades', (car) => {
    const v = createPlayerVehicle(car.id, 'stock'); const s = getVehicleBuildStats(v);
    expect(s.powerPs).toBe(car.hp); expect(s.weightKg).toBe(car.weightKg); expect(s.originality).toBe(car.originality);
  });
  it('adds power basis points before rounding exactly once', () => {
    let state = fit(rich(), 'aoba-panel-filter'); state = fit(state, 'aoba-catback');
    expect(getVehicleBuildStats(state.ownedVehicles[0]).powerPs).toBe(119);
    expect(state.ownedVehicles[0].hp).toBe(105);
  });
  it('preview is pure and matches the fitted build', () => {
    const state = rich(); const part = findPart('senka-lightweight-kit')!; const before = structuredClone(state);
    expect(previewPart(state.ownedVehicles[0], part)).toEqual(getVehicleBuildStats(fit(state, part.id).ownedVehicles[0]));
    expect(state).toEqual(before);
  });
  it('replacement does not stack same-slot effects and retains both purchases', () => {
    let state = fit(rich(), 'aoba-balanced-ecu'); state = fit(state, 'kurogane-attack-ecu');
    expect(getVehicleBuildStats(state.ownedVehicles[0]).powerPs).toBe(120);
    expect(state.ownedVehicles[0].tuning.purchasedPartIds).toHaveLength(2);
    const cash = state.cashYen; state = fit(state, 'aoba-balanced-ecu');
    expect(state.cashYen).toBe(cash); expect(getVehicleBuildStats(state.ownedVehicles[0]).powerPs).toBe(111);
  });
  it('removing and refitting cannot compound stats, refund money or repeat purchases', () => {
    const base = rich(); let state = fit(base, 'senka-lightweight-kit'); const cash = state.cashYen;
    for (let i = 0; i < 20; i++) {
      expect(getVehicleBuildStats(state.ownedVehicles[0]).weightKg).toBe(825);
      state = removePart(state, 'car-1', 'weight', 'senka-lightweight-kit');
      expect(getVehicleBuildStats(state.ownedVehicles[0])).toEqual(getVehicleBuildStats(base.ownedVehicles[0]));
      state = fit(state, 'senka-lightweight-kit');
    }
    expect(state.cashYen).toBe(cash); expect(state.ownedVehicles[0].tuning.purchasedPartIds).toHaveLength(1);
  });
  it('big turbo trades handling and reliability for power and weight', () => {
    const state = rich('rz-t'); const old = getVehicleBuildStats(state.ownedVehicles[0]);
    const next = getVehicleBuildStats(fit(state, 'kurogane-big-turbo').ownedVehicles[0]);
    expect(next.powerPs).toBeGreaterThan(old.powerPs); expect(next.weightKg).toBeGreaterThan(old.weightKg);
    expect(next.handling).toBeLessThan(old.handling); expect(next.reliability).toBeLessThan(old.reliability);
  });
  it('shows fitted names instead of replaced factory names', () => {
    const v = fit(rich(), 'aoba-panel-filter').ownedVehicles[0];
    expect(getFittedPartNames(v)).toContain('Panel Filter'); expect(getFittedPartNames(v)).not.toContain('Factory intake');
    expect(v.installedParts).toContain('Factory intake');
  });
  it('sorts garage power using the build rather than factory power', () => {
    let state = fit(rich(), 'aoba-panel-filter'); state = fit(state, 'kurogane-attack-ecu');
    const other = createPlayerVehicle('tora-85', 'other');
    expect(listGarageVehicles([other, state.ownedVehicles[0]], '', 'power')[0].instanceId).toBe('car-1');
  });
});
describe('Transaction guards', () => {
  it('rejects double installation and stale expected slot without changing input', () => {
    const state = fit(rich(), 'aoba-panel-filter'); const snapshot = structuredClone(state);
    expect(() => installPart(state, 'car-1', 'aoba-panel-filter', null)).toThrow('build changed');
    expect(() => fit(state, 'aoba-panel-filter')).toThrow('Already installed'); expect(state).toEqual(snapshot);
  });
  it.each([0, 5999, -1, NaN, Infinity, 6000.5])('rejects insufficient or invalid cash %s', (cashYen) => {
    expect(() => fit({ ...rich(), cashYen }, 'aoba-panel-filter')).toThrow();
  });
  it('allows exact cash and free refitting with zero balance', () => {
    let state = fit({ ...rich(), cashYen: 6000 }, 'aoba-panel-filter'); expect(state.cashYen).toBe(0);
    state = removePart(state, 'car-1', 'intake', 'aoba-panel-filter'); expect(fit(state, 'aoba-panel-filter').cashYen).toBe(0);
  });
  it('rejects unowned cars, unknown parts and unearned level gates', () => {
    expect(() => installPart(rich(), 'ghost', 'aoba-panel-filter', null)).toThrow('own');
    expect(() => installPart(rich(), 'car-1', 'ghost', null)).toThrow('Unknown');
    expect(() => fit({ ...rich(), playerLevel: 1 }, 'aoba-catback')).toThrow('Level 2');
  });
  it.each(['pico-rs', 'tora-85'])('rejects turbo upgrades on %s', (id) => {
    const state = rich(id); expect(isPartCompatible(findPart('kurogane-big-turbo')!, id)).toBe(false);
    expect(() => fit(state, 'kurogane-big-turbo')).toThrow('compatible');
  });
  it('locks both installation and removal on a delivery-assigned car, not the newly active car', () => {
    let state = fit(rich(), 'aoba-panel-filter'); state.ownedVehicles.push(createPlayerVehicle('rz-t', 'car-2'));
    state = startJob(state, 'parts-run', 1000); state = { ...state, activeVehicleId: 'car-2' };
    expect(() => fit(state, 'aoba-catback')).toThrow('assigned');
    expect(() => removePart(state, 'car-1', 'intake', 'aoba-panel-filter')).toThrow('assigned');
    expect(installPart(state, 'car-2', 'aoba-panel-filter', null).ownedVehicles[1].tuning.purchasedPartIds).toHaveLength(1);
    expect(fit(claimJob(state, 1, 31000), 'aoba-catback')).toBeDefined();
  });
  it('allows tuning during an on-foot shift without changing its deadline or reward', () => {
    const pending = startJob(rich(), 'garage-shift', 1000); const tuned = fit(pending, 'aoba-panel-filter');
    expect(tuned.economy).toEqual(pending.economy); expect(claimJob(tuned, 1, 16000).cashYen).toBe(tuned.cashYen + 1500);
  });
  it('rejects stale removal and does not transfer purchased ownership to a duplicate model', () => {
    const state = fit(rich(), 'aoba-panel-filter'); state.ownedVehicles.push(createPlayerVehicle('pico-rs', 'copy'));
    expect(() => removePart(state, 'car-1', 'intake', 'senka-cold-air')).toThrow('no longer');
    expect(installPart(state, 'copy', 'aoba-panel-filter', null).cashYen).toBe(state.cashYen - 6000);
  });
  it('blocks safe-integer power overflow before charging', () => {
    const state = rich(); state.ownedVehicles[0].hp = Number.MAX_SAFE_INTEGER;
    expect(() => fit(state, 'aoba-panel-filter')).toThrow('safe range'); expect(state.cashYen).toBe(500000);
  });
  it('requirements match the domain rejection', () => {
    const state = { ...rich(), cashYen: 0 }; const part = PARTS[0];
    expect(() => fit(state, part.id)).toThrow(getPartRequirement(state, state.ownedVehicles[0], part)!);
  });
});
describe('Tuning validation', () => {
  it('accepts empty and valid owned/fitted records', () => {
    expect(isVehicleTuning(createVehicleTuning(), 'pico-rs')).toBe(true);
    expect(isVehicleTuning(fit(rich(), 'aoba-panel-filter').ownedVehicles[0].tuning, 'pico-rs')).toBe(true);
  });
  it.each([
    null, {}, { purchasedPartIds: ['unknown'], installedBySlot: {} },
    { purchasedPartIds: ['aoba-panel-filter', 'aoba-panel-filter'], installedBySlot: {} },
    { purchasedPartIds: [], installedBySlot: { intake: 'aoba-panel-filter' } },
    { purchasedPartIds: ['aoba-panel-filter'], installedBySlot: { turbo: 'aoba-panel-filter' } },
    { purchasedPartIds: ['aoba-panel-filter'], installedBySlot: { ghost: 'aoba-panel-filter' } },
    { purchasedPartIds: ['kurogane-big-turbo'], installedBySlot: {} },
    { purchasedPartIds: ['aoba-panel-filter'], installedBySlot: [] },
  ])('rejects malformed or incompatible data %j', (value) => expect(isVehicleTuning(value, 'pico-rs')).toBe(false));
});
