import { useState } from 'react';
import { CarFront, ChevronRight, Gauge, Map, Warehouse, Wrench } from 'lucide-react';
import { STARTER_CARS, type StarterCar } from './data/starters';
import { createNewGameState, purchaseStarter } from './domain/game';
import type { GameState } from './domain/types';

const yen = (n: number) => `¥${n.toLocaleString('en-US')}`;
const percent = (n: number) => `${n}%`;

function createVehicleId() {
  if ('randomUUID' in crypto) return crypto.randomUUID();
  return `vehicle-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function App() {
  const [selected, setSelected] = useState<StarterCar | null>(null);
  const [game, setGame] = useState<GameState>(() => createNewGameState());
  const [error, setError] = useState<string | null>(null);

  const ownedCar = game.ownedVehicles[0] ?? null;

  function confirmStarter() {
    if (!selected) return;
    try {
      setGame((current) => purchaseStarter(current, selected.id, createVehicleId()));
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Starter purchase failed.');
    }
  }

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
            <p>Phase 1 player vehicle instance: {ownedCar.instanceId.slice(0, 8)}</p>
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

          <div className="phaseNotice">PHASE 1 CORE GAME ACTIVE · SAVES ARRIVE IN PHASE 2</div>
        </section>

        <nav><span><Warehouse />Garage</span><span><Map />City</span><span><Gauge />Races</span><span><Wrench />Workshop</span></nav>
        <footer>PHASE 1 // CORE GAME · PRE-ALPHA</footer>
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

      <nav><span><Warehouse />Garage</span><span><Map />City</span><span><Gauge />Races</span><span><Wrench />Workshop</span></nav>
      <footer>PHASE 1 // CORE GAME · PRE-ALPHA</footer>
    </main>
  );
}
