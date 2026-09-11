import { useEffect, useRef, useState } from 'react';
import { CarFront, Flag, Trophy, X } from 'lucide-react';
import { DISCIPLINE_LABELS, findRaceEvent, RACE_EVENTS } from '../data/races';
import { getRaceBuildKey, getRaceRequirement, getVehicleRaceBuild } from '../domain/racing';
import { getPlayerPosition, getRaceProgress, getRaceStandings, isRaceReady } from '../domain/raceModel';
import { RACE_DISCIPLINES, type ActiveRace, type RaceBuild, type RaceDiscipline } from '../domain/racingTypes';
import type { GameState } from '../domain/types';

const yen = (n: number) => `${n < 0 ? '−' : ''}¥${Math.abs(n).toLocaleString('en-US')}`;
const seconds = (ms: number) => `${(ms / 1000).toFixed(3)}s`;
function FinishTable({ race }: { race: ActiveRace }) {
  return <div className="raceTableScroll"><table className="raceResultsTable"><caption>Final classification · simulated times</caption>
    <thead><tr><th>Place</th><th>Driver / car</th><th>Time</th><th>Gap</th></tr></thead><tbody>{getRaceStandings(race).map((entrant, i, all) =>
      <tr key={entrant.id} className={entrant.id === 'player' ? 'playerResult' : ''} data-testid={entrant.id === 'player' ? 'player-race-result' : undefined}>
        <th scope="row">{i + 1}</th><td><strong>{entrant.name}</strong><small>{entrant.vehicleName}</small></td><td>{seconds(entrant.totalTimeMs)}</td>
        <td>{i === 0 ? 'LEADER' : `+${seconds(entrant.totalTimeMs - all[0].totalTimeMs)}`}</td>
      </tr>)}</tbody></table></div>;
}
function RacePlayback({ race, now }: { race: ActiveRace; now: number }) {
  const telemetry = getRaceProgress(race, now);
  const player = telemetry.rows.find((row) => row.entrant.id === 'player')!;
  return <div className="racePlayback">
    <div className="racePlaybackHeading"><span>RUN #{race.runId} / SAVED BUILD</span>
      <strong data-testid="race-countdown">{telemetry.phase === 'clock-error' ? 'CLOCK ERROR' : telemetry.phase === 'countdown' ? telemetry.countdown : telemetry.phase === 'finished' ? 'FINISHED' : 'RACING'}</strong></div>
    <p className="raceSimLabel">{telemetry.phase === 'countdown' ? 'On the line. Your build and rivals are locked.' : 'Compressed replay of a deterministic sector simulation. No driving input required.'}</p>
    <div className="raceSectors" aria-label="Race sectors">{race.sectors.map((sector, i) =>
      <span key={i} className={i === player.sectorIndex ? 'currentSector' : ''}>{i + 1}. {sector.name}</span>)}</div>
    <div className="raceLanes">{telemetry.rows.map(({ entrant, progress }) => <div key={entrant.id} className={`raceLane ${entrant.id === 'player' ? 'playerLane' : ''}`}>
      <div className="raceLaneLabel"><strong>{entrant.name}</strong><span>{entrant.vehicleName}</span><small>{Math.floor(progress)}%</small></div>
      <div className="raceLaneTrack"><progress aria-label={`${entrant.name} race progress`} max={100} value={progress} />
        <CarFront size={20} aria-hidden="true" style={{ left: `${Math.min(98, Math.max(2, progress))}%` }} /></div>
    </div>)}</div>
    {telemetry.phase === 'clock-error' && <p className="workshopWarning" role="alert">Device clock moved backwards or is invalid. Restore it or withdraw. Your entry fee was already paid.</p>}
  </div>;
}

