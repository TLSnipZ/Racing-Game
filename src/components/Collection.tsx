import { useEffect, useRef, useState } from 'react';
import { Award, BookOpen, Check, Crown, KeyRound, LockKeyhole, Search, Trophy, X } from 'lucide-react';
import { ACHIEVEMENTS, ACHIEVEMENT_CATEGORIES, findAchievement, type AchievementCategory } from '../data/achievements';
import { ICON_OFFERS, findIconOffer, RARITY_LABELS } from '../data/collection';
import { MANUFACTURERS, BODY_TYPES, findVehicleDefinition, VEHICLE_CATALOG, type ManufacturerId } from '../data/vehicles';
import { getAchievementProgress, getClaimableAchievements, getCollectedModelIds, getTotalCollectionRewards } from '../domain/collectionProgress';
import { createBookFilters, listCollectionModels } from '../domain/collectionFilters';
import { createIconVehicle, getIconRequirement } from '../domain/collection';
import { GARAGE_CAPACITY } from '../domain/marketStock';
import { RARITIES, type AchievementStatus, type CollectionStatus, type Rarity } from '../domain/collectionTypes';
import type { GameState } from '../domain/types';
import { VehicleSilhouette } from './VehicleSilhouette';
import { RarityBadge } from './RarityBadge';

