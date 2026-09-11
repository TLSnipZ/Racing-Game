import type { BuildModifiers, TuningSlot } from '../domain/tuningTypes';

export type PartDefinition = {
  readonly id: string;
  readonly name: string;
  readonly brand: 'aoba' | 'senka' | 'kurogane';
  readonly slot: TuningSlot;
  readonly priceYen: number;
  readonly minLevel: number;
  readonly description: string;
  readonly compatibleCatalogIds: readonly string[];
  readonly modifiers: Readonly<BuildModifiers>;
};
export const PART_BRANDS = {
  aoba: { name: 'Aoba Streetworks', philosophy: 'Daily-driver parts. Small steps, sensible bills.' },
  senka: { name: 'Senka Dynamics', philosophy: 'Grip, balance and lightweight engineering.' },
  kurogane: { name: 'Kurogane Boost', philosophy: 'Power first. Read the fine print.' },
} as const;
export const SLOT_LABELS: Record<TuningSlot, string> = {
  intake: 'Intake', exhaust: 'Exhaust', ecu: 'ECU', tires: 'Tires', suspension: 'Suspension',
  brakes: 'Brakes', weight: 'Weight reduction', turbo: 'Turbo',
};
const ALL = ['pico-rs', 'tora-85', 'rz-t'] as const;
export const PARTS: readonly PartDefinition[] = [
  { id: 'aoba-panel-filter', name: 'Panel Filter', brand: 'aoba', slot: 'intake', priceYen: 6000, minLevel: 1,
    description: 'An affordable first breath of extra power. No simulated reliability penalty.', compatibleCatalogIds: ALL,
    modifiers: { powerBps: 500, originalityPenalty: 1 } },
  { id: 'senka-cold-air', name: 'Cold-Air Intake', brand: 'senka', slot: 'intake', priceYen: 16000, minLevel: 4,
    description: 'Lighter plumbing and more flow, with a small reliability trade-off.', compatibleCatalogIds: ALL,
    modifiers: { powerBps: 900, weightKg: -2, reliability: -1, originalityPenalty: 2 } },
  { id: 'aoba-catback', name: 'Street Cat-Back', brand: 'aoba', slot: 'exhaust', priceYen: 9500, minLevel: 2,
    description: 'More breathing room and less weight. Your factory specification gets a little further away.', compatibleCatalogIds: ALL,
    modifiers: { powerBps: 800, weightKg: -3, reliability: -1, originalityPenalty: 3 } },
  { id: 'aoba-balanced-ecu', name: 'Balanced ECU', brand: 'aoba', slot: 'ecu', priceYen: 8000, minLevel: 2,
    description: 'A conservative calibration that favours usable power and reliability.', compatibleCatalogIds: ALL,
    modifiers: { powerBps: 600, reliability: 2, originalityPenalty: 1 } },
  { id: 'kurogane-attack-ecu', name: 'Attack ECU', brand: 'kurogane', slot: 'ecu', priceYen: 17000, minLevel: 3,
    description: 'A harder tune: higher power, lower reliability rating. Replaces the balanced calibration.', compatibleCatalogIds: ALL,
    modifiers: { powerBps: 1400, reliability: -6, originalityPenalty: 2 } },
  { id: 'aoba-street-tires', name: 'Street Sport Tires', brand: 'aoba', slot: 'tires', priceYen: 6500, minLevel: 1,
    description: 'An accessible grip upgrade, useful even when horsepower is not the priority.', compatibleCatalogIds: ALL,
    modifiers: { grip: 8, handling: 2, braking: 2, originalityPenalty: 1 } },
  { id: 'senka-semi-slicks', name: 'Track Semi-Slicks', brand: 'senka', slot: 'tires', priceYen: 22000, minLevel: 4,
    description: 'More grip and response, at the cost of a lower reliability rating. Weather simulation comes later.', compatibleCatalogIds: ALL,
    modifiers: { grip: 17, handling: 5, reliability: -3, originalityPenalty: 2 } },
  { id: 'aoba-street-coils', name: 'Street Coilovers', brand: 'aoba', slot: 'suspension', priceYen: 12000, minLevel: 2,
    description: 'Sharper balance for street builds, with a mild reliability trade-off.', compatibleCatalogIds: ALL,
    modifiers: { handling: 9, grip: 2, reliability: -2, originalityPenalty: 3 } },
  { id: 'senka-track-coils', name: 'Track Coilovers', brand: 'senka', slot: 'suspension', priceYen: 26000, minLevel: 4,
    description: 'A handling-focused setup. Stronger ratings, less forgiving reliability.', compatibleCatalogIds: ALL,
    modifiers: { handling: 16, grip: 5, reliability: -5, originalityPenalty: 5 } },
  { id: 'aoba-sport-brakes', name: 'Sport Brake Kit', brand: 'aoba', slot: 'brakes', priceYen: 10500, minLevel: 2,
    description: 'A substantial braking upgrade; larger components add a little weight.', compatibleCatalogIds: ALL,
    modifiers: { braking: 12, weightKg: 4, originalityPenalty: 2 } },
  { id: 'senka-light-brakes', name: 'Lightweight Brake Kit', brand: 'senka', slot: 'brakes', priceYen: 18000, minLevel: 3,
    description: 'Stronger braking and lower weight at a higher price.', compatibleCatalogIds: ALL,
    modifiers: { braking: 17, weightKg: -5, originalityPenalty: 3 } },
  { id: 'senka-lightweight-kit', name: 'Lightweight Interior Kit', brand: 'senka', slot: 'weight', priceYen: 13500, minLevel: 3,
    description: 'Removable interior changes cut 65 kg but reduce the originality rating. Factory pieces are kept.', compatibleCatalogIds: ALL,
    modifiers: { weightKg: -65, reliability: -2, originalityPenalty: 8 } },
  { id: 'kurogane-response-turbo', name: 'Response Turbo', brand: 'kurogane', slot: 'turbo', priceYen: 23000, minLevel: 3,
    description: 'A bolt-on for the RZ-T only. Extra power adds mass and lowers reliability and response ratings.', compatibleCatalogIds: ['rz-t'],
    modifiers: { powerBps: 2200, weightKg: 8, handling: -1, reliability: -7, originalityPenalty: 5 } },
  { id: 'kurogane-big-turbo', name: 'Big-Frame Turbo', brand: 'kurogane', slot: 'turbo', priceYen: 42000, minLevel: 5,
    description: 'The power-focused RZ-T option. More mass, reduced handling response and a major reliability penalty.', compatibleCatalogIds: ['rz-t'],
    modifiers: { powerBps: 4000, weightKg: 15, handling: -5, reliability: -14, originalityPenalty: 8 } },
];
export const findPart = (id: string): PartDefinition | undefined => PARTS.find((part) => part.id === id);
export const isPartCompatible = (part: PartDefinition, catalogId: string): boolean => part.compatibleCatalogIds.includes(catalogId);
