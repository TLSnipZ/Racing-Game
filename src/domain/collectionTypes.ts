export const RARITIES = ['common', 'rare', 'legendary', 'icon'] as const;
export type Rarity = typeof RARITIES[number];
export type CollectionState = {
  collectedModelIds: string[];
  unlockedAchievementIds: string[];
  claimedAchievementIds: string[];
  purchasedIconIds: string[];
};
export type CollectionStatus = 'all' | 'collected' | 'owned' | 'missing';
export type AchievementStatus = 'all' | 'ready' | 'locked' | 'claimed';
