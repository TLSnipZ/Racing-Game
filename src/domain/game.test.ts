import { createEmpireState } from './empireState';
import { createAdvancedState } from './advancedState';
import { createEmptyCollectionState } from './collectionProgress';
import { createHeatState } from './heat';
import { createMarketState } from './marketStock';
import { describe, expect, it } from 'vitest';
import { STARTER_CARS } from '../data/starters';
import { createEconomyState } from './economy';
import { createRacingState } from './racing';
import { createNewGameState, createPlayerVehicle, purchaseStarter, STARTING_CASH_YEN } from './game';
describe('KAGEHAMA core game', () => {
  it('creates the expected new game state', () => {
    expect(createNewGameState()).toEqual({ cashYen: STARTING_CASH_YEN, playerLevel: 1, reputation: 0,
      selectedStarterId: null, ownedVehicles: [], activeVehicleId: null, economy: createEconomyState(), racing: createRacingState(), heat: createHeatState(), market: createMarketState(), collection: createEmptyCollectionState(), advanced: createAdvancedState(), empire: createEmpireState() });
  });
  it.each([['pico-rs', 18000], ['tora-85', 8000], ['rz-t', 2000]] as const)('buys and activates %s for the real price', (id, cash) => {
    const initial = createNewGameState(); const state = purchaseStarter(initial, id, 'vehicle-001');
    expect(state.cashYen).toBe(cash); expect(state.selectedStarterId).toBe(id);
    expect(state.ownedVehicles).toHaveLength(1); expect(state.activeVehicleId).toBe('vehicle-001'); expect(initial).toEqual(createNewGameState());
  });
  it('prevents choosing a second starter', () => {
    const state = purchaseStarter(createNewGameState(), 'tora-85', 'vehicle-001');
    expect(() => purchaseStarter(state, 'rz-t', 'vehicle-002')).toThrow('already been chosen');
  });
  it('rejects an unknown starter id', () => expect(() => purchaseStarter(createNewGameState(), 'not-a-car', 'vehicle-001')).toThrow('Unknown starter car'));
  it('creates an individual vehicle with condition, mileage, originality and stock parts', () => {
    const vehicle = createPlayerVehicle('rz-t', 'akari-instance-9');
    expect(vehicle).toMatchObject({ instanceId: 'akari-instance-9', catalogId: 'rz-t', engineCondition: 57,
      bodyCondition: 61, transmissionCondition: 56, originality: 88, odometerKm: 189340 }); expect(vehicle.installedParts).toContain('Factory turbo');
  });
  it('keeps independent stock-parts arrays', () => {
    const a = createPlayerVehicle('pico-rs', 'a'); const b = createPlayerVehicle('pico-rs', 'b');
    a.installedParts.push('Test part'); expect(b.installedParts).not.toContain('Test part'); expect(STARTER_CARS[0].stockParts).not.toContain('Test part');
  });
  it.each([0, 31000, NaN, Infinity, -1, 50000.5])('rejects invalid/insufficient cash %s', (cashYen) => expect(() => purchaseStarter({ ...createNewGameState(), cashYen }, 'pico-rs', 'a')).toThrow());
  it('rejects empty vehicle IDs', () => expect(() => createPlayerVehicle('pico-rs', ' ')).toThrow());
});
