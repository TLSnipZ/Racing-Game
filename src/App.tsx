import { AdvancedCars } from './components/AdvancedCars';
import { Restoration } from './components/Restoration';
import { startSpecialistContract, finishSpecialistContract, cancelSpecialistContract, raiseProxyBid, buyBarnVehicle } from './domain/advanced';
import { restoreVehicle } from './domain/restoration';
import { isSpecialistReady } from './domain/advancedRules';
import type { SpecialistView } from './domain/advancedTypes';
import { HeatPanel } from './components/HeatPanel';
import { startLayLow, finishLayLow, cancelLayLow, payPoliceFine } from './domain/heat';
import { Collection } from './components/Collection';
import { claimAchievement, purchaseIcon } from './domain/collection';
import { useLayoutEffect, useState } from 'react';
import { ChevronRight, Database } from 'lucide-react';
import { getDistrictAccess } from './domain/city';
import type { DistrictFilter as CityFilter, DistrictId } from './data/city';
import type { RaceDiscipline } from './domain/racingTypes';
import { Market } from './components/Market';
import { buyMarketVehicle, sellMarketVehicle, refreshMarket } from './domain/market';
import { City } from './components/City';
import { STARTER_CARS } from './data/starters';
import { purchaseStarter } from './domain/game';
import { cancelJob, claimJob, startJob } from './domain/economy';
import { cancelRace, settleRace, startRace } from './domain/racing';
import { isRaceReady } from './domain/raceModel';
import { selectActiveVehicle } from './domain/garage';
import { installPart, removePart } from './domain/tuning';
import { SAVE_VERSION } from './domain/persistence';
import { useGameSession } from './hooks/useGameSession';
import { useJobClock } from './hooks/useJobClock';
import { GameHeader, type SectionTab } from './components/GameHeader';
import { Garage } from './components/Garage';
import { Jobs } from './components/Jobs';
import { Races } from './components/Races';
import { Workshop } from './components/Workshop';
import { SaveManagement } from './components/SaveManagement';
import { VehicleSilhouette } from './components/VehicleSilhouette';
import './styles/phase3.css';
import './styles/phase4.css';
import './styles/phase5.css';
import './styles/phase6.css';
import './styles/phase7.css';
import './styles/phase8.css';
import './styles/phase9.css';
import './styles/phase10.css';
import './styles/phase11.css';

