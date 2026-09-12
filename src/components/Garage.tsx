import { getGarageCapacity, getReservedVehicleIds } from '../domain/garageCapacity';
import { RarityBadge } from './RarityBadge';
import { useState } from 'react';
import { Check, KeyRound, Search, Warehouse } from 'lucide-react';
import { VEHICLE_CATALOG, BODY_TYPES, MANUFACTURERS } from '../data/vehicles';
import { getActiveVehicle, getConditionLabel, getOverallCondition, getPowerToWeight, listGarageVehicles, type GarageSort } from '../domain/garage';
import { getFittedPartNames, getVehicleBuildStats } from '../domain/tuning';
import type { GameState, PlayerVehicle } from '../domain/types';
import { VehicleSilhouette } from './VehicleSilhouette';
const number = (value: number) => value.toLocaleString('en-US');
function ConditionMeter({ label, value }: { label: string; value: number }) {
  return <div className="conditionRow"><div><span>{label}</span><strong>{value}%</strong></div>
    <div role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value} className={`conditionTrack ${value < 60 ? 'conditionWorn' : ''}`}><span style={{ width: `${value}%` }} /></div></div>;
}
export function Garage({ game, blocked, onActivate, onMarket, onEmpire, onCollection }: { onEmpire: () => void; game: GameState; blocked: boolean; onActivate: (id: string) => void; onCollection: () => void; onMarket: () => void }) {
  const [inspectedId, setInspectedId] = useState<string | null>(null);
  const [query, setQuery] = useState(''); const [sort, setSort] = useState<GarageSort>('name');
  const active = getActiveVehicle(game);
  const inspected = game.ownedVehicles.find((v) => v.instanceId === inspectedId) ?? active ?? game.ownedVehicles[0] ?? null;
  const vehicles = listGarageVehicles(game.ownedVehicles, query, sort);
  const uniqueModels = new Set(game.ownedVehicles.map((v) => v.catalogId)).size;
  if (!inspected) return <section id="garage" className="garageEmpty"><Warehouse size={36} /><h2>Your garage is empty.</h2><p>No owned vehicles in this save. Use the Saves tab to import a backup.</p></section>;
  const isActive = inspected.instanceId === game.activeVehicleId;
  const catalog = VEHICLE_CATALOG.find((car) => car.id === inspected.catalogId);
  const condition = getOverallCondition(inspected);
  const build = getVehicleBuildStats(inspected); const fittedParts = getFittedPartNames(inspected);
  function card(vehicle: PlayerVehicle) {
    const viewing = vehicle.instanceId === inspected?.instanceId;
    return <button key={vehicle.instanceId} type="button" className={`ownedCard ${viewing ? 'inspected' : ''}`} aria-pressed={viewing}
      aria-label={`Inspect ${vehicle.name} (${vehicle.instanceId})`} onClick={() => setInspectedId(vehicle.instanceId)}>
      <div className="ownedCardTop"><span>{vehicle.year} / {vehicle.drive}</span>{vehicle.instanceId === game.activeVehicleId && <span className="activeTag"><Check size={12} /> ACTIVE</span>}</div>
      <VehicleSilhouette catalogId={vehicle.catalogId} /><RarityBadge catalogId={vehicle.catalogId} /><h4>{vehicle.name}</h4><p>{number(getVehicleBuildStats(vehicle).powerPs)} PS <span>·</span> {number(vehicle.odometerKm)} km</p>
      <div className="ownedCardBottom"><span>{getOverallCondition(vehicle)}% condition</span><span>{viewing ? 'VIEWING' : 'INSPECT →'}</span></div></button>;
  }
  return <section id="garage" className="garageWorkspace" aria-label="Your garage">
    <div className="garageHeading"><div><span className="eyebrow">01 / MERCER GARAGE · EAST WARD</span><h2>Your garage.</h2></div>
      <div className="collectionCount"><strong>{game.ownedVehicles.length.toString().padStart(2, '0')}</strong><span>{game.ownedVehicles.length === 1 ? 'VEHICLE' : 'VEHICLES'} OWNED<br />{uniqueModels} UNIQUE {uniqueModels === 1 ? 'MODEL' : 'MODELS'}</span></div></div>
    <button type="button" className="secondaryButton" onClick={onCollection}>OPEN COLLECTION BOOK</button>
    {getReservedVehicleIds(game).length > 0 && <p className="specialistNote">1 incoming car space reserved. Complete the specialist contract in Market to park it here.</p>}
    <div className="activeSummary" role="status"><KeyRound size={16} /><span>ACTIVE RIDE</span><strong>{active?.name ?? 'None'}</strong><small>Inspecting a card does not switch your active car.</small></div>
    <div className="garageShowcase"><div className="showcaseCopy"><span className="tag">{isActive ? 'YOUR ACTIVE RIDE' : 'VEHICLE PREVIEW'}</span><h3>{inspected.name}</h3><RarityBadge catalogId={inspected.catalogId} />
      <p>{inspected.year} · {inspected.engine} · {inspected.drive}</p><p className="showcaseFlavor">{catalog?.description ?? 'Another chapter in your Kagehama story.'}</p>
      <div className="traits">{catalog?.traits.map((trait) => <span key={trait}>{trait}</span>)}</div>
      <button type="button" className="activateButton" disabled={isActive || blocked} onClick={() => onActivate(inspected.instanceId)}>{isActive ? <Check size={17} /> : <KeyRound size={17} />}{isActive ? 'ACTIVE VEHICLE' : 'SET AS ACTIVE VEHICLE'}</button></div>
      <div className="showcaseStage"><div className="stageLight" /><span className="stageNumber">{inspected.year}</span><VehicleSilhouette catalogId={inspected.catalogId} /><span className="conceptLabel">CONCEPT PROFILE / FINAL VEHICLE ART PLANNED</span></div></div>
    <div className="garageMetrics"><div><span>BUILD POWER</span><strong data-testid="garage-power">{number(build.powerPs)} <small>PS</small></strong></div>
      <div><span>BUILD WEIGHT</span><strong>{number(build.weightKg)} <small>kg</small></strong></div><div><span>POWER / WEIGHT</span><strong>{getPowerToWeight(inspected).toFixed(1)} <small>PS/t</small></strong></div>
      <div><span>ODOMETER</span><strong>{number(inspected.odometerKm)} <small>km</small></strong></div></div>
    <div className="garageDetailGrid">
      <article className="detailPanel"><div className="detailTitle"><h4>Condition report</h4><span>{condition}% · {getConditionLabel(condition)}</span></div>
        <ConditionMeter label="Engine" value={inspected.engineCondition} /><ConditionMeter label="Body" value={inspected.bodyCondition} /><ConditionMeter label="Transmission" value={inspected.transmissionCondition} /><ConditionMeter label="Originality" value={build.originality} />
        <p className="detailNote">Condition is the average of engine, body and transmission. Build originality includes fitted changes; kept factory parts allow restoration. Tuning does not repair wear.</p></article>
      <article className="detailPanel"><div className="detailTitle"><h4>Vehicle dossier</h4><span>OWNED</span></div>
        <dl className="dossier"><div><dt>Manufacturer / type</dt><dd>{catalog ? `${MANUFACTURERS[catalog.manufacturer]} / ${BODY_TYPES[catalog.bodyType]}` : 'Historical model'}</dd></div><div><dt>Model ID</dt><dd>{inspected.catalogId}</dd></div><div><dt>Vehicle ID</dt><dd><code>{inspected.instanceId}</code></dd></div><div><dt>Engine</dt><dd>{inspected.engine}</dd></div><div><dt>Drivetrain</dt><dd>{inspected.drive}</dd></div>
          <div><dt>Build year</dt><dd>{inspected.year}</dd></div><div><dt>Base power</dt><dd>{inspected.hp} PS</dd></div><div><dt>Base weight</dt><dd>{inspected.weightKg} kg</dd></div></dl>
        <p className="detailNote">The saved factory baseline stays separate from tuning. Displayed build values are derived from fitted parts, not repeatedly added to this baseline.</p></article>
      <article className="detailPanel"><div className="detailTitle"><h4>Installed parts</h4><span>{fittedParts.length} FITTED</span></div><ul className="installedList">{fittedParts.map((part, i) => <li key={`${i}-${part}`}><Check size={14} />{part}</li>)}</ul>
        <div className="comingLater"><span>WORKSHOP / AVAILABLE</span><p>Open Workshop above to review parts, compare build stats and fit upgrades. Purchases belong to the chosen car.</p></div></article>
    </div>
    <div className="collectionHeader"><div><span className="eyebrow">THE KEYS YOU OWN</span><h3>Vehicle collection</h3></div><div className="garageFilters">
      <label><Search size={15} /><span className="srOnly">Search owned vehicles</span><input type="search" placeholder="Name, year or vehicle ID" value={query} onChange={(e) => setQuery(e.target.value)} /></label>
      <label><span className="srOnly">Sort owned vehicles</span><select value={sort} onChange={(e) => setSort(e.target.value as GarageSort)}><option value="name">Name A–Z</option><option value="power">Power: high first</option><option value="condition">Condition: high first</option><option value="mileage">Mileage: low first</option></select></label></div></div>
    <div className="ownedGrid">{vehicles.map(card)}<div className="futureCard"><KeyRound size={24} /><h4>More keys. More stories.</h4><p>Find individual used cars at Mercer Used Motors. {game.ownedVehicles.length} / {getGarageCapacity(game)} garage spaces used.</p><button type="button" className="secondaryButton" onClick={onMarket}>OPEN VEHICLE MARKET</button><button type="button" className="secondaryButton" onClick={onEmpire}>EXPAND GARAGE</button></div></div>
    {vehicles.length === 0 && <p className="emptySearch" role="status">No owned vehicles match this search. Your active car has not changed.</p>}
  </section>;
}