const yen = (n: number) => `¥${n.toLocaleString('en-US')}`;
type PageMode = 'book' | 'achievements' | 'icons';
const MODES = [{ id: 'book', label: 'Collection Book', Icon: BookOpen }, { id: 'achievements', label: 'Achievements', Icon: Trophy }, { id: 'icons', label: 'Icon Showroom', Icon: Crown }] as const;
export function Collection({ game, blocked, onClaim, onIcon, onMarket, onGarage }: {
  game: GameState; blocked: boolean; onClaim: (id: string) => boolean;
  onIcon: (id: string, price: number) => boolean; onMarket: () => void; onGarage: () => void;
}) {
  const [mode, setMode] = useState<PageMode>('book');
  const [filters, setFilters] = useState(createBookFilters);
  const [category, setCategory] = useState<AchievementCategory | 'all'>('all');
  const [status, setStatus] = useState<AchievementStatus>('all');
  const [review, setReview] = useState<{ id: string; price: number } | null>(null);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const committing = useRef(false);
  const claiming = useRef(new Set<string>());
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (review && dialog.current && !dialog.current.open) dialog.current.showModal();
    else if (!review && dialog.current?.open) dialog.current.close();
  }, [review]);
  const models = getCollectedModelIds(game);
  const ready = getClaimableAchievements(game);
  const earned = ACHIEVEMENTS.filter((item) => getAchievementProgress(game, item).unlocked).length;
  const book = listCollectionModels(game, filters);
  const achievements = ACHIEVEMENTS.filter((item) => {
    const progress = getAchievementProgress(game, item);
    return (category === 'all' || category === item.category) && (status === 'all' || (status === 'ready' ? progress.claimable : status === 'claimed' ? progress.claimed : !progress.unlocked));
  });
  const offer = review ? findIconOffer(review.id) : undefined;
  const car = offer ? createIconVehicle(game, offer) : null;
  const reason = blocked ? 'Resolve the save warning before purchasing.' : offer ? getIconRequirement(game, offer) : null;
  function claim(id: string) {
    if (blocked || claiming.current.has(id)) return;
    claiming.current.add(id);
    if (onClaim(id)) { setFeedback(`${findAchievement(id)!.name}: ${yen(findAchievement(id)!.rewardYen)} received and saved.`); setError(''); }
    else { claiming.current.delete(id); setError('Reward not applied. Check the save warning; your previous cash and claim are intact.'); }
  }
  function close() { dialog.current?.close(); setReview(null); setError(''); }
  function open(id: string, price: number) { committing.current = false; setError(''); setReview({ id, price }); }
  function buyIcon() {
    if (!review || !offer || !car || reason || committing.current) return;
    committing.current = true;
    if (onIcon(review.id, review.price)) {
      setFeedback(`${car.name} purchased for ${yen(review.price)}. This one-time offer is now used; the car and collection record are saved.`);
      close(); document.getElementById('tab-collection')?.focus({ preventScroll: true });
    } else { committing.current = false; setError('Purchase not applied. Your money, garage and one-time offer were kept. Check the save warning.'); }
  }
  return <section className="collectorPanel" aria-labelledby="collector-title">
    <div className="bookHeader"><div><span className="eyebrow">KAGEHAMA MOTOR ARCHIVE / VOLUME 01</span><h2 id="collector-title">More than horsepower.</h2>
      <p>Keep the stories. Collect the keys. A rare badge is not a performance upgrade.</p></div>
      <div className="bookSeal" aria-hidden="true"><BookOpen size={34} /><span>THE MIDNIGHT<br />ARCHIVE</span></div></div>
    <div className="collectorSummary" aria-label="Collection progress">
      <div><span>MODELS COLLECTED</span><strong data-testid="collected-count">{models.length}<small> / {VEHICLE_CATALOG.length}</small></strong><progress aria-label="Model collection progress" max={VEHICLE_CATALOG.length} value={models.length} /></div>
      <div><span>ACHIEVEMENTS EARNED</span><strong data-testid="earned-count">{earned}<small> / {ACHIEVEMENTS.length}</small></strong><progress aria-label="Achievement completion" max={ACHIEVEMENTS.length} value={earned} /></div>
      <div><span>REWARDS READY</span><strong>{ready.length}</strong><small>{yen(getTotalCollectionRewards(game))} claimed in total</small></div>
    </div>
    <div className="collectorMode" role="group" aria-label="Collection sections">{MODES.map(({ id, label, Icon }) =>
      <button key={id} type="button" aria-pressed={mode === id} onClick={() => setMode(id)}><Icon size={17} />{label}{id === 'achievements' && ready.length > 0 && <b>{ready.length}</b>}</button>)}</div>
    {feedback && <p className="collectorFeedback" role="status">{feedback}</p>}
    {error && !review && <p className="workshopWarning" role="alert">{error}</p>}
    {mode === 'book' && <>
      <div className="bookFilters">
        <label className="bookSearch"><span><Search size={13} /> Search collection</span><input type="search" value={filters.query} placeholder="Model name or year" onChange={(e) => setFilters({ ...filters, query: e.target.value })} /></label>
        <label><span>Collection manufacturer</span><select value={filters.manufacturer} onChange={(e) => setFilters({ ...filters, manufacturer: e.target.value as ManufacturerId | 'all' })}><option value="all">All manufacturers</option>{Object.entries(MANUFACTURERS).map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
        <label><span>Collection ownership</span><select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value as CollectionStatus })}><option value="all">All models</option><option value="collected">Ever collected</option><option value="owned">Currently owned</option><option value="missing">Not collected</option></select></label>
      </div>
      <div className="rarityFilters" role="group" aria-label="Collection rarity"><button type="button" aria-pressed={filters.rarity === 'all'} onClick={() => setFilters({ ...filters, rarity: 'all' })}>All rarities</button>
        {RARITIES.map((rarity) => <button key={rarity} type="button" aria-pressed={filters.rarity === rarity} onClick={() => setFilters({ ...filters, rarity: rarity as Rarity })}>{RARITY_LABELS[rarity]}</button>)}</div>
      <div className="bookResults"><span role="status">{book.length} of {VEHICLE_CATALOG.length} models shown</span><button type="button" className="secondaryButton" onClick={() => setFilters(createBookFilters())}>RESET COLLECTION FILTERS</button></div>
      <div className="bookGrid">{book.map((model) => {
        const owned = game.ownedVehicles.filter((v) => v.catalogId === model.id).length;
        const collected = models.includes(model.id);
        return <article key={model.id} className={`bookCard ${collected ? 'bookCollected' : 'bookMissing'}`} aria-label={`Collection ${model.name}`}>
          <div className="bookCardTop"><RarityBadge catalogId={model.id} /><span>{collected ? <Check size={16} /> : <LockKeyhole size={16} />}{collected ? 'COLLECTED' : 'NOT COLLECTED'}</span></div>
          <VehicleSilhouette catalogId={model.id} /><div className="bookCardCopy"><span className="eyebrow">{MANUFACTURERS[model.manufacturer]} / {BODY_TYPES[model.bodyType]}</span><h3>{model.name}</h3>
            <p>{model.description}</p><div className="bookSpecs"><span>{model.years[0] === model.years[1] ? model.years[0] : model.years.join('–')}</span><span>{model.hp} PS · {model.drive}</span></div>
            <strong className="bookOwnership">{owned ? `${owned} currently owned` : collected ? 'Collected · no longer parked here' : 'Still waiting for your first set of keys'}</strong>
            <button type="button" className="secondaryButton" onClick={owned ? onGarage : model.acquisition === 'icon' ? () => setMode('icons') : onMarket}>{owned ? 'OPEN GARAGE' : model.acquisition === 'icon' ? 'VIEW ICON GOALS' : 'BROWSE USED MARKET'}</button></div>
        </article>;
      })}</div>
      {book.length === 0 && <p className="collectorEmpty">No models match this combination. Reset the collection filters to see all cars.</p>}
      <p className="collectorNote">Collected means you have owned the model, not merely seen it in a shop or rival grid. Selling a car keeps its book entry. Copies of the same model count once here; all copies still take garage spaces. Older saves can recover only ownership supported by their stored cars, original starter or last player race snapshot.</p>
    </>}
    {mode === 'achievements' && <>
      <div className="bookFilters achievementFilters"><label><span>Achievement category</span><select value={category} onChange={(e) => setCategory(e.target.value as AchievementCategory | 'all')}><option value="all">All categories</option>{Object.entries(ACHIEVEMENT_CATEGORIES).map(([id, label]) => <option value={id} key={id}>{label}</option>)}</select></label>
        <label><span>Achievement status</span><select value={status} onChange={(e) => setStatus(e.target.value as AchievementStatus)}><option value="all">All achievements</option><option value="ready">Ready to claim</option><option value="locked">Locked</option><option value="claimed">Claimed</option></select></label></div>
      <p className="collectorNote">Earned badges stay earned. Claim each yen reward once when you are ready, including goals provable from an older save. No auto-payout, extra XP or passive bonus. Claimed cash is separate from job, race and dealer income.</p>
      <div className="achievementGrid">{achievements.map((item) => {
        const progress = getAchievementProgress(game, item);
        return <article key={item.id} className={`achievementCard ${progress.claimable ? 'achievementReady' : ''}`} aria-label={`Achievement ${item.name}`}>
          <div className="achievementEmblem" aria-hidden="true">{progress.claimed ? <Check size={25} /> : progress.unlocked ? <Trophy size={25} /> : <Award size={25} />}</div>
          <div className="achievementCopy"><span className="eyebrow">{ACHIEVEMENT_CATEGORIES[item.category]} / {progress.claimed ? 'CLAIMED' : progress.unlocked ? 'EARNED' : 'LOCKED'}</span><h3>{item.name}</h3><p>{item.description}</p><p className="achievementRequirement">{item.requirement}</p>
            <div className="achievementProgress"><progress aria-label={`${item.name} progress`} max={item.target} value={progress.value} /><span>{progress.value} / {item.target}</span></div>
            <button type="button" className="secondaryButton" aria-label={`Claim ${item.name}`} disabled={blocked || !progress.claimable} onClick={() => claim(item.id)}>{progress.claimed ? 'REWARD CLAIMED' : `${progress.unlocked ? 'CLAIM' : 'REWARD'} ${yen(item.rewardYen)}`}</button></div>
        </article>;
      })}</div>
      {achievements.length === 0 && <p className="collectorEmpty">No achievements match these filters. <button type="button" className="secondaryButton" onClick={() => { setCategory('all'); setStatus('all'); }}>RESET ACHIEVEMENT FILTERS</button></p>}
    </>}
    {mode === 'icons' && <>
      <div className="iconIntroduction"><Crown size={26} /><div><h3>Earn the invitation. Buy the car.</h3><p>Two curated offers. Fixed specifications, no refresh lottery. Each offer can be purchased once per save, even after selling its car. No free cars or extra garage spaces.</p></div></div>
      <div className="iconGrid">{ICON_OFFERS.map((icon) => {
        const model = findVehicleDefinition(icon.catalogId)!;
        const goal = findAchievement(icon.achievementId)!;
        const progress = getAchievementProgress(game, goal);
        const purchased = game.collection.purchasedIconIds.includes(icon.id);
        const requirement = getIconRequirement(game, icon);
        return <article key={icon.id} className="iconCard" aria-label={`Icon ${model.name}`}><div className="bookCardTop"><RarityBadge catalogId={model.id} /><span>{purchased ? 'OFFER PURCHASED' : 'ONE-TIME OFFER'}</span></div><VehicleSilhouette catalogId={model.id} />
          <h3>{model.name}</h3><p>{model.description}</p><div className="bookSpecs"><span>{icon.year} · {model.hp} PS</span><span>{model.weightKg.toLocaleString('en-US')} kg · {model.drive}</span></div>
          <ul className="iconRequirements"><li>{game.playerLevel >= icon.minLevel ? <Check size={14} /> : <LockKeyhole size={14} />} Level {icon.minLevel}</li>
            <li>{progress.unlocked ? <Check size={14} /> : <LockKeyhole size={14} />} {goal.name} · {progress.value}/{progress.target}</li><li><KeyRound size={14} /> {game.ownedVehicles.length}/{GARAGE_CAPACITY} garage spaces used</li></ul>
          <p className="iconGoalText">{goal.requirement} The achievement reward does not need to be claimed.</p><strong className="iconPrice">{yen(icon.priceYen)}</strong>
          <p className="iconGoalText">95% engine/body/transmission · 100% originality · 10,000 km · Stock parts</p>
          <p className="iconGate">{blocked ? 'Resolve the save warning first.' : requirement ?? 'Invitation ready. Inspect the exact car before confirming.'}</p>
          <button type="button" className="secondaryButton" aria-label={`Review Icon ${model.name}`} disabled={blocked || purchased} onClick={() => open(icon.id, icon.priceYen)}>INSPECT ICON OFFER</button>
        </article>;
      })}</div>
    </>}
    {review && car && offer && <dialog ref={dialog} className="iconDialog" aria-labelledby="icon-review-title" onCancel={close} onClose={() => { setReview(null); setError(''); }}>
      <div className="iconDialogHead"><span className="eyebrow">CONFIRM A ONE-TIME ICON PURCHASE</span><button type="button" className="iconClose" aria-label="Close Icon preview" onClick={close}><X size={20} /></button></div>
      <h3 id="icon-review-title">{car.name}</h3><RarityBadge catalogId={car.catalogId} /><VehicleSilhouette catalogId={car.catalogId} />
      <dl className="iconFacts"><div><dt>Price</dt><dd>{yen(review.price)}</dd></div><div><dt>Cash after purchase</dt><dd>{game.cashYen >= review.price ? yen(game.cashYen - review.price) : 'Insufficient cash'}</dd></div>
        <div><dt>Year / odometer</dt><dd>{car.year} / {car.odometerKm.toLocaleString('en-US')} km</dd></div><div><dt>Factory power / weight</dt><dd>{car.hp} PS / {car.weightKg} kg</dd></div>
        <div><dt>Engine / body / transmission</dt><dd>95% / 95% / 95%</dd></div><div><dt>Originality / tuning</dt><dd>100% / Stock</dd></div><div><dt>Instance ID</dt><dd>{car.instanceId}</dd></div></dl>
      <p className="collectorNote">Uses one garage space. Your current active vehicle and pending activity stay unchanged. Selling this car later does not restore this offer. All paid parts remain specific to their own car.</p>
      {reason && <p className="workshopWarning">{reason}</p>}{error && <p className="workshopWarning" role="alert">{error}</p>}
      <div className="iconDialogActions"><button type="button" className="secondaryButton" onClick={close}>CANCEL</button><button type="button" className="iconBuy" disabled={!!reason} onClick={buyIcon}>BUY ICON VEHICLE</button></div>
    </dialog>}
  </section>;
}
