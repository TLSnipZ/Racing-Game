import { useRef } from 'react';
import { Shield, Timer } from 'lucide-react';
import { getLayLowRequirement } from '../domain/heat';
import { FINE_REDUCTION, heatStatus, LAY_LOW_MS, LAY_LOW_REDUCTION, LEGAL_JOB_REDUCTION } from '../domain/heatRules';
import type { GameState } from '../domain/types';
const yen = (n: number) => `¥${n.toLocaleString('en-US')}`;
export function HeatPanel({ game, now, blocked, onStart, onFinish, onCancel, onPay }: {
  game: GameState; now: number; blocked: boolean;
  onStart: (heat: number, nextId: number) => boolean; onFinish: (runId: number) => boolean;
  onCancel: (runId: number) => boolean; onPay: (raceRunId: number, fineYen: number) => boolean;
}) {
  const busy = useRef(false);
  const { heat } = game; const stop = heat.pendingStop; const pause = heat.cooldown;
  const validClock = !!pause && Number.isSafeInteger(now) && now >= pause.startedAtMs;
  const ready = validClock && now >= pause!.finishesAtMs;
  const reason = getLayLowRequirement(game);
  function act(confirm: string | null, operation: () => boolean) {
    if (blocked || busy.current || (confirm !== null && !window.confirm(confirm))) return;
    busy.current = true;
    try { operation(); } finally { queueMicrotask(() => { busy.current = false; }); }
  }
  return <section id="heat-controls" className={`heatPanel heat-${heatStatus(heat.value).toLowerCase()}`} aria-labelledby="heat-title" tabIndex={-1}>
    <div className="heatHeading"><div><span className="eyebrow">KAGEHAMA POLICE / ATTENTION REPORT</span><h2 id="heat-title">Keep a low profile.</h2></div><Shield size={30} aria-hidden="true" /></div>
    <div className="heatOverview"><div><strong>{heat.value}<small> / 100</small></strong><span>{heatStatus(heat.value)}</span></div>
      <progress aria-label="Police attention" max={100} value={heat.value} /></div>
    <p className="heatIntro">Heat belongs to your driver, not your car. Switching or selling a car does not clear it.
      Standard races keep their original terms; Underground stakes pay more but attract attention.</p>
    <div className="heatThresholds"><span>0–24 · Clear</span><span>25–49 · Noticed</span><span>50–74 · Watched</span><span>75–100 · Crackdown</span></div>

    {stop && <article className="patrolAlert" aria-label="Patrol alert">
      <span className="eyebrow">PATROL ALERT / RUN #{stop.raceRunId}</span><h3>The patrol has your number.</h3>
      <p>{stop.eventName} raised your profile to {stop.heatAtEntry} Heat. This consequence was shown before entry, not rolled at the finish.</p>
      <p><strong>{yen(stop.fineYen)} fine and −{FINE_REDUCTION} Heat</strong>, or <strong>stay off the roads for {LAY_LOW_MS / 1000}s for free and −{LAY_LOW_REDUCTION} Heat</strong>.
        No car seizure, damage, debt or automatic payment. New jobs/races wait until you resolve this alert.</p>
      <button className="secondaryButton" type="button" disabled={blocked || !!pause || game.cashYen < stop.fineYen}
        onClick={() => act(`Pay ${yen(stop.fineYen)} for the patrol alert from ${stop.eventName}?\n\nHeat: ${heat.value} → ${Math.max(0, heat.value - FINE_REDUCTION)}.\nA free 60-second Lay low option is also available.`, () => onPay(stop.raceRunId, stop.fineYen))}>PAY {yen(stop.fineYen)} FINE</button>
      {game.cashYen < stop.fineYen && <p className="heatHint">Not enough cash? The free Lay low option below remains available.</p>}
    </article>}

    {pause ? <article className="heatPause" aria-label="Current Lay low pause">
      <div className="heatPauseTitle"><Timer size={19} /><strong>{ready ? 'READY TO CLEAR' : validClock ? `${Math.max(0, Math.ceil((pause.finishesAtMs - now) / 1000))}s remaining` : 'CLOCK ERROR'}</strong></div>
      <progress aria-label="Lay low progress" max={100} value={validClock ? Math.min(100, (now - pause.startedAtMs) / LAY_LOW_MS * 100) : 0} />
      <p>Heat {pause.heatBefore} → {pause.heatAfter} on completion. {stop ? 'Your patrol alert will be cleared.' : 'No money or REP is awarded.'} Browsing and trading remain available.</p>
      {!validClock && <p role="alert">Restore your device clock or cancel. Cancellation does not remove Heat or the patrol alert.</p>}
      <div className="heatActions"><button type="button" className="secondaryButton" disabled={blocked}
        onClick={() => act('Cancel Lay low?\n\nNo Heat will be removed. Any pending patrol alert will remain.', () => onCancel(pause.runId))}>CANCEL LAY LOW</button>
        <button type="button" className="claimButton" disabled={blocked || !ready} onClick={() => act(null, () => onFinish(pause.runId))}>FINISH LAY LOW</button></div>
    </article> : <div className="heatRecovery">
      <div><h3>Let the streets cool down.</h3><p>One {LAY_LOW_MS / 1000}-second pause. Free. Removes up to {LAY_LOW_REDUCTION} Heat and clears a patrol alert. Finish manually when ready; you may close the page.</p></div>
      <button type="button" className="claimButton" disabled={blocked || !!reason}
        onClick={() => act(`Lay low for ${LAY_LOW_MS / 1000} seconds?\n\nCost: FREE. Heat: ${heat.value} → ${Math.max(0, heat.value - LAY_LOW_REDUCTION)}.\nNo jobs or races during the pause. Finish manually to apply the reduction${stop ? ' and clear the patrol alert' : ''}.`, () => onStart(heat.value, heat.nextCooldownId))}>LAY LOW · FREE</button>
      {reason && <p className="heatHint">{reason}</p>}
    </div>}
    {heat.lastResolution && <p className="heatReceipt" role="status" data-testid="heat-receipt">
      LAST RESOLUTION · {heat.lastResolution.kind === 'fine' ? `Fine paid: ${yen(heat.lastResolution.paidYen)}` : 'Lay low completed for free'} · Heat {heat.lastResolution.heatBefore} → {heat.lastResolution.heatAfter}
    </p>}
    <p className="heatFootnote">Each claimed legal job removes up to {LEGAL_JOB_REDUCTION} Heat. No passive decay or automatic repeats.
      At 85+ Heat, new Underground entries are blocked until you cool down. Fines paid so far: {yen(heat.totalFinesPaidYen)}.</p>
  </section>;
}
