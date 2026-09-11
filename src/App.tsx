import { useEffect, useState } from 'react';
import { CarFront, ChevronRight, Copy, Download, Gauge, Map, RotateCcw, Upload, Warehouse, Wrench } from 'lucide-react';
import { STARTER_CARS, type StarterCar } from './data/starters';
import { createNewGameState, purchaseStarter } from './domain/game';
import {
  clearStorage,
  exportSaveCode,
  importSaveCode,
  loadFromStorage,
  saveToStorage,
} from './domain/persistence';
import type { GameState } from './domain/types';

const yen = (n: number) => `¥${n.toLocaleString('en-US')}`;
const percent = (n: number) => `${n}%`;

function createVehicleId() {
  if ('randomUUID' in crypto) return crypto.randomUUID();
  return `vehicle-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadInitialGame(): GameState {
  try {
    return loadFromStorage(localStorage)?.state ?? createNewGameState();
  } catch {
    clearStorage(localStorage);
    return createNewGameState();
  }
}

export function App() {
  const [selected, setSelected] = useState<StarterCar | null>(null);
  const [game, setGame] = useState<GameState>(loadInitialGame);
  const [error, setError] = useState<string | null>(null);
  const [saveCode, setSaveCode] = useState('');
  const [importCode, setImportCode] = useState('');
  const [saveStatus, setSaveStatus] = useState('AUTOSAVE READY');

  const ownedCar = game.ownedVehicles[0] ?? null;

  useEffect(() => {
    try {
      saveToStorage(localStorage, game);
      setSaveStatus(`AUTOSAVED · ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
    } catch {
      setSaveStatus('AUTOSAVE FAILED');
    }
  }, [game]);

  function confirmStarter() {
    if (!selected) return;
    try {
      setGame((current) => purchaseStarter(current, selected.id, createVehicleId()));
      setSelected(null);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Starter purchase failed.');
    }
  }

  function handleExport() {
    const code = exportSaveCode(game);
    setSaveCode(code);
    setSaveStatus('SAVE CODE GENERATED');
  }

  async function copySaveCode() {
    if (!saveCode) return;
    try {
      await navigator.clipboard.writeText(saveCode);
      setSaveStatus('SAVE CODE COPIED');
    } catch {
      setSaveStatus('COPY FAILED · SELECT THE CODE MANUALLY');
    }
  }

  function handleImport() {
    try {
      const imported = importSaveCode(importCode);
      const carName = imported.state.ownedVehicles[0]?.name ?? 'No starter selected';
      const approved = window.confirm(
        `Import this save?\n\nCash: ${yen(imported.state.cashYen)}\nLevel: ${imported.state.playerLevel}\nCar: ${carName}\n\nYour current save will be replaced.`,
      );
      if (!approved) return;

      setGame(imported.state);
      setSelected(null);
      setImportCode('');
      setSaveCode('');
      setError(null);
      setSaveStatus('SAVE IMPORTED');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Save import failed.');
    }
  }

  function handleReset() {
    const approved = window.confirm('Reset your entire KAGEHAMA save?\n\nThis cannot be undone unless you exported a save code first.');
    if (!approved) return;

    clearStorage(localStorage);
    setGame(createNewGameState());
    setSelected(null);
    setSaveCode('');
    setImportCode('');
    setError(null);
    setSaveStatus('SAVE RESET');
  }

  const saveTools = (
    <section className="savePanel">
      <div className="sectionTitle">
        <div><span>02 / SAVE DATA</span><h3>Save management</h3></div>
        <p>{saveStatus}</p>
      </div>

      <div className="saveGrid">
        <article>
          <div className="saveIcon"><Download /></div>
          <h4>Export save</h4>
          <p>Create a portable KAGEHAMA code for backup or another device.</p>
          <button className="secondaryButton" onClick={handleExport}>GENERATE SAVE CODE</button>
          {saveCode && (
            <div className="codeBox">
              <textarea readOnly value={saveCode} aria-label="Exported save code" />
              <button onClick={copySaveCode}><Copy size={15} /> COPY</button>
            </div>
          )}
        </article>

        <article>
          <div className="saveIcon"><Upload /></div>
          <h4>Import save</h4>
          <p>Paste a KAGEHAMA1 save code. It is validated before replacing your progress.</p>
          <textarea
            className="importBox"
            value={importCode}
            onChange={(event) => setImportCode(event.target.value)}
            placeholder="KAGEHAMA1-..."
            aria-label="Save code to import"
          />
          <button className="secondaryButton" disabled={!importCode.trim()} onClick={handleImport}>VALIDATE & IMPORT</button>
        </article>

        <article className="dangerCard">
          <div className="saveIcon"><RotateCcw /></div>
          <h4>Reset savegame</h4>
          <p>Return to ¥50,000 and choose a new starter. Export first if you want a way back.</p>
          <button className="dangerButton" onClick={handleReset}>RESET SAVEGAME</button>
        </article>
      </div>
      {error && <div className="gameError">{error}</div>}
    </section>
  );

  if (ownedCar) {
    return (
      <main className="shell">
        <header>
          <div>
            <div className="eyebrow">KAGEHAMA / GARAGE 01</div>
            <h1>KAGEHAMA</h1>
            <p className="subtitle">UNDERGROUND CAR EMPIRE</p>
          </div>
          <div className="playerMeta">
            <div><span>CASH</span><strong>{yen(game.cashYen)}</strong></div>
            <div><span>LEVEL</span><strong>{game.playerLevel}</strong></div>
            <div><span>REP</span><strong>{game.reputation}</strong></div>
          </div>
        </header>

        <section className="garageHero">
          <div>
            <span className="tag">MERCER GARAGE // YOUR FIRST CAR</span>
            <h2>Welcome to<br />Kagehama.</h2>
            <p>You own one car, almost no money, and exactly zero reputation. Perfect.</p>
          </div>
          <div className="garageCar"><CarFront size={120} /></div>
        </section>

        <section className="garagePanel">
          <div className="sectionTitle">
            <div><span>01 / GARAGE</span><h3>{ownedCar.name}</h3></div>
            <p>Vehicle ID: {ownedCar.instanceId.slice(0, 8)}</p>
          </div>

          <div className="garageGrid">
            <article className="vehicleSummary">
              <div className="vehicleBadge">{ownedCar.year} · {ownedCar.drive}</div>
              <h4>{ownedCar.engine}</h4>
              <div className="bigStats">
                <span><b>{ownedCar.hp}</b> PS</span>
                <span><b>{ownedCar.weightKg}</b> KG</span>
                <span><b>{ownedCar.odometerKm.toLocaleString('en-US')}</b> KM</span>
              </div>
            </article>

            <article className="conditionPanel">
              <h4>Vehicle condition</h4>
              <dl>
                <div><dt>Engine</dt><dd>{percent(ownedCar.engineCondition)}</dd></div>
                <div><dt>Body</dt><dd>{percent(ownedCar.bodyCondition)}</dd></div>
                <div><dt>Transmission</dt><dd>{percent(ownedCar.transmissionCondition)}</dd></div>
                <div><dt>Originality</dt><dd>{percent(ownedCar.originality)}</dd></div>
              </dl>
            </article>

            <article className="partsPanel">
              <h4>Installed stock parts</h4>
              <ul>{ownedCar.installedParts.map((part) => <li key={part}>{part}</li>)}</ul>
            </article>
          </div>

          <div className="phaseNotice">PHASE 2 PERSISTENCE ACTIVE · YOUR PROGRESS AUTOSAVES IN THIS BROWSER</div>
        </section>

        {saveTools}
        <nav><span><Warehouse />Garage</span><span><Map />City</span><span><Gauge />Races</span><span><Wrench />Workshop</span></nav>
        <footer>PHASE 2 // PERSISTENCE · PRE-ALPHA</footer>
      </main>
    );
  }

  return (
    <main className="shell">
      <header>
        <div>
          <div className="eyebrow">KAGEHAMA / 01:47 JST</div>
          <h1>KAGEHAMA</h1>
          <p className="subtitle">UNDERGROUND CAR EMPIRE</p>
        </div>
        <div className="cash">STARTING CASH <strong>{yen(game.cashYen)}</strong></div>
      </header>

      <section className="hero">
        <div className="heroCopy">
          <span className="tag">MERCER GARAGE // EAST WARD</span>
          <h2>Everybody starts<br />with a bad decision.</h2>
          <p>Three unwanted cars. Fifty thousand yen. One way into Kagehama's midnight scene.</p>
          <div className="message"><b>UNKNOWN</b><span>Heard you're looking for a ride. Got three cars nobody wants. Midnight. Don't be late.</span></div>
        </div>
        <div className="city"><div className="road">首都高速 • EASTLINE</div></div>
      </section>

      <section className="choice">
        <div className="sectionTitle">
          <div><span>01 / FIRST RIDE</span><h3>Choose your starter</h3></div>
          <p>The other two can appear on the used market later.</p>
        </div>

        <div className="cards">
          {STARTER_CARS.map((car, i) => (
            <button key={car.id} className={`carCard ${selected?.id === car.id ? 'selected' : ''}`} onClick={() => setSelected(car)}>
              <div className="cardTop"><span>0{i + 1}</span><span>{car.archetype}</span></div>
              <div className={`silhouette s${i}`}><CarFront size={78} /></div>
              <h4>{car.name}</h4>
              <div className="year">{car.year} · {car.engine} · {car.drive}</div>
              <p>{car.description}</p>
              <div className="stats"><span><b>{car.hp}</b> PS</span><span><b>{car.weightKg}</b> KG</span><span><b>{car.condition}%</b> COND.</span></div>
              <div className="traits">{car.traits.map((trait) => <span key={trait}>{trait}</span>)}</div>
              <div className="price"><span>{yen(car.priceYen)}</span><small>{yen(game.cashYen - car.priceYen)} REMAINS</small></div>
            </button>
          ))}
        </div>

        {selected && (
          <div className="confirm">
            <div><span>SELECTED</span><strong>{selected.name}</strong><small>This purchase is final for the current run.</small></div>
            <button onClick={confirmStarter}>BUY & ENTER KAGEHAMA <ChevronRight size={18} /></button>
          </div>
        )}
        {error && <div className="gameError">{error}</div>}
      </section>

      {saveTools}
      <nav><span><Warehouse />Garage</span><span><Map />City</span><span><Gauge />Races</span><span><Wrench />Workshop</span></nav>
      <footer>PHASE 2 // PERSISTENCE · PRE-ALPHA</footer>
    </main>
  );
}
