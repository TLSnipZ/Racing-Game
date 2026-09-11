import type { StarterCar } from '../data/starters';

export type PlayerVehicle = {
  instanceId: string;
  catalogId: string;
  name: string;
  year: number;
  engine: string;
  drive: StarterCar['drive'];
  hp: number;
  weightKg: number;
  odometerKm: number;
  engineCondition: number;
  bodyCondition: number;
  transmissionCondition: number;
  originality: number;
  installedParts: string[];
};

export type GameState = {
  cashYen: number;
  playerLevel: number;
  reputation: number;
  selectedStarterId: string | null;
  ownedVehicles: PlayerVehicle[];
};
