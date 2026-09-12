import { STARTER_CARS, type Drive } from './starters';

export const MANUFACTURERS = { hoshino: 'Hoshino', akari: 'Akari', kazuma: 'Kazuma' } as const;
export type ManufacturerId = keyof typeof MANUFACTURERS;
export const BODY_TYPES = { hatchback: 'Hatchback', coupe: 'Coupe', sedan: 'Sedan', wagon: 'Wagon' } as const;
export type BodyType = keyof typeof BODY_TYPES;
export type VehicleDefinition = {
  readonly id: string;
  readonly name: string;
  readonly manufacturer: ManufacturerId;
  readonly bodyType: BodyType;
  readonly years: readonly [number, number];
  readonly engine: string;
  readonly drive: Drive;
  readonly hp: number;
  readonly weightKg: number;
  readonly referenceYen: number;
  readonly marketLevel: number;
  readonly description: string;
  readonly traits: readonly string[];
  readonly stockParts: readonly string[];
};

/** Explicit model metadata. The original three starter examples and prices stay untouched. */
const STARTER_METADATA = [
  { manufacturer: 'hoshino', bodyType: 'hatchback', years: [1992, 1996], referenceYen: 50000 },
  { manufacturer: 'hoshino', bodyType: 'coupe', years: [1984, 1987], referenceYen: 75000 },
  { manufacturer: 'akari', bodyType: 'coupe', years: [1990, 1994], referenceYen: 110000 },
] as const;
const FACTORY_PARTS = ['Factory intake', 'Factory exhaust', 'Factory ECU', 'Factory suspension', 'Road tires'] as const;
export const VEHICLE_CATALOG: readonly VehicleDefinition[] = [
  ...STARTER_CARS.map((car, index): VehicleDefinition => ({
    id: car.id, name: car.name, engine: car.engine, drive: car.drive, hp: car.hp, weightKg: car.weightKg,
    description: car.description, traits: [...car.traits], stockParts: [...car.stockParts],
    ...STARTER_METADATA[index], marketLevel: 1,
  })),
  { id: 'senda-s', name: 'Akari Senda S', manufacturer: 'akari', bodyType: 'sedan', years: [1996, 1999],
    engine: '2.0L NA I4', drive: 'RWD', hp: 145, weightKg: 1230, referenceYen: 125000, marketLevel: 3,
    description: 'Four doors, a balanced chassis and absolutely no intention of behaving like a family car.',
    traits: ['Sports sedan', 'RWD', 'Balanced chassis'], stockParts: FACTORY_PARTS },
  { id: 'pico-r', name: 'Hoshino Pico R', manufacturer: 'hoshino', bodyType: 'hatchback', years: [1998, 2001],
    engine: '1.8L NA I4', drive: 'FWD', hp: 165, weightKg: 1010, referenceYen: 170000, marketLevel: 4,
    description: 'A higher-revving hatch with sharper responses. Small footprint. Much less reasonable intentions.',
    traits: ['Hot hatch', 'High-revving NA', 'Lightweight'], stockParts: FACTORY_PARTS },
  { id: 'estate-gt', name: 'Kazuma Estate GT', manufacturer: 'kazuma', bodyType: 'wagon', years: [1999, 2003],
    engine: '2.5L NA I6', drive: 'RWD', hp: 190, weightKg: 1400, referenceYen: 210000, marketLevel: 5,
    description: 'A straight-six touring wagon. Room for a set of wheels, a toolbox and several questionable plans.',
    traits: ['Touring wagon', 'Straight six', 'RWD'], stockParts: FACTORY_PARTS },
];
export const findVehicleDefinition = (id: string): VehicleDefinition | undefined => VEHICLE_CATALOG.find((car) => car.id === id);
