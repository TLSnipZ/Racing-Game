import { RARITY_DESCRIPTIONS, RARITY_LABELS } from '../data/collection';
import { findVehicleDefinition } from '../data/vehicles';
export function RarityBadge({ catalogId }: { catalogId: string }) {
  const rarity = findVehicleDefinition(catalogId)?.rarity;
  return rarity ? <span className={`rarityBadge rarity-${rarity}`} title={RARITY_DESCRIPTIONS[rarity]}>{RARITY_LABELS[rarity]}</span> : null;
}
