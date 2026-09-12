/** Production rules v1. Keep these terms stable for already running businesses. */
export const BUSINESS_LEVEL_CAP = 5;
export const BUSINESS_STORAGE_MS = 8 * 60 * 60 * 1000;
export const BASE_GARAGE_CAPACITY = 12;
export type BusinessDefinition = {
  readonly id: string; readonly name: string; readonly description: string;
  readonly minLevel: number; readonly priceYen: number; readonly cycleMs: number;
  readonly payoutYen: number; readonly managerName: string; readonly managerPriceYen: number;
  readonly managerDescription: string;
};
export const BUSINESSES: readonly BusinessDefinition[] = [
  { id: 'ward-detail', name: 'East Ward Detail', minLevel: 3, priceYen: 60000, cycleMs: 30000, payoutYen: 300,
    description: 'Remove the dirt. Leave the questionable life choices. A small detailing crew handles one booking per batch.',
    managerName: 'Rei — Floor Manager', managerPriceYen: 35000,
    managerDescription: 'Keeps the wash bays booked while you test how quickly a clean car gets dirty again.' },
  { id: 'bayline-parts', name: 'Bayline Parts Supply', minLevel: 5, priceYen: 180000, cycleMs: 45000, payoutYen: 900,
    description: 'Boxes of sensible replacement parts. Allegedly. Your warehouse team packs a trade order per batch.',
    managerName: 'Jun — Dispatch Lead', managerPriceYen: 90000,
    managerDescription: 'Automatically schedules the next trade order. Your personal Parts Run job stays yours.' },
  { id: 'midnight-dyno', name: 'Midnight Dyno Works', minLevel: 7, priceYen: 450000, cycleMs: 60000, payoutYen: 2100,
    description: 'Customers pay to turn petrol into a graph. The staff run customer sessions, not your personal race car.',
    managerName: 'Nao — Workshop Lead', managerPriceYen: 225000,
    managerDescription: 'Keeps customer sessions running without you pressing the same button all night.' },
];
export const GARAGE_EXPANSIONS = [
  { level: 1, name: 'Annex Lease', capacity: 18, minLevel: 4, priceYen: 75000 },
  { level: 2, name: 'Warehouse Bays', capacity: 24, minLevel: 6, priceYen: 180000 },
  { level: 3, name: 'Industrial Motor Hall', capacity: 36, minLevel: 8, priceYen: 400000 },
] as const;
export const findBusiness = (id: string) => BUSINESSES.find((item) => item.id === id);
export const businessPayout = (item: BusinessDefinition, level: number) => item.payoutYen * level;
export const businessStorageCap = (item: BusinessDefinition, level: number, managerHired: boolean) => businessPayout(item, level)
  * (managerHired ? BUSINESS_STORAGE_MS / item.cycleMs : 1);
export const businessUpgradeCost = (item: BusinessDefinition, level: number) => item.priceYen * level;
