/** Reputation is cumulative; there is no second XP currency in Phase 4. */
export const LEVEL_CAP = 20;

export function reputationForLevel(level: number): number {
  if (!Number.isSafeInteger(level) || level < 1 || level > LEVEL_CAP) throw new Error('Invalid progression level.');
  return 10 * level * (level - 1);
}

export function levelForReputation(reputation: number): number {
  if (!Number.isSafeInteger(reputation) || reputation < 0) throw new Error('Invalid reputation.');
  let level = 1;
  while (level < LEVEL_CAP && reputation >= reputationForLevel(level + 1)) level += 1;
  return level;
}

export function getLevelProgress(reputation: number, playerLevel: number) {
  // Existing valid imported levels are never reduced by a new progression rule.
  const level = Math.max(playerLevel, levelForReputation(reputation));
  if (level >= LEVEL_CAP) return { level, nextLevel: null, remainingRep: 0, percent: 100 };
  const floor = reputationForLevel(level);
  const ceiling = reputationForLevel(level + 1);
  return {
    level, nextLevel: level + 1, remainingRep: Math.max(0, ceiling - reputation),
    percent: Math.max(0, Math.min(100, (reputation - floor) / (ceiling - floor) * 100)),
  };
}
