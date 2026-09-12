import { useRef, useState } from 'react';
import { Check, Crown, Flag, LockKeyhole, Trophy } from 'lucide-react';
import { RIVAL_CHALLENGES } from '../data/rivals';
import { DISCIPLINE_LABELS } from '../data/races';
import { findAchievement } from '../data/achievements';
import { getAchievementProgress } from '../domain/collectionProgress';
import { getRivalCampaign, getRivalGoals, hasRivalWin } from '../domain/rivalProgress';
import { getRaceRequirement } from '../domain/racing';
import type { GameState, PlayerVehicle } from '../domain/types';

const yen = (n: number) => `¥${n.toLocaleString('en-US')}`;
export function RivalBoard({ game, target, blocked, onBrief, onClaim }: {
  game: GameState; target: PlayerVehicle; blocked: boolean;
  onBrief: (eventId: string) => void; onClaim: (id: string) => boolean;
}) {
  const [error, setError] = useState('');
  const submitting = useRef(false);
  const campaign = getRivalCampaign(game);
  function claim(id: string) {
    if (blocked || submitting.current) return;
    submitting.current = true;
    try {
      setError(onClaim(id) ? '' : 'The reward was not applied. Check the global save warning before retrying.');
    } finally { queueMicrotask(() => { submitting.current = false; }); }
  }
  return <section className="rivalBoard" aria-labelledby="rival-board-title">
    <header className="rivalIntro">
      <div><span className="eyebrow">AFTER THE CLUBS / ENDGAME CHAPTER 01</span><h3 id="rival-board-title">The city knows your name.</h3>
        <p>Four crews. One council. A bigger garage does not automatically buy you a place on the podium.</p></div>
      <div className="rivalCampaign"><Crown size={25} aria-hidden="true" /><strong data-testid="rival-title">{campaign.title}</strong>
        <span>{campaign.defeated} / {campaign.total} challenges won and settled</span>
        <progress aria-label="Rival campaign progress" max={campaign.total} value={campaign.defeated} /></div>
    </header>
    <p className="rivalPolicy">First earn a podium in each crew's Club qualifier. Then beat its entire grid and settle the result. The four crew wins unlock the Level-14 Council finale. All challenges use Standard stakes: no extra Heat, car forfeits or prestige reset.</p>
    {campaign.champion && <div className="rivalChampion" role="status"><Trophy size={25} /><div><strong>CHAPTER COMPLETE · KAGEHAMA NIGHT CHAMPION</strong><p>Your cars, properties and history stay yours. Replays remain available for normal race prizes; title bonuses are never renewed.</p></div></div>}
    {error && <p className="workshopWarning" role="alert">{error}</p>}
    <div className="rivalGrid">{RIVAL_CHALLENGES.map((challenge) => {
      const event = challenge.event;
      const goals = getRivalGoals(game, challenge);
      const record = game.racing.records.find((item) => item.eventId === event.id);
      const defeated = hasRivalWin(game, event.id);
      const achievement = findAchievement(challenge.achievementId)!;
      const reward = getAchievementProgress(game, achievement);
      const reason = blocked ? 'Resolve the save warning first.' : getRaceRequirement(game, event, target.instanceId);
      return <article key={event.id} className={`rivalCard ${challenge.qualifierId === null ? 'rivalFinale' : ''} ${defeated ? 'rivalDefeated' : ''}`} aria-label={`${challenge.crew} challenge`}>
        <div className="rivalCardTop"><span className="rivalNumber">{challenge.number}</span><span>{DISCIPLINE_LABELS[event.discipline]} / LEVEL {event.minLevel}<b>{defeated ? 'DEFEATED' : goals.every((g) => g.met) ? 'INVITATION OPEN' : 'INVITATION LOCKED'}</b></span></div>
        <h4>{challenge.crew}</h4><strong className="rivalBoss">{challenge.boss} · {event.rivals[0].vehicleName}</strong>
        <p>{event.description}</p><p className="rivalFocus">{event.focus}</p>
        <ul className="rivalGoals" aria-label={`${challenge.crew} invitation requirements`}>{goals.map((goal) => <li key={goal.label}>{goal.met ? <Check size={14} aria-hidden="true" /> : <LockKeyhole size={14} aria-hidden="true" />}<span>{goal.met ? 'MET' : 'NEEDED'} · {goal.label}</span></li>)}</ul>
        {challenge.qualifierId && <button className="secondaryButton rivalQualifier" type="button" aria-label={`Qualifier for ${challenge.crew}`} disabled={blocked} onClick={() => onBrief(challenge.qualifierId!)}>REVIEW CLUB QUALIFIER</button>}
        <dl className="rivalTerms"><div><dt>ENTRY EACH ATTEMPT</dt><dd>{yen(event.entryFeeYen)}</dd></div><div><dt>WINNER'S RACE PRIZE</dt><dd>{yen(event.prizes[0].yen)}</dd></div>
          <div><dt>ONE-TIME TITLE BONUS</dt><dd>{yen(challenge.bonusYen)}</dd></div><div><dt>REPLAY + COUNTDOWN</dt><dd>{event.playbackMs / 1000 + 3}s</dd></div></dl>
        <p className="rivalRecord">{record ? `Personal best: P${record.bestPosition} · ${(record.bestTimeMs / 1000).toFixed(3)}s · ${record.wins} wins / ${record.finishes} finishes` : 'No settled challenge result yet.'}</p>
        <p className="rivalGate">{reason ?? 'Ready to challenge. Review all four payouts and the full grid before paying.'}</p>
        <div className="rivalActions"><button className="cityPrimary" type="button" disabled={blocked} aria-label={`Briefing ${event.name}`} onClick={() => onBrief(event.id)}><Flag size={15} /> {defeated ? 'REPLAY BRIEFING' : 'CHALLENGE BRIEFING'}</button>
          <button className="secondaryButton" type="button" disabled={blocked || !reward.claimable} aria-label={`Claim rival bonus ${challenge.crew}`} onClick={() => claim(challenge.achievementId)}>{reward.claimed ? 'TITLE BONUS CLAIMED' : reward.claimable ? `CLAIM TITLE BONUS ${yen(challenge.bonusYen)}` : `TITLE · ${challenge.title}`}</button></div>
      </article>;
    })}</div>
    <p className="rivalPolicy">A crew defeat requires first place, not just beating one driver. Titles have no performance multiplier. Race prizes pay only on SETTLE RESULT; title bonuses use the same once-only achievement claim in Collection. Repeating a race cannot pay its title bonus again. Your other systems keep running.</p>
  </section>;
}
