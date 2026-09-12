import { BASE_GARAGE_CAPACITY, GARAGE_EXPANSIONS } from '../data/businesses';
import type { EmpireState } from './empireTypes';
import type { AdvancedState } from './advancedTypes';
import type { PlayerVehicle } from './types';

type CapacityState = { ownedVehicles: readonly PlayerVehicle[]; advanced?: AdvancedState; empire?: EmpireState };
export function getGarageCapacity(state: Pick<CapacityState, 'empire'>): number {
  return GARAGE_EXPANSIONS.find((e) => e.level === state.empire?.garageExpansionLevel)?.capacity ?? BASE_GARAGE_CAPACITY;
}
/** A fully paid incoming car must retain a space even while the player shops elsewhere. */
export function getReservedVehicleIds(state: CapacityState): string[] {
  const vehicle = state.advanced?.activeContract?.vehicle;
  return vehicle ? [vehicle.instanceId] : [];
}
export const getOccupiedGarageSpaces = (state: CapacityState) => state.ownedVehicles.length + getReservedVehicleIds(state).length;
