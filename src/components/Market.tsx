import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, KeyRound, RefreshCw, Search, ShoppingBag, X } from 'lucide-react';
import { BODY_TYPES, findVehicleModel, MANUFACTURERS, type BodyType, type Manufacturer } from '../data/vehicles';
import { EMPTY_MARKET_FILTERS, filterMarketListings, getListingKey, getMarketFilterError, getPurchaseRequirement,
  getRefreshRequirement, getSaleKey, getSaleRequirement, type MarketFilters, type MarketSort } from '../domain/market';
import { GARAGE_CAPACITY, MARKET_REFRESH_FEE, MARKET_REFRESH_MS } from '../domain/marketStock';
import { getVehicleValuation } from '../domain/vehicleValue';
import { getVehicleBuildStats } from '../domain/tuning';
import type { GameState, PlayerVehicle } from '../domain/types';
import { VehicleSilhouette } from './VehicleSilhouette';
const yen = (n: number) => `¥${n.toLocaleString('en-US')}`;
const number = (n: number) => n.toLocaleString('en-US');
type Review = { kind: 'buy'; id: string; key: string } | { kind: 'sell'; id: string; key: string } | { kind: 'refresh'; batch: number };
function VehicleFacts({ car }: { car: PlayerVehicle }) {
  return <dl className="marketFacts">
    <div><dt>Year / layout</dt><dd>{car.year} / {car.drive}</dd></div>
    <div><dt>Mileage</dt><dd>{number(car.odometerKm)} km</dd></div>
    <div><dt>Engine</dt><dd>{car.engineCondition}%</dd></div><div><dt>Body</dt><dd>{car.bodyCondition}%</dd></div>
    <div><dt>Transmission</dt><dd>{car.transmissionCondition}%</dd></div><div><dt>Originality</dt><dd>{getVehicleBuildStats(car).originality}%</dd></div>
  </dl>;
}
export function Market({ game, blocked, visible, onBuy, onSell, onRefresh, onGarage }: {
  game: GameState; blocked: boolean; visible: boolean;
  onBuy: (id: string, key: string) => boolean; onSell: (id: string, key: string) => boolean;
  onRefresh: (batch: number) => boolean; onGarage: () => void;
}) {
  const [mode, setMode] = useState<'buy' | 'sell'>('buy');
  const [filters, setFilters] = useState<MarketFilters>({ ...EMPTY_MARKET_FILTERS });
  const [sort, setSort] = useState<MarketSort>('price-low');
  const [now, setNow] = useState(() => Date.now());
  const [review, setReview] = useState<Review | null>(null);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLElement | null>(null);
  // Presentation-only refresh cooldown. No automatic stock generation, purchases or saves.
  useEffect(() => {
    if (!visible) return;
    const refresh = () => setNow(Date.now()); refresh();
    const timer = window.setInterval(refresh, 1000);
    document.addEventListener('visibilitychange', refresh);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', refresh); };
  }, [visible]);
  useEffect(() => {
    if (review && dialog.current && !dialog.current.open) dialog.current.showModal();
    if (!review && dialog.current?.open) dialog.current.close();
  }, [review]);
  function open(next: Review) { trigger.current = document.activeElement as HTMLElement; setError(''); setReview(next); }
  function close() { dialog.current?.close(); setReview(null); setError(''); trigger.current?.focus({ preventScroll: true }); }
  function change<K extends keyof MarketFilters>(key: K, value: MarketFilters[K]) { setFilters((old) => ({ ...old, [key]: value })); }
  function clearFilters() { setFilters({ ...EMPTY_MARKET_FILTERS }); setSort('price-low'); }
  const filterError = getMarketFilterError(filters);
  const offers = filterMarketListings(game.market.listings, filters, sort);
  const available = game.market.listings.filter((item) => !item.purchased).length;
  const remaining = Math.max(0, Math.ceil((game.market.nextRefreshAtMs - now) / 1000));
  const refreshReason = getRefreshRequirement(game, now);
  const listing = review?.kind === 'buy' ? game.market.listings.find((item) => item.id === review.id) : undefined;
  const selling = review?.kind === 'sell' ? game.ownedVehicles.find((v) => v.instanceId === review.id) : undefined;
  const car = listing?.vehicle ?? selling;
  const value = car ? getVehicleValuation(car) : null;
  const replacement = selling && selling.instanceId === game.activeVehicleId
    ? game.ownedVehicles.find((v) => v.instanceId !== selling.instanceId) : null;
  let reason: string | null = blocked ? 'Resolve the global save warning first.' : null;
  if (!reason && review?.kind === 'buy') reason = !listing || getListingKey(listing) !== review.key
    ? 'This listing changed. Close and review it again.' : getPurchaseRequirement(game, listing);
  if (!reason && review?.kind === 'sell') reason = getSaleKey(game, review.id) !== review.key
    ? 'This garage or build changed. Close and review the sale again.' : getSaleRequirement(game, review.id);
  if (!reason && review?.kind === 'refresh') reason = game.market.batch !== review.batch ? 'Stock already changed.' : refreshReason;
  function confirm() {
    if (!review || reason) return;
    let ok = false;
    if (review.kind === 'buy' && listing) {
      ok = onBuy(review.id, review.key);
      if (ok) setFeedback(`${listing.vehicle.name} purchased for ${yen(listing.askYen)}. It is in your garage; your existing active car is unchanged.`);
    } else if (review.kind === 'sell' && selling && value) {
      ok = onSell(review.id, review.key);
      if (ok) setFeedback(`${selling.name} sold for ${yen(value.offerYen)}, including its parts. ${replacement ? `${replacement.name} is now active.` : 'Your active car is unchanged.'}`);
    } else if (review.kind === 'refresh') {
      ok = onRefresh(review.batch);
      if (ok) setFeedback(`Nine new listings sourced for ${yen(MARKET_REFRESH_FEE)}. Your owned vehicles are unchanged.`);
    }
    if (ok) close();
    else setError('The transaction was not applied. Close this preview and check the save warning. Your previous cash, cars and stock were kept.');
  }
  return <section className="marketPanel" aria-labelledby="market-title">
    <div className="marketHeading"><div><span className="eyebrow">EAST WARD / MERCER USED IMPORTS</span>
      <h2 id="market-title">More keys. More stories.</h2><p>Not new. Not perfect. Definitely yours.</p></div>
      <div className="marketCapacity"><KeyRound size={20} /><strong data-testid="market-capacity">{game.ownedVehicles.length} / {GARAGE_CAPACITY}</strong><span>GARAGE SPACES</span></div></div>
    <div className="marketBanner"><ShoppingBag size={20} /><p>Six models. Individual mileage and condition. Every listing is one actual car.
      <small>Purchases open at Level 2. New stock is manual, not a reload lottery. Profiles are placeholders; final artwork comes later.</small></p></div>
    <div className="marketToolbar"><div className="marketModes" role="group" aria-label="Market mode">
      <button type="button" aria-pressed={mode === 'buy'} onClick={() => setMode('buy')}>BUY CARS <b>{available}</b></button>
      <button type="button" aria-pressed={mode === 'sell'} onClick={() => setMode('sell')}>SELL CARS <b>{game.ownedVehicles.length}</b></button></div>
      <button className="secondaryButton" type="button" onClick={onGarage}>OPEN GARAGE <ArrowRight size={15} /></button></div>
    {blocked && <p className="workshopWarning" role="status">Save protected. You can browse; resolve the global warning before trading.</p>}
    {feedback && <p className="marketFeedback" role="status">{feedback}</p>}
    {game.market.lastTrade && <p className="marketLastTrade" data-testid="market-last-trade">LAST TRADE #{game.market.lastTrade.id} · {game.market.lastTrade.kind === 'buy' ? 'BOUGHT' : 'SOLD'} {game.market.lastTrade.vehicleName} · {yen(game.market.lastTrade.amountYen)}</p>}

    {mode === 'buy' ? <>
      <div className="marketFilters" role="group" aria-label="Vehicle market filters">
        <label className="marketSearch"><span><Search size={14} /> Search listings</span><input type="search" aria-label="Search market listings" placeholder="Model, listing ID or seller" value={filters.search} onChange={(e) => change('search', e.target.value)} /></label>
        <label><span>Manufacturer</span><select aria-label="Market manufacturer" value={filters.manufacturer} onChange={(e) => change('manufacturer', e.target.value as Manufacturer | 'all')}><option value="all">All brands</option>{Object.entries(MANUFACTURERS).map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
        <label><span>Body type</span><select aria-label="Market body type" value={filters.bodyType} onChange={(e) => change('bodyType', e.target.value as BodyType | 'all')}><option value="all">All body types</option>{Object.entries(BODY_TYPES).map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
        <label><span>From year</span><input inputMode="numeric" maxLength={4} aria-label="Market year from" placeholder="Any" value={filters.yearFrom} onChange={(e) => change('yearFrom', e.target.value)} /></label>
        <label><span>To year</span><input inputMode="numeric" maxLength={4} aria-label="Market year to" placeholder="Any" value={filters.yearTo} onChange={(e) => change('yearTo', e.target.value)} /></label>
        <label><span>Sort</span><select aria-label="Sort market listings" value={sort} onChange={(e) => setSort(e.target.value as MarketSort)}>
          <option value="price-low">Price: low first</option><option value="price-high">Price: high first</option><option value="year-new">Year: newest</option><option value="year-old">Year: oldest</option><option value="mileage">Mileage: low first</option><option value="condition">Condition: high first</option></select></label>
        <label className="marketCheck"><input type="checkbox" checked={filters.showPurchased} onChange={(e) => change('showPurchased', e.target.checked)} /> Include purchased listings</label>
        <button type="button" className="secondaryButton" onClick={clearFilters}>CLEAR FILTERS</button>
      </div>
      {filterError && <p className="workshopWarning" role="status">{filterError}</p>}
      <div className="marketResults"><span data-testid="market-results">{offers.length} / {game.market.listings.length} LISTINGS · BATCH {game.market.batch}</span>
        <small>Filters combine. Set both years equal to find a single model year.</small></div>
      <div className="marketGrid">{offers.map((offer) => {
        const model = findVehicleModel(offer.vehicle.catalogId)!;
        const why = getPurchaseRequirement(game, offer);
        return <article key={offer.id} className={`marketCard ${offer.purchased ? 'marketSold' : ''}`} aria-label={`Listing ${offer.id}`}>
          <div className="marketCardTop"><span>{MANUFACTURERS[model.manufacturer]} / {BODY_TYPES[model.bodyType]}</span><b>{offer.purchased ? 'PURCHASED' : `LV ${offer.minLevel}+`}</b></div>
          <VehicleSilhouette catalogId={offer.vehicle.catalogId} />
          <div className="marketCardBody"><span className="eyebrow">{offer.seller} · {offer.id}</span><h3>{offer.vehicle.name}</h3><p>{offer.vehicle.engine} · {offer.vehicle.hp} PS · {number(offer.vehicle.weightKg)} kg</p>
            <VehicleFacts car={offer.vehicle} /><div className="marketPrice"><strong>{yen(offer.askYen)}</strong><span>ONE VEHICLE / NO HIDDEN FEES</span></div>
            <p className="marketRequirement">{blocked ? 'Resolve the save warning first.' : why ?? 'Available · inspect before buying'}</p>
            <button className="marketPrimary" type="button" aria-label={`Inspect listing ${offer.id}`} disabled={offer.purchased || blocked}
              onClick={() => open({ kind: 'buy', id: offer.id, key: getListingKey(offer) })}>INSPECT & BUY <ArrowRight size={16} /></button>
          </div></article>;
      })}</div>
      {offers.length === 0 && <div className="marketEmpty" role="status"><Search size={25} /><h3>No matching cars.</h3><p>Clear your filters or include purchased listings. Browsing does not refresh the stock.</p><button type="button" className="secondaryButton" onClick={clearFilters}>RESET SEARCH</button></div>}
      <div className="marketRestock"><div><h3>Another night. Another batch.</h3><p>Replace all current listings for <strong>{yen(MARKET_REFRESH_FEE)}</strong>. Owned cars stay yours. Unsold offers will be gone.</p>
        <small>{remaining > 0 ? `Next refresh in ${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}` : refreshReason ?? 'New listings can be requested now.'} · {MARKET_REFRESH_MS / 60000}-minute cooldown after refresh.</small></div>
        <button type="button" className="secondaryButton" disabled={blocked || !!refreshReason} onClick={() => open({ kind: 'refresh', batch: game.market.batch })}><RefreshCw size={15} /> REVIEW NEW STOCK</button></div>
    </> : <>
      <p className="marketSellNote">Dealer offers reflect condition, mileage, model year and originality. All purchased parts leave with the car, including stored replacements, with 20% of their catalog cost credited. The dealer spread makes immediate buy/sell a loss. You must keep at least one car.</p>
      <div className="marketGrid">{game.ownedVehicles.map((vehicle) => {
        const quote = getVehicleValuation(vehicle); const why = getSaleRequirement(game, vehicle.instanceId);
        return <article key={vehicle.instanceId} className="marketCard" aria-label={`Sell ${vehicle.instanceId}`}>
          <div className="marketCardTop"><span>YOUR VEHICLE / {vehicle.year}</span>{game.activeVehicleId === vehicle.instanceId && <b><Check size={12} /> ACTIVE</b>}</div>
          <VehicleSilhouette catalogId={vehicle.catalogId} /><div className="marketCardBody"><span className="eyebrow">{vehicle.instanceId}</span><h3>{vehicle.name}</h3>
            <VehicleFacts car={vehicle} /><p>{vehicle.tuning.purchasedPartIds.length} purchased parts included · {getVehicleBuildStats(vehicle).powerPs} PS build</p>
            <div className="marketPrice"><strong>{quote ? yen(quote.offerYen) : 'NO QUOTE'}</strong><span>DEALER OFFER</span></div>
            <p className="marketRequirement">{blocked ? 'Resolve the save warning first.' : why ?? 'Sale available · confirmation required'}</p>
            <button className="secondaryButton" type="button" aria-label={`Review sale ${vehicle.instanceId}`} disabled={blocked || !quote}
              onClick={() => open({ kind: 'sell', id: vehicle.instanceId, key: getSaleKey(game, vehicle.instanceId) })}>REVIEW SALE</button></div></article>;
      })}</div>
    </>}
    <div className="marketTotals"><span>CARS BOUGHT <b>{game.market.purchases}</b></span><span>CARS SOLD <b>{game.market.sales}</b></span><span>PURCHASES <b>{yen(game.market.totalSpentYen)}</b></span><span>SALES <b>{yen(game.market.totalReceivedYen)}</b></span></div>
    <p className="tuningNote">No auctions, repairs, automated trades or cloud market yet. Values are provisional game balance. Selling removes the exact vehicle and its parts permanently unless you restore an older exported save. Previously imported garages above 12 spaces are kept, but cannot buy more until below capacity.</p>
    <dialog className="marketDialog" ref={dialog} aria-labelledby="market-review-title" onCancel={close} onClose={() => setReview(null)}>
      {review && <><div className="dialogHeading"><span className="eyebrow">MERCER / {review.kind === 'refresh' ? 'STOCK SOURCING' : 'VEHICLE TRANSACTION'}</span><button type="button" className="iconButton" aria-label="Close market preview" onClick={close}><X size={20} /></button></div>
        <h3 id="market-review-title">{review.kind === 'refresh' ? 'Replace the current stock?' : review.kind === 'sell' ? `Sell ${car?.name ?? 'vehicle'}?` : car?.name ?? 'Listing unavailable'}</h3>
        {car && <><p>{car.engine} · {number(getVehicleBuildStats(car).powerPs)} PS · ID {car.instanceId}</p><VehicleFacts car={car} /></>}
        {review.kind === 'buy' && listing && <><p>{findVehicleModel(listing.vehicle.catalogId)?.description}</p><p className="previewCost">Price: {yen(listing.askYen)} · Cash after purchase: {game.cashYen >= listing.askYen ? yen(game.cashYen - listing.askYen) : 'insufficient funds'}</p>
          <p>Space {game.ownedVehicles.length + 1} of {GARAGE_CAPACITY}. This exact car is added with stock parts. Your existing active ride stays selected.</p><p className="tuningNote">Immediate dealer resale: {value ? yen(value.offerYen) : 'unavailable'}. This is not a guaranteed-profit flip.</p></>}
        {review.kind === 'sell' && selling && value && <><p className="previewCost">Dealer pays {yen(value.offerYen)} · Includes {yen(value.partsCreditYen)} credit for all purchased parts.</p>
          <p><strong>This vehicle and its {selling.tuning.purchasedPartIds.length} purchased parts will leave your garage.</strong> No buyback is offered.</p>
          <p>{replacement ? `Selling your active ride selects ${replacement.name} (${replacement.instanceId}) next.` : 'Your existing active ride will remain selected.'}</p>
          <p className="tuningNote">Previously completed job/race records are kept. Export a backup in Saves before selling a treasured build.</p></>}
        {review.kind === 'refresh' && <><p className="previewCost">Sourcing fee: {yen(MARKET_REFRESH_FEE)}</p><p>Nine new individual offers replace the current batch. Unsold listings disappear, but your owned cars and ongoing job/race stay unchanged. The next refresh unlocks after five minutes. Nothing refreshes automatically.</p></>}
        {reason && <p className="workshopWarning">{reason}</p>}{error && <p className="gameError" role="alert">{error}</p>}
        <div className="dialogActions"><button type="button" className="secondaryButton" onClick={close}>CANCEL</button><button type="button" className={review.kind === 'sell' ? 'dangerButton' : 'marketPrimary'} disabled={!!reason} onClick={confirm}>
          {review.kind === 'buy' ? 'CONFIRM PURCHASE' : review.kind === 'sell' ? 'CONFIRM SALE' : 'CONFIRM NEW STOCK'}</button></div>
      </>}
    </dialog>
  </section>;
}
