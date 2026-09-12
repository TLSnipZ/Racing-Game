import type { AdvancedState } from './advancedTypes';
import type { PlayerVehicle } from './types';

type CapacityState = { ownedVehicles: readonly PlayerVehicle[]; advanced?: AdvancedState };
/** A fully paid incoming car must retain a space even while the player shops elsewhere. */
export function getReservedVehicleIds(state: CapacityState): string[] {
  const vehicle = state.advanced?.activeContract?.vehicle;
  return vehicle ? [vehicle.instanceId] : [];
}
export const getOccupiedGarageSpaces = (state: CapacityState) => state.ownedVehicles.length + getReservedVehicleIds(state).length;
