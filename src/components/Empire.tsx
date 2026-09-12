import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, BriefcaseBusiness, Check, Factory, KeyRound, Users, Wallet, X } from 'lucide-react';
import { BUSINESSES, BUSINESS_LEVEL_CAP, GARAGE_EXPANSIONS, businessPayout, findBusiness } from '../data/businesses';
import { getEmpireQuote } from '../domain/empire';
import { getBusinessProduction, getEmpireProduction } from '../domain/empireProduction';
import { getGarageCapacity, getOccupiedGarageSpaces, getReservedVehicleIds } from '../domain/garageCapacity';
import type { EmpireAction, EmpireOrder } from '../domain/empireTypes';
import type { GameState } from '../domain/types';

export type EmpireView = 'businesses' | 'staff' | 'garage';
const yen = (n: number) => `¥${n.toLocaleString('en-US')}`;
const ACTION_NAMES: Record<EmpireAction, string> = { buy: 'Buy business', upgrade: 'Upgrade business', manager: 'Hire & automate',
  start: 'Start production', pause: 'Pause production', collect: 'Collect earnings', 'collect-all': 'Collect all earnings', expand: 'Expand garage' };
export function Empire({ game, now, blocked, view, onView, onAction }: {
  game: GameState; now: number; blocked: boolean; view: EmpireView; onView: (view: EmpireView) => void;
  onAction: (order: EmpireOrder) => boolean;
}) {
  const [review, setReview] = useState<EmpireOrder | null>(null);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const dialog = useRef<HTMLDialogElement>(null), committing = useRef(false);
  const output = getEmpireProduction(game.empire, now);
  const autoRate = output.rows.filter((row) => row.business.managerHired && row.business.startedAtMs !== null)
    .reduce((sum, row) => { const item = findBusiness(row.business.id)!; return sum + businessPayout(item, row.business.level) * 60000 / item.cycleMs; }, 0);
  const quote = review ? getEmpireQuote(game, review.action, review.businessId, now) : null;
  const reason = blocked ? 'Resolve the global save warning first.' : review && review.revision !== game.empire.revision
    ? 'Your empire changed. Close this preview and review again.' : quote?.reason ?? null;
  const target = review?.businessId ? findBusiness(review.businessId) : undefined;
  const owned = target && game.empire.businesses.find((b) => b.id === target.id);
  const expansion = GARAGE_EXPANSIONS.find((e) => e.level === game.empire.garageExpansionLevel + 1);
  useEffect(() => { committing.current = false; }, [game.empire.revision]);
  useEffect(() => { if (review && dialog.current && !dialog.current.open) dialog.current.showModal(); }, [review]);
  function close() { dialog.current?.close(); setReview(null); setError(''); }
  function execute(order: EmpireOrder) {
    if (blocked || committing.current) return;
    committing.current = true;
    if (onAction(order)) {
      setFeedback(`${ACTION_NAMES[order.action]} saved. Driver activities and specialist contracts are unchanged.`);
      close();
    } else { setError('This action was not applied. Check the save warning and retry.'); committing.current = false; }
  }
  function actionButton(action: EmpireAction, id: string | null, label: string, confirm = true) {
    const q = getEmpireQuote(game, action, id, now);
    return <button type="button" className={action === 'buy' || action === 'collect' || action === 'manager' ? 'empirePrimary' : 'secondaryButton'}
      aria-label={`${ACTION_NAMES[action]}${id ? ` ${findBusiness(id)?.name ?? id}` : ''}`}
      disabled={blocked || !!q.reason} title={blocked ? 'Resolve the save warning first.' : q.reason ?? label}
      onClick={() => { setError(''); if (confirm) { committing.current = false; setReview(q.order); } else execute(q.order); }}>{label}</button>;
  }
  return <section className="empirePanel" aria-labelledby="empire-title">
    <div className="empireHeading"><div><span className="eyebrow">INDUSTRIAL DISTRICT / OWNER OPERATIONS</span>
      <h2 id="empire-title">Let the bays pay.</h2><p>Your staff handle the bookings. You handle the questionable car purchases.</p></div><Factory size={42} aria-hidden="true" /></div>
    <div className="empireSummary" aria-label="Business overview">
      <div><span>BUSINESS TILLS</span><strong data-testid="empire-pending">{yen(output.totalYen)}</strong><small>Not yet in your cash balance</small></div>
      <div><span>AUTOMATED RATE</span><strong>{yen(autoRate)}<small> / min</small></strong><small>While running and storage is not full</small></div>
      <div><span>OWNED / MANAGED</span><strong>{game.empire.businesses.length} / {output.managedCount}</strong><small>3 businesses · 1 manager each</small></div>
      {actionButton('collect-all', null, 'COLLECT ALL EARNINGS', false)}
    </div>
    {output.clockError && <p className="gameError" role="alert">Device clock moved backwards or is invalid. Production is not credited early. Restore your clock; saved tills and other activities are kept.</p>}
    {output.fullCount > 0 && <p className="empireNotice" role="status">{output.fullCount} business till(s) full. Collect to make room. Excess waiting time is not stored for a second payout.</p>}
    <div className="empireModes" role="group" aria-label="Empire sections">{([
      ['businesses', 'Businesses'], ['staff', 'Staff & Managers'], ['garage', 'Garage Expansion'],
    ] as const).map(([id, label]) => <button key={id} type="button" aria-pressed={view === id} onClick={() => onView(id)}>{label}</button>)}</div>
    {view === 'businesses' && <>
      <div className="empireExplanation"><Wallet size={22} /><p><b>Start a batch → collect → hire a manager → repeat automatically.</b>
        <span>Without a manager: one manually dispatched batch. With a manager: continuous bookings into an 8-hour till, even while away. Transfer earnings to cash manually; no auto-spending, wages or debt.</span></p></div>
      <div className="businessGrid">{BUSINESSES.map((item, i) => {
        const business = game.empire.businesses.find((b) => b.id === item.id);
        const production = business ? getBusinessProduction(business, now) : null;
        const level = business?.level ?? 1;
        const payout = businessPayout(item, level);
        const purchase = getEmpireQuote(game, 'buy', item.id, now);
        const status = !business ? 'FOR SALE' : production!.clockError ? 'CLOCK ERROR' : production!.full ? 'TILL FULL' : production!.running
          ? business.managerHired ? 'AUTO RUNNING' : 'ONE BATCH RUNNING' : business.managerHired ? 'AUTO PAUSED' : 'MANUAL DISPATCH';
        return <article className="businessCard" key={item.id} aria-label={item.name}>
          <div className="businessCardTop"><span>PROPERTY 0{i + 1}</span><b>{status}</b></div><h3>{item.name}</h3><p>{item.description}</p>
          <dl className="businessFacts"><div><dt>Business level</dt><dd>{business ? `${level} / ${BUSINESS_LEVEL_CAP}` : 'Not owned'}</dd></div>
            <div><dt>Booking batch</dt><dd>{item.cycleMs / 1000}s</dd></div><div><dt>Net per batch</dt><dd>{yen(payout)}</dd></div><div><dt>Full-time rate</dt><dd>{yen(payout * 60000 / item.cycleMs)} / min</dd></div></dl>
          {business && production ? <><div className="businessTill"><span>READY TO TRANSFER</span><strong>{yen(production.amountYen)}</strong>
            <small>Storage limit: {yen(production.capacityYen)} · {business.managerHired ? '8 hours of production' : 'one batch'}</small></div>
            <progress max={100} value={production.percent} aria-label={`${item.name} batch progress`} />
            <p className="batchStatus">{production.clockError ? 'Restore the device clock to continue.' : production.full ? business.managerHired ? 'Storage full. Production resumes after collection.' : 'Batch complete. Collect, then start the next booking.' : production.running ? `Next batch in ${Math.ceil(production.remainingMs / 1000)}s` : 'Stopped. Start when ready; nothing accrues while paused.'}</p>
            <div className="businessActions">{actionButton('collect', item.id, 'COLLECT EARNINGS', false)}
              {production.running ? actionButton('pause', item.id, 'PAUSE', true) : actionButton('start', item.id, business.managerHired ? 'RESUME AUTO' : 'START ONE BATCH', false)}
              {actionButton('upgrade', item.id, level < BUSINESS_LEVEL_CAP ? `UPGRADE · ${yen(item.priceYen * level)}` : 'MAX LEVEL')}
              {!business.managerHired && actionButton('manager', item.id, `HIRE MANAGER · ${yen(item.managerPriceYen)}`)}</div>
            <small className="businessHint">{business.managerHired ? `${item.managerName}. Pause before upgrades; resume explicitly afterwards.` : 'No manager: collect the completed batch before starting another. Hire while stopped to automate.'}</small>
            {level < BUSINESS_LEVEL_CAP && <small className="businessHint">Next upgrade requires player Level {item.minLevel + level}. Completed stored yen never receive the new multiplier.</small>}
          </> : <><div className="businessTill"><span>ACQUISITION</span><strong>{yen(item.priceYen)}</strong><small>Level {item.minLevel} · includes operating staff, not automation</small></div>
            {actionButton('buy', item.id, 'REVIEW BUSINESS')}
            <small className="businessHint">{purchase.reason ?? 'One-time purchase. No rent deductions or hidden running bills.'}</small></>}
        </article>;
      })}</div>
    </>}
    {view === 'staff' && <><div className="empireExplanation"><Users size={22} /><p><b>Delegate bookings, not your entire save.</b><span>Managers are permanently assigned to their own business. A one-time hire enables repeat production with no recurring wage deduction. They do not enter races, claim your jobs, drive your cars or clear Heat.</span></p></div>
      <div className="businessGrid">{BUSINESSES.map((item) => {
        const business = game.empire.businesses.find((b) => b.id === item.id);
        return <article className="managerCard" key={item.id} aria-label={item.managerName}><div className="managerMonogram" aria-hidden="true">{item.managerName.slice(0, 1)}</div>
          <span className="eyebrow">{item.name}</span><h3>{item.managerName}</h3><p>{item.managerDescription}</p>
          <strong>{business?.managerHired ? <><Check size={18} /> HIRED · {business.startedAtMs === null ? 'PAUSED' : 'AUTOMATED'}</> : yen(item.managerPriceYen)}</strong>
          {actionButton('manager', item.id, business?.managerHired ? 'ALREADY HIRED' : 'REVIEW HIRE')}
          <small>{!business ? 'Buy the associated business first.' : !business.managerHired && business.startedAtMs !== null ? 'Finish or pause the current manual batch first.' : '8-hour storage cap. Collect money from your business tills.'}</small></article>;
      })}</div></>}
    {view === 'garage' && <><div className="empireExplanation"><KeyRound size={22} /><p><b>{getOccupiedGarageSpaces(game)} / {getGarageCapacity(game)} spaces committed.</b><span>{game.ownedVehicles.length} owned cars + {getReservedVehicleIds(game).length} reserved specialist deliveries. Expanding never removes cars, escrow, parts or incoming reservations.</span></p></div>
      <div className="businessGrid">{GARAGE_EXPANSIONS.map((e) => {
        const purchased = game.empire.garageExpansionLevel >= e.level;
        const isNext = e.level === game.empire.garageExpansionLevel + 1;
        return <article className="expansionCard" key={e.level}><span className="eyebrow">EXPANSION 0{e.level}</span><h3>{e.name}</h3>
          <strong>{e.capacity}<span> TOTAL SPACES</span></strong><p>{yen(e.priceYen)} · player Level {e.minLevel}</p>
          {isNext ? actionButton('expand', null, 'REVIEW EXPANSION') : <button type="button" className="secondaryButton" disabled>{purchased ? 'OWNED' : 'BUY PREVIOUS EXPANSION FIRST'}</button>}
          <small>{purchased ? 'Permanent capacity, including after a reload.' : 'One-time price. No running rent, no free cars, no refund or downgrade.'}</small></article>;
      })}</div></>}
    {feedback && <p className="workshopFeedback" role="status">{feedback}</p>}{error && !review && <p className="gameError" role="alert">{error}</p>}
    <div className="empireLedger"><BriefcaseBusiness size={18} /><span>INVESTED {yen(game.empire.totalSpentYen)}</span><span>PROFIT COLLECTED {yen(game.empire.totalCollectedYen)}</span>
      {game.empire.lastReceipt && <small>Last saved action: {ACTION_NAMES[game.empire.lastReceipt.action]} · {yen(game.empire.lastReceipt.amountYen)}</small>}</div>
    <p className="empireFootnote">Rules v1: managed tills hold up to 8 hours of current-level production in total, online or offline. A reload, tab switch or export never renews that allowance. An unmanaged business holds one batch. Only completed batches earn money; pausing discards the unfinished batch time, but keeps completed earnings. No passive REP, vehicle wear or Heat changes. Your driver and broker activities stay independent.</p>
    {review && <dialog ref={dialog} className="empireDialog" aria-labelledby="empire-review-title" onCancel={close} onClose={() => setReview(null)}>
      <div className="empireDialogHead"><span className="eyebrow">EXPLICIT TERMS / NO AUTO-SPENDING</span><button type="button" className="iconButton" aria-label="Close empire preview" onClick={close}><X size={20} /></button></div>
      <h3 id="empire-review-title">{ACTION_NAMES[review.action]}</h3><h4>{target?.name ?? expansion?.name ?? 'Your garage'}</h4>
      <div className="empireInvoice"><span>PAY NOW</span><strong>{yen(review.priceYen)}</strong><small>Cash remaining: {game.cashYen >= review.priceYen ? yen(game.cashYen - review.priceYen) : 'Insufficient cash'}</small></div>
      {review.action === 'buy' && target && <p>Purchase one Level-1 business. Staff complete one {target.cycleMs / 1000}-second booking batch for {yen(target.payoutYen)} after you dispatch it. No income before dispatch. Manager automation costs an additional {yen(target.managerPriceYen)}. No resale or refund.</p>}
      {review.action === 'manager' && target && <p>Hire {target.managerName} once and <b>start automatic production now</b>. Completed bookings repeat into this business till, online and offline, up to 8 hours of production. No wage deduction, no automatic cash transfer and no auto-purchases.</p>}
      {review.action === 'upgrade' && target && owned && <p>Business Level {owned.level} → {owned.level + 1}. Future booking payout: {yen(businessPayout(target, owned.level))} → {yen(businessPayout(target, owned.level + 1))}. Duration is unchanged. Existing stored earnings keep their old amount. Production stays paused until you resume.</p>}
      {review.action === 'pause' && <p><b>Completed earnings stay in the till.</b> The current unfinished batch time is discarded. No income accrues while paused. Resume later to start a fresh batch; this never pauses your jobs, races or broker.</p>}
      {review.action === 'expand' && expansion && <p>Garage capacity {getGarageCapacity(game)} → {expansion.capacity}. All owned cars, tuned parts and incoming specialist reservations remain intact. No free vehicles, recurring rent or downgrade.</p>}
      {reason && <p className="workshopWarning">{reason}</p>}{error && <p className="gameError" role="alert">{error}</p>}
      <div className="businessActions"><button type="button" className="secondaryButton" onClick={close}>CANCEL</button><button type="button" className="empirePrimary" disabled={!!reason}
        onClick={() => { if (!reason) execute(review); }}>CONFIRM {ACTION_NAMES[review.action].toUpperCase()} <ArrowUpRight size={15} /></button></div>
    </dialog>}
  </section>;
}
