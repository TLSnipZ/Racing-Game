import { describe, expect, it } from 'vitest';
import { createNewGameState, createPlayerVehicle, purchaseStarter, STARTING_CASH_YEN } from './game';

describe('KAGEHAMA core game', () => {
  it('creates the expected new game state', () => {
    expect(createNewGameState()).toEqual({
      cashYen: STARTING_CASH_YEN,
      playerLevel: 1,
      reputation: 0,
      selectedStarterId: null,
      ownedVehicles: [],
    });
  });

  it('deducts the real starter price and adds exactly one owned vehicle', () => {
    const state = purchaseStarter(createNewGameState(), 'pico-rs', 'vehicle-001');
    expect(state.cashYen).toBe(18000);
    expect(state.selectedStarterId).toBe('pico-rs');
    expect(state.ownedVehicles).toHaveLength(1);
  });

  it('prevents choosing a second starter', () => {
    const state = purchaseStarter(createNewGameState(), 'tora-85', 'vehicle-001');
    expect(() => purchaseStarter(state, 'rz-t', 'vehicle-002')).toThrow('already been chosen');
  });

  it('rejects an unknown starter id', () => {
    expect(() => purchaseStarter(createNewGameState(), 'not-a-car', 'vehicle-001')).toThrow('Unknown starter car');
  });

  it('creates an individual vehicle with condition, mileage, originality and stock parts', () => {
    const vehicle = createPlayerVehicle('rz-t', 'akari-instance-9');
    expect(vehicle.instanceId).toBe('akari-instance-9');
    expect(vehicle.catalogId).toBe('rz-t');
    expect(vehicle.odometerKm).toBeGreaterThan(0);
    expect(vehicle.engineCondition).toBe(57);
    expect(vehicle.bodyCondition).toBe(61);
    expect(vehicle.transmissionCondition).toBe(56);
    expect(vehicle.originality).toBe(88);
    expect(vehicle.installedParts).toContain('Factory turbo');
  });
});
