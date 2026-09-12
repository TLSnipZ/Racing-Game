import { getLevelProgress, LEVEL_CAP } from '../domain/progression';

/** XP is the existing cumulative reputation, not a new resource or saved counter. */
export function HudLevelProgress({ reputation, playerLevel }: { reputation: number; playerLevel: number }) {
  const progress = getLevelProgress(reputation, playerLevel);
  const capped = progress.nextLevel === null;
  const detail = capped
    ? `Current level cap ${LEVEL_CAP} reached. Reputation can still increase.`
    : `${progress.remainingRep.toLocaleString('en-US')} REP to Level ${progress.nextLevel}. Reputation is your level XP.`;
  return <div className="hudXp" title={detail}>
    <progress max={100} value={progress.percent} aria-label="Level XP progress" aria-valuetext={detail} />
    <small data-testid="hud-xp-label">{capped ? 'XP · MAX' : `XP · ${progress.remainingRep.toLocaleString('en-US')} REP left`}</small>
  </div>;
}
