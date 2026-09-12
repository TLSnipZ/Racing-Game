import { RIVAL_CHALLENGES, findRivalChallenge, type RivalChallenge } from '../data/rivals';
import type { GameState } from './types';

type RivalPlayer = Pick<GameState, 'playerLevel' | 'racing'>;
export function hasRivalWin(state: Pick<GameState, 'racing'>, eventId: string): boolean {
  return state.racing.records.some((record) => record.eventId === eventId && record.wins > 0);
}
export function getRivalGoals(state: RivalPlayer, challenge: RivalChallenge): { label: string; met: boolean }[] {
  const goals = [{ label: `Level ${challenge.event.minLevel}`, met: state.playerLevel >= challenge.event.minLevel }];
  if (challenge.qualifierId) {
    goals.push({ label: `Settle a podium in ${challenge.qualifierName}`, met: state.racing.records.some((record) =>
      record.eventId === challenge.qualifierId && record.bestPosition <= 3) });
  } else {
    for (const crew of RIVAL_CHALLENGES.filter((c) => c.qualifierId !== null)) {
      goals.push({ label: `Win and settle ${crew.crew}`, met: hasRivalWin(state, crew.event.id) });
    }
  }
  return goals;
}
/** Checked by the shared domain entry command as well as the invitation UI. Never a display-only gate. */
export function getRivalEntryRequirement(state: RivalPlayer, eventId: string): string | null {
  const challenge = findRivalChallenge(eventId);
  if (!challenge) return null;
  const missing = getRivalGoals(state, challenge).find((goal) => !goal.met);
  return missing ? `Rival invitation requires: ${missing.label}.` : null;
}
export function getRivalCampaign(state: RivalPlayer) {
  const defeated = RIVAL_CHALLENGES.filter((challenge) => hasRivalWin(state, challenge.event.id));
  return { defeated: defeated.length, total: RIVAL_CHALLENGES.length,
    title: defeated.at(-1)?.title ?? 'Challenger', champion: hasRivalWin(state, 'rival-midnight-council') };
}