const yen = (n: number) => `¥${n.toLocaleString('en-US')}`;
export function App() {
  const session = useGameSession();
  const { game, blocked } = session;
  const [tab, setTab] = useState<SectionTab>('garage');
  const [viewEpoch, setViewEpoch] = useState(0);
  const [marketSection, setMarketSection] = useState<'dealer' | SpecialistView>('dealer');
  const [workshopSection, setWorkshopSection] = useState<'parts' | 'restoration'>('parts');
  const [raceDistrict, setRaceDistrict] = useState<CityFilter>('all');
  const [jobDistrict, setJobDistrict] = useState<CityFilter>('all');
  const [raceDiscipline, setRaceDiscipline] = useState<RaceDiscipline | 'all'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = STARTER_CARS.find((car) => car.id === selectedId) ?? null;
  const hasStarted = game.selectedStarterId !== null || game.ownedVehicles.length > 0;
  const now = useJobClock(game.economy.activeJob ?? game.racing.activeRace ?? game.heat.cooldown ?? game.advanced.activeContract);
  const job = game.economy.activeJob;
  const jobReady = !!job && Number.isSafeInteger(now) && now >= job.startedAtMs && now >= job.finishesAtMs;
  const raceReady = isRaceReady(game.racing.activeRace, now);
  const heatReady = !!game.heat.cooldown && Number.isSafeInteger(now) && now >= game.heat.cooldown.startedAtMs && now >= game.heat.cooldown.finishesAtMs;
  const specialistReady = isSpecialistReady(game.advanced.activeContract, now);
  function openSpecialist(view: SpecialistView) { setMarketSection(view); selectTab('market'); }
  function openRestoration() { setWorkshopSection('restoration'); selectTab('workshop'); }
  function openPendingSpecialist() {
    const kind = game.advanced.activeContract?.kind;
    openSpecialist(kind === 'auction' ? 'auctions' : kind === 'survey' ? 'barns' : 'imports');
  }
  function openHeat() {
    setTab('city');
    requestAnimationFrame(() => { const panel = document.getElementById('heat-controls'); panel?.focus({ preventScroll: true }); panel?.scrollIntoView({ block: 'start' }); });
  }
  useLayoutEffect(() => { window.scrollTo({ top: 0, behavior: 'auto' }); }, [tab]);
  function selectTab(next: SectionTab) {
    if ((next === 'jobs' || next === 'workshop' || next === 'races' || next === 'city' || next === 'market' || next === 'collection') && !hasStarted) return;
    setTab(next);
    document.getElementById(`tab-${next}`)?.focus({ preventScroll: true });
  }
  function openDistrict(section: 'jobs' | 'races', district: DistrictId) {
    if (blocked || !getDistrictAccess(game, district).unlocked) return;
    if (section === 'races') { setRaceDistrict(district); setRaceDiscipline('all'); }
    else setJobDistrict(district);
    selectTab(section);
  }
  function returnToGarage() {
    setMarketSection('dealer'); setWorkshopSection('parts');
    setRaceDistrict('all'); setJobDistrict('all'); setRaceDiscipline('all');
    setSelectedId(null); setViewEpoch((value) => value + 1); setTab('garage');
    document.getElementById('tab-garage')?.focus({ preventScroll: true });
  }
  function confirmStarter() {
    if (!selected || blocked) return;
    const id = globalThis.crypto?.randomUUID?.() ?? `vehicle-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    if (session.command((current) => purchaseStarter(current, selected.id, id))) setSelectedId(null);
  }
  return <main className="shell phase3 phase4 phase5 phase6 phase7 phase8 phase9 phase10 phase11">
    <a className="skipContent" href={`#panel-${tab}`}>Skip to current section</a>
    <GameHeader game={game} tab={tab} hasStarted={hasStarted} jobReady={jobReady} raceReady={raceReady} heatReady={heatReady} specialistReady={specialistReady} onHeat={openHeat} onTab={selectTab} />
    <div className={`saveIndicator ${session.error ? 'saveIndicatorWarning' : ''}`} role="status">
      <Database size={13} />{blocked ? 'SAVE PROTECTED · ACTION REQUIRED' : session.error ? 'SAVE FAILED · PLEASE CHECK BELOW'
        : session.savedAt ? `AUTOSAVED · ${new Date(session.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · SAVE V${SAVE_VERSION}` : 'AUTOSAVE READY'}
    </div>
    {session.error && <section className="recoveryPanel" role="alert"><h3>{blocked ? 'Your stored save is protected.' : 'Could not save this change.'}</h3>
      <p>{session.error}</p><p>No stored progress was automatically deleted. Reload to retry, or open Saves after keeping a backup.</p>
      <button className="secondaryButton" type="button" onClick={() => { setTab('saves'); document.getElementById('tab-saves')?.focus({ preventScroll: true }); }}>OPEN SAVE TOOLS</button>
      {blocked && session.raw !== null && <details><summary>Show stored data for recovery</summary><textarea aria-label="Stored recovery data" readOnly value={session.raw} /></details>}
    </section>}
    {hasStarted && tab !== 'city' && (game.heat.pendingStop || game.heat.cooldown) && <aside className="heatNotice" aria-label="Heat activity notice">
      <p>{game.heat.cooldown ? heatReady ? 'Lay low is ready to finish. Your Heat reduction has not been claimed.' : 'You are laying low. Jobs and races resume after you finish or cancel.' : 'Patrol alert: choose the announced fine or a free Lay low pause in City.'}</p>
      <button type="button" className="secondaryButton" onClick={openHeat}>OPEN HEAT CONTROLS</button>
    </aside>}
    {hasStarted && game.advanced.activeContract && tab !== 'market' && <aside className="specialistNotice" aria-label="Specialist activity notice">
      <p>{specialistReady ? 'Your specialist contract is READY. Collect the car, survey result or auction refund in Market.' : 'Your specialist contract is running. Its original deadline and any reserved space are saved.'}</p>
      <button type="button" className="secondaryButton" onClick={openPendingSpecialist}>OPEN SPECIALIST CONTRACT</button>
    </aside>}
    {/* Views retain filters/forms but hidden panels have no layout, focus or accessibility presence. */}
    <div id="panel-garage" role="tabpanel" aria-labelledby="tab-garage" tabIndex={0} hidden={tab !== 'garage'} className="sectionPanel">
      {hasStarted ? <Garage key={viewEpoch} onCollection={() => selectTab('collection')} game={game} blocked={blocked} onMarket={() => selectTab('market')} onActivate={(id) => session.command((current) => selectActiveVehicle(current, id))} />
        : !blocked && <>
          <section className="hero"><div className="heroCopy"><span className="tag">MERCER GARAGE // EAST WARD</span>
            <h2>Everybody starts<br />with a bad decision.</h2><p>Three unwanted cars. Fifty thousand yen. One way into Kagehama's midnight scene.</p>
            <div className="message"><b>UNKNOWN</b><span>Heard you're looking for a ride. Got three cars nobody wants. Midnight. Don't be late.</span></div></div>
            <div className="city"><div className="road">首都高速 • EASTLINE</div></div></section>
          <section id="garage" className="choice"><div className="sectionTitle"><div><span>01 / FIRST RIDE</span><h3>Choose your starter</h3></div><p>The other two remain available through the used market after your first purchase.</p></div>
            <div className="cards">{STARTER_CARS.map((car, i) => <button type="button" key={car.id} className={`carCard ${selectedId === car.id ? 'selected' : ''}`}
              aria-pressed={selectedId === car.id} aria-label={`Choose ${car.name}`} onClick={() => setSelectedId(car.id)}>
              <div className="cardTop"><span>0{i + 1}</span><span>{car.archetype}</span></div><VehicleSilhouette catalogId={car.id} />
              <h4>{car.name}</h4><div className="year">{car.year} · {car.engine} · {car.drive}</div><p>{car.description}</p>
              <div className="stats"><span><b>{car.hp}</b> PS</span><span><b>{car.weightKg}</b> KG</span><span><b>{car.condition}%</b> COND.</span></div>
              <div className="traits">{car.traits.map((trait) => <span key={trait}>{trait}</span>)}</div>
              <div className="price"><span>{yen(car.priceYen)}</span><small>{yen(game.cashYen - car.priceYen)} REMAINS</small></div>
            </button>)}</div>
            {selected && <div className="confirm"><div><span>SELECTED</span><strong>{selected.name}</strong><small>Your purchase and first active car will be saved automatically.</small></div>
              <button type="button" onClick={confirmStarter}>BUY & ENTER KAGEHAMA <ChevronRight size={18} /></button></div>}
          </section>
        </>}
    </div>
    <div id="panel-jobs" role="tabpanel" aria-labelledby="tab-jobs" tabIndex={0} hidden={tab !== 'jobs'} className="sectionPanel">
      {hasStarted && <Jobs key={viewEpoch} game={game} now={now} blocked={blocked} districtFilter={jobDistrict} onDistrictFilter={setJobDistrict}
        onStart={(id) => session.command((current) => startJob(current, id, Date.now()))}
        onClaim={(id) => session.command((current) => claimJob(current, id, Date.now()))}
        onCancel={(id) => session.command((current) => cancelJob(current, id))} />}
    </div>
    <div id="panel-races" role="tabpanel" aria-labelledby="tab-races" tabIndex={0} hidden={tab !== 'races'} className="sectionPanel">
      {hasStarted && <Races key={viewEpoch} game={game} now={now} blocked={blocked}
        districtFilter={raceDistrict} onDistrictFilter={setRaceDistrict} discipline={raceDiscipline} onDiscipline={setRaceDiscipline}
        onStart={(eventId, vehicleId, key, mode, expectedHeat) => session.command((current) => startRace(current, eventId, vehicleId, key, Date.now(), mode, expectedHeat))}
        onSettle={(id) => session.command((current) => settleRace(current, id, Date.now()))}
        onCancel={(id) => session.command((current) => cancelRace(current, id))} />}
    </div>
    <div id="panel-workshop" role="tabpanel" aria-labelledby="tab-workshop" tabIndex={0} hidden={tab !== 'workshop'} className="sectionPanel">
      {hasStarted && <div className="specialistModes" role="group" aria-label="Workshop services">
        <button type="button" aria-pressed={workshopSection === 'parts'} onClick={() => setWorkshopSection('parts')}>Tuning parts</button>
        <button type="button" aria-pressed={workshopSection === 'restoration'} onClick={() => setWorkshopSection('restoration')}>Restoration</button>
      </div>}
      <div hidden={workshopSection !== 'parts'}>{hasStarted && <Workshop key={viewEpoch} game={game} blocked={blocked}
        onInstall={(car, part, expected) => session.command((current) => installPart(current, car, part, expected))}
        onRemove={(car, slot, expected) => session.command((current) => removePart(current, car, slot, expected))} />}</div>
      <div hidden={workshopSection !== 'restoration'}>{hasStarted && <Restoration key={viewEpoch} game={game} blocked={blocked}
        onRestore={(id, service, key, cost) => session.command((current) => restoreVehicle(current, id, service, key, cost))} />}</div>
    </div>
    <div id="panel-market" role="tabpanel" aria-labelledby="tab-market" tabIndex={0} hidden={tab !== 'market'} className="sectionPanel">
      {hasStarted && <div className="specialistModes" role="group" aria-label="Market sections">{([
        ['dealer', 'Used dealer'], ['imports', 'Imports'], ['auctions', 'Auctions'], ['barns', 'Barn Finds'],
      ] as const).map(([id, name]) => <button type="button" key={id} aria-pressed={marketSection === id} onClick={() => setMarketSection(id)}>{name}</button>)}</div>}
      {hasStarted && marketSection === 'dealer' && game.advanced.activeContract && <aside className="specialistNotice"><p>{specialistReady ? 'Specialist contract READY.' : 'Specialist contract in progress. Reserved space is protected.'}</p><button type="button" className="secondaryButton" onClick={openPendingSpecialist}>OPEN SPECIALIST CONTRACT</button></aside>}
      <div hidden={marketSection !== 'dealer'}>{hasStarted && <Market key={viewEpoch} game={game} blocked={blocked} visible={tab === 'market' && marketSection === 'dealer'}
        onBuy={(id, generation, price) => session.command((current) => buyMarketVehicle(current, id, generation, price))}
        onSell={(id, key, price, replacement) => session.command((current) => sellMarketVehicle(current, id, key, price, replacement))}
        onRefresh={(generation) => session.command((current) => refreshMarket(current, generation, Date.now()))}
        onGarage={() => selectTab('garage')} />}</div>
      {hasStarted && marketSection !== 'dealer' && <AdvancedCars key={viewEpoch} mode={marketSection} game={game} now={now} blocked={blocked}
        onStart={(id, key, bid) => session.command((current) => startSpecialistContract(current, id, key, Date.now(), bid))}
        onFinish={(id) => session.command((current) => finishSpecialistContract(current, id, Date.now()))}
        onCancel={(id) => session.command((current) => cancelSpecialistContract(current, id))}
        onRaise={(id, oldBid, bid) => session.command((current) => raiseProxyBid(current, id, oldBid, bid, Date.now()))}
        onBarn={(id, key) => session.command((current) => buyBarnVehicle(current, id, key))}
        onGarage={() => selectTab('garage')} onRestore={openRestoration} />}
    </div>
    <div id="panel-collection" role="tabpanel" aria-labelledby="tab-collection" tabIndex={0} hidden={tab !== 'collection'} className="sectionPanel">
      {hasStarted && <Collection key={viewEpoch} game={game} blocked={blocked} onSpecialist={openSpecialist}
        onClaim={(id) => session.command((current) => claimAchievement(current, id))}
        onIcon={(id, price) => session.command((current) => purchaseIcon(current, id, price))}
        onMarket={() => selectTab('market')} onGarage={() => selectTab('garage')} />}
    </div>
    <div id="panel-saves" role="tabpanel" aria-labelledby="tab-saves" tabIndex={0} hidden={tab !== 'saves'} className="sectionPanel">
      <SaveManagement game={game} blocked={blocked} onImport={(state) => { const ok = session.replaceGame(state); if (ok) returnToGarage(); return ok; }}
        onReset={() => { const ok = session.resetGame(); if (ok) returnToGarage(); return ok; }} />
    </div>
    <div id="panel-city" role="tabpanel" aria-labelledby="tab-city" tabIndex={0} hidden={tab !== 'city'} className="sectionPanel">
      {hasStarted && <HeatPanel key={`heat-${viewEpoch}`} game={game} now={now} blocked={blocked}
        onStart={(heat, nextId) => session.command((current) => startLayLow(current, heat, nextId, Date.now()))}
        onFinish={(id) => session.command((current) => finishLayLow(current, id, Date.now()))}
        onCancel={(id) => session.command((current) => cancelLayLow(current, id))}
        onPay={(id, fine) => session.command((current) => payPoliceFine(current, id, fine))} />}
      {hasStarted && <City key={viewEpoch} game={game} blocked={blocked} jobReady={jobReady} raceReady={raceReady}
        onRaces={(district) => openDistrict('races', district)} onJobs={(district) => openDistrict('jobs', district)}
        onService={selectTab} onResume={selectTab} onSpecialist={openSpecialist} />}
    </div>
    <footer>PHASE 11 // ADVANCED CARS · PRE-ALPHA · STARTER → JOBS → TUNING → RACES</footer>
  </main>;
}
