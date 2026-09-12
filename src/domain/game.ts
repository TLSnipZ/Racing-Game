import { createMarketState } from './marketStock';
import { STARTER_CARS } from '../data/starters';
import { createEconomyState } from './economy';
import { createVehicleTuning } from './tuning';
import { createRacingState } from './racing';
import type { GameState, PlayerVehicle } from './types';

export const STARTING_CASH_YEN = 50000;
export function createNewGameState(): GameState {
  return { cashYen: STARTING_CASH_YEN, playerLevel: 1, reputation: 0, selectedStarterId: null,
    ownedVehicles: [], activeVehicleId: null, economy: createEconomyState(), racing: createRacingState(), market: createMarketState() };
}
export function createPlayerVehicle(starterId: string, instanceId: string): PlayerVehicle {
  const starter = STARTER_CARS.find((car) => car.id === starterId);
  if (!starter) throw new Error('Unknown starter car.');
  if (!instanceId.trim() || instanceId.length > 200) throw new Error('Invalid vehicle instance ID.');
  return { instanceId, catalogId: starter.id, name: starter.name, year: starter.year,
    engine: starter.engine, drive: starter.drive, hp: starter.hp, weightKg: starter.weightKg,
    odometerKm: starter.odometerKm, engineCondition: starter.engineCondition, bodyCondition: starter.bodyCondition,
    transmissionCondition: starter.transmissionCondition, originality: starter.originality,
    installedParts: [...starter.stockParts], tuning: createVehicleTuning() };
}
export function purchaseStarter(state: GameState, starterId: string, instanceId: string): GameState {
  if (state.selectedStarterId !== null || state.ownedVehicles.length > 0) throw new Error('A starter car has already been chosen.');
  const starter = STARTER_CARS.find((car) => car.id === starterId);
  if (!starter) throw new Error('Unknown starter car.');
  if (!Number.isSafeInteger(state.cashYen) || state.cashYen < starter.priceYen) throw new Error('Not enough valid cash for this starter.');
  const vehicle = createPlayerVehicle(starter.id, instanceId);
  return { ...state, cashYen: state.cashYen - starter.priceYen, selectedStarterId: starter.id,
    ownedVehicles: [vehicle], activeVehicleId: vehicle.instanceId };
}