export function Races({ game, now, blocked, onStart, onSettle, onCancel }: {
  game: GameState; now: number; blocked: boolean;
  onStart: (eventId: string, vehicleId: string, buildKey: string) => boolean;
  onSettle: (runId: number) => boolean; onCancel: (runId: number) => boolean;
}) {
  const [discipline, setDiscipline] = useState<RaceDiscipline | 'all'>('all');
  const [targetId, setTargetId] = useState<string | null>(null);
  const [review, setReview] = useState<{ eventId: string; vehicleId: string; buildKey: string } | null>(null);
  const [reviewError, setReviewError] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const target = game.ownedVehicles.find((v) => v.instanceId === targetId)
    ?? game.ownedVehicles.find((v) => v.instanceId === game.activeVehicleId) ?? game.ownedVehicles[0];
  const active = game.racing.activeRace;
  const receipt = game.racing.lastResult;
  const ready = isRaceReady(active, now);
  const reviewedEvent = review ? findRaceEvent(review.eventId) : undefined;
  const reviewedVehicle = game.ownedVehicles.find((v) => v.instanceId === review?.vehicleId);
  useEffect(() => {
    const element = dialog.current;
    if (review && element && !element.open) element.showModal();
    else if (!review && element?.open) element.close();
  }, [review]);
  let build: RaceBuild | null = null;
  let reason: string | null = null;
  if (reviewedEvent && reviewedVehicle && review) {
    reason = blocked ? 'Resolve the save warning before entering.' : getRaceRequirement(game, reviewedEvent, reviewedVehicle.instanceId);
    try {
      build = getVehicleRaceBuild(reviewedVehicle);
      if (getRaceBuildKey(reviewedVehicle) !== review.buildKey) reason = 'This build changed. Reopen the race briefing.';
    } catch { reason = 'This vehicle exceeds the supported race-build range.'; }
  }
  function close() { dialog.current?.close(); setReview(null); setReviewError(''); }
  function start() {
    if (!review || reason || !build) return;
    if (onStart(review.eventId, review.vehicleId, review.buildKey)) {
      close(); window.scrollTo({ top: 0, behavior: 'auto' });
    } else setReviewError('Entry was not applied. Close this briefing and check the global save warning.');
  }
  function withdraw() {
    if (active && window.confirm(`Withdraw from ${active.eventName}?\n\nThe ${yen(active.entryFeeYen)} entry fee is NOT refunded. No prize, reputation or mileage will be awarded.`)) onCancel(active.runId);
  }
  if (!target) return <section className="garageEmpty"><h2>No race vehicle.</h2><p>Choose a starter in Garage or import a collection in Saves.</p></section>;
  return <section className="racesPanel" aria-labelledby="races-title">
    <div className="raceHeading"><div><span className="eyebrow">MIDNIGHT BULLETIN / RACE INVITATIONS</span><h2 id="races-title">Earn your stripes.</h2>
      <p>Four disciplines. Three rivals. Your build makes the difference.</p></div><Flag size={38} aria-hidden="true" /></div>
    <div className="raceCareer" aria-label="Race career"><div><span>FINISHES</span><strong data-testid="races-completed">{game.racing.completedRaces}</strong></div>
      <div><span>WINS / PODIUMS</span><strong>{game.racing.wins} / {game.racing.podiums}</strong></div>
      <div><span>PRIZE MONEY</span><strong>{yen(game.racing.totalEarnedYen)}</strong></div>
      <div><span>NET RACING INCOME</span><strong>{yen(game.racing.totalEarnedYen - game.racing.totalEntryFeesYen)}</strong></div></div>

    {active && <article className={`activeRace ${ready ? 'raceReady' : ''}`} aria-label="Current race">
      <div className="activeRaceTitle"><div><span className="eyebrow">{DISCIPLINE_LABELS[active.discipline]}</span><h3>{active.eventName}</h3>
        <p>{active.entrants[3].vehicleName} · {active.entrants[3].build.powerPs} PS · Entry {yen(active.entryFeeYen)} already paid</p></div><Trophy size={25} /></div>
      <RacePlayback race={active} now={now} />
      {ready && <><FinishTable race={active} /><p className="racePayout" data-testid="pending-race-payout">
        Position {getPlayerPosition(active)} · Prize {yen(active.prizes[getPlayerPosition(active) - 1].yen)} · +{active.prizes[getPlayerPosition(active) - 1].reputation} REP
        <small>Net after entry: {yen(active.prizes[getPlayerPosition(active) - 1].yen - active.entryFeeYen)}. Not paid until you settle.</small></p></>}
      <div className="raceActions"><button type="button" className="secondaryButton" disabled={blocked} onClick={withdraw}>WITHDRAW</button>
        <button type="button" className="claimButton" disabled={blocked || !ready} onClick={() => onSettle(active.runId)}>SETTLE RESULT</button></div>
      <p className="tuningNote">The assigned car stays locked until settlement or withdrawal. Switching tabs or reloading cannot reroll this race. No auto-repeat.</p>
    </article>}

    {!active && receipt && <article className="raceReceipt" aria-label="Last race result"><div className="activeRaceTitle"><div><span className="eyebrow">RESULT SAVED / RUN #{receipt.race.runId}</span>
      <h3>{receipt.position === 1 ? 'VICTORY' : `POSITION ${receipt.position}`} · {receipt.race.eventName}</h3></div><Trophy size={25} /></div>
      <p className="racePayout" role="status" data-testid="race-receipt">{yen(receipt.rewardYen)} + {receipt.reputationReward} REP paid
        <small>Entry: {yen(receipt.race.entryFeeYen)} · Net: {yen(receipt.rewardYen - receipt.race.entryFeeYen)} · +{receipt.race.distanceKm} km on the assigned car</small>
        {receipt.levelAfter > receipt.levelBefore && <strong>LEVEL UP! Level {receipt.levelAfter}</strong>}</p>
      <FinishTable race={receipt.race} />
      <details className="raceSectorDetails"><summary>Your sector times · see where your build matters</summary><dl>{receipt.race.sectors.map((sector, i) =>
        <div key={i}><dt>{sector.name} <small>{sector.profile}</small></dt><dd>{seconds(receipt.race.entrants[3].sectorTimesMs[i])}</dd></div>)}</dl></details>
    </article>}

    <div className="raceBoardHeading"><div><span className="eyebrow">ROOKIE / CLUB</span><h3>Choose your event</h3></div>
      <label className="workshopVehicle"><span>RACE VEHICLE</span><select aria-label="Race vehicle" value={target.instanceId} disabled={!!active}
        onChange={(event) => setTargetId(event.target.value)}>{game.ownedVehicles.map((v) => <option key={v.instanceId} value={v.instanceId}>{v.name} · {v.instanceId.slice(0, 8)}</option>)}</select>
        <small>Selection does not change your active garage car.</small></label></div>
    <div className="categoryChips" role="group" aria-label="Filter races by discipline">
      <button type="button" aria-pressed={discipline === 'all'} onClick={() => setDiscipline('all')}>All events <b>{RACE_EVENTS.length}</b></button>
      {RACE_DISCIPLINES.map((d) => <button type="button" key={d} aria-pressed={discipline === d} onClick={() => setDiscipline(d)}>{DISCIPLINE_LABELS[d]} <b>{RACE_EVENTS.filter((e) => e.discipline === d).length}</b></button>)}
    </div>
    <p className="racePolicy">One job OR race at a time. Entry is charged once before the start; prizes are gross payouts. A poor finish can pay less than the fee. East Ward Shakedown is always fee-free.</p>
    <div className="raceEventGrid">{RACE_EVENTS.filter((e) => discipline === 'all' || e.discipline === discipline).map((event) => {
      const requirement = blocked ? 'Resolve the save warning first.' : getRaceRequirement(game, event, target.instanceId);
      const record = game.racing.records.find((r) => r.eventId === event.id);
      return <article key={event.id} className={`raceEventCard ${game.playerLevel < event.minLevel ? 'raceLocked' : ''}`} aria-label={`${event.name} event`}>
        <div className="raceEventTop"><span>{DISCIPLINE_LABELS[event.discipline]}</span><b>{event.tier} / LV {event.minLevel}</b></div>
        <h4>{event.name}</h4><p>{event.description}</p><p className="raceFocus">{event.focus}</p>
        <dl className="raceOfferStats"><div><dt>ENTRY</dt><dd>{event.entryFeeYen === 0 ? 'FREE' : yen(event.entryFeeYen)}</dd></div>
          <div><dt>WINNER PRIZE</dt><dd>{yen(event.prizes[0].yen)}</dd></div><div><dt>PLAYBACK + START</dt><dd>{event.playbackMs / 1000 + 3}s</dd></div></dl>
        <p className="raceRecord">{record ? `Best: P${record.bestPosition} · ${seconds(record.bestTimeMs)} · ${record.finishes} finishes` : `${event.distanceKm} km on settlement · No personal record yet`}</p>
        <p className="partRequirement">{requirement ?? 'Available · inspect entry, rivals and all payouts below'}</p>
        <button type="button" className="secondaryButton" aria-label={`Briefing ${event.name}`} disabled={blocked} onClick={() => {
          try { setReviewError(''); setReview({ eventId: event.id, vehicleId: target.instanceId, buildKey: getRaceBuildKey(target) }); }
          catch { setReviewError('This vehicle exceeds the supported race-build range. Choose another car.'); }
        }}>RACE BRIEFING</button>
      </article>;
    })}</div>
    {reviewError && !review && <p className="gameError" role="alert">{reviewError}</p>}
    <p className="tuningNote">These are abstract simulated times, not real driving physics. There are no random failures, police, fuel bills, wear, damage or vehicle loss. Final race artwork and audio come later.</p>

    <dialog className="partDialog raceDialog" ref={dialog} aria-labelledby="race-briefing-title" onClose={() => setReview(null)} onCancel={() => setReview(null)}>
      {reviewedEvent && reviewedVehicle && <>
        <div className="dialogHeading"><span className="eyebrow">{DISCIPLINE_LABELS[reviewedEvent.discipline]} / {reviewedEvent.tier}</span>
          <button type="button" className="iconButton" aria-label="Close race briefing" onClick={close}><X size={20} /></button></div>
        <h3 id="race-briefing-title">{reviewedEvent.name}</h3><p>{reviewedEvent.focus}</p>
        <div className="raceBriefBuild"><strong>YOUR ENTRY · {reviewedVehicle.name}</strong><span>{build ? `${build.powerPs} PS · ${build.weightKg} kg · Grip ${build.grip} · Handling ${build.handling} · Braking ${build.braking}` : 'Unsupported build'}</span>
          <small>Current engine/transmission condition and reliability influence sector performance, but this race causes no new wear.</small></div>
        <h4>The grid</h4><ul className="rivalList">{reviewedEvent.rivals.map((rival) => <li key={rival.name}><strong>{rival.name}</strong><span>{rival.vehicleName} · {rival.build.powerPs} PS / {rival.build.weightKg} kg</span></li>)}</ul>
        <table className="comparisonTable"><caption>Entry {yen(reviewedEvent.entryFeeYen)} · charged once. Gross prizes and net earnings:</caption>
          <thead><tr><th>Place</th><th>Prize</th><th>Net</th><th>REP</th></tr></thead><tbody>{reviewedEvent.prizes.map((prize, i) => <tr key={i}><th scope="row">{i + 1}</th><td>{yen(prize.yen)}</td><td>{yen(prize.yen - reviewedEvent.entryFeeYen)}</td><td>+{prize.reputation}</td></tr>)}</tbody></table>
        <p className="tuningNote">3-second start + {reviewedEvent.playbackMs / 1000}-second replay. Same build and same rivals produce the same result; no random rerolls. Withdrawals do not refund the entry fee.</p>
        <p className="previewCost">{yen(reviewedEvent.entryFeeYen)} entry · {yen(Math.max(0, game.cashYen - reviewedEvent.entryFeeYen))} remaining</p>
        {reason && <p className="workshopWarning">{reason}</p>}{reviewError && <p className="gameError" role="alert">{reviewError}</p>}
        <div className="dialogActions"><button type="button" className="secondaryButton" onClick={close}>CANCEL</button>
          <button type="button" className="installButton" disabled={!!reason || !build || !review} onClick={start}>ENTER RACE</button></div>
      </>}
    </dialog>
  </section>;
}
