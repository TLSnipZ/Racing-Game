import { useState } from 'react';
import { ChevronRight, Database, Gauge, Map, Warehouse, Wrench } from 'lucide-react';
import { STARTER_CARS } from './data/starters';
import { purchaseStarter } from './domain/game';
import { selectActiveVehicle } from './domain/garage';
import { SAVE_VERSION } from './domain/persistence';
import { useGameSession } from './hooks/useGameSession';
import { Garage } from './components/Garage';
import { SaveManagement } from './components/SaveManagement';
import { VehicleSilhouette } from './components/VehicleSilhouette';
import './styles/phase3.css';

const yen = (n: number) => `¥${n.toLocaleString('en-US')}`;

export function App() {
  const session = useGameSession();
  const { game, blocked } = session;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = STARTER_CARS.find((car) => car.id === selectedId) ?? null;
  const hasStarted = game.selectedStarterId !== null || game.ownedVehicles.length > 0;

  function confirmStarter() {
    if (!selected || blocked) return;
    // Generate outside a React updater. Rapid repeat clicks use the latest session state.
    const id = globalThis.crypto?.randomUUID?.() ?? `vehicle-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    if (session.command((current) => purchaseStarter(current, selected.id, id))) setSelectedId(null);
  }

  return <main className="shell phase3">
    <header><div><div className="eyebrow">KAGEHAMA / EAST WARD</div><h1>KAGEHAMA</h1><p className="subtitle">UNDERGROUND CAR EMPIRE</p></div>
      <div className="playerMeta"><div><span>CASH</span><strong data-testid="cash">{yen(game.cashYen)}</strong></div>
        <div><span>LEVEL</span><strong>{game.playerLevel}</strong></div><div><span>REP</span><strong>{game.reputation}</strong></div></div>
    </header>
    <div className={`saveIndicator ${session.error ? 'saveIndicatorWarning' : ''}`} role="status">
      <Database size={13} />{blocked ? 'SAVE PROTECTED · ACTION REQUIRED' : session.error ? 'SAVE FAILED · PLEASE CHECK BELOW'
        : session.savedAt ? `AUTOSAVED · ${new Date(session.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · SAVE V${SAVE_VERSION}` : 'AUTOSAVE READY'}
    </div>
    {session.error && <section className="recoveryPanel" role="alert"><h3>{blocked ? 'Your stored save is protected.' : 'Could not save this change.'}</h3>
      <p>{session.error}</p><p>No stored progress was automatically deleted. Reload to retry, or use import/reset below after keeping a backup.</p>
      {blocked && session.raw !== null && <details><summary>Show stored data for recovery</summary><textarea aria-label="Stored recovery data" readOnly value={session.raw} /></details>}
    </section>}

    {hasStarted ? <Garage game={game} blocked={blocked} onActivate={(id) => session.command((current) => selectActiveVehicle(current, id))} />
      : !blocked && <>
        <section className="hero"><div className="heroCopy"><span className="tag">MERCER GARAGE // EAST WARD</span>
          <h2>Everybody starts<br />with a bad decision.</h2><p>Three unwanted cars. Fifty thousand yen. One way into Kagehama's midnight scene.</p>
          <div className="message"><b>UNKNOWN</b><span>Heard you're looking for a ride. Got three cars nobody wants. Midnight. Don't be late.</span></div></div>
          <div className="city"><div className="road">首都高速 • EASTLINE</div></div></section>
        <section id="garage" className="choice"><div className="sectionTitle"><div><span>01 / FIRST RIDE</span><h3>Choose your starter</h3></div>
          <p>The other two are planned for the used market later.</p></div>
          <div className="cards">{STARTER_CARS.map((car, i) => <button type="button" key={car.id}
            className={`carCard ${selectedId === car.id ? 'selected' : ''}`} aria-pressed={selectedId === car.id}
            aria-label={`Choose ${car.name}`} onClick={() => setSelectedId(car.id)}>
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
    <SaveManagement game={game} blocked={blocked} onImport={(state) => { const ok = session.replaceGame(state); if (ok) setSelectedId(null); return ok; }}
      onReset={() => { const ok = session.resetGame(); if (ok) setSelectedId(null); return ok; }} />
    <nav aria-label="Game navigation"><a href="#garage"><Warehouse />Garage</a><span aria-disabled="true" title="City: planned for Phase 7"><Map />City</span>
      <span aria-disabled="true" title="Racing: planned for Phase 6"><Gauge />Races</span><span aria-disabled="true" title="Tuning: planned for Phase 5"><Wrench />Workshop</span>
      <a href="#save-data"><Database />Saves</a></nav>
    <footer>PHASE 3 // GARAGE · PRE-ALPHA · NEXT: JOBS & EARLY ECONOMY</footer>
  </main>;
}
