import { getReservedVehicleIds } from '../domain/garageCapacity';
import { RarityBadge } from './RarityBadge';
import { useEffect, useRef, useState } from 'react';
import { ArrowRightLeft, Check, KeyRound, LockKeyhole, RefreshCw, Search, Store, X } from 'lucide-react';
import { BODY_TYPES, MANUFACTURERS, findVehicleDefinition, type BodyType, type ManufacturerId } from '../data/vehicles';
import { getBuyRequirement, getRefreshRequirement, getSellRequirement, getVehicleSaleKey } from '../domain/market';
import { createMarketFilters, filterMarketListings, getMarketFilterError } from '../domain/marketFilters';
import { GARAGE_CAPACITY, MARKET_REFRESH_MS, getRefreshRemainingMs } from '../domain/marketStock';
import { getVehicleValuation } from '../domain/marketValue';
import { getOverallCondition } from '../domain/garage';
import type { MarketSort } from '../domain/marketTypes';
import type { GameState, PlayerVehicle } from '../domain/types';
import { VehicleSilhouette } from './VehicleSilhouette';

const yen = (n: number) => `¥${n.toLocaleString('en-US')}`;
const number = (n: number) => n.toLocaleString('en-US');
type Review = { kind: 'buy'; id: string; generation: number; price: number }
  | { kind: 'sell'; id: string; key: string; price: number; activeSale: boolean }
  | { kind: 'refresh'; generation: number };
