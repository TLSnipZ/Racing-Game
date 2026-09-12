import { RIVAL_CHALLENGES } from './rivals';

export const ACHIEVEMENT_CATEGORIES = { rivals: 'Rival Crews', collection: 'Collection', work: 'Work & trade', workshop: 'Workshop', racing: 'Racing', heat: 'Heat' } as const;
export type AchievementCategory = keyof typeof ACHIEVEMENT_CATEGORIES;
export type AchievementMetric = 'starter' | 'starter-trio' | 'original-six' | 'garage-size' | 'body-types' | 'icons'
  | 'jobs' | 'parts' | 'fitted-slots' | 'races' | 'podiums' | 'wins' | 'disciplines' | 'bought' | 'sold' | 'lay-low' | 'rival-win';
export type AchievementDefinition = { readonly id: string; readonly name: string; readonly category: AchievementCategory;
  readonly description: string; readonly requirement: string; readonly metric: AchievementMetric; readonly target: number; readonly rewardYen: number; readonly raceEventId?: string };
/** Stable IDs and one-time fixed yen rewards. No passive bonuses or duplicate XP currency. */
export const ACHIEVEMENTS: readonly AchievementDefinition[] = [
  { id: 'first-ride', name: 'Financially Questionable', category: 'collection', description: 'One key. Several future invoices.', requirement: 'Purchase your starter.', metric: 'starter', target: 1, rewardYen: 1000 },
  { id: 'starter-trio', name: 'Three Bad Decisions', category: 'collection', description: 'Remember choosing just one? Neither do we.', requirement: 'Collect all three original starter models, not necessarily at once.', metric: 'starter-trio', target: 3, rewardYen: 6000 },
  { id: 'original-six', name: 'The Starter Pack Was a Lie', category: 'collection', description: 'It was never going to stop at one.', requirement: 'Collect all six used-market models.', metric: 'original-six', target: 6, rewardYen: 10000 },
  { id: 'full-house', name: 'Parking Is a Personality', category: 'collection', description: 'The neighbours have started counting.', requirement: 'Own six vehicles at the same time. Duplicate models count here.', metric: 'garage-size', target: 6, rewardYen: 8000 },
  { id: 'all-shapes', name: 'Practicality, Allegedly', category: 'collection', description: 'The wagon makes this a sensible collection. Obviously.', requirement: 'Collect a hatchback, coupe, sedan and wagon.', metric: 'body-types', target: 4, rewardYen: 5000 },
  { id: 'first-icon', name: 'Not Just a Poster', category: 'collection', description: 'The bedroom-wall car finally has real keys.', requirement: 'Own your first Icon model.', metric: 'icons', target: 1, rewardYen: 10000 },
  { id: 'five-jobs', name: 'Will Work for Wheels', category: 'work', description: 'An honest living. A less honest exhaust note.', requirement: 'Claim five completed jobs.', metric: 'jobs', target: 5, rewardYen: 2500 },
  { id: 'night-shift', name: 'Overtime, Overtake', category: 'work', description: 'Your toolbox has its own bedtime now.', requirement: 'Claim 25 completed jobs.', metric: 'jobs', target: 25, rewardYen: 5000 },
  { id: 'first-purchase', name: 'Just Browsing', category: 'work', description: 'Famous last words at a used-car dealer.', requirement: 'Buy one car from the used market.', metric: 'bought', target: 1, rewardYen: 2000 },
  { id: 'first-sale', name: 'It Had to Go', category: 'work', description: 'A heartfelt farewell. Until the next listing.', requirement: 'Complete one dealer sale.', metric: 'sold', target: 1, rewardYen: 1000 },
  { id: 'first-part', name: 'Rent Can Wait', category: 'workshop', description: 'A small upgrade. A slippery slope.', requirement: 'Own at least one purchased tuning part.', metric: 'parts', target: 1, rewardYen: 1000 },
  { id: 'four-slots', name: 'Built, Not Budgeted', category: 'workshop', description: 'The factory specification is now a suggestion.', requirement: 'Fit upgrades in four different slots on one car.', metric: 'fitted-slots', target: 4, rewardYen: 4000 },
  { id: 'first-race', name: 'The Start of Something Expensive', category: 'racing', description: 'The first result counts, wherever you finished.', requirement: 'Settle one race.', metric: 'races', target: 1, rewardYen: 1500 },
  { id: 'three-podiums', name: 'Podium Parking', category: 'racing', description: 'Reserved spaces at the sharp end of the grid.', requirement: 'Finish on the podium three times and settle the results.', metric: 'podiums', target: 3, rewardYen: 4000 },
  { id: 'first-win', name: 'Actually, It Runs', category: 'racing', description: 'Even the person who sold it is surprised.', requirement: 'Win and settle a race.', metric: 'wins', target: 1, rewardYen: 3000 },
  { id: 'four-corners', name: 'Four Corners of Midnight', category: 'racing', description: 'The strip, the streets, the pass and the expressway.', requirement: 'Settle a race in each of the four disciplines. Any finishing position counts.', metric: 'disciplines', target: 4, rewardYen: 7500 },
  { id: 'ten-wins', name: 'Local Problem', category: 'racing', description: 'The other drivers know that engine note.', requirement: 'Win and settle ten races.', metric: 'wins', target: 10, rewardYen: 12500 },
  { id: 'lay-low', name: 'Touch Grass, Not Guardrails', category: 'heat', description: 'Sixty seconds of being suspiciously sensible.', requirement: 'Finish a Lay low pause. Cancellation does not count.', metric: 'lay-low', target: 1, rewardYen: 2000 },
  ...RIVAL_CHALLENGES.map((challenge): AchievementDefinition => ({
    id: challenge.achievementId, name: challenge.title, category: 'rivals',
    description: `The ${challenge.crew} grid finally has something else to talk about.`,
    requirement: `Finish first and settle ${challenge.event.name}. No reward for withdrawal or an unclaimed finish.`,
    metric: 'rival-win', raceEventId: challenge.event.id, target: 1, rewardYen: challenge.bonusYen,
  })),
];
export const findAchievement = (id: string) => ACHIEVEMENTS.find((item) => item.id === id);
