import type { JobId } from './jobs';

export const DISTRICT_IDS = ['east-ward', 'dockside', 'hakuro', 'eastline', 'industrial', 'outskirts'] as const;
export type DistrictId = typeof DISTRICT_IDS[number];
export type DistrictFilter = DistrictId | 'all';
export type DistrictDefinition = {
  readonly id: DistrictId;
  readonly name: string;
  readonly number: string;
  readonly scene: string;
  readonly description: string;
  readonly minLevel: number | null;
  readonly future: string | null;
  readonly services: readonly ('garage' | 'workshop')[];
};

/** Navigation metadata, not a travel simulation or a second progression currency. */
export const CITY_DISTRICTS: readonly DistrictDefinition[] = [
  { id: 'east-ward', name: 'East Ward', number: '01', scene: 'BACKSTREET ROOTS', minLevel: 1, future: null,
    description: 'Vending-machine light, narrow side streets and Mercer Garage. Every midnight story starts with a borrowed tool and an unpaid bill.',
    services: ['garage', 'workshop'] },
  { id: 'dockside', name: 'Dockside', number: '02', scene: 'TRACTION / FREIGHT', minLevel: 2, future: null,
    description: 'Container yards and harbor lights. Dispatch pays for reliable deliveries; the strip rewards a clean launch.', services: [] },
  { id: 'hakuro', name: 'Hakuro Pass', number: '03', scene: 'BRAKING / BALANCE', minLevel: 2, future: null,
    description: 'A ribbon of lantern-lit switchbacks above the bay. Less weight, better tires and a tidy line can beat a much bigger engine.', services: [] },
  { id: 'eastline', name: 'Eastline Expressway', number: '04', scene: 'MIDNIGHT / HIGH SPEED', minLevel: 3, future: null,
    description: 'Interchanges, bay tunnels and long straights. The expressway crowd measures a build by how well it keeps pulling.', services: [] },
  { id: 'industrial', name: 'Industrial District', number: '05', scene: 'FUTURE / EMPIRE', minLevel: null,
    future: 'Business locations and crew operations are planned for Phase 12. No activities here yet.',
    description: 'Shuttered body shops and warehouses waiting for a new owner. An address for the empire you have not built yet.', services: [] },
  { id: 'outskirts', name: 'Outer Kagehama', number: '06', scene: 'FUTURE / DISCOVERY', minLevel: null,
    future: 'Barn finds and restoration are planned for Phase 11. No discoveries can be purchased here yet.',
    description: 'Quiet lanes beyond the city. The rumors about forgotten cars are promising; the actual search system comes later.', services: [] },
];

// Explicit membership: never infer a district by parsing a car, job or event name.
export const RACE_DISTRICTS: Readonly<Record<string, DistrictId>> = {
  'east-ward-shakedown': 'east-ward', 'ward-club': 'east-ward',
  'dockyard-402': 'dockside', 'dockyard-club': 'dockside',
  'hakuro-intro': 'hakuro', 'hakuro-club': 'hakuro',
  'eastline-entry': 'eastline', 'eastline-club': 'eastline',
};
export const JOB_DISTRICTS: Readonly<Record<JobId, DistrictId>> = {
  'garage-shift': 'east-ward', 'parts-run': 'east-ward', 'dock-delivery': 'dockside',
};
export const findDistrict = (id: string): DistrictDefinition | undefined => CITY_DISTRICTS.find((district) => district.id === id);
export const isDistrictFilter = (value: string): value is DistrictFilter => value === 'all' || DISTRICT_IDS.some((id) => id === value);
