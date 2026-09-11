import { STARTER_CARS } from '../data/starters';
import type { GameState, PlayerVehicle } from './types';

export const STARTING_CASH_YEN = 50000;

export function createNewGameState(): GameState {
  return {
    cashYen: STARTING_CASH_YEN,
    playerLevel: 1,
    reputation: 0,
    selectedStarterId: null,
    ownedVehicles: [],
  };
}

export function createPlayerVehicle(starterId: string, instanceId: string): PlayerVehicle {
  const starter = STARTER_CARS.find((car) => car.id === starterId);
  if (!starter) throw new Error('Unknown starter car.');

  return {
    instanceId,
    catalogId: starter.id,
    name: starter.name,
    year: starter.year,
    engine: starter.engine,
    drive: starter.drive,
    hp: starter.hp,
    weightKg: starter.weightKg,
    odometerKm: starter.odometerKm,
    engineCondition: starter.engineCondition,
    bodyCondition: starter.bodyCondition,
    transmissionCondition: starter.transmissionCondition,
    originality: starter.originality,
    installedParts: [...starter.stockParts],
  };
}

export function purchaseStarter(state: GameState, starterId: string, instanceId: string): GameState {
  if (state.selectedStarterId || state.ownedVehicles.length > 0) {
    throw new Error('A starter car has already been chosen.');
  }

  const starter = STARTER_CARS.find((car) => car.id === starterId);
  if (!starter) throw new Error('Unknown starter car.');
  if (state.cashYen < starter.priceYen) throw new Error('Not enough cash for this starter.');

  return {
    ...state,
    cashYen: state.cashYen - starter.priceYen,
    selectedStarterId: starter.id,
    ownedVehicles: [createPlayerVehicle(starter.id, instanceId)],
  };
}
