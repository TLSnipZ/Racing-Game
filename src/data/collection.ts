import type { Rarity } from '../domain/collectionTypes';
export const RARITY_LABELS: Record<Rarity, string> = { common: 'Common', rare: 'Rare', legendary: 'Legendary', icon: 'Icon' };
export const RARITY_DESCRIPTIONS: Record<Rarity, string> = {
  common: 'Everyday roots. A good build can still embarrass the expensive cars.',
  rare: 'A distinctive place in the local scene. Not a horsepower multiplier.',
  legendary: 'A cult reputation that matters to collectors, independently of race pace.',
  icon: 'A curated milestone car from the Icon Showroom, not a random loot drop.',
};
export type IconOffer = { readonly id: string; readonly catalogId: string; readonly minLevel: number;
  readonly achievementId: string; readonly priceYen: number; readonly year: number; readonly odometerKm: number; readonly condition: number };
/** Fixed first-edition offers; one purchase each per save, including after a sale. */
export const ICON_OFFERS: readonly IconOffer[] = [
  { id: 'heritage-commission', catalogId: 'tora-heritage', minLevel: 6, achievementId: 'starter-trio', priceYen: 180000, year: 1987, odometerKm: 10000, condition: 95 },
  { id: 'kestrel-commission', catalogId: 'kestrel-gt', minLevel: 8, achievementId: 'four-corners', priceYen: 320000, year: 1997, odometerKm: 10000, condition: 95 },
];
export const findIconOffer = (id: string) => ICON_OFFERS.find((offer) => offer.id === id);