function VehicleFacts({ vehicle }: { vehicle: PlayerVehicle }) {
  return <dl className="marketVehicleFacts"><div><dt>Model year</dt><dd>{vehicle.year}</dd></div>
    <div><dt>Odometer</dt><dd>{number(vehicle.odometerKm)} km</dd></div><div><dt>Engine condition</dt><dd>{vehicle.engineCondition}%</dd></div>
    <div><dt>Body condition</dt><dd>{vehicle.bodyCondition}%</dd></div><div><dt>Transmission</dt><dd>{vehicle.transmissionCondition}%</dd></div>
    <div><dt>Factory power</dt><dd>{vehicle.hp} PS</dd></div><div><dt>Factory weight</dt><dd>{number(vehicle.weightKg)} kg</dd></div>
    <div><dt>Factory originality</dt><dd>{vehicle.originality}%</dd></div></dl>;
}
export function Market({ game, blocked, visible, onBuy, onSell, onRefresh, onGarage }: {
  game: GameState; blocked: boolean; visible: boolean;
  onBuy: (id: string, generation: number, price: number) => boolean;
  onSell: (id: string, key: string, price: number, replacement: string | null) => boolean;
  onRefresh: (generation: number) => boolean;
  onGarage: () => void;
}) {
  const [mode, setMode] = useState<'stock' | 'sell'>('stock');
  const [filters, setFilters] = useState(createMarketFilters);
  const [review, setReview] = useState<Review | null>(null);
  const [replacement, setReplacement] = useState('');
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [now, setNow] = useState(() => Date.now());
  const dialog = useRef<HTMLDialogElement>(null);
  const committing = useRef(false);
  useEffect(() => {
    if (!visible) return;
    let timer: number | undefined;
    const refresh = () => {
      setNow(Date.now());
      if (game.market.refreshedAtMs !== null && Date.now() >= game.market.refreshedAtMs + MARKET_REFRESH_MS) window.clearInterval(timer);
    };
    refresh();
    if (game.market.refreshedAtMs !== null && getRefreshRemainingMs(game.market, Date.now()) > 0) timer = window.setInterval(refresh, 1000);
    window.addEventListener('focus', refresh); document.addEventListener('visibilitychange', refresh);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh); };
  }, [visible, game.market.refreshedAtMs]);
  useEffect(() => {
    if (review && dialog.current && !dialog.current.open) dialog.current.showModal();
    else if (!review && dialog.current?.open) dialog.current.close();
  }, [review]);

  const listings = filterMarketListings(game.market.listings, filters);
  const filterError = getMarketFilterError(filters);
  const listing = review?.kind === 'buy' ? game.market.listings.find((item) => item.id === review.id) : undefined;
  const saleCar = review?.kind === 'sell' ? game.ownedVehicles.find((car) => car.instanceId === review.id) : undefined;
  const remainingMs = getRefreshRemainingMs(game.market, now);
  const refreshReason = getRefreshRequirement(game, now);
  let reason: string | null = blocked ? 'Resolve the global save warning before trading.' : null;
  if (!reason && review?.kind === 'buy') reason = !listing ? 'This listing is no longer available.'
    : review.generation !== game.market.generation || review.price !== listing.askingPriceYen ? 'Stock changed. Close and review the listing again.' : getBuyRequirement(game, listing);
  if (!reason && review?.kind === 'sell') reason = !saleCar ? 'This vehicle is no longer owned.'
    : getVehicleSaleKey(saleCar, game.activeVehicleId) !== review.key ? 'Your car or active selection changed. Close and review the sale again.'
    : getSellRequirement(game, saleCar.instanceId) ?? (review.activeSale && !game.ownedVehicles.some((car) => car.instanceId === replacement && car.instanceId !== saleCar.instanceId) ? 'Choose your next active vehicle.' : null);
  if (!reason && review?.kind === 'refresh') reason = review.generation !== game.market.generation ? 'Stock changed. Close this preview.' : refreshReason;
  const saleQuote = saleCar && findVehicleDefinition(saleCar.catalogId) ? getVehicleValuation(saleCar) : null;
  function open(next: Review) { committing.current = false; setReplacement(''); setError(''); setReview(next); }
  function close() { dialog.current?.close(); setReview(null); setError(''); }
  function confirm() {
    if (!review || reason || committing.current) return;
    committing.current = true;
    const ok = review.kind === 'buy' ? onBuy(review.id, review.generation, review.price)
      : review.kind === 'sell' ? onSell(review.id, review.key, review.price, review.activeSale ? replacement : null)
      : onRefresh(review.generation);
    if (ok) {
      setFeedback(review.kind === 'buy' ? `${listing?.vehicle.name} purchased for ${yen(review.price)}. Saved in your garage.${game.activeVehicleId === null ? ' It is now your active car.' : ' Your active car is unchanged.'}`
        : review.kind === 'sell' ? `${saleCar?.name} sold for ${yen(review.price)}, including its purchased parts. Payment saved.`
        : 'New stock received and saved. Previous unsold listings were replaced; your own cars were not changed.');
      close(); document.getElementById('tab-market')?.focus({ preventScroll: true });
    } else { committing.current = false; setError('Trade not applied. Close this preview and check the save warning. Your previous cash, vehicles and stock were kept.'); }
  }
  const seconds = Math.max(0, Math.ceil(remainingMs / 1000));
  return <section className="marketPanel" aria-labelledby="market-title">
    <div className="marketHeading"><div><span className="eyebrow">EAST WARD / MERCER USED MOTORS</span><h2 id="market-title">Find your next mistake.</h2>
      <p>Different keys. Different stories. Inspect the car before buying the promise.</p></div>
      <div className="marketCapacity"><KeyRound size={21} /><strong data-testid="garage-capacity">{game.ownedVehicles.length} / {GARAGE_CAPACITY}</strong><span>GARAGE SPACES</span></div></div>
    <div className="marketStrip"><Store size={20} /><div><strong>LOCAL USED STOCK · BATCH {game.market.generation + 1}</strong>
      <p>One unique example of each model per batch. Prices reflect year, condition, mileage and originality.</p></div>
      <div className="marketRefresh"><button type="button" className="secondaryButton" disabled={blocked || !!refreshReason}
        onClick={() => open({ kind: 'refresh', generation: game.market.generation })}><RefreshCw size={14} /> REQUEST NEW STOCK</button>
        <small data-testid="market-refresh-status">{refreshReason?.includes('clock') ? refreshReason : seconds > 0 ? `Available in ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}` : 'Available now · free · manual refresh'}</small></div></div>
    {getReservedVehicleIds(game).length > 0 && <p className="specialistNote">1 garage space reserved for an incoming specialist car. Purchases include that reservation in the 12-space limit.</p>}
    {game.market.lastTrade && <p className="marketReceipt" data-testid="market-last-trade"><Check size={15} /> LAST TRADE #{game.market.lastTrade.transactionId}: {game.market.lastTrade.kind === 'buy' ? 'BOUGHT' : 'SOLD'} {game.market.lastTrade.vehicleName} · {yen(game.market.lastTrade.amountYen)}</p>}
    {feedback && <div role="status" className="workshopFeedback">{feedback} <button className="secondaryButton" type="button" onClick={onGarage}>OPEN GARAGE</button></div>}
    <div className="marketModes" role="group" aria-label="Market mode"><button type="button" aria-pressed={mode === 'stock'} onClick={() => setMode('stock')}><Store size={16} /> USED STOCK <b>{game.market.listings.length}</b></button>
      <button type="button" aria-pressed={mode === 'sell'} onClick={() => setMode('sell')}><ArrowRightLeft size={16} /> SELL A CAR <b>{game.ownedVehicles.length}</b></button></div>

    {mode === 'stock' ? <>
      <div className="marketFilters" role="group" aria-label="Vehicle market filters">
        <label className="marketSearch"><span><Search size={14} /> Search stock</span><input type="search" aria-label="Search market vehicles" placeholder="Model or seller" value={filters.query} onChange={(e) => setFilters({ ...filters, query: e.target.value })} /></label>
        <label><span>Manufacturer</span><select aria-label="Market manufacturer" value={filters.manufacturer} onChange={(e) => setFilters({ ...filters, manufacturer: e.target.value as ManufacturerId | 'all' })}>
          <option value="all">All manufacturers</option>{Object.entries(MANUFACTURERS).map(([id, name]) => <option value={id} key={id}>{name}</option>)}</select></label>
        <label><span>Year from</span><input type="text" inputMode="numeric" maxLength={4} aria-label="Market year from" placeholder="Any" value={filters.yearFrom} onChange={(e) => setFilters({ ...filters, yearFrom: e.target.value })} /></label>
        <label><span>Year to</span><input type="text" inputMode="numeric" maxLength={4} aria-label="Market year to" placeholder="Any" value={filters.yearTo} onChange={(e) => setFilters({ ...filters, yearTo: e.target.value })} /></label>
        <label><span>Sort stock</span><select aria-label="Sort market vehicles" value={filters.sort} onChange={(e) => setFilters({ ...filters, sort: e.target.value as MarketSort })}>
          <option value="price-asc">Price: low first</option><option value="price-desc">Price: high first</option><option value="year-desc">Year: newest first</option>
          <option value="year-asc">Year: oldest first</option><option value="mileage">Mileage: low first</option><option value="condition">Condition: high first</option></select></label>
      </div>
      <div className="categoryChips marketBodyTypes" role="group" aria-label="Market body types"><button type="button" aria-pressed={filters.bodyType === 'all'} onClick={() => setFilters({ ...filters, bodyType: 'all' })}>All body types</button>
        {Object.entries(BODY_TYPES).map(([id, name]) => <button key={id} type="button" aria-pressed={filters.bodyType === id} onClick={() => setFilters({ ...filters, bodyType: id as BodyType })}>{name}</button>)}
      </div>
      <div className="marketResultsBar"><span role="status" data-testid="market-results-count">{listings.length} of {game.market.listings.length} available listings match</span>
        <button type="button" className="secondaryButton" onClick={() => setFilters(createMarketFilters())}>RESET MARKET FILTERS</button></div>
      {filterError && <p className="workshopWarning" role="alert">{filterError}</p>}
      <div className="marketGrid">{listings.map((entry) => {
        const car = entry.vehicle; const model = findVehicleDefinition(car.catalogId)!;
        const requirement = getBuyRequirement(game, entry);
        return <article className="marketCard" key={entry.id} aria-label={`${car.name} listing`}>
          <div className="marketCardTop"><span>{MANUFACTURERS[model.manufacturer]} / {BODY_TYPES[model.bodyType]}</span><b>{car.year}</b></div>
          <VehicleSilhouette catalogId={car.catalogId} /><div className="marketCardContent"><span className="eyebrow">{entry.seller}</span><h3>{car.name}</h3><RarityBadge catalogId={car.catalogId} />
            <p>{car.engine} · {car.drive} · {car.hp} PS</p><div className="marketCardStats"><span>{number(car.odometerKm)} km</span><span>{getOverallCondition(car)}% condition</span></div>
            <div className="marketAsking"><strong>{yen(entry.askingPriceYen)}</strong><span>ASKING PRICE · NO EXTRA FEES</span></div>
            <p className="marketRequirement">{blocked ? 'Resolve the save warning first.' : requirement ?? 'Available · parked in your garage after purchase'}</p>
            <button type="button" className="secondaryButton" aria-label={`Inspect listing ${car.name}`} onClick={() => open({ kind: 'buy', id: entry.id, generation: game.market.generation, price: entry.askingPriceYen })}>
              {requirement ? <LockKeyhole size={15} /> : <KeyRound size={15} />} INSPECT & REVIEW</button></div>
        </article>;
      })}</div>
      {listings.length === 0 && <p className="marketEmpty">{game.market.listings.length === 0 ? 'This batch is sold out. Request new stock when the refresh is available; the cars in your garage are unaffected.' : 'No cars match this combination. Reset the filters to see the available stock.'}</p>}
    </> : <>
      <p className="marketSaleNotice">Dealer offers include the car and <strong>all purchased parts stored for it</strong>, including removed upgrades. Parts are not moved to another car. Keep at least one vehicle. An assigned car cannot be sold until its job/race is settled or cancelled.</p>
      <div className="marketGrid">{game.ownedVehicles.map((car) => {
        const requirement = getSellRequirement(game, car.instanceId);
        const known = !!findVehicleDefinition(car.catalogId);
        const quote = known ? getVehicleValuation(car) : null;
        return <article className="marketCard marketOwned" key={car.instanceId} aria-label={`${car.name} sale`}>
          <div className="marketCardTop"><span>{car.instanceId === game.activeVehicleId ? 'ACTIVE VEHICLE' : 'YOUR GARAGE'}</span><b>{car.year}</b></div><VehicleSilhouette catalogId={car.catalogId} />
          <div className="marketCardContent"><h3>{car.name}</h3><p>{number(car.odometerKm)} km · {getOverallCondition(car)}% condition</p>
            <p>{car.tuning.purchasedPartIds.length} purchased parts included · {car.instanceId}</p>
            <div className="marketAsking"><strong>{quote ? yen(quote.offerYen) : 'NO VALUATION'}</strong><span>DEALER OFFER · NOT RETAIL VALUE</span></div>
            <p className="marketRequirement">{blocked ? 'Resolve the save warning first.' : requirement ?? 'Review the offer before confirming the sale.'}</p>
            <button type="button" className="secondaryButton" aria-label={`Review sale ${car.instanceId}`} disabled={blocked || !!requirement || !quote}
              onClick={() => { if (quote) open({ kind: 'sell', id: car.instanceId, key: getVehicleSaleKey(car, game.activeVehicleId), price: quote.offerYen, activeSale: car.instanceId === game.activeVehicleId }); }}>REVIEW DEALER OFFER</button></div></article>;
      })}</div>
    </>}
    <p className="tuningNote">Stock changes only after a confirmed request. The first request is available immediately; later requests have a 5-minute cooldown. Closing the page never buys, sells or refreshes anything. These are provisional game prices, not real-world valuations. Imported garages above 12 spaces are kept intact but cannot buy more until below capacity.</p>
    <dialog ref={dialog} className="partDialog marketDialog" aria-labelledby="market-review-title" onCancel={() => setReview(null)} onClose={() => setReview(null)}>
      <div className="dialogHeading"><span className="eyebrow">MERCER USED MOTORS / CONFIRMATION</span><button type="button" className="iconButton" aria-label="Close market preview" onClick={close}><X size={20} /></button></div>
      <h3 id="market-review-title">{review?.kind === 'buy' ? 'Confirm vehicle purchase' : review?.kind === 'sell' ? 'Confirm vehicle sale' : 'Request new stock'}</h3>
      {review?.kind === 'buy' && listing && <><h4>{listing.vehicle.name}</h4><VehicleFacts vehicle={listing.vehicle} /><p className="marketVehicleId">Vehicle ID: {listing.vehicle.instanceId}</p>
        <p>{findVehicleDefinition(listing.vehicle.catalogId)?.description}</p><p>Factory setup. This exact vehicle will be added to your garage. {game.activeVehicleId === null ? 'It becomes active because your garage was empty.' : 'It does not replace or automatically activate over your current car.'}</p>
        <div className="marketQuote"><span>Total purchase price</span><strong>{yen(review.price)}</strong><span>{game.cashYen >= review.price ? `${yen(game.cashYen - review.price)} remains` : `${yen(review.price - game.cashYen)} more needed`}</span></div></>}
      {review?.kind === 'sell' && saleCar && saleQuote && <><h4>{saleCar.name}</h4><VehicleFacts vehicle={saleCar} />
        {['import', 'auction', 'barn'].includes(findVehicleDefinition(saleCar.catalogId)?.acquisition ?? '') && <p className="workshopWarning">This specialist source is one-time. Selling this car does not reopen its import, auction or barn offer. Collection history remains.</p>}
        <dl className="marketValueBreakdown"><div><dt>Vehicle trade-in (65% of reference valuation)</dt><dd>{yen(saleQuote.baseOfferYen)}</dd></div>
          <div><dt>Purchased parts allowance (20% of retail)</dt><dd>{yen(saleQuote.partsOfferYen)}</dd></div></dl>
        <div className="marketQuote"><span>You receive</span><strong>{yen(review.price)}</strong><span>All amounts rounded down to ¥100 for trade-in</span></div>
        <p className="workshopWarning">Selling removes this exact car and all {saleCar.tuning.purchasedPartIds.length} purchased parts from your garage. This is not reversible through the dealer. Past race records remain.</p>
        {findVehicleDefinition(saleCar.catalogId)?.acquisition === 'icon' && <p className="workshopWarning">This is an Icon car. Selling it does not renew its one-time showroom offer. Its Collection Book entry stays collected.</p>}
        {review.activeSale && <label className="marketReplacement"><span>Choose your next active vehicle</span><select aria-label="Replacement active vehicle" value={replacement} onChange={(e) => setReplacement(e.target.value)}>
          <option value="">Choose a remaining car…</option>{game.ownedVehicles.filter((car) => car.instanceId !== saleCar.instanceId).map((car) => <option key={car.instanceId} value={car.instanceId}>{car.name} · {car.instanceId}</option>)}</select></label>}</>}
      {review?.kind === 'refresh' && <><p>Replace the remaining unsold listings with <strong>six new individual used cars</strong>. Your purchased vehicles, active car, cash and pending activity do not change.</p>
        <p>There is no fee. The next stock request will be available in 5 minutes. Unsold cars from the previous batch cannot be recovered from the dealer.</p></>}
      {reason && <p className="workshopWarning">{reason}</p>}{error && <p className="gameError" role="alert">{error}</p>}
      <div className="dialogActions"><button type="button" className="secondaryButton" onClick={close}>CANCEL</button>
        <button type="button" className={review?.kind === 'sell' ? 'dangerButton' : 'installButton'} disabled={!!reason || !review} onClick={confirm}>
          {review?.kind === 'buy' ? 'BUY VEHICLE' : review?.kind === 'sell' ? 'SELL VEHICLE' : 'CONFIRM STOCK REFRESH'}</button></div>
    </dialog>
  </section>;
}
