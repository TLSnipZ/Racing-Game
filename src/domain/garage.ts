import type { GameState, PlayerVehicle } from './types';

export function getActiveVehicle(state: GameState): PlayerVehicle | null {
  return state.ownedVehicles.find((vehicle) => vehicle.instanceId === state.activeVehicleId) ?? null;
}

/** Viewing a card is UI-only. This is the explicit, persisted active-car command. */
export function selectActiveVehicle(state: GameState, instanceId: string): GameState {
  if (!state.ownedVehicles.some((vehicle) => vehicle.instanceId === instanceId)) {
    throw new Error('You can only activate a vehicle you own.');
  }
  return state.activeVehicleId === instanceId ? state : { ...state, activeVehicleId: instanceId };
}

export function getOverallCondition(vehicle: PlayerVehicle): number {
  return Math.round((vehicle.engineCondition + vehicle.bodyCondition + vehicle.transmissionCondition) / 3);
}

export function getConditionLabel(condition: number): string {
  if (condition >= 80) return 'Good';
  if (condition >= 60) return 'Used';
  if (condition >= 40) return 'Worn';
  return 'Needs attention';
}

/** Informational catalog power-to-weight, not a racing-performance prediction. */
export function getPowerToWeight(vehicle: PlayerVehicle): number {
  return Math.round((vehicle.hp * 1000 / vehicle.weightKg) * 10) / 10;
}

export type GarageSort = 'name' | 'power' | 'condition' | 'mileage';

export function listGarageVehicles(vehicles: readonly PlayerVehicle[], query: string, sort: GarageSort): PlayerVehicle[] {
  const search = query.trim().toLowerCase();
  return vehicles.filter((vehicle) =>
    `${vehicle.name} ${vehicle.year} ${vehicle.instanceId}`.toLowerCase().includes(search),
  ).sort((a, b) => {
    const delta = sort === 'power' ? b.hp - a.hp
      : sort === 'condition' ? getOverallCondition(b) - getOverallCondition(a)
      : sort === 'mileage' ? a.odometerKm - b.odometerKm : 0;
    // Stable, locale-independent ordering; never mutates the saved vehicle array.
    if (delta !== 0) return delta;
    const left = `${a.name}\u0000${a.instanceId}`;
    const right = `${b.name}\u0000${b.instanceId}`;
    return left < right ? -1 : left > right ? 1 : 0;
  });
}
