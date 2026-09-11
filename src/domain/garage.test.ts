import { describe, expect, it } from 'vitest';
import { createNewGameState, createPlayerVehicle, purchaseStarter } from './game';
import { getActiveVehicle, getConditionLabel, getOverallCondition, getPowerToWeight, listGarageVehicles, selectActiveVehicle } from './garage';

const twoCars = () => {
  const first = purchaseStarter(createNewGameState(), 'pico-rs', 'pico-1');
  return { ...first, ownedVehicles: [...first.ownedVehicles, createPlayerVehicle('rz-t', 'akari-1')] };
};

describe('Garage commands and selectors', () => {
  it('has no active vehicle in a fresh run', () => expect(getActiveVehicle(createNewGameState())).toBeNull());
  it('resolves the active instance rather than the first array entry', () => {
    const state = selectActiveVehicle(twoCars(), 'akari-1');
    expect(getActiveVehicle(state)?.catalogId).toBe('rz-t');
  });
  it('changes only the active ID, with no cost or mutation', () => {
    const initial = twoCars();
    const next = selectActiveVehicle(initial, 'akari-1');
    expect(next).toEqual({ ...initial, activeVehicleId: 'akari-1' });
    expect(initial.activeVehicleId).toBe('pico-1');
    expect(next.ownedVehicles).toBe(initial.ownedVehicles);
  });
  it('is idempotent for the active vehicle', () => {
    const state = twoCars();
    expect(selectActiveVehicle(state, 'pico-1')).toBe(state);
  });
  it('rejects unowned instance IDs without changing the state', () => {
    const state = twoCars();
    const before = JSON.stringify(state);
    expect(() => selectActiveVehicle(state, 'pico-rs')).toThrow('you own');
    expect(JSON.stringify(state)).toBe(before);
  });
  it('averages mechanical/body condition but not originality', () => {
    const car = createPlayerVehicle('rz-t', 'id');
    expect(getOverallCondition(car)).toBe(58);
    expect(getOverallCondition({ ...car, originality: 0 })).toBe(58);
  });
  it.each([[80, 'Good'], [60, 'Used'], [40, 'Worn'], [0, 'Needs attention']] as const)('labels condition %s', (condition, label) => {
    expect(getConditionLabel(condition)).toBe(label);
  });
  it('derives PS per tonne from the saved numbers', () => expect(getPowerToWeight(createPlayerVehicle('pico-rs', 'id'))).toBe(118));
  it('filters names, years and individual IDs case-insensitively', () => {
    const cars = twoCars().ownedVehicles;
    expect(listGarageVehicles(cars, ' AKARI ', 'name')).toHaveLength(1);
    expect(listGarageVehicles(cars, '1994', 'name')[0].instanceId).toBe('pico-1');
    expect(listGarageVehicles(cars, 'akari-1', 'name')[0].catalogId).toBe('rz-t');
    expect(listGarageVehicles(cars, 'nope', 'name')).toEqual([]);
  });
  it('sorts without reordering the saved collection', () => {
    const cars = twoCars().ownedVehicles;
    expect(listGarageVehicles(cars, '', 'power')[0].catalogId).toBe('rz-t');
    expect(listGarageVehicles(cars, '', 'condition')[0].catalogId).toBe('pico-rs');
    expect(listGarageVehicles(cars, '', 'mileage')[0].catalogId).toBe('pico-rs');
    expect(cars[0].catalogId).toBe('pico-rs');
  });
  it('distinguishes duplicate models by instance ID', () => {
    const state = twoCars();
    state.ownedVehicles.push(createPlayerVehicle('pico-rs', 'pico-2'));
    expect(getActiveVehicle(selectActiveVehicle(state, 'pico-2'))?.instanceId).toBe('pico-2');
    expect(listGarageVehicles(state.ownedVehicles, 'Pico', 'name')).toHaveLength(2);
  });
});
