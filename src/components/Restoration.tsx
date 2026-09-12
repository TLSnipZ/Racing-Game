import { useEffect, useRef, useState } from 'react';
import { Wrench, X } from 'lucide-react';
import { getRestorationQuote, getRestorationRequirement } from '../domain/restoration';
import type { RestorationService } from '../domain/advancedTypes';
import type { GameState } from '../domain/types';
const yen = (n: number) => `¥${n.toLocaleString('en-US')}`;
const SERVICES = [{ id: 'engine', name: 'Engine rebuild' }, { id: 'body', name: 'Body restoration' },
  { id: 'transmission', name: 'Transmission rebuild' }, { id: 'full', name: 'Full restoration' }] as const;
export function Restoration({ game, blocked, onRestore }: {
  game: GameState; blocked: boolean; onRestore: (id: string, service: RestorationService, key: string, cost: number) => boolean;
}) {
  const [targetId, setTargetId] = useState<string | null>(null);
  const [review, setReview] = useState<ReturnType<typeof getRestorationQuote> | null>(null);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const dialog = useRef<HTMLDialogElement>(null); const committing = useRef(false);
  const car = game.ownedVehicles.find((v) => v.instanceId === targetId) ?? game.ownedVehicles.find((v) => v.instanceId === game.activeVehicleId) ?? game.ownedVehicles[0];
  const reviewedCar = review ? game.ownedVehicles.find((v) => v.instanceId === review.vehicleId) : undefined;
  let reason: string | null = blocked ? 'Resolve the global save warning before restoring.' : null;
  if (review) {
    if (!reviewedCar) reason = 'This vehicle is no longer owned.';
    else {
      try { if (getRestorationQuote(reviewedCar, review.service).key !== review.key) reason = 'The car changed. Close and review again.'; }
      catch { reason = 'Restoration quote unavailable.'; }
      reason ??= getRestorationRequirement(game, reviewedCar, review.service);
    }
  }
  useEffect(() => { if (review && dialog.current && !dialog.current.open) dialog.current.showModal(); }, [review]);
  function close() { dialog.current?.close(); setReview(null); setError(''); }
  function confirm() {
    if (!review || reason || committing.current) return;
    committing.current = true;
    if (onRestore(review.vehicleId, review.service, review.key, review.costYen)) { setFeedback('Restoration saved. Purchased and fitted parts, mileage and originality are unchanged.'); close(); }
    else { committing.current = false; setError('Restoration was not applied. Cash and condition were kept. Check the global save warning.'); }
  }
  return <section className="specialistPanel" aria-labelledby="restoration-title">
    <div className="specialistHeading"><div><span className="eyebrow">MERCER GARAGE / CONDITION SERVICES</span><h2 id="restoration-title">Bring it back.</h2></div><Wrench size={36} /></div>
    <p className="specialistNote">Available from Level 2. Confirmed services immediately restore selected condition values to 100%. No timer, no new wear, no removed upgrades and no reset of mileage or originality. An assigned race/delivery car remains locked until its activity is settled or cancelled.</p>
    {car ? <><label className="restorationSelect"><span>Vehicle to restore</span><select value={car.instanceId} onChange={(e) => { setTargetId(e.target.value); setFeedback(''); }}>{game.ownedVehicles.map((v) => <option key={v.instanceId} value={v.instanceId}>{v.name} · {v.instanceId.slice(-18)}</option>)}</select></label>
      <div className="restorationConditions" aria-label="Current vehicle condition"><span>ENGINE <b>{car.engineCondition}%</b></span><span>BODY <b>{car.bodyCondition}%</b></span><span>TRANSMISSION <b>{car.transmissionCondition}%</b></span></div>
      <div className="restorationGrid">{SERVICES.map((s) => {
        let quote: ReturnType<typeof getRestorationQuote> | null = null;
        try { quote = getRestorationQuote(car, s.id); } catch { /* A valid unfamiliar historical model is retained, not assigned a made-up price. */ }
        const gate = blocked ? 'Resolve the save warning.' : getRestorationRequirement(game, car, s.id);
        return <article key={s.id} className="restorationCard"><span className="eyebrow">LEVEL 2 / QUOTED SERVICE</span><h3>{s.name}</h3>
          {quote ? <><strong>{yen(quote.costYen)}</strong><p>{quote.changes.map((c) => `${c.name}: ${c.before}% → 100%`).join(' · ')}</p></> : <p>No quote for this historical model.</p>}
          <p className="specialistGate">{gate ?? 'Ready. Review the full condition changes before paying.'}</p><button type="button" className="secondaryButton" disabled={blocked || !quote} aria-label={`Review ${s.name}`} onClick={() => { committing.current = false; setError(''); setReview(quote); }}>REVIEW RESTORATION</button></article>;
      })}</div></> : <p className="specialistNote">No owned vehicle to restore. Choose a starter or import your save.</p>}
    {feedback && <p className="workshopFeedback" role="status">{feedback}</p>}
    <p className="specialistNote">Lifetime restoration spend: {yen(game.advanced.restorationSpentYen)} · {game.advanced.restorationCount} paid services. This is condition repair, not a horsepower upgrade or a restoration-profit guarantee.</p>
    {review && <dialog ref={dialog} className="specialistDialog" aria-labelledby="restoration-review-title" onCancel={close} onClose={() => setReview(null)}>
      <div className="specialistDialogHead"><span className="eyebrow">EXACT CONDITION CHANGES</span><button type="button" className="iconButton" aria-label="Close restoration preview" onClick={close}><X size={20} /></button></div>
      <h3 id="restoration-review-title">Restore {reviewedCar?.name ?? 'vehicle'}</h3><p>{review.vehicleId}</p>
      <table className="restorationTable"><caption>Selected condition services</caption><thead><tr><th>Service</th><th>Before</th><th>After</th><th>Cost</th></tr></thead><tbody>{review.changes.map((c) => <tr key={c.field}><th>{c.name}</th><td>{c.before}%</td><td>100%</td><td>{yen(c.costYen)}</td></tr>)}</tbody></table>
      <p><b>{yen(review.costYen)} paid now.</b> Cash remaining: {game.cashYen >= review.costYen ? yen(game.cashYen - review.costYen) : 'Insufficient funds'}. No refund or extra fee.</p>
      <p>All purchased and fitted tuning parts remain with this car. Factory power, weight, mileage and originality are unchanged. Engine/transmission condition can improve future race results; no existing accepted race is recalculated.</p>
      {reason && <p className="workshopWarning">{reason}</p>}{error && <p className="gameError" role="alert">{error}</p>}
      <div className="specialistActions"><button type="button" className="secondaryButton" onClick={close}>CANCEL</button><button type="button" className="installButton" disabled={!!reason} onClick={confirm}>PAY & RESTORE</button></div>
    </dialog>}
  </section>;
}
