import { useEffect, useRef, useState } from 'react';
import { Gavel, MapPin, Ship, X } from 'lucide-react';
import { ADVANCED_OFFERS, findAdvancedOffer, getAuctionClearingPrice } from '../data/advancedCars';
import { findVehicleDefinition } from '../data/vehicles';
import { createIncomingVehicle, getBarnBuyRequirement, getSpecialistQuoteKey, getSpecialistRequirement } from '../domain/advanced';
import { isSpecialistReady, isValidProxyBid } from '../domain/advancedRules';
import { getRestorationQuote } from '../domain/restoration';
import { getReservedVehicleIds } from '../domain/garageCapacity';
import type { GameState, PlayerVehicle } from '../domain/types';
import type { SpecialistView } from '../domain/advancedTypes';
import { VehicleSilhouette } from './VehicleSilhouette';
import { RarityBadge } from './RarityBadge';
const yen = (n: number) => `¥${n.toLocaleString('en-US')}`;
const HEADINGS = { imports: 'Across the water.', auctions: 'Know your limit.', barns: 'Some stories need saving.' };
const KINDS = { imports: 'import', auctions: 'auction', barns: 'survey' } as const;
type Review = { kind: 'start'; offerId: string; key: string } | { kind: 'barn'; offerId: string; key: string }
  | { kind: 'raise'; offerId: string; runId: number; bid: number } | { kind: 'cancel'; offerId: string; runId: number; bid: number };
