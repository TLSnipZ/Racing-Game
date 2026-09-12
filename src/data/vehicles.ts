import { STARTER_CARS, type Drive } from './starters';

export const MANUFACTURERS = { hoshino: 'Hoshino', akari: 'Akari', mikado: 'Mikado' } as const;
export const BODY_TYPES = { hatchback: 'Hatchback', coupe: 'Coupe', sedan: 'Sedan', wagon: 'Wagon' } as const;
export type Manufacturer = keyof typeof MANUFACTURERS;
export type BodyType = keyof typeof BODY_TYPES;
export type VehicleModel = {
  id: string; name: string; manufacturer: Manufacturer; bodyType: BodyType;
  yearFrom: number; yearTo: number; engine: string; drive: Drive; hp: number; weightKg: number;
  baseValueYen: number; minLevel: number; description: string; traits: readonly string[];
  stockParts: readonly string[];
};
const starterMetadata = [
  { manufacturer: 'hoshino', bodyType: 'hatchback', yearFrom: 1992, yearTo: 1995, baseValueYen: 55000 },
  { manufacturer: 'hoshino', bodyType: 'coupe', yearFrom: 1984, yearTo: 1987, baseValueYen: 85000 },
  { manufacturer: 'akari', bodyType: 'coupe', yearFrom: 1990, yearTo: 1994, baseValueYen: 115000 },
] as const;
const stock = ['Factory intake', 'Factory exhaust', 'Factory ECU', 'Factory suspension', 'Road tires'];
/** Explicit manufacturer/body/year metadata; old vehicle instances keep their saved factory fields. */
export const VEHICLE_MODELS: readonly VehicleModel[] = [
  ...STARTER_CARS.map((car, index): VehicleModel => ({ id: car.id, name: car.name, ...starterMetadata[index],
    engine: car.engine, drive: car.drive, hp: car.hp, weightKg: car.weightKg, minLevel: 2,
    description: car.description, traits: car.traits, stockParts: car.stockParts })),
  { id: 'mira-s', name: 'Hoshino Mira S', manufacturer: 'hoshino', bodyType: 'sedan', yearFrom: 1996, yearTo: 1999,
    engine: '2.0L NA I4', drive: 'RWD', hp: 140, weightKg: 1240, baseValueYen: 150000, minLevel: 3,
    description: 'Four doors, rear-wheel drive and an excellent excuse to call this a practical purchase.',
    traits: ['Sedan', 'Balanced daily', 'RWD'], stockParts: stock },
  { id: 'nami-gt', name: 'Akari Nami GT', manufacturer: 'akari', bodyType: 'coupe', yearFrom: 1998, yearTo: 2002,
    engine: '2.2L NA I4', drive: 'RWD', hp: 185, weightKg: 1190, baseValueYen: 245000, minLevel: 5,
    description: 'A naturally aspirated coupe with crisp responses. No turbo badge, no apology.',
    traits: ['NA coupe', 'High revs', 'Balanced chassis'], stockParts: stock },
  { id: 'riku-tourer', name: 'Mikado Riku Tourer', manufacturer: 'mikado', bodyType: 'wagon', yearFrom: 1995, yearTo: 2000,
    engine: '2.5L NA I6', drive: 'RWD', hp: 170, weightKg: 1470, baseValueYen: 190000, minLevel: 4,
    description: 'A long-roof six-cylinder cruiser. Room for spare wheels and more questionable plans.',
    traits: ['Wagon', 'Inline six', 'Cruiser'], stockParts: stock },
];
export const findVehicleModel = (id: string): VehicleModel | undefined => VEHICLE_MODELS.find((model) => model.id === id);
