import { useEffect, useRef, useState } from 'react';
import { Check, LockKeyhole, Package, SlidersHorizontal, Wrench, X } from 'lucide-react';
import { findPart, isPartCompatible, PART_BRANDS, PARTS, SLOT_LABELS } from '../data/parts';
import { getPartRequirement, getVehicleBuildStats, isVehicleBusy, previewPart } from '../domain/tuning';
import { TUNING_SLOTS, type TuningSlot, type VehicleBuildStats } from '../domain/tuningTypes';
import type { GameState } from '../domain/types';
const yen = (n: number) => `¥${n.toLocaleString('en-US')}`;
const STAT_ROWS: { key: keyof VehicleBuildStats; label: string; unit: string; lowerBetter?: boolean }[] = [
  { key: 'powerPs', label: 'Power', unit: 'PS' }, { key: 'weightKg', label: 'Weight', unit: 'kg', lowerBetter: true },
  { key: 'powerToWeight', label: 'Power / weight', unit: 'PS/t' }, { key: 'grip', label: 'Grip', unit: '/100' },
  { key: 'handling', label: 'Handling', unit: '/100' }, { key: 'braking', label: 'Braking', unit: '/100' },
  { key: 'reliability', label: 'Reliability', unit: '/100' }, { key: 'originality', label: 'Originality', unit: '%' },
];
export function Workshop({ game, blocked, onInstall, onRemove }: {
  game: GameState; blocked: boolean;
  onInstall: (carId: string, partId: string, expected: string | null) => boolean;
  onRemove: (carId: string, slot: TuningSlot, expected: string) => boolean;
}) {
  const [targetId, setTargetId] = useState<string | null>(null);
  const [category, setCategory] = useState('all');
  const [feedback, setFeedback] = useState('');
  const [review, setReview] = useState<{ carId: string; partId: string; expected: string | null } | null>(null);
  const [reviewError, setReviewError] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const target = game.ownedVehicles.find((v) => v.instanceId === targetId)
    ?? game.ownedVehicles.find((v) => v.instanceId === game.activeVehicleId) ?? game.ownedVehicles[0];
  const reviewedCar = game.ownedVehicles.find((v) => v.instanceId === review?.carId);
  const reviewedPart = review ? findPart(review.partId) : undefined;
  useEffect(() => {
    const element = dialog.current;
    if (review && element && !element.open) element.showModal();
    else if (!review && element?.open) element.close();
  }, [review]);
  if (!target) return <section className="garageEmpty"><h2>No vehicle to tune.</h2><p>Select a starter in Garage or import a saved collection in Saves.</p></section>;
  const stats = getVehicleBuildStats(target);
  const busy = isVehicleBusy(game, target.instanceId);
  const partList = PARTS.filter((part) => category === 'all' || part.slot === category);
  const currentStats = reviewedCar ? getVehicleBuildStats(reviewedCar) : null;
  let after: VehicleBuildStats | null = null;
  let reason: string | null = null;
  if (reviewedCar && reviewedPart && review) {
    reason = blocked ? 'Resolve the save warning before tuning.' : getPartRequirement(game, reviewedCar, reviewedPart);
    if ((reviewedCar.tuning.installedBySlot[reviewedPart.slot] ?? null) !== review.expected) reason = 'This build changed. Close and review the part again.';
    try { after = previewPart(reviewedCar, reviewedPart); } catch { reason = 'This build would exceed its safe range.'; }
  }
  const owned = !!reviewedCar && !!reviewedPart && reviewedCar.tuning.purchasedPartIds.includes(reviewedPart.id);
  function close() { dialog.current?.close(); setReview(null); setReviewError(''); }
  function install() {
    if (!review || !reviewedPart || !reviewedCar || reason) return;
    if (onInstall(review.carId, review.partId, review.expected)) {
      setFeedback(`${reviewedPart.name} installed on ${reviewedCar.name}. ${owned ? 'No additional charge.' : `${yen(reviewedPart.priceYen)} paid.`} Saved.`);
      close();
    } else setReviewError('Installation was not applied. Close this preview and check the save warning. Your money and previous parts were kept.');
  }
  return <section className="workshopPanel" aria-labelledby="workshop-title">
    <div className="workshopHeading"><div><span className="eyebrow">MERCER PERFORMANCE / PARTS COUNTER</span><h2 id="workshop-title">Build your edge.</h2><p>Earn it. Fit it. Make it yours.</p></div>
      <label className="workshopVehicle"><span>VEHICLE TO TUNE</span><select value={target.instanceId} aria-label="Vehicle to tune"
        onChange={(event) => { setTargetId(event.target.value); setFeedback(''); }}>
        {game.ownedVehicles.map((car) => <option key={car.instanceId} value={car.instanceId}>{car.name} · {car.instanceId.slice(0, 8)}</option>)}
      </select><small>{target.instanceId === game.activeVehicleId ? 'Active ride' : 'Workshop target only · your active ride is unchanged'}</small></label>
    </div>
    <div className="workshopSummary"><Wrench size={20} /><strong>{target.name}</strong><span>{target.tuning.purchasedPartIds.length} purchased parts · {Object.keys(target.tuning.installedBySlot).length} fitted upgrades</span></div>
    <div className="buildStats" aria-label="Current build stats">{STAT_ROWS.map(({ key, label, unit }) => <div key={key}><span>{label}</span><strong data-testid={`build-${key}`}>{stats[key].toLocaleString('en-US', { maximumFractionDigits: 1 })}<small>{unit}</small></strong></div>)}</div>
    <p className="tuningNote">Build estimates, not a race result. Reliability is a build rating, not current engine condition. Tuning does not repair wear or change job rewards. Final art and racing arrive later.</p>
    {(busy || blocked) && <p className="workshopWarning" role="status">{blocked ? 'Save protected: resolve the global warning before buying or fitting parts.' : 'This car is assigned to a delivery. Claim or cancel that job before changing its build.'}</p>}
    {feedback && <p className="workshopFeedback" role="status">{feedback}</p>}
    <div className="workshopSubheading"><h3>Fitted setup</h3><span>One upgrade per slot · factory parts are kept</span></div>
    <div className="slotGrid">{TUNING_SLOTS.map((slot) => {
      const id = target.tuning.installedBySlot[slot]; const part = id ? findPart(id) : undefined;
      return <article className={`slotCard ${part ? 'slotModified' : ''}`} key={slot}>
        <span>{SLOT_LABELS[slot]}</span><strong>{part?.name ?? 'Factory specification'}</strong>
        {part ? <button type="button" className="secondaryButton" disabled={busy || blocked} aria-label={`Remove ${part.name}`}
          onClick={() => { if (onRemove(target.instanceId, slot, part.id)) setFeedback(`${part.name} stored for ${target.name}. Factory setup restored; no refund, free refitting.`); }}>RESTORE STOCK</button>
          : <small>{slot === 'turbo' && target.catalogId !== 'rz-t' ? 'No compatible turbo upgrade in this catalog' : 'ORIGINAL SETUP'}</small>}
      </article>;
    })}</div>
    <div className="workshopSubheading"><div><span className="eyebrow">AOBA / SENKA / KUROGANE</span><h3>Performance parts</h3></div>
      <label className="partsFilter"><SlidersHorizontal size={16} /><span className="srOnly">Filter parts by category</span><select value={category} onChange={(e) => setCategory(e.target.value)}>
        <option value="all">All categories</option>{TUNING_SLOTS.map((slot) => <option key={slot} value={slot}>{SLOT_LABELS[slot]}</option>)}
      </select></label></div>
    <div className="partsGrid">{partList.map((part) => {
      const compatible = isPartCompatible(part, target.catalogId);
      const fitted = target.tuning.installedBySlot[part.slot] === part.id;
      const purchased = target.tuning.purchasedPartIds.includes(part.id);
      const requirement = getPartRequirement(game, target, part);
      return <article className={`partCard ${!compatible ? 'partIncompatible' : ''}`} key={part.id} aria-label={`${part.name} part`}>
        <div className="partCardTop"><span>{PART_BRANDS[part.brand].name}</span>{fitted ? <Check size={18} /> : !compatible || game.playerLevel < part.minLevel ? <LockKeyhole size={18} /> : <Package size={18} />}</div>
        <span className="partCategory">{SLOT_LABELS[part.slot]} / LEVEL {part.minLevel}</span><h4>{part.name}</h4><p>{part.description}</p>
        <div className="partPrice"><strong>{purchased ? 'OWNED' : yen(part.priceYen)}</strong><span>{fitted ? 'FITTED' : purchased ? 'FREE TO REFIT' : compatible ? 'BUY ONCE FOR THIS CAR' : 'INCOMPATIBLE'}</span></div>
        <p className="partRequirement">{blocked ? 'Resolve the save warning first.' : requirement ?? 'Compatible · ready to install'}</p>
        <button type="button" className="secondaryButton" aria-label={`Review ${part.name}`} disabled={!compatible || blocked}
          onClick={() => { setReviewError(''); setReview({ carId: target.instanceId, partId: part.id, expected: target.tuning.installedBySlot[part.slot] ?? null }); }}>REVIEW BUILD CHANGES</button>
      </article>;
    })}</div>
    <p className="tuningNote">Parts are owned per vehicle. Swapping a slot keeps the old upgrade in that car's inventory. Restoring stock is free; reinstalling owned parts is free. No selling, transfers, engine swaps, automatic purchases or installation fees in this phase.</p>
    <dialog className="partDialog" ref={dialog} aria-labelledby="part-review-title" onClose={() => setReview(null)} onCancel={() => setReview(null)}>
      {reviewedPart && reviewedCar && currentStats && <>
        <div className="dialogHeading"><span className="eyebrow">{PART_BRANDS[reviewedPart.brand].name}</span><button type="button" className="iconButton" aria-label="Close part preview" onClick={close}><X size={20} /></button></div>
        <h3 id="part-review-title">{reviewedPart.name}</h3><p>Target: <strong>{reviewedCar.name}</strong> · {reviewedCar.instanceId.slice(0, 8)}</p>
        <p>{reviewedPart.description}</p>
        <table className="comparisonTable"><caption>Current setup compared with this part installed</caption><thead><tr><th>Stat</th><th>Current</th><th>Preview</th><th>Change</th></tr></thead>
          <tbody>{STAT_ROWS.map(({ key, label, unit, lowerBetter }) => {
            const delta = after ? Math.round((after[key] - currentStats[key]) * 10) / 10 : 0;
            const good = lowerBetter ? delta < 0 : delta > 0;
            return <tr key={key}><th scope="row">{label} <small>{unit}</small></th><td>{currentStats[key]}</td><td>{after?.[key] ?? '—'}</td><td className={delta === 0 ? '' : good ? 'positiveChange' : 'negativeChange'}>{delta > 0 ? '+' : ''}{delta}</td></tr>;
          })}</tbody></table>
        <p className="tuningNote">Replaces {reviewedCar.tuning.installedBySlot[reviewedPart.slot] ? findPart(reviewedCar.tuning.installedBySlot[reviewedPart.slot]!)?.name : 'factory setup'} in this slot. Replaced parts are kept.</p>
        <p className="previewCost">{owned ? 'Owned by this vehicle · free installation' : `${yen(reviewedPart.priceYen)} · ${yen(Math.max(0, game.cashYen - reviewedPart.priceYen))} remaining if purchased`}</p>
        {reason && <p className="workshopWarning">{reason}</p>}{reviewError && <p role="alert" className="gameError">{reviewError}</p>}
        <div className="dialogActions"><button type="button" className="secondaryButton" onClick={close}>CANCEL</button>
          <button type="button" className="installButton" disabled={!!reason || !after || !review} onClick={install}>{owned ? 'INSTALL OWNED PART' : 'BUY & INSTALL'}</button></div>
      </>}
    </dialog>
  </section>;
}