export function SpecialistFacts({ car }: { car: PlayerVehicle }) {
  return <dl className="specialistFacts"><div><dt>Year / drivetrain</dt><dd>{car.year} · {car.drive}</dd></div>
    <div><dt>Factory power / weight</dt><dd>{car.hp} PS · {car.weightKg.toLocaleString('en-US')} kg</dd></div>
    <div><dt>Odometer</dt><dd>{car.odometerKm.toLocaleString('en-US')} km</dd></div><div><dt>Engine / body / gearbox</dt><dd>{car.engineCondition}% / {car.bodyCondition}% / {car.transmissionCondition}%</dd></div>
    <div><dt>Originality</dt><dd>{car.originality}% · stock parts</dd></div><div><dt>Instance ID</dt><dd><code>{car.instanceId}</code></dd></div></dl>;
}
export function AdvancedCars({ game, now, blocked, mode, onStart, onFinish, onCancel, onRaise, onBarn, onGarage, onRestore }: {
  game: GameState; now: number; blocked: boolean; mode: SpecialistView;
  onStart: (id: string, key: string, bid: number) => boolean;
  onFinish: (id: number) => boolean; onCancel: (id: number) => boolean;
  onRaise: (id: number, oldBid: number, bid: number) => boolean;
  onBarn: (id: string, key: string) => boolean; onGarage: () => void; onRestore: () => void;
}) {
  const [review, setReview] = useState<Review | null>(null);
  const [bid, setBid] = useState('190000');
  const [error, setError] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const committing = useRef(false);
  const contract = game.advanced.activeContract;
  const pendingOffer = contract ? findAdvancedOffer(contract.offerId)! : null;
  const ready = isSpecialistReady(contract, now);
  const clockError = !!contract && (!Number.isSafeInteger(now) || now < contract.startedAtMs);
  const seconds = contract ? Math.ceil(Math.max(0, contract.finishesAtMs - now) / 1000) : 0;
  const offer = review ? findAdvancedOffer(review.offerId)! : null;
  const car = offer ? contract?.offerId === offer.id && contract.vehicle ? contract.vehicle : createIncomingVehicle(game, offer) : null;
  const amount = /^\d+$/.test(bid) ? Number(bid) : NaN;
  let reason: string | null = blocked ? 'Resolve the global save warning first.' : null;
  if (!reason && review && offer) {
    if (review.kind === 'start' || review.kind === 'barn') reason = review.key !== getSpecialistQuoteKey(game, offer)
      ? 'The specialist quote changed. Close and review again.' : review.kind === 'barn' ? getBarnBuyRequirement(game, offer) : getSpecialistRequirement(game, offer, amount);
    else if (!contract || contract.runId !== review.runId || contract.escrowYen !== review.bid) reason = 'The current contract changed.';
    else if (review.kind === 'raise') reason = clockError || ready ? 'Bidding is closed or the clock moved backwards.'
      : !isValidProxyBid(offer, amount) || amount <= contract.escrowYen ? 'Enter a higher maximum in ¥5,000 steps, up to ¥1,000,000.'
      : game.cashYen < amount - contract.escrowYen ? 'Not enough cash for the extra escrow.' : null;
  }
  useEffect(() => { if (review && dialog.current && !dialog.current.open) dialog.current.showModal(); }, [review]);
  function close() { dialog.current?.close(); setReview(null); setError(''); }
  function open(value: Review) { committing.current = false; setError(''); setBid(String(value.kind === 'raise' ? value.bid + 5000 : 190000)); setReview(value); }
  function confirm() {
    if (!review || !offer || reason || committing.current) return;
    committing.current = true;
    const ok = review.kind === 'start' ? onStart(offer.id, review.key, offer.kind === 'auction' ? amount : 0)
      : review.kind === 'barn' ? onBarn(offer.id, review.key) : review.kind === 'raise' ? onRaise(review.runId, review.bid, amount) : onCancel(review.runId);
    if (ok) close(); else { committing.current = false; setError('Change not applied. Your previous cash, contract and vehicle were kept. Check the global save warning.'); }
  }
  const receipt = game.advanced.lastReceipt;
  return <section className="specialistPanel" aria-labelledby="specialist-title">
    <div className="specialistHeading"><div><span className="eyebrow">KAGEHAMA SPECIALIST NETWORK / {mode.toUpperCase()}</span><h2 id="specialist-title">{HEADINGS[mode]}</h2></div>
      {mode === 'imports' ? <Ship size={36} /> : mode === 'auctions' ? <Gavel size={36} /> : <MapPin size={36} />}</div>
    <p className="specialistNote">One broker contract at a time. Broker work runs alongside your own job, race or Lay low; it never earns money or repeats automatically. Imports and all pending auction bids reserve a garage space. Final car artwork is still planned.</p>
    {contract && pendingOffer && <article className="specialistPending" aria-label="Current specialist contract">
      <div className="specialistPendingTop"><div><span className="eyebrow">{contract.kind.toUpperCase()} / CONTRACT #{contract.runId}</span><h3>{pendingOffer.name}</h3></div><strong data-testid="specialist-timer">{clockError ? 'CLOCK ERROR' : ready ? 'READY' : `${seconds}s`}</strong></div>
      <progress max={100} value={clockError ? 0 : Math.min(100, Math.max(0, (now - contract.startedAtMs) / pendingOffer.durationMs * 100))} aria-label="Specialist contract progress" />
      <p>{contract.kind === 'survey' ? 'Survey fee paid. No car collected yet. Complete the survey, then decide whether to buy the project.' : `${yen(contract.escrowYen)} held · 1 garage space reserved · ${contract.vehicle!.name}`}</p>
      {contract.kind === 'auction' && <p>Disclosed rival maximum: <b>{yen(pendingOffer.rivalBidYen)}</b>. Your maximum: <b>{yen(contract.escrowYen)}</b>. {contract.escrowYen >= getAuctionClearingPrice(pendingOffer)
        ? `Winning clearing price: ${yen(getAuctionClearingPrice(pendingOffer))}; ${yen(contract.escrowYen - getAuctionClearingPrice(pendingOffer))} refunded on settlement.` : 'Currently below the winning threshold: increase your maximum before the deadline, or receive the full escrow refund after losing.'}</p>}
      <div className="specialistActions"><button type="button" className="installButton" disabled={blocked || !ready} onClick={() => { if (!onFinish(contract.runId)) setError('Completion was not applied. The contract is kept; check the save warning.'); }}>COMPLETE CONTRACT</button>
        {contract.kind === 'auction' ? <button type="button" className="secondaryButton" disabled={blocked || ready || clockError} onClick={() => open({ kind: 'raise', offerId: contract.offerId, runId: contract.runId, bid: contract.escrowYen })}>RAISE MAXIMUM BID</button>
          : <button type="button" className="secondaryButton" disabled={blocked} onClick={() => open({ kind: 'cancel', offerId: contract.offerId, runId: contract.runId, bid: contract.escrowYen })}>CANCEL CONTRACT</button>}</div>
      {clockError && <p className="workshopWarning">Restore the device clock to finish or raise a bid. Import/survey cancellation remains available; an auction cannot be cancelled.</p>}
    </article>}
    {receipt && <p className="specialistReceipt" role="status" data-testid="specialist-receipt">LAST ACTION #{receipt.actionId}: {receipt.kind.toUpperCase()} · Charged {yen(receipt.chargedYen)} · Refunded {yen(receipt.refundedYen)}. {receipt.kind === 'won' || receipt.kind === 'delivered' || receipt.kind === 'recovered' ? 'Vehicle saved in your garage.' : ''}</p>}
    {error && !review && <p role="alert" className="workshopWarning">{error}</p>}
    <div className="specialistOffers">{ADVANCED_OFFERS.filter((o) => o.kind === KINDS[mode]).map((o) => {
      const model = findVehicleDefinition(o.catalogId)!;
      const surveyed = game.advanced.surveyedBarnIds.includes(o.id);
      const acquired = game.advanced.acquiredOfferIds.includes(o.id);
      const sample = createIncomingVehicle(game, o);
      return <article className="specialistOffer" key={o.id} aria-label={`Specialist offer ${model.name}`}>
        <div className="specialistOfferCopy"><span className="eyebrow">{o.name} / LEVEL {o.minLevel}</span><h3>{model.name}</h3><RarityBadge catalogId={model.id} /><p>{o.description}</p>
          <p>{o.kind === 'import' ? `Vehicle ${yen(o.priceYen)} + transport ${yen(o.transportYen)} = ${yen(o.priceYen + o.transportYen)} paid now. Arrival in 90 seconds. Full cancellation refund, no arrival fee.`
            : o.kind === 'auction' ? `Minimum maximum-bid ${yen(o.minimumBidYen)} · ¥5,000 steps. Disclosed rival ceiling ${yen(o.rivalBidYen)}. Winning threshold ${yen(getAuctionClearingPrice(o))}. Auction lasts 60 seconds from your first bid.`
            : `${yen(o.surveyYen)} non-refundable survey fee · 45 seconds. Then an optional ${yen(o.priceYen)} all-in recovery purchase. The lead is fixed, not a random search roll.`}</p>
          {o.kind === 'survey' && <p>Project condition is shown in advance. Optional full restoration estimate: <b>{yen(getRestorationQuote(sample, 'full').costYen)}</b>, separate from acquisition. Surveying alone does not count as collecting the car.</p>}
          <p className="specialistGate">{acquired ? 'ACQUIRED · one-time source, including after a sale.' : o.kind === 'survey' && surveyed ? 'SURVEY COMPLETE · the project waits until you choose to buy.' : game.playerLevel < o.minLevel ? `Requires Level ${o.minLevel}.` : 'Review the complete costs and terms before confirming.'}</p>
          <button type="button" className="installButton" disabled={blocked || acquired} aria-label={`Review specialist ${model.name}`} onClick={() => open({ kind: o.kind === 'survey' && surveyed ? 'barn' : 'start', offerId: o.id, key: getSpecialistQuoteKey(game, o) })}>{acquired ? 'SOURCE USED' : o.kind === 'survey' && surveyed ? 'REVIEW RECOVERY PURCHASE' : 'REVIEW SPECIALIST OFFER'}</button>
        </div><div className="specialistOfferCar"><VehicleSilhouette catalogId={model.id} /><SpecialistFacts car={sample} /></div>
      </article>;
    })}</div>
    <div className="specialistActions"><button type="button" className="secondaryButton" onClick={onGarage}>OPEN YOUR GARAGE</button><button type="button" className="secondaryButton" onClick={onRestore}>OPEN RESTORATION</button></div>
    <p className="specialistNote">{getReservedVehicleIds(game).length} reserved space. A completed import/auction counts as ownership only when manually collected. Each source grants at most one car per save. Existing used stock and Icon offers remain separate and never refresh from these actions.</p>
    {review && offer && car && <dialog className="specialistDialog" ref={dialog} aria-labelledby="specialist-review-title" onCancel={close} onClose={() => setReview(null)}>
      <div className="specialistDialogHead"><span className="eyebrow">EXPLICIT COSTS / NO AUTOMATIC PURCHASE</span><button type="button" className="iconButton" aria-label="Close specialist preview" onClick={close}><X size={20} /></button></div>
      <h3 id="specialist-review-title">{review.kind === 'cancel' ? 'Cancel this contract?' : car.name}</h3>
      {review.kind !== 'cancel' && <SpecialistFacts car={car} />}
      {(review.kind === 'raise' || review.kind === 'start' && offer.kind === 'auction') && <>
        <label className="specialistBid"><span>Your maximum bid (yen)</span><input type="text" inputMode="numeric" aria-label="Maximum auction bid" value={bid} maxLength={7} onChange={(e) => setBid(e.target.value)} /></label>
        <p>Rival ceiling {yen(offer.rivalBidYen)}. You win at a maximum of {yen(getAuctionClearingPrice(offer))} or more and pay only that clearing price. Lower bids lose with a full escrow refund. No hidden random bids.</p>
        <p><b>Escrow charged now: {Number.isFinite(amount) ? yen(Math.max(0, amount - (review.kind === 'raise' ? review.bid : 0))) : 'Enter a valid bid'}.</b> Your bid is binding and cannot be cancelled; settle manually after the countdown. Unused escrow returns on settlement.</p>
      </>}
      {review.kind === 'start' && offer.kind === 'import' && <p><b>{yen(offer.priceYen + offer.transportYen)} paid now</b>, including {yen(offer.transportYen)} transport. Delivery in 90 seconds. One space is reserved. Cancellation returns the entire invoice; otherwise collect the exact shown car manually. No later fees.</p>}
      {review.kind === 'start' && offer.kind === 'survey' && <p><b>{yen(offer.surveyYen)} survey fee paid now, non-refundable even on cancellation.</b> Survey takes 45 seconds. Completing it reveals the fixed recovery offer, not a free car. Buying later costs {yen(offer.priceYen)}; restoration is optional and charged separately.</p>}
      {review.kind === 'barn' && <p><b>{yen(offer.priceYen)} paid now</b> for the exact project and its recovery. It arrives immediately in the shown condition, not restored. Optional full restoration: {yen(getRestorationQuote(car, 'full').costYen)}. One garage space is required.</p>}
      {review.kind === 'cancel' && <p>{contract?.kind === 'import' ? `Full refund: ${yen(contract.escrowYen)}. No vehicle is granted and the reserved space is released. You may order again.` : 'The paid survey fee is NOT refunded. No discovery or car is awarded. A later survey requires paying its fee again.'}</p>}
      {review.kind !== 'cancel' && <p>Once acquired, this source is consumed permanently, including after selling the car. Your active car and current driver activity remain unchanged.</p>}
      {reason && <p className="workshopWarning">{reason}</p>}{error && <p className="gameError" role="alert">{error}</p>}
      <div className="specialistActions"><button type="button" className="secondaryButton" onClick={close}>BACK</button><button type="button" className="installButton" disabled={!!reason} onClick={confirm}>
        {review.kind === 'cancel' ? 'CONFIRM CANCELLATION' : review.kind === 'raise' ? 'CONFIRM HIGHER BID' : review.kind === 'barn' ? 'BUY & RECOVER PROJECT' : offer.kind === 'import' ? 'PAY & ORDER IMPORT' : offer.kind === 'auction' ? 'PLACE BINDING BID' : 'PAY & START SURVEY'}</button></div>
    </dialog>}
  </section>;
}
